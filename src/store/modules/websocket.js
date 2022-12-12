import Vue from 'vue';
import AirSend from 'airsend/client';
import { parseJwt } from 'airsend/utils';
import { v4 as uuid } from 'uuid';

export default {
  namespaced: true,
  state: {
    client: new AirSend(),
    lastRoundTripLatency: 0,
    isReconnecting: false,
    settings: {
      preConnectTimeout: 10000 // timeout for trying to request connection data again
    }
  },
  mutations: {
    set: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key]);
      });
    }
  },
  actions: {
    // request connection details to server
    async preConnect(context) {
      const response = await context.state.client.get('rtm.connect');

      // if all good
      if (response.ok) {
        await context.dispatch('connect', response.data.rtm);

        // if too many requests limit is reached, wait before retrying
      } else if (!response.ok && response.too_many_requests) {
        console.log(
          `[WS] Too many requests, trying again in ${response.retryafter} seconds`
        );

        setTimeout(() => {
          context.dispatch('preConnect');
        }, response.retryafter * 1000);
      } else {
        const refreshResponse = await this.dispatch('core/refreshToken');

        // if it's unauthorized
        if (refreshResponse.unauthorized) {
          console.log('COULDNT REFRESH TOKEN');
          this.dispatch('core/signout');
        } else {
          setTimeout(() => {
            context.dispatch('preConnect');
          }, context.state.settings.preConnectTimeout);
        }
      }
    },

    // connect to realtime layer
    async connect(context, payload) {
      if (context.state.ws && context.state.ws.readyState === 1) {
        console.log(
          '[WS] Tried to connect but already have an active connection'
        );
        return;
      }

      context.commit('set', { ws: new WebSocket(payload.ws_endpoint) });

      context.commit('set', {
        onConnectListener: context.dispatch.bind(this, 'onConnect', payload)
      });
      context.state.ws.addEventListener(
        'open',
        context.state.onConnectListener
      );

      context.commit('set', {
        onMessageListener: context.dispatch.bind(this, 'onMessage')
      });
      context.state.ws.addEventListener(
        'message',
        context.state.onMessageListener
      );

      context.commit('set', {
        onCloseListener: context.dispatch.bind(this, 'onClose')
      });
      context.state.ws.addEventListener('close', context.state.onCloseListener);
    },

    async reconnect(context) {
      if (!context.state.isReconnecting) {
        context.commit('set', {
          isReconnecting: true
        });

        context.state.ws.removeEventListener(
          'open',
          context.state.onConnectListener
        );

        context.state.ws.removeEventListener(
          'close',
          context.state.onCloseListener
        );

        context.state.ws.removeEventListener(
          'message',
          context.state.onMessageListener
        );

        clearInterval(context.state.pingInterval);
        clearInterval(context.state.roundTripInterval);

        context.state.ws.close(3000);

        this.commit('core/addToast', {
          id: 'ws',
          content: 'The connection with the server was closed! Reconnecting...',
          contentType: 'text',
          type: 'default',
          close: false
        });

        context.commit('set', {
          shouldResync: true
        });

        await context.dispatch('preConnect');

        context.commit('set', {
          isReconnecting: false
        });
      } else {
        console.log('[WS] Tried to reconnect while reconnecting');
      }
    },

    async onConnect(context, payload) {
      console.log(`[WS] Connection is now open ${payload.ws_endpoint}`);

      // send auth command
      context.dispatch('send', {
        command: 'ws_auth',
        auth_token: payload.ws_token
      });

      const { finger_print } = parseJwt(payload.ws_token);

      context.commit('set', {
        finger_print,
        rtm_token: payload.ws_token,
        lastRoundTripLatency: 0,
        pingInterval: setInterval(() => {
          if (context.state.ws) {
            // send ping event
            context.dispatch('send', {
              command: 'ws_ping'
            });

            // set ping timeout in case if never responds
            context.dispatch('set', {
              pingTimeout: setTimeout(() => {
                console.log('[WS] Reconnecting due to ping timeout');
                context.dispatch('reconnect');
              }, 5000)
            });
          }
        }, 10000),
        roundTripInterval: setInterval(() => {
          if (context.state.ws) {
            context.state.client.post('system.ping', {
              finger_print: context.state.finger_print,
              ping_token: uuid(),
              last_latency: context.state.lastRoundTripLatency
            });

            // set ping timeout in case if never responds
            context.dispatch('set', {
              lastRoundTripTime: new Date(),
              roundTripTimeout: setTimeout(() => {
                console.log('[WS] Reconnecting due to round trip timeout');
                context.dispatch('reconnect');
              }, 30000)
            });
          }
        }, 60000)
      });

      this.commit('core/dismissToast', 'ws');

      if (context.state.shouldResync) {
        this.dispatch('channels/sync');
        context.state.shouldResync = false;
      }
    },

    onClose(context, e) {
      console.log('[WS] Connection is now closed');
      clearInterval(context.state.pingInterval);
      clearInterval(context.state.roundTripInterval);

      if (e.code !== 1005 && context.state.ws.readyState !== 1) {
        setTimeout(() => {
          context.dispatch('reconnect');
        }, context.state.settings.preConnectTimeout);
      }

      // if it's an actual close
      if (e.code === 1005) {
        context.state.ws.removeEventListener(
          'open',
          context.state.onConnectListener
        );

        context.state.ws.removeEventListener(
          'close',
          context.state.onCloseListener
        );

        context.state.ws.removeEventListener(
          'message',
          context.state.onMessageListener
        );

        clearInterval(context.state.pingInterval);
        clearInterval(context.state.roundTripInterval);
      }
    },

    onPong(context) {
      clearTimeout(context.state.pingTimeout);
    },

    onRoundTripPong(context) {
      // set ping timeout in case if never responds
      context.dispatch('set', {
        lastRoundTripLatency: new Date() - context.state.lastRoundTripTime
      });

      clearTimeout(context.state.roundTripTimeout);
    },

    onMessage(context, payload) {
      const msg = JSON.parse(payload.data);

      const { user } = context.rootState.core;

      switch (msg.event) {
        case 'chat.userTyping':
          this.commit('channels/handleTyping', msg.payload);
          break;
        case 'chat.postMessage':
          this.dispatch('channels/onReceiveMessage', msg.payload);
          break;
        case 'chat.deleteMessage':
          this.commit('channels/handleMessageDelete', msg.payload);
          break;
        case 'chat.updateMessage':
          this.dispatch('channels/onUpdateMessage', {
            ...msg.payload,
            message: { ...msg.payload.message, emitted_on: msg.meta.emitted_on }
          });
          break;
        case 'channel.create':
          this.dispatch('channels/onChannelCreate', msg.payload);
          break;
        case 'channel.update':
          this.dispatch('channels/onChannelUpdate', msg.payload);
          break;
        case 'channel.remove':
          this.dispatch('channels/onChannelRemove', msg.payload);
          break;
        case 'channel.join.update':
        case 'channel.join.request':
        case 'channel.join.approve':
        case 'channel.join.remove':
          this.dispatch('channels/onChannelPendingMembers', msg.payload);
          break;
        case 'user_added.channel':
          msg.payload.currentUser = user;
          this.dispatch('channels/onUserAdded', msg.payload, { user });
          break;
        case 'user_removed.channel':
          msg.payload.currentUser = user;
          this.commit('channels/onUserRemoved', msg.payload);
          break;
        case 'chat.unreadCountUpdate':
          this.dispatch('channels/onUnreadCountUpdate', msg.payload);
          break;
        case 'fs.update':
          this.dispatch('files/onFileUpdated', msg.payload);
          break;
        case 'fs.add':
          this.dispatch('files/onFileAdded', { ...msg.payload, type: 'file' });
          break;
        case 'fs.folder.create':
          this.dispatch('files/onFileAdded', {
            ...msg.payload,
            type: 'folder'
          });
          break;
        case 'fs.copy':
          this.dispatch('files/onFileCopied', msg.payload);
          break;
        case 'fs.delete':
          this.dispatch('files/onFileDeleted', msg.payload);
          break;
        case 'action.create':
          this.dispatch('actions/onActionAdded', msg.payload);
          break;
        case 'action.update':
          this.dispatch('actions/onActionUpdated', msg.payload);
          break;
        case 'action.delete':
          this.dispatch('actions/onActionDeleted', msg.payload);
          break;
        case 'action.move':
          this.commit('actions/onActionMoved', msg.payload);
          break;
        case 'alert.notification':
          this.dispatch('alerts/add', msg.payload);
          break;
        case 'alert.update':
          this.dispatch('alerts/update', msg.payload);
          break;
        case 'channel.updateReadStatus':
          this.dispatch('channels/onUpdateReadStatus', msg.payload);
          break;
        case 'user.profileUpdate':
        case 'user.offline':
        case 'user.online':
          this.dispatch('channels/onUpdateUser', msg.payload);
          break;
        case 'pong':
          context.dispatch('onPong');
          break;
        case 'system.ping':
          context.dispatch('onRoundTripPong');
          break;
        case 'call.invite':
          this.dispatch('meeting/onCallInvite', msg.payload);
          break;
        case 'call.invite.accept':
          this.dispatch('meeting/onCallInviteAccept', msg.payload);
          break;

        // groups related events
        case 'channel.group.create':
          this.dispatch('channels/onGroupCreate', msg.payload);
          break;
        case 'channel.group.delete':
          this.dispatch('channels/onGroupDelete', msg.payload);
          break;
        case 'channel.group.update':
          this.dispatch('channels/onGroupUpdate', msg.payload);
          break;
        case 'channel.group.reorder':
          this.dispatch('channels/onGroupReorder', msg.payload);
          break;

        // teams events
        case 'team.add_member':
          this.dispatch('teams/onMemberAdded', msg.payload);
          break;
        case 'team.remove_member':
          this.dispatch('teams/onMemberRemoved', msg.payload);
          break;
        case 'team.update_member':
          this.dispatch('teams/onMemberUpdated', msg.payload);
          break;
        case 'team.add_channel':
          this.dispatch('teams/onChannelAdded', msg.payload);
          break;
        case 'team.remove_channel':
          this.dispatch('teams/onChannelRemoved', msg.payload);
          break;
        case 'team.updated_channel':
          this.dispatch('teams/onChannelUpdated', msg.payload);
          break;

        case 'team.update':
          this.dispatch('teams/onTeamUpdated', msg.payload);
          break;

        default:
          console.log('[UNHANDLED EVENT]', event);
      }
    },

    send(context, payload) {
      context.state.ws.send(JSON.stringify(payload));
    },

    set(context, payload) {
      context.commit('set', payload);
    }
  }
};
