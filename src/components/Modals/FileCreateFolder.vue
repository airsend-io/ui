<template>
  <portal to="modal-wrapper" :order="2">
    <Modal
      name="file-create-folder"
      :title="$t('files.modals.create-folder-title')"
      @before-open="beforeOpen"
      @opened="onOpen"
    >
      <Loader :loading="this.$store.state.loading['file.create']" full />

      <form novalidate="true" @submit="onSubmit">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <div class="form-group" :class="{ [`is-invalid`]: errors['fsname'] }">
          <label for="fsname" class="mb-2">{{
            $t('files.modals.create-folder-form')
          }}</label>
          <input
            id="fsname"
            ref="fsname"
            v-model="form.fsname"
            type="fsname"
            class="form-control"
            placeholder=""
            autofocus
          />
          <small v-if="errors['fsname']" class="form-text text-danger">{{
            errors['fsname']
          }}</small>
        </div>

        <hr class="my-4" />

        <button class="btn btn-primary btn-rounded mx-auto d-block">
          {{ $t('files.modals.create-folder-button') }}
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
      errors: {},
      form: {
        fsname: ''
      },
      path: null
    };
  },
  mounted() {},
  methods: {
    beforeOpen(e) {
      const { params } = e;
      this.path = params;
      this.form = { fsname: '' };
    },
    onOpen(e) {
      this.$refs.fsname.focus();
    },
    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      // check if user exists in system
      const response = await this.$store.dispatch('files/createFolder', {
        ...this.form,
        fsparent: this.path
      });

      if (response.ok) {
        this.$modal.hide('file-create-folder');
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
