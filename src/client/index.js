import axios from 'axios';
import qs from 'query-string';
import Validator from 'fastest-validator';
import store from 'store';
import vueStore from '../../src/store/index.js';
import appInfo from '../../package.json';

import schemas from './schemas';

import { readTextFromBlobAsync } from 'airsend/utils';

class AirSend {
  constructor() {
    this.version = 'v1';
    this.url =
      process.env.NODE_ENV === 'production'
        ? process.env.VUE_APP_ROOT_API
        : '/api'; // default rest url

    this.validator = new Validator({
      messages: {
        stringEmpty: 'general.errors.string-empty',
        required: 'general.errors.required',
        email: 'general.errors.invalid-email',
        stringMin: 'general.errors.string-min'
      }
    });

    this.ws = null;

    // base axios config
    this.config = {
      validateStatus: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Airsend-Client-Version': appInfo.version,
        'X-Airsend-Client-Type': window.isElectron ? 'Electron' : 'Web UI'
      }
    };

    this.store = vueStore;

    this.fullUrl = `${this.url}/${this.version}`;

    this.shouldResync = false;
    this.pingInterval = null;
    this.pingTimeout = null;
  }

  // post info to remote server
  async post(endpoint, data, token, params = {}) {
    // authenticate request
    this.authenticate(token);

    try {
      // validate fields
      const isValid = schemas[endpoint]
        ? this.validator.validate(data, schemas[endpoint])
        : true;

      if (isValid === true) {
        // toggle loader for endpoint
        vueStore.dispatch(
          'loading/set',
          { endpoint: endpoint, status: true },
          { root: true }
        );

        // clone config, so we don't change the global object
        const config = _.cloneDeep(this.config);

        // when recaptcha v2 is required, include it
        if (vueStore.state.core.recaptchaV2Required) {
          // TODO - try/catch
          config.headers['X-ReCaptchaV2-Token'] = grecaptcha.getResponse();
        } else {
          // try to include recaptcha v3 token to the request. If it can't be generated, do nothing
          try {
            const recaptchaV3Key = _.get(
              vueStore,
              'state.core.handshakeSettings.recaptchaV3SiteKey',
              ''
            );
            if (recaptchaV3Key.length > 0) {
              config.headers['X-ReCaptchaV3-Token'] = await grecaptcha.execute(
                recaptchaV3Key,
                {
                  action: endpoint
                }
              );
            }
          } catch (e) {}
        }

        // request to external api
        const response = await axios.post(
          `${this.fullUrl}/${endpoint}`,
          qs.stringify(data),
          { ...config, params: params }
        );

        // if we have a 409 with an captcha error, set the requirement for a v2 captcha on state
        vueStore.commit(
          'core/setReCaptchaV2Required',
          response.status === 409 &&
            response.data.meta.error.toLowerCase().includes('captcha')
        );

        if (response.data && response.data.meta && !response.data.meta.ok) {
          return {
            meta: response.data.meta,
            ok: false,
            unauthorized: response.status === 401,
            error: response.data.meta.error ? response.data.meta.error : false
          };
        }

        if (typeof response.data !== 'object' && response.status !== 204) {
          throw new Error('Unable to connect to service, it could be down');
        }

        return {
          ...response.data.meta,
          ok: true,
          message:
            response.data && response.data.meta
              ? response.data.meta.message
              : null,
          data: response.data
        };
      } else {
        return {
          ok: false,
          error: this.mapErrors(isValid)
        };
      }
    } catch (e) {
      return {
        ok: false,
        unauthorized: e.message === 'Unauthorized',
        error: e.message
      };
    } finally {
      vueStore.dispatch(
        'loading/set',
        { endpoint: endpoint, status: false },
        { root: true }
      ); // stop loading state
    }
  }

  // post info to remote server
  async postMultipart(endpoint, data, params = {}) {
    // authenticate request
    this.authenticate();

    try {
      // validate fields
      const isValid = schemas[endpoint]
        ? this.validator.validate(data, schemas[endpoint])
        : true;

      if (isValid === true) {
        // toggle loader for endpoint
        vueStore.dispatch(
          'loading/set',
          { endpoint: endpoint, status: true },
          { root: true }
        );

        // parse multipart
        let formData = new FormData();

        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });

        const source = axios.CancelToken.source();

        // request to external api
        const response = await axios.post(
          `${this.fullUrl}/${endpoint}`,
          formData,
          {
            ...params,
            cancelToken: source.token,
            onUploadProgress: e => {
              if (params.onUploadProgress) params.onUploadProgress(e, source);
            },
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (!response.data.meta.ok) {
          throw new Error(response.data.meta.error);
        }

        return {
          ok: true,
          data: response.data
        };
      } else {
        return {
          ok: false,
          error: this.mapErrors(isValid)
        };
      }
    } catch (e) {
      return {
        ok: false,
        error: e.message
      };
    } finally {
      vueStore.dispatch(
        'loading/set',
        { endpoint: endpoint, status: false },
        { root: true }
      ); // stop loading state
    }
  }

  // get info from remote server
  async get(endpoint, data, token) {
    // authenticate request
    this.authenticate(typeof token === 'string' ? token : null);

    try {
      // validate fields
      const isValid = schemas[endpoint]
        ? this.validator.validate(data, schemas[endpoint])
        : true;

      if (isValid === true) {
        // toggle loader for endpoint
        vueStore.dispatch(
          'loading/set',
          { endpoint: endpoint, status: true },
          { root: true }
        );

        // request to external api
        const response = await axios.get(
          `${this.fullUrl}/${endpoint}`,
          { params: data, headers: this.config.headers },
          this.config
        );

        return {
          ok: true,
          data: response.data
        };
      } else {
        return {
          ok: false,
          error: this.mapErrors(isValid)
        };
      }
    } catch (e) {
      const meta = e.response && e.response.data ? e.response.data.meta : null;

      return {
        ok: false,
        unauthorized: e.message === 'Unauthorized',
        too_many_requests: e.response && e.response.status === 429,
        retryafter:
          e.response && e.response.headers && e.response.headers.retryafter
            ? parseInt(e.response.headers.retryafter)
            : 0,
        error: meta && meta.error ? meta.error : e.message
      };
    } finally {
      vueStore.dispatch(
        'loading/set',
        { endpoint: endpoint, status: false },
        { root: true }
      ); // stop loading state
    }
  }

  // get plain
  async getPlain(endpoint, data, options, token) {
    // authenticate request
    //this.authenticate((typeof token === "string") ? token : null);
    this.authenticate(token);

    try {
      // validate fields
      const isValid = schemas[endpoint]
        ? this.validator.validate(data, schemas[endpoint])
        : true;

      if (isValid === true) {
        // toggle loader for endpoint
        vueStore.dispatch(
          'loading/set',
          { endpoint: endpoint, status: true },
          { root: true }
        );

        // request to external api
        const response = await axios.get(
          `${this.fullUrl}/${endpoint}`,
          { params: data, ...options },
          this.config
        );

        return {
          ok: true,
          data: response.data
        };
      } else {
        return {
          ok: false,
          error: this.mapErrors(isValid)
        };
      }
    } catch (e) {
      return {
        ok: false,
        error: e.message
      };
    } finally {
      vueStore.dispatch(
        'loading/set',
        { endpoint: endpoint, status: false },
        { root: true }
      ); // stop loading state
    }
  }

  async getBlob(endpoint, params = {}, onDownloadProgress = null) {
    try {
      const source = axios.CancelToken.source();

      this.authenticate(false); //The token is sent in the query string, it will remove from header

      // request to external api
      const response = await axios.request({
        method: 'GET',
        url: `${this.fullUrl}/${endpoint}`,
        responseType: 'blob',
        params,
        onDownloadProgress: e => {
          if (onDownloadProgress) onDownloadProgress(e, source);
        },
        cancelToken: source.token,
        ...this.config
      });

      // if it's a blob
      if (response.status === 200) {
        return {
          ok: true,
          data: response.data,
          headers: response.headers,
          status: response.status
        };
      } else {
        // converts blob to text
        try {
          const responseText = await readTextFromBlobAsync(response.data);
          const responseData = JSON.stringify(responseText);
          console.log('responseData', responseData);
          return {
            ok: false,
            error: responseData.meta.error
          };
        } catch (e) {
          return {
            ok: false,
            error: response.statusText
          };
        }
      }
    } catch (e) {
      return {
        ok: false,
        error: e.message
      };
    }
  }

  disconnect(code = null) {
    clearInterval(this.pingInterval);
    clearTimeout(this.pingTimeout);
    if (this.ws) this.ws.close(code ? code : undefined);
  }

  async connect(rtmInfo) {
    const { user } = vueStore.state.core;

    this.ws = new WebSocket(rtmInfo.ws_endpoint);

    this.ws.onmessage = e => {
      const event = JSON.parse(e.data);

      switch (event.event) {
        case 'chat.userTyping':
          vueStore.commit('channels/handleTyping', event.payload);
          break;
        case 'chat.postMessage':
          vueStore.dispatch('channels/onReceiveMessage', event.payload, {
            root: true
          });
          break;
        case 'chat.deleteMessage':
          vueStore.commit('channels/handleMessageDelete', event.payload, {
            root: true
          });
          break;
        case 'chat.updateMessage':
          vueStore.dispatch('channels/onUpdateMessage', event.payload, {
            root: true
          });
          break;
        case 'channel.create':
          vueStore.dispatch('channels/onChannelCreate', event.payload, {
            root: true
          });
          break;
        case 'channel.update':
          vueStore.dispatch('channels/onChannelUpdate', event.payload, {
            root: true
          });
          break;
        case 'channel.remove':
          vueStore.dispatch('channels/onChannelRemove', event.payload, {
            root: true
          });
          break;
        case 'channel.join.update':
        case 'channel.join.request':
        case 'channel.join.approve':
        case 'channel.join.remove':
          vueStore.dispatch('channels/onChannelPendingMembers', event.payload, {
            root: true
          });
          break;
        case 'user_added.channel':
          event.payload.currentUser = user;
          vueStore.dispatch('channels/onUserAdded', event.payload, { user });
          break;
        case 'user_removed.channel':
          event.payload.currentUser = user;
          vueStore.commit('channels/onUserRemoved', event.payload);
          break;
        case 'chat.unreadCountUpdate':
          vueStore.dispatch('channels/onUnreadCountUpdate', event.payload);
          break;
        case 'fs.update':
          vueStore.dispatch('files/onFileUpdated', event.payload);
          break;
        case 'fs.add':
          vueStore.dispatch('files/onFileAdded', event.payload);
          break;
        case 'fs.delete':
          vueStore.dispatch('files/onFileDeleted', event.payload);
          break;
        case 'action.create':
          vueStore.dispatch('actions/onActionAdded', event.payload);
          break;
        case 'action.update':
          vueStore.dispatch('actions/onActionUpdated', event.payload);
          break;
        case 'action.delete':
          vueStore.dispatch('actions/onActionDeleted', event.payload);
          break;
        case 'action.move':
          vueStore.commit('actions/onActionMoved', event.payload);
          break;
        case 'alert.notification':
          vueStore.dispatch('alerts/add', event.payload);
          break;
        case 'alert.update':
          vueStore.dispatch('alerts/update', event.payload);
          break;
        case 'channel.updateReadStatus':
          vueStore.dispatch('channels/onUpdateReadStatus', event.payload);
          break;
        case 'user.profileUpdate':
        case 'user.offline':
        case 'user.online':
          vueStore.dispatch('channels/onUpdateUser', event.payload);
          break;
        case 'pong':
          this.onPong();
          break;
        default:
          console.log('[UNHANDLED EVENT]', event);
      }
    };

    this.ws.addEventListener('open', e => {
      console.log(
        'Socket connection is now open',
        this.shouldResync,
        new Date().toLocaleString()
      );

      this.pingInterval = setInterval(() => {
        if (this.ws) {
          this.ws.send(
            JSON.stringify({
              command: 'ws_ping'
            })
          );
          // console.log('SENT PING');
          this.pingTimeout = setTimeout(this.onPingTimeout.bind(this), 5000);
        }
      }, 10000);

      // authenticate using JWT
      this.ws.send(
        JSON.stringify({
          command: 'ws_auth',
          auth_token: rtmInfo.ws_token
        })
      );

      vueStore.commit('core/dismissToast', 'ws');

      if (this.shouldResync) {
        vueStore.dispatch('channels/sync', { root: true });
        this.shouldResync = false;
      }
    });

    this.ws.addEventListener('close', e => {
      console.log(
        'Socket connection is now closed',
        this.shouldResync,
        e.code,
        new Date().toLocaleString()
      );

      clearInterval(this.pingInterval);
      clearTimeout(this.pingTimeout);

      if (e.code !== 1005 && this.ws.readyState !== 1) {
        this.reconnect();
      }
    });

    this.ws.addEventListener('error', e => {
      console.log(
        'Socket error',
        this.shouldResync,
        e,
        new Date().toLocaleString()
      );
    });

    // internet connection
    window.addEventListener('online', () => {
      vueStore.commit('core/dismissToast', 'offline');

      console.log('Back Online');
    });

    window.addEventListener('offline', () => {
      vueStore.commit('core/addToast', {
        id: 'offline',
        content: 'Seems like you are offline!',
        contentType: 'text',
        type: 'default',
        close: false
      });

      console.log('You are offline');
    });
  }

  reconnect() {
    vueStore.dispatch('core/rtmConnect', null, { root: true });

    vueStore.commit('core/addToast', {
      id: 'ws',
      content: 'The connection with the server was closed! Reconnecting...',
      contentType: 'text',
      type: 'default',
      close: false
    });

    this.shouldResync = true;
  }

  onPingTimeout() {
    // console.log("PING DID TIMEOUT")
    this.ws.close(3000);
    this.reconnect();
  }

  onPong() {
    clearTimeout(this.pingTimeout);
    // console.log("GOT PONG")
  }

  parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  authenticate(token) {
    if (token === false) {
      delete axios.defaults.headers.common['Authorization'];
      return;
    }

    let jwt = token ? token : store.get('jwt');

    // check if there is a public hash
    if (!jwt && store.get('hash')) {
      jwt = store.get('hash');
    }

    if (jwt) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    }
  }

  clear() {
    delete axios.defaults.headers.common['Authorization'];
  }

  // map validation errors
  mapErrors(errors) {
    let response = {};
    errors.forEach(error => {
      const { actual, expected, field, message } = error;
      response[error.field] = {
        message,
        meta: {
          actual,
          expected,
          field
        }
      };
    });
    return response;
  }
}

export default AirSend;
