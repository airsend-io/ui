<template>
  <Drop
    v-cloak
    class="file-explorer-single"
    :class="{ [`file-explorer-single--dragover`]: isDragActive }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <a class="file-explorer-single" @click="browse(item.fullpath, item.name)">
      <Icon class="file-icon" family="fas" name="folder" />
      <div class="file-explorer-single-title">
        {{ item.name }}
        <small
          >Last modified
          {{ parseTime(item.modification).format('MM/DD/YYYY') }}</small
        >
      </div>
      <a class="btn btn-icon">
        <Icon family="far" name="chevron-right" />
      </a>
    </a>
  </Drop>
</template>
<script>
import Icon from 'airsend/components/Icon';

import { Drop } from 'vue-drag-drop';

import { parseTime, bytesToSize } from 'airsend/utils';

export default {
  components: {
    Icon,
    Drop
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
      isDragActive: false,
      timeout: null
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    }
  },
  methods: {
    browse(path, name) {
      this.$emit('browse', { path, name });
    },
    async onDropFile(ext, e) {
      if (this.user.read_only) return;

      e.preventDefault();
      e.stopPropagation();

      // if there is extension data, it's a move event
      if (ext) {
        this.$store.dispatch('files/move', {
          from: ext.fullpath,
          to: `${this.item.fullpath}/${ext.name}`
        });

        // move to path and upload
      } else {
        let files = [];

        let droppedFiles = e.dataTransfer.files;
        if (!droppedFiles) {
          this.isDragActive = false;
          return;
        }

        [...droppedFiles].forEach(f => {
          files.push(f);
        });

        if (files.length) {
          const { fullpath: path, name } = this.item;

          this.$emit('browse', { path, name, preventFetch: true });

          // get files from folder
          await this.$store.dispatch('files/get', { path });

          this.$store.dispatch('files/upload', { files, path });
        }

        this.isDragActive = false;
      }
    },
    onDragEnter(ext, e) {
      if (this.user.read_only) return;

      e.preventDefault();
      e.stopPropagation();

      clearTimeout(this.timeout);
      this.isDragActive = true;
    },
    onDragLeave(ext, e) {
      if (this.user.read_only) return;

      e.preventDefault();
      e.stopPropagation();

      this.timeout = setTimeout(() => {
        this.isDragActive = false;
      }, 500);
    },
    bytesToSize: bytesToSize,
    parseTime: parseTime
  }
};
</script>
