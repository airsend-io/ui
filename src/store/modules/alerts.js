import Vue from 'vue';
import Vuex from 'vuex';

import _ from 'lodash';
import store from 'store';

import AirSend from 'airsend/client';

import router from '../../router';
import { parseMessageContent } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    all: [],
    count: 0,
    client: new AirSend()
  },
  mutations: {
    list: (state, payload) => {
      Vue.set(state, 'all', payload);
    },
    add: (state, alert) => {
      state.all.unshift(alert);
    },

    update: (state, alert) => {
      const index = _.findIndex(state.all, { alert_id: alert.alert_id });

      if (index > -1) {
        Vue.set(state.all, index, alert);
      }
    },

    count: (state, value) => {
      Vue.set(state, 'count', value);
    },
    read: (state, id) => {
      const index = _.findIndex(state.all, { alert_id: id });

      if (index > -1) {
        Vue.set(state.all[index], 'is_read', true);
      }
    }
  },
  actions: {
    // get all alerts
    async list(context) {
      const inMemoryAlerts = store.get('alerts');

      // quickly load channels to memory
      if (inMemoryAlerts && inMemoryAlerts.length > 0) {
        context.dispatch('_list');

        context.commit('list', inMemoryAlerts);

        context.dispatch('updateCounter');
      } else {
        await context.dispatch('_list');
      }
    },

    // request all alerts
    async _list(context) {
      // fetch alerts
      const response = await context.state.client.get('user.alerts');

      store.set('alerts', response.data.alerts);
      context.commit('list', response.data.alerts);
      context.dispatch('updateCounter');
    },

    // get all alerts
    add(context, payload) {
      console.log('[NEW ALERT]', payload);

      const { notify } = context.rootState.core;
      const author = payload.from[0];

      const channel = this.getters['channels/getChannelById'](
        payload.channel_id
      );

      context.commit('add', payload);
      context.dispatch('updateCounter');

      if (channel.muted) return;
      // attach notification
      notify.create({
        title: `${author.display_name} at ${channel.channel_name}`,
        body: parseMessageContent(payload.alert_text, channel, true),
        onClick: function() {
          window.focus();

          // if on a different route, push to correct one
          if (
            router.currentRoute.name !== 'channel' ||
            router.currentRoute.params.id != payload.channel_id
          ) {
            router.push({
              name: 'channel',
              params: {
                id: payload.channel_id,
                target: payload.message_id ? payload.message_id : null
              }
            });

            // else jump to message
          } else if (payload.message_id) {
            EventBus.$emit('jump-to', {
              target: payload.message_id,
              channel: payload.channel_id
            });
          }

          this.close();
        },
        isMeetingActive: this.getters['meeting/isMeetingActive']
      });
    },

    async update(context, payload) {
      console.log('[UPDATED ALERT]', payload);

      context.commit('update', payload);
      context.dispatch('updateCounter');
    },

    async read(context, id) {
      await context.state.client.post('user.alert.ack', { alert_id: id });
      context.commit('read', id);
      context.dispatch('updateCounter');
    },

    updateCounter(context) {
      let unread = context.state.all.filter(item => !item.is_read);
      context.commit('count', unread.length);
    }
  },
  getters: {
    getFilesInPath: state => path => {
      return state.files[path];
    }
  }
};
