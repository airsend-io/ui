<template>
  <Drop
    v-cloak
    tag="tr"
    class="file-explorer-single file-explorer-single--folder"
    :class="{
      [`file-explorer-single--dragover`]: isDragActive,
      [`file-explorer-single--selected`]: isSelected,
      [`file-explorer-single--optionsOpened`]: isoptionsOpened,
      ['file-explorer-single--loading']: renamedFileProps !== undefined
    }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
  >
    <th
      v-if="hasMultiSelect"
      scope="row"
      class="file-explorer-checkbox"
      @click="select"
    >
      <Checkbox :checked="isSelected" />
    </th>
    <td @click="browse">
      <div class="file-info">
        <Icon class="file-icon file-icon--folder" family="fas" name="folder" />
        <input
          v-if="isRenaming"
          :aria-label="$t('New file name')"
          ref="filenameInput"
          v-model="newName"
          type="text"
          class="form-control rename-input"
          @click.stop=""
          @blur="onRename"
          @keyup.escape="onCancelRename"
          @keyup.enter="onRename"
        />
        <h4 v-else>{{ item.displayname }}</h4>
      </div>
    </td>
    <td v-if="!simplified" class="d-none d-sm-table-cell" @click="select">
      {{
        item.modification
          ? parseTime(item.modification).format('YYYY/MM/DD')
          : ''
      }}
    </td>
    <td
      v-if="!selectOnly && !simplified"
      class="hover-only d-none d-sm-table-cell"
    >
      <div class="btn-group" v-if="isoptionsOpened">
        <button
          v-if="item.candownload"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.folder-download')
          }"
          class="btn btn-sm btn-icon"
          @click="
            () => {
              $emit('download', item);
            }
          "
        >
          <Icon family="fal" name="download" />
        </button>
        <button
          v-if="item.canmove"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.folder-rename')
          }"
          class="btn btn-sm btn-icon"
          @click="
            () => {
              onClickRename();
            }
          "
        >
          <Icon family="fal" name="money-check-edit" />
        </button>
        <button
          v-if="item.canmove"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.folder-move')
          }"
          class="btn btn-sm btn-icon"
          @click="
            () => {
              $emit('move', item);
            }
          "
        >
          <Icon family="fal" name="clone" />
        </button>
        <Popover
          v-if="item.candelete"
          @apply-hide="isoptionsOpened = false"
          @show="isoptionsOpened = true"
          class="btn btn-sm btn-icon"
        >
          <Icon
            family="fal"
            name="trash-alt"
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('files.tooltips.folder-delete')
            }"
          />
          <template slot="popover">
            <div class="dropdown-items">
              <div class="dropdown-text">{{ $t('general.are-you-sure') }}</div>
              <button
                v-close-popover
                class="dropdown-item btn btn-sm btn-danger"
                type="button"
                @click="
                  () => {
                    $emit('delete', item);
                  }
                "
              >
                Delete Now
              </button>
            </div>
          </template>
        </Popover>
      </div>
    </td>
    <td v-if="!selectOnly" class="hover-only text-right">
      <Popover
        @apply-hide="isoptionsOpened = false"
        @show="isoptionsOpened = true"
        v-if="item.candownload || item.canmove || item.candelete"
      >
        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.more-options')
          }"
          class="btn btn-icon more-options"
        >
          <Icon family="fal" name="ellipsis-h" />
        </button>
        <template slot="popover">
          <div class="dropdown-items">
            <button
              v-if="item.candownload"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $emit('download', item);
                }
              "
            >
              <Icon family="fal" name="download" /> {{ $t('files.download') }}
            </button>
            <button
              v-if="item.canmove"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  onClickRename();
                }
              "
            >
              <Icon family="fal" name="money-check-edit" />
              {{ $t('files.rename') }}
            </button>
            <button
              v-if="item.canmove"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $emit('copy', item);
                }
              "
            >
              <Icon family="fal" name="clone" /> {{ $t('files.copy') }}
            </button>
            <button
              v-if="item.canmove"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $emit('move', item);
                }
              "
            >
              <Icon family="fal" name="long-arrow-right" />
              {{ $t('files.move') }}
            </button>
            <button
              v-if="item.candelete"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $emit('delete', item);
                }
              "
            >
              <Icon family="fal" name="trash-alt" /> {{ $t('files.delete') }}
            </button>
          </div>
        </template>
      </Popover>
    </td>
  </Drop>
</template>
<script>
import Icon from 'airsend/components/Icon';
import Checkbox from 'airsend/components/Checkbox.vue';
import Popover from 'airsend/components/Popover.vue';

import { Drop } from 'vue-drag-drop';

import { parseTime, bytesToSize } from 'airsend/utils';

export default {
  components: {
    Icon,
    Drop,
    Checkbox,
    Popover
  },
  props: {
    item: {
      type: Object,
      default: () => {
        return {};
      }
    },
    selection: {
      type: Array,
      default: () => {
        return [];
      }
    },
    selectOnly: {
      type: Boolean,
      default: false
    },
    simplified: {
      type: Boolean,
      default: false
    },
    hasMultiSelect: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragActive: false,
      timeout: null,
      counter: 0,
      isRenaming: false,
      newName: '',
      isoptionsOpened: false
    };
  },
  computed: {
    isSelected() {
      return this.selection.indexOf(this.item.displayname) > -1;
    },
    renamedFileProps() {
      return this.$store.state.files.renaming[this.item.fullpath];
    }
  },
  methods: {
    browse() {
      const { fullpath } = this.item;
      this.$emit('browse', fullpath);
    },
    select(e) {
      const { ctrlKey, shiftKey, metaKey } = e;
      this.$emit('selected', { item: this.item, ctrlKey, shiftKey, metaKey });
    },
    async onDropFile(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      // if there is extension data, it's a move event
      if (ext) {
        if (this.selection.length > 0) {
          this.selection.forEach(file => {
            this.$store.dispatch('files/move', {
              from: ext.parent,
              to: this.item.fullpath,
              file: file,
              type: file.type
            });
          });

          this.$emit('clear', true);
        } else {
          this.$store.dispatch('files/move', {
            from: ext.parent,
            to: this.item.fullpath,
            file: ext.displayname,
            type: ext.type
          });
        }

        // move to path and upload
      } else {
        let files = [];

        let droppedFiles = e.dataTransfer.items;
        if (!droppedFiles) {
          this.isDragActive = false;
          return;
        }

        [...droppedFiles].forEach(f => {
          files.push(f);
        });

        if (files.length) {
          const { fullpath: path } = this.item;

          this.$emit('browse', path, true);

          // get files from folder
          await this.$store.dispatch('files/get', { path });

          // get files from folder
          this.$store.dispatch('files/upload', {
            files,
            path
          });
        }
      }

      this.isDragActive = false;
      this.counter = 0;
    },
    onDragEnter(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      this.counter++;

      this.isDragActive = true;
    },
    onDragLeave(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      this.counter--;

      if (this.counter === 0) {
        this.isDragActive = false;
      }
    },
    onDragOver(ext, e) {
      e.preventDefault();
      e.stopPropagation();
    },
    onClickRename() {
      this.isRenaming = true;
      this.newName = this.item.name;

      this.$nextTick(() => {
        this.$refs.filenameInput.focus();

        this.$refs.filenameInput.select();
      });
    },

    async onRename() {
      if (!this.isRenaming) return;

      this.isRenaming = false;

      if (this.item.name !== this.newName) {
        // toggle selection
        if (this.isSelected) {
          this.select({});
        }

        await this.$store.dispatch('files/rename', {
          path: this.item.parent,
          from: this.item.displayname,
          to: this.newName
        });
      }
    },
    onCancelRename() {
      this.isRenaming = false;
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime
  }
};
</script>
