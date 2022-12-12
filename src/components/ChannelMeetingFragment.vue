<template>
  <Drop
    v-cloak
    class="chat-fragment meeting-fragment"
    ref="meetingBody"
    :class="{
      [`is-dragging`]: isDragActive,
      ['meeting-fragment-fullscreen']: isFullscreen,
      ['meeting-fragment-expanded']: isFullscreen
    }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <div
      class="meeting-body"
      :class="{
        ['has-spotlight']: showSpotlight,
        ['has-peer-list']: showPeerList
      }"
    >
      <div class="empty-wrapper" v-if="meeting.roomState === 'closed'">
        <div class="empty-box empty-box--meeting empty-box--boxed">
          <Icon family="fal" name="phone-slash" class="mb-4" />
          <h4 class="text-center">
            {{
              $t(
                `meeting.closed-${
                  meeting.closeReason ? meeting.closeReason : 'default'
                }-title`
              )
            }}
          </h4>
          <p class="text-center mb-0">
            {{
              $t(
                `meeting.closed-${
                  meeting.closeReason ? meeting.closeReason : 'default'
                }-description`
              )
            }}
          </p>
          <button
            class="btn btn-link mx-auto mt-3"
            type="button"
            @click="$store.dispatch('meeting/downloadChat')"
            v-if="
              (!meeting.closeReason ||
                meeting.closeReason === 'meeting-terminated') &&
                meeting.chatHistory.length > 0
            "
          >
            <Icon name="download" />
            {{ $t('meeting.settings.general.download-chat-title') }}
          </button>
          <button
            class="btn btn-link btn-link--danger mx-auto mt-3"
            type="button"
            @click="$store.dispatch('meeting/close', true)"
          >
            <Icon name="times" /> {{ $t('general.close') }}
          </button>
        </div>
      </div>
      <div
        class="empty-wrapper"
        v-else-if="
          $route.name === 'meeting' &&
            meeting.roomState === 'connected' &&
            meeting.roomId &&
            meeting.peers.length === 0 &&
            meeting.isMeetingInfoVisible
        "
      >
        <div class="empty-box empty-box--meeting empty-box--boxed">
          <Icon family="fal" name="users" class="mb-4" />
          <h4 class="text-center">{{ $t(`meeting.public-title`) }}</h4>
          <p class="text-center">{{ $t(`meeting.public-description`) }}</p>

          <div
            class="form-group form-section w-100 text-center mb-0"
            style="max-width:600px;"
          >
            <input
              ref="meetingLink"
              class="form-control text-center my-3"
              readonly="readonly"
              @focus="onFocusLinkInput"
              :value="
                isElectron()
                  ? `https://live.airsend.io/meeting/${meeting.roomId}`
                  : location.href
              "
              v-if="$route.name === 'meeting'"
            />
            <button
              class="btn btn-link mx-sm-2 mt-md-1 mr-2"
              type="button"
              @click="onCopyLink"
            >
              <Icon name="copy" /> {{ $t('general.link-copy') }}
            </button>
            <button
              class="btn btn-link mx-sm-2 mt-md-1"
              type="button"
              @click="
                exitFullscreen();
                $modal.show('meeting-settings');
              "
              v-if="$route.name === 'meeting'"
            >
              <Icon name="cog" /> {{ $t('meeting.settings.title') }}
            </button>
          </div>

          <hr class="my-4" />

          <button
            class="btn btn-default mx-sm-2 mt-md-1 mx-auto"
            @click="
              $store.commit('meeting/set', { isMeetingInfoVisible: false })
            "
            type="button"
          >
            {{ $t('general.ok') }}
          </button>
        </div>
      </div>
      <div
        class="empty-wrapper"
        v-else-if="
          $route.name === 'meeting' && !user.display_name && !meeting.guest
        "
      >
        <div class="empty-box empty-box--boxed empty-box--meeting">
          <form id="login" novalidate="true" @submit="onSubmitGuestForm">
            <h4>{{ $t('meeting.public.join-title') }}</h4>
            <p>{{ $t('meeting.public.join-description') }}</p>

            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['display_name'] }"
            >
              <label for="display_name">{{
                $t('meeting.public.display-name')
              }}</label>
              <input
                id="display_name"
                type="display_name"
                v-model="form.display_name"
                class="form-control form-control--underline"
                :placeholder="$t('meeting.public.display-name-placeholder')"
                autofocus
              />
              <small
                v-if="errors['display_name']"
                class="form-text text-danger"
                >{{
                  $t(
                    errors['display_name'].message,
                    errors['display_name'].meta
                  )
                }}</small
              >
            </div>

            <div class="form-group form-check">
              <input
                id="join_video"
                type="checkbox"
                class="form-check-input"
                v-model="form.join_video"
              />
              <label class="form-check-label" for="join_video">{{
                $t('meeting.public.join-with-video')
              }}</label>
            </div>

            <div class="text-center d-block">
              <button
                type="submit"
                class="btn btn-half btn-primary btn-rounded btn-extended mx-auto d-block mt-4"
              >
                {{ $t('meeting.public.join') }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Portal to="meeting-menu-area">
        <div class="meeting-body-menu" v-if="user.id || meeting.guest">
          <button
            v-if="meeting.peers && meeting.peers.length > 0 && showSpotlight"
            class="btn btn-icon"
            :class="{ active: isExpanded }"
            @click="toggleExpand"
            v-tooltip="{
              content: $t('meeting.speaker-expand')
            }"
          >
            <Icon
              family="far"
              :name="isExpanded ? 'compress-alt' : 'expand-alt'"
            />
          </button>
          <button
            v-if="fullscreenEnabled"
            class="btn btn-icon"
            :class="{ active: isFullscreen }"
            @click="toggleFullscreen"
            v-tooltip="{
              content: $t('meeting.full-screen')
            }"
          >
            <Icon
              family="far"
              :name="isFullscreen ? 'compress-wide' : 'expand-wide'"
            />
          </button>
          <button
            v-if="meeting.peers"
            class="btn btn-icon"
            :class="{ active: isGridView }"
            @click="toggleGridView"
            v-tooltip="{
              content: $t('meeting.toggle-grid')
            }"
          >
            <Icon :family="isGridView ? 'fas' : 'fal'" name="th" />
          </button>
        </div>
      </Portal>
      <portal-target name="meeting-menu-area" v-if="!showSpotlight" />

      <Spotlight
        v-if="showSpotlight"
        :active-speaker="meeting.activeSpeaker"
        :meeting="meeting"
        :channel="channel"
        :pinned="pinned"
        v-model="spotlight"
        @unpin="unpin"
      />

      <perfect-scrollbar
        v-if="showPeerList"
        class="meeting-body-grid"
        ref="meeting-grid"
        :class="{
          ['has-spotlight']: showSpotlight,
          ['compact-grid']: compactGridMode
        }"
        @resize="evaluateMaxPeersInPage"
        suppressScrollX
      >
        <Peer
          v-if="showSelfPeer"
          :active-speaker="meeting.activeSpeaker"
          :meeting="meeting"
          :channel="channel"
          :peer="selfPeer"
          @pin="pin"
          :key="user.id"
          selfPeer
        />

        <Peer
          v-for="peer in screenSharePeer"
          :active-speaker="meeting.activeSpeaker"
          :meeting="meeting"
          :channel="channel"
          :peer="peer"
          @pin="pin"
          :key="`${peer.id}-screenshare`"
          :selfPeer="peer.id === selfPeer.id"
          screenShare
        />

        <Peer
          v-for="peer in sortedPeers"
          :active-speaker="meeting.activeSpeaker"
          :meeting="meeting"
          :channel="channel"
          :peer="peer"
          @pin="pin"
          :key="peer.id"
        />
      </perfect-scrollbar>

      <transition-group
        class="meeting-body-toasts"
        name="meeting-toast"
        tag="ul"
      >
        <li v-for="toast in meeting.toasts" :key="toast.id">
          <div
            class="toast-item"
            :class="[`toast-item--${toast.type}`]"
            v-html="
              typeof toast.content === 'string'
                ? toast.content
                : $t(toast.content.message, toast.content.meta)
            "
          ></div>
        </li>
      </transition-group>
    </div>

    <div class="meeting-footer" v-if="user.id || meeting.guest">
      <slot name="left-side" v-if="!isFullscreen"></slot>

      <button
        class="btn btn-icon"
        v-if="meeting.roomState !== 'closed'"
        @click="
          exitFullscreen();
          $modal.show('meeting-settings');
        "
      >
        <Icon family="far" name="cog" />
      </button>
      <button
        class="btn btn-icon"
        :disabled="meeting.roomState !== 'connected'"
        :class="{
          active: meeting.micProducer && !meeting.micProducer.paused,
          disabled: togglingMicrophone
        }"
        v-if="meeting.roomState !== 'closed'"
        @click="toggleMic"
      >
        <Icon
          family="far"
          :name="
            meeting.micProducer && !meeting.micProducer.paused
              ? 'microphone'
              : 'microphone-slash'
          "
        />
      </button>
      <button
        class="btn btn-icon"
        :disabled="meeting.roomState !== 'connected'"
        :class="{
          active: meeting.webcamProducer && !meeting.webcamProducer.paused,
          disabled: togglingWebcam
        }"
        v-if="meeting.roomState !== 'closed'"
        @click="toggleWebcam"
      >
        <Icon
          family="far"
          :name="
            meeting.webcamProducer && !meeting.webcamProducer.paused
              ? 'video'
              : 'video-slash'
          "
        />
      </button>

      <v-popover
        v-if="
          isElectron() &&
            meeting.capabilities.canShareScreen &&
            meeting.roomState !== 'closed'
        "
        popover-base-class="tooltip popover vue-popover-theme popover-devices popover-limited"
      >
        <button
          class="btn btn-icon"
          :disabled="meeting.roomState !== 'connected'"
          :class="{
            active:
              meeting.screenSharingProducer &&
              !meeting.screenSharingProducer.paused,
            disabled: togglingScreensharing
          }"
          @click="loadScreens"
        >
          <Icon family="far" name="desktop" />
        </button>
        <template slot="popover">
          <div
            class="dropdown-devices"
            :class="{ [`dropdown-devices--disabled`]: togglingScreensharing }"
            :set="
              (currentScreen =
                meeting.settings.selectedScreen &&
                meeting.screens[meeting.settings.selectedScreen]
                  ? meeting.settings.selectedScreen
                  : Object.keys(meeting.screens)[0])
            "
          >
            <img
              v-if="
                meeting.screens[currentScreen] &&
                  meeting.screens[currentScreen].hasImage
              "
              :src="meeting.screens[currentScreen].image"
              class="thumbnail"
            />
            <div class="form-group">
              <label for="preferred_screen" class="mb-2">{{
                $t('meeting.screenshare-choose-window')
              }}</label>
              <select
                id="preferred_screen"
                class="form-control"
                :value="currentScreen"
                @change="onChangeDevice($event, 'screen')"
              >
                <option
                  v-for="screenId in Object.keys(meeting.screens)"
                  :key="screenId"
                  :value="screenId"
                  >{{ meeting.screens[screenId].name }}</option
                >
              </select>
            </div>
            <button
              v-if="
                meeting.screenSharingProducer &&
                  !meeting.screenSharingProducer.paused
              "
              class="btn btn-danger btn-block"
              @click="toggleScreenSharing"
            >
              {{ $t('meeting.screenshare-stop') }}
            </button>
            <button
              v-else
              class="btn btn-primary btn-block"
              @click="toggleScreenSharing"
            >
              {{ $t('meeting.screenshare-start') }}
            </button>
          </div>
        </template>
      </v-popover>
      <button
        v-else-if="
          meeting.capabilities.canShareScreen && meeting.roomState !== 'closed'
        "
        :disabled="meeting.roomState !== 'connected'"
        class="btn btn-icon"
        :class="{
          active:
            meeting.screenSharingProducer &&
            !meeting.screenSharingProducer.paused,
          disabled: togglingScreensharing
        }"
        @click="toggleScreenSharing"
      >
        <Icon family="far" name="desktop" />
      </button>

      <button
        class="btn btn-icon danger"
        v-if="meeting.roomState !== 'closed'"
        @click="closeMeeting"
      >
        <Icon family="far" name="phone" />
      </button>

      <slot name="right-side" v-if="!isFullscreen"></slot>
    </div>
  </Drop>
</template>
<script>
import isElectron from 'is-electron';

import Icon from 'airsend/components/Icon';
import Avatar from 'airsend/components/Avatar';
import Peer from './Meeting/Peer';
import Spotlight from './Meeting/Spotlight';
import MeetingVideo from './Meeting/Video';

import _ from 'lodash';
import { Drop } from 'vue-drag-drop';

export default {
  components: {
    Icon,
    Avatar,
    Peer,
    Spotlight,
    MeetingVideo,
    Drop
  },
  props: ['channel'],
  data() {
    return {
      isDragActive: false,
      pinned: {},
      isExpanded: false,
      isFullscreen: false,
      isGridView: false,
      togglingWebcam: false,
      togglingMicrophone: false,
      togglingScreensharing: false,
      selectedScreen: 0,
      errors: {},
      form: {},
      maxPeersInPage: 6,
      gridMeta: {
        peersPerRow: 2,
        maxRows: 2
      },
      spotlight: {}
    };
  },
  mounted() {
    // this.peers = this.meeting.peers;
    const { hash, preventJoin } = this.$router.history.current.params;

    if (this.isPublic && this.user.id && !preventJoin) {
      this.$store.dispatch('meeting/join', {
        room: hash,
        channelId: null
      });
    }

    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    this.evaluateMaxPeersInPage();
  },
  destroyed() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  },
  watch: {
    $route() {
      if (this.meeting.roomState === 'closed') {
        this.$store.dispatch('meeting/close');
      }
    },
    'meeting.peerActivities': {
      deep: true,
      handler() {
        this.evaluatePeersSort();
      }
    },
    'meeting.peers'(peers, previous_peers) {
      if (
        this.pinned &&
        this.pinned.pin &&
        this.pinned.pin !== this.selfPeer.id
      ) {
        const pinnedInCall = this.peers.some(
          peer => peer.id === this.pinned.pin
        );
        if (!pinnedInCall) this.pinned = {};
      }
    }
  },
  computed: {
    showSpotlight() {
      if (this.meeting.roomState === 'closed') return false;
      if (this.pinned.pin || !this.isGridView) return true;
      return false;
    },
    peersListLength() {
      return (
        this.screenSharePeer.length + this.peers.length + this.showSelfPeer
      );
    },
    selfPeerSpotlight() {
      return this.hasSpotlight(this.selfPeer.id, false);
    },
    showSelfPeer() {
      if (this.isGridView) return true;
      if (this.hasSpotlight(this.selfPeer.id, false)) return false;
      return true;
    },
    showPeerList() {
      if (this.meeting.roomState === 'closed') return false;
      if (!this.user.id && !this.meeting.guest) return false;
      if (!this.peersListLength) return false;
      if (this.isExpanded && this.showSpotlight) return false;

      return true;
    },
    meeting() {
      return this.$store.state.meeting;
    },
    location() {
      return window.location;
    },
    fullscreenEnabled() {
      return document.fullscreenEnabled;
    },
    user() {
      return this.$store.state.core.user;
    },
    producers() {
      return this.$store.getters['meeting/getProducersByType'];
    },
    isPublic() {
      return this.$route.name === 'meeting';
    },
    videoConsumers() {
      return this.$store.getters['meeting/getScreenConsumers'];
    },
    screenSharePeer() {
      const peersScreensharing = _.values(
        this.videoConsumers.map(consumer => consumer.peerId)
      );
      let peers = this.meeting.peers.filter(
        peer =>
          peersScreensharing.includes(peer.id) &&
          (this.isGridView ||
            !(this.spotlight.screenShare && peer.id === this.spotlight.id))
      );

      if (
        !!this.producers.screen &&
        (this.isGridView || !this.hasSpotlight(this.selfPeer.id, true))
      ) {
        peers.push(this.selfPeer);
      }
      return peers;
    },
    sortedPeers() {
      // return this.peers;
      return this.peers.sort((a, b) => {
        return (
          (this.meeting.peerActivities[b.id] || 0) -
          (this.meeting.peerActivities[a.id] || 0) +
          5
        );
      });
    },
    selfPeer() {
      return this.$store.getters['meeting/selfPeer'];
    },
    peers() {
      if (this.showSpotlight && this.spotlight && this.showSpotlight)
        return this.meeting.peers.filter(
          peer =>
            !(!this.spotlight.screenShare && peer.id === this.spotlight.id)
        );
      else return this.meeting.peers;
    },
    compactGridMode() {
      if (this.fitsNormalPeerSize) return false;
      return true;
    },
    peerDimentions() {
      return {
        compact: {
          width: 220,
          height: 140
        },
        normal: {
          width: 440,
          height: 280
        }
      };
    },
    fitsNormalPeerSize() {
      const maxPeersSizeWithoutScroll =
        this.gridMeta.peersPerRow * this.gridMeta.maxRows;

      return maxPeersSizeWithoutScroll >= this.peers.length + 1; // + self peer
    },
    zScreenShareSpotlight() {
      return !!this.spotlight.screenShare;
    },
    zScreenHasSpotlight() {
      return this.hasSpotlight(this.selfPeer.id, true);
    }
  },
  methods: {
    hasSpotlight(id, screenShare) {
      return (
        screenShare === this.zScreenShareSpotlight && id == this.spotlight.id
      );
    },
    evaluateMaxPeersInPage() {
      const gridElm =
        this.$refs['meeting-grid'] && this.$refs['meeting-grid'].$el;
      if (!gridElm) return;

      var gap = 0;

      var minWidth = this.peerDimentions.normal.width;
      var gridWidth = gridElm.offsetWidth;
      let itemsPerRow = Math.floor((gridWidth + gap) / (minWidth + gap));

      var minHeight = this.peerDimentions.normal.height;
      var gridHeight = gridElm.offsetHeight;
      let maxRows = Math.floor((gridHeight + gap) / (minHeight + gap));

      this.gridMeta = {
        peersPerRow: itemsPerRow,
        maxRows: maxRows
      };
    },
    onFullscreenChange(e) {
      this.isFullscreen = !!document.fullscreenElement;
    },
    evaluatePeersSort() {
      return;
      let _peers = [];

      this.peers.forEach((peer, index) => {
        if (index < 2) {
          //skip 2 first peers
          _peers.push(peer);
        } else {
          //sort others
          if (
            (this.meeting.peerActivities[peer.id] || 0) >
            this.meeting.peerActivities[_peers[0].id]
          ) {
            //peer talked recently
            _peers.unshift(peer);
            if (peer.displayName === 'User 2') {
            }
          } else {
            _peers.push(peer);
          }
        }
      });

      this.peers = _peers;
    },
    async onChangeDevice(e, type) {
      const { value } = e.target;

      await this.$store.dispatch('meeting/updatePreferredDevice', {
        [type]: value
      });

      if (
        this.meeting.screenSharingProducer &&
        !this.meeting.screenSharingProducer.paused
      ) {
        await this.$store.dispatch('meeting/disableScreenSharing');
        await this.$store.dispatch('meeting/updateScreenSharing', { start: 1 });
      }
    },

    loadScreens() {
      this.exitFullscreen();
      this.$store.dispatch('meeting/loadScreens');
    },
    async toggleMic() {
      this.togglingMicrophone = true;
      if (this.meeting.micProducer && !this.meeting.micProducer.paused) {
        await this.$store.dispatch('meeting/muteMic');
      } else if (this.meeting.micProducer && this.meeting.micProducer.paused) {
        await this.$store.dispatch('meeting/unmuteMic');
      } else {
        await this.$store.dispatch('meeting/updateMic', { start: 1 });
      }
      this.togglingMicrophone = false;
    },
    async toggleWebcam() {
      this.togglingWebcam = true;
      if (this.meeting.webcamProducer && !this.meeting.webcamProducer.paused) {
        await this.$store.dispatch('meeting/disableWebcam');
      } else {
        await this.$store.dispatch('meeting/updateWebcam', { start: 1 });
      }
      this.togglingWebcam = false;
    },
    async toggleScreenSharing() {
      this.togglingScreensharing = true;
      if (
        this.meeting.screenSharingProducer &&
        !this.meeting.screenSharingProducer.paused
      ) {
        await this.$store.dispatch('meeting/disableScreenSharing');
        this.$emit('toggleScreenShare', 'OFF');
      } else {
        await this.$store.dispatch('meeting/updateScreenSharing', { start: 1 });
        this.$emit('toggleScreenShare', 'ON');
      }
      this.togglingScreensharing = false;
    },
    closeMeeting() {
      this.exitFullscreen();
      this.$store.dispatch('meeting/close');
    },
    toggleExpand(e) {
      e.stopPropagation();
      this.isExpanded = !this.isExpanded;
      this.$nextTick(() => this.evaluateMaxPeersInPage());
    },
    async toggleFullscreen(e) {
      e.stopPropagation();
      if (document.fullscreenEnabled) {
        // is in fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          await this.$refs.meetingBody.$el.requestFullscreen();
        }
      }
      this.$nextTick(() => this.evaluateMaxPeersInPage());
    },
    toggleGridView(e) {
      e.stopPropagation();
      this.isGridView = !this.isGridView;
      this.pinned = {};
      this.isExpanded = false;
      this.$nextTick(() => this.evaluateMaxPeersInPage());
    },
    exitFullscreen() {
      if (document.fullscreenEnabled && document.fullscreenElement) {
        document.exitFullscreen();
      }
    },
    pin({ pin, screenShare }) {
      this.isGridView = false;
      if (
        this.pinned.pin === pin &&
        this.pinned.isScreenShare === screenShare
      ) {
        this.pinned = {};
      } else {
        this.pinned = { pin, screenShare };
      }
      this.$nextTick(() => this.evaluateMaxPeersInPage());
    },
    unpin() {
      this.pinned = {};
    },
    isElectron,
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
    onSubmitGuestForm(e) {
      e.stopPropagation();
      e.preventDefault();

      const isValid = this.$store.state.core.client.validator.validate(
        this.form,
        {
          display_name: {
            type: 'string',
            empty: false
          }
        }
      );

      if (isValid === true) {
        const { hash } = this.$router.history.current.params;

        this.$store.commit('meeting/set', { guest: this.form });
        this.$store.dispatch('meeting/join', {
          room: hash,
          channelId: null,
          shouldJoinVideo: this.form.join_video
        });
      } else {
        this.errors = this.$store.state.core.client.mapErrors(isValid);
      }
    },
    onCopyLink() {
      if (this.$refs.meetingLink) this.$refs.meetingLink.focus();
      document.execCommand('copy');
    },
    onFocusLinkInput(e) {
      e.target.select();
    }
  }
};
</script>
