<template>
  <div class="file-preview-item file-preview-item--audio">
    <Loader v-if="isLoading" />
    <audio controls :src="blob" autoplay v-else></audio>
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
  watch: {
    file: function() {
      this.loadBlob();
    }
  },
  methods: {
    async loadBlob() {
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.$store.state.core.user.token;
      this.blob = await getFileBlob(this.file.path, { token });
      this.isLoading = false;
    }
  },
  components: {
    Loader
  }
};
</script>
