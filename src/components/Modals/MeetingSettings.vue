<template>
  <Modal
    name="meeting-settings"
    :title="$t('meeting.settings.title')"
    theme="noPadding"
    class-name="channel-settings"
    @before-open="beforeOpen"
  >
    <div class="tabbed--wrapper">
      <ul class="nav nav-pills nav-dynamic">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: currentTab === 'general' }"
            href="#"
            @click="switchTab('general')"
            >{{ $t('meeting.settings.general.title') }}</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: currentTab === 'audio-video' }"
            href="#"
            @click="switchTab('audio-video')"
            >{{ $t('meeting.settings.audio-and-video.title') }}</a
          >
        </li>
      </ul>

      <div class="tabbed--content">
        <div v-if="currentTab === 'general'">
          <div class="form-group form-section">
            <div class="row">
              <div class="col">
                <h4>{{ $t('meeting.settings.general.public-link-title') }}</h4>
                <input
                  ref="meetingLink"
                  class="form-control my-3"
                  readonly="readonly"
                  @focus="onFocusLinkInput"
                  :value="
                    isElectron()
                      ? `https://live.airsend.io/meeting/${meeting.roomId}`
                      : location.href
                  "
                  v-if="$route.name === 'meeting'"
                  autofocus
                />
                <p
                  v-html="
                    $t('meeting.settings.general.public-link-description')
                  "
                ></p>
              </div>
              <div class="col-md-3">
                <button
                  class="btn btn-link mx-sm-2 mt-md-3"
                  type="button"
                  @click="onCopyLink"
                  v-if="$route.name === 'meeting'"
                >
                  <Icon name="copy" /> {{ $t('general.link-copy') }}
                </button>
                <button
                  class="btn btn-link mx-sm-2"
                  type="button"
                  @click="onToggleLink"
                  v-if="$route.name !== 'meeting'"
                >
                  <Icon name="link" /> {{ $t('general.link-create') }}
                </button>
              </div>
            </div>
          </div>

          <hr class="my-4" />

          <div class="form-group form-section">
            <div class="row">
              <div class="col">
                <h4>
                  {{ $t('meeting.settings.general.download-chat-title') }}
                </h4>
                <p
                  v-html="
                    $t('meeting.settings.general.download-chat-description')
                  "
                ></p>
              </div>
              <div class="col-md-3">
                <button
                  class="btn btn-link btn-link--primary mx-sm-2 mt-md-3"
                  type="button"
                  @click="onDownloadChat"
                >
                  <Icon name="download" />
                  {{ $t('meeting.settings.general.download-chat-button') }}
                </button>
              </div>
            </div>
          </div>

          <hr
            class="my-4"
            v-if="meetingUser && meetingUser.permissions.MODERATE_ROOM"
          />

          <div
            class="form-group form-section"
            v-if="meetingUser && meetingUser.permissions.MODERATE_ROOM"
          >
            <div class="row">
              <div class="col">
                <h4>{{ $t('meeting.settings.general.end-title') }}</h4>
                <p>{{ $t('meeting.settings.general.end-description') }}</p>
              </div>
              <div class="col-md-3">
                <v-popover>
                  <button
                    class="btn btn-link btn-link--danger mx-sm-2 mt-md-3"
                    type="button"
                  >
                    <Icon name="phone-slash" />
                    {{ $t('meeting.settings.general.end-button') }}
                  </button>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <div class="dropdown-text">
                        {{ $t('general.are-you-sure') }}
                      </div>
                      <button
                        v-close-popover
                        class="dropdown-item btn btn-danger"
                        type="button"
                        @click="
                          () => {
                            this.$modal.hide('meeting-settings');
                            $store.dispatch('meeting/closeMeeting');
                          }
                        "
                      >
                        {{ $t('meeting.settings.general.end-button') }}
                      </button>
                    </div>
                  </template>
                </v-popover>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentTab === 'audio-video'">
          <div v-if="meeting.audioDevices" class="form-group">
            <label for="preferred_microphone" class="mb-2">{{
              $t('meeting.settings.audio-and-video.preferred-microphone')
            }}</label>
            <select
              id="preferred_microphone"
              class="form-control"
              :value="
                meeting.settings.selectedAudioDevice &&
                meeting.audioDevices[meeting.settings.selectedAudioDevice]
                  ? meeting.settings.selectedAudioDevice
                  : Object.keys(meeting.audioDevices)[0]
              "
              @change="onChangeDevice($event, 'mic')"
            >
              <option
                v-for="deviceId in Object.keys(meeting.audioDevices)"
                :key="deviceId"
                :value="deviceId"
                >{{ meeting.audioDevices[deviceId].label }}</option
              >
            </select>
          </div>

          <div v-if="meeting.webcams" class="form-group">
            <label for="preferred_camera" class="mb-2">{{
              $t('meeting.settings.audio-and-video.preferred-camera')
            }}</label>
            <select
              id="preferred_camera"
              class="form-control"
              :value="
                meeting.settings.selectedWebcam &&
                meeting.webcams[meeting.settings.selectedWebcam]
                  ? meeting.settings.selectedWebcam
                  : Object.keys(meeting.webcams)[0]
              "
              @change="onChangeDevice($event, 'webcam')"
            >
              <option
                v-for="deviceId in Object.keys(meeting.webcams)"
                :key="deviceId"
                :value="deviceId"
                >{{ meeting.webcams[deviceId].label }}</option
              >
            </select>
          </div>

          <div v-if="meeting.audioOutputDevices" class="form-group">
            <label for="preferred_speaker" class="mb-2">{{
              $t('meeting.settings.audio-and-video.preferred-speaker')
            }}</label>
            <div class="row">
              <div class="col">
                <select
                  id="preferred_speaker"
                  class="form-control"
                  :value="
                    meeting.settings.selectedAudioOutputDevice &&
                    meeting.audioOutputDevices[
                      meeting.settings.selectedAudioOutputDevice
                    ]
                      ? meeting.settings.selectedAudioOutputDevice
                      : Object.keys(meeting.audioOutputDevices)[0]
                  "
                  @change="onChangeDevice($event, 'speaker')"
                >
                  <option
                    v-for="deviceId in Object.keys(meeting.audioOutputDevices)"
                    :key="deviceId"
                    :value="deviceId"
                    >{{ meeting.audioOutputDevices[deviceId].label }}</option
                  >
                </select>
              </div>

              <div class="col-md-3">
                <audio
                  ref="audio"
                  src="/ringtone.wav"
                  style="display:none"
                  loop
                />
                <button
                  class="btn btn-outline-secondary btn-block"
                  @click="toggleAudio"
                >
                  {{
                    !isTestingAudio
                      ? $t('meeting.settings.audio-and-video.test')
                      : $t('meeting.settings.audio-and-video.stop')
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';

import { bytesToSize } from 'airsend/utils';

import isElectron from 'is-electron';

export default {
  components: {
    Modal,
    Avatar,
    Loader,
    Icon
  },
  data() {
    return {
      avatar: null,
      changed: false,
      errors: {},
      currentTab: 'general',
      notifications: '0',
      isTestingAudio: false
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    meeting() {
      return this.$store.state.meeting;
    },
    meetingUser() {
      return this.$store.getters['meeting/getMe'];
    },
    location() {
      return window.location;
    }
  },
  methods: {
    switchTab(tabName) {
      this.currentTab = tabName;

      if (tabName === 'audio-video') {
        this.$store.dispatch('meeting/updateAudioDevices');
        this.$store.dispatch('meeting/updateWebcams');
        this.$store.dispatch('meeting/updateAudioOutputDevices');
      }
    },
    beforeOpen({ params }) {
      if (params) {
        this.currentTab = params;
      } else {
        this.currentTab = 'general';
      }
      if (this.currentTab === 'audio-video') {
        this.$store.dispatch('meeting/updateAudioDevices');
        this.$store.dispatch('meeting/updateWebcams');
        this.$store.dispatch('meeting/updateAudioOutputDevices');
      }
    },

    async onChangeDevice(e, type) {
      const { value } = e.target;

      await this.$store.dispatch('meeting/updatePreferredDevice', {
        [type]: value
      });

      if (type === 'speaker') {
        const selectedDevice =
          this.meeting.settings.selectedAudioOutputDevice &&
          this.meeting.audioOutputDevices[
            this.meeting.settings.selectedAudioOutputDevice
          ]
            ? this.meeting.settings.selectedAudioOutputDevice
            : Object.keys(this.meeting.audioOutputDevices)[0];

        if (
          selectedDevice &&
          typeof this.$refs.audio.setSinkId === 'function'
        ) {
          this.$refs.audio.setSinkId(selectedDevice);
        }
      }
    },
    toggleAudio() {
      if (!this.$refs.audio) return;

      const selectedDevice =
        this.meeting.settings.selectedAudioOutputDevice &&
        this.meeting.audioOutputDevices[
          this.meeting.settings.selectedAudioOutputDevice
        ]
          ? this.meeting.settings.selectedAudioOutputDevice
          : Object.keys(this.meeting.audioOutputDevices)[0];

      if (selectedDevice && typeof this.$refs.audio.setSinkId === 'function') {
        this.$refs.audio.setSinkId(selectedDevice);

        if (this.$refs.audio.paused) {
          this.$refs.audio.play();
          this.isTestingAudio = true;
        } else {
          this.$refs.audio.pause();
          this.$refs.audio.currentTime = 0;
          this.isTestingAudio = false;
        }
      }
    },

    onFocusLinkInput(e) {
      e.target.select();
    },

    // toggle channel link
    async onToggleLink() {
      // reset errors
      await this.$store.dispatch('meeting/goPublic');

      this.$nextTick(() =>
        this.$refs.meetingLink ? this.$refs.meetingLink.focus() : true
      );
    },

    onDownloadChat() {
      this.$store.dispatch('meeting/downloadChat');
    },

    onCopyLink() {
      if (this.$refs.meetingLink) this.$refs.meetingLink.focus();
      document.execCommand('copy');
    },
    isElectron,
    bytesToSize: bytesToSize
  }
};
</script>
