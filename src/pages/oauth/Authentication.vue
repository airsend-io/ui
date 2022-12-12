<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Logo class="mx-auto mb-4" />
        <span v-if="this.errors" class="text-danger">{{ this.errors }}</span>

        <div v-if="isAuthenticated && isAppOpened" class="auth-success">
          <Icon family="far" name="check-circle" />
          <h2>{{ $t('auth.successfully-logged-in') }}</h2>
          <small @click="continueOnBrowser">{{
            $t('auth.successfully-logged-in-continue-on-browser')
          }}</small>
        </div>

        <div class="profile-block" v-else-if="isAuthenticated && user">
          <Avatar
            :name="user.display_name"
            :user-id="user.id"
            :cache="user.img_cache"
            :has-avatar="user.has_avatar"
            size="full"
            :active="user.online_status"
            preview
          />
          <h4 class="user-name">{{ user.display_name }}</h4>
          <h5 class="user-email" v-if="user.display_name !== user.email">
            {{ user.email }}
          </h5>
          <button
            class="btn btn-primary"
            @click="onOpenApp"
            :disabled="isFailedToOpenApp"
          >
            {{ $t('auth.open-app') }}
          </button>
          <button class="btn btn-secondary" @click="continueOnBrowser">
            {{ $t('auth.continue-on-browser') }}
          </button>
          <h6
            v-if="isFailedToOpenApp"
            @click="onDownloadApp"
            class="download-app-advertisement"
            v-html="$t('auth.download-app-advertisement')"
          ></h6>
          <hr />
          <button class="btn btn-link" @click="onSignout">
            <Icon name="sign-out" family="fas" />
            {{ $t('auth.different-account') }}
          </button>
        </div>

        <div v-else-if="client" class="auth-proceed">
          <div v-if="client === 'apple'">
            <span class="auth-description">{{
              $t('auth.apple-sign-in-description')
            }}</span>
            <button
              class="btn btn-primary auth-button"
              @click.stop.prevent="appleSignIn()"
            >
              {{ $t('auth.continue') }}
            </button>
            <a href="#" class="h6" @click="onChooseLoginMethod">{{
              $t('auth.choose-another-login-method')
            }}</a>
          </div>
        </div>

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
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import BigIllustration from 'airsend/assets/big-illustration.svg';

import FullAuthForm from '../../components/Forms/FullAuth.vue';

import OauthCreateClientModal from '../../components/Modals/OauthCreateClient.vue';
import { v1 as uuid } from 'uuid';

export default {
  name: 'OauthLogin',
  components: {
    Loader,
    Icon,
    Avatar,
    Logo,
    FullAuthForm,
    BigIllustration,
    OauthCreateClientModal
  },
  data() {
    const { reporter_name, reporter_email } = this.$route.query;

    return {
      errors: '',

      isAuthenticated: false,
      isAppOpened: false,
      isFailedToOpenApp: false,

      client: '',
      appleRedirectUri: '',
      env: process.env
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    }
  },
  async mounted() {
    this.$store.dispatch('core/setTitle', 'AirSend oAuth');
    this.$store.commit('core/set', { authenticatingThroughApp: true });

    this.client = this.$route.params.client;

    if (this.client === 'apple') {
      if (window.AppleID) {
        this.appleRedirectUri = _.get(
          this.env,
          'VUE_APP_APPLE_REDIRECT_URL',
          `${window.location.protocol}//${window.location.host}/oauth/apple`
        );

        window.AppleID.auth.init({
          clientId: this.env.VUE_APP_APPLE_ID,
          scope: 'name email',
          redirectURI: this.appleRedirectUri,
          usePopup: true
        });
      } else {
        this.errors = 'Authentication client offline, try again later.';
      }
    }

    //load default user and send token to app
    if (this.user && this.user.id) {
      this.isAuthenticated = true;
    }
  },
  methods: {
    continueOnBrowser() {
      this.$router.push('/');
    },
    onChooseLoginMethod() {
      this.$router.push('/login');
    },
    onDownloadApp() {
      window.open('https://airsend.io/', '_blank').focus();
    },
    onSignout() {
      this.$store.dispatch('core/signout');
    },
    async onOpenApp() {
      const openApp = await this.$store.dispatch('core/openAppWithToken');

      if (openApp.ok) {
        setTimeout(() => {
          this.isAppOpened = false; //shows after 5 seconds
        }, 5000);
      } else {
        this.isFailedToOpenApp = true;
      }
    },
    async appleSignIn() {
      // TODO - remove code repeat with Signup.vue
      if (window.AppleID) {
        const state = uuid();

        // reset errors
        this.errors = '';
        window.AppleID.auth
          .signIn({
            state
          })
          .then(async response => {
            console.log('then', response);
            if (_.get(response, 'authorization.state', '') !== state) {
              this.errors = 'Invalid State';
              return;
            }

            const code = _.get(response, 'authorization.code');
            const redirect_uri = this.appleRedirectUri;
            const client_id = this.env.VUE_APP_APPLE_ID;

            const payload = {
              code,
              redirect_uri,
              client_id
            };

            const apiResponse = await this.$store.dispatch('core/appleOauth', {
              code,
              redirect_uri,
              client_id
            });

            if (apiResponse.ok) {
              this.isAuthenticated = true;

              this.onOpenApp();
            }
          })
          .catch(payload => {
            this.errors = payload.error;
          });
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
    }
  }
};
</script>
