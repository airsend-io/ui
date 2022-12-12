<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Logo class="mx-auto mb-4" />

        <LoginForm routed />

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
import appInfo from '../../package.json';
import Loader from 'airsend/components/Loader.vue';
import BigIllustration from 'airsend/assets/big-illustration.svg';

import LoginForm from '../components/Forms/Login.vue';

export default {
  name: 'Login',
  components: {
    Loader,
    Logo,
    BigIllustration,
    LoginForm
  },
  data() {
    return {
      errors: {},
      env: process.env,
      version: appInfo.version,
      form: {
        email: '',
        password: '',
        remember_me: true
      }
    };
  },
  mounted() {
    this.$store.dispatch('core/setTitle', this.$t('auth.titles.login'));

    if (this.env.VUE_APP_GOOGLE_ID && this.env.VUE_APP_GOOGLE_ID !== '') {
      if (window.gapi) {
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
  },
  methods: {
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/login', this.form);

      if (!response.ok) {
        this.errors = response.error;
      }
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

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      const auth2 = gapi.auth2.getAuthInstance();
      if (auth2 !== null) {
        auth2.signOut().then(auth2.disconnect());
      }
    }
  }
};
</script>
