<template>
  <div
    v-if="
      (meeting.roomId && meeting.roomState !== 'closed') ||
        (currentChannel && currentChannel.meeting)
    "
    class="meeting-in-progress"
  >
    <div class="meeting-name">
      {{
        channel && channel.channel_name
          ? channel.channel_name
          : $t('meeting.meeting-in-progress')
      }}
    </div>

    <fragment v-if="isMeetingActive">
      <button
        class="btn btn-icon ml-auto"
        :class="{
          active: meeting.micProducer && !meeting.micProducer.paused,
          disabled: togglingMicrophone
        }"
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
        :class="{
          active: meeting.webcamProducer && !meeting.webcamProducer.paused,
          disabled: togglingWebcam
        }"
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
        v-if="isElectron() && meeting.capabilities.canShareScreen"
        popover-base-class="tooltip popover vue-popover-theme popover-devices popover-limited"
      >
        <button
          class="btn btn-icon"
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
              {{ $t('Start Screenshare') }}
            </button>
          </div>
        </template>
      </v-popover>
      <button
        v-else-if="meeting.capabilities.canShareScreen"
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

      <v-popover>
        <button class="btn btn-icon danger">
          <Icon family="far" name="phone" />
        </button>
        <template slot="popover">
          <div class="dropdown-items">
            <div class="dropdown-text">{{ $t('general.are-you-sure') }}</div>
            <button
              v-close-popover
              class="dropdown-item btn btn-danger"
              type="button"
              @click="$store.dispatch('meeting/close')"
            >
              {{ $t('channels.leave-now') }}
            </button>
          </div>
        </template>
      </v-popover>

      <button class="btn btn-icon" @click="expand">
        <Icon family="far" name="expand" />
      </button>
    </fragment>
    <fragment v-else>
      <button
        class="btn btn-primary btn-circle ml-auto mr-2"
        @click="
          $store.dispatch('meeting/createOrJoin', {
            channel_id: currentChannel.id
          })
        "
      >
        <Icon family="far" name="phone" />
        {{ $t('meeting.invite.join') }}
      </button>
    </fragment>
  </div>
</template>
<script>
import isElectron from 'is-electron';
import Icon from 'airsend/components/Icon';

export default {
  components: {
    Icon
  },
  data() {
    return {
      togglingWebcam: false,
      togglingMicrophone: false,
      togglingScreensharing: false
    };
  },
  computed: {
    meeting() {
      return this.$store.state.meeting;
    },
    channel() {
      return this.$store.getters['channels/getChannelById'](
        this.meeting.channelId
      );
    },
    isMeetingActive() {
      return this.meeting.roomId && this.meeting.roomState !== 'closed';
    },
    currentChannel() {
      return this.$route.params.id
        ? this.$store.state.channels.single[this.$route.params.id]
        : null;
    }
  },
  methods: {
    expand() {
      if (this.meeting.channelId) {
        this.$router.push({
          name: 'channel',
          params: {
            id: this.meeting.channelId
          }
        });
      } else {
        this.$router.push({
          name: 'meeting',
          params: {
            hash: this.meeting.roomId
          }
        });
      }

      this.$emit('expanded');
    },
    isElectron,
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
      this.$store.dispatch('meeting/loadScreens');
    },
    async toggleMic() {
      this.togglingMicrophone = true;
      if (this.meeting.micProducer && !this.meeting.micProducer.paused) {
        await this.$store.dispatch('meeting/muteMic');
      } else if (this.meeting.micProducer && this.meeting.micProducer.paused) {
        await this.$store.dispatch('meeting/unmuteMic', { start: 1 });
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
    }
  }
};
</script>
