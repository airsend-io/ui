<template>
  <Modal
    name="oauth-create-client"
    title="Add oAuth Client"
    class="picker-modal"
    @opened="onOpen"
  >
    <Loader
      :loading="this.$store.state.loading['oauth.server.client.create']"
      full
    />

    <form novalidate="true" @submit="onSubmit">
      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['name'] }">
        <label for="name" class="mb-2">Client Name</label>
        <input
          id="name"
          ref="name"
          v-model="form.name"
          type="name"
          class="form-control"
          placeholder=""
          autofocus
        />
        <small v-if="errors['name']" class="form-text text-danger">{{
          $t(errors['name'].message, errors['name'].meta)
        }}</small>
      </div>

      <div
        class="form-group"
        :class="{ [`is-invalid`]: errors['description'] }"
      >
        <label for="description" class="mb-2">Client Description</label>
        <textarea
          id="description"
          ref="description"
          v-model="form.description"
          type="description"
          class="form-control"
          placeholder=""
        ></textarea>
        <small v-if="errors['description']" class="form-text text-danger">{{
          $t(errors['description'].message, errors['description'].meta)
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['grant_type'] }">
        <label for="grant_type" class="mb-2">Grant Type</label>
        <select v-model="form.grant_type" class="form-control">
          <option value="authorization_code">Authorization Code</option>
          <option value="client_credentials">Client Credentials</option>
        </select>
        <small v-if="errors['grant_type']" class="form-text text-danger">{{
          $t(errors['grant_type'].message, errors['grant_type'].meta)
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['redirect'] }">
        <label for="redirect" class="mb-2">Redirect URL</label>
        <input
          id="redirect"
          ref="redirect"
          v-model="form.redirect"
          type="redirect"
          class="form-control"
          placeholder="https://mysite.com"
          autofocus
        />
        <small v-if="errors['redirect']" class="form-text text-danger">{{
          $t(errors['redirect'].message, errors['redirect'].meta)
        }}</small>
      </div>

      <hr class="my-4" />

      <button class="btn btn-primary btn-rounded mx-auto d-block">
        Create Client
      </button>
    </form>
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
      form: {
        grant_type: 'authorization_code'
      }
    };
  },
  methods: {
    onOpen(e) {
      this.$refs.name.focus();
    },
    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      // check if user exists in system
      const response = await this.$store.dispatch(
        'core/createOauthClient',
        this.form
      );

      if (response.ok) {
        // reset form
        this.form = {
          grant_type: 'authorization_code'
        };

        this.$modal.hide('oauth-create-client');

        this.$modal.show('oauth-client', response.data.client);

        this.$store.dispatch('core/getOauthClients');
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
