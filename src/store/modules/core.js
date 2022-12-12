import Vue from 'vue';
import Vuex from 'vuex';
import store from 'store';
import _ from 'lodash';
import moment from 'moment';
import pkg from '../../../package.json';
import router from '../../router';
import qs from 'query-string';

import { parseJwt, protocolCheck } from 'airsend/utils';
import { ChannelRoles, TeamRoles } from 'airsend/constants';

import AirSend from 'airsend/client';
import Notify from 'airsend/notify';
const isElectron = window.isElectron;

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    ready: false,
    title: 'AirSend',
    formattedTitle: 'AirSend',
    isMobile: false,
    useTeams: true,
    websocket: {
      status: true,
      error: null
    },
    toasts: [
      /*
      {
        id: "test",
        content: "This is a sample toast",
        contentType: "text",
        type: "primary",
        close: true
      }
      */
    ],
    sidebarToasts: [],
    notify: new Notify(),
    client: new AirSend(),
    user: {},
    results: { meta: { fetch_ts: 0 }, data: {} },
    allResults: { meta: { fetch_ts: 0 }, data: {} },
    oauth: {
      clients: []
    },
    recaptchaV2Required: false,
    handshakeSettings: {},
    preferredColorSchema: store.get('color-schema'),
    isDarkMode: false,
    isSpotlightVisible: false,
    authenticatingThroughApp: false,
    userPreferences: {
      listing: {}
    }
  },
  mutations: {
    set: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key]);
      });
    },
    setUserPreference: (state, { key, value }) => {
      _.set(state.userPreferences, key, value);
    },
    updateUser: (state, payload) => {
      Vue.set(state, 'user', {
        ...payload,
        token: store.get('jwt')
      });
    },
    updateToken: (state, token) => {
      Vue.set(state, 'user', {
        ...state.user,
        token
      });
    },
    ready: state => {
      Vue.set(state, 'ready', true);
    },
    results: (state, payload) => {
      Vue.set(state, 'results', payload);
    },
    allResults: (state, payload) => {
      Vue.set(state, 'allResults', payload);
    },
    websocket: (state, payload) => {
      Vue.set(state, 'websocket', payload);
    },
    contactForm: (state, payload) => {
      Vue.set(state, 'contactForm', payload);
    },
    addToast: (state, payload) => {
      const index = _.findIndex(
        payload.sidebar ? state.sidebarToasts : state.toasts,
        { id: payload.id }
      );

      if (index > -1) {
        console.log('[TOAST PREVENTED]');
        return;
      }

      state[payload.sidebar ? 'sidebarToasts' : 'toasts'].push(payload);

      // automatically remove with timeout
      if (payload.timeout) {
        setTimeout(() => {
          const index = _.findIndex(
            payload.sidebar ? state.sidebarToasts : state.toasts,
            { id: payload.id }
          );
          Vue.delete(
            payload.sidebar ? state.sidebarToasts : state.toasts,
            index
          );
        }, payload.timeout);
      }
    },
    dismissToast: (state, id) => {
      const index = _.findIndex(state.toasts, { id });
      Vue.delete(state.toasts, index);
    },
    dismissSidebarToast: (state, id) => {
      const index = _.findIndex(state.sidebarToasts, { id });
      Vue.delete(state.sidebarToasts, index);
    },
    clearToasts: state => {
      Vue.set(state, 'toasts', []);
    },
    clearSidebarToasts: state => {
      Vue.set(state, 'sidebarToasts', []);
    },
    setOauthClients: (state, payload) => {
      Vue.set(state.oauth, 'clients', payload);
    },
    setTitle: (state, { title, count }) => {
      Vue.set(state, 'title', title);
      Vue.set(
        state,
        'formattedTitle',
        count > 0 ? `(${count > 99 ? '99+' : count}) ${title}` : title
      );
      if (isElectron) {
        window.ipcRenderer.send('update-badge', count);
      }
    },
    setBadge: (state, payload) => {
      Vue.set(
        state,
        'formattedTitle',
        payload > 0
          ? `(${payload > 99 ? '99+' : payload}) ${state.title}`
          : state.title
      );
      if (isElectron) {
        window.ipcRenderer.send('update-badge', payload);
      }
    },
    setReCaptchaV2Required: (state, value) => {
      Vue.set(state, 'recaptchaV2Required', value);
    },
    setHandshakeSettings: (state, payload) => {
      Vue.set(state, 'handshakeSettings', payload);
    },
    changeColorSchema: (state, { preferred, preventLocalStore }) => {
      if (!preventLocalStore) state.preferredColorSchema = preferred;
      state.isDarkMode =
        preferred === 'dark' ||
        (!preferred &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (state.isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  },
  actions: {
    async checkForUpdate(context) {
      try {
        if (process.env.NODE_ENV === 'development') return;

        const versionData = await fetch(`/version.json?v=${moment().unix()}`);
        const { version } = await versionData.json();

        if (version !== pkg.version) {
          context.commit('addToast', {
            close: true,
            isUpdate: true,
            content:
              'A new update for AirSend is available. Please refresh to upgrade.',
            contentType: 'text',
            id: 'update.restartMessage',
            type: 'primary',
            actionText: 'Refresh now'
          });
        }
      } catch (e) {
        console.log('Failed to get latest', e);
      }
    },

    setTitle(context, payload) {
      context.commit('setTitle', {
        title: payload,
        count: this.getters['channels/getUnreadCount']
      });
    },

    changeColorSchema(context, preventLocalStore = false) {
      const { preferredColorSchema } = context.state;
      let newPreferredColorScheme = null;

      switch (preferredColorSchema) {
        case 'dark':
          newPreferredColorScheme = 'light';
          break;
        case 'light':
          newPreferredColorScheme = null;
          break;
        default:
          newPreferredColorScheme = 'dark';
      }

      if (!preventLocalStore) {
        console.log('SETTING COLOR SCHEMA', newPreferredColorScheme);
        store.set('color-schema', newPreferredColorScheme);
      }

      context.commit('changeColorSchema', {
        preferred: newPreferredColorScheme
      });

      if (window.ipcRenderer) {
        window.ipcRenderer.send('theme', {
          theme: newPreferredColorScheme ? newPreferredColorScheme : 'system'
        });
      }
    },

    colorSchema(context) {
      const preferredColorSchema = store.get('color-schema');

      if (window.ipcRenderer) {
        window.ipcRenderer.send('theme', {
          theme: 'dark'
        });
      }

      if (preferredColorSchema) {
        context.commit('changeColorSchema', {
          preferred: preferredColorSchema
        });

        if (window.ipcRenderer) {
          window.ipcRenderer.send('theme', {
            theme: preferredColorSchema ? preferredColorSchema : 'system'
          });
        }
      } else if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        context.commit('changeColorSchema', { preferred: 'dark' });
        if (window.ipcRenderer) {
          window.ipcRenderer.send('theme', { theme: 'dark' });
        }
      }

      if (
        window.matchMedia &&
        typeof window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener === 'function'
      ) {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', e => {
            // check if it's automatic mode
            if (!store.get('color-schema')) {
              const newColorScheme = e.matches ? 'dark' : 'light';
              context.commit('changeColorSchema', {
                preferred: newColorScheme,
                preventLocalStore: true
              });
              if (window.ipcRenderer) {
                window.ipcRenderer.send('theme', {
                  theme: newColorScheme ? newColorScheme : 'system'
                });
              }
            }
          });
      }
    },

    setUserPreference(context, payload) {
      // TODO: send user preferences to API
      const key = Object.keys(payload)[0];

      // set in store
      store.set(key, payload[key]);

      context.commit('setUserPreference', { key, value: payload[key] });
    },

    getUserPreferences(context, payload) {
      //TODO: fetch user preferences from API

      // legacy support
      if (typeof store.get('settings.showCategories') !== 'undefined') {
        store.set('listing.showGroups', store.get('settings.showCategories'));
        store.remove('settings.showCategories');
      }

      // legacy support
      if (typeof store.get('airsendLS__filterBy') !== 'undefined') {
        store.set('listing.filterBy', store.get('airsendLS__filterBy'));
        store.remove('airsendLS__filterBy');
      }

      // legacy support
      if (typeof store.get('airsendLS__sortBy') !== 'undefined') {
        store.set('listing.sortBy', store.get('airsendLS__sortBy'));
        store.remove('airsendLS__sortBy');
      }

      let _userPreferences = {
        listing: {
          showGroups: !!store.get('listing.showGroups'),
          filterBy: store.get('listing.filterBy')
            ? store.get('listing.filterBy')
            : 'active',
          sortBy: [
            'is_favorite-desc',
            store.get('listing.sortBy')
              ? store.get('listing.sortBy')
              : 'last_active_on_ts-desc'
          ],
          teams: store.get('listing.teams') ? store.get('listing.teams') : []
        }
      };

      if (
        _userPreferences.listing.sortBy[1] === 'last_active_on_ts-asc' ||
        _userPreferences.listing.sortBy[1] === 'created_on_ts-asc'
      ) {
        _userPreferences.listing.sortBy[1] = 'last_active_on_ts-desc';
      }

      context.commit('set', { userPreferences: _userPreferences });
    },

    // authenticate user
    async authenticate(context) {
      // ask for notifications permisions
      context.state.notify.push.Permission.request();

      // init workers and meeting
      this.dispatch('workers/init');
      this.dispatch('meeting/init');

      if (window.gapi) {
        window.gapi.load('auth2');
      }

      // check if page has public hash
      const { query, meta } = router.history.current;
      const { hash } = query;

      if (store.get('jwt')) {
        // fetch current user data
        let userInfo = await context.state.client.get('user.info', {});
        let read_only = parseJwt(store.get('jwt')) === null;

        if (userInfo.ok) {
          // check if page has other token
          const { token } = router.history.current.query;

          // check if user from read-only is same as current
          if (token) {
            try {
              const tokenUserInfo = await context.state.client.get(
                'user.info',
                {},
                token
              );

              // if it's other user, switch to the other user
              if (
                tokenUserInfo.data &&
                tokenUserInfo.data.user &&
                userInfo.data.user.id !== tokenUserInfo.data.user.id
              ) {
                userInfo = tokenUserInfo;
                read_only = true;
                store.set('jwt', token);
              }
            } catch (e) {
              return true;
            }
          }

          context.dispatch('updateUser', {
            ...userInfo.data.user,
            read_only
          });

          if (!read_only) {
            context.dispatch('getUserPreferences'); // get channel list
            await this.dispatch('channels/list'); // get channel list
            await this.dispatch('teams/list'); //get teams list
            await this.dispatch('channels/groupsList'); // get groups list
            await this.dispatch('alerts/list'); // get alerts list
            await this.dispatch('websocket/preConnect'); // connect to ws
          }

          // force users to stay on channel if it's readonly
          if (read_only && router.history.current.meta.authenticated) {
            context.dispatch('signout');
            context.commit('ready');
          }

          // if user is in a unauthenticated only page
          if (router.history.current.meta.unauthenticated) {
            router.push('/', () => context.commit('ready'));
          } else {
            context.commit('ready');
          }
        } else {
          // fetch user data
          const refreshResponse = await context.dispatch('refreshToken');

          // if it's unauthorized
          if (refreshResponse.unauthorized) {
            console.log('COULDNT REFRESH TOKEN');
            context.dispatch(
              'signout',
              !router.history.current.meta.authenticated
            );
          } else {
            setTimeout(() => {
              context.dispatch('authenticate'); // get channel list
            }, 2000);
          }
        }

        // if no jwt in memory
      } else {
        // if there is a login request via params
        if (
          router.history.current.query &&
          router.history.current.query.token
        ) {
          const { token, email } = router.history.current.query;

          if (email) store.set('email', email);
          if (
            router.history.current.name === 'channel' ||
            router.history.current.name === 'channel-sub'
          )
            store.set('channel', router.history.current.params.id);

          store.set('jwt', token);

          context.dispatch('authenticate');

          return;
        }

        // if in a page that supports unauthenticated
        if (
          !router.history.current.meta.authenticated &&
          (!router.history.current.meta.requiresHash ||
            router.history.current.query.hash)
        ) {
          // allow public hash based guests
          if (
            router.history.current.query &&
            router.history.current.query.hash
          ) {
            store.set('hash', hash);
          }

          // all good
          context.commit('ready');
        } else {
          // router.push('/login');
          context.commit('ready');
        }
      }
    },

    updateUser(context, user) {
      context.commit('updateUser', user);

      // send to worker
      this.state.workers.channels.postMessage({
        type: 'setUser',
        data: user
      });
    },

    async publicAuthenticate(context) {
      const { hash } = router.history.current.query;

      context.dispatch('updateUser', {
        id: 0,
        display_name: 'Guest',
        is_guest: true,
        read_only: false,
        img_cache: 0
      });

      console.log('AUTHENTICATED');

      context.commit('ready');
    },

    // connect to realtime layer
    async refreshToken(context) {
      // fetch user data
      const response = await context.state.client.post(
        'user.login.refresh',
        null
      );

      if (response.ok) {
        store.set('jwt', response.data.token);
        context.commit('updateToken', response.data.token);
      }

      return response;
    },

    // send event to realtime layer
    sendEvent(context, payload) {
      if (context.state.client.ws) {
        context.state.client.ws.send(JSON.stringify(payload));
      }
    },

    async updateProfile(context, payload) {
      // has avatar
      if (payload.avatar) {
        const profileImageResponse = await context.state.client.postMultipart(
          'user.image.set',
          {
            file: payload.avatar
          }
        );

        if (profileImageResponse.ok) {
          context.dispatch('updateUser', {
            ...context.state.user,
            has_avatar: true,
            img_cache: context.state.user.img_cache + 1
          });

          // TODO: Show toast
        } else {
          return response;
        }
      }

      if (payload.name || payload.phone) {
        const response = await context.state.client.post('user.profile.set', {
          name: payload.name,
          phone: payload.phone
        });

        if (response.ok) {
          context.dispatch('updateUser', response.data.user);
        } else {
          return response;
        }
      }

      if (payload.name || payload.phone || payload.avatar) {
        context.commit('addToast', {
          id: 'updateProfile',
          content: 'Successfully updated your profile',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return { ok: true };
    },

    async getContactForm(context, payload) {
      const response = await context.state.client.get('contact_form.list');
      if (response.ok && response.data.forms.length) {
        let form = response.data.forms[0];
        context.commit('contactForm', form);
      }
    },

    async createContactForm(context, payload) {
      let response = await context.state.client.post('contact_form.create', {
        form_title: 'Contact Form',
        confirmation_message:
          'Thank you, we recieved your message. We will get back to you shortly'
      });
      console.log(response);
      if (response.ok) {
        context.commit('contactForm', response.data.contact_form);
      }
    },
    async updateContactForm(context, payload) {
      await context.state.client.post('contact_form.update', payload);
    },
    async deleteContactForm(context, payload) {
      const response = await context.state.client.post(
        'contact_form.delete',
        payload
      );
      context.commit('contactForm', {});
    },

    async login(context, payload) {
      const response = await context.state.client.post('user.login', payload);

      // successful login
      if (response.ok) {
        const { token } = response.data;

        store.set('email', payload.email);
        store.set('jwt', token);

        // fetch user data
        const userInfo = await context.state.client.get('user.info', {
          email: payload.email
        });

        context.dispatch('updateUser', {
          ...userInfo.data.user,
          img_cache: 0
        });

        // ask for notifications permisions
        context.state.notify.push.Permission.request();

        context.commit('clearToasts'); // clear error toasts
        context.dispatch('getUserPreferences'); // get preferences
        this.dispatch('channels/list'); // get channel list
        this.dispatch('teams/list'); //get teams list
        this.dispatch('channels/groupsList'); // get groups list
        this.dispatch('alerts/list'); // get alerts list
        this.dispatch('websocket/preConnect'); // connect to ws

        // if user is in prohibited pages
        if (
          router.history.current.name === 'login' ||
          router.history.current.name === 'signup' ||
          router.history.current.name === 'recover' ||
          router.history.current.name === 'password-reset' ||
          router.history.current.name === 'user-verify'
        ) {
          router.push('/');
        }
      } else {
        // TODO: HANDLE INVALID / ERROR ATTEMP
      }

      return response;
    },
    async loginWithEmailAndToken(context, { jwt, email }) {
      if (context.state.user && context.state.user.id) {
        await context.dispatch('signout');
      }

      store.set('email', email);
      store.set('jwt', jwt);

      // fetch user data
      const userInfo = await context.state.client.get('user.info', {
        email
      });

      context.dispatch('updateUser', {
        ...userInfo.data.user,
        img_cache: 0
      });

      // ask for notifications permisions
      context.state.notify.push.Permission.request();

      context.commit('clearToasts'); // clear error toasts
      this.dispatch('channels/list'); // get channel list
      this.dispatch('teams/list'); //get teams list
      this.dispatch('channels/groupsList'); // get groups list
      this.dispatch('alerts/list'); // get alerts list
      this.dispatch('websocket/preConnect'); // connect to ws

      // if user is in prohibited pages
      if (
        router.history.current.name === 'login' ||
        router.history.current.name === 'signup' ||
        router.history.current.name === 'recover' ||
        router.history.current.name === 'password-reset' ||
        router.history.current.name === 'user-verify'
      ) {
        router.push('/');
      }
      return userInfo;
    },

    async openAppWithToken(context) {
      const authentication = {
        jwt: store.get('jwt'),
        email: store.get('email')
      };

      const response = await protocolCheck(
        `airsend://live.airsend.io/oauth/apple?${qs.stringify(authentication)}`
      );

      if (!response.ok) {
        context.commit('addToast', {
          id: 'protocolNotFound',
          content: 'Failed to open the app',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 5000
        });
      }

      return response;
    },

    async googleOauth(context, payload) {
      const response = await context.state.client.post(
        'oauth.google',
        payload,
        false
      );

      // successful login
      if (response.ok) {
        const { token, user, account_created } = response.data;

        store.set('email', user.email);
        store.set('jwt', token);

        context.dispatch('updateUser', {
          ...user,
          img_cache: 0
        });

        // ask for notifications permisions
        context.state.notify.push.Permission.request();

        this.dispatch('channels/list'); // get channel list
        this.dispatch('teams/list'); //get teams list
        this.dispatch('channels/groupsList'); // get groups list
        this.dispatch('alerts/list'); // get alerts list
        this.dispatch('websocket/preConnect'); // connect to ws

        // if user is in prohibited pages
        if (
          router.history.current.name === 'login' ||
          router.history.current.name === 'signup' ||
          router.history.current.name === 'recover' ||
          router.history.current.name === 'password-reset' ||
          router.history.current.name === 'user-verify'
        ) {
          router.push('/');
        }
      } else {
        // TODO: HANDLE INVALID / ERROR ATTEMP
      }

      return response;
    },

    async appleOauth(context, payload) {
      const response = await context.state.client.post(
        'oauth.apple',
        payload,
        false
      );

      // successful login
      if (response.ok) {
        const { token } = response.data;
        const { user } = response.data;

        store.set('email', user.email);
        store.set('jwt', token);

        context.dispatch('updateUser', {
          ...user,
          img_cache: 0
        });

        // ask for notifications permisions
        context.state.notify.push.Permission.request();

        this.dispatch('channels/list'); // get channel list
        this.dispatch('teams/list'); //get teams list
        this.dispatch('channels/groupsList'); // get groups list
        this.dispatch('alerts/list'); // get alerts list
        this.dispatch('websocket/preConnect'); // connect to ws

        // if user is in prohibited pages
        if (
          router.history.current.name === 'login' ||
          router.history.current.name === 'signup' ||
          router.history.current.name === 'recover' ||
          router.history.current.name === 'password-reset' ||
          router.history.current.name === 'user-verify'
        ) {
          router.push('/');
        }
      } else {
        // TODO: HANDLE INVALID / ERROR ATTEMP
      }

      return response;
    },

    async finalize(context, payload) {
      const response = await context.state.client.post(
        'user.finalize',
        payload
      );

      // successful login
      if (response.ok) {
        await context.dispatch('login', { ...payload, email: payload.user });
      } else {
        // TODO: HANDLE INVALID / ERROR ATTEMP
      }

      return response;
    },

    async deleteAccount(context, payload) {
      const response = await context.state.client.post('user.delete', payload);

      if (response.ok) {
        context.dispatch('signout');
      }

      return response;
    },

    async updatePassword(context, payload) {
      const response = await context.state.client.post(
        'password.update',
        payload
      );

      if (response.ok) {
        context.commit('addToast', {
          id: 'updatePassword',
          content: 'Successfully updated your password',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async signup(context, payload) {
      const response = await context.state.client.post('user.create', payload);

      if (response.ok) {

        const { meta } = response.data;

        if (meta && meta.force_login) {
          await context.dispatch('login', { ...payload });
        }
      }

      return response;
    },

    async recover(context, payload) {
      return await context.state.client.post('password.recover', payload);
    },

    async resetPassword(context, payload) {
      return await context.state.client.post('password.reset', payload);
    },

    async refreshVerificationCode(context, payload) {
      return await context.state.client.post('user.verify.refresh', payload);
    },

    async verifyAccount(context, payload) {
      const { query } = router.history.current;

      const response = await context.state.client.post('user.verify', payload);

      if (response.ok) {

        const { token } = response.data;
        const { user } = response.data;

        store.set('email', user.email);
        store.set('jwt', token);

        context.dispatch('updateUser', {
          ...user,
          img_cache: 0
        });

        // ask for notifications permisions
        context.state.notify.push.Permission.request();

        this.dispatch('channels/list'); // get channel list
        this.dispatch('teams/list'); //get teams list
        this.dispatch('channels/groupsList'); // get groups list
        this.dispatch('alerts/list'); // get alerts list
        this.dispatch('websocket/preConnect'); // connect to ws

        // if user is in prohibited pages
        if (
          router.history.current.name === 'login' ||
          router.history.current.name === 'signup' ||
          router.history.current.name === 'recover' ||
          router.history.current.name === 'password-reset' ||
          router.history.current.name === 'user-verify'
        ) {
          // redirect to channel if necessary
          if (query.public_channel_id && query.public_channel_hash) {
            router.push(
              `/channel/${query.public_channel_id}/${query.public_channel_hash}`
            );
          } else {
            router.push('/');
          }
        }
      }

      return response;
    },

    async notifications(context, payload) {
      const response = await context.state.client.post(
        'user.notifications.manage',
        payload
      );

      if (response.ok) {
        context.commit('addToast', {
          id: 'notifications',
          content: 'Successfully updated your notification settings',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async report(context, payload) {
      return await context.state.client.post(
        'user.notifications.report',
        payload
      );
    },

    // removes local storage entries and redirect to login page
    async signout(context, noHistory = false) {
      await context.state.client.post('user.logout');
      await context.state.client.clear();

      if (context.rootState.websocket.ws) {
        context.rootState.websocket.ws.close();
      }

      context.commit('teams/resetState', null, { root: true });

      // remove local storage entries
      const colorSchema = store.get('color-schema');
      const expandedGroups = store.get('expandedGroups');
      const sortBy = store.get('airsendLS__sortBy');
      const filterBy = store.get('airsendLS__filterBy');

      store.clearAll();

      store.set('color-schema', colorSchema);
      store.set('expandedGroups', expandedGroups);
      store.set('airsendLS__sortBy', sortBy);
      store.set('airsendLS__filterBy', filterBy);

      // reset user
      context.dispatch('updateUser', {});
      this.dispatch('channels/clear');
      context.commit('clearToasts');

      // push user to login
      if (!noHistory) {
        router.push('/login');
      }

      context.commit('ready');

      return true;
    },

    async search(context, payload) {
      const fetch_ts = Date.now();
      const response = await context.state.client.get('search.query', payload);
      const { results } = response.data;

      if (response.ok) {
        let output = {};

        if (!payload.channel) {
          const channels = _.filter(results, { type: 'channel' });
          if (channels.length > 0) output.channels = channels;
        }

        const messages = _.filter(results, { type: 'message' });
        if (messages.length > 0) output.messages = messages;

        const actions = _.filter(results, { type: 'action' });
        if (actions.length > 0) output.actions = actions;

        const users = _.filter(results, { type: 'user' });
        if (users.length > 0) output.users = users;

        const files = _.filter(results, { type: 'file' });
        if (files.length > 0) output.files = files;

        if (payload.limit) {
          if (
            context.state.allResults.meta &&
            context.state.allResults.meta.fetch_ts <= fetch_ts
          )
            context.commit('allResults', { data: output, meta: { fetch_ts } });
        } else {
          if (
            context.state.results.meta &&
            context.state.results.meta.fetch_ts <= fetch_ts
          )
            context.commit('results', { data: output, meta: { fetch_ts } });
        }
      } else {
        // TODO: throw toast??
      }
    },

    async getSystemInfo(context) {
      const response = await context.state.client.get('system.info');
      return response;
    },

    // oAUTH
    async createOauthClient(context, payload) {
      return await context.state.client.post(
        'oauth.server.client.create',
        payload
      );
    },

    // oAUTH
    async getOauthAutorizationInfo(context, payload) {
      return await context.state.client.get('oauth.server.authorize', payload);
    },

    // oAUTH
    async approveOauth(context, payload) {
      return await context.state.client.post('oauth.server.approve', payload);
    },

    async getOauthClients(context) {
      const response = await context.state.client.get(
        'oauth.server.client.list'
      );

      if (response.ok) {
        context.commit('setOauthClients', response.data.clients);
      }

      return true;
    },
    async handshake(context) {
      const response = await context.state.client.get('handshake');
      if (response.ok) {
        context.commit('setHandshakeSettings', response.data.settings);
      }
    },

    // From electron
    async appUpdatesCompleted(context, payload) {
      context.commit('addToast', payload);
    }
  },
  getters: {
    getUserPreferences: state => {
      return state.userPreferences;
    },
    getUser: (state, getters, rootState) => (channelId, teamId, _channel) => {
      let channel = {};
      let member = {};

      let team = {};
      let teamMember = {};

      if (_channel) channel = _channel;

      if (channelId) {
        if (rootState.channels.single[channelId]) {
          channel = rootState.channels.single[channelId];
        } else {
          channel = _.find(rootState.channels.all, { id: channelId });
        }
      }
      if (channel) {
        member = _.find(channel.members, { id: state.user.id });
      }

      if (teamId) {
        if (rootState.teams.single[teamId]) {
          team = rootState.teams.single[teamId];
        } else {
          team = _.find(rootState.teams.all, { id: teamId });
        }

        teamMember = { user_role: team && team.role_id ? team.role_id : false };
      }

      let user = {
        ...state.user,
        role:
          member && member.user_role && !state.user.read_only
            ? ChannelRoles[member.user_role]
            : {
                can: () => false
              },
        teamRole:
          teamMember && teamMember.user_role && !state.user.read_only
            ? TeamRoles[teamMember.user_role]
            : {
                can: () => false
              }
      };
      return user;
    }
  }
};
