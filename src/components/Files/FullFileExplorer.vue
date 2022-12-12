<template>
  <div class="full-file-explorer">
    <div class="row fullheight">
      <div class="col-md-9 fullheight px-0">
        <Toaster />
        <!-- Mobile -->
        <nav
          v-if="$refs.fileList"
          class="file-explorer-header navbar navbar-expand-lg navbar-light d-flex d-md-none"
        >
          <div class="navbar-collapse d-flex">
            <span class="navbar-text mr-auto">
              <ol class="breadcrumb">
                <li
                  v-for="(route, index) in $refs.fileList.breadcrumb"
                  :key="route.path"
                  class="breadcrumb-item"
                >
                  <a
                    v-if="index !== $refs.fileList.breadcrumb.length - 1"
                    @click="browse(route.path)"
                    >{{ route.title }}</a
                  >
                  <span v-else aria-current="page">{{ route.title }}</span>
                </li>
              </ol>
            </span>

            <ul
              v-if="$refs.fileList.currentPath !== ''"
              class="navbar-nav d-flex"
            >
              <li v-if="$refs.fileList.pathInfo.canupload" class="nav-item">
                <button
                  class="btn btn-icon btn-sm"
                  @click="() => this.$refs.fileList.openFileChooser()"
                >
                  <Icon family="fas" name="upload" />
                </button>
              </li>
              <li
                v-if="$refs.fileList.pathInfo.cancreatefolder"
                class="nav-item ml-2"
              >
                <button
                  class="btn btn-icon btn-sm"
                  @click="() => this.$refs.fileList.openCreateFolder()"
                >
                  <Icon family="fas" name="folder-plus" />
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Desktop -->
        <nav
          v-if="$refs.fileList"
          class="file-explorer-header navbar navbar-expand-lg navbar-light d-none d-sm-flex"
        >
          <div class="navbar-collapse">
            <span class="navbar-text mr-auto">
              <ol class="breadcrumb">
                <li
                  v-for="(route, index) in $refs.fileList.breadcrumb"
                  :key="route.path"
                  class="breadcrumb-item"
                >
                  <a
                    v-if="index !== $refs.fileList.breadcrumb.length - 1"
                    @click="browse(route.path)"
                    >{{ route.title }}</a
                  >
                  <span v-else aria-current="page">{{ route.title }}</span>
                </li>
              </ol>
            </span>

            <ul
              v-if="$refs.fileList.currentPath !== ''"
              class="navbar-nav"
              :set="(selected = $refs.fileList.selectedFiles)"
            >
              <li v-if="selected.length > 0" class="nav-item nav-item-text">
                {{ selected.length }} file(s) selected
              </li>
              <li v-if="selected.length > 0" class="nav-item nav-item-text">
                <Popover>
                  <button class="btn btn-default">
                    <Icon family="fas" name="trash-alt" /> Delete
                  </button>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <div class="dropdown-text">Are you sure?</div>
                      <button
                        v-close-popover
                        class="dropdown-item btn btn-sm btn-danger"
                        type="button"
                        @click="$refs.fileList.deleteItem"
                      >
                        Delete Now
                      </button>
                    </div>
                  </template>
                </Popover>
              </li>
              <li v-if="selected.length > 0" class="nav-item nav-item-text">
                <button
                  class="btn btn-default"
                  @click="$refs.fileList.moveItem"
                >
                  <Icon family="fas" name="clone" /> Move
                </button>
              </li>
              <li
                v-if="
                  selected.length === 0 &&
                    !selectOnly &&
                    $refs.fileList.pathInfo.canupload
                "
                class="nav-item"
              >
                <button
                  class="btn btn-primary"
                  @click="() => this.$refs.fileList.openFileChooser()"
                >
                  <Icon family="fas" name="upload" /> Upload File
                </button>
              </li>
              <li
                v-if="
                  selected.length === 0 &&
                    $refs.fileList.pathInfo.cancreatefolder
                "
                class="nav-item ml-2"
              >
                <button
                  class="btn btn-primary"
                  @click="() => this.$refs.fileList.openCreateFolder()"
                >
                  <Icon family="fas" name="folder-plus" /> New Folder
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <FileList
          ref="fileList"
          :initial-path="initialPath"
          :initial-path-name="initialPathName"
          :shared-path="sharedPath"
          :shared-path-name="sharedPathName"
          :has-history="!noHistory"
          has-multi-select
          @selected="onSelect"
          @browse="onBrowse"
          @paginate="fetchPage"
        />
      </div>

      <div v-if="!selectOnly" class="col-md-3 px-0 d-none d-sm-flex">
        <div class="file-explorer-sidebar">
          <div class="file-info">
            <Icon
              v-if="currentFile && currentFile.type === 'folder'"
              class="folder-icon"
              family="fas"
              name="folder"
            />
            <FileIcon
              v-else
              :name="currentFile.displayname"
              :thumb="currentFile.thumb"
            />
            <h4>{{ currentFile.displayname }}</h4>
            <p v-if="currentFile.size" class="">
              Size: {{ bytesToSize(currentFile.size) }}
            </p>
            <p v-if="currentFile.files" class="d-none">
              Items: {{ currentFile.files }}
            </p>
            <p
              v-if="currentFile.modification && currentFile.creation"
              class="mt-2"
            >
              Last uploaded on
              {{
                parseTime(currentFile.modification).format(
                  'YYYY/MM/DD HH:mm:ss'
                )
              }}
              <small class="d-block"
                >Originally uploaded on
                {{
                  parseTime(currentFile.creation).format('YYYY/MM/DD HH:mm:ss')
                }}</small
              >
            </p>
            <button class="btn btn-icon btn-sm mt-3" style="display:none">
              <Icon family="fas" name="ellipsis-h" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';
import Loader from 'airsend/components/Loader';
import Modal from 'airsend/components/Modal.vue';
import Toaster from 'airsend/components/Toaster.vue';
import Popover from 'airsend/components/Popover.vue';

import FileList from './FileList';

import { Drop } from 'vue-drag-drop';

import { EventBus } from 'airsend/event-bus.js';
import {
  parseTime,
  bytesToSize,
  retrieveFiles,
  isImg,
  parseFilesQueryFilter
} from 'airsend/utils';

export default {
  name: 'Files',
  components: {
    Icon,
    FileIcon,
    Loader,
    Modal,
    Drop,
    FileList,
    Toaster,
    Popover
  },
  props: {
    initialPath: {
      type: String,
      default: ''
    },
    initialPathName: {
      type: String,
      default: ''
    },
    selectOnly: {
      type: Boolean,
      default: false
    },
    noHistory: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      currentPath: this.initialPath,
      currentPathName: this.initialPathName,
      sharedPath: null,
      sharedPathName: null,
      timeout: null,
      errors: {},
      currentVersionFile: null,
      selectedFiles: [],
      lastSelectedFile: null,
      form: {
        fsname: ''
      }
    };
  },
  computed: {
    isPublicShare() {
      return this.$router.history.current.query.hash !== undefined;
    },
    files() {
      let files = this.$store.getters['files/getFilesInPath'](this.currentPath);
      return files ? files : [];
    },
    loading() {
      return (
        this.$store.state.loading['file.list'] &&
        this.files &&
        this.files.length === 0
      );
    },
    user() {
      return this.$store.state.core.user;
    },
    currentFile() {
      let file = _.find(this.files, { displayname: this.lastSelectedFile });

      if (!file) {
        file = {
          displayname: this.currentPathName,
          files: this.files.length,
          type: 'folder'
        };
      }

      if (isImg(file.name)) {
        file.thumb = `${
          process.env.VUE_APP_ROOT_API
        }/v1/file.thumb?fspath=${encodeURI(
          file.fullpath
        )}&width=200&height=200&token=${this.user.token}`;
      }

      return file;
    },
    filesContext() {
      return this.$store.state.files.filesContext;
    }
  },
  beforeCreate() {
    this.$store.commit('files/setContext', { type: '', search: '' });
  },
  mounted() {
    if (
      this.isPublicShare &&
      this.$router.history.current.name === 'files-sub'
    ) {
      this.sharedPath = this.initialPath;
      this.sharedPathName = this.initialPathName;
    }
  },
  methods: {
    async browse(path) {
      this.$refs.fileList.browse(path);
    },
    onBrowse({ path, name }) {
      this.currentPath = path;
      this.currentPathName = name.name ? name.name : name;
      this.updateQueryFilters();
    },
    onSelect(selected) {
      this.lastSelectedFile = selected[0];
    },
    updateQueryFilters() {
      return;
      const queryFilters = this.parseQueryFilter(
        this.filesContext,
        this.currentPath,
        this.initialPath
      );
      this.$router.push({ query: queryFilters });
    },
    fetchPage({ path, before = false }) {
      this.$store.dispatch('files/getPage', { path, before });
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime,
    parseQueryFilter: parseFilesQueryFilter
  }
};
</script>
