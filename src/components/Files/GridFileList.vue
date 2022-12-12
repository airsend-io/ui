<template>
  <div class="file-list-wrapper file-list-wrapper--grid">
    <input ref="file" type="file" multiple hidden @change="onChooseFile" />
    <div class="file-list-refresh" v-if="pathInfo.needsRefresh && !loading">
      <span @click="refresh">{{ $t('files.file-list-refresh') }}</span>
    </div>
    <Drop
      v-cloak
      class="droppable"
      @drop="onDropFile"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
    >
      <div
        class="file-list-body"
        :class="{ [`is-dragging`]: isDragActive }"
        id="infinite-list"
      >
        <div class="droppable-wrapper">
          <div class="droppable-box"></div>
        </div>

        <div
          v-if="files.length === 0 && !loading"
          class="droppable-wrapper droppable-wrapper--empty"
        >
          <div class="droppable-box">
            <Icon family="fal" name="paperclip" />
            <h4>This folder is empty</h4>
            <p>drop some files to upload</p>
          </div>
        </div>

        <div>
          <div class="file-list-grid" id="file-list-grid">
            <fragment v-if="loading">
              <GridItemLoader
                :simplified="simplified"
                :has-multi-select="hasMultiSelect"
                :select-only="selectOnly"
                v-for="i in itemsPerRow * 10"
                :key="`${i}-loader`"
              />
            </fragment>
            <component
              :is="file.component"
              v-for="file in loading ? [] : files"
              :key="file.fullpath || file.id"
              :select-only="selectOnly"
              :picker="picker"
              :simplified="simplified"
              :has-multi-select="hasMultiSelect"
              :item="file"
              :selection="selectedFiles"
              :when="file.when || null"
              :ref="`file-${file.fullpath}` || file.id"
              :media="media"
              @move="moveItem"
              @copy="copyItem"
              @share="shareItem"
              @download="downloadItem"
              @delete="deleteItem"
              @selected="onSelect"
              @preview="onPreview"
              @clear="onClearSelect"
              @browse="browse"
            />
            <fragment v-if="pathInfo.hasPageAfter && !loading">
              <GridItemLoader
                v-for="i in remainingCellsInLastRow"
                :key="`${i}-loader-fill-row`"
              />
              <GridItemLoader
                ref="item-loader"
                v-observe-visibility="{
                  callback: visibilityChanged,
                  throttle: 0,
                  once: false
                }"
              />
              <GridItemLoader v-for="i in loaderItems" :key="`${i}-loader`" />
              <GridItemLoader
                v-observe-visibility="{
                  callback: visibilityChanged,
                  throttle: 0,
                  once: false
                }"
              />
            </fragment>
            <fragment v-else>
              <div
                v-for="i in remainingCellsInLastRow"
                :key="`${i}-fill-row`"
              ></div>
            </fragment>
          </div>
        </div>
      </div>
    </Drop>

    <FileVersionsModal v-if="!selectOnly" @download="downloadItem" />
    <FileMoveModal v-if="!selectOnly" />
    <FileCopyModal v-if="!selectOnly" />
    <FilePickerModal
      v-if="!selectOnly"
      @picked="
        path => {
          $emit('picked', path);
        }
      "
    />
    <FileCreateFolderModal v-if="!selectOnly" />
    <FileRenameModal v-if="!selectOnly" />
    <FileCreateModal
      v-if="!selectOnly"
      @created="
        data => {
          $emit('file-created', data);
        }
      "
    />
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import qs from 'query-string';

import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader';
import Checkbox from 'airsend/components/Checkbox.vue';
import FileDivider from 'airsend/components/FileDivider.vue';

import FileVersionsModal from '../Modals/FileVersions.vue';
import FileMoveModal from '../Modals/FileMove.vue';
import FileCopyModal from '../Modals/FileCopy.vue';
import FilePickerModal from '../Modals/FilePicker.vue';
import FileCreateFolderModal from '../Modals/FileCreateFolder.vue';
import FileCreateModal from '../Modals/FileCreate.vue';
import FileRenameModal from '../Modals/FileRename.vue';

import GenericFile from './Grid/GenericFile';
import Folder from './Grid/Folder';

import { Drop } from 'vue-drag-drop';

import { EventBus } from 'airsend/event-bus.js';
import { parseTime, bytesToSize, isImg } from 'airsend/utils';

import GridItemLoader from './Grid/ItemLoader';

export default {
  name: 'GridFileList',
  components: {
    Icon,
    Drop,
    Loader,
    Checkbox,
    GenericFile,
    Folder,
    FileVersionsModal,
    FileMoveModal,
    FileCopyModal,
    FilePickerModal,
    FileCreateFolderModal,
    FileCreateModal,
    FileRenameModal,
    GridItemLoader,
    'date-divider': FileDivider
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
    rootPath: {
      type: String,
      default: ''
    },
    rootPathName: {
      type: String,
      default: ''
    },
    sharedPath: {
      type: String,
      default: ''
    },
    sharedPathName: {
      type: String,
      default: ''
    },
    // enable history
    hasHistory: {
      type: Boolean,
      default: false
    },
    // lock initial path
    lockInitial: {
      type: Boolean,
      default: false
    },
    hasMultiSelect: {
      type: Boolean,
      default: false
    },
    selectOnly: {
      type: Boolean,
      default: false
    },
    simplified: {
      type: Boolean,
      default: false
    },
    picker: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    media: {
      type: Boolean,
      default: false
    },
    initialSelect: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentPath: this.initialPath,
      currentPathName: this.initialPathName,
      selectedFiles: [],
      lastSelectedFile: null,
      counter: 0,
      isDragActive: false,
      endOfScroll: 0,
      itemsPerRow: 3
    };
  },
  computed: {
    files() {
      if (this.media)
        return this.$store.getters['files/getMediaInPath'](this.currentPath);
      return (
        this.$store.getters['files/getFilesInPath'](this.currentPath) || []
      );
    },
    IS_READONLY() {
      return (
        this.$router.history.current.query.hash !== undefined ||
        this.user.read_only === true
      );
    },
    isPublicShare() {
      return this.$router.history.current.query.hash !== undefined;
    },
    pathInfo() {
      if (this.media)
        return this.$store.getters['files/getPathInfo'](
          `${this.currentPath}/media`
        );
      return this.$store.getters['files/getPathInfo'](this.currentPath);
    },
    channels() {
      return this.$store.state.channels.all;
    },
    user() {
      return this.$store.state.core.user;
    },
    loading() {
      return this.$store.state.loading[
        `file.list/loading-${this.currentPath}-${this.filesContext.type}`
      ];
    },
    loadingAfter() {
      return this.$store.state.loading['file.list/loading-after'];
    },
    remainingCellsInLastRow() {
      if (!this.files || this.files.length === 0) return this.itemsPerRow;
      let itemsLengthOfLastCategory = this.files.reduce((n, item) => {
        if (item.component === 'file-divider') {
          return 0;
        }
        return n + 1;
      }, 0); //return the number of itens in last category (today, yesterday, this week...)
      let itemsInLastRow = itemsLengthOfLastCategory % this.itemsPerRow;
      if (itemsInLastRow === 0) return 0; //last line is full
      return this.itemsPerRow - itemsInLastRow || 0;
    },
    loaderItems() {
      let itemsPerPage = this.filesContext.itemsPerPage;
      let numberOfRows = Math.ceil(
        (itemsPerPage + 3 * this.itemsPerRow) / this.itemsPerRow
      ); //number of columns required + 3
      return this.itemsPerRow * numberOfRows - 2; //two items are added out of the for, first and last item has the visibility observer
    },
    filesContext() {
      return this.$store.state.files.filesContext;
    }
  },
  watch: {
    initialPath() {
      this.browse(this.initialPath);
      this.selectedFiles = this.initialSelect;
    },
    loadingAfter: {
      handler(loading) {
        if (loading) {
          //started to load
          const listElm = document.getElementById('infinite-list');
          this.endOfScroll = listElm.scrollTop;
        } else {
          //stopped to load
          const listElm = document.getElementById('infinite-list');
          if (listElm.scrollTop > this.endOfScroll) {
            //listElm.scrollTop = this.endOfScroll;
          }
        }
      }
    }
  },
  async mounted() {
    this.evaluateitemsPerRow();
    await this.browse(this.initialPath);
    this.selectedFiles = this.initialSelect;

    this.$nextTick(() => {
      let gridElm = document.getElementById('file-list-grid');
      if (gridElm) {
        window.addEventListener('resize', this.evaluateitemsPerRow);
      }
    });
  },
  methods: {
    async browse(path, preventFetch = false) {
      const { name, breadcrumb } = this.parsePath(path);
      const { query } = this.$router.history.current;

      this.currentPath = path;
      this.breadcrumb = breadcrumb;
      this.currentPathName = name.name;
      this.lastSelectedFile = null;

      if (this.hasHistory) {
        const { name, params, fullPath } = this.$route;

        if (name === 'channel' || name === 'channel-sub') {
          const { id: channelId, pathMatch, resource } = params;

          const [beginOf, pathType, channelDir, ...finalPath] = path.split('/');

          this.$router
            .push(
              `/channel/${channelId}/files/${finalPath.join('/')}${
                query ? `?${qs.stringify(query)}` : ''
              }`
            )
            .catch(() => {});
        } else {
          // if not same path, push history
          if (
            `/files${path}` !==
            decodeURIComponent(this.$router.history.current.path)
          ) {
            this.$router.push(
              `/files${path}${query ? `?${qs.stringify(query)}` : ''} `
            );
          }
        }
      }

      this.$emit('browse', { path, name, breadcrumb });

      if (!preventFetch) {
        if (!this.isLoadingPath(path, this.filesContext.type)) {
          await this.$store.dispatch('files/get', { path }); // get initial files
        }
      }

      this.onClearSelect();
    },
    refresh() {
      this.$store.dispatch('files/get', { path: this.currentPath });
    },
    isLoadingPath(path, type) {
      return this.$store.state.loading[`file.list/loading-${path}-${type}`];
    },
    evaluateitemsPerRow: _.throttle(function() {
      let gridElm = document.getElementsByClassName('file-list-grid')[0];
      if (!gridElm) return;
      var gap = 8;
      var minWidth = 110;
      var gridWidth = gridElm.offsetWidth;
      this.itemsPerRow = Math.floor((gridWidth + gap) / (minWidth + gap));
    }, 66),
    visibilityChanged(isVisible) {
      if (isVisible && !this.loadingAfter) {
        this.$emit('paginate', { path: this.currentPath });
      }
    },
    // convert path to breadcrumb
    parsePath(path) {
      if (path === '') {
        return {
          name: 'Files',
          breadcrumb: [{ title: 'Files', path: '' }]
        };
      }

      if (this.title !== '') {
        return {
          name: this.title,
          breadcrumb: [{ title: this.title, path: '' }]
        };
      }

      let [root, type, ...dirTree] = path.split('/');

      let currentRoute = '';

      let output = {
        name: this.parsePathName(dirTree[dirTree.length - 1]),
        root,
        breadcrumb: [{ title: 'Files', path: '' }]
      };

      // files
      if (type === 'cf' && this.IS_READONLY && !this.isPublicShare) {
        currentRoute = '/cf';
        output.breadcrumb.push({ title: 'Shared Channels', path: '/cf' });
      }

      if (this.isPublicShare) {
        return output;
      }

      // wiki
      if (type === 'wf') {
        currentRoute = '/wf';
        output.breadcrumb.push({ title: 'Wiki', path: '/wf' });
      }

      output.breadcrumb = [
        ...output.breadcrumb,
        ...dirTree.map(dir => {
          let { name, path } = this.parsePathName(dir);
          currentRoute += `/${path}`;

          return {
            title: name,
            path: currentRoute
          };
        })
      ];

      // lock the initial path
      if (this.lockInitial && this.rootPath !== '') {
        let lockedBreadcrumb = [];
        let unlocked = false;

        output.breadcrumb.forEach(item => {
          if (item.path === this.rootPath || unlocked) {
            lockedBreadcrumb.push(item);
            unlocked = true;
          }
        });

        if (lockedBreadcrumb[0]) {
          lockedBreadcrumb[0].title =
            this.rootPathName !== ''
              ? this.rootPathName
              : lockedBreadcrumb[0].title;
        }

        output.breadcrumb = lockedBreadcrumb;
      } else if (this.lockInitial) {
        let lockedBreadcrumb = [];
        let unlocked = false;

        output.breadcrumb.forEach(item => {
          if (item.path === this.initialPath || unlocked) {
            lockedBreadcrumb.push(item);
            unlocked = true;
          }
        });

        if (lockedBreadcrumb[0]) {
          lockedBreadcrumb[0].title =
            this.initialPathName !== ''
              ? this.initialPathName
              : lockedBreadcrumb[0].title;
        }

        output.breadcrumb = lockedBreadcrumb;
      }

      return output;
    },
    parsePathName(pathName) {
      if (!pathName) {
        return {
          name: 'Shared Channels',
          path: 'cf'
        };
      }

      // if it's a string name
      if (Number.isNaN(parseInt(pathName))) {
        return {
          name: pathName,
          path: pathName
        };
      }

      // if it's a My Files type
      if (parseInt(pathName) + 40000000 === this.user.id) {
        return {
          name: 'My Files',
          path: `f/${pathName}`
        };
      }

      // check if it's a channel folder
      const channelIndex = _.findIndex(this.channels, {
        channel_roots: [{ location: `/cf/${pathName}` }]
      });

      if (channelIndex > -1) {
        return {
          name: this.channels[channelIndex].channel_name,
          path: `cf/${pathName}`
        };
      }

      return {
        name: pathName,
        path: pathName
      };
    },

    onClearSelect() {
      this.selectedFiles = [];
      this.lastSelectedFile = null;
    },

    onSelectAll(e) {
      e.preventDefault();
      e.stopPropagation();

      // if not everything selected, select now
      if (this.selectedFiles.length !== this.files.length) {
        this.selectedFiles = this.files.map(file => {
          return file.displayname;
        });
      } else {
        this.onClearSelect();
      }
    },

    showPreviousVersions(item) {
      this.$store.dispatch('files/versions', item.fullpath);
      this.currentVersionFile = item;
      this.$modal.show('previous-versions');
    },

    shareItem(item) {
      this.$modal.show('file-share', item);
    },

    downloadItem(item) {
      this.$store.dispatch('files/download', {
        name: item.displayname,
        type: item.type,
        path: item.fullpath,
        version: item.versionidentifier
      });
    },

    deleteItem(item) {
      // if there is a target item, delete it
      if (item && item.parent) {
        this.$store.dispatch('files/delete', {
          name: item.displayname,
          path: item.parent,
          type: item.type
        });
        // if not, delete from selected list
      } else {
        this.selectedFiles.forEach(fileName => {
          this.$store.dispatch('files/delete', {
            name: fileName,
            path: this.currentPath
          });
        });
      }

      this.onClearSelect();
    },

    onPreview(file) {
      // fetch elegible files and selected file index
      const previewFiles = _.filter(this.files, { type: 'file' });
      const selectedIndex = _.findIndex(previewFiles, { name: file.name });

      EventBus.$emit(
        'file-preview',
        previewFiles.map(item => {
          return {
            file: item.name,
            path: item.fullpath,
            size: item.size,
            thumb: this.$refs[`file-${item.fullpath}`][0].thumb,
            modificationts: item.modificationts
          };
        }),
        selectedIndex
      );
    },

    select(file) {
      this.selectedFiles = [file];
    },

    onSelect({ item, shiftKey, metaKey }) {
      if (this.selectOnly) {
        if (item.type === 'folder') {
          this.browse(item.fullpath);
          this.$emit('selected', null);
        } else {
          this.selectedFiles = [item.displayname];
          this.$emit('selected', this.selectedFiles);
        }

        return;
      }

      // shiftKey: select all files between selection
      // metaKey: add file to selection
      // none: select only this file

      if ((!shiftKey && !metaKey) || !this.hasMultiSelect) {
        if (
          this.selectedFiles.length === 1 &&
          this.selectedFiles[0] === item.displayname
        ) {
          if (!this.picker) {
            this.selectedFiles = [];
          }
        } else {
          this.selectedFiles = [item.displayname];
        }

        this.lastSelectedFile = item.displayname;

        this.$emit('selected', this.selectedFiles);

        return;
      }

      if (metaKey) {
        const selectedIndex = this.selectedFiles.indexOf(item.displayname);

        if (selectedIndex > -1) {
          Vue.delete(this.selectedFiles, selectedIndex);
        } else {
          this.selectedFiles.push(item.displayname);
        }

        this.$emit('selected', this.selectedFiles);
      }

      if (shiftKey) {
        const initialFile = this.lastSelectedFile
          ? this.lastSelectedFile
          : this.files[0].displayname;

        let selectedFiles = [];
        let inBetween = false;

        this.files.forEach(file => {
          if (
            file.displayname === initialFile ||
            file.displayname === item.displayname
          ) {
            inBetween = !inBetween;
          }

          if (
            inBetween &&
            file.displayname !== initialFile &&
            file.displayname !== item.displayname
          ) {
            selectedFiles.push(file.displayname);
          }
        });

        // push current item
        selectedFiles.push(initialFile);
        selectedFiles.push(item.displayname);

        this.selectedFiles = selectedFiles;

        this.$emit('selected', this.selectedFiles);
      }
    },

    moveItem(item) {
      this.$modal.show('file-move', {
        files: item.name ? [item.displayname] : this.selectedFiles,
        path: item.parent
      });
    },

    copyItem(item) {
      this.$modal.show('file-copy', {
        files: item.name ? [item.displayname] : this.selectedFiles,
        path: item.parent
      });
    },

    openCreateFolder() {
      this.$modal.show('file-create-folder', this.currentPath);
    },

    openCreateFile(ext) {
      this.$modal.show('file-create', { path: this.currentPath, ext });
    },

    openFilePicker(path) {
      this.$modal.show('file-picker', path ? path : this.currentPath);
    },

    openFileChooser() {
      this.$refs.file.click();
    },

    goBack() {
      const back = this.breadcrumb[this.breadcrumb.length - 2];
      this.browse(back.path);
    },

    async onChooseFile(e) {
      let files = [];
      let selectedFiles = e.target.files;

      if (!selectedFiles) {
        return;
      }

      [...selectedFiles].forEach(f => {
        files.push(f);
      });

      if (files.length) {
        this.$store.dispatch('files/upload', {
          files,
          path: this.currentPath
        });

        this.$refs.file.value = null;
      }
    },

    // Drag'nDrop
    async onDropFile(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      if (ext) return;

      let files = [];

      let droppedFiles = e.dataTransfer.items; //array of DirectoryEntries and FileEntries
      if (!droppedFiles) {
        this.isDragActive = false;
        return;
      }

      [...droppedFiles].forEach(f => {
        files.push(f);
      });

      if (files.length) {
        this.$store.dispatch('files/upload', {
          files,
          path: this.currentPath
        });
      }

      this.counter = 0;
      this.isDragActive = false;
    },
    onDragEnter(ext) {
      if (ext) return;

      this.counter++;
      this.isDragActive = true;
    },
    onDragLeave(ext) {
      if (ext) return;

      this.counter--;
      if (this.counter === 0) {
        this.isDragActive = false;
      }
    }
  }
};
</script>
