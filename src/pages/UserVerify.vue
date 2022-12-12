<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Loader :loading="this.$store.state.loading['user.verify']" full />

        <Logo class="mx-auto mb-4" />

        <div v-if="isDone">
          <div class="form-group">
            <label class="text-center text-success">{{ isDoneMessage }}</label>
          </div>

          <div class="text-center d-block">
            <router-link
              to="/login"
              class="btn btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-4"
              >{{ $t('auth.back-to-login') }}</router-link
            >
          </div>
        </div>
        <form v-else novalidate="true" @submit="onSubmit">
          <div v-if="typeof errors === 'string'" class="alert alert-danger">
            {{ errors }}
          </div>

          <div class="form-group" :class="{ [`is-invalid`]: errors['user'] }">
            <label for="email">{{ $t('auth.email') }}</label>
            <input
              id="email"
              v-model="form.user"
              type="email"
              class="form-control form-control--underline"
              :placeholder="$t('auth.email-placeholder')"
              disabled
            />
            <small v-if="errors['user']" class="form-text text-danger">{{
              errors['user']
            }}</small>
          </div>

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['verify_code'] }"
          >
            <label for="verify_code">{{ $t('auth.verification-code') }}</label>
            <input
              id="verify_code"
              v-model="form.verify_code"
              type="text"
              class="form-control form-control--underline"
              :placeholder="$t('auth.verification-code-placeholder')"
              disabled
            />
            <small v-if="errors['verify_code']" class="form-text text-danger">{{
              errors['verify_code']
            }}</small>
          </div>

          <div class="text-center d-block">
            <button
              type="submit"
              class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
            >
              {{ $t('auth.verify-code') }}
            </button>
            <router-link
              to="/login"
              class="btn btn-half btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-3"
              >{{ $t('auth.back-to-login') }}</router-link
            >
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from 'airsend/assets/airsend-color.svg';
import appInfo from '../../package.json';
import Loader from 'airsend/components/Loader.vue';
import BigIllustration from 'airsend/assets/big-illustration.svg';

export default {
  name: 'UserVerify',
  components: {
    Loader,
    Logo,
    BigIllustration
  },
  data() {
    return {
      errors: {},
      env: process.env,
      version: appInfo.version,
      isDone: false,
      isDoneMessage: '',
      form: {}
    };
  },
  mounted() {
    this.$store.dispatch('core/setTitle', 'Verify your Account');

    const { user, verify_code } = this.$route.query;

    if (user && verify_code) {
      this.form = {
        user,
        verify_code
      };

      // force form submit
      this.onSubmit();
    } else {
      this.$router.push('/login');
    }
  },
  methods: {
    onSubmit: async function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch(
        'core/verifyAccount',
        this.form
      );

      if (response.ok) {
        this.isDone = true;
        this.isDoneMessage = response.message;
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
