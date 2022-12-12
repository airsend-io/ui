<template>
  <div
    class="file-explorer file-explorer-files"
    v-if="isFilesContext || isGridFilesContext"
  >
    <div class="file-explorer-header">
      <a
        v-if="this.breadcrumb && this.breadcrumb.length > 1"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.tooltips.file-explorer-header-breadcrumb-back')
        }"
        class="btn btn-icon"
        @click="() => this.$refs.fileList.goBack()"
      >
        <Icon family="fas" name="chevron-left" />
      </a>

      <div class="file-explorer-title">{{ currentPathName }}</div>

      <v-popover v-if="user.role.can('file.upload')">
        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.more-options')
          }"
          class="btn btn-icon"
        >
          <Icon family="fas" name="ellipsis-h" />
        </button>
        <template slot="popover">
          <div class="dropdown-items">
            <button
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="() => this.$refs.fileList.openCreateFolder()"
            >
              <Icon family="fal" name="folder-plus" />
              {{ $t('files.more-options.file-explorer-header-create-folder') }}
            </button>
            <button
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="onDownloadFolder"
            >
              <Icon family="fal" name="download" />
              {{
                $t('files.more-options.file-explorer-header-download-folder')
              }}
            </button>
          </div>
        </template>
      </v-popover>
    </div>

    <FileList
      ref="fileList"
      :select-only="$route.params.hash !== undefined"
      :initial-path="initialPath"
      :initial-path-name="initialPathName"
      :root-path="rootPath"
      :root-path-name="rootPathName"
      :has-history="hasHistory"
      lock-initial
      simplified
      @browse="onBrowse"
      @paginate="fetchPage"
      v-if="currentPath && isFilesContext"
    />

    <GridFileList
      ref="fileList"
      :select-only="$route.params.hash !== undefined"
      :initial-path="initialPath"
      :initial-path-name="initialPathName"
      :root-path="rootPath"
      :root-path-name="rootPathName"
      :has-history="hasHistory"
      lock-initial
      simplified
      v-if="currentPath && isGridFilesContext"
      @browse="onBrowse"
      @paginate="fetchPage"
    />

    <Modal
      name="full-manager"
      title="Files"
      class="full-modal-explorer"
      @before-open="onOpenModal"
      @closed="onCloseModal"
    >
      <FullFileExplorer
        v-if="isModalOpen"
        :initial-path="currentPath"
        :no-history="true"
      />
    </Modal>
  </div>
  <div class="file-explorer file-explorer-media" v-else-if="isMediaContext">
    <GridFileList
      ref="fileList"
      :select-only="$route.params.hash !== undefined"
      :initial-path="initialPath"
      :initial-path-name="initialPathName"
      :root-path="rootPath"
      :root-path-name="rootPathName"
      :has-history="hasHistory"
      lock-initial
      simplified
      media
      v-if="currentPath"
      @browse="onBrowse"
      @paginate="fetchPage"
    />
    <Modal
      name="full-manager"
      title="Files"
      class="full-modal-explorer full-file-explorer-modal"
      @before-open="onOpenModal"
      @closed="onCloseModal"
    >
      <FullFileExplorer
        v-if="isModalOpen"
        :initial-path="currentPath"
        :no-history="true"
      />
    </Modal>
  </div>
</template>
<script>
import Vue from 'vue';
import Icon from 'airsend/components/Icon';
import Modal from 'airsend/components/Modal.vue';
import FullFileExplorer from './FullFileExplorer';

import FileList from './FileList';
import GridFileList from './GridFileList';

import { parseTime, bytesToSize } from 'airsend/utils';

export default {
  components: {
    Icon,
    FullFileExplorer,
    FileList,
    GridFileList,
    Modal
  },
  props: {
    initialPath: {
      type: String,
      default: '/'
    },
    initialPathName: {
      type: String,
      default: ''
    },
    rootPath: {
      type: String,
      default: ''
    },
    rootPathName: {
      type: String,
      default: ''
    },
    hasHistory: {
      type: Boolean,
      default: false
    },
    context: {
      type: String,
      default: 'files',
      validator: function(value) {
        return ['media', 'files', 'gridFiles'].indexOf(value) !== -1;
      }
    }
  },
  data() {
    return {
      currentPath: '',
      currentPathName: '',
      breadcrumb: null,

      parentPath: null,
      parentPathName: null,
      errors: {},
      isModalOpen: false
    };
  },
  computed: {
    isFilesContext() {
      return this.context === 'files';
    },
    isMediaContext() {
      return this.context === 'media';
    },
    isGridFilesContext() {
      return this.context === 'gridFiles';
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    },
    files() {
      return this.$store.getters['files/getFilesInPath']({
        path: this.currentPath
      });
    },
    loading() {
      return (
        this.$store.state.loading['file.list'] &&
        this.files &&
        this.files.length === 0
      );
    }
  },
  watch: {
    initialPath() {
      this.load();
    },
    context() {
      this.load();
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      const { pathMatch } = this.$route.params;

      this.currentPath = pathMatch
        ? `${this.initialPath}/${pathMatch}`
        : this.initialPath;
      this.currentPathName = this.initialPathName;

      this.breadcrumb = [
        {
          path: this.initialPath,
          name: this.initialPathName
        }
      ];

      this.parentPath = null;
      this.parentPathName = null;
    },
    openFileChooser() {
      this.$refs.fileList.openFileChooser();
    },
    fetchPage({ path, before = false }) {
      this.$store.dispatch('files/getPage', { path, before });
    },

    onOpenModal() {
      this.isModalOpen = true;
    },
    onCloseModal() {
      this.isModalOpen = false;
    },
    goBack() {
      Vue.delete(this.breadcrumb, this.breadcrumb.length - 1);

      const { path, name } = this.breadcrumb[this.breadcrumb.length - 1];

      this.currentPath = path;
      this.currentPathName = name;
    },

    onBrowse({ path, name, breadcrumb }) {
      this.currentPath = path;
      this.currentPathName = name.name;
      this.breadcrumb = breadcrumb;
      this.$emit('onBrowse', { path, name, breadcrumb });
    },
    onDownloadFolder() {
      this.$store.dispatch('files/download', {
        name: this.currentPathName,
        type: 'folder',
        path: this.currentPath
      });
    },
    openNewFolderModal() {
      this.$modal.show('create-folder');
    },
    openExplorerModal() {
      this.$modal.show('full-manager');
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime
  }
};
</script>
