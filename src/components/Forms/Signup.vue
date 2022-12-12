<template>
  <div>
    <form
      v-if="step === 0"
      id="registration"
      novalidate="true"
      @submit="onSignup"
    >
      <Loader :loading="this.$store.state.loading['user.create']" full />

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

      <div class="form-separator">
        <span>{{ $t('auth.use-email') }}</span>
      </div>

      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['name'] }">
        <label for="name">{{ $t('auth.name') }}</label>
        <input
          id="name"
          v-model="signup.name"
          type="text"
          class="form-control form-control--underline"
          :placeholder="$t('auth.name-placeholder')"
          autofocus
        />
        <small v-if="errors['name']" class="form-text text-danger">{{
          $t(errors['name'].message, errors['name'].meta)
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['email'] }">
        <label for="email">{{ $t('auth.email') }}</label>
        <input
          id="email"
          v-model="signup.email"
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
          v-model="signup.password"
          type="password"
          class="form-control form-control--underline"
          placeholder="******"
        />
        <small v-if="errors['password']" class="form-text text-danger">{{
          $t(errors['password'].message, errors['password'].meta)
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['recaptcha'] }">
        <div id="recaptchav2"></div>
        <small v-if="errors['recaptcha']" class="form-text text-danger">{{
          $t(errors['recaptcha'])
        }}</small>
      </div>

      <div class="form-group">
        <label
          v-html="
            $t('auth.accept-tos', {
              tos: 'https://www.airsend.io/legal/tos.html',
              policy: 'https://www.airsend.io/legal/privacy.html'
            })
          "
        ></label>
      </div>

      <div class="text-center d-block">
        <button
          type="submit"
          class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
        >
          {{ $t('auth.signup') }}
        </button>
        <button
          type="button"
          class="btn btn-half btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-3 px-0"
          @click="browse($event, 'login')"
        >
          {{ $t('auth.back-to-login') }}
        </button>
      </div>
    </form>

    <form
      v-if="step === 1"
      id="registration"
      novalidate="true"
      @submit="onVerify"
    >
      <div class="form-group">
        <label class="text-center text-info" for="email">{{
          $t('auth.signup-confirmation')
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
import Icon from 'airsend/components/Icon.vue';
import { v1 as uuid } from 'uuid';

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
      signup: {
        name: '',
        email: '',
        password: ''
      },
      verify: {
        verify_code: ''
      },
      appleRedirectUri: ''
    };
  },
  computed: {
    reCaptchaV2Required() {
      return this.$store.state.core.recaptchaV2Required;
    }
  },
  watch: {
    reCaptchaV2Required(newValue, oldValue) {
      if (newValue !== oldValue && newValue) {
        const recaptchaV2Key = _.get(
          this.$store.state,
          'core.handshakeSettings.recaptchaV2SiteKey',
          ''
        );
        if (recaptchaV2Key.length > 0) {
          grecaptcha.render('recaptchav2', {
            sitekey: recaptchaV2Key
          });
        }
      }
    }
  },
  mounted() {
    const { email, name } = this.$route.query;

    if (email) {
      this.signup.email = email;
    }

    if (name) {
      this.signup.name = name;
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

    // TODO - grab the site key from handshake
    if (this.$store.state.core.recaptchaV2Required) {
      grecaptcha.render('recaptchav2', {
        sitekey: _.get(
          this.$store.state.core,
          'handshakeSettings.recaptchaV2SiteKey',
          ''
        )
      });
    }
  },
  methods: {
    async onSignup(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const currentRoute = this.$router.history.current;

      if (currentRoute.name === 'channel' && currentRoute.params.hash) {
        this.signup = {
          ...this.signup,
          from_public_channel_id: currentRoute.params.id,
          from_public_channel_hash: currentRoute.params.hash
        };
      }

      const response = await this.$store.dispatch('core/signup', this.signup);

      if (response.ok) {
        this.step++;
        setTimeout(() => {
          this.$refs.verificationCode.focus();
        }, 500);
      } else {
        this.errors = { ...this.errors, ...response.error };
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
        user: this.signup.email,
        ...this.verify
      });

      if (response.ok) {
        this.$emit('done');
        if (this.authenticatingThroughApp) {
          this.$store.dispatch('core/openAppWithToken')();
        }
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
        { email: this.signup.email }
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
        this.$emit('done');
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
      // TODO - remove code repeat with Login.vue
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
              if (this.authenticatingThroughApp) {
                this.$store.dispatch('core/openAppWithToken')();
              }
            } else {
              this.errors = apiResponse.error;
            }
          })
          .catch(payload => {
            this.errors = payload.error;
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
