<template>
  <Modal
    name="login"
    :title="$t('auth.auth-to-reply')"
    class-name="auth-modal"
    @opened="onOpen"
  >
    <div class="padder">
      <LoginForm />
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

import LoginForm from './Forms/Login.vue';

export default {
  components: {
    Modal,
    Loader,
    LoginForm
  },
  data() {
    return {
      errors: {},
      form: {
        email: '',
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
        this.form.email = this.user.email;
        this.$refs.password.focus();
      } else {
        this.$refs.email.focus();
      }
    },
    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};

      const response = await this.$store.dispatch('core/login', this.form);

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('login');
    }
  }
};
</script>
