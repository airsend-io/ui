<template>
  <portal to="modal-wrapper">
    <Modal
      name="file-picker"
      :title="$t('files.modals.pick-file-title')"
      class="picker-modal"
      @before-open="onOpen"
    >
      <form novalidate="true" @submit="onSubmit">
        <ol v-if="breadcrumb" class="breadcrumb breadcrumb--light">
          <li
            v-for="(route, index) in breadcrumb"
            :key="route.path"
            class="breadcrumb-item"
          >
            <a
              v-if="index !== breadcrumb.length - 1"
              @click="browse(route.path)"
              >{{ route.title }}</a
            >
            <span v-else aria-current="page">{{ route.title }}</span>
          </li>
        </ol>

        <FileList
          ref="fileList"
          :initial-path="path"
          initial-path-name="Wiki"
          lock-initial
          select-only
          picker
          @browse="onBrowse"
          @selected="onSelect"
          @paginate="fetchPage"
        />

        <button
          type="submit"
          class="btn btn-primary btn-rounded mx-auto d-block mt-4"
          :disabled="!target || target === ''"
        >
          {{ $t('files.modals.pick-file-button') }}
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
      files: null,
      target: null,
      path: null,
      breadcrumb: null
    };
  },
  computed: {
    previousVersions() {
      return this.currentFile &&
        this.$store.state.files.versions[this.currentFile.fullpath]
        ? this.$store.state.files.versions[this.currentFile.fullpath]
        : [];
    }
  },
  beforeCreate: function() {
    this.$options.components.FileList = require('../Files/FileList.vue').default;
  },
  mounted() {},
  methods: {
    onOpen(e) {
      const { params } = e;
      this.path = params;
      this.target = null;
    },
    fetchPage({ path, before = false }) {
      this.$store.dispatch('files/getPage', { path, before });
    },
    onSelect(selected) {
      const [file] = selected;
      this.target = file;
    },
    onBrowse({ path, name, breadcrumb }) {
      this.currentPath = path;
      this.currentPathName = name.name;
      this.breadcrumb = breadcrumb;
    },
    browse(path) {
      this.$refs.fileList.browse(path);
    },
    onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      this.$emit('picked', `${this.currentPath}/${this.target}`);

      this.$modal.hide('file-picker');
      this.$refs.fileList.onClearSelect();
    }
  }
};
</script>
