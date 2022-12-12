<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Logo class="mx-auto mb-4" />

        <span v-if="this.errors" class="text-danger">{{ this.errors }}</span>
        <form
          v-else-if="user.display_name"
          class="oauth-form"
          @submit="onSubmit"
        >
          <Loader
            full
            :loading="
              this.$store.state.loading['oauth.server.authorize'] ||
                this.$store.state.loading['oauth.server.approve']
            "
          />

          <div v-if="client">
            <h1 class="mb-2 d-flex">Authorize {{ client.name }}</h1>
            <p>{{ client.description }}</p>

            <hr />

            <p>
              <b>{{ client.name }} will be able to:</b>
            </p>

            <ul>
              <li v-for="scope in client.scopes">{{ scope }}</li>
            </ul>

            <div class="text-center d-block">
              <button
                style="min-width:50%;"
                type="submit"
                class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
              >
                Authorize
              </button>
            </div>
          </div>
        </form>
        <FullAuthForm v-else />

        <div class="text-center d-block">
          <a
            class="mt-4 mx-auto btn-sm btn btn-light"
            @click="() => this.$modal.show('language')"
            >{{ $t('title') }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from 'airsend/assets/airsend-color.svg';
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';
import BigIllustration from 'airsend/assets/big-illustration.svg';

import FullAuthForm from '../../components/Forms/FullAuth.vue';

import OauthCreateClientModal from '../../components/Modals/OauthCreateClient.vue';

export default {
  name: 'OauthLogin',
  components: {
    Loader,
    Icon,
    Logo,
    FullAuthForm,
    BigIllustration,
    OauthCreateClientModal
  },
  data() {
    const { reporter_name, reporter_email } = this.$route.query;

    return {
      errors: null,
      success: false,
      client: {}
    };
  },
  computed: {
    clients() {
      return this.$store.state.core.oauth.clients;
    },
    user() {
      return this.$store.state.core.user;
    }
  },
  watch: {
    user: function() {
      this.checkClient();
    }
  },
  async mounted() {
    this.$store.dispatch('core/setTitle', 'AirSend oAuth');
    this.checkClient();
  },
  methods: {
    async checkClient() {
      if (!this.user.display_name) return;

      const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state
      } = this.$route.query;

      const response = await this.$store.dispatch(
        'core/getOauthAutorizationInfo',
        {
          client_id,
          response_type,
          redirect_uri,
          scope,
          state,
          redirect: 0
        }
      );

      if (response.ok) {
        const { location } = response.data;

        if (location) {
          window.location = location;
        } else {
          this.client = response.data;
        }
      } else {
        this.errors = response.error;
      }
    },
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      const { request_key } = this.client;
      const { client_id } = this.$route.query;

      const response = await this.$store.dispatch('core/approveOauth', {
        client_id,
        request_key,
        approve: 1,
        redirect: 0
      });

      if (response.ok) {
        const { location } = response.data;
        window.location = location;
      } else {
        this.errors = response.error;
      }

      return;

      // reset errors
      this.errors = {};
      this.success = false;

      if (!response.ok) {
        this.errors = response.error;
      } else {
        this.success = true;
      }
    }
  }
};
</script>
