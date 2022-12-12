<template>
  <div class="empty-channel">
    <div
      class="created-by"
      v-html="
        $t('channels.welcome-someone-created', {
          createdBy: createdByID,
          createdByName
        })
      "
    ></div>
    <div class="iconic-hand">
      <Icon family="fal" name="hand-spock" />
      {{ $t('channels.welcome-say-hi') }}
      <small
        v-if="channel.public_url === null"
        v-html="$t('channels.welcome-email-hint', { memberEmail })"
      ></small>
      <small
        v-else
        v-html="
          $t('channels.welcome-public-channel-hint', {
            publicLink: channel.public_url
          })
        "
      ></small>
    </div>
    <div class="cta-new-channel" v-if="!IS_READONLY">
      <button
        class="btn btn-primary btn-rounded"
        @click="openNewMemberModal"
        v-if="!channel.one_one"
      >
        <Icon family="fas" name="user-plus" />
        {{ $t('channels.add-new-member') }}
      </button>
      <button class="btn btn-primary btn-rounded" @click="$emit('uploadFile')">
        <Icon family="fas" name="upload" /> {{ $t('channels.upload-a-file') }}
      </button>
    </div>
  </div>
</template>
<script>
import Icon from 'airsend/components/Icon.vue';
import { EventBus } from 'airsend/event-bus';

export default {
  props: ['channel', 'createdByName', 'createdByID', 'memberEmail'],
  methods: {
    openNewMemberModal() {
      EventBus.$emit('addNewMembers', { type: 1, message: this.message });
    }
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    IS_READONLY() {
      return (
        this.$router.history.current.query.hash !== undefined ||
        this.user.read_only === true
      );
    }
  },
  components: {
    Icon
  }
};
</script>
