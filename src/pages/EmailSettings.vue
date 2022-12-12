<template>
  <div class="page-content">
    <div class="container container-sm py-4">
      <h1>Email Notification Settings</h1>

      <form novalidate="true" @submit="onSubmit">
        <Loader
          :loading="this.$store.state.loading['user.notifications.manage']"
          full
        />

        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <div v-if="success" class="alert alert-primary">
          Successfully updated your notification settings
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['notification_option'] }"
        >
          <label for="notification_option" class="mb-2">Subscribe Level</label>
          <select
            v-model="form.notification_option"
            class="form-control"
            placeholder="Please select"
          >
            <option value="2">Allow all email notifications</option>
            <option value="1">Allow only mention notifications</option>
            <option value="0">No notifications (completely unsubscribe)</option>
          </select>
          <small
            v-if="errors['notification_option']"
            class="form-text text-danger"
            >{{ errors['notification_option'] }}</small
          >
        </div>

        <div class="text-center d-block">
          <button
            type="submit"
            class="btn btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Loader from 'airsend/components/Loader.vue';

export default {
  name: 'EmailSettings',
  components: {
    Loader
  },
  data() {
    return {
      errors: {},
      success: false,
      form: {
        notification_option: '0'
      }
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    }
  },
  mounted() {
    this.$store.dispatch('core/setTitle', 'Email Settings');
    Vue.set(this.form, 'notification_option', this.user.notifications_config);
  },
  methods: {
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};
      this.success = false;

      const response = await this.$store.dispatch(
        'core/notifications',
        this.form
      );

      if (!response.ok) {
        this.errors = response.error;
      } else {
        this.success = true;
      }
    }
  }
};
</script>
