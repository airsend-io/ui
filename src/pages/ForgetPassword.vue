<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Logo class="mx-auto mb-4" />

        <ForgetPasswordForm routed />

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

import ForgetPasswordForm from '../components/Forms/ForgetPassword.vue';

export default {
  name: 'ForgetPassword',
  components: {
    Loader,
    Logo,
    BigIllustration,
    ForgetPasswordForm
  },
  mounted() {
    this.$store.dispatch('core/setTitle', this.$t('auth.titles.recover'));
  },
  methods: {
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/recover', this.form);

      if (response.ok) {
        this.isDone = true;
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
