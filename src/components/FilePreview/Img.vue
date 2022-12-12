<template>
  <div class="file-preview-item file-preview-item--picture">
    <v-zoomer
      ref="image"
      :min-scale="0.5"
      @update:zoomed="onZoomed"
      :max-scale="5"
      style="width: 100%; height: 100%; min-height:0;"
    >
      <template>
        <img
          :src="this.blob"
          v-show="!isLoading"
          @load="onLoadImage"
          @error="onError"
        />
        <img v-if="file.thumb" :src="thumb" v-show="isLoading" />
      </template>
    </v-zoomer>
    <Loader v-if="isLoading" :full="true" class="loader-wrapper" />
  </div>
</template>

<script>
import Vue from 'vue';
import VueZoomer from 'vue-zoomer';
import Loader from 'airsend/assets/loader.svg';
import { getFileUrl, getFileBlob } from 'airsend/utils';

Vue.use(VueZoomer);

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
  watch: {
    file: function() {
      this.loadBlob();
    }
  },
  computed: {
    thumb() {
      return this.file.thumb;
    }
  },
  methods: {
    async loadBlob() {
      this.isLoading = true;

      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.$store.state.core.user.token;

      this.blob = this.file.noBlob
        ? this.file.path
        : getFileUrl(
            this.file.path.indexOf('.gif') > -1 ? 'download' : 'thumb',
            this.file.path,
            {
              width: 2560,
              height: 1440,
              v: this.file.modificationts, //ignored by backend, but used to bypass browser's cache
              token
            }
          );
    },
    onZoomed() {
      if (this.$refs.image.scale < 1) {
        this.$refs.image.translateX = 0;
        this.$refs.image.translateY = 0;
      }
    },
    onLoadImage() {
      this.isLoading = false;
    },
    onError() {}
  },
  components: {
    Loader
  }
};
</script>

<style scoped>
img {
  object-fit: contain;
  width: 100%;
  height: 100%;
}
.loader-wrapper {
  position: absolute;
  transform: scale(3);
}
</style>
