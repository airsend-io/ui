<template>
  <div v-hotkey="keymap" class="page-content">
    <div
      ref="container"
      class="container-fluid fullheight"
      :class="{ [`container--read-only`]: IS_READONLY }"
    >
      <div class="row fullheight channel-row">
        <nav class="nav nav-pills nav-fill nav-justified nav-channel">
          <a
            class="nav-item nav-link"
            :class="{ [`active`]: currentPane === 'messages' }"
            @click="onChangePane('messages')"
            >{{ $t('general.messages') }}</a
          >
          <a
            class="nav-item nav-link"
            :class="{ [`active`]: currentPane === 'actions' }"
            @click="onChangePane('actions')"
            >{{ $t('general.actions') }}</a
          >
          <a
            class="nav-item nav-link"
            :class="{ [`active`]: currentPane === 'files' }"
            @click="onChangePane('files')"
            >{{ $t('general.files') }}</a
          >
          <a
            class="nav-item nav-link"
            :class="{ [`active`]: currentPane === 'wiki' }"
            @click="onChangePane('wiki')"
            >{{ $t('general.wiki') }}</a
          >
        </nav>

        <div
          v-if="currentPane === 'actions' && isMobile"
          class="fullscreen-card"
        >
          <Actions :active="true" />
        </div>

        <div v-if="currentPane === 'files' && isMobile" class="fullscreen-card">
          <Files :active="true" />
        </div>

        <div v-if="currentPane === 'wiki' && isMobile" class="fullscreen-card">
          <Wiki :active="true" :channel="channel" />
        </div>

        <ChannelSwitcher
          v-if="
            !(IS_READONLY && (!this.user || this.user.read_only)) &&
              actualChannels.length > 0 &&
              !isMobile
          "
          ref="switcher"
          @unblocked="load()"
        />

        <ChannelMeetingFragment v-if="hide_panes" :channel="channel">
          <template v-slot:left-side>
            <button class="btn btn-icon mr-auto" @click="toggleSwitcher">
              <Icon family="far" name="bars" />
            </button>
          </template>

          <template v-slot:right-side>
            <button class="btn btn-icon ml-auto" @click="togglePanes">
              <Icon family="far" name="comment-alt-lines" />
            </button>
          </template>
        </ChannelMeetingFragment>

        <ChannelChatFragment
          v-if="currentPane === 'messages' && !hide_panes"
          :channel="channel"
          @drop="onDropFile"
        >
          <MeetingWidget @expanded="togglePanes" />

          <Toaster />

          <div
            ref="chat-fragment-content"
            class="chat-fragment-content"
            :class="{
              ['has-custom-bg']: this.channel && this.channel.has_background,
              ['join-only']: this.channel && isJoinOnly
            }"
            :style="bgUrlStyle"
          >
            <div
              class="full-toast"
              :class="{ show: !this.$store.state.core.websocket.status }"
            >
              {{ this.$store.state.core.websocket.error }}
            </div>

            <form
              class="public-channel-info"
              @submit="onJoinChannel"
              v-if="channel && isJoinOnly"
            >
              <Loader :loading="$store.state.loading['channel.join']" full />

              <div
                v-if="typeof joinErrors === 'string'"
                class="alert alert-danger mb-4"
              >
                {{ joinErrors }}
              </div>

              <img
                v-if="channel.has_logo"
                style="border-radius:100%;"
                :src="logoUrl"
                :alt="channel.channel_name"
              />
              <h1
                v-html="
                  $t('channels.invite.welcome-text', {
                    channelName: channel.channel_name
                  })
                "
              ></h1>
              <p v-if="channel.blurb">{{ channel.blurb }}</p>

              <div class="d-block text-center" v-if="!joinSubmitted">
                <button
                  v-if="user.id"
                  tyle="submit"
                  class="btn btn-primary btn-rounded mx-1 mt-4"
                >
                  {{
                    $t(
                      channel.require_join_approval
                        ? 'channels.public-ask-to-join-channel'
                        : 'channels.public-join-channel'
                    )
                  }}
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-primary btn-rounded mx-1"
                  @click="
                    () => {
                      this.$modal.hide('join-channel');
                      this.$modal.show('auth');
                    }
                  "
                >
                  {{ $t('general.login-or-signup') }}
                </button>
              </div>
            </form>

            <div
              class="chat-fragment-scroller-wrapper"
              v-else-if="!channel || !channel.chat.history || this.loading"
            >
              <div class="chat-fragment-scroller" ref="scroller">
                <ChatLoader />
              </div>
            </div>
            <Scrollable
              v-else-if="!loading"
              ref="scrollable"
              :channel="channel"
              @quote="onQuote"
              @edit="onEditMessage"
              @uploadFile="() => this.$refs.bar.$refs.file.click()"
              @unblocked="load()"
            />
          </div>

          <Chatbar ref="bar" />
        </ChannelChatFragment>

        <ChannelSidebar
          v-if="!hide_panes && !isJoinOnly && !isMobile"
          :channel="channel"
          ref="sidebar"
        />
      </div>
    </div>
    <ChannelSettingsModal v-if="channel" :channel="channel" />
    <ChannelInviteModal v-if="channel" :channel="channel" />
    <ChannelMembersModal v-if="channel" :channel="channel" :user="user" />

    <JoinModal :channel="channel" />
  </div>
</template>

<script>
import Vue from 'vue';
import _ from 'lodash';
import uniqid from 'uniqid';
import store from 'store';
import { mapMutations } from 'vuex';

import Chatbar from '../components/Channel/Chatbar.vue';

import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Modal from 'airsend/components/Modal.vue';
import ChatLoader from 'airsend/components/ChatLoader.vue';
import Scrollable from 'airsend/components/Scrollable.vue';
import Toaster from 'airsend/components/Toaster.vue';
import ChannelSidebar from '../components/ChannelSidebar.vue';
import ChannelSwitcher from '../components/ChannelSwitcher.vue';
import ChannelChatFragment from '../components/ChannelChatFragment.vue';
import ChannelMeetingFragment from '../components/ChannelMeetingFragment.vue';
import JoinModal from '../components/JoinModal.vue';
import MeetingWidget from '../components/Meeting/Widget.vue';

import Actions from '../components/ChannelSidebar/Actions.vue';
import Files from '../components/ChannelSidebar/Files.vue';
import Wiki from '../components/ChannelSidebar/Wiki.vue';

// modals
import ChannelMembersModal from '../components/Modals/ChannelMembers.vue';
import ChannelInviteModal from '../components/Modals/ChannelInvite.vue';
import ChannelSettingsModal from '../components/Modals/ChannelSettingsV2.vue';

import {
  retrieveFiles,
  bytesToSize,
  parseMentions,
  parseTime
} from 'airsend/utils';

import { EventBus } from 'airsend/event-bus.js';

export default {
  name: 'Channel',
  components: {
    Icon,
    Loader,
    ChannelSidebar,
    ChannelSwitcher,
    ChannelChatFragment,
    ChannelMeetingFragment,
    ChatLoader,
    Scrollable,
    ChannelMembersModal,
    ChannelInviteModal,
    ChannelSettingsModal,
    MeetingWidget,
    JoinModal,
    Toaster,
    Chatbar,
    Actions,
    Files,
    Wiki
  },
  data() {
    return {
      message: '',
      isCommand: false,
      currentPane: 'messages',
      messageCount: 0,
      quote: null,
      files: null,
      ready: false,
      errors: false,
      update: false,
      loading: true,
      send_email: true,
      hide_switcher: false,
      hide_panes: false,
      isJoinOnly: false,
      joinSubmitted: false,
      joinErrors: {},
      form: {
        channel_name: ''
      }
    };
  },
  computed: {
    keymap() {
      return {
        'alt+shift+up': this.onSwitch,
        'alt+shift+down': this.onSwitch,
        '[': this.onTogglePanes,
        ']': this.onTogglePanes
      };
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    currentChannelId() {
      return parseInt(this.$route.params.id);
    },
    currentMeeting() {
      return this.$store.state.meeting.channelId;
    },
    meeting() {
      return this.$store.state.meeting;
    },
    channels() {
      return this.$store.getters['channels/getSortedChannels']('switcher')
        .channels;
    },
    actualChannels() {
      return this.$store.getters['channels/getActualChannels'];
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    IS_READONLY() {
      return (
        (this.channel &&
          this.$router.history.current.query.hash !== undefined) ||
        this.user.read_only === true
      );
    },
    params() {
      return this.$route.params.target;
    },
    bgUrlStyle() {
      if (this.channel && this.channel.has_background) {
        const { hash } = this.$router.history.current.query;
        return {
          'background-image': `url(${
            process.env.VUE_APP_ROOT_API
          }/v1/channel.image.get?channel_id=${
            this.channel.id
          }&channel_asset_type=background&token=${
            hash ? hash : store.get('jwt')
          }&cache=${this.channel.updated_on_ts})`
        };
      }
      return '';
    },
    logoUrl() {
      if (this.channel) {
        const { hash } = this.$router.history.current.query;
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/channel.image.get?channel_id=${
          this.channel.id
        }&channel_asset_type=logo&token=${
          hash ? hash : store.get('jwt')
        }&cache=${this.channel.updated_on_ts}`;
      }
      return '';
    },
    isMobile() {
      return this.$store.state.core.isMobile;
    },
    teamMembers() {
      return this.channel.team_id
        ? this.$store.state.members[this.channel.team_id]
        : [];
    }
  },
  watch: {
    $route(newRoute, oldRoute) {
      if (
        oldRoute.params.id != newRoute.params.id ||
        oldRoute.name !== 'channel' ||
        !!newRoute.query.highlight
      ) {
        //channel changed
        if (oldRoute) this.clearData(oldRoute.params.id);
        this.load(
          oldRoute.params.id == newRoute.params.id &&
            !(
              oldRoute.params.resource === 'invite' &&
              newRoute.name === 'channel'
            ),
          !!newRoute.query.highlight
        );
      }
    },
    channel(newer, older) {
      this.isJoinOnly = false;
      if (!older) {
        this.load();
      }
    },
    currentMeeting(newer, older) {
      if (newer !== older && newer === this.channel.id) {
        this.onStartMeeting();
      } else if (newer === null) {
        this.hide_panes = false;
      }
    },
    isMobile(isMobile) {
      if (!isMobile) {
        this.onChangePane('messages');
      }
    }
  },
  async mounted() {
    this.load();

    // events
    EventBus.$on('jump-to', this.jumpTo.bind(this));
    EventBus.$on('onQuote', this.onQuote.bind(this));
    EventBus.$on('onEditMessage', this.onEditMessage.bind(this));
  },

  destroyed() {
    // unlisten to events
    EventBus.$off('jump-to');
    EventBus.$off('onQuote');
    EventBus.$off('onEditMessage');
  },
  methods: {
    onTogglePanes(e) {
      const { target } = e;

      if (
        target.nodeName !== 'INPUT' &&
        target.nodeName !== 'TEXTAREA' &&
        target.contentEditable !== 'true'
      ) {
        if (e.key === '[') {
          this.$refs.switcher.toggleMinification();
        } else if (this.$refs.sidebar) {
          this.$refs.sidebar.toggleMinification();
        }
      }
    },
    clearData(channelId) {
      this.$store.dispatch('files/removePages', {
        channel_id: channelId,
        path: this.getChannelPath(channelId)
      });
    },
    getChannelPath(channelId) {
      let channel = this.$store.state.channels.single[channelId];
      if (!channel) return '';
      const root = _.find(channel.channel_roots, { type: 'files' });
      return root.location;
    },
    onDropFile(e) {
      this.$refs.bar.onDropFile(e);
    },
    onQuote(e) {
      this.$refs.bar.onQuote(e);
    },
    onEditMessage(e) {
      this.$refs.bar.onEditMessage(e);
    },
    onStartMeeting() {
      this.hide_switcher = true;
      this.hide_panes = true;
    },
    onSwitch(e) {
      const currentIndex = _.findIndex(this.channels, {
        id: this.currentChannelId
      });
      let nextChannel = null;

      if (e.key === 'ArrowDown') {
        nextChannel = this.channels[currentIndex + 1]
          ? this.channels[currentIndex + 1]
          : null;
      } else {
        nextChannel = this.channels[currentIndex - 1]
          ? this.channels[currentIndex - 1]
          : null;
      }

      // if there is a next channel, go to it
      if (nextChannel) {
        this.$router.push({
          name: 'channel',
          params: {
            id: nextChannel.id,
            target: nextChannel.oldest_unread_message_id
              ? nextChannel.oldest_unread_message_id
              : nextChannel.read_watermark_id
          }
        });
      }
    },
    async load(preventHistoryFetch = false, shouldJump = false) {
      this.loading = true;
      this.isJoinOnly = false;
      this.hide_panes = false;

      // load resources if not in memory
      if (!this.channel) {
        await this.$store.dispatch('channels/get', this.$route.params.id);
      }

      if (
        this.currentMeeting &&
        this.currentMeeting == this.$route.params.id &&
        !preventHistoryFetch
      ) {
        this.hide_panes = true;
      }

      // if channel has been found
      if (this.channel) {
        // public channel handling
        if (this.$route.query.hash && this.channel.public_url) {
          // check if user is already on channel
          if (this.user.id) {
            const isInChannel = _.findIndex(this.channel.members, {
              id: this.user.id
            });
            if (isInChannel > -1) {
              this.$router.push(`/channel/${this.$route.params.id}`);
              this.loading = false;
              return;
            }
          }

          // allow external read
          if (!this.channel.allow_external_read) {
            this.isJoinOnly = true;
            return;
          }

          this.$modal.show('join-channel');
        }

        // check if it's a join request alert
        if (this.$route.params.isFresh) {
          this.$nextTick(() => {
            this.$modal.show('channel-add-members');
          });
        }

        // check if it's a join request alert
        if (
          this.$route.params.alert_type &&
          this.$route.params.alert_type === 20
        ) {
          this.$modal.show('channel-members');
        }

        // history
        if (
          !this.$route.query.highlight &&
          !this.$route.params.target &&
          !preventHistoryFetch
        ) {
          await this.$store.dispatch('channels/history', this.$route.params.id);
        } else if (!preventHistoryFetch || shouldJump) {
          this.jumpTo({
            target: this.$route.query.highlight
              ? this.$route.query.highlight
              : this.$route.params.target,
            channel: this.$route.params.id
          });
        }

        this.form.channel_name = this.channel ? this.channel.channel_name : '';

        this.$store.dispatch(
          'core/setTitle',
          this.channel.counterpart
            ? this.channel.counterpart.display_name
            : this.channel.channel_name
        );

        //fetch team members
        if (
          this.channel.team_id &&
          !this.$store.state.teams.members[this.channel.team_id] &&
          this.$store.getters['teams/isTeamMember'](this.channel.team_id)
        ) {
          this.$store.dispatch('teams/getMembers', {
            id: this.channel.team_id,
            silent: true
          });
        }

        if (this.$route.query.meeting) {
          this.$store.dispatch('meeting/join', {
            room: this.$route.query.meeting,
            server_address: this.$route.query.address,
            channelId: this.channel.id,
            shouldJoinVideo: false
          });
        }
      } else {
        // TODO: Show 404
      }

      this.loading = false;
    },

    async jumpTo({ target, channel }) {
      if (!this.channel || channel != this.channel.id) return;

      const message = _.find(this.channel.chat.messages, { id: target });

      if (!message || this.channel.clean) {
        this.$store.commit('channels/clearMessages', channel);
        await this.$store.dispatch('channels/jumpTo', {
          channel,
          message: target
        });
      }

      this.forceScrollTo(target);
    },

    forceScrollTo(target) {
      if (this.$refs.scrollable) {
        this.$refs.scrollable.scrollTo(target);
      } else {
        setTimeout(() => {
          this.forceScrollTo(target);
        }, 500);
      }
    },

    async onJoinChannel(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.joinErrors = {};

      const { hash } = this.$router.history.current.query;

      const response = await this.$store.dispatch('channels/join', {
        channel_id: this.channel.id,
        require_approval: this.channel.require_join_approval,
        public_hash: hash
      });

      if (response.ok && this.channel.require_join_approval) {
        this.joinSubmitted = true;
      } else if (!response.ok) {
        this.joinErrors = response.error;
      }
    },

    onChangePane(pane) {
      this.setTransactionsBar({
        key: 'visible',
        value: false
      });

      this.currentPane = pane;
    },

    togglePanes() {
      this.hide_panes = !this.hide_panes;
    },

    toggleSwitcher() {
      if (this.$refs.switcher) this.$refs.switcher.toggleMinification();
    },

    bytesToSize: bytesToSize,
    parseTime: parseTime,
    ...mapMutations({
      setTransactionsBar: 'files/setTransactionsBar',
      setTransaction: 'files/setTransaction',
      clearFinishedTransactions: 'files/clearFinishedTransactions'
    })
  }
};
</script>
