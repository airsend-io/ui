<template>
  <Modal
    name="oauth-client"
    :title="client.name"
    class="picker-modal"
    @before-open="onOpen"
  >
    <form novalidate="true">
      <div class="form-group">
        <label for="description" class="mb-2">Client Description</label>
        <textarea
          class="form-control disabled"
          disabled
          :value="client.description"
        ></textarea>
      </div>

      <hr class="my-2" />

      <div class="form-group">
        <label for="description" class="mb-2">Client ID</label>
        <input class="form-control disabled" disabled :value="client.id" />
      </div>

      <div class="form-group">
        <label for="description" class="mb-2">Client Secret</label>
        <input class="form-control disabled" disabled :value="client.secret" />
      </div>

      <hr class="my-2" />

      <div class="form-group">
        <label for="description" class="mb-2">Sample oAuth Request</label>
        <textarea
          rows="5"
          class="form-control disabled"
          disabled
          :value="`${origin}/oauth?${query}`"
        ></textarea>
      </div>
    </form>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';

import Icon from 'airsend/components/Icon.vue';
import qs from 'query-string';

export default {
  components: {
    Modal,
    Icon
  },
  data() {
    return {
      errors: {},
      client: {},
      form: {},
      origin: window.location.origin,
      query: ''
    };
  },
  methods: {
    onOpen({ params }) {
      const { client_id } = params;

      this.client = params;

      this.query = qs.stringify({
        client_id: params.id,
        response_type: 'code',
        redirect_uri: params.redirectUri[0],
        scope: 'post_chat'
      });
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
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
