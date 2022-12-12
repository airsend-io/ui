<template>
  <Modal name="finalize" title="Complete your AirSend signup" @opened="onOpen">
    <form novalidate="true" @submit="onSubmit">
      <Loader :loading="this.$store.state.loading['user.login']" full />

      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['user'] }">
        <label for="user" class="mb-2">{{ $t('auth.email') }}</label>
        <input
          id="user"
          ref="user"
          v-model="form.user"
          type="email"
          class="form-control"
          :placeholder="$t('auth.email-placeholder')"
          disabled
        />
        <small v-if="errors['user']" class="form-text text-danger">{{
          errors['user']
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['name'] }">
        <label for="name" class="mb-2">{{ $t('auth.name') }}</label>
        <input
          id="name"
          ref="name"
          v-model="form.name"
          type="text"
          class="form-control"
          :placeholder="$t('auth.name-placeholder')"
        />
        <small v-if="errors['name']" class="form-text text-danger">{{
          errors['name']
        }}</small>
      </div>

      <div class="form-group" :class="{ [`is-invalid`]: errors['password'] }">
        <label for="password" class="mb-2">{{
          $t('auth.password-choose')
        }}</label>
        <input
          id="password"
          ref="password"
          v-model="form.password"
          type="password"
          class="form-control"
          placeholder="******"
        />
        <small v-if="errors['password']" class="form-text text-danger">{{
          errors['password']
        }}</small>
      </div>

      <hr class="my-4" />

      <button class="btn btn-primary btn-rounded mx-auto d-block">
        {{ $t('auth.signup-complete') }}
      </button>
    </form>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

export default {
  components: {
    Modal,
    Loader
  },
  data() {
    return {
      errors: {},
      form: {
        user: '',
        name: '',
        password: ''
      }
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    }
  },
  methods: {
    onOpen() {
      if (this.user.email) {
        this.form.user = this.user.email;
        this.$refs.name.focus();
      }
    },
    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/finalize', this.form);

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('finalize');
    }
  }
};
</script>
