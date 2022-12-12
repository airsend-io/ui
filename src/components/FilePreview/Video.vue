<template>
  <div class="file-preview-item file-preview-item--video">
    <video
      controls
      :src="blob"
      autoplay
      v-show="!isLoading"
      @canplay="onLoad"
    ></video>
    <img :src="thumb" v-show="isLoading" />
    <Loader v-if="isLoading" class="loader-wrapper" />
  </div>
</template>

<script>
import { getFileUrl, getFileBlob } from 'airsend/utils';

import Loader from 'airsend/assets/loader.svg';

export default {
  props: {
    file: {
      type: Object
    }
  },
  data() {
    return {
      isLoading: true,
      blob: null
    };
  },
  mounted() {
    this.loadBlob();
  },
  computed: {
    thumb() {
      return this.file.thumb;
    }
  },
  watch: {
    file: function() {
      this.loadBlob();
    }
  },
  methods: {
    async loadBlob() {
      this.isLoading = true;
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.$store.state.core.user.token;
      this.blob = getFileUrl('download', this.file.path, { token });
    },
    onLoad() {
      this.isLoading = false;
    }
  },
  components: {
    Loader
  }
};
</script>

<style scoped>
img {
  object-fit: contain;
  width: 80%;
  height: 80%;
}
.loader-wrapper {
  position: absolute;
  transform: scale(3);
}
</style>
