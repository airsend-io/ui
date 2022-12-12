import Vue from 'vue';
import Vuex from 'vuex';

import _ from 'lodash';
import store from 'store';

import router from '../../router';

import { htmlToMarkdown, markdownToHtml } from 'airsend/utils';

import AirSend from 'airsend/client';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    channels: {},
    client: new AirSend()
  },
  mutations: {
    set: (state, { channel, file, content, html, wikiLinks }) => {
      if (!state.channels[channel]) {
        Vue.set(state.channels, channel, {});
      }

      Vue.set(state.channels[channel], file, { content, html });
      Vue.set(state.channels[channel], 'wikiTree', wikiLinks);
    },
    setMarkdown: (state, { channel, file, md }) => {
      if (!state.channels[channel]) {
        Vue.set(state.channels, channel, {});
      }

      Vue.set(state.channels[channel][file], 'md', md);
    }
  },
  actions: {
    async get(context, channelId) {
      await context.dispatch('browse', {
        channelId: channelId,
        file: 'index.md'
      });
    },

    async browse(context, { channelId, file }) {
      // check public hash
      const { hash } = router.history.current.query;

      const channel = this.state.channels.single[channelId];

      if (!channel) return;

      let root = _.find(channel.channel_roots, { type: 'wiki' });

      // get index file
      let response = await context.state.client.getPlain(
        `wiki.get${root.location}/${file}`,
        {},
        {},
        hash ? hash : null
      );

      // get file list
      let wikiLinksResponse = await context.state.client.get(
        'channel.wiki-tree',
        { channel_id: channelId },
        hash ? hash : null
      );
      let wikiLinks = wikiLinksResponse.ok ? wikiLinksResponse.data.tree : [];

      if (response.ok) {
        let content = htmlToMarkdown(response.data);
        let html = markdownToHtml(content, root.location);

        await context.commit('set', {
          channel: channelId,
          file: file,
          content: content,
          html: html,
          wikiLinks
        });
      } else {
        // TODO: Show better UI for that
      }
    },

    async getMarkdown(context, { channelId, file }) {
      const channel = this.state.channels.single[channelId];
      let root = _.find(channel.channel_roots, { type: 'wiki' });

      // get index file
      let response = await context.state.client.getPlain(
        'file.download',
        { fspath: `${root.location}/${file}`, token: store.get('jwt') },
        {},
        false
      );
      if (response.ok) {
        return {
          markdown: response.data,
          location: root.location
        };
      } else {
        // TODO: Show better UI for that
      }
    },

    async update(context, payload) {
      const channel = this.state.channels.single[payload.channel_id];
      const root = _.find(channel.channel_roots, { type: 'wiki' });

      const request = await this.dispatch('files/upload', {
        files: [payload.file],
        path: root.location,
        noToast: true
      });

      if (request.ok) {
        await context.dispatch('browse', {
          channelId: payload.channel_id,
          file: payload.file.name
        });

        this.commit('core/addToast', {
          id: 'wiki.update',
          content: 'Successfully updated wiki.',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return request;
    }
  },
  getters: {
    getFilesInPath: state => path => {
      return state.files[path];
    }
  }
};
