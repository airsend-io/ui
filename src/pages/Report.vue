<template>
  <div class="page-content">
    <div class="container container-sm py-4">
      <h1>Report {{ $route.query.channel_name }}</h1>

      <form novalidate="true" @submit="onSubmit">
        <Loader
          :loading="this.$store.state.loading['user.notifications.manage']"
          full
        />

        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <div v-if="success" class="alert alert-primary">
          Successfully reported {{ $route.query.channel_name }} channel.
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['reporter_name'] }"
        >
          <label for="reporter_name" class="mb-2">Your Name</label>
          <input
            id="reporter_name"
            ref="reporter_name"
            v-model="form.reporter_name"
            type="reporter_name"
            class="form-control"
            placeholder=""
          />
          <small v-if="errors['reporter_name']" class="form-text text-danger">{{
            errors['reporter_name']
          }}</small>
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['reporter_email'] }"
        >
          <label for="reporter_email" class="mb-2">Your Email</label>
          <input
            id="reporter_email"
            ref="reporter_email"
            v-model="form.reporter_email"
            type="reporter_email"
            class="form-control"
            placeholder=""
          />
          <small
            v-if="errors['reporter_email']"
            class="form-text text-danger"
            >{{ errors['reporter_email'] }}</small
          >
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['report_text'] }"
        >
          <label for="report_text" class="mb-2"
            >Please describe the report
          </label>
          <textarea
            id="report_text"
            ref="report_text"
            v-model="form.report_text"
            type="report_text"
            class="form-control"
            placeholder=""
          ></textarea>
          <small v-if="errors['report_text']" class="form-text text-danger">{{
            errors['report_text']
          }}</small>
        </div>

        <div class="text-center d-block">
          <button
            type="submit"
            class="btn btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
          >
            Report to AirSend
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Loader from 'airsend/components/Loader.vue';

export default {
  name: 'EmailSettings',
  components: {
    Loader
  },
  data() {
    const { reporter_name, reporter_email } = this.$route.query;

    return {
      errors: {},
      success: false,
      form: {
        reporter_name,
        reporter_email,
        report_text: ''
      }
    };
  },
  mounted() {
    this.$store.dispatch('core/setTitle', 'Report a Channel');
  },
  methods: {
    onSubmit: async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset errors
      this.errors = {};
      this.success = false;

      const response = await this.$store.dispatch('core/report', this.form);

      if (!response.ok) {
        this.errors = response.error;
      } else {
        this.success = true;
      }
    }
  }
};
</script>
