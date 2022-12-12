<template>
  <Drag
    :transfer-data="item"
    class="file-explorer-single file-explorer-single--file"
  >
    <template slot="image"
      ><div class="file-explorer-single-transfer">
        <FileIcon :name="item.name" :thumb="getThumb(item)" /> {{ item.name }}
      </div></template
    >
    <a class="file-explorer-single" @click="preview">
      <FileIcon :name="item.name" :thumb="getThumb(item)" />
      <div class="file-explorer-single-title">
        {{ item.name }}
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
          >{{ bytesToSize(item.size) }} - Last modified
          {{ parseTime(item.modification).format('MM/DD/YYYY') }}</small
        >
      </div>
      <a class="btn btn-icon" style="display:none">
        <Icon class="action-dropdown" family="far" name="ellipsis-h" />
      </a>
    </a>
  </Drag>
</template>
<script>
import store from 'store';
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';

import { Drag } from 'vue-drag-drop';

import { parseTime, bytesToSize, isImg } from 'airsend/utils';

export default {
  components: {
    Icon,
    FileIcon,
    Drag
  },
  props: {
    item: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      isDragActive: false
    };
  },
  computed: {
    uploading() {
      return this.$store.state.loading['file.upload'];
    },
    user() {
      return this.$store.state.core.user;
    }
  },
  methods: {
    preview() {
      this.$emit('preview', this.item);
    },
    getThumb(file) {
      if (file.thumb && file.thumb !== '') return file.thumb;
      if (isImg(file.name)) {
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/file.thumb?fspath=${encodeURI(
          file.fullpath
        )}&width=100&height=100&token=${
          this.user.token ? this.user.token : store.get('hash')
        }&v=${file.modificationts}`;
      }
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime
  }
};
</script>
