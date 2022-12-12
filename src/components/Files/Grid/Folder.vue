<template>
  <Drop
    v-cloak
    tag="tr"
    class="file-explorer-single file-explorer-single--folder"
    :class="{
      [`file-explorer-single--dragover`]: isDragActive,
      [`file-explorer-single--selected`]: isSelected,
      [`file-explorer-single--optionsOpened`]: isoptionsOpened
    }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @mouseover.native="hoverActive = true"
    @mouseleave="hoverActive = false"
  >
    <div @click="browse">
      <div class="file-icon">
        <div class="img-wrapper">
          <Icon
            class="file-icon file-icon--folder"
            family="fas"
            name="folder"
          />
        </div>
        <dir class="overlay d-none"></dir>
      </div>
    </div>
    <Checkbox :checked="isSelected" @input="select" class="d-none" />
    <div class="item-footer" @mouseenter="onMouseOver">
      <div class="title-wrapper" ref="file-name-container">
        <span :class="{ [`text-overflow`]: textOverflow }">{{
          item.name
        }}</span>
      </div>
      <Popover
        @apply-hide="isoptionsOpened = false"
        @update:open="isoptionsOpened = true"
        v-if="hoverActive || isSelected || isoptionsOpened"
      >
        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.more-options')
          }"
          class="btn btn-icon"
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
      <button class="btn btn-icon" v-else>
        <Icon family="fal" name="ellipsis-h" />
      </button>
    </div>
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
    }
  },
  data() {
    return {
      isDragActive: false,
      timeout: null,
      counter: 0,
      isoptionsOpened: false,
      textOverflow: false,
      hoverActive: false
    };
  },
  computed: {
    isSelected() {
      return this.selection.indexOf(this.item.displayname) > -1;
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
    onClickRename() {
      this.$modal.show('file-rename', this.item);
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
            files: files,
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
    onMouseOver(e) {
      this.$nextTick(() => {
        let container = this.$refs['file-name-container'];
        let text = container.firstChild;
        this.textOverflow = text.clientWidth > container.clientWidth;
      });
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime
  }
};
</script>
