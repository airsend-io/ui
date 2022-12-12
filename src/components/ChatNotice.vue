<template>
  <div
    class="chat-message"
    v-observe-visibility="{
      callback: (isVisible, entry) =>
        visibilityChanged(isVisible, entry, message),
      throttle: 0,
      once: true
    }"
    :data-plain-text="
      `[${parseTime(message.created_on).format('YYYY-MM-DD hh:mm A')}] ${
        message.plain_content
      }`
    "
  >
    <div class="chat-notice" v-if="channel">
      <div class="notice-content" v-if="message.content.i18n">
        <Icon family="fas" :name="icon" /><span
          @click="onClickMessage"
          v-html="
            parseMessageContent(
              message.content.i18n.count
                ? $tc(
                    message.content.i18n.key,
                    message.content.i18n.count,
                    i18nParams
                  )
                : $t(message.content.i18n.key, i18nParams),
              channel
            )
          "
        ></span>
      </div>
      <div class="notice-content" v-else>
        <Icon family="fas" :name="icon" /><span
          @click="onClickMessage"
          v-html="parseMessageContent(message.content.bot_message, channel)"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import Icon from 'airsend/components/Icon.vue';

import { parseMessageContent, parseTime } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

export default {
  props: {
    message: {
      type: Object
    },
    channel: {
      type: Object
    }
  },
  computed: {
    icon() {
      switch (this.message.content.type) {
        case 1:
          return 'file-upload';
          break;
        case 2:
          return 'users';
          break;
        default:
          return 'bolt';
      }
    },
    IS_READONLY() {
      return (
        this.$router.history.current.query.hash !== undefined ||
        this.user.read_only === true
      );
    },
    user() {
      return this.$store.state.core.user;
    },
    i18nParams() {
      const params = { ...this.message.content.i18n.params };

      // parse due date
      if (params.due) {
        params.due = moment
          .unix(params.due)
          .local()
          .format('dddd, MMMM DD, hh:mm A');
      }

      if (params.file_blurb) {
        let fullpath = params.file_blurb.match(/\(([^)]+)\)/);

        if (!fullpath) return params;

        const path = fullpath[1].split('://').slice(-1)[0];
        params.file_blurb = params.file_blurb.replace(
          path,
          encodeURIComponent(path)
        );
      }

      return params;
    }
  },
  methods: {
    visibilityChanged(isVisible, entry, message) {
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
    },

    onClickMessage(e) {
      // if it's a link
      if (e.target.tagName === 'A') {
        e.preventDefault();
        e.stopPropagation();

        const [type, ref] = e.target.href.split('://');
        const title = e.target.text;
        const path = decodeURIComponent(decodeURIComponent(`${ref}`));

        // check if it's a real file
        if (type === 'path' && title.indexOf('.') > -1) {
          EventBus.$emit(
            'file-preview',
            [{ file: title, path: `${path}/${title}` }],
            0
          );
        }

        // check if it's a real file
        if (type === 'wiki') {
          EventBus.$emit('wiki-preview', { file: path });
        }

        if (type === 'meeting') {
          const {
            call_hash,
            server_address
          } = this.message.content.i18n.params;
          this.$store.dispatch('meeting/join', {
            room: call_hash,
            server_address,
            channelId: this.channel.id,
            shouldJoinVideo: false
          });
        }
      }

      // handle mentions click
      if (
        e.target.tagName === 'SPAN' &&
        e.target.className === 'mention mention-user'
      ) {
        if (this.channel.member[e.target.dataset.mentionId]) {
          this.$modal.show(
            'user-modal',
            this.channel.member[e.target.dataset.mentionId]
          );
        }
      }

      // action mention handling
      if (
        e.target.tagName === 'SPAN' &&
        e.target.className === 'mention mention-action'
      ) {
        const {
          action_id,
          channel_id,
          action_name
        } = this.message.content.i18n.params;
        this.$modal.show('action-create', { context: 'view', id: action_id });
      }
    },
    parseMessageContent,
    parseTime
  },
  components: {
    Icon
  }
};
</script>
