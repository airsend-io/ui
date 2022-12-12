<template>
  <div class="page-content d-flex">
    <ChannelSwitcher v-if="user && user.id" ref="switcher" />
    <MeetingFragment>
      <template v-slot:left-side>
        <button
          class="btn btn-icon mr-auto"
          v-if="user && user.id"
          @click="toggleSwitcher"
        >
          <Icon family="far" name="bars" />
        </button>
        <div class="mr-auto" style="min-width:48px" v-else></div>
      </template>
      <template v-slot:right-side>
        <button class="btn btn-icon btn-badge ml-auto" @click="toggleChat">
          <UnreadBadge
            :unread_count="meeting.chatUnreadCount"
            v-if="meeting.chatUnreadCount > 0 && !meeting.isChatOpen"
          />
          <Icon family="far" name="comment-alt-lines" />
        </button>
      </template>
    </MeetingFragment>
    <MeetingChat v-if="meeting.isChatOpen" />
    <ChannelMembersModal />
  </div>
</template>

<script>
import Logo from 'airsend/assets/airsend-color.svg';
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';
import UnreadBadge from 'airsend/components/UnreadBadge.vue';

import ChannelMembersModal from '../components/Modals/ChannelMembers.vue';
import MeetingFragment from '../components/ChannelMeetingFragment.vue';
import ChannelSwitcher from '../components/ChannelSwitcher.vue';
import MeetingChat from '../components/Meeting/Public/Chat.vue';

export default {
  name: 'Meeting',
  components: {
    Loader,
    Logo,
    MeetingFragment,
    MeetingChat,
    ChannelMembersModal,
    ChannelSwitcher,
    Icon,
    UnreadBadge
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    meeting() {
      return this.$store.state.meeting;
    }
  },
  mounted() {
    /*
    const { hash } = this.$router.history.current.params;

    this.$store.dispatch('meeting/join', {
      room: hash,
      channelId: null
    });
    */
  },
  methods: {
    toggleSwitcher() {
      if (this.$refs.switcher) this.$refs.switcher.toggleMinification();
    },
    toggleChat() {
      this.$store.commit('meeting/set', {
        isChatOpen: !this.meeting.isChatOpen,
        chatUnreadCount: 0
      });
    }
  }
};
</script>
