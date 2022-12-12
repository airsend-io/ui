<template>
  <div class="file-preview-item file-preview-item--pdf">
    <Loader v-if="isLoading" />
    <div @click="onClickLink" class="pdf-wrapper" v-else>
      <pdf v-for="i in numPages" :key="i" :page="i" :src="loadingTask"></pdf>
    </div>
  </div>
</template>

<script>
import { getFileUrl, getFileBlob } from 'airsend/utils';
import Loader from 'airsend/assets/loader.svg';
import pdf from 'vue-pdf';

export default {
  props: {
    file: {
      type: Object
    }
  },
  data() {
    return {
      isLoading: true,
      blob: null,
      currentPage: 0,
      numPages: 0,
      loadingTask: null
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
      try {
        const self = this;

        this.isLoading = true;

        const token = this.$route.query.hash
          ? this.$route.query.hash
          : this.$store.state.core.user.token;

        this.loadingTask = pdf.createLoadingTask(
          getFileUrl('download', this.file.path, { token })
        );

        this.loadingTask.promise.then(pdf => {
          console.log(pdf);
          this.blob = pdf;
          this.numPages = pdf.numPages;

          this.loadingTask._worker.destroy();
          this.isLoading = false;
        });
      } catch (err) {
        console.log(err);
        this.$emit('fallback', 'DefaultView');
      }
    },
    onClickLink(e) {
      e.preventDefault();
      e.stopPropagation();

      const { target } = e;

      if (target.nodeName === 'A' && target.className !== 'internalLink') {
        window.open(target.href, '_blank');
      }
    }
  },
  components: {
    Loader,
    pdf
  }
};
</script>
