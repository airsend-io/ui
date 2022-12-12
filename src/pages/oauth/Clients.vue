<template>
  <div class="page-content">
    <div class="container container-sm py-4">
      <h1 class="mb-3 d-flex">
        Your oAuth Clients
        <button class="btn btn-sm btn-icon ml-auto" @click="openCreateModal">
          <Icon name="plus" />
        </button>
      </h1>

      <p v-if="clients && clients.length === 0">No clients added yet</p>
      <div v-else class="list-group">
        <a
          v-for="client in clients"
          href="#"
          class="list-group-item list-group-item-action"
          @click.prevent="openClient(client)"
        >
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ client.name }}</h5>
            <small v-if="client.active" class="text-success">Active</small>
          </div>
          <small>{{ client.description }}</small>
        </a>
      </div>
    </div>

    <OauthCreateClientModal @created="onCreateClient" />
    <OauthClientModal />
  </div>
</template>

<script>
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';

import OauthCreateClientModal from '../../components/Modals/OauthCreateClient.vue';
import OauthClientModal from '../../components/Modals/OauthClient.vue';

export default {
  name: 'EmailSettings',
  components: {
    Loader,
    Icon,
    OauthCreateClientModal,
    OauthClientModal
  },
  data() {
    return {
      errors: {},
      success: false
    };
  },
  computed: {
    clients() {
      return this.$store.state.core.oauth.clients;
    }
  },
  mounted() {
    this.$store.dispatch('core/setTitle', 'oAuth Clients');
    this.$store.dispatch('core/getOauthClients');
  },
  methods: {
    openClient(client) {
      this.$modal.show('oauth-client', client);
    },
    onCreateClient() {},
    openCreateModal() {
      this.$modal.show('oauth-create-client');
    }
  }
};
</script>
