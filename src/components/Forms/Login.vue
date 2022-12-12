<template>
  <div>
    <form v-if="step === 0" id="login" novalidate="true" @submit="onLogin">
      <Loader :loading="this.$store.state.loading['user.login']" full />

      <div
        v-if="isElectron"
        class="mb-3 oauth-signin-button"
        @click="initiateGoogleLogin"
      >
        <GoogleLogo /> <span>{{ $t('auth.sign-with-google') }}</span>
      </div>
      <div
        v-if="
          this.env.VUE_APP_GOOGLE_ID &&
            this.env.VUE_APP_GOOGLE_ID !== '' &&
            !isElectron
        "
        id="google-signin-button"
        class="mb-3 google-signin-button"
      ></div>

      <div
        v-if="
          isElectron &&
            this.env.VUE_APP_APPLE_ID &&
            this.env.VUE_APP_APPLE_ID !== ''
        "
        class="mb-3 oauth-signin-button"
        @click.stop.prevent="initiateAppleLogin()"
      >
        <Icon family="fab" name="apple" />
        <span>{{ $t('auth.sign-with-apple') }}</span>
      </div>

      <div
        v-if="
          !isElectron &&
            this.env.VUE_APP_APPLE_ID &&
            this.env.VUE_APP_APPLE_ID !== ''
        "
        class="mb-3 oauth-signin-button"
        @click.stop.prevent="appleSignIn()"
      >
        <Icon family="fab" name="apple" />
        <span>{{ $t('auth.sign-with-apple') }}</span>
      </div>

      <div
        v-if="this.env.VUE_APP_GOOGLE_ID && this.env.VUE_APP_GOOGLE_ID !== ''"
        class="form-separator"
      >
        <span>{{ $t('auth.use-email') }}</span>
      </div>

      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['email'] }">
        <label for="email">{{ $t('auth.email') }}</label>
        <input
          id="email"
          v-model="login.email"
          type="email"
          class="form-control form-control--underline"
          :placeholder="$t('auth.email-placeholder')"
          autofocus
        />
        <small v-if="errors['email']" class="form-text text-danger">{{
          $t(errors['email'].message, errors['email'].meta)
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['password'] }">
        <label for="password">{{ $t('auth.password') }}</label>
        <input
          id="password"
          ref="password"
          v-model="login.password"
          type="password"
          class="form-control form-control--underline"
          placeholder="******"
        />
        <small v-if="errors['password']" class="form-text text-danger">{{
          $t(errors['password'].message, errors['password'].meta)
        }}</small>
      </div>

      <div class="row">
        <div class="col-6">
          <div class="form-group form-check">
            <input
              id="remember_me"
              v-model="login.remember_me"
              type="checkbox"
              class="form-check-input"
            />
            <label class="form-check-label" for="remember_me">{{
              $t('auth.remember')
            }}</label>
          </div>
        </div>

        <div class="col-6">
          <div class="form-group text-right">
            <a href="#" class="h6" @click="browse($event, 'recover')">{{
              $t('auth.forgot-password')
            }}</a>
          </div>
        </div>
      </div>

      <div class="text-center d-block">
        <button
          style="min-width:50%;"
          type="submit"
          class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
        >
          {{ $t('auth.login') }}
        </button>
        <button
          v-if="!this.user.id"
          type="button"
          style="min-width:50%;"
          class="btn btn-half btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-3"
          @click="browse($event, 'signup')"
        >
          {{ $t('auth.signup') }}
        </button>
      </div>
    </form>

    <form v-if="step === 1" novalidate="true" @submit="onVerify">
      <div class="form-group">
        <label class="text-center text-info" for="email">{{
          $t('auth.login-verification')
        }}</label>
      </div>

      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div
        class="form-group"
        :class="{ [`is-invalid`]: errors['verify_code'] }"
      >
        <label for="name">{{ $t('auth.verification-code') }}</label>
        <input
          id="name"
          ref="verificationCode"
          v-model="verify.verify_code"
          type="text"
          class="form-control form-control--underline"
          :placeholder="$t('auth.verification-code-placeholder')"
          autofocus
        />
        <small v-if="errors['verify_code']" class="form-text text-danger">{{
          $t(errors['verify_code'].message, errors['verify_code'].meta)
        }}</small>
      </div>

      <div class="form-group text-left">
        <a
          href="#"
          class="h6"
          :class="{ disabled: refreshBlock > 0 }"
          @click="refreshCode"
          >{{
            refreshBlock > 0
              ? $t('auth.verification-code-resend-blocked', [refreshBlock])
              : $t('auth.verification-code-resend')
          }}</a
        >
      </div>

      <div class="text-center d-block">
        <button
          type="submit"
          class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
        >
          {{ $t('auth.verify-code') }}
        </button>
      </div>
    </form>
  </div>
</template>
<script>
import Loader from 'airsend/components/Loader.vue';
import GoogleLogo from 'airsend/assets/google.svg';
import { v1 as uuid } from 'uuid';
import Icon from 'airsend/components/Icon';

export default {
  components: {
    Loader,
    GoogleLogo,
    Icon
  },
  props: {
    routed: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      errors: {},
      env: process.env,
      step: 0,
      refreshInterval: null,
      refreshBlock: 0,
      isElectron: window.isElectron,
      login: {
        email: '',
        password: '',
        remember_me: true
      },
      verify: {
        verify_code: ''
      }
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    authenticatingThroughApp() {
      return this.$store.state.core.authenticatingThroughApp;
    }
  },
  mounted() {
    if (this.user.email) {
      this.login.email = this.user.email;
    }

    if (this.env.VUE_APP_GOOGLE_ID && this.env.VUE_APP_GOOGLE_ID !== '') {
      if (window.gapi && this.step === 0) {
        window.gapi.signin2.render('google-signin-button', {
          onsuccess: this.onGoogleSignin,
          onfailure: this.onGoogleSigninFail,
          scope: 'profile email',
          width: 240,
          height: 50,
          longtitle: true
        });
      }
    }

    if (this.env.VUE_APP_APPLE_ID && this.env.VUE_APP_APPLE_ID !== '') {
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
      }
    }

    if (window.isElectron) {
      // Evenet listener for Electron Google Sign in
      const ipcRenderer = window.ipcRenderer;
      ipcRenderer.on('Google-Signin-Success', async (event, arg) => {
        this.errors = {};
        const response = await this.$store.dispatch('core/googleOauth', {
          id_token: arg.id_token,
          client_id: this.env.VUE_APP_GOOGLE_ID_CLIENT_ELECTRON
        });

        if (response.ok) {
          this.$emit('done', true);
        } else {
          this.errors = response.error;
          return;
        }
      });

      ipcRenderer.on('Signin-Token', async (event, arg) => {
        const response = await this.$store.dispatch(
          'core/loginWithEmailAndToken',
          arg
        );

        if (response.ok) {
          this.$emit('done');
        } else {
          this.errors = 'sign-in-failed';
        }
      });
    }
  },
  methods: {
    async onLogin(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/login', this.login);

      if (response.ok) {
        this.$emit('done', true);
        if (this.authenticatingThroughApp) {
          this.$store.dispatch('core/openAppWithToken')();
        }
      } else {
        if (response.meta && response.meta.pending_verification) {
          this.step++;
          return;
        }

        this.errors = response.error;
      }
    },
    async onVerify(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/verifyAccount', {
        user: this.login.email,
        ...this.verify
      });

      if (response.ok) {
        this.$emit('done', true);
      } else {
        this.errors = response.error;
      }
    },

    async refreshCode(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch(
        'core/refreshVerificationCode',
        { email: this.login.email }
      );

      if (!response.ok) {
        this.errors = response.error;
      }

      this.refreshBlock = 30;
      this.refreshInverval = setInterval(() => {
        this.refreshBlock--;
        if (this.refreshBlock === 0) {
          clearInterval(this.refreshInverval);
        }
      }, 1000);
    },

    onGoogleSigninFail(response) {
      if (response.error !== 'popup_closed_by_user') {
        this.errors = this.$t('auth.errors.social-login', ['Google']);
      }
    },
    async onGoogleSignin(googleUser) {
      var profile = googleUser.getBasicProfile();
      var id_token = googleUser.getAuthResponse().id_token;

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/googleOauth', {
        id_token: id_token,
        client_id: this.env.VUE_APP_GOOGLE_ID,
        email: profile.getEmail()
      });

      if (response.ok) {
        this.$emit('done', true);
        if (this.authenticatingThroughApp) {
          this.$store.dispatch('core/openAppWithToken')();
        }
      } else {
        this.errors = response.error;
        return;
      }

      const auth2 = gapi.auth2.getAuthInstance();
      if (auth2 !== null) {
        auth2.signOut().then(auth2.disconnect());
      }
    },
    async appleSignIn() {
      // TODO - remove code repeat with Signup.vue
      if (window.AppleID) {
        const state = uuid();

        // reset errors
        this.errors = {};

        window.AppleID.auth
          .signIn({
            state
          })
          .then(async response => {
            if (_.get(response, 'authorization.state', '') !== state) {
              this.errors = 'Invalid State';
              return;
            }

            const code = _.get(response, 'authorization.code');
            const redirect_uri = this.appleRedirectUri;
            const client_id = this.env.VUE_APP_APPLE_ID;
            const apiResponse = await this.$store.dispatch('core/appleOauth', {
              code,
              redirect_uri,
              client_id
            });

            if (apiResponse.ok) {
              this.$emit('done');
              if (this.$store.state.core.authenticatingThroughApp) {
                this.$store.dispatch('core/openAppWithToken')();
              }
            } else if (apiResponse.error !== 'popup_closed_by_user') {
              this.errors = apiResponse.error;
            }
          })
          .catch(payload => {
            if (payload.error !== 'popup_closed_by_user') {
              this.errors = payload.error;
            }
          });
      }
    },
    browse(e, route) {
      e.preventDefault();
      e.stopPropagation();

      if (this.routed) {
        this.$router.push(`/${route}`);
      } else {
        this.$emit('browse', route);
      }
    },
    initiateGoogleLogin() {
      window.ipcRenderer.send('initiateGoogleLogin');
    },
    initiateAppleLogin() {
      let url = this.env.VUE_APP_ROOT_API || 'https://live.airsend.io/api';
      url = url.replace('/api', '');
      window.open(`${url}/authentication/apple`);
    }
  }
};
</script>
