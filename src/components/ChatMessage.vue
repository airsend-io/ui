<template>
  <div
    tabindex="0"
    class="chat-message chat-message--aggregated"
    v-bind:class="{
      'sent-by-me': message.user_id === user.id,
      'chat-loading': message.sending,
      'chat-message--extension': message.is_extension,
      'chat-message--has-children': message.has_children
    }"
  >
    <MemberCard
      :author="author"
      :message="message"
      :channel="channel"
      :team_id="channel.team_id"
    />
    <div class="chat-message-aggregated-content">
      <ChatMessageRow
        @quote="onQuote"
        @jumpTo="onJumpTo"
        @edit="onEdit"
        :message="message"
        :channel="channel"
        :context="context"
        v-observe-visibility="{
          callback: (isVisible, entry) =>
            visibilityChanged(isVisible, entry, message),
          throttle: 0,
          once: true
        }"
      />
    </div>
  </div>
</template>

<script>
import Avatar from 'airsend/components/Avatar.vue';
import _ from 'lodash';
import ChatMessageRow from 'airsend/components/ChatMessageRow.vue';
import MemberCard from 'airsend/components/MemberCard.vue';
import { parseMessageContent } from 'airsend/utils';

export default {
  props: {
    message: {
      type: Object
    },
    channel: {
      type: Object
    },
    context: {
      type: String,
      default: 'chat',
      validator: function(value) {
        return ['chat', 'action-history'].indexOf(value) !== -1;
      }
    }
  },
  computed: {
    // logged user
    user() {
      return this.$store.state.core.user;
    },
    // message author
    author() {
      const member = this.$store.getters['channels/getUserInChannel'](
        this.channel.id,
        this.message.user_id
      );
      return member ? member : { display_name: this.message.display_name };
    },
    IS_READONLY() {
      return (
        this.$router.history.current.query.hash !== undefined ||
        this.user.read_only === true
      );
    }
  },
  methods: {
    visibilityChanged(isVisible, entry, message) {
      // if it's new version
      if (this.channel.read_watermark_id) {
        // when a message is visible
        if (
          isVisible &&
          message.id > this.channel.read_watermark_id &&
          message.user_id !== this.user.id &&
          !this.IS_READONLY
        ) {
          if (document.hasFocus()) {
            this.$store.dispatch('channels/onReadMessage', {
              message_id: message.id,
              channel_id: this.channel.id
            });
          } else {
            // retry after 1s
            setTimeout(
              this.visibilityChanged.bind(this, true, null, message),
              1000
            );
          }
        }
      } else {
        // check if message is read
        if (message.id < this.channel.oldest_unread_message_id) {
          return;
        }

        const userIndex = _.findIndex(message.read_users, {
          user_id: this.user.id
        });

        // when a message is visible
        if (
          isVisible &&
          message.user_id !== this.user.id &&
          userIndex === -1 &&
          !this.IS_READONLY
        ) {
          if (document.hasFocus()) {
            this.$store.dispatch('channels/handleRead', {
              message_id: message.id,
              channel_id: this.channel.id
            });
          } else {
            setTimeout(
              this.visibilityChanged.bind(this, true, null, message),
              3000
            );
          }
        }
      }
    },
    onQuote(message) {
      this.$emit('quote', message);
    },
    onJumpTo(message) {
      this.$emit('jumpTo', message);
    },
    onEdit(message) {
      this.$emit('edit', message);
    }
  },
  components: {
    Avatar,
    ChatMessageRow,
    MemberCard
  }
};
</script>
