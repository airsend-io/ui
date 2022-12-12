<template>
  <div class="file-preview-item file-preview-item--office">
    <Loader v-if="isLoading" />
    <div ref="wrapper" id="document-wrapper" class="viewer-js"></div>
  </div>
</template>
<script>
import Vue from 'vue';
import Loader from 'airsend/assets/loader.svg';

import {
  getFilePureBlob,
  getFileExtension,
  getFileType,
  loadScript
} from 'airsend/utils';

export default {
  props: {
    file: {
      type: Object
    }
  },
  data() {
    return {
      isLoading: true,
      instance: null,
      render: null,
      blob: null,
      url: null
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.isLoading = true;

      // unsuported file versions
      if (
        ['docx', 'xlsx', 'pptx'].indexOf(getFileExtension(this.file.file)) ===
        -1
      ) {
        this.$emit('fallback', 'DefaultView');
        return;
      }

      // get real app url
      const appUrl = window.location.origin;

      // destroy document preview instance
      if (this.instance) {
        this.instance.destroy();
      }

      this.render = null;

      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.$store.state.core.user.token;

      // load file blob
      this.blob = await getFilePureBlob(this.file.path, { token });

      this.blob.name = this.blob.fileName = this.file.file;

      await loadScript(`${appUrl}/vendor/jquery.min.js`);

      switch (getFileType(this.file.file)) {
        case 'word':
          await loadScript(`${appUrl}/vendor/docxjs/DocxJS.bundle.min.js`);
          await loadScript(`${appUrl}/vendor/docxjs/DocxUiLoader.js`);

          this.instance = window.docxJS = window.createDocxJS
            ? window.createDocxJS()
            : new window.DocxJS();
          this.render = window.docxAfterRender;

          break;

        case 'excel':
          await loadScript(`${appUrl}/vendor/celljs/CellJS.bundle.min.js`);
          await loadScript(`${appUrl}/vendor/celljs/CellUiLoader.js`);

          this.instance = window.cellJS = window.createCellJS
            ? window.createCellJS()
            : new window.CellJS();
          this.render = window.cellAfterRender;

          break;

        case 'powerpoint':
          await loadScript(`${appUrl}/vendor/slidejs/SlideJS.bundle.min.js`);
          await loadScript(`${appUrl}/vendor/slidejs/SlideUiLoader.js`);

          this.instance = window.slideJS = window.createSlideJS
            ? window.createSlideJS()
            : new window.SlideJS();
          this.render = window.slideAfterRender;

          break;

        default:
      }

      this.instance.parse(
        this.blob,
        this.onParseDocument,
        this.onParseDocumentFail
      );
    },
    onParseDocument() {
      const element = window.jQuery('#document-wrapper')[0];
      window.jQuery(element).css('height', 'calc(100% - 65px)');

      this.render(element, this.onRenderDocument.bind(this));

      this.isLoading = false;
    },
    onRenderDocument(result) {},
    onParseDocumentFail(err) {
      this.$emit('fallback', 'DefaultView');
    }
  },
  components: {
    Loader
  }
};
</script>
