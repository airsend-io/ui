<template>
  <Modal name="user-modal" :title="target.display_name" @before-open="onOpen">
    <div class="profile-block">
      <Loader :loading="loading" full />

      <Avatar
        :name="target.display_name"
        :user-id="target.id"
        :cache="target.img_cache"
        :has-avatar="target.has_avatar"
        size="full"
        :active="target.online_status"
        preview
      />
      <h4>{{ target.display_name }}</h4>

      <p v-if="target.last_active_on && !target.online_status" class="mb-2">
        {{
          $t('channels.last-seen', {
            time: parseTime(target.last_active_on).fromNow()
          })
        }}
      </p>
      <p v-else-if="target.online_status" class="mb-2">
        {{ $t('channels.members-online-now') }}
      </p>
      <hr />
      <button
        v-if="target.id !== user.id"
        class="btn btn-link"
        @click="createOneToOne"
      >
        <Icon name="paper-plane" family="fas" />
        {{ $t('channels.direct-message') }}
      </button>
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import { parseTime } from 'airsend/utils';

export default {
  components: {
    Modal,
    Loader,
    Avatar,
    Icon
  },
  data() {
    return {
      target: {}
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    loading() {
      return this.$store.state.loading['channel.one-on-one'];
    }
  },
  methods: {
    onOpen(e) {
      this.target = e.params;
    },
    async createOneToOne() {
      await this.$store.dispatch('channels/createOneOnOne', this.target.id);
      this.$modal.hide('user-modal');
    },
    parseTime
  }
};
</script>
