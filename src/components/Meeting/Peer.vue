<template>
  <div class="meeting-peers-list-item">
    <div
      class="meeting-peer"
      :class="{ [`meeting-peer--speaking`]: activeSpeaker === peer.id }"
      @click="details"
    >
      <MeetingVideo
        v-if="screenShare && consumers.screen"
        :consumer="consumers.screen"
      />
      <MeetingVideo v-else-if="consumers.webcam" :consumer="consumers.webcam" />
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
            !screenShare &&
            (selfPeer ? !consumers.mic.paused : !consumers.mic.remotelyPaused)
        "
        class="speaking-level"
        :style="{
          transform: `scale(${(
            1 +
            Math.round(meeting.peerVolumes[peer.id]) / 100
          ).toFixed(2)})`
        }"
      ></div>
      <div class="meeting-peer-menu">
        <Popover
          container=".meeting-fragment"
          trigger="manual"
          :open="isMoreOptionsOpen"
          @hide="isMoreOptionsOpen = false"
        >
          <button
            v-tooltip="{
              delay: 1000,
              offset: 10,
              content: $t('general.more-options')
            }"
            v-if="me && me.permissions.MODERATE_ROOM"
            class="btn btn-icon btn-sm"
            @click.stop="isMoreOptionsOpen = true"
          >
            <Icon family="far" name="ellipsis-h" />
          </button>
          <template slot="popover">
            <div class="dropdown-items">
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                v-if="consumers.mic && !consumers.mic.remotelyPaused"
                @click="$store.dispatch('meeting/mutePeer', peer.id)"
              >
                <Icon family="fal" name="microphone-slash" />
                {{ $t('meeting.moderator.mute') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                v-if="consumers.webcam"
                @click="$store.dispatch('meeting/stopPeerVideo', peer.id)"
              >
                <Icon family="fal" name="video-slash" />
                {{ $t('meeting.moderator.disable-video') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                v-if="consumers.screen"
                @click="$store.dispatch('meeting/stopPeerScreen', peer.id)"
              >
                <Icon family="fal" name="video-slash" />
                {{ $t('meeting.moderator.disable-screensharing') }}
              </button>
              <div
                class="dropdown-divider"
                v-if="
                  (consumers.mic && !consumers.mic.remotelyPaused) ||
                    consumers.webcam ||
                    consumers.screen
                "
              ></div>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="$store.dispatch('meeting/kickPeer', peer.id)"
              >
                <Icon family="fal" name="user-slash" />
                {{ $t('meeting.moderator.kick') }}
              </button>
            </div>
          </template>
        </Popover>
      </div>
      <div class="meeting-peer-info">
        <h4 v-if="screenShare">
          <Icon name="desktop" />
          {{
            $t('meeting.user-screen', {
              user: peer ? peer.displayName : user.display_name
            })
          }}
        </h4>
        <h4 v-else>
          <Icon
            v-if="
              consumers.mic &&
                (consumers.mic.remotelyPaused || consumers.mic.paused)
            "
            name="microphone-slash"
          />
          {{ peer ? peer.displayName : user.display_name }}
        </h4>
      </div>
    </div>
  </div>
</template>
<script>
import Avatar from 'airsend/components/Avatar';
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
import MeetingVideo from './Video';

export default {
  components: {
    Avatar,
    Icon,
    Popover,
    MeetingVideo
  },
  props: {
    peer: {
      type: Object,
      default: () => {}
    },
    channel: {
      type: Object,
      default: () => {}
    },
    meeting: {
      type: Object,
      default: () => {}
    },
    screenShare: {
      type: Boolean,
      default: false
    },
    selfPeer: {
      type: Boolean,
      default: false
    },
    activeSpeaker: String
  },
  data() {
    return {
      isMoreOptionsOpen: false
    };
  },
  computed: {
    consumers() {
      if (this.selfPeer) {
        return this.$store.getters['meeting/getProducersByType'];
      }
      return this.$store.getters['meeting/getConsumerByType'](this.peer.id);
    },
    user() {
      return this.$store.state.core.user;
    },
    me() {
      return this.$store.getters['meeting/getMe'];
    }
  },
  mounted() {},
  methods: {
    details(e) {
      e.stopPropagation();

      // console.log(this.me);
      // console.log('PEER', this.peer);
      // console.log('USER', this.consumers);

      // this.$store.dispatch('meeting/closeMeeting', this.peer.id)
      this.$emit('pin', { pin: this.peer.id, screenShare: this.screenShare });
    },
    kickPeer() {}
  }
};
</script>
