<template>
  <div class="page-content page-login">
    <div class="page-login-illustration">
      <BigIllustration class="dandelion-illustration" />
    </div>

    <div class="col-md-5 auth-box">
      <div class="auth-box-content">
        <Loader :loading="this.$store.state.loading['password.reset']" full />

        <Logo class="mx-auto mb-4" />

        <div v-if="isDone">
          <div class="form-group">
            <label class="text-center text-success" for="email">{{
              $t('auth.recover-success')
            }}</label>
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

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['password'] }"
          >
            <label for="password">{{ $t('auth.new-password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-control form-control--underline"
              :placeholder="$t('auth.new-password-placeholder')"
              autofocus
            />
            <small v-if="errors['password']" class="form-text text-danger">{{
              $t(errors['password'].message, errors['password'].meta)
            }}</small>
          </div>

          <div class="text-center d-block">
            <button
              type="submit"
              class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
            >
              {{ $t('auth.reset-password') }}
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
  name: 'Signup',
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
      form: {}
    };
  },
  mounted() {
    this.$store.dispatch('core/setTitle', this.$t('auth.titles.recover'));

    const { reset_code, user_id } = this.$route.query;

    if (reset_code && user_id) {
      this.form = {
        reset_code,
        user_id
      };
    } else {
      this.$router.push('/login');
    }
  },
  methods: {
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch(
        'core/resetPassword',
        this.form
      );

      if (response.ok) {
        this.isDone = true;
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
