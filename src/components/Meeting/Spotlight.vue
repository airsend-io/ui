<template>
  <div class="meeting-body-spotlight" @click="details">
    <portal-target name="meeting-menu-area" />
    <div
      v-if="spotlight.id && peer"
      class="meeting-body-spotlight-content"
      :class="{
        [`meeting-body-spotlight-content--speaking`]: activeSpeaker == spotlight
      }"
    >
      <MeetingVideo
        v-if="spotlight.screenShare && consumers.screen"
        :consumer="consumers.screen"
      />
      <MeetingVideo
        v-else-if="consumers.webcam"
        class="cover"
        :consumer="consumers.webcam"
      />
      <Avatar
        v-else-if="user && user.id && user.id === peer.id"
        size="medium"
        :name="user ? user.display_name : peer.displayName"
        :user-id="user ? user.id : peer.id"
        :has-avatar="user ? user.has_avatar : false"
        :cache="user ? user.updated_on_ts : 0"
      />
      <Avatar
        v-else
        :name="peer.displayName"
        :user-id="typeof peer.id === 'number' ? peer.id : null"
        :has-avatar="peer.picture != null"
        :cache="peer.picture"
        size="medium"
        is-meeting
      />
      <div
        v-if="
          consumers.mic &&
            !consumers.webcam &&
            !spotlight.screenShare &&
            (selfSpotlight
              ? !consumers.mic.paused
              : !consumers.mic.remotelyPaused)
        "
        class="speaking-level"
        :style="{
          transform: `scale(${(
            1 +
            Math.round(meeting.peerVolumes[peer.id]) / 100
          ).toFixed(2)})`
        }"
      ></div>
      <div class="meeting-spotlight-info">
        <h4 v-if="spotlight.screenShare && spotlight.id === selfPeer.id">
          {{ $t('meeting.you-are-screensharing') }}
        </h4>
        <h4 v-else-if="spotlight.screenShare">
          {{
            $t('meeting.user-screen', {
              user: peer ? peer.displayName : user.display_name
            })
          }}
        </h4>
        <h4 v-else>
          {{ peer ? peer.displayName : user.display_name }}
        </h4>
        <h4 v-if="pinned.pin">({{ $t('meeting.click-to-unpin') }})</h4>
      </div>
    </div>
  </div>
</template>
<script>
import Avatar from 'airsend/components/Avatar';
import MeetingVideo from './Video';

export default {
  components: {
    Avatar,
    MeetingVideo
  },
  props: ['meeting', 'channel', 'pinned', 'activeSpeaker', 'value'],
  computed: {
    isScreenShareSpotlight() {
      return (
        this.consumers.screen &&
        (this.pinned.screenShare || this.pinned.screenShare === undefined)
      );
    },
    screenshare() {
      return this.$store.getters['meeting/hasScreenShare'];
    },
    user() {
      return this.$store.state.core.user;
    },
    // check which user will have the spotlight
    spotlight() {
      //pinned
      if (
        this.pinned &&
        this.pinned.pin &&
        (this.pinned.pin === this.selfPeer.id || this.getPeer(this.pinned.pin))
      ) {
        this.$emit('input', {
          id: this.pinned.pin,
          screenShare: this.pinned.screenShare
        });
        return { id: this.pinned.pin, screenShare: this.pinned.screenShare };
      }

      //hosting a screensharing
      if (this.producers.screen) {
        this.$emit('input', { id: this.selfPeer.id, screenShare: true });
        return { id: this.selfPeer.id, screenShare: true };
      }

      //someone is screensharing
      if (this.screenshare) {
        this.$emit('input', { id: this.screenshare.peerId, screenShare: true });
        return { id: this.screenshare.peerId, screenShare: true };
      }

      //last active speaker
      if (
        this.meeting.lastActiveSpeaker &&
        this.getPeer(this.meeting.lastActiveSpeaker)
      ) {
        this.$emit('input', {
          id: this.meeting.lastActiveSpeaker,
          screenShare: false
        });
        return { id: this.meeting.lastActiveSpeaker, screenShare: false };
      }

      //peers
      if (this.meeting.peers[0]) {
        this.$emit('input', {
          id: this.meeting.peers[0].id,
          screenShare: false
        });
        return { id: this.meeting.peers[0].id, screenShare: false };
      }

      //host
      this.$emit('input', {
        id: this.selfPeer.id,
        screenShare: false
      });
      return { id: this.selfPeer.id, screenShare: false };
    },
    peer() {
      if (this.selfSpotlight) {
        return this.selfPeer;
      }

      return this.spotlight.id
        ? this.$store.getters['meeting/getPeer'](this.spotlight.id)
        : {};
    },
    consumers() {
      if (this.selfSpotlight) return this.producers;

      return this.spotlight.id
        ? this.$store.getters['meeting/getConsumerByType'](this.spotlight.id)
        : {};
    },
    producers() {
      return this.$store.getters['meeting/getProducersByType'];
    },
    selfPeer() {
      return this.$store.getters['meeting/selfPeer'];
    },
    selfSpotlight() {
      return this.spotlight.id === this.selfPeer.id;
    }
  },
  methods: {
    details() {
      this.$emit('unpin');
    },
    getPeer(id) {
      return this.$store.getters['meeting/getPeer'](id);
    }
  }
};
</script>
