<template>
  <Modal
    name="file-share"
    :title="file.name"
    @before-open="beforeOpen"
    @opened="onOpen"
  >
    <Loader
      :loading="
        this.$store.state.loading['file.link.create'] ||
          this.$store.state.loading['file.link.delete']
      "
      full
    />

    <div v-if="typeof errors === 'string'" class="alert alert-danger">
      {{ errors }}
    </div>

    <div class="form-group form-section">
      <div class="row">
        <div class="col">
          <h4>{{ $t('files.modals.share-title') }}</h4>
          <input
            ref="fileLink"
            class="form-control my-3"
            readonly="readonly"
            @focus="onFocusLinkInput"
            :value="file.external_link"
            v-if="file.external_link"
          />
          <p>{{ $t('files.modals.share-subtitle') }}</p>
        </div>
        <div class="col-md-3">
          <button
            class="btn btn-link mx-sm-2 mt-md-3"
            type="button"
            @click="onCopyLink"
            v-if="file.external_link"
          >
            <Icon name="copy" /> {{ $t('files.modals.share-copy-link') }}
          </button>
          <button
            class="btn btn-link mx-sm-2"
            type="button"
            @click="onToggleLink"
            v-if="!file.external_link"
          >
            <Icon name="link" /> {{ $t('files.modals.share-create-link') }}
          </button>
          <button
            class="btn btn-link mx-sm-2"
            type="button"
            @click="onToggleLink"
            v-else
          >
            <Icon name="trash-alt" /> {{ $t('files.modals.share-delete-link') }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
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
      errors: {},
      file: {},
      ext: null,
      path: null
    };
  },
  mounted() {},
  methods: {
    async beforeOpen(e) {
      console.log('before open');
      const { params } = e;
      this.errors = {};
      this.file = {
        ...params,
        external_link: ''
      };

      if (!this.file.external_link) {
        this.shareFile();
      }
    },
    async shareFile() {
      const response = await this.$store.dispatch(
        'files/share',
        this.file.fullpath
      );
      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.file.external_link = response.data.url;

      // wait for next tick to focus on input
      this.$nextTick(() => {
        if (this.$refs.fileLink) this.$refs.fileLink.focus();
      });
    },
    onOpen(e) {
      console.log('on open');
      if (this.$refs.fileLink) this.$refs.fileLink.focus();
    },
    onFocusLinkInput(e) {
      e.target.select();
    },

    // toggle channel link
    async onToggleLink() {
      // reset errors
      this.errors = {};

      if (this.file.external_link) {
        const response = await this.$store.dispatch(
          'files/unshare',
          this.file.fullpath
        );
        if (!response.ok) {
          this.errors = response.error;
          return;
        }

        this.file.external_link = null;
      } else {
        this.shareFile();
      }
    },

    onCopyLink() {
      if (this.$refs.fileLink) this.$refs.fileLink.focus();
      document.execCommand('copy');
    }
  }
};
</script>
