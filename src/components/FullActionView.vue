<template>
  <div class="full-action-view">
    <div class="action-container col-12 p-0 fullheight">
      <div class="full-action-view-action-header">
        <Toaster />
        <div class="first-line">
          <div class="first-line-content">
            <div class="form-group">
              <label for="users-filter">Status</label>
              <select
                name="users-filter"
                class="form-control"
                v-model="fullActionFilters.action_status"
              >
                <option :value="null">{{ $t('actions.all-actions') }}</option>
                <option :value="1">{{ $t('actions.status-completed') }}</option>
                <option :value="0">{{ $t('actions.status-open') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="channels-filter">{{ $t('general.channels') }}</label>
              <select
                name="channels-filter"
                class="form-control"
                v-model="fullActionFilters.channel_id"
                ref="channel_selector"
              >
                <option :value="0">All channels</option>
                <option
                  :value="channel.id"
                  v-for="channel in channels"
                  :key="`option-channel-${channel.id}`"
                >
                  {{ channel.channel_name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="sort-actions-by">{{
                $t('channels.filters.sort-by')
              }}</label>
              <select
                name="sort-actions-by"
                class="form-control"
                v-model="fullActionFilters.sort"
              >
                <option :value="3">{{ $t('general.channels') }}</option>
                <option :value="4"
                  >{{ $t('general.channels') }} -
                  {{ $t('actions.descending') }}</option
                >
                <option :value="1">{{ $t('general.name') }}</option>
                <option :value="2"
                  >{{ $t('general.name') }} -
                  {{ $t('actions.descending') }}</option
                >
                <option :value="5">{{ $t('general.due-date') }}</option>
                <option :value="6"
                  >{{ $t('general.due-date') }} -
                  {{ $t('actions.descending') }}</option
                >
              </select>
            </div>
          </div>
        </div>
        <div class="second-line">
          <AddAction
            ref="addActionComponent"
            :channel_id="fullActionFilters.channel_id"
            :tooltip="$t('actions.add-task-tip')"
          />

          <div class="mode-switch">
            <button
              class="btn btn-icon"
              @click="setContext('table')"
              :class="{ active: context === 'table' }"
            >
              <Icon family="fal" name="list-alt" />
            </button>
            <button
              class="btn btn-icon"
              v-if="fullActionFilters.channel_id !== 0"
              @click="setContext('grid')"
              :class="{ active: context === 'grid' }"
            >
              <Icon family="fal" name="th" />
            </button>
            <button
              class="btn btn-icon"
              v-else
              v-tooltip="{ content: 'Available only inside a channel' }"
              @click="setFocusToChannelFilter"
              :class="{ active: context === 'grid' }"
            >
              <Icon family="fal" name="th" />
            </button>
          </div>

          <div class="search">
            <div class="form-group row">
              <input
                ref="input"
                v-model="fullActionFilters.search"
                class="form-control form-control--rounded form-control-sm"
                type="text"
                :placeholder="$t('actions.search-actions')"
                aria-label="Search"
              />
              <Icon family="far" name="search" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="isActionsEmpty" class="empty-wrapper">
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
              @click="addActionFocus"
              class="btn btn-primary mx-2"
              v-if="user.role.can('action.create')"
            >
              {{ $t('actions.add-action') }}
            </button>
          </div>
        </div>
      </div>
      <div
        v-else-if="context === 'grid'"
        class="full-action-view-actions-body-grid-wrapper"
      >
        <div
          class="full-action-view-actions-body full-action-view-actions-body-grid"
        >
          <GridActionsByChannel :channel_id="fullActionFilters.channel_id" />
        </div>
      </div>
      <TableActions v-else />
    </div>
  </div>
</template>

<script>
import NestedTask from './Tasks/NestedTask';
import AddAction from './Tasks/AddAction';
import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader.vue';
import Toaster from 'airsend/components/Toaster.vue';
import _ from 'lodash';
import { parseFilter, parseQueryFilter } from 'airsend/utils';
export default {
  data() {
    return {
      context: 'table',
      filtersLoaded: false
    };
  },
  computed: {
    isActionsEmpty() {
      if (this.loading) return false;
      if (this.context === 'table') {
        return this.$store.state.actions.all.length === 0;
      } else {
        return (
          this.$store.getters['actions/getActionsByChannel'](
            this.fullActionFilters.channel_id
          ) &&
          this.$store.getters['actions/getActionsByChannel'](
            this.fullActionFilters.channel_id
          ).length === 0
        );
      }
    },
    fullActionFilters: {
      get() {
        return this.$store.state.actions.fullActionFilters;
      },
      set(value) {
        this.$store.dispatch('actions/setFullActionFilters', value);
      }
    },
    loading() {
      return this.$store.state.loading['actions/loading'];
    },
    channels() {
      return this.$store.state.channels.all;
    },
    allowUserSort() {
      return this.fullActionFilters.sort == 0;
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.fullActionFilters.channel_id
      );
    }
  },
  methods: {
    async load() {
      this.context = this.$route.name === 'actions' ? 'table' : 'grid';
      if (this.$route.name == 'actions') {
        const filters = this.parseFilter(this.$route.query);
        await this.$store.dispatch('actions/setFullActionFilters', filters);
      }
      this.filtersLoaded = true;

      if (this.context == 'table') this.fetchTasks();
    },
    parseFilter,
    parseQueryFilter,
    setContext(type) {
      this.context = type;
    },
    showAllActions() {
      this.$store.dispatch('actions/setFullActionFilters', {
        search: '',
        sort: '0',
        action_status: null,
        channel_id: 0
      });
    },
    setFocusToChannelFilter() {
      this.$refs['channel_selector'].focus();
    },
    addActionFocus() {
      this.$refs.addActionComponent.$refs['action_name'].focus();
    },
    async fetchTasks(cursor = null) {
      const queryFilters = this.parseQueryFilter(this.fullActionFilters);

      if (
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

      filters.allActions = this.context === 'table';
      filters.cursor = cursor;
      filters.paginateAfter = false;
      filters.paginateBefore = false;

      this.$store.dispatch('actions/get', filters);
    },
    debouncedFetchTasks: _.debounce(function() {
      this.fetchTasks();
    }, 400)
  },
  components: {
    AddAction,
    GridActionsByChannel: () => import('./Tasks/GridActionsByChannel'),
    TableActions: () => import('./Tasks/TableActions'),
    Loader,
    NestedTask,
    Icon,
    Toaster
  },
  watch: {
    $route(to, from) {
      if (!_.isEqual(from.query, to.query)) {
        //query changed
        this.fullActionFilters = this.parseFilter(to.query);
      }
    },
    'fullActionFilters.search'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.debouncedFetchTasks();
      }
    },
    'fullActionFilters.channel_id'(value, oldValue) {
      if (value == 0) {
        this.context = 'table';
      }
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks();
      }
    },
    'fullActionFilters.action_status'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks();
      }
    },
    'fullActionFilters.sort'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks();
      }
    },
    'fullActionFilters.user_id'(value, oldValue) {
      if (value != oldValue && this.filtersLoaded) {
        this.fetchTasks();
      }
    },
    context() {
      if (this.filtersLoaded) this.fetchTasks();
    }
  },
  created() {
    this.load();
  }
};
</script>

<style></style>
