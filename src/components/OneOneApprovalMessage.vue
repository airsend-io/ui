<template>
  <div>
    <Loader :loading="isLoading" full />

    <div
      v-if="channel.one_one && isChannelBlocked"
      class="one-one-report-spam-message"
    >
      <p>
        <Icon family="far" name="info-circle" />
        You have blocked <b>{{ username }}</b
        >, you are not going to receive messages from them anymore until you
        unblock.
      </p>

      <div class="buttons-container">
        <button class="btn btn-default" @click="onUnblock">
          <Icon family="fal" name="ban" />Unblock
        </button>
      </div>
    </div>

    <div
      v-else-if="
        channel.one_one &&
          !channel.one_one_approved &&
          channel.owned_by !== user.id
      "
      class="one-one-report-spam-message"
    >
      <p>
        <Icon family="far" name="info-circle" />
        <b>{{ username }} </b> is trying to contact you, you can reply to accept
        the message request or block them.
      </p>

      <div class="buttons-container">
        <button class="btn btn-default mr-2" @click="handleReportSpam">
          <Icon family="far" name="shield-alt" />Report spam
        </button>
        <button class="btn btn-default" @click="onBlock">
          <Icon family="fal" name="ban" />Block
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader';

export default {
  components: {
    Icon,
    Loader
  },
  computed: {
    username() {
      return this.channel.counterpart.display_name;
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id] || {};
    },
    user() {
      return this.$store.state.core.user || {};
    },
    isChannelBlocked() {
      return this.channel.blocked_on;
    },
    isLoading() {
      return (
        this.$store.state.loading['channel.block'] ||
        this.$store.state.loading['channel.unblock']
      );
    }
  },
  methods: {
    handleReportSpam() {
      this.$modal.show('one-one-report-spam', {
        username: this.username,
        channel: this.channel
      });
    },
    onBlock() {
      this.$store.dispatch('channels/blockChannel', { channel: this.channel });
    },
    async onUnblock() {
      await this.$store.dispatch('channels/unblockChannel', {
        channel: this.channel
      });

      this.$emit('unblocked', true);
    }
  }
};
</script>
