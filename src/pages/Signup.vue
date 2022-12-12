<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Logo class="mx-auto mb-4" />

        <SignupForm routed />

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
import BigIllustration from 'airsend/assets/big-illustration.svg';

import SignupForm from '../components/Forms/Signup.vue';

export default {
  name: 'Signup',
  components: {
    Loader,
    Logo,
    BigIllustration,
    SignupForm
  },
  data() {
    return {
      errors: {}
    };
  },
  mounted() {
    this.$store.dispatch('core/setTitle', this.$t('auth.titles.signup'));
  }
};
</script>
