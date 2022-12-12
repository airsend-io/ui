<template>
  <div v-if="active" class="sidebar-tab sidebar-tab-actions">
    <div>
      <TabHeader
        @onFullView="openFullView"
        context="actions"
        :value="fullActionFilters"
        @input="onUpdateFilters"
      />
      <div class="sidebar-tab-body">
        <AddAction
          ref="addActionComponent"
          :channel_id="channel.id"
          v-if="user.role.can('action.create')"
          :tooltip="$t('actions.add-task-tip')"
        />

        <div v-if="isActionsEmpty && !loading" class="empty-wrapper">
          <div class="empty-box">
            <Icon family="fal" name="bolt" />
            <h4>{{ $t('actions.no-actions') }}</h4>
            <p v-if="user.role.can('action.create')">
              {{ $t('actions.no-actions-description') }}
            </p>
            <p v-else>
              {{ $t('actions.create-actions-unauthorized') }}
            </p>
            <div class="row">
              <button
                v-if="contextActions.length"
                @click="showAllActions"
                class="btn btn-outline-primary mx-2"
              >
                {{ $t('actions.show-all') }}
              </button>
              <button
                @click="addActionFocus"
                class="btn btn-primary mx-2"
                v-if="user.role.can('action.create')"
              >
                {{ $t('actions.add-action') }}
              </button>
            </div>
          </div>
        </div>

        <NestedTask
          v-else
          v-model="contextActions"
          root
          :allow-sort="allowUserSort"
          class="task-list-wrapper"
          context="tab"
          :channel="channel"
          :showCompleted="fullActionFilters.action_status == 1"
        />
      </div>
    </div>
    <ActionFullViewModal
      @closed="isFullViewOpened = false"
      @opened="isFullViewOpened = true"
    />
  </div>
</template>
<script>
import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader';
import Popover from 'airsend/components/Popover.vue';
import ActionFullViewModal from '../Modals/ActionFullViewModal';
import AddAction from '../Tasks/AddAction';
import moment from 'moment';
import NestedTask from '../Tasks/NestedTask.vue';
import _ from 'lodash';
import Fuse from 'fuse.js';
import { EventBus } from 'airsend/event-bus';
import { parseFilter, parseQueryFilter } from 'airsend/utils';
import TabHeader from './TabHeader';

export default {
  components: {
    Icon,
    NestedTask,
    Loader,
    Popover,
    AddAction,
    ActionFullViewModal,
    TabHeader
  },
  props: {
    active: Boolean
  },
  data() {
    return {
      currentAction: null,
      currentActionTab: 'all',
      isFullViewOpened: false,
      filtersLoaded: false
    };
  },
  computed: {
    showCompletedActionsBubble() {
      return this.contextActions.some(action => {
        if (action.meta.hide) {
          return true;
        } else {
          return action.children.some(child => {
            return child.meta.hide;
          });
        }
      });
    },
    fullActionFilters: {
      get() {
        return this.$store.state.actions.fullActionFilters;
      },
      set(value) {
        this.$store.dispatch('actions/setFullActionFilters', value);
      }
    },
    isActionsEmpty() {
      return this.contextActions.every(action => action.meta.hide === true);
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    contextActions: {
      get() {
        let actions;
        if (!this.channel) actions = [];
        else {
          actions = this.$store.getters['actions/getActionsByChannel'](
            this.channel.id
          );
        }

        if (!actions) return [];
        actions.forEach(action => {
          if (!action.meta) {
            action.meta = {};
          }
          action.meta.hide = false;
        });

        actions.forEach(action => {
          if (action.meta.expanded === undefined) {
            action.meta.expanded = action.meta.hasRelevantChildren;
          }
        });

        return actions;
      },
      set(value) {
        this.$store.dispatch('actions/updateActionsList', {
          channel: this.channel,
          value: value
        });
      }
    },
    allowUserSort() {
      return (
        this.user.id != undefined &&
        this.fullActionFilters.sort == 3 &&
        this.user.role.can('action.update')
      );
    },
    loading() {
      return this.$store.state.loading['actions/loading'];
    }
  },
  methods: {
    onUpdateFilters(e) {
      console.log(e);
    },
    async load() {
      const filters = this.parseFilter(this.$route.query);
      await this.$store.dispatch('actions/setFullActionFilters', filters);
      if (!this.filtersLoaded) {
        this.filtersLoaded = true;
        this.fetchTasks();
      }
    },
    actionCompleted() {
      const el = document.getElementById('completed-only-button');
      el.classList.add('new-action-completed');
      setTimeout(() => {
        el.classList.remove('new-action-completed');
      }, 2500);
    },
    parseFilter,
    parseQueryFilter,
    async fetchTasks(source) {
      if (this.isFullViewOpened) return;

      const queryFilters = this.parseQueryFilter(this.fullActionFilters);
      if (
        this.$route.params.resource === 'actions' &&
        !_.isEqual(
          {
            ...this.$route.query,
            channel: parseInt(this.$route.query.channel)
          },
          { ...queryFilters, channel: parseInt(queryFilters.channel) }
        )
      )
        this.$router.push({ query: queryFilters });

      let filters = this.fullActionFilters;

      filters.allActions = false;
      filters.paginateAfter = false;
      filters.paginateBefore = false;
      filters.channel_id = parseInt(this.$route.params.id);

      this.$store.dispatch('actions/get', filters);
    },
    debouncedFetchTasks: _.debounce(function() {
      this.fetchTasks('search');
    }, 400),
    getUser(id) {
      return this.$store.getters['channels/getUserInChannel'](
        this.channel.id,
        id
      );
    },
    showAllActions() {
      this.filter = {
        searchQuery: '',
        showCompleted: true,
        myActionsOnly: false,
        sortByDueDate: false
      };
    },
    toggleSortByDue() {
      const filters = this.fullActionFilters;
      if (filters.sort != 5 && filters.sort != 6) {
        this.fullActionFilters.sort = 5;
      } else if (filters.sort == 5) this.fullActionFilters.sort = 6;
      else if (filters.sort == 6) this.fullActionFilters.sort = 3;
    },
    addActionFocus() {
      this.$refs.addActionComponent.$refs['action_name'].focus();
    },
    openFullView() {
      this.$modal.show('action-full-view-modal');
    }
  },
  watch: {
    $route(to, from) {
      if (!this.active) return;
      if (from.params.id !== to.params.id || from.name !== 'channel') {
        //channel changed
        this.load();
      } else if (!_.isEqual(from.query, to.query) && !this.isFullViewOpened) {
        //query changed
        this.fullActionFilters = this.parseFilter(to.query);
      }
    },
    active(newer) {
      if (newer) this.load();
    },
    async isFullViewOpened(isOpen) {
      if (isOpen == false) {
        this.filtersLoaded = false;
        const filters = this.parseFilter({
          ...this.$route.query,
          channel: null
        });
        await this.$store.dispatch('actions/setFullActionFilters', filters);
        this.filtersLoaded = true;
        this.fetchTasks();
      }
    },
    'fullActionFilters.search'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.debouncedFetchTasks();
      }
    },
    'fullActionFilters.channel_id'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks('channel');
      }
    },
    'fullActionFilters.action_status'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks('status');
      }
    },
    'fullActionFilters.sort'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks('sort');
      }
    },
    'fullActionFilters.user_id'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks('user');
      }
    }
  },
  mounted() {
    if (this.active) {
      this.load();
    }
    EventBus.$on('action-completed', this.actionCompleted);
  },
  destroyed() {
    EventBus.$off('action-completed');
  }
};
</script>
