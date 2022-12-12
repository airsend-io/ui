<template>
  <Drag
    :transfer-data="item"
    :draggable="!(this.selection.length > 0 && !isSelected)"
    :effect-allowed="['link']"
    tag="tr"
    class="file-explorer-single file-explorer-single--file"
    :class="{
      [`file-explorer-single--selected`]: isSelected,
      [`file-explorer-single--optionsOpened`]: isoptionsOpened,
      ['file-explorer-single--loading']: renamedFileProps !== undefined
    }"
  >
    <template slot="image">
      <div class="file-explorer-single-transfer">
        <FileIcon :name="item.name" :thumb="thumb" />
        {{ item.displayname }}
        <div
          v-if="this.selection.length > 1"
          class="file-explorer-single-transfer-badge"
        >
          +{{ this.selection.length - 1 }}
        </div>
      </div>
    </template>
    <th
      v-if="hasMultiSelect"
      scope="row"
      class="file-explorer-checkbox"
      @click="select"
    >
      <Checkbox :checked="isSelected" />
    </th>
    <td @click="preview">
      <div class="file-info">
        <FileIcon :name="item.displayname" :thumb="thumb" />
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
        <h4 v-else>
          {{ item.displayname }}
          <div
            v-if="$store.state.files.progress[item.fullpath] && uploading"
            class="progress"
          >
            <div
              class="progress-bar"
              role="progressbar"
              :style="{
                width: $store.state.files.progress[item.fullpath].progress + '%'
              }"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <small v-else
            >{{ bytesToSize(item.size) }}
            <Icon
              v-if="item.external_link"
              family="fas"
              name="share-alt"
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('files.tooltips.file-item-shared')
              }"
            />
          </small>
        </h4>
      </div>
    </td>
    <td v-if="!simplified" class="d-none d-sm-table-cell" @click="select">
      {{ parseTime(item.modification).format('YYYY/MM/DD') }}
    </td>
    <td
      v-if="!selectOnly && !simplified"
      class="hover-only d-none d-sm-table-cell"
    >
      <div class="btn-group">
        <button
          v-if="item.candownload"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.file-download')
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
            content: $t('files.tooltips.file-rename')
          }"
          class="btn btn-sm btn-icon"
          @click="onClickRename"
        >
          <Icon family="fal" name="money-check-edit" />
        </button>
        <button
          v-if="item.canmove"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.file-move')
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
              content: $t('files.tooltips.file-delete')
            }"
          />
          <template slot="popover">
            <div class="dropdown-items">
              <div class="dropdown-text">Are you sure?</div>
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
              v-if="item.candelete"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $emit('share', item);
                }
              "
            >
              <Icon family="fal" name="share-alt" /> {{ $t('files.share') }}
            </button>
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
            <button
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="
                () => {
                  $modal.show('file-previous-versions', item);
                }
              "
            >
              <Icon family="fal" name="history" />
              {{ $t('files.previous-versions') }}
            </button>
          </div>
        </template>
      </Popover>
    </td>
  </Drag>
</template>
<script>
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';
import Checkbox from 'airsend/components/Checkbox.vue';
import Popover from 'airsend/components/Popover.vue';

import store from 'store';
import { Drag } from 'vue-drag-drop';

import { parseTime, bytesToSize, isImg } from 'airsend/utils';

export default {
  components: {
    Icon,
    FileIcon,
    Drag,
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
    // select only, no preview
    picker: {
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
      isRenaming: false,
      newName: '',
      isoptionsOpened: false
    };
  },
  computed: {
    isMobile() {
      return this.$store.state.core.isMobile;
    },
    uploading() {
      return this.$store.state.loading['file.upload'];
    },
    renamedFileProps() {
      return this.$store.state.files.renaming[this.item.fullpath];
    },
    user() {
      return this.$store.state.core.user;
    },
    isSelected() {
      return this.selection.indexOf(this.item.displayname) > -1;
    },
    thumb() {
      let file = this.item;
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.user.token;
      if (file.thumb && file.thumb !== '') return file.thumb;

      if (this.renamedFileProps) {
        //if the item has renamedFileProps means that the file is not moved yet, so we need to use the old URL to thumb
        return isImg(file.name)
          ? `${process.env.VUE_APP_ROOT_API}/v1/file.thumb?fspath=${encodeURI(
              this.renamedFileProps.from
            )}&width=100&height=100&token=${token}&v=${file.modificationts}`
          : null;
      }

      return isImg(file.name)
        ? `${process.env.VUE_APP_ROOT_API}/v1/file.thumb?fspath=${encodeURI(
            file.fullpath
          )}&width=100&height=100&token=${token}&v=${file.modificationts}`
        : null;
    }
  },
  methods: {
    select(e) {
      const { ctrlKey, shiftKey, metaKey } = e;
      this.$emit('selected', { item: this.item, ctrlKey, shiftKey, metaKey });
    },
    preview(e) {
      if (!this.picker) {
        this.$emit('preview', this.item);
      } else {
        this.select(e);
      }
    },
    onClickRename() {
      if (this.isMobile) {
        this.$modal.show('file-rename', this.item);
      } else {
        this.isRenaming = true;
        this.newName = this.item.name;

        this.$nextTick(() => {
          this.$refs.filenameInput.focus();

          // find file . index
          const extIndex = this.item.name.indexOf('.');

          if (extIndex > 0) {
            this.$refs.filenameInput.setSelectionRange(0, extIndex);
          } else {
            this.$refs.filenameInput.select();
          }
        });
      }
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
