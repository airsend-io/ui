<template>
  <div class="img-wrapper">
    <transition name="fade" v-if="src">
      <img
        :src="src"
        :alt="alt"
        @load="onLoadImage"
        @error="onError"
        v-show="!loading"
      />
    </transition>
    <transition name="loaderfade">
      <ImageLoader v-if="loading" class="image-loader" />
    </transition>
  </div>
</template>

<script>
import ImageLoader from './ImageLoader';

export default {
  name: 'ImageComponent',
  components: {
    ImageLoader
  },
  props: {
    src: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: true
    };
  },
  methods: {
    onLoadImage(e) {
      this.$set(this, 'loading', false);
    },
    onError(e) {
      this.$set(this, 'loading', false);
      this.$emit('error', e);
    }
  }
};
</script>
<style scoped>
.img-wrapper .image-loader,
.img-wrapper > img {
  position: absolute;
  top: 0px;
  left: 0px;
}
.img-wrapper .image-loader {
  z-index: 1;
}
.img-wrapper > img {
  z-index: 2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s linear;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.loaderfade-enter-active,
.loaderfade-leave-active {
  transition: opacity 0.6s linear;
}

.loaderfade-enter, .loaderfade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0.5;
}
</style>
