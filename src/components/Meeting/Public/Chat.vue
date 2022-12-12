<template>
  <Drop
    v-cloak
    class="meeting-chat-fragment"
    ref="meetingChat"
    :class="{ [`is-dragging`]: isDragActive }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <div class="meeting-chat-fragment-body" ref="scroller">
      <div class="close-public-chat" @click="closePublicChat">
        <Icon name="times" />
      </div>
      <div
        class="empty-wrapper"
        v-if="history.length === 0 && meeting.roomState !== 'closed'"
      >
        <div class="empty-box empty-box--meeting">
          <Icon family="fal" name="hand-spock" class="mb-4" />
          <h4>{{ $t(`channels.welcome-say-hi`) }}</h4>
          <p>{{ $t(`meeting.chat.no-messages`) }}</p>
        </div>
      </div>

      <div
        class="single-message"
        :class="{ 'single-message--mine': meeting.peerId == message.author.id }"
        v-for="(message, index) in history"
      >
        <Avatar
          size="medium"
          :name="message.author.display_name"
          :user-id="
            typeof message.author.id === 'number' ? message.author.id : null
          "
          :has-avatar="message.author.picture !== null"
          :cache="message.author.picture"
          is-meeting
        />
        <div class="message-wrapper">
          <h4>
            {{
              meeting.peerId == message.author.id
                ? $t('meeting.you')
                : message.author.display_name
            }}
            -
            <small>{{ parseTime(message.created_on).format('hh:mm A') }}</small>
          </h4>
          <div class="message-content" v-if="message.is_img">
            <div class="message-content-image">
              <img :src="message.content" />
              <div
                class="chat-message-content-image--giphy"
                v-if="message.content.search('giphy.com') > -1"
              >
                <img :src="GiphyLogo" />
              </div>
            </div>
          </div>
          <div
            class="message-content"
            v-else
            v-html="message.rich_content"
          ></div>
        </div>
      </div>
    </div>
    <div class="meeting-chat-fragment-footer-message">
      <div class="d-flex align-items-center">
        <p class="mb-0">{{ $t(`meeting.chat.not-saved-advice`) }}</p>
        <button
          class="btn btn-sm btn-icon ml-auto"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('meeting.settings.general.download-chat-button')
          }"
          @click="$store.dispatch('meeting/downloadChat')"
          v-if="history.length > 0"
        >
          <Icon family="fal" name="download" />
        </button>
      </div>
    </div>
    <Chatbar />
  </Drop>
</template>
<script>
import isElectron from 'is-electron';

import Icon from 'airsend/components/Icon';
import Avatar from 'airsend/components/Avatar';
import Chatbar from './Chatbar';
import GiphyLogo from 'airsend/assets/giphy.png';

import { parseMessageContent, parseTime, isWebImg } from 'airsend/utils';

import { Drop } from 'vue-drag-drop';

export default {
  components: {
    Icon,
    Avatar,
    Chatbar,
    Drop
  },
  props: ['channel'],
  data() {
    return {
      GiphyLogo,
      isDragActive: false,
      isOnBottom: false
    };
  },
  watch: {
    history() {
      this.$nextTick(() => {
        this.scrollToBottom(true);
      });
    }
  },
  computed: {
    meeting() {
      return this.$store.state.meeting;
    },
    history() {
      return this.$store.state.meeting.chatHistory;
    },
    user() {
      return this.$store.state.core.user;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.scrollToBottom(true);
    });
    this.$refs.scroller.addEventListener('scroll', this.onScroll);
  },
  destroyed() {
    if (this.$refs.scroller)
      this.$refs.scroller.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    onScroll(e) {
      if (
        e.target.scrollTop + e.target.offsetHeight ===
        e.target.scrollHeight
      ) {
        this.isOnBottom = true;
      } else {
        this.isOnBottom = false;
      }
    },
    scrollToBottom(force) {
      const scroller = this.$refs.scroller;
      if (scroller && (force || this.isOnBottom)) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    },
    closeMeeting() {
      this.exitFullscreen();
      this.$store.dispatch('meeting/close');
    },
    async onDropFile(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files.length > 0 || ext) {
        let files = [];

        // if it's an actual file
        if (e.dataTransfer.files.length > 0) {
          let droppedFiles = e.dataTransfer.files;
          if (!droppedFiles) {
            this.isDragActive = false;
            return;
          }

          [...droppedFiles].forEach(f => {
            files.push(f);
          });
        } else {
          files.push(ext);
        }

        this.$emit('drop', files);

        this.counter = 0;
        this.isDragActive = false;
      } else {
        this.counter = 0;
        this.isDragActive = false;
      }
    },
    onDragEnter(ext, e) {
      if (e.dataTransfer.types.indexOf('Files') > -1 || ext) {
        this.counter++;
        this.isDragActive = true;
      }
    },
    onDragLeave(ext, e) {
      if (e.dataTransfer.types.indexOf('Files') > -1 || ext) {
        this.counter--;
        if (this.counter === 0) {
          this.isDragActive = false;
        }
      }
    },
    closePublicChat() {
      this.$store.commit('meeting/set', {
        isChatOpen: !this.meeting.isChatOpen,
        chatUnreadCount: 0
      });
    },
    parseTime
  }
};
</script>
