<template>
  <div class="chat-fragment-scroller-wrapper">
    <div class="chat-fragment-scroller" ref="scroller">
      <EmptyChannel
        v-if="channel.chat.history.length === 0"
        :channel="channel"
        :memberEmail="channel.member_email"
        :createdByName="channel.members[0].display_name"
        :createdByID="channel.created_by"
        @uploadFile="$emit('uploadFile')"
      />
      <ChatLoader
        ref="top-loader"
        v-if="
          channel.chat &&
            (channel.chat.has_more || channel.chat.buffer.older.length > 0)
        "
      />
      <component
        v-for="item in channel.chat.history"
        :ref="'message-' + item.id"
        :data-id="item.id"
        v-bind:class="{ 'chat-loading': item.sending }"
        v-bind:is="item.component"
        :message="item"
        :channel="channel"
        @quote="onQuote"
        @edit="onEdit"
        :key="item.id"
      ></component>
      <ChatLoader
        ref="bottom-loader"
        v-if="
          channel.chat &&
            (channel.chat.has_more_newer ||
              channel.chat.buffer.newer.length > 0)
        "
      />
    </div>

    <div
      ref="floating"
      class="chat-fragment-scroller-floating"
      :class="{
        ['chat-fragment-scroller-floating--visible']:
          hasNewMessages || hasPersonTyping || hasPendingOneOne
      }"
    >
      <TypingIndicator :people="channel.typing" />

      <button
        class="btn"
        v-if="hasNewMessages"
        :class="{
          ['btn-default']: channel && channel.unread_count === 0,
          ['btn-primary']: channel && channel.unread_count > 0
        }"
        @click="jumpToRecent"
      >
        <Icon family="fal" name="chevron-down" />
        Jump to the recent messages
      </button>

      <OneOneApprovalMessage @unblocked="$emit('unblocked', true)" />
    </div>

    <div
      :class="{ active: loadingMore || isNavigating || isSyncing }"
      class="chat-fragment-scroller-loader"
    >
      <span>{{
        $t(
          isSyncing ? 'channels.syncing-messages' : 'channels.loading-messages'
        )
      }}</span>
    </div>
  </div>
</template>
<script>
import ChatMessage from 'airsend/components/ChatMessage.vue';
import ChatDivider from 'airsend/components/ChatDivider.vue';
import ChatNotice from 'airsend/components/ChatNotice.vue';
import Icon from 'airsend/components/Icon.vue';
import EmptyChannel from 'airsend/components/EmptyChannel.vue';
import TypingIndicator from 'airsend/components/TypingIndicator.vue';
import ChatLoader from 'airsend/components/ChatLoader.vue';
import SingleMessageLoader from './Channel/Chat/SingleMessageLoader.vue';
import OneOneApprovalMessage from 'airsend/components/OneOneApprovalMessage.vue';

import { EventBus } from 'airsend/event-bus.js';

export default {
  props: {
    channel: {
      type: Object
    }
  },
  computed: {
    hasNewMessages() {
      return (
        this.channel &&
        this.channel.chat.history &&
        (this.channel.chat.has_more_newer ||
          (this.channel.chat.buffer &&
            this.channel.chat.buffer.newer &&
            this.channel.chat.buffer.newer.length > 0))
      );
    },
    hasPersonTyping() {
      return this.channel.typing && this.channel.typing.length > 0;
    },
    hasPendingOneOne() {
      return (
        this.channel.one_one &&
        (this.channel.blocked_on ||
          (!this.channel.one_one_approved &&
            this.channel.owned_by !== this.user.id))
      );
    },
    hasFloatingBar() {
      return (
        this.hasNewMessages || this.hasPersonTyping || this.hasPendingOneOne
      );
    },
    user() {
      return this.$store.state.core.user || {};
    },
    reversedItems() {
      if (!this.channel || !this.channel.chat.history) return [];
      return this.channel.chat.history.map(message => {
        return {
          ...message,
          id: message.id.toString()
        };
      });
    },
    isSyncing() {
      return this.$store.state.loading['channels/sync'];
    }
  },
  data() {
    return {
      loadingMore: false,
      isOnBottom: true,
      messagesCount: 0,
      keepScroll: null,
      isNavigating: 0, // if user is navigating on past messages
      target: null,
      downloadStarted: false,
      downloadCompleted: false,
      downloadPath: '',
      pivotMessageId: null,
      scrollDifference: 0
    };
  },
  watch: {
    channel: {
      handler: function(newChannel, oldChannel) {
        if (
          !newChannel.chat.messages ||
          this.messageCount !== newChannel.chat.messages.length
        ) {
          setTimeout(this.scrollToBottom.bind(this), 50);
        }
      },
      deep: true
    },
    $route(from, to) {
      if (from.params.id != to.params.id || from.name !== 'channel' || !from) {
        //channel changed
        this.init();
      }
    }
  },
  beforeUpdate() {
    // if there are old messages
    if (this.isNavigating === 1) {
      const firstMessage = this.$refs.scroller.querySelector(
        '.chat-message:not(.chat-message--loader):not(.chat-message--sticky)'
      );
      const firstMessageOffset = firstMessage.offsetTop;
      const currentScrollTop = this.$refs.scroller.scrollTop;
      this.pivotMessageId = firstMessage.getAttribute('data-id');
      this.scrollDifference = firstMessageOffset - currentScrollTop;
    } else if (this.isNavigating === 2) {
      let lastMessage = this.$refs.scroller.querySelectorAll(
        '.chat-message:not(.chat-message--loader):not(.chat-message--sticky)'
      );
      lastMessage = lastMessage[lastMessage.length - 1];
      const lastMessageOffset = lastMessage.offsetTop;
      const currentScrollTop = this.$refs.scroller.scrollTop;
      this.pivotMessageId = lastMessage.getAttribute('data-id');
      this.scrollDifference = lastMessageOffset - currentScrollTop;
    }
  },
  updated() {
    this.$nextTick(function() {
      this.updateFloatingStyle();

      // check if there is a pivot message and pivot is different from the latest
      if (this.isNavigating !== 0 && this.pivotMessageId) {
        const pivotMessage = this.$refs.scroller.querySelector(
          `.chat-message[data-id="${this.pivotMessageId}"]`
        );

        if (
          this.isNavigating === 1 &&
          this.$refs.scroller
            .querySelector(
              '.chat-message:not(.chat-message--loader):not(.chat-message--sticky)'
            )
            .getAttribute('data-id') != this.pivotMessageId
        ) {
          this.$refs.scroller.scrollTop =
            pivotMessage.offsetTop - this.scrollDifference;

          this.pivotMessageId = null;
          this.loadingMore = false;

          this.isNavigating = 0;
        }

        // scrolling down
        if (this.isNavigating === 2) {
          let lastMessage = this.$refs.scroller.querySelectorAll(
            '.chat-message:not(.chat-message--loader):not(.chat-message--sticky)'
          );
          lastMessage = lastMessage[lastMessage.length - 1];

          if (lastMessage.getAttribute('data-id') !== this.pivotMessageId) {
            this.$refs.scroller.scrollTop =
              pivotMessage.offsetTop - this.scrollDifference;

            this.pivotMessageId = null;
            this.loadingMore = false;

            this.isNavigating = 0;
          }
        }
      }
    });

    // if there is a target waiting for update
    if (this.target) {
      this.scrollTo(this.target);
      this.target = null;
    }
  },
  mounted() {
    this.init();

    this.$refs.scroller.addEventListener('scroll', this.handleScroll);
    this.$refs.scroller.addEventListener('copy', this.onCopy);

    EventBus.$on('message-sent', this.scrollToBottom.bind(this, true));
  },
  destroyed() {
    EventBus.$off('message-sent');
    if (this.$refs.scroller) {
      this.$refs.scroller.removeEventListener('copy', this.onCopy);
      this.$refs.scroller.removeEventListener('scroll', this.handleScroll);
    }
  },
  methods: {
    init() {
      this.loadingMore = false;
      this.isOnBottom = true;
      this.isNavigating = 0;

      // check if there is a target
      const target = this.$route.params.target
        ? this.$route.params.target
        : this.$route.query.highlight;

      if (target) {
        this.scrollTo(target);
      } else {
        this.scrollToBottom(true);
      }

      this.updateFloatingStyle();
    },

    updateFloatingStyle() {
      if (this.hasFloatingBar) {
        this.$refs.scroller.style.paddingBottom = `calc(1rem + ${this.$refs.floating.offsetHeight}px)`;
      } else {
        this.$refs.scroller.style.paddingBottom = '1rem';
      }

      if (this.isOnBottom) {
        this.scrollToBottom();
      }
    },

    async jumpToRecent() {
      this.$store.commit('channels/clearMessages', this.$route.params.id);
      await this.$store.dispatch('channels/history', this.$route.params.id);

      await this.$store.dispatch('channels/readAll', {
        channel_id: this.channel.id,
        channel_name: this.channel.channel_name,
        no_toast: true
      });
    },

    handleScroll(e) {
      if (
        this.isNavigating === 0 &&
        this.$refs['top-loader'] &&
        e.target.scrollTop < this.$refs['top-loader'].$el.offsetHeight &&
        !this.loadingMore
      ) {
        this.loadMore();
      }

      if (
        this.isNavigating === 0 &&
        this.$refs['bottom-loader'] &&
        e.target.scrollTop + e.target.offsetHeight >
          this.$refs['bottom-loader'].$el.offsetTop &&
        !this.loadingMore
      ) {
        this.loadMore(true);
      }

      if (e.target.scrollTop + e.target.offsetHeight < e.target.scrollHeight) {
        this.isOnBottom = false;
      }

      if (
        e.target.scrollTop + e.target.offsetHeight ===
        e.target.scrollHeight
      ) {
        this.isOnBottom = true;
      }
    },
    onCopy(e) {
      var userSelection;
      if (window.getSelection) {
        // W3C Ranges
        userSelection = window.getSelection();
        // Get the range:
        if (userSelection.getRangeAt) var range = userSelection.getRangeAt(0);
        else {
          var range = document.createRange();
          range.setStart(userSelection.anchorNode, userSelection.anchorOffset);
          range.setEnd(userSelection.focusNode, userSelection.focusOffset);
        }

        // And the HTML:
        var clonedSelection = range.cloneContents();
        var div = document.createElement('div');
        div.appendChild(clonedSelection);

        const texts = div.querySelectorAll('[data-plain-text]');
        let messagesClipboard = '';

        for (var i = 0; i < texts.length; i++) {
          messagesClipboard += `${texts[i].getAttribute('data-plain-text')}\n`;
        }

        if (messagesClipboard !== '') {
          // set clipboard
          e.clipboardData.setData('text/plain', messagesClipboard);
          e.preventDefault();
        }
      }
    },
    onQuote(e) {
      this.$emit('quote', e);
    },
    onEdit(e) {
      this.$emit('edit', e);
    },
    async loadMore(newer = false) {
      const chat = this.channel.chat;

      if (
        this.isOnBottom ||
        (!newer &&
          !chat.has_more &&
          chat.buffer &&
          chat.buffer.older.length === 0) ||
        (newer &&
          !chat.has_more_newer &&
          chat.buffer &&
          chat.buffer.newer.length === 0)
      ) {
        // reached the full bottom
        if (newer) {
          this.isOnBottom = true;

          // only trigger read all if channel has unread messages
          if (this.channel.unread_count > 0 && document.hasFocus()) {
            this.$store.dispatch('channels/readAll', {
              channel_id: this.channel.id,
              channel_name: this.channel.channel_name,
              no_toast: true
            });
          }
        }

        return;
      }

      const { resource } = this.$route.params;

      if (resource === 'messages') {
        this.$router.push(`/channel/${this.channel.id}`);
      }

      // 1 for older, 2 for newer
      this.isNavigating = !newer ? 1 : 2;

      this.messagesCount = chat.messages.length;
      this.loadingMore = true;

      await this.$store.dispatch('channels/next', {
        id: this.channel.id,
        newer
      });

      // this.loadingMore = false;
    },
    async scrollTo(id) {
      const scroller = this.$refs.scroller;

      // if message is available on the DOM
      if (this.$refs[`message-${id}`] && this.$refs[`message-${id}`][0]) {
        let elem = this.$refs[`message-${id}`][0].$el;

        // scroll top -1rem
        this.$refs.scroller.scrollTop = elem.offsetTop - 16;

        this.isOnBottom =
          scroller.scrollTop + scroller.offsetHeight === scroller.scrollHeight
            ? true
            : false;
      } else {
        this.target = id;
      }
    },
    scrollToBottom(force) {
      const scroller = this.$refs.scroller;

      if (scroller && (force || this.isOnBottom)) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    }
  },
  components: {
    ChatMessage,
    ChatDivider,
    ChatNotice,
    Icon,
    EmptyChannel,
    TypingIndicator,
    ChatLoader,
    SingleMessageLoader,
    OneOneApprovalMessage
  }
};
</script>
