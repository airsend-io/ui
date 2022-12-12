<template>
  <portal to="modal-wrapper">
    <Modal
      name="file-move"
      :title="$t('files.modals.move-title')"
      class="picker-modal"
      @before-open="onOpen"
    >
      <Loader :loading="this.$store.state.loading['file.move']" full />

      <form novalidate="true" @submit="onSubmit">
        <ol v-if="$refs.fileList" class="breadcrumb breadcrumb--light">
          <li
            v-for="(route, index) in $refs.fileList.breadcrumb"
            :key="route.path"
            class="breadcrumb-item"
          >
            <a
              v-if="index !== $refs.fileList.breadcrumb.length - 1"
              @click="browse(route.path)"
              >{{ route.title }}</a
            >
            <span v-else aria-current="page">{{ route.title }}</span>
          </li>
        </ol>

        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <FileList
          ref="fileList"
          :initial-path="path"
          select-only
          @browse="onBrowse"
          @paginate="fetchPage"
        />

        <button
          type="submit"
          class="btn btn-primary btn-rounded mx-auto d-block mt-4"
          :disabled="
            !target ||
              target === '' ||
              target === path ||
              isSubdirectoryOfPath ||
              ($refs.fileList && !$refs.fileList.pathInfo.canupload)
          "
        >
          {{ $t('files.modals.move-button') }}
        </button>
      </form>
    </Modal>
  </portal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

import Icon from 'airsend/components/Icon.vue';

export default {
  components: {
    Modal,
    Loader,
    Icon
  },
  data() {
    return {
      errors: null,
      files: null,
      target: null,
      path: null
    };
  },
  computed: {
    previousVersions() {
      return this.currentFile &&
        this.$store.state.files.versions[this.currentFile.fullpath]
        ? this.$store.state.files.versions[this.currentFile.fullpath]
        : [];
    },
    isSubdirectoryOfPath() {
      return this.files.some(file => {
        return this.target.startsWith(`${this.path}/${file}`);
      });
    }
  },
  beforeCreate: function() {
    this.$options.components.FileList = require('../Files/FileList.vue').default;
  },
  mounted() {},
  methods: {
    onOpen(e) {
      const { params } = e;
      const { files, path } = params;
      this.files = files;
      this.path = path;
    },
    fetchPage({ path, before = false }) {
      this.$store.dispatch('files/getPage', { path, before });
    },
    onBrowse({ path }) {
      this.target = path;
    },
    browse(path) {
      this.$refs.fileList.browse(path);
    },
    onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      if (this.files) {
        this.files.forEach(item => {
          this.$store.dispatch('files/move', {
            from: this.path,
            to: this.target,
            file: item
          });
        });
      }

      this.$modal.hide('file-move');
      this.$refs.fileList.onClearSelect();
    }
  }
};
</script>
