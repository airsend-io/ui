<template>
  <div>
    <LoginForm v-if="current === 'login'" @browse="onBrowse" />
    <SignupForm v-if="current === 'signup'" @browse="onBrowse" />
    <ForgetPasswordForm v-if="current === 'recover'" @browse="onBrowse" />
  </div>
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
    onBrowse(target) {
      this.current = target;
    }
  }
};
</script>
