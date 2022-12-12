<template>
  <fragment>
    <div class="toast-item-content" @click="onConfirm">
      <div class="toast-item-author avatar-wrapper" v-if="toast.user_id">
        <Avatar
          :user-id="toast.user_id"
          :has-avatar="user.has_avatar"
          :cache="user ? user.updated_on_ts : 0"
          size="small"
        />
      </div>
      <div class="toast-item-icon" v-else-if="toast.icon">
        <Icon family="fal" :name="toast.icon" />
      </div>
      <div
        class="toast-item-message"
        v-html="
          parseMessageContent(
            typeof toast.content === 'string'
              ? toast.content
              : $t(toast.content.key, {
                  ...user,
                  ...toast.content.i18n
                })
          )
        "
      />
    </div>
    <button
      type="button"
      v-if="toast.close"
      class="btn btn-icon btn-sm"
      @click="onDismiss(toast.id)"
    >
      <Icon family="far" name="times" />
    </button>
  </fragment>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';
import Avatar from 'airsend/components/Avatar.vue';
import { parseMessageContent } from 'airsend/utils';

export default {
  props: {
    toast: {
      type: Object,
      required: true
    }
  },
  methods: {
    onDismiss(id) {
      this.$store.commit('core/dismissSidebarToast', id);
    },
    onConfirm() {
      if (this.toast.onClick) this.toast.onClick();
      this.onDismiss(this.toast.id);
    },
    parseMessageContent
  },
  computed: {
    channel() {
      if (this.toast.channel_id)
        return this.$store.state.channels.single[this.toast.channel_id];
      return this.$store.state.channels.single[this.$route.params.id];
    },
    user() {
      return this.$store.getters['channels/getUserInChannel'](
        this.channel.id,
        this.toast.user_id
      );
    }
  },
  components: {
    Icon,
    Avatar
  }
};
</script>
