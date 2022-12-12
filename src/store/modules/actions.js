import Vue from 'vue';
import Vuex from 'vuex';

import _ from 'lodash';

import router from '../../router';

import AirSend from 'airsend/client';

Vue.use(Vuex);

import { parseMessages } from 'airsend/utils';

export default {
  namespaced: true,
  state: {
    channels: {},
    all: [],
    client: new AirSend(),
    highlightedAction: {},
    _timeoutHighlightAction: null,
    _temporaryIdIncrementer: 0,
    fullActionFilters: {
      searchQuery: '',
      sort: '3',
      action_status: 0,
      channel_id: 0,
      user_id: null,
      search: ''
    },
    isDragging: false,
    isUsingDragZone: false,
    isSubtaskDragContext: false, //used in kanban mode to lock the drag context
    fullActionPagination: {
      hasNextPage: true,
      hasBeforePage: true,
      itemsPerPage: 30,
      itemsFirstPage: 40
    }
  },
  mutations: {
    increaseTemporaryId: state => {
      state._temporaryIdIncrementer++;
    },
    set: (state, { channel_id, actions }) => {
      if (!state.channels[channel_id]) {
        Vue.set(state.channels, channel_id, []);
      }

      //preserve expanded and addSubtask
      actions.forEach(newAction => {
        newAction.meta = newAction.meta === undefined ? {} : newAction.meta;
        newAction.children.forEach(
          child => (child.meta = child.meta === undefined ? {} : child.meta)
        );
      });

      Vue.set(state.channels, channel_id, actions);
    },
    clearByChannel: (state, channelId) => {
      if (state.channels[channelId]) {
        Vue.delete(state.channels, channelId);
      }
    },
    setAllActions: (state, actions) => {
      if (actions.length >= state.fullActionPagination.itemsFirstPage) {
        Vue.set(state.fullActionPagination, 'hasNextPage', true);
      } else {
        Vue.set(state.fullActionPagination, 'hasNextPage', false);
      }

      //preserve expanded and addSubtask
      actions.forEach(newAction => {
        newAction.meta = newAction.meta === undefined ? {} : newAction.meta;
        newAction.children.forEach(
          child => (child.meta = child.meta === undefined ? {} : child.meta)
        );
      });
      Vue.set(state, 'all', actions);
    },
    appendAllActions: (state, payload) => {
      if (payload.actions.length >= state.fullActionPagination.itemsPerPage) {
        Vue.set(state.fullActionPagination, 'hasNextPage', true);
      } else {
        Vue.set(state.fullActionPagination, 'hasNextPage', false);
      }

      payload.actions.forEach(newAction => {
        newAction.meta = newAction.meta === undefined ? {} : newAction.meta;
        newAction.children.forEach(child =>
          child.meta === undefined ? {} : child.meta
        );
      });
      if (payload.after) {
        let appendIndex = _.findIndex(state.all, { id: payload.actions[0].id });
        if (appendIndex === -1) {
          Vue.set(state, 'all', state.all.concat(payload.actions));
        } else {
          let actions = _.cloneDeep(state.all);
          payload.actions.forEach((action, index) => {
            actions.splice(appendIndex + index, 1, action);
          });
          Vue.set(state, 'all', actions);
        }
      }
    },
    update: (state, payload) => {
      const { parent_id, channel_id, id } = payload;

      if (!payload.meta) {
        payload.meta = {};
      }
      payload.children.forEach(child => {
        if (!child.meta) {
          child.meta = {};
        }
      });

      if (parent_id) {
        const parentIndex = _.findIndex(state.channels[channel_id], {
          id: parent_id
        });
        if (parentIndex !== -1) {
          const index = _.findIndex(
            state.channels[channel_id][parentIndex].children,
            { id: id }
          );
          if (index !== -1)
            state.channels[channel_id][parentIndex].children.splice(
              index,
              1,
              payload
            );
        }

        const parentIndexAll = _.findIndex(state.all, { id: parent_id });
        if (parentIndexAll === -1) return;
        const indexAll = _.findIndex(state.all[parentIndexAll].children, {
          id: id
        });
        if (indexAll === -1) return;
        state.all[parentIndexAll].children.splice(indexAll, 1, payload);
      } else {
        const index = _.findIndex(state.channels[channel_id], { id: id });
        const oldAction = state.channels[channel_id][index];
        if (oldAction) {
          payload.meta = oldAction.meta;
        }
        Vue.set(state.channels[channel_id], index, payload);

        const indexAll = _.findIndex(state.all, { id: id });
        const oldActionAll = state.all[indexAll];
        if (oldActionAll) {
          payload.meta = oldActionAll.meta;
        }
        Vue.set(state.all, indexAll, payload);
      }
    },
    delete: (state, payload) => {
      const { parent_id, channel_id, action_id } = payload;

      if (parent_id) {
        const parentIndex = _.findIndex(state.channels[channel_id], {
          id: parent_id
        });
        if (parentIndex !== -1) {
          const index = _.findIndex(
            state.channels[channel_id][parentIndex].children,
            { id: action_id }
          );
          if (index !== -1) {
            state.channels[channel_id][parentIndex].children.splice(index, 1);
          }
        }

        const parentIndexAll = _.findIndex(state.all, { id: parent_id });
        if (parentIndexAll !== -1) {
          const indexAll = _.findIndex(state.all[parentIndexAll].children, {
            id: action_id
          });
          if (indexAll !== -1) {
            state.all[parentIndexAll].children.splice(indexAll, 1);
          }
        }
      } else {
        const index = _.findIndex(state.channels[channel_id], {
          id: action_id
        });
        if (index !== -1) {
          Vue.delete(state.channels[channel_id], index);
        }

        const indexAll = _.findIndex(state.all, { id: action_id });
        if (indexAll !== -1) {
          Vue.delete(state.all, indexAll);
        }
      }
    },
    add: (state, payload) => {
      const { channel_id, id, parent_id } = payload;
      if (!payload.meta) payload.meta = {};

      if (!state.channels[channel_id]) {
        Vue.set(state.channels, channel_id, []);
      }

      if (parent_id) {
        const parentActionIndex = _.findIndex(state.channels[channel_id], {
          id: parent_id
        });

        if (parentActionIndex === -1) {
          //if parent not exists, add as root
          state.channels[channel_id].unshift(payload);
        } else {
          const actionIndex = _.findIndex(
            state.channels[channel_id][parentActionIndex].children,
            { id: id }
          );

          if (actionIndex === -1) {
            state.channels[channel_id][parentActionIndex].children.unshift(
              payload
            );
          }
        }

        const parentActionIndexAll = _.findIndex(state.all, { id: parent_id });
        if (parentActionIndexAll === -1) {
          state.all.unshift(payload);
        } else {
          const actionIndexAll = _.findIndex(
            state.all[parentActionIndexAll].children,
            { id: id }
          );

          if (actionIndexAll === -1) {
            state.all[parentActionIndexAll].children.unshift(payload);
          }
        }
      } else {
        const index = _.findIndex(state.channels[channel_id], { id: id });

        if (index === -1) {
          state.channels[channel_id].unshift(payload);
        }

        const indexAll = _.findIndex(state.all, { id: id });
        if (indexAll === -1) {
          state.all.unshift(payload);
        }
      }
    },
    onActionMoved: (state, payload) => {
      const { parent, after, action_id, channel_id, previous_parent } = payload;

      //fix the parent_id of the moved action in the client that moved the action
      if (parent) {
        let _parentIndex = _.findIndex(state.channels[channel_id], {
          id: parent
        });
        if (_parentIndex >= 0) {
          let _actionIndex = _.findIndex(
            state.channels[channel_id][_parentIndex].children,
            { id: action_id }
          );
          if (_actionIndex >= 0) {
            Vue.set(
              state.channels[channel_id][_parentIndex].children[_actionIndex],
              'parent_id',
              parent
            );
            return;
          }
        }
      } else {
        let _actionIndex = _.findIndex(state.channels[channel_id], {
          id: action_id
        });
        if (_actionIndex >= 0) {
          Vue.set(state.channels[channel_id][_actionIndex], 'parent_id', null);
          return;
        }
      }

      //find & remove
      let action = null;
      let actionIndex = -1;

      if (previous_parent) {
        const previousParentIndex = _.findIndex(state.channels[channel_id], {
          id: previous_parent
        });
        if (previousParentIndex === -1) return; //already removed; cant find the action to move
        actionIndex = _.findIndex(
          state.channels[channel_id][previousParentIndex],
          { id: action_id }
        );
        if (actionIndex === -1) return;

        action = _.cloneDeep(
          state.channels[channel_id][previousParentIndex].children[actionIndex]
        );
        state.channels[channel_id][previousParentIndex].children.splice(
          actionIndex,
          1
        );
      } else {
        actionIndex = _.findIndex(state.channels[channel_id], {
          id: action_id
        });
        if (actionIndex === -1) return;

        action = _.cloneDeep(state.channels[channel_id][actionIndex]);
        state.channels[channel_id].splice(actionIndex, 1);
      }
      if (action === null) return;

      //insert
      let parentIndex = -1;
      let afterIndex = -1;
      if (parent) {
        parentIndex = _.findIndex(state.channels[channel_id], { id: parent });
      }
      if (after) {
        if (parentIndex === -1) {
          afterIndex = _.findIndex(state.channels[channel_id], { id: after });
        } else {
          afterIndex = _.findIndex(
            state.channels[channel_id][parentIndex].children,
            { id: after }
          );
        }
      }

      if (afterIndex !== -1 && parentIndex !== -1) {
        const actionAlreadyExists =
          _.findIndex(state.channels[channel_id][parentIndex].children, {
            id: action.id
          }) >= 0;
        if (actionAlreadyExists) return;
        state.channels[channel_id][parentIndex].children.splice(
          afterIndex + 1,
          0,
          action
        );
      } else if (parentIndex !== -1) {
        const actionAlreadyExists =
          _.findIndex(state.channels[channel_id][parentIndex].children, {
            id: action.id
          }) >= 0;
        if (actionAlreadyExists) return;
        state.channels[channel_id][parentIndex].children.unshift(action);
      } else if (afterIndex !== -1) {
        const actionAlreadyExists =
          _.findIndex(state.channels[channel_id], { id: action.id }) >= 0;
        if (actionAlreadyExists) return;
        state.channels[channel_id].splice(afterIndex + 1, 0, action);
      } else {
        const actionAlreadyExists =
          _.findIndex(state.channels[channel_id], { id: action.id }) >= 0;
        if (actionAlreadyExists) return;
        state.channels[channel_id].unshift(action);
      }
    },
    updateActionsList: (state, payload) => {
      if (payload.channel !== null) {
        Vue.set(state.channels, payload.channel.id, payload.value);
      } else {
        Vue.set(state, 'channels', payload.value);
      }
      //state.channels[payload.channel.id] = payload.value;
    },
    setMeta: (state, payload) => {
      const { parent_id, channel_id, id } = payload;
      const meta = _.cloneDeep(payload.meta) || {};

      if (parent_id) {
        const parentIndex = _.findIndex(state.channels[channel_id], {
          id: parent_id
        });
        if (parentIndex >= 0) {
          const index = _.findIndex(
            state.channels[channel_id][parentIndex].children,
            { id: id }
          );
          if (index >= 0)
            Vue.set(
              state.channels[channel_id][parentIndex].children[index],
              'meta',
              meta
            );
        }

        const parentIndexAll = _.findIndex(state.all, { id: parent_id });
        if (parentIndexAll === -1) return;
        const indexAll = _.findIndex(state.all[parentIndexAll].children, {
          id: id
        });
        if (indexAll >= 0)
          Vue.set(state.all[parentIndexAll].children[indexAll], 'meta', meta);
      } else {
        const index = _.findIndex(state.channels[channel_id], { id: id });
        if (index >= 0)
          Vue.set(state.channels[channel_id][index], 'meta', meta);

        const indexAll = _.findIndex(state.all, { id: id });
        if (indexAll >= 0) Vue.set(state.all[indexAll], 'meta', meta);
      }
    },
    setHighlightAction: (state, payload) => {
      if (!payload) {
        clearTimeout(state._timeoutHighlightAction);
        state.highlightedAction = {};
        return;
      }
      const { id, channel_id } = payload;
      let action = {};

      let actionIndex = _.findIndex(state.channels[channel_id], { id: id });
      let parentIndex = -1;
      if (actionIndex === -1) {
        state.channels[channel_id].forEach((_action, _parentIndex) => {
          let _actionIndex = _.findIndex(_action.children, { id: id });
          if (_actionIndex >= 0) {
            actionIndex = _actionIndex;
            parentIndex = _parentIndex;
            Vue.set(
              state.channels[channel_id][_parentIndex].meta,
              'expanded',
              true
            );
            action = _.cloneDeep(
              state.channels[channel_id][_parentIndex].children[actionIndex]
            );
            //Vue.set(state.channels[channel_id][_parentIndex].children[actionIndex].meta, 'highlighted', true);
          }
        });
      } else {
        action = _.cloneDeep(state.channels[channel_id][actionIndex]);
        //Vue.set(state.channels[channel_id][actionIndex].meta, 'highlighted', true)
      }
      if (action) {
        state.highlightedAction = action;
        clearTimeout(state._timeoutHighlightAction);
        state._timeoutHighlightAction = setTimeout(() => {
          state.highlightedAction = {};
        }, 12000);
      }
    },
    setFullActionFilters(state, value) {
      Vue.set(state, 'fullActionFilters', value);
    },
    setDragging(state, value) {
      Vue.set(state, 'isDragging', value);
    },
    setUsingDragZone(state, value) {
      Vue.set(state, 'isUsingDragZone', value);
    },
    setSubtaskDragContext(state, value) {
      Vue.set(state, 'isSubtaskDragContext', value);
    },

    //worker messages
    handleParsedHighlights(state, payload) {
      const { channel_id, actions } = payload;
      if (payload.channel_id) {
        this.commit('actions/set', { channel_id, actions });
      } else {
        this.commit('actions/appendAllActions', { actions, after: true });
      }
    }
  },
  actions: {
    async searchMentionableActions(context, filters) {
      const { channel_id, query } = filters;
      if (!query) return [];
      let payload = {
        channel_id,
        search: query || ''
      };

      const response = await context.state.client.get('action.search', payload);

      if (response.ok && response.data.results.length > 0) {
        let actions = response.data.results;

        return actions.map(action => {
          return {
            name: action.name,
            id: action.id
          };
        });
      }
      return [];
    },
    async get(context, filters) {
      if (
        filters.paginateAfter &&
        !context.state.fullActionPagination.hasNextPage
      )
        return;
      if (
        filters.paginateBefore &&
        !context.state.fullActionPagination.hasBeforePage
      )
        return;
      const { allActions } = filters;
      let payload = {};

      //filters and sorting
      if (filters.channel_id !== 0) payload.channel_id = filters.channel_id;
      if (filters.action_status !== null)
        payload.status = filters.action_status;
      if (filters.user_id !== null) payload.user_id = filters.user_id;
      if (filters.search !== '') payload.search = filters.search;

      if (filters.sort == 3 || filters.sort == 4) payload.sort_by = 'channel';
      else if (filters.sort == 1 || filters.sort == 2) payload.sort_by = 'name';
      else if (filters.sort == 5 || filters.sort == 6)
        payload.sort_by = 'due_date';

      if (filters.sort === 2 || filters.sort === 4 || filters.sort === 6)
        payload.sort_desc = true;

      //pagination and cursor
      if (filters.cursor) payload.cursor = btoa(filters.cursor);

      if (allActions) {
        payload.limit_after = context.state.fullActionPagination.itemsFirstPage;
        if (filters.paginateAfter) {
          payload.limit_after = context.state.fullActionPagination.itemsPerPage;
        }
      } else {
        payload.limit_after = 500;
      }

      //loaders
      if (filters.paginateAfter)
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading-after', status: true },
          { root: true }
        );
      else if (filters.paginateBefore)
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading-before', status: true },
          { root: true }
        );
      else {
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading', status: true },
          { root: true }
        );
      }

      // check public hash
      const { hash } = router.history.current.query;

      // fetch channel
      const response = await context.state.client.get(
        'action.list',
        { ...payload },
        hash ? hash : false
      );

      //disable loaders
      if (filters.paginateAfter)
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading-after', status: false },
          { root: true }
        );
      else if (filters.paginateBefore)
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading-before', status: false },
          { root: true }
        );
      else {
        context.commit(
          'loading/set',
          { endpoint: 'actions/loading', status: false },
          { root: true }
        );
      }

      //set data
      if (response.ok) {
        if (filters.paginateAfter && filters.allActions) {
          context.commit('appendAllActions', {
            //cursor: filters.cursor,
            after: true,
            actions: response.data.actions
          });
        } else {
          if (allActions)
            context.commit('setAllActions', response.data.actions);
          else {
            context.commit('set', {
              actions: response.data.actions,
              channel_id: payload.channel_id
            });
            context.commit('setAllActions', []);
          }
        }

        //parse message highlights
        this.state.workers.actions.postMessage({
          type: 'parseHighlights',
          data: {
            actions: response.data.actions,
            channel_id: allActions ? null : payload.channel_id,
            filters
          }
        });
      } else {
        // TODO: Handle API of or other possible errors
        this.commit('core/addToast', {
          id: 'action.get',
          content: { message: 'actions.toasts.failed-to-load' },
          contentType: 'text',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }
    },
    async activities(context, payload) {
      const { action_id } = payload;

      // check public hash
      const { hash } = router.history.current.query;

      // fetch action
      const response = await context.state.client.get(
        'action.history',
        { action_id },
        hash ? hash : false
      );

      if (response.ok) {
        let activities = response.data.history;

        if (activities && activities.length > 0) {
          activities.forEach(activity => {
            if (activity.attachments && activity.attachments.message) {
              activity.attachments.message = parseMessages(
                activity.attachments.message,
                context.rootState.channels.single[
                  router.history.current.params.id
                ]
              );

              context.dispatch(
                'channels/addMessageListener',
                activity.attachments.message,
                { root: true }
              );
            }
          });
        }

        return activities;
      } else {
        this.commit('core/addToast', {
          id: 'action.activities',
          content: { message: 'actions.toasts.failed-to-load-activities' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }
    },
    async info(context, payload) {
      const { action_id } = payload;

      // check public hash
      const { hash } = router.history.current.query;

      // fetch action
      const response = await context.state.client.get(
        'action.info',
        { action_id },
        hash ? hash : false
      );

      if (response.ok) {
        return response.data.action;
      } else {
        this.commit('core/addToast', {
          id: 'action.info',
          content: { message: 'actions.toasts.failed-to-load-details' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }
    },

    async move(context, payload) {
      let _payload = {};
      const { action_id } = payload;

      if (payload.after) {
        _payload.after = payload.after;
      }
      if (payload.under) {
        _payload.under = payload.under;
      }

      let response = await context.state.client.post(
        `action.move?action_id=${action_id}`,
        _payload
      );
      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'action.move',
          content: {
            message: 'actions.toasts.failed-to-move',
            meta: { actionName: payload.action_name }
          },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }
      return response;
    },

    async createTemporaryAction(context, payload) {
      let action = {
        id: context.state._temporaryIdIncrementer,
        channel_id: payload.channel_id,
        action_name: payload.action_name,
        action_desc: payload.action_desc,
        due_on_ts: payload.due_on_ts,
        due_on: payload.due_on,
        parent_id: payload.parent_id,
        children: [],
        users: payload.users,
        loading: true,
        action_status: 0
      };
      if (
        !context.getters['isSorting']() &&
        context.getters['fitInFilters'](action)
      ) {
        context.commit('add', action);
      }
      context.commit('increaseTemporaryId');
      return action;
    },

    async create(context, payload) {
      const temporaryAction = await context.dispatch(
        'createTemporaryAction',
        payload
      );

      let user_ids =
        (payload.user_ids && payload.user_ids.length) >= 1
          ? payload.user_ids.join(',')
          : '';

      let response = await context.state.client.post('action.create', {
        ...payload,
        action_status: 0,
        user_ids
      });

      context.commit('delete', {
        ...temporaryAction,
        action_id: temporaryAction.id
      });

      if (response.ok) {
        if (
          !context.getters['isSorting']() &&
          context.getters['fitInFilters'](temporaryAction)
        ) {
          context.commit('add', {
            ...response.data.action,
            parent_id: payload.parent_id
          });
        }
        if (context.state.fullActionFilters.action_status == 1) {
          context.dispatch('setFullActionFilters', {
            ...context.state.fullActionFilters,
            action_status: 0
          });
        }

        this.commit('core/addToast', {
          id: 'action.create',
          content: {
            message: 'actions.toasts.successfully-created',
            meta: { actionName: payload.action_name }
          },
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'action.create',
          content: {
            message: 'actions.toasts.failed-to-move',
            meta: { actionName: payload.action_name }
          },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    setMeta(context, payload) {
      context.commit('setMeta', payload);
      return;
    },

    async update(context, payload) {
      const { action_name, action_type } = payload;

      let request = {
        action_id: payload.id,
        action_type
      };

      if (payload.action_name !== undefined) {
        request.action_name = payload.action_name;
      }

      if (payload.channel_id !== undefined) {
        request.channel_id = payload.channel_id;
      }

      if (payload.action_desc !== undefined) {
        request.action_desc = payload.action_desc;
      }

      if (payload.action_status !== undefined) {
        request.action_status = payload.action_status;
      }

      if (payload.action_due_date !== undefined) {
        request.action_due_date = payload.action_due_date;
      }

      if (payload.user_ids) {
        request.user_ids =
          payload.user_ids.length >= 1 ? payload.user_ids.join(',') : '';
      }

      let response = await context.state.client.post('action.update', request);

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'action.update',
          content: {
            message: 'actions.toasts.successfully-updated',
            meta: { actionName: action_name }
          },
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'action.update',
          content: {
            message: 'actions.toasts.failed-to-update',
            meta: { actionName: action_name }
          },
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }

      return response;
    },

    async delete(context, payload) {
      const { id, channel_id, parent_id } = payload;

      const backupAction = _.cloneDeep(
        context.getters['getActionById']({ id, channel_id, parent_id })
      );
      if (backupAction) {
        context.commit('delete', { action_id: id, channel_id, parent_id });
      }

      let response = await context.state.client.post('action.delete', {
        action_id: id
      });

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'action.delete',
          content: {
            message: 'actions.toasts.successfully-deleted'
          },
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        if (backupAction) {
          if (
            !context.getters['isSorting']() &&
            context.getters['fitInFilters'](backupAction)
          ) {
            context.commit('add', backupAction);
          }
        }
        this.commit('core/addToast', {
          id: 'action.delete',
          content: {
            message: 'actions.toasts.failed-to-delete'
          },
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }

      return response;
    },
    onActionUpdated(context, payload) {
      const { action, channel_id, old_channel_id } = payload;
      const fitInFilters = context.getters['fitInFilters'](action);
      const isSorting = context.getters['isSorting']();

      if (channel_id === old_channel_id) {
        if (fitInFilters || action.parent_id) {
          if (!isSorting) {
            context.commit('update', action);
          } else {
            const filters = context.state.fullActionFilters;
            context.dispatch('get', {
              ...filters,
              paginateAfter: false,
              paginateBefore: false,
              cursor: null
            });
            return;
          }
        }

        if (!isSorting && action.parent_id) {
          //after edit, maybe parent doesn't fit to filters
          const parent = context.getters['getParent'](action);
          const parentFitInFilters = context.getters['fitInFilters'](parent);
          if (parent && !parentFitInFilters) {
            context.commit('setMeta', {
              ...parent,
              meta: { ...parent.meta, removeTaskAnimation: true }
            });
            setTimeout(() => {
              context.commit('delete', {
                ...parent,
                channel_id: parent.channel_id,
                action_id: parent.id
              });
            }, 500);
          }
        }

        if (!fitInFilters && !action.parent_id) {
          context.commit('setMeta', {
            ...action,
            meta: { ...action.meta, removeTaskAnimation: true }
          });
          setTimeout(() => {
            context.commit('delete', {
              ...action,
              channel_id: action.channel_id,
              action_id: action.id
            });
          }, 500);
        }
      } else {
        context.commit('delete', {
          ...action,
          channel_id: old_channel_id,
          action_id: action.id
        });
      }
    },

    onActionAdded(context, payload) {
      const { channel_id, action } = payload;

      // check if event came before the API return
      if (context.state.channels && context.state.channels[channel_id]) {
        const actions = context.state.channels[channel_id];
        const sendingActions = actions.filter(action => action.loading);
        const sendingActionWithSameName = _.findIndex(sendingActions, {
          action_name: action.action_name
        });
        if (sendingActionWithSameName >= 0) {
          setTimeout(() => {
            context.dispatch('onActionAdded', payload);
          }, 500);
          return;
        }
      }

      const fitInFilters = context.getters['fitInFilters'](action);
      const isSorting = context.getters['isSorting']();
      const actionAlreadyExists =
        context.getters['getActionById'](payload.action) ||
        context.getters['getActionById']({
          ...payload.action,
          id: context.state._temporaryIdIncrementer - 1
        });
      if (!isSorting && fitInFilters) {
        context.commit('add', {
          ...action,
          meta: { newTaskAnimation: !actionAlreadyExists }
        });
        setTimeout(() => {
          context.commit('setMeta', {
            ...action,
            meta: { ...action.meta, newTaskAnimation: false }
          });
        }, 300);
      } else if (isSorting) {
        const filters = context.state.fullActionFilters;
        context.dispatch('get', {
          ...filters,
          paginateAfter: false,
          paginateBefore: false,
          cursor: null
        });
      }

      if (!isSorting && action.parent_id) {
        //after add, maybe parent doesn't fit to filters
        const parent = context.getters['getParent'](action);
        if (parent && !context.getters['fitInFilters'](parent)) {
          context.commit('delete', {
            ...parent,
            channel_id: parent.channel_id,
            action_id: parent.id
          });
        }
      }

      // update channel cont
      const channel = this.getters['channels/getChannelById'](channel_id);

      this.commit('channels/update', {
        id: channel_id,
        action_count: channel.action_count + 1
      });
    },
    onActionDeleted(context, payload) {
      context.commit('setMeta', {
        ...payload,
        id: payload.action_id,
        meta: { removeTaskAnimation: true }
      });
      setTimeout(() => {
        context.commit('delete', payload);
      }, 500);
    },
    updateActionsList: ({ commit }, payload) => {
      commit('updateActionsList', payload);
    },
    setHighlightAction(context, payload) {
      context.commit('setHighlightAction', payload);
    },
    setFullActionFilters(context, value) {
      context.commit('setFullActionFilters', value);
    },
    setDragging(context, value) {
      context.commit('setDragging', value);
    },
    setUsingDragZone(context, value) {
      context.commit('setUsingDragZone', value);
    }
  },
  getters: {
    getActionsByChannel: state => channel => {
      return state.channels[channel] || [];
    },
    getActionById: state => params => {
      const { parent_id, id, channel_id } = params;

      if (parent_id) {
        const parentIndex = _.findIndex(state.channels[channel_id], {
          id: parent_id
        });
        if (parentIndex == -1) return null;
        const index = _.findIndex(
          state.channels[channel_id][parentIndex].children,
          { id: id }
        );
        if (index == -1) return null;
        return state.channels[channel_id][parentIndex].children[index];
      } else {
        const index = _.findIndex(state.channels[channel_id], { id: id });
        if (index == -1) return null;
        return state.channels[channel_id][index];
      }
    },
    getAllActions: state => payload => {
      const channelsWithActions = _.cloneDeep(state.channels);
      let actions = [];

      for (const channelId in channelsWithActions) {
        let _actions = channelsWithActions[channelId];
        actions = actions.concat(_actions);
      }
      return actions;
    },
    fitInFilters: state => action => {
      const filters = state.fullActionFilters;

      //status
      if (filters.action_status !== null) {
        const hasChildrenIncomplete = action.children.some(
          child => child.action_status == 0
        );
        if (
          (filters.action_status == 1 && hasChildrenIncomplete) ||
          (filters.action_status == 1 && action.action_status == 0)
        )
          return false;
        if (
          filters.action_status == 0 &&
          action.action_status == 1 &&
          !hasChildrenIncomplete
        )
          return false;
      }

      //user
      if (filters.user_id !== null) {
        const isUserAssignedInChild = action.children.some(child =>
          isUserAssigned(child, filters.user_id)
        );
        const _isUserAssigned = isUserAssigned(action, filters.user_id);
        if (!_isUserAssigned && !isUserAssignedInChild) {
          return false;
        }
      }

      //channel
      if (
        filters.channel_id !== 0 &&
        filters.channel_id !== action.channel_id
      ) {
        return false;
      }
      return true;
    },
    isSorting: state => () => {
      return state.fullActionFilters.sort != 3;
    },
    getParent: state => action => {
      let parentIndex = _.findIndex(state.all, { id: action.parent_id });
      let parent;
      if (parentIndex == -1) {
        parentIndex = _.findIndex(state.channels[action.channel_id], {
          id: action.parent_id
        });
        if (parentIndex == -1) return false;
        parent = state.channels[action.channel_id][parentIndex];
      } else {
        parent = state.all[parentIndex];
      }
      return parent;
    }
  }
};

function isUserAssigned(action, user_id) {
  return _.findIndex(action.users, { id: user_id }) > -1;
}
