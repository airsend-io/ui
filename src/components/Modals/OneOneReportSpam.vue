<template>
  <Modal
    name="one-one-report-spam"
    title="Report and Block"
    @opened="onOpen"
    @before-open="beforeOpen"
  >
    <Loader :loading="isLoading" full />

    <div class="one-one-report-spam">
      <p>
        <b>{{ target.username }}</b> is going to be reported to the AirSend
        administration and if the spam is confirmed the user will be globally
        blocked in our system.
      </p>

      <div class="additional-comments">
        <p>Additional comments <span>(optional)</span></p>
        <textarea
          class="form-control announcements-textarea"
          ref="additional-comments"
          v-model="additionalComments"
          @input="onAdditionalCommentsInput"
          rows="2"
        ></textarea>
      </div>

      <div class="buttons-container">
        <button class="btn btn-primary" @click="onReportSpam">
          Report and Block
        </button>
        <button
          class="btn btn-outline-primary"
          @click="$modal.hide('one-one-report-spam')"
        >
          Cancel
        </button>
      </div>
    </div>
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
      target: {},
      additionalComments: ''
    };
  },
  computed: {
    isLoading() {
      return this.$store.state.loading['channel.block'];
    }
  },
  methods: {
    onOpen() {
      this.$refs['additional-comments'].focus();
    },
    beforeOpen(e) {
      this.additionalComments = '';
      this.target = e.params;
    },
    async onReportSpam() {
      await this.$store.dispatch('channels/blockChannel', {
        channel: this.target.channel,
        message: this.additionalComments || 'report spam'
      });

      this.$modal.hide('one-one-report-spam');
    },
    onAdditionalCommentsInput() {
      let el = this.$refs['additional-comments'];

      var offset = el.offsetHeight - el.clientHeight;

      el.style.height = 'auto';
      el.style.height = el.scrollHeight + offset + 'px';
    }
  }
};
</script>
