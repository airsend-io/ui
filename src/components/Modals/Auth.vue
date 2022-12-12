<template>
  <Modal
    name="auth"
    :title="$t('auth.signin-to-interact')"
    class-name="auth-modal"
    @opened="onOpen"
  >
    <div class="padder">
      <LoginForm v-if="current === 'login'" @browse="onBrowse" />
      <SignupForm v-if="current === 'signup'" @browse="onBrowse" />
      <ForgetPasswordForm v-if="current === 'recover'" @browse="onBrowse" />
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

import LoginForm from '../Forms/Login.vue';
import SignupForm from '../Forms/Signup.vue';
import ForgetPasswordForm from '../Forms/ForgetPassword.vue';

export default {
  components: {
    Modal,
    Loader,
    LoginForm,
    SignupForm,
    ForgetPasswordForm
  },
  data() {
    return {
      errors: {},
      current: 'login',
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
      this.current = 'login';

      /*
      if(this.user.email) {
        this.form.email = this.user.email;
        this.$refs.password.focus();
      } else {
        this.$refs.email.focus();
      }
      */
    },
    onBrowse(target) {
      this.current = target;
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
