<template>
  <Drag
    :transfer-data="item"
    :draggable="!(this.selection.length > 0 && !isSelected)"
    :effect-allowed="['link']"
    tag="div"
    class="file-explorer-single file-explorer-single--file"
    :class="{
      [`file-explorer-single--selected`]: isSelected,
      [`file-explorer-single--optionsOpened`]: isoptionsOpened,
      ['file-explorer-single--loading']: renamedFileProps !== undefined
    }"
    @mouseover.native="hoverActive = true"
    @mouseleave="hoverActive = false"
  >
    <FileIcon :name="item.name" :thumb="thumb" @preview="preview" />
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
              v-if="media"
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="showInFolder(item)"
            >
              <Icon family="fal" name="folder" />
              {{ $t('files.show-in-folder') }}
            </button>
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
              v-if="item.canmove && !media"
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
              v-if="item.canmove && !media"
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
      <button class="btn btn-icon" v-else>
        <Icon family="fal" name="ellipsis-h" />
      </button>
    </div>
  </Drag>
</template>
<script>
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';
import Checkbox from 'airsend/components/Checkbox.vue';
import qs from 'query-string';

import store from 'store';
import { Drag } from 'vue-drag-drop';
import Popover from 'airsend/components/Popover.vue';

import { parseTime, bytesToSize, isImg, getFileUrl } from 'airsend/utils';

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
    },
    media: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragActive: false,
      isRenaming: false,
      newName: '',
      isoptionsOpened: false,
      textOverflow: false,
      hoverActive: false
    };
  },
  mounted() {
    if (this.isMobile) {
      this.onMouseOver();
    }
  },
  computed: {
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
    isMobile() {
      return this.$store.state.core.isMobile;
    },
    thumb() {
      let file = this.item;
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.user.token;
      if (file.thumb && file.thumb !== '') return file.thumb;

      if (this.renamedFileProps) {
        //if the item has renamedFileProps means that the file is not moved yet, so we need to use the old URL to thumb
        if (isImg(file.name)) {
          return `${
            process.env.VUE_APP_ROOT_API
          }/v1/file.thumb?fspath=${encodeURI(
            this.renamedFileProps.from
          )}&width=400&height=400&token=${token}&v=${file.modificationts}`;
        } else if (['mp4'].indexOf(file.ext) !== -1) {
          //is video
          return getFileUrl('thumb', this.renamedFileProps.from, {
            width: 400,
            height: 400,
            v: file.modificationts,
            token
          });
        }
        return null;
      }

      if (isImg(file.name)) {
        return getFileUrl('thumb', file.fullpath, {
          width: 400,
          height: 400,
          v: file.modificationts,
          token
        });
      } else if (['mp4'].indexOf(file.ext) !== -1) {
        //is video
        return getFileUrl('thumb', file.fullpath, {
          width: 400,
          height: 400,
          v: file.modificationts,
          token
        });
      }
      return null;
    }
  },
  methods: {
    select(e) {
      const { ctrlKey, shiftKey, metaKey } = e;
      this.$emit('selected', { item: this.item, ctrlKey, shiftKey, metaKey });
    },
    showInFolder(item) {
      let channel_id = this.$route.params.id;

      const [beginOf, pathType, channelDir, ...finalPath] = item.parent.split(
        '/'
      );

      let query = {
        type: 'files'
      };

      this.$router.push(
        `/channel/${channel_id}/files/${finalPath.join('/')}${`?${qs.stringify(
          query
        )}`}`
      );
      //this.$router.push(`/channel/${channelId}/files/${finalPath.join('/')}${qs.stringify(query)}`);
    },
    onMouseOver(e) {
      this.$nextTick(() => {
        let container = this.$refs['file-name-container'];
        let text = container.firstChild;
        this.textOverflow = text.clientWidth > container.clientWidth;
      });
    },
    preview(e) {
      if (!this.picker) {
        this.$emit('preview', this.item);
      } else {
        this.select(e);
      }
    },
    onClickRename() {
      this.$modal.show('file-rename', this.item);
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
    parseTime: parseTime,
    getFileUrl: getFileUrl
  }
};
</script>
