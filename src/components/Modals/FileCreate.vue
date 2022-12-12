<template>
  <portal to="modal-wrapper">
    <Modal
      class="modal-subwrapper"
      name="file-create"
      title="Add Page"
      @before-open="beforeOpen"
      @opened="onOpen"
    >
      <Loader :loading="this.$store.state.loading['file.create']" full />

      <form novalidate="true" @submit="onSubmit">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <div class="form-group" :class="{ [`is-invalid`]: errors['fsname'] }">
          <label for="fsname" class="mb-2">Page Name</label>
          <small v-if="errors['fsname']" class="form-text text-danger">{{
            errors['fsname']
          }}</small>
          <div class="input-group mb-3">
            <input
              id="fsname"
              ref="fsname"
              v-model="form.fsname"
              type="fsname"
              class="form-control"
              placeholder=""
              autofocus
            />
            <div class="input-group-append">
              <span id="" class="input-group-text">{{ ext }}</span>
            </div>
          </div>
        </div>

        <hr class="my-4" />

        <button class="btn btn-primary btn-rounded mx-auto d-block">
          Create Page
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
      ext: null,
      path: null
    };
  },
  mounted() {},
  methods: {
    beforeOpen(e) {
      const { params } = e;
      const { path, ext } = params;
      this.path = path;
      this.ext = ext;
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

      const fileName = `${this.form.fsname}${this.ext}`;

      // check if user exists in system
      const response = await this.$store.dispatch('files/upload', {
        path: this.path,
        noToast: true,
        files: [new File([''], fileName)]
      });

      if (response.ok) {
        this.$modal.hide('file-create');
        this.$emit('created', { path: this.path, file: fileName });
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
