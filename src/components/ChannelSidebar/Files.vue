<template>
  <div v-if="active" class="sidebar-tab sidebar-tab-files">
    <TabHeader
      @onUpload="onClickUpload"
      context="files"
      :value="filters"
      @input="onUpdateFilters"
      @onFullView="openExplorerModal"
    />
    <div class="sidebar-tab-body">
      <div class="tabbed--wrapper">
        <ul class="nav nav-pills nav-fill nav-justified">
          <li class="nav-item">
            <a
              class="nav-link py-3"
              :class="{ active: currentTab === 'media' }"
              @click="switchTab('media')"
              >{{ $t('files.tabs.media') }}</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link py-3"
              :class="{ active: currentTab === 'files' }"
              @click="switchTab('files')"
              >{{ $t('files.tabs.files') }}</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link py-3"
              :class="{ active: currentTab === 'links' }"
              @click="switchTab('links')"
              >{{ $t('files.tabs.links') }}</a
            >
          </li>
        </ul>
        <div
          class="tabbed--content tabbed--content-media"
          v-if="currentTab === 'media'"
        >
          <FileExplorer
            context="media"
            key="media"
            :initial-path="channelPath"
            :initial-path-name="channel.channel_name"
            :root-path="channelPath"
            :root-path-name="channel.channel_name"
            ref="fileExplorer"
            has-history
            @onBrowse="onBrowse"
            v-if="initialPath"
          />
        </div>
        <div
          class="tabbed--content tabbed--content-files"
          v-if="currentTab === 'files'"
        >
          <FileExplorer
            :context="filters.gridView ? 'gridFiles' : 'files'"
            key="files"
            :initial-path="initialPath"
            :initial-path-name="channel.channel_name"
            :root-path="channelPath"
            :root-path-name="channel.channel_name"
            ref="fileExplorer"
            has-history
            @onBrowse="onBrowse"
            v-if="initialPath"
          />
        </div>
        <div
          class="tabbed--content tabbed--content-links"
          v-if="currentTab === 'links'"
        >
          <LinksList v-if="channel && Object.keys(channel).length" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Icon from 'airsend/components/Icon';
import TabHeader from './TabHeader';
import FileExplorer from '../Files/FileExplorer.vue';
import LinksList from '../Files/Links/List';
import store from 'store';

import { parseFilesQueryFilter, parseFileFilter } from 'airsend/utils';

export default {
  components: {
    Icon,
    TabHeader,
    FileExplorer,
    LinksList
  },
  props: {
    active: Boolean
  },
  data() {
    return {
      currentTab: 'media',
      currentPath: '',
      initialPath: '',
      initialPathName: ''
    };
  },
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id] || {};
    },
    filters() {
      return this.$store.state.files.filesContext;
    },
    channelPath() {
      if (!this.channel || !Object.keys(this.channel).length) return '';
      const root = _.find(this.channel.channel_roots, { type: 'files' });
      return root.location;
    },
    user() {
      return this.$store.state.core.user;
    }
  },
  methods: {
    load() {
      const { pathMatch } = this.$route.params;

      // has history
      if (pathMatch) {
        // mount path
        this.initialPath = `${this.channelPath}/${pathMatch}`;

        // get current folder name
        let splitted = this.initialPath.split('/');
        this.initialPathName = splitted[splitted.length - 1];
      } else {
        this.initialPath = this.channelPath;
        this.initialPathName = this.channel.channel_name;
      }
    },
    isLoadingPath(path, type) {
      return this.$store.state.loading[`file.list/loading-${path}-${type}`];
    },
    onClickUpload() {
      this.$refs.fileExplorer.openFileChooser();
    },
    onUpdateFilters({ type, value }) {
      if (type === 'search') {
        this.$store.dispatch('files/setContext', { search: value.search });
        this.debouncedUpdateQueryFilters();
      } else if (type === 'sort_by') {
        this.$store.dispatch('files/setContext', { sort_by: value.sort_by });
        this.updateQueryFilters();
      } else if (type === 'gridView') {
        store.set('settings.files.gridView', value.gridView);
        this.$store.dispatch('files/setContext', { gridView: value.gridView });
      }
    },
    switchTab(tabName) {
      this.currentTab = tabName;

      if (tabName === 'media') {
        this.$store.dispatch('files/setContext', { type: 'media' });
      }
      if (tabName === 'links') {
        this.$store.dispatch('files/setContext', { type: 'links' });
        this.updateQueryFilters();
      }
      if (tabName === 'files') {
        this.$store.dispatch('files/setContext', { type: '' });
      }
    },
    onBrowse({ path, name, breadcrumb }) {
      this.currentPath = path;
      this.updateQueryFilters();
    },
    debouncedUpdateQueryFilters: _.debounce(function() {
      this.updateQueryFilters();
    }, 300),
    updateQueryFilters() {
      const queryFilters = this.parseQueryFilter(
        this.filters,
        this.currentPath,
        this.channelPath
      );

      if (!_.isEqual(this.$route.query, queryFilters)) {
        this.$router.push({ query: queryFilters }).catch(() => {});
      }
    },
    loadFiltersFromQuery() {
      let queryFilters = this.parseFilter(this.$route.query);
      this.currentTab = queryFilters.filters.type || 'files';

      this.$store.dispatch('files/setContext', queryFilters.filters);
      if (!_.isEqual(this.$route.query, queryFilters)) {
        if (
          (this.currentPath && this.filters.type === 'media') ||
          this.filters.type === ''
        ) {
          if (!this.isLoadingPath(this.currentPath, this.filters.type)) {
            this.$store.dispatch('files/get', { path: this.currentPath });
          }
        } else if (this.filters.type === 'links')
          this.$store.dispatch(
            'files/getLinks',
            this.channel.id || this.$route.params.id
          );
      }
    },
    openExplorerModal() {
      this.$modal.show('full-manager');
    },

    parseQueryFilter: parseFilesQueryFilter,
    parseFilter: parseFileFilter
  },
  mounted() {
    this.$nextTick(() => {
      this.load();
      this.loadFiltersFromQuery();
    });
  },
  watch: {
    $route: {
      handler(to, from) {
        if (!this.active) return;

        const { pathMatch } = to.params;

        // has history
        if (pathMatch) {
          this.initialPath = `${this.channelPath}/${pathMatch}`;
        } else {
          this.initialPath = this.channelPath;
        }

        this.loadFiltersFromQuery();
      }
    },
    active(shouldLoad) {
      if (shouldLoad) {
        this.load();
      }
    }
  }
};
</script>
