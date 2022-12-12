import Vue from 'vue';
import Vuex from 'vuex';
import moment from 'moment';
import _ from 'lodash';
import store from 'store';
import { v4 as uuid } from 'uuid';

import router from '../../router';

import {
  parseMessages,
  parseMessagesHierarchy,
  parseMessageContent
} from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

import AirSend from 'airsend/client';

Vue.use(Vuex);

const initialState = {
  all: null,
  sorted: {},
  single: {},
  client: new AirSend(),
  readStatus: {},
  isEmpty: false,
  groups: [],
  sentIds: [], // sent messages id
  observableMessages: {}, //Messages that appear on actions.info, and need to be updated when receive messageUpdate. {messageId:message}
  expandedGroupsIds: {},
  collapsedGroupsBellowViewport: {},
  channelsBellowViewport: {},
  unreadMessagesBellowViewport: 0,
  userPreferences: {},
  inMemoryChannels: [] // array for controlling in memory channels
};

export default {
  namespaced: true,
  state: initialState,
  mutations: {
    set: (state, { key, value }) => {
      Vue.set(state, key, value);
    },
    list: (state, payload) => {
      if (payload.length === 0) {
        state.isEmpty = true;
      }
      Vue.set(state, 'all', payload);
    },
    sorted: (state, { id, list }) => {
      Vue.set(state.sorted, id, list);
    },

    setCollapsedGroupsBellowViewport: (state, payload) => {
      let { group_id, isBellowViewport, unreadCount } = payload;
      let _unreadCount = state.unreadMessagesBellowViewport;
      if (isBellowViewport) {
        let alreadyBellowViewport =
          state.collapsedGroupsBellowViewport[group_id];
        if (!alreadyBellowViewport) {
          _unreadCount += parseInt(unreadCount);
          //console.log(`${group_id} is adding ${payload.unreadCount} to ${state.unreadMessagesBellowViewport}. Total of ${_unreadCount}`)
          Vue.set(state.collapsedGroupsBellowViewport, group_id, unreadCount);
        } else {
          //already in the viewport, trigged again
          let previousUnreadCount =
            state.collapsedGroupsBellowViewport[group_id];
          _unreadCount -= previousUnreadCount;
          _unreadCount += parseInt(unreadCount);
          Vue.set(state.collapsedGroupsBellowViewport, group_id, unreadCount);
        }
      } else {
        let wasBellowViewport = state.collapsedGroupsBellowViewport[group_id];
        if (wasBellowViewport) {
          let _unreadCountRemoved =
            state.collapsedGroupsBellowViewport[group_id];
          _unreadCount -= parseInt(_unreadCountRemoved);
          //console.log(`${group_id} is removing ${_unreadCountRemoved} from ${state.unreadMessagesBellowViewport}. Total of ${_unreadCount}`)
          Vue.delete(state.collapsedGroupsBellowViewport, group_id);
        }
      }
      Vue.set(state, 'unreadMessagesBellowViewport', _unreadCount);
    },

    setChannelsBellowViewport: (state, payload) => {
      let { channel_id, isBellowViewport, unreadCount } = payload;
      let _unreadCount = state.unreadMessagesBellowViewport;
      if (isBellowViewport) {
        let alreadyBellowViewport = state.channelsBellowViewport[channel_id];
        if (!alreadyBellowViewport) {
          _unreadCount += parseInt(unreadCount);
          //console.log(`${channel_id} is adding ${payload.unreadCount} to ${state.unreadMessagesBellowViewport}. Total of ${_unreadCount}`)
          Vue.set(state.channelsBellowViewport, channel_id, unreadCount);
        } else {
          //already in the viewport, trigged again
          let previousUnreadCount = state.channelsBellowViewport[channel_id];
          _unreadCount -= previousUnreadCount;
          _unreadCount += unreadCount;
          Vue.set(state.channelsBellowViewport, channel_id, unreadCount);
        }
      } else {
        let wasBellowViewport = state.channelsBellowViewport[channel_id];
        if (wasBellowViewport) {
          let _unreadCountRemoved = state.channelsBellowViewport[channel_id];
          _unreadCount -= parseInt(_unreadCountRemoved);
          //console.log(`${channel_id} is removing ${_unreadCountRemoved} from ${state.unreadMessagesBellowViewport}. Total of ${_unreadCount}`)
          Vue.delete(state.channelsBellowViewport, channel_id);
        }
      }
      Vue.set(state, 'unreadMessagesBellowViewport', _unreadCount);
    },

    updateUnreadMessagesBellowViewport: (state, payload) => {
      let { channel_id, group_id, type } = payload;

      if (type === '+') {
        if (channel_id) {
          if (state.channelsBellowViewport[channel_id] === undefined) return;
          let unreadCount = state.unreadMessagesBellowViewport;
          let unreadCountChannel =
            parseInt(state.channelsBellowViewport[channel_id]) || 0; //0 in case of first unread message of the channel

          Vue.set(
            state.channelsBellowViewport,
            channel_id,
            unreadCountChannel + 1
          );
          Vue.set(state, 'unreadMessagesBellowViewport', unreadCount + 1);
        } else if (group_id) {
          if (state.collapsedGroupsBellowViewport[group_id] === undefined)
            return;
          let unreadCount = state.unreadMessagesBellowViewport;
          let unreadCountGroup =
            parseInt(state.collapsedGroupsBellowViewport[group_id]) || 0;
          //console.log("Event + is adding 1 message to" + unreadCountGroup + ". Total of " + (unreadCount+1));

          Vue.set(
            state.collapsedGroupsBellowViewport,
            group_id,
            unreadCountGroup + 1
          );
          Vue.set(state, 'unreadMessagesBellowViewport', unreadCount + 1);
        } else {
          console.log('unhandled update message count');
        }
        return;
      } else if (type === 'all') {
        if (channel_id) {
          let unreadCount = state.unreadMessagesBellowViewport;
          let channelIndex = _.findIndex(state.all, { id: channel_id });
          if (channelIndex === -1) return;

          //console.log("event ALL is removing " + state.channelsBellowViewport[channel_id] + " from " + unreadCount);
          unreadCount -= state.channelsBellowViewport[channel_id] || 0;
          Vue.delete(state.channelsBellowViewport, channel_id);
          Vue.set(state, 'unreadMessagesBellowViewport', unreadCount);
        } else {
          console.log('unhandled unread message count decrease');
        }
        return;
      } else if (type === 'remove_group') {
        if (!group_id) return;
        let unreadCount = state.unreadMessagesBellowViewport;
        let unreadCountGroup =
          state.collapsedGroupsBellowViewport[group_id] || 0;
        Vue.delete(state.collapsedGroupsBellowViewport, group_id);
        Vue.set(
          state,
          'unreadMessagesBellowViewport',
          unreadCount - unreadCountGroup
        );
      } else {
        console.log('Unhandled update unread message type');
      }
    },

    group: (state, payload) => {
      Vue.set(state, 'groups', payload);
      window.parent.postMessage({ type: 'groups', data: payload }, '*');
      store.set('groups', payload);
    },
    addToGroup: (state, payload) => {
      let groups = state.groups;
      groups.unshift(payload);
      Vue.set(state, 'groups', groups);
    },
    removeFromGroup: (state, id) => {
      let groups = state.groups;
      groups = groups.filter(group => group.id != id);
      Vue.set(state, 'groups', groups);
    },
    reorderGroup: (state, { toSwap }) => {
      let groups = [...state.groups];
      let temp = groups[toSwap.index];
      groups[toSwap.index] = groups[toSwap.nextGroupID];
      groups[toSwap.nextGroupID] = temp;
      Vue.set(state, 'groups', groups);
    },
    renameGroup: (state, payload) => {
      let groups = state.groups;
      groups = groups.map(group => {
        if (group.id == payload.channel_group_id || group.id == payload.id) {
          group.name = payload.name;
        }
        return group;
      });
      Vue.set(state, 'groups', groups);
    },
    modifyFavorites: (state, { payload, setFav }) => {
      let channels = state.all;
      channels = channels.map(channel => {
        if (channel.id == payload.id) {
          channel.is_favorite = setFav;
        }
        return channel;
      });
      Vue.set(state, 'all', channels);
    },
    removeChannelGroup: (state, payload) => {
      let channels = state.all;
      channels = channels.map(channel => {
        if (channel.id == payload.channel_id) {
          delete channel.channel_group_id;
        }
        return channel;
      });
      Vue.set(state, 'all', channels);
    },
    // update local read status
    setReadStatus: (state, payload) => {
      const { channel_id, message_id, timeout } = payload;

      if (state.readStatus[channel_id]) {
        clearTimeout(state.readStatus[channel_id].timeout);
      }

      state.readStatus[channel_id] = {
        message_id,
        timeout
      };
    },
    setOngoingCall: (state, { channelId, call_hash, server_address }) => {
      const channelIndex = _.findIndex(state.all, { id: channelId });

      // set on all list
      Vue.set(state.all[channelIndex], 'ongoing_call', {
        call_hash,
        server_address
      });

      setTimeout(() => {
        Vue.set(state.all[channelIndex], 'ongoing_call', null);
      }, 10000);
    },
    update: (state, payload) => {
      // get single channel index
      const channelIndex = _.findIndex(state.all, { id: payload.id });

      // set on all list
      Vue.set(state.all, channelIndex, {
        ...state.all[channelIndex],
        ...payload
      });

      // set on single
      if (state.single[payload.id]) {
        Vue.set(state.single, payload.id, {
          ...state.single[payload.id],
          ...payload
        });
      }

      // update local storage
      store.set('channels', state.all);
    },
    delete: (state, id) => {
      const list = [...state.all].filter(channel => channel.id !== id);

      state.all = list;

      Vue.delete(state.single, id);

      // update local storage
      store.set('channels', state.all);
    },
    single: (state, payload) => {
      let channel = payload;
      Vue.set(state.single, payload.id, channel);
    },

    sent: (state, id) => {
      state.sentIds.push(id);
    },

    ackSent: (state, id) => {
      state.sentIds = state.sentIds.filter(item => item !== id);
    },

    // clear channel from memory
    clearChannel: (state, id) => {
      if (state.single[id]) {
        delete state.single[id];
      }
    },

    clearChannelsCache: (state, channelToPreserve) => {
      if (channelToPreserve) {
        Vue.set(state, 'single', {
          [channelToPreserve]: { ...state.single[channelToPreserve] }
        });
      } else {
        Vue.set(state, 'single', {});
      }
    },

    updateMembers: (state, { channel_id, members }) => {
      // get single channel index
      const channelIndex = _.findIndex(state.all, { id: channel_id });

      // set on all list
      Vue.set(state.all[channelIndex], 'members', members);
    },

    // clear channel messages
    clearMessages: (state, id) => {
      Vue.set(state.single[id].chat, 'messages', []);
      Vue.set(state.single[id].chat, 'history', null);
    },

    // on destroy channel messages, clear temp memory
    destroy: (state, id) => {
      Vue.set(state.single[id], 'messages', []);
      Vue.set(state.single[id], 'history', null);
      Vue.set(state.single[id], 'buffer', null);
      Vue.set(state.single[id], 'clean', true);
    },

    chat: (state, payload) => {
      Vue.set(state.single[payload.channel_id], 'chat', payload.chat);
    },

    // manage chat history
    history: (state, payload) => {
      console.log('CALLING OLD FUNCTION');
      // set meta info
      // Vue.set(state.single, payload.channel_id, newChannel);
    },

    // handle sent message presend and postsend
    send: (state, payload) => {
      let messages = state.single[payload.channel_id].messages;

      // presend message
      if (!payload.id) {
        const message = {
          ...payload,
          id: payload.temp_id,
          sending: true
        };

        messages.push(parseMessages(message));
      } else {
        let index = _.findIndex(messages, {
          content: payload.content,
          sending: true
        });
        Vue.set(messages, index, parseMessages(payload));
      }

      // update history
      Vue.set(
        state.single[payload.channel_id],
        'history',
        parseMessagesHierarchy(messages)
      );
    },
    handleTyping: (state, payload) => {
      // if channel isnt loaded to memory
      if (!state.single[payload.channel_id]) return;

      let currentTyping = [...state.single[payload.channel_id].typing];

      if (currentTyping.indexOf(payload.user.display_name) === -1) {
        currentTyping.push(payload.user.display_name);
        Vue.set(state.single[payload.channel_id], 'typing', currentTyping);
      }

      // clear typing timeout
      clearTimeout(
        state.single[payload.channel_id].typingTimeout[
          payload.user.display_name
        ]
      );

      // handle typing delay
      let typingTimeout = setTimeout(() => {
        // remove typing
        Vue.delete(
          state.single[payload.channel_id].typing,
          state.single[payload.channel_id].typing.indexOf(
            payload.user.display_name
          )
        );
      }, 5000);

      Vue.set(
        state.single[payload.channel_id].typingTimeout,
        payload.user.display_name,
        typingTimeout
      );
    },
    updateTyping: (state, { channelId, nextTypingTime }) => {
      if (state.single[channelId]) {
        state.single[channelId].nextTypingTime = nextTypingTime;
      }
    },
    onUserAdded: async (state, payload) => {
      // get single channel index
      const channelIndex = _.findIndex(state.all, { id: payload.channel_id });
      // check on all channels list
      if (
        state.all[channelIndex] &&
        _.findIndex(state.all[channelIndex].members, {
          id: payload.user.id
        }) === -1
      ) {
        // set on all list
        Vue.set(state.all[channelIndex], 'members', [
          ...state.all[channelIndex].members,
          payload.user
        ]);
      }

      // check on single channel list
      if (
        state.single[payload.channel_id] &&
        _.findIndex(state.single[payload.channel_id].members, {
          id: payload.user.id
        }) === -1
      ) {
        Vue.set(state.single[payload.channel_id], 'members', [
          ...state.single[payload.channel_id].members,
          payload.user
        ]);

        Vue.set(
          state.single[payload.channel_id].member,
          payload.user.id,
          payload.user
        );
      }
    },

    onUserRemoved: (state, payload) => {
      // get single channel index
      const channelIndex = _.findIndex(state.all, { id: payload.channel_id });

      // check if channel is not in memory
      if (channelIndex === -1) return;

      const members = state.all[channelIndex].members.filter(
        member => member.id !== payload.removed_user_id
      );
      Vue.set(state.all[channelIndex], 'members', members);

      // if channel is loaded to memory
      if (state.single[payload.channel_id]) {
        Vue.set(state.single[payload.channel_id], 'members', members);
      }

      //remove channel from memory
      if (payload.currentUser.id === payload.removed_user_id) {
        let list = [...state.all].filter(
          channel => channel.id !== payload.channel_id
        );
        Vue.set(state, 'all', list);
      }
    },
    updateChannelLastActive: (state, { channel_id }) => {
      const channelIndex = _.findIndex(state.all, { id: channel_id });
      const channel = state.all[channelIndex];

      Vue.set(state.all, channelIndex, {
        ...channel,
        last_active_on: moment.utc().format('YYYY-MM-DD HH:mm:ss')
      });
    },
    handleMessageUpdate: (state, payload) => {
      let { messages, history } = state.single[payload.channel_id].chat;

      Vue.set(messages, payload.message.index, payload.message.data);
      Vue.set(history, payload.history.index, payload.history.data);

      const _message = payload.message.data;
      if (state.observableMessages[_message.id]) {
        Vue.set(state.observableMessages, _message.id, _message);
      }

      // check if it's the last message
      const channelIndex = _.findIndex(state.all, { id: payload.channel_id });
      const channel = state.all[channelIndex];

      if (
        channel.latest_message &&
        channel.latest_message.id === payload.message.data.id
      ) {
        Vue.set(
          state.all[channelIndex],
          'latest_message',
          payload.message.data
        );
      }
    },

    handleMessageDelete: (state, payload) => {
      if (!state.single[payload.channel_id]) {
        console.log('[UNHANDLED MESSAGE UPDATE]');
        return;
      }

      let { messages, history } = state.single[payload.channel_id];
      let messageIndex = _.findIndex(messages, {
        id: parseInt(payload.message_id)
      });
      let historyIndex = _.findIndex(history, {
        id: parseInt(payload.message_id)
      });

      // delete from messages and history
      Vue.delete(messages, messageIndex);
      Vue.delete(history, historyIndex);
    },

    addMessageListener: (state, message) => {
      Vue.set(state.observableMessages, message.id, message);
    },
    toggleGroupExpanded: (state, payload) => {
      let { group_id, status } = payload;
      if (group_id) {
        let groupIndex = _.findIndex(state.groups, { id: group_id });
        if (groupIndex === -1) return;
        let _group = state.groups[groupIndex];
        _group.expanded = status;
        Vue.set(state.groups, groupIndex, _group);

        //TODO: lib store
        let expandedGroups = state.expandedGroupsIds;
        expandedGroups[group_id] = status;

        store.set('expandedGroups', expandedGroups);
        Vue.set(state, 'expandedGroupsIds', expandedGroups);
      } else {
        //set all

        console.log('setting', status);

        if (status === false) {
          let _expandedGroups = {};
          state.groups.forEach(g => {
            _expandedGroups[g.id] = false;
          });
          store.set('expandedGroups', _expandedGroups);
          Vue.set(state, 'expandedGroupsIds', _expandedGroups);
        } else {
          let _expandedGroups = {};
          state.groups.forEach(g => {
            _expandedGroups[g.id] = true;
          });
          store.set('expandedGroups', _expandedGroups);
          Vue.set(state, 'expandedGroupsIds', _expandedGroups);
        }

        let _groups = state.groups.map(group => {
          return {
            ...group,
            expanded: status
          };
        });

        Vue.set(state, 'groups', _groups);
      }
    },
    setExpandedGroups: (state, expandedGroupsIds) => {
      Vue.set(state, 'expandedGroupsIds', expandedGroupsIds);
    },
    clear: state => {
      state = initialState;
    }
  },
  actions: {
    setChannelsBellowViewport(context, payload) {
      context.commit('setChannelsBellowViewport', payload);
    },
    setCollapsedGroupsBellowViewport(context, payload) {
      context.commit('setCollapsedGroupsBellowViewport', payload);
    },
    resetUnreadCountBellow(context, payload) {
      context.commit('set', { key: 'unreadMessagesBellowViewport', value: 0 });
      context.commit('set', {
        key: 'collapsedGroupsBellowViewport',
        value: {}
      });
      context.commit('set', { key: 'channelsBellowViewport', value: {} });
    },

    setObservable(context, payload) {
      const { id, params } = payload;

      this.state.workers.channels.postMessage({
        type: 'setObservable',
        data: {
          id: id,
          ...params
        }
      });
    },

    getUserPreferences(context, payload) {
      /*
      //TODO: fetch user preferences from API

      let _userPreferences = {
        showCategories: store.get('settings.showCategories') !== undefined
        ? store.get('settings.showCategories')
        : false,
        filterBy: store.get('airsendLS__filterBy')
          ? store.get('airsendLS__filterBy')
          : 'active',
        sortBy: ['is_favorite-desc', store.get('airsendLS__sortBy')
          ? store.get('airsendLS__sortBy')
          : 'last_active_on_ts-desc'],
        filterTeams: store.get('settings.filterTeams')
          ? store.get('settings.filterTeams')
          : {}
      }

      if(_userPreferences.sortBy[1] === 'last_active_on_ts-asc' || _userPreferences.sortBy[1] === 'created_on_ts-asc'){
        _userPreferences.sortBy[1] = 'last_active_on_ts-desc';
      }

      this.state.workers.channels.postMessage({
        type: 'setObservable',
        data: {
          id: 'home',
          filterBy: _userPreferences.filterBy,
          sortBy: _userPreferences.sortBy
        }
      });

      this.state.workers.channels.postMessage({
        type: 'setObservable',
        data: {
          id: 'switcher',
          filterBy: _userPreferences.filterBy,
          sortBy: _userPreferences.sortBy,
          filterTeams: _userPreferences.filterTeams
        }
      });

      context.commit('set', {key: 'userPreferences',value: _userPreferences});
      */
    },
    setUserPreferences(context, payload) {
      /*
      let {userPreferences, id} = payload;
      let {showCategories, filterBy, sortBy, filterTeams} = userPreferences;

      //TODO: send user preferences to API

      store.set('settings.showCategories', showCategories);

      if(filterBy !== 'active'){
        store.set('airsendLS__filterBy', filterBy);
      }else{
        store.remove('airsendLS__filterBy');
      }

      if(Object.keys(filterTeams).length === 0){
        store.remove('settings.filterTeams');
      }else{
        store.set('settings.filterTeams', filterTeams);
      }

      if(sortBy[1] !== 'last_active_on_ts-desc'){
        store.set('airsendLS__sortBy', sortBy[1]);
      }else{
        store.remove('airsendLS__sortBy');
      }


      this.state.workers.channels.postMessage({
        type: 'setObservable',
        data: {
          id,
          filterBy,
          sortBy,
          filterTeams,
        }
      });

      context.commit('set', {key: 'userPreferences', value: userPreferences});
      */
    },

    // get all channels
    async list(context) {
      const inMemoryChannels = store.get('channels');

      // quickly load channels to memory
      if (inMemoryChannels && inMemoryChannels.length > 0) {
        context.dispatch('_list');

        // post message to electron
        window.parent.postMessage(
          { type: 'channels', data: inMemoryChannels },
          '*'
        );

        // send to worker
        this.state.workers.channels.postMessage({
          type: 'list',
          data: inMemoryChannels
        });
      } else {
        await context.dispatch('_list');
      }
    },

    // get all channels request
    async _list(context) {
      // fetch channels
      const response = await context.state.client.get('channel.list', {
        exclude_closed: false
      });

      // TODO: add a better error handling for this one
      if (response.error) return;

      const { channels } = response.data;

      // post message to electron
      window.parent.postMessage({ type: 'channels', data: channels }, '*');

      // send to worker
      this.state.workers.channels.postMessage({
        type: 'list',
        data: channels
      });

      store.set('channels', channels);

      return channels;
    },

    // create channel
    async create(context, payload) {
      // prepare request
      let request = {
        channel_name: payload.channel_name,
        blurb: payload.blurb,
        require_join_approval: 0
      };

      if (payload.team_id) {
        request.team_id = payload.team_id;
      }

      // if there are emails
      if (payload.emails.length > 0) {
        request.users = payload.emails
          .map(user => {
            return typeof user === 'string'
              ? user
              : user.email
              ? user.email
              : user.id;
          })
          .join(',');
      }

      if (payload.copy_from_channel_id !== '') {
        request.copy_from_channel_id = payload.copy_from_channel_id;
      }

      // fetch channels
      const response = await context.state.client.post(
        'channel.create',
        request
      );

      if (response.ok) {
        // add new channel to the list
        this.state.workers.channels.postMessage({
          type: 'list',
          data: [...context.state.all, response.data.channel]
        });

        this.commit('core/addToast', {
          id: 'channel.create',
          content: `Successfully created "${payload.channel_name}" channel`,
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });

        router.push({
          name: 'channel',
          params: {
            id: response.data.channel.id,
            isFresh: true
          }
        });
      }

      return response;
    },

    // create channel
    async createOneOnOne(context, payload) {
      // fetch channels
      const response = await context.state.client.post('channel.one-on-one', {
        with_user_id: payload
      });

      if (response.ok) {
        // check if channel is already added
        const index = _.findIndex(context.state.all, {
          id: response.data.channel.id
        });

        if (index === -1) {
          this.state.workers.channels.postMessage({
            type: 'list',
            data: [...context.state.all, response.data.channel]
          });
        }

        router.push({
          name: 'channel',
          params: {
            id: response.data.channel.id
          }
        });
      }

      return response;
    },

    // update channel
    async update(context, payload) {
      const noToast = payload.noToast ? true : false;
      delete payload.noToast;

      // fetch channels
      const response = await context.state.client.post(
        'channel.update',
        payload
      );

      if (response.ok) {
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            ...response.data.channel,
            _isComplete: true
          }
        });

        if (!noToast) {
          this.commit('core/addToast', {
            id: 'channel.create',
            content: 'Successfully updated channel',
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 3000
          });
        }
      }

      return response;
    },

    // approve join request to channel
    async approveJoin(context, payload) {
      const response = await context.state.client.post(
        'channel.approveJoin',
        payload
      );
      return response;
    },

    // reject join request to channel
    async rejectJoin(context, payload) {
      const response = await context.state.client.post(
        'channel.removeJoin',
        payload
      );
      return response;
    },

    async onUserAdded(context, payload) {
      const { user: currentUser } = context.rootState.core;
      const { channel_id, user } = payload;

      // check public hash
      const { id: currentChannelId } = router.history.current.params;
      const { hash } = router.history.current.query;

      // if public view, redirect to the actual channel
      if (
        currentUser.id == payload.user.id &&
        hash &&
        currentChannelId == channel_id
      ) {
        router.push({
          name: 'channel',
          params: {
            id: channel_id
          }
        });
      }

      // get single channel index
      let channelIndex = _.findIndex(context.state.all, {
        id: payload.channel_id
      });

      // check if channel is not in memory and user is being added
      if (channelIndex === -1 && currentUser.id === payload.user.id) {
        const response = await context.state.client.get(
          'channel.info',
          { channel_id: payload.channel_id },
          true
        );

        if (response.ok) {
          this.state.workers.channels.postMessage({
            type: 'list',
            data: [...context.state.all, response.data.channel]
          });
        }
      }

      // send data to worker
      this.state.workers.channels.postMessage({
        type: 'onUserAdded',
        data: payload
      });
    },

    // add members toArray channel
    async addMembers(context, payload) {
      // prepare request
      let request = {
        channel_id: payload.channel_id
      };

      // if there are emails
      if (payload.emails.length > 0) {
        request.users = payload.emails
          .map(user => {
            return typeof user === 'string'
              ? user
              : user.email
              ? user.email
              : user.id;
          })
          .join(',');
      }

      // fetch channels
      const response = await context.state.client.post(
        'channel.invite',
        request
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.invite',
          content: 'Successfully added user(s) to the channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    // remove members from Channel
    async removeMember(context, payload) {
      let request = payload;
      const response = await context.state.client.post('channel.kick', request);
      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.kick',
          content: 'Successfully removed user from the channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        return {
          error: 'Failed to remove member(s)'
        };
      }
      return response;
    },

    async setUserRole(context, payload) {
      const response = await context.state.client.post(
        'channel.user.setrole',
        payload
      );
      return response;
    },

    // rename channel
    async rename(context, payload) {
      // fetch channels
      const response = await context.state.client.post(
        'channel.rename',
        payload
      );

      if (response.ok) {
        // update channel on the list
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: payload.channel_id,
            channel_name: payload.channel_name,
            blurb: payload.blurb
          }
        });

        this.commit('core/addToast', {
          id: 'channel.rename',
          content: `Successfully renamed channel to "${payload.channel_name}"`,
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    // export channel
    async export(context, payload) {
      const response = await context.state.client.getPlain(
        'channel.export',
        { channel_id: payload.channel_id },
        { responseType: 'blob' }
      );

      if (response.ok) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${payload.channel_name}.zip`);
        document.body.appendChild(link);
        link.click();
      } else {
        this.commit('core/addToast', {
          id: 'channel.export',
          content: 'Failed to export channel, please try again later.',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async remove(context, payload) {
      // fetch channels
      const response = await context.state.client.post(
        'channel.remove',
        payload
      );
      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.remove',
          content: 'Successfully removed channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async mute(context, { channel_id, channel_name }) {
      const channel = _.find(context.state.all, { id: channel_id });

      if (!channel) return;

      const request = await context.state.client.post('chat.command', {
        text: !channel.muted ? '/mute' : '/unmute',
        channel_id
      });
    },

    async close(context, payload) {
      const response = await context.state.client.post(
        'channel.close',
        payload
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.close',
          content: 'Successfully closed channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });

        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: payload.channel_id,
            channel_status: 2
          }
        });
      }

      return response;
    },

    async activate(context, payload) {
      const response = await context.state.client.post(
        'channel.activate',
        payload
      );
      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.activate',
          content: 'Successfully activated channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });

        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: payload.channel_id,
            channel_status: 1
          }
        });
      }

      return response;
    },

    async leave(context, payload) {
      // fetch channels
      const response = await context.state.client.post(
        'channel.leave',
        payload
      );
      if (response.ok) {
        let list = [...context.state.all].filter(
          list => list.id !== payload.channel_id
        );

        this.state.workers.channels.postMessage({
          type: 'list',
          data: list
        });

        this.commit('core/addToast', {
          id: 'channel.leave',
          content: 'Successfully left channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });

        // check public hash
        const { name, params } = router.history.current;

        if (name === 'channel' && params.id == payload.channel_id) {
          if (context.state.all.length > 1) {
            router.history.push(
              `/channel/${
                context.state.all[0].id !== payload.channel_id
                  ? context.state.all[0].id
                  : context.state.all[1].id
              }`
            );
          } else {
            router.history.push('/');
          }
        }
      }

      return response;
    },

    async onLoadChannel(context, channelId) {
      const { inMemoryChannels } = context.state;

      if (inMemoryChannels.length === 5) {
        const channelToClean = inMemoryChannels[inMemoryChannels.length - 1];
        const channel = context.state.single[channelToClean];

        this.commit('actions/clearByChannel', channelToClean);

        // clear roots
        for (var i = 0; i < channel.channel_roots.length; i++) {
          const root = channel.channel_roots[i];
          if (root.type === 'files') {
            this.commit('files/clearByPath', root.location);
          }
        }

        this.state.workers.channels.postMessage({
          type: 'clearChannel',
          data: channelToClean
        });

        context.commit('clearChannel', channelToClean);

        context.commit('set', {
          key: 'inMemoryChannels',
          value: [channelId, ...inMemoryChannels.slice(0, 4)]
        });
      } else if (inMemoryChannels.indexOf(channelId) === -1) {
        context.commit('set', {
          key: 'inMemoryChannels',
          value: [channelId, ...inMemoryChannels]
        });
      }
    },

    // get single channel
    async get(context, channelId) {
      context.dispatch('onLoadChannel', parseInt(channelId));

      // check if channel is in memory
      const inMemoryChannel = _.find(context.state.all, {
        id: parseInt(channelId)
      });

      if (inMemoryChannel) {
        // send channel data to worker
        this.state.workers.channels.postMessage({
          type: 'single',
          data: inMemoryChannel
        });
      }

      // check public hash
      const { hash } = router.history.current.query;

      // fetch single channel
      const response = await context.state.client.get(
        'channel.info',
        { channel_id: channelId },
        hash ? hash : false
      );

      if (response.ok) {
        response.data.channel.img_cache = 0;

        // send channel data to worker
        this.state.workers.channels.postMessage({
          type: 'single',
          data: response.data.channel
        });

        return response.data.channel;
      } else {
        // The channel is deleted or invalid
        this.commit('core/addToast', {
          id: 'channel.get',
          content: 'Failed to load channel.',
          contentType: 'text',
          type: 'danger',
          close: true
        });

        return false;
      }
    },

    // sync data from backend
    async sync(context) {
      // sync up alerts
      this.dispatch('alerts/list');
      this.dispatch('teams/list');

      const channels = await context.dispatch('_list');
      context.dispatch('_groupsList');

      if (
        router.history.current.name === 'channel' ||
        router.history.current.name === 'channel-sub'
      ) {
        const { id } = router.history.current.params;

        // send command to clear local cache
        this.state.workers.channels.postMessage({
          type: 'clearChannelsCache',
          data: id
        });

        if (id) {
          context.dispatch('get', id);

          const channel = _.find(channels, { id: parseInt(id) });

          if (channel) {
            await context.dispatch('jumpTo', {
              channel: id,
              message: channel.read_watermark_id.toString()
            });
          }
        }
      } else if (router.history.current.name === 'home-team') {
        const { id } = router.history.current.params;

        this.dispatch('teams/get', { id });
        this.commit('teams/set', { members: {} });
      }
    },

    // get channel history
    async history(context, channelId) {
      // check public hash
      const { hash } = router.history.current.query;

      const response = await context.state.client.get(
        'channel.history',
        { channel_id: channelId, limit: 40 },
        hash ? hash : false
      );

      if (response.ok) {
        // send channel data to worker
        this.state.workers.channels.postMessage({
          type: 'history',
          data: { ...response.data, channel_id: channelId }
        });
      } else {
        this.commit('core/addToast', {
          id: 'channel.history',
          content: 'Failed to get channel history, try again later.',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
    },

    // jump to message
    async jumpTo(context, { channel, message }) {
      // check public hash
      const { hash } = router.history.current.query;

      const response = await context.state.client.get(
        'channel.history',
        {
          channel_id: channel,
          limit: 30,
          limit_newer: 30,
          cursor: btoa(message.toString())
        },
        hash ? hash : false
      );

      if (response.ok) {
        // send channel data to worker
        this.state.workers.channels.postMessage({
          type: 'history',
          data: { ...response.data, channel_id: channel, target: message }
        });
      } else {
        // TODO: Handle API of or other possible errors
      }
    },

    // get next page of history
    async next(context, { id, newer }) {
      const channel = context.state.single[id];
      const { messages, buffer } = channel.chat;

      const pivot_message = newer
        ? buffer.newer[buffer.newer.length - 1]
        : buffer.older[0];

      if (!pivot_message) {
        setTimeout(() => {
          context.dispatch('next', { id, newer });
        }, 500);
        return;
      }

      this.state.workers.channels.postMessage({
        type: 'buffer',
        data: { channel_id: id, is_newer: newer }
      });

      if (
        (!newer && channel.chat.has_more) ||
        (newer && channel.chat.has_more_newer)
      ) {
        if (pivot_message) {
          context.dispatch('fetchNext', { pivot_message, channel, newer });
        }
      }
    },

    // get next page of history
    async fetchNext(context, { channel, pivot_message, newer }) {
      // check public hash
      const { hash } = router.history.current.query;

      let request = {
        channel_id: channel.id,
        cursor: btoa(pivot_message.id),
        [`limit${newer ? '_newer' : ''}`]: 20
      };

      const response = await context.state.client.get(
        'channel.history',
        request,
        hash ? hash : false
      );

      if (response.ok) {
        this.state.workers.channels.postMessage({
          type: 'history',
          data: {
            ...response.data,
            channel_id: channel.id,
            is_next: true,
            is_newer: newer
          }
        });
      } else {
        // TODO: Handle API of or other possible errors
      }
    },

    async command(context, payload) {
      const request = await context.state.client.post('chat.command', payload);

      if (request.ok) {
        if (_.startsWith(payload.text, '/call')) {
          this.dispatch('meeting/join', {
            room: request.data.payload.hash
              ? request.data.payload.hash
              : request.data.payload.call_hash,
            server_address: request.data.payload.server_address,
            channelId: payload.channel_id,
            shouldJoinVideo: false
          });
        }
      } else {
        this.commit('core/addToast', {
          id: 'chat.command',
          content: request.error
            ? request.error
            : "Failed to push your command, please check if it's valid.",
          contentType: 'text',
          type: 'danger',
          timeout: 3000,
          close: false
        });
      }
    },

    // send message
    async send(context, payload) {
      if (payload.text === '') return;

      let template;

      const { user } = context.rootState.core;

      if (context.state.single[payload.channel_id]) {
        let { messages } = context.state.single[payload.channel_id].chat;

        // local message template
        template = {
          attachments: [],
          channel_id: payload.channel_id,
          content: payload.text,
          created_on: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
          created_on_ts: moment.utc().format('x'),
          display_name: user.display_name,
          read_users: [],
          files: null,
          emoticons: [],
          parent_message: null,
          is_edited: false,
          message_type: 1,
          parent_message_id: null,
          temp_id: uuid(),
          user_id: user.id
        };

        if (payload.quote_message_id) {
          let index = _.findIndex(messages, {
            id: parseInt(payload.quote_message_id)
          });

          if (index > -1) {
            let message = messages[index];

            // set parent message
            template.parent_message = {
              user_id: message.user_id,
              display_name: message.display_name,
              message_id: message.id,
              content: message.content,
              created_on: message.created_on
            };
          } else {
            // index not found
          }
        }

        // presend visualization
        this.state.workers.channels.postMessage({
          type: 'send',
          data: template
        });
      }

      const request = await context.state.client.post('chat.postmessage', {
        ...payload
      });

      if (request.ok && context.state.single[payload.channel_id]) {
        context.commit('sent', request.data.message_id);

        // confirm message
        this.state.workers.channels.postMessage({
          type: 'send',
          data: {
            ...template,
            sending: false,
            id: request.data.message_id
          }
        });
      } else if (!request.ok) {
        this.commit('core/addToast', {
          id: 'chat.postmessage',
          content: 'Failed to send your message, try again later.',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
    },

    // send rich message
    async sendWithAttachments(context, payload) {
      const { user } = context.rootState.core;
      let { messages } = context.state.single[payload.channel_id].chat;
      const { channel } = payload;

      const root = _.find(channel.channel_roots, { type: 'files' });

      // local message template
      let template = {
        attachments: payload.files.map(file => {
          return {
            ctp: 'ATTACHMENT_TYPE_FILE',
            content: {
              path: file.fullpath
                ? file.fullpath
                : `${root.location}/attachments/${file.name}`,
              file: file.name,
              thumb: file.thumb,
              size: file.size
            }
          };
        }),
        channel_id: payload.channel_id,
        content: payload.text,
        created_on: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
        created_on_ts: moment.utc().format('x'),
        display_name: user.display_name,
        read_users: [],
        emoticons: [],
        parent_message: null,
        is_edited: false,
        message_type: 1,
        parent_message_id: null,
        temp_id: messages.length,
        user_id: user.id
      };

      if (payload.quote_message_id) {
        let index = _.findIndex(messages, {
          id: parseInt(payload.quote_message_id)
        });

        if (index > -1) {
          let message = messages[index];

          // set parent message
          template.parent_message = {
            user_id: message.user_id,
            display_name: message.display_name,
            message_id: message.id,
            content: message.content,
            created_on: message.created_on
          };
        } else {
          // index not found
        }
      }

      // presend visualization
      this.state.workers.channels.postMessage({ type: 'send', data: template });

      // check actual files (ones which needs upload)
      const actualFiles = payload.files.filter(file => file instanceof File);

      if (actualFiles.length > 0) {
        await this.dispatch('files/upload', {
          files: actualFiles,
          path: `${root.location}/attachments`,
          noToast: true
        });
      }

      const fileNames = payload.files.map(file => {
        return file.fullpath
          ? file.fullpath
          : `${root.location}/attachments/${file.name}`;
      });

      delete payload.channel;

      const postRequest = await context.state.client.post('chat.postmessage', {
        ...payload,
        attachments: JSON.stringify(fileNames)
      });

      if (postRequest.ok) {
        context.commit('sent', postRequest.data.message_id);

        // postsend visualization
        this.state.workers.channels.postMessage({
          type: 'send',
          data: {
            ...template,
            sending: false,
            id: postRequest.data.message_id
          }
        });
      } else {
        this.commit('core/addToast', {
          id: 'chat.postmessage',
          content: 'Failed to send your message, try again later.',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
    },

    async join(context, payload) {
      const response = await context.state.client.post('channel.join', payload);

      if (response.ok) {
        if (!payload.require_approval) {
          router.push({
            name: 'channel',
            params: {
              id: payload.channel_id
            }
          });

          this.commit('core/addToast', {
            id: 'channel.joined',
            content: { message: 'channels.invite.successfully-joined' },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 3000
          });

          await context.dispatch('get', payload.channel_id);
        } else {
          this.commit('core/addToast', {
            id: 'channel.joined',
            content: { message: 'channels.invite.successfully-asked-join' },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 3000
          });
        }
      }

      return response;
    },

    async messageReact(context, { message_id, channel_id, emoji_value, type }) {
      const { display_name, id: user_id } = context.rootState.core.user;

      const inMemoryMessage = _.find(
        context.state.single[channel_id].chat.messages,
        {
          id: message_id
        }
      );

      if (!inMemoryMessage) return;

      let emoticons = [];

      // if type is true, add reaction
      if (type) {
        emoticons = [
          ...inMemoryMessage.emoticons,
          {
            dn: display_name,
            ev: emoji_value,
            uid: user_id
          }
        ];
      } else {
        emoticons = _.filter(inMemoryMessage.emoticons, item => {
          return !(item.ev == emoji_value && item.uid == user_id);
        });
      }

      this.state.workers.channels.postMessage({
        type: 'onUpdateMessage',
        data: {
          ...inMemoryMessage,
          emoticons
        }
      });

      const response = await context.state.client.post('chat.reactmessage', {
        message_id,
        emoji_value,
        remove: !type ? 1 : 0
      });
    },

    async handleDeleteMessage(context, payload) {
      const request = await context.state.client.post(
        'chat.deletemessage',
        payload
      );

      if (request.ok) {
        this.commit('core/addToast', {
          id: 'chat.deletemessage',
          content: 'Successfully deleted your message.',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'chat.deletemessage',
          content: 'Failed to delete your message, try again later.',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
    },

    async handleUpdateMessage(context, payload) {
      const request = await context.state.client.post(
        'chat.updatemessage',
        payload
      );

      if (request.ok) {
        this.commit('core/addToast', {
          id: 'chat.updatemessage',
          content: 'Successfully updated your message.',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'chat.updatemessage',
          content: 'Failed to update your message, try again later.',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
    },

    async handleRead(context, payload) {
      this.dispatch('websocket/send', {
        command: 'ws_read_notification',
        ...payload
      });

      // update badge
      this.commit('core/setBadge', this.getters['channels/getUnreadCount']);
    },

    async onUnreadCountUpdate(context, payload) {
      /*
        message_id: 13002
        total_unread_count: 0
        channel_id: 11010142
        channel_unread_count: 0
        oldest_unread_message_id: 0
      */

      const { oldest_unread_message_id, channel_unread_count } = payload;

      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: payload.channel_id,
          oldest_unread_message_id: oldest_unread_message_id,
          unread_count: channel_unread_count
        }
      });

      // update badge
      this.commit('core/setBadge', this.getters['channels/getUnreadCount']);
    },

    async onReadMessage(context, payload) {
      const { channel_id, message_id } = payload;

      if (
        !context.state.readStatus[channel_id] ||
        (context.state.readStatus[channel_id] &&
          message_id > context.state.readStatus[channel_id].message_id)
      ) {
        context.commit('setReadStatus', {
          channel_id,
          message_id,
          timeout: setTimeout(() => {
            this.dispatch('websocket/send', {
              command: 'ws_read_notification',
              ...payload
            });
          }, 1000)
        });
      }
    },

    onChannelPendingMembers(context, payload) {
      const { channel_id, pending_members } = payload;

      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: channel_id,
          pending_members
        }
      });
    },

    onUpdateReadStatus(context, payload) {
      const { channel_id, read_watermark_id, user_id, unread_count } = payload;
      const { user } = context.rootState.core;

      if (user_id === user.id) {
        // update channel on the list
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: channel_id,
            read_watermark_id,
            unread_count: unread_count
          }
        });

        this.commit('core/setBadge', this.getters['channels/getUnreadCount']);
      }

      this.state.workers.channels.postMessage({
        type: 'onUpdateReadStatus',
        data: payload
      });
    },

    async startOrJoinMeeting(context, channelId) {
      // check if there is a call running
      const lastMeeting = _.find(
        context.state.single[channelId].chat.messages,
        item => {
          return (
            item.content &&
            item.content.i18n &&
            item.content.i18n.key === 'bot.start_call'
          );
        }
      );

      if (lastMeeting) {
        const { params } = lastMeeting.content.i18n;

        this.dispatch('meeting/join', {
          room: params.call_hash,
          server_address: params.server_address,
          channelId,
          shouldJoinVideo: false
        });
      } else {
        await this.dispatch('channels/command', {
          text: '/call',
          channel_id: channelId
        });
      }
    },

    async readAll(context, payload) {
      this.dispatch('websocket/send', {
        command: 'ws_all_read_notification',
        channel_id: payload.channel_id
      });

      if (!payload.no_toast) {
        this.commit('core/addToast', {
          id: 'channel.read',
          content: `Marked all messages as read in channel ${payload.channel_name}`,
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      this.state.workers.channels.postMessage({
        type: 'updateUnreadCounter',
        data: { ...payload, type: 'all' }
      });

      this.state.workers.channels.postMessage({
        type: 'updateUnreadCounterBellow',
        data: {
          channel_id: payload.channel_id,
          type: 'all',
          expandedGroups: context.state.expandedGroupsIds
        }
      });

      //this.commit("channels/updateUnreadMessagesBellowViewport", {type: "all", channel_id: payload.channel_id});
    },

    async updateImage(context, payload) {
      const response = await context.state.client.postMultipart(
        `channel.image.set?channel_id=${
          payload.channel_id
        }&channel_asset_type=${
          payload.type
        }&clear_asset=${!!payload.clear_asset}`,
        {
          clear_asset: !!payload.clear_asset,
          channel_id: payload.channel_id,
          channel_asset_type: payload.type,
          file: payload.avatar
        }
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.image.set',
          content: `Successfully updated the channel ${payload.type}.`,
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    // connect to realtime layer
    sendTypingEvent(context, channelId) {
      const { nextTypingTime } = context.state.single[channelId];

      if (!nextTypingTime || moment().unix() > nextTypingTime) {
        context.rootState.websocket.ws.send(
          JSON.stringify({
            command: 'ws_ephemeral_typing',
            user_email: this.state.core.user.email,
            channel_id: channelId
          })
        );

        context.commit('updateTyping', {
          channelId,
          nextTypingTime: moment()
            .add(2, 'seconds')
            .unix()
        });
      }
    },

    onReceiveMessage(context, payload) {
      const { user, notify } = context.rootState.core;
      const { message } = payload;
      const { channel_id, id } = message;
      const self = this;

      // parse channel to use in the notifications
      const channel = _.find(context.state.all, { id: message.channel_id });

      if (!payload.isRetry) {
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: channel_id,
            last_active_on: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            last_active_on_ts: moment().unix(),
            latest_message: message
          }
        });
      }

      // check if event came before the message be sent
      if (
        context.state.single[channel_id] &&
        context.state.single[channel_id].chat &&
        message.user_id === user.id
      ) {
        const messages = context.state.single[channel_id].chat.messages;

        // if there is an ongoing message, wait for it to complete
        const ongoingMessages = _.findIndex(messages, { sending: true });
        if (ongoingMessages > -1) {
          setTimeout(() => {
            context.dispatch('onReceiveMessage', { ...payload, isRetry: true });
          }, 500);
          return;
        }
      }

      // if message is in memory, update it
      if (context.state.sentIds.indexOf(message.id) > -1) {
        this.state.workers.channels.postMessage({
          type: 'onUpdateMessage',
          data: message
        });
        context.commit('ackSent', message.id);
      } else {
        // handle received message on channel
        if (
          !context.state.single[channel_id] ||
          !context.state.single[channel_id].chat.has_more_newer
        ) {
          this.state.workers.channels.postMessage({
            type: 'onReceiveMessage',
            data: payload
          });
        }

        // check if it's a meeting message
        if (
          !window.isElectron &&
          message.user_id === 91000001 &&
          message.user_id !== user.id
        ) {
          if (
            message.content &&
            message.content.i18n &&
            message.content.i18n.key === 'bot.start_call'
          ) {
            const {
              call_hash,
              server_address,
              user_name,
              user_id
            } = message.content.i18n.params;

            if (user_id === user.id) return;

            context.commit('setOngoingCall', {
              channelId: channel.id,
              call_hash,
              server_address
            });

            notify.create({
              title: `${user_name} has started a new meeting on ${channel.channel_name}`,
              body: 'Click here to join',
              muted: true,
              onClick: function() {
                window.focus();

                // if on a different route, push to correct one
                if (
                  router.currentRoute.name !== 'channel' ||
                  router.currentRoute.params.id != message.channel_id
                ) {
                  router.push({
                    name: 'channel',
                    params: {
                      id: message.channel_id,
                      target: message.id
                    }
                  });
                }

                self.dispatch('meeting/join', {
                  room: call_hash,
                  server_address,
                  channelId: channel_id,
                  shouldJoinVideo: false
                });

                this.close();
              }
            });
          }
        }

        // prevent sound and notification if it's same author
        if (message.user_id === user.id || message.user_id === 91000001) return;

        this.state.workers.channels.postMessage({
          type: 'updateUnreadCounter',
          data: { channel_id, type: '+' }
        });

        this.state.workers.channels.postMessage({
          type: 'updateUnreadCounterBellow',
          data: {
            channel_id,
            type: '+',
            expandedGroups: context.state.expandedGroupsIds
          }
        });

        if (channel.muted) return;

        // if page has focus, and current channel is the same as message channel
        if (
          document.hasFocus() &&
          router.history.current.name === 'channel' &&
          router.history.current.params.id == channel_id &&
          !context.state.single[channel_id].has_more_newer
        ) {
          if (!store.get('muteSounds')) {
            // play in-chat sound
            notify.messageSound.play();
          }

          // if not, show proper notification
        } else {
          // if content comes from a bot, prevent message notification
          if (typeof message.content !== 'string') return;

          notify.create({
            title: channel.counterpart
              ? channel.counterpart.display_name
              : `${message.display_name} at ${channel.channel_name}`,
            body: parseMessageContent(message.content, channel, true),
            isMeetingActive: this.getters['meeting/isMeetingActive'],
            onReply: function(reply) {
              context.dispatch('send', {
                text: reply,
                channel_id: channel_id,
                send_email: '0'
              });
            },
            onClick: function() {
              window.focus();

              // if on a different route, push to correct one
              if (
                router.currentRoute.name !== 'channel' ||
                router.currentRoute.params.id != message.channel_id
              ) {
                router.push({
                  name: 'channel',
                  params: {
                    id: message.channel_id,
                    target: message.id
                  }
                });

                // else jump to message
              } else {
                EventBus.$emit('jump-to', {
                  target: message.id,
                  channel: message.channel_id
                });
              }

              this.close();
            }
          });
        }
      }

      // update badge
      this.commit('core/setBadge', this.getters['channels/getUnreadCount']);
    },

    onUpdateMessage(context, payload) {
      const { message } = payload;
      this.state.workers.channels.postMessage({
        type: 'onUpdateMessage',
        data: message
      });
    },

    onUpdateUser(context, payload) {
      this.state.workers.channels.postMessage({
        type: 'onUpdateUser',
        data: payload
      });
    },

    onChannelCreate(context, payload) {
      const { user, notify } = context.rootState.core;
      const { channel } = payload;

      if (channel.created_by !== user.id) {
        // add new channel to the list
        this.state.workers.channels.postMessage({
          type: 'list',
          data: [...context.state.all, channel]
        });

        // parse channel to use in the notifications
        const author = _.find(channel.members, { id: channel.created_by });

        notify.create({
          title: `${author.display_name} added you to ${channel.channel_name}`,
          body: 'Click here to start typing...',
          onClick: function() {
            this.close();
            router.push(`/channel/${channel.id}`);
          }
        });
      }
    },

    onChannelUpdate(context, payload) {
      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          ...payload.channel,
          _isComplete: true
        }
      });
    },

    onChannelRemove(context, payload) {
      let list = [...context.state.all].filter(
        list => list.id !== payload.channel_id
      );

      this.state.workers.channels.postMessage({
        type: 'list',
        data: list
      });

      if (this.state.channels.single.hasOwnProperty(payload.channel_id)) {
        //channel is removed or deleted
        router.push('/');
      }
    },

    //block/unblock channel
    async blockChannel(context, payload) {
      const { id } = payload.channel;
      const message = payload.message || undefined;

      let data = {};

      data.channel_id = id;

      if (message) {
        data.report_spam_message = message;
      }

      const blocked = await context.state.client.post('channel.block', data);

      if (blocked.ok) {
        return true;
      } else {
        return false;
      }
    },

    async unblockChannel(context, payload) {
      const { id } = payload.channel;

      const unblocked = await context.state.client.post('channel.unblock', {
        channel_id: id
      });

      if (unblocked.ok) {
        return true;
      } else {
        return false;
      }
    },

    // check single user
    async checkUser(context, payload) {
      // fetch channels
      const userInfo = await context.state.client.get(
        'user.info',
        { email: payload },
        true
      );

      if (userInfo.ok) {
        return userInfo.data.user;
      } else {
        return false;
      }
    },

    // channel groups
    async groupsList(context, payload) {
      const inMemoryGroups = store.get('groups');
      if (inMemoryGroups && inMemoryGroups.length > 0) {
        context.dispatch('_groupsList');
        window.parent.postMessage(
          { type: 'groups', data: inMemoryGroups },
          '*'
        );
        context.commit('group', inMemoryGroups);
      } else {
        await context.dispatch('_groupsList');
      }
    },

    async _groupsList(context, payload) {
      const response = await context.state.client.get('channel.group.list');
      if (response.ok) {
        let groups = response.data.groups;

        let expandedGroupsIds = store.get('expandedGroups') || {};

        groups.forEach(group => {
          //backwards compatibility
          let isGroupExpanded;

          let isGroupCollapsed_backwardsCompatibility = localStorage.getItem(
            `group-${group.id}`
          );
          if (isGroupCollapsed_backwardsCompatibility === 'true') {
            //group was collapsed
            isGroupExpanded = false;
            store.remove(`group-${group.id}`);
          } else if (isGroupCollapsed_backwardsCompatibility === 'false') {
            //group was expanded
            isGroupExpanded = true;
            store.remove(`group-${group.id}`);
          } else {
            //use new expanded system
            isGroupExpanded = expandedGroupsIds[group.id];
          }

          if (isGroupExpanded) {
            expandedGroupsIds[group.id] = isGroupExpanded;
          }
        });
        store.set('expandedGroups', expandedGroupsIds);
        context.commit('group', groups);
        context.commit('setExpandedGroups', expandedGroupsIds);
        return response;
      }
    },

    toggleGroupExpanded(context, payload) {
      context.commit('toggleGroupExpanded', payload);
    },

    // create a group
    async createChannelGroup(context, payload) {
      const { name } = payload;
      const response = await context.state.client.post('channel.group.create', {
        name
      });

      if (response.ok) {
        context.commit('addToGroup', response.data.channel_group);
        this.commit('core/addToast', {
          id: 'group.addChannels',
          content: `Successfully created "${payload.name}" group`,
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
        return response;
      }
    },

    // delete a group
    async deleteChannelGroup(context, payload) {
      const { id, channels } = payload;

      const response = await context.state.client.post('channel.group.delete', {
        channel_group_id: id
      });

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'group.delete',
          content: 'Successfully deleted the group',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });

        context.commit('updateUnreadMessagesBellowViewport', {
          type: 'remove_group',
          group_id: id
        });

        // update ui
        channels.forEach((channel, i) => {
          this.state.workers.channels.postMessage({
            type: 'onUpdateChannel',
            data: {
              id: channel.id,
              channel_group_id: null
            }
          });
        });

        return response;
      }
    },
    async renameChannelGroup(context, payload) {
      const response = await context.state.client.post(
        'channel.group.update',
        payload
      );
      if (response.ok) {
        this.commit('core/addToast', {
          id: 'group.rename',
          content: 'Successfully renamed the group',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
        return response;
      }
    },
    async addChannelsToGroup(context, payload) {
      let response = true;
      let { channel_group_id, channels } = payload;
      for await (const contents of channels.map(
        async channel_id =>
          await context.state.client.post('channel.group.add', {
            channel_group_id: Number(channel_group_id),
            channel_id: Number(channel_id)
          })
      )) {
        if (!contents.ok) response = false; // Update failed
      }
      if (response) {
        await context.dispatch('_list');
        this.commit('core/addToast', {
          id: 'channel.create',
          content: 'Successfully added channels the group',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
        return response;
      }
    },
    // favourite a channel
    async addToFav(context, payload) {
      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: payload.id,
          is_favorite: true
        }
      });

      const response = await context.state.client.post('channel.favorite', {
        channel_id: payload.id
      });

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'channel.favorite',
          content: 'Failed to pin channel to top',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });

        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: payload.id,
            is_favorite: false
          }
        });
      }

      return response.ok;
    },

    async removeFromFav(context, payload) {
      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: payload.id,
          is_favorite: false
        }
      });

      const response = await context.state.client.post('channel.unfavorite', {
        channel_id: payload.id
      });

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'channel.favorite',
          content: 'Failed to unpin channel',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });

        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: payload.id,
            is_favorite: true
          }
        });
      }

      return response.ok;
    },

    async removeFromGroup(context, payload) {
      const { channel_id, channel_group_id } = payload;

      // instantly react
      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: channel_id,
          channel_group_id: -1
        }
      });

      const response = await context.state.client.post(
        'channel.group.remove',
        payload
      );

      if (!response.ok) {
        // instantly react
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: channel_id,
            channel_group_id
          }
        });

        this.commit('core/addToast', {
          id: 'channel.group.remove',
          content: 'Failed to remove channel from group',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response.ok;
    },

    async addToGroup(context, payload) {
      const { channel_group_id, old_channel_group_id, channel_id } = payload;

      // instantly react
      this.state.workers.channels.postMessage({
        type: 'onUpdateChannel',
        data: {
          id: channel_id,
          channel_group_id
        }
      });

      const response = await context.state.client.post('channel.group.add', {
        channel_id,
        channel_group_id
      });

      // in case it goes wrong, but it back where it was
      if (!response.ok) {
        this.state.workers.channels.postMessage({
          type: 'onUpdateChannel',
          data: {
            id: channel_id,
            channel_group_id: old_channel_group_id
          }
        });
        this.commit('core/addToast', {
          id: 'channel.create',
          content: 'Failed to add channel to group',
          contentType: 'text',
          type: 'Danger',
          close: true,
          timeout: 3000
        });
      }

      return response.ok;
    },

    async cannotAddtoGroup(context) {
      this.commit('core/addToast', {
        id: 'channel.create',
        content: 'Cannot add to to Uncategorized Channels or Direct Messages',
        contentType: 'text',
        type: 'secondary',
        close: true,
        timeout: 3000
      });
    },

    async reorderGroups(context, payload) {
      let { group_id, after, toSwap } = payload;
      context.commit('reorderGroup', { toSwap });
      const response = await context.state.client.post('channel.group.move', {
        group_id,
        after
      });

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'channel.move',
          content: 'Cannot Re order groups',
          contentType: 'text',
          type: 'secondary',
          close: true,
          timeout: 3000
        });
      }
    },
    async transfer(context, payload) {
      const response = await context.state.client.post(
        'channel.transfer',
        payload
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'channel.transfer',
          content: payload.team_id
            ? 'Channel moved to team successfully.'
            : 'Channel removed from team successfully.',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'channel.transfer',
          content: 'Cannot attach channel to team.',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async joinOpenTeamChannel(context, payload) {
      const response = await context.state.client.post(
        'channel.team_join',
        payload
      );

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'channel.team_join',
          content: 'Cannot join to channel.',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    addMessageListener: (context, message) => {
      context.commit('addMessageListener', message);
    },

    // group events
    onGroupCreate(context, payload) {
      if (!context.state.groups.some(group => group.id === payload.id)) {
        context.commit('addToGroup', payload);
      }
    },

    onGroupDelete(context, payload) {
      if (context.state.groups.some(group => group.id === payload.id)) {
        context.commit('removeFromGroup', payload.id);
      }
    },

    onGroupUpdate(context, payload) {
      context.commit('renameGroup', payload);
    },

    onGroupReorder(context, payload) {
      context.commit('group', payload);
      store.set('groups', payload);
    },

    // clean channels data
    clear(context) {
      // instantly react
      this.state.workers.channels.postMessage({
        type: 'onClear'
      });
    }
  },
  getters: {
    getUserInChannel: state => (channel, id) => {
      return state.single[channel].member[id]
        ? state.single[channel].member[id]
        : {};
    },
    getChannelById: state => id => {
      let channel = _.find(state.all, { id: id });
      return channel ? channel : {};
    },
    getActualChannels: state => {
      return state.all ? state.all : [];
    },
    getUnreadCount: state => {
      if (state.all) {
        return state.all.reduce((total, item) => {
          return item.muted ? total : total + item.unread_count;
        }, 0);
      } else {
        return 0;
      }
    },
    getSiblingMembers: (state, getters, rootState, rootGetters) => {
      const currentUser = rootGetters['core/getUser']();

      let siblings = [];
      let siblingsMap = {};

      if (!state.all) return [];

      state.all.forEach(channel => {
        channel.members.forEach(member => {
          if (!siblingsMap[member.id] && member.id !== currentUser.id) {
            siblingsMap[member.id] = true;
            siblings.push({
              title: member.display_name,
              value: member.id,
              user: member
            });
          }
        });
      });

      return siblings;
    },
    getSortedMembers: state => (id, isPending) => {
      const channel = state.single[id];
      const members = state.single[id]
        ? state.single[id][!isPending ? 'members' : 'pending_members']
        : [];
      return _.orderBy(
        members,
        [
          user => user.id === channel.created_by,
          'user_role',
          user => user.display_name.toLowerCase()
        ],
        ['desc', 'desc', 'asc']
      );
    },

    getGroupedChannels: (state, getters, rootState, rootGetters) => {
      if (!state.sorted.switcher) return [];

      let groupMap = { all: [], dm: [], meeting: [] };
      let groupUnread = { all: 0, dm: 0 };
      let groupUnreadChannels = { all: {}, dm: {} }; //all: {<id>:channel}

      for (var i = 0; i < state.sorted.switcher.length; i++) {
        let channel = state.sorted.switcher[i];

        // check for ongoing meetings
        if (channel.meeting) {
          groupMap.meeting.push(channel);
        }

        // check if group exists
        if (!groupMap[channel.channel_group_id]) {
          groupMap[channel.channel_group_id] = [];
        }

        // check if unread exists
        if (!groupUnread[channel.channel_group_id]) {
          groupUnread[channel.channel_group_id] = 0;
        }

        // check if unread group exists
        if (!groupUnreadChannels[channel.channel_group_id]) {
          groupUnreadChannels[channel.channel_group_id] = {};
        }

        if (
          channel.channel_group_id != -1 &&
          groupMap[channel.channel_group_id]
        ) {
          groupMap[channel.channel_group_id].push(channel);
          if (!channel.muted) {
            groupUnread[channel.channel_group_id] += channel.unread_count;
            if (channel.unread_count)
              groupUnreadChannels[channel.channel_group_id][
                channel.id
              ] = channel;
          }
        } else if (channel.one_one) {
          groupMap.dm.push(channel);
          if (!channel.muted) {
            groupUnread.dm += channel.unread_count;
            if (channel.unread_count)
              groupUnreadChannels.dm[channel.id] = channel;
          }
        } else {
          groupMap.all.push(channel);
          if (!channel.muted) {
            groupUnread.all += channel.unread_count;
            if (channel.unread_count)
              groupUnreadChannels.all[channel.id] = channel;
          }
        }
      }

      let groups = [...state.groups];

      if (groupMap.meeting.length > 0) {
        groups = [
          {
            id: 'meeting',
            name: 'Ongoing Meetings',
            virtual: true,
            fixed: true
          },
          ...groups
        ];
      }

      // all channels
      return groups.map(group => {
        return {
          ...group,
          channels: groupMap[group.id],
          unread_count: groupUnread[group.id],
          unreadChannelsList: groupUnreadChannels[group.id],
          expanded:
            state.expandedGroupsIds[group.id] !== undefined
              ? state.expandedGroupsIds[group.id]
              : true
        };
      });
    },

    getSortedChannels: state => (id = 'switcher') => {
      let unreadChannelsList = {};
      let channels = state.sorted[id] || [];
      channels.forEach(channel => {
        if (!channel.muted && channel.unread_count > 0) {
          unreadChannelsList[channel.id] = channel;
        }
      });
      return {
        channels,
        unreadChannelsList
      };
    },
    getUnreadMessagesBellowViewport: state => {
      return state.unreadMessagesBellowViewport;
    },
    getChannelsBellowViewport: state => {
      return state.channelsBellowViewport;
    },
    getCollapsedGroupsBellowViewport: state => {
      return state.collapsedGroupsBellowViewport;
    },
    getUserPreferences: state => {
      return state.userPreferences;
    },
    isChannelMember: state => channel_id => {
      const channelIndex = _.findIndex(state.all, { id: channel_id });
      return channelIndex === -1 ? false : true;
    }
  }
};
