<template>
  <div>
    <Loader :loading="this.$store.state.loading['password.recover']" full />

    <div v-if="isDone">
      <div class="form-group">
        <label class="text-center text-success" for="email">{{
          $t('auth.recover-confirmation')
        }}</label>
      </div>

      <div class="text-center d-block">
        <button
          type="button"
          class="btn btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-4"
          @click="browse($event, 'login')"
        >
          {{ $t('auth.back-to-login') }}
        </button>
      </div>
    </div>
    <form v-else novalidate="true" @submit="onSubmit">
      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="form-group">
        <label class="text-center" for="email">{{
          $t('auth.recover-instructions')
        }}</label>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['opt_email'] }">
        <label for="opt_email">{{ $t('auth.email') }}</label>
        <input
          id="opt_email"
          v-model="form.opt_email"
          type="opt_email"
          class="form-control form-control--underline"
          :placeholder="$t('auth.email-placeholder')"
          autofocus
        />
        <small v-if="errors['opt_email']" class="form-text text-danger">{{
          $t(errors['opt_email'].message, errors['opt_email'].meta)
        }}</small>
      </div>

      <div class="text-center d-block">
        <button
          type="submit"
          class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
        >
          {{ $t('auth.reset-password') }}
        </button>
        <button
          type="button"
          class="btn btn-half btn-primary btn-ghost btn-rounded btn-extended mx-auto p-relative mt-3"
          @click="browse($event, 'login')"
        >
          {{ $t('auth.back-to-login') }}
        </button>
      </div>
    </form>
  </div>
</template>
<script>
import Loader from 'airsend/components/Loader.vue';

export default {
  components: {
    Loader
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
      isDone: false,
      form: {
        opt_email: ''
      }
    };
  },
  methods: {
    async onSubmit(e) {
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
    },

    browse(e, route) {
      e.preventDefault();
      e.stopPropagation();

      if (this.routed) {
        this.$router.push(`/${route}`);
      } else {
        this.$emit('browse', route);
      }
    }
  }
};
</script>
