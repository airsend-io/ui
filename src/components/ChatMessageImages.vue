<template>
  <div class="chat-message-content-images">
    <ul class="images-list">
      <li v-for="(image, index) in images.slice(0, images.length > 3 ? 2 : 3)">
        <a class="single-image" @click="preview($event, index)">
          <img :src="image.thumb" v-if="image.thumb" />
          <img :src="getImageUrl(image)" v-else />
        </a>
      </li>
      <li v-if="images.length > 3">
        <a class="single-image" @click="preview($event, 2)">
          <img :src="images[2].thumb" v-if="images[2].thumb" />
          <img :src="getImageUrl(images[2])" v-else />
          <div class="single-image-overlay">+{{ images.length - 2 }}</div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import FileIcon from 'airsend/components/FileIcon.vue';
import { bytesToSize, relDiff, getFileUrl, isImg } from 'airsend/utils';

import { EventBus } from 'airsend/event-bus.js';

export default {
  props: {
    images: {
      type: Array,
      default: []
    },
    messageId: {
      type: Number
    },
    version: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      index: null
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user ? this.$store.state.core.user : {};
    }
  },
  methods: {
    bytesToSize: bytesToSize,
    relDiff: relDiff,
    getFileUrl: getFileUrl,
    preview(e, index) {
      e.preventDefault();
      e.stopPropagation();
      EventBus.$emit(
        'file-preview',
        this.images.map(file => {
          return {
            file: file.file,
            path: file.path,
            size: file.size,
            thumb: file.thumb || this.getImageUrl(file),
            modificationts: this.version
          };
        }),
        index
      );
    },
    getImageUrl(file) {
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.user.token;

      if (isImg(file.file) && file.file.indexOf('.gif') > -1) {
        return getFileUrl('download', file.path, {
          v: this.version,
          token
        });
      } else if (isImg(file.file)) {
        return getFileUrl('thumb', file.path, {
          width: 400,
          height: 400,
          v: this.version,
          token
        });
      } else {
        return getFileUrl('thumb', file.path, {
          width: 120,
          height: 120,
          v: this.version,
          token
        });
      }
    }
  },
  components: {
    FileIcon
  }
};
</script>
