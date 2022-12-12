<template>
  <div
    class="page-content page-channels"
    :class="{ ['no-use-teams']: !useTeams }"
  >
    <Loader :loading="isDashboardActionsOn" full />

    <MeetingWidget />

    <Toaster v-if="!useExternalToaster" />
    <Portal to="modal-toaster-area">
      <Toaster
        ref="portal"
        @mounted="onToasterWrapperCreated"
        @destroyed="onToasterWrapperDeleted"
      />
    </Portal>

    <div
      class="full-toast"
      :class="{ show: !this.$store.state.core.websocket.status }"
    >
      {{ this.$store.state.core.websocket.error }}
    </div>

    <TeamHome
      v-if="
        (teamId && $store.state.loading['teams/get']) ||
          (currentTeam && currentTeam.name)
      "
      :teamId="teamId"
    />

    <section class="card-section">
      <div
        v-if="
          teamId &&
            !$store.state.loading['teams/get'] &&
            !(currentTeam && currentTeam.name)
        "
      >
        <div class="empty-wrapper">
          <div class="empty-box empty-box--meeting">
            <Icon family="fal" name="users" class="mb-4" />
            <h4 class="text-center">No Team</h4>
            <p class="text-center mb-4">
              The team you are looking for do not exists or have been removed.
            </p>
            <router-link class="btn btn-primary mx-auto" to="/"
              >Go back to home</router-link
            >
          </div>
        </div>
      </div>
      <div class="container-fluid" v-else>
        <SortFilter v-if="actualChannels.length" />
        <div
          v-if="
            !isDashboardActionsOn &&
              actualChannels.length === 0 &&
              $store.state.channels.isEmpty
          "
          class="welcome-user"
        >
          <h2>
            {{ $t('home.hello-user', { userName: currentUser.display_name }) }}
          </h2>
          <p v-html="$t('home.intro')"></p>
        </div>
        <div class="row">
          <div
            :class="
              actualChannels.length === 0 && $store.state.channels.isEmpty
                ? 'empty-channel'
                : 'col-lg-3 col-md-4'
            "
          >
            <div
              class="card card-float card-float--new"
              @click="
                $modal.show('channel-create', { team_id: teamId ? teamId : '' })
              "
            >
              <div class="card-body">
                <Icon family="far" name="plus" />
                <p>{{ $t('general.create-new-channel') }}</p>
              </div>
            </div>
          </div>
          <div
            v-if="!channels.length && actualChannels.length"
            class="col-lg-3 col-md-4"
          >
            <div class="no-channels-filter">
              {{
                $t(
                  `home.filter-not-found-${userPreferences.listing.filterBy}${
                    teamId ? '-team' : ''
                  }`,
                  { teamName: currentTeam && currentTeam.name }
                )
              }}
            </div>
          </div>
          <div
            v-for="(channel, index) in channelList"
            v-else
            :key="index"
            class="col-lg-3 col-md-4"
          >
            <router-link
              class="card card-float"
              @mouseover.native="hover = channel.id"
              :to="{
                name: `channel`,
                params: {
                  id: channel.id,
                  target: channel.oldest_unread_message_id
                    ? channel.oldest_unread_message_id
                    : channel.read_watermark_id
                }
              }"
            >
              <div class="card-header">
                <div
                  v-if="channel.team_id && useTeams"
                  class="team-color-tag"
                  :style="{
                    ['background-color']: getTeamColor(channel.team_id)
                  }"
                  @click="e => openTeam(e, channel.team_id)"
                  v-tooltip="{
                    offset: '10',
                    placement: 'right',
                    html: true,
                    content: $t('teams.channel-chip-tooltip', {
                      team_name: getTeamName(channel.team_id)
                    })
                  }"
                />
                <h4>
                  {{
                    !channel.one_one
                      ? channel.channel_name
                      : channel.counterpart
                      ? channel.counterpart.display_name
                      : $t('channels.direct-conversation')
                  }}
                  <span
                    v-if="channel.unread_count > 0"
                    class="badge badge-primary p-1"
                    :class="{ 'badge-muted': channel.muted }"
                    >{{
                      channel.unread_count > 99 ? '99+' : channel.unread_count
                    }}</span
                  >
                </h4>
                <ul class="card-nav" @click.stop.prevent>
                  <span
                    v-if="channel.channel_status === 2"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('channels.closed-channel')
                    }"
                    class="channel-status-icon"
                    ><Icon family="fal" name="lock"
                  /></span>
                  <span
                    v-if="channel.is_favorite"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('channels.pinned-channel')
                    }"
                    class="channel-status-icon"
                    ><Icon family="fas" name="thumbtack"
                  /></span>
                  <span
                    v-if="channel.public_url"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('channels.public-channel')
                    }"
                    class="channel-status-icon ml-1"
                    ><Icon family="fal" name="globe"
                  /></span>
                  <span
                    v-if="channel.one_one"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('channels.direct-message-channel')
                    }"
                    class="channel-status-icon ml-1"
                    ><Icon family="fal" name="user-friends"
                  /></span>
                  <span
                    v-if="channel.muted"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('channels.muted-channel')
                    }"
                    class="channel-status-icon ml-1"
                    ><Icon family="fal" name="volume-slash"
                  /></span>

                  <li v-if="hover !== channel.id">
                    <a
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: $t('general.more-options')
                      }"
                      class="more-icon"
                    >
                      <Icon family="far" name="ellipsis-h" />
                    </a>
                  </li>
                  <v-popover popover-class="home-channel-settings" v-else>
                    <li>
                      <a
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('general.more-options')
                        }"
                        class="more-icon"
                      >
                        <Icon family="far" name="ellipsis-h" />
                      </a>
                    </li>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <a
                          v-if="!channel.muted"
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click.prevent="toggleChannelMute(channel)"
                        >
                          <Icon family="fal" name="volume-slash" />
                          {{ $t('channels.mute-channel') }}
                        </a>

                        <a
                          v-if="channel.muted"
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click.prevent="toggleChannelMute(channel)"
                        >
                          <Icon family="fal" name="volume" />
                          {{ $t('channels.unmute-channel') }}
                        </a>

                        <a
                          v-if="channel.unread_count > 0"
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click.prevent="onSubmitMarkAsRead(channel)"
                        >
                          <Icon family="fal" name="check-double" />
                          {{ $t('channels.mark-all-as-read') }}
                        </a>

                        <v-popover
                          v-if="
                            channel.channel_status === 1 &&
                              ChannelRoles[channel.user_role].can(
                                'channel.manage'
                              )
                          "
                        >
                          <a class="dropdown-item" href="#" @click.prevent
                            ><Icon family="fal" name="lock" />
                            {{ $t('channels.close-channel') }}</a
                          >
                          <template slot="popover">
                            <div class="dropdown-items">
                              <div class="dropdown-text">
                                {{ $t('general.are-you-sure') }}
                              </div>
                              <button
                                v-close-popover
                                class="dropdown-item btn btn-danger"
                                type="button"
                                @click.prevent.stop="
                                  onSubmitCloseChannel(channel)
                                "
                              >
                                {{ $t('general.close-now') }}
                              </button>
                            </div>
                          </template>
                        </v-popover>
                        <a
                          v-if="
                            channel.channel_status === 2 &&
                              ChannelRoles[channel.user_role].can(
                                'channel.manage'
                              )
                          "
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click.prevent="onSubmitActivateChannel(channel)"
                        >
                          <Icon family="fal" name="unlock" />
                          {{ $t('channels.activate-channel') }}
                        </a>

                        <a
                          v-if="
                            ChannelRoles[channel.user_role].can(
                              'channel.manage'
                            )
                          "
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click="onSubmitDuplicateChannel(channel)"
                          ><Icon family="fal" name="clone" />
                          {{ $t('channels.duplicate-channel') }}</a
                        >

                        <a
                          v-if="
                            ChannelRoles[channel.user_role].can(
                              'channel.manage'
                            )
                          "
                          v-close-popover
                          class="dropdown-item"
                          href="#"
                          @click.prevent="openModal(channel)"
                        >
                          <Icon family="fal" name="cog" />
                          {{ $t('general.settings') }}
                        </a>

                        <v-popover v-if="user.id !== channel.created_by">
                          <a class="dropdown-item" href="#" @click.prevent
                            ><Icon family="fal" name="sign-out" />
                            {{ $t('channels.leave-channel') }}</a
                          >
                          <template slot="popover">
                            <div class="dropdown-items">
                              <div class="dropdown-text">
                                {{ $t('general.are-you-sure') }}
                              </div>
                              <button
                                v-close-popover
                                class="dropdown-item btn btn-danger"
                                type="button"
                                @click.prevent.stop="
                                  onSubmitLeaveChannel(channel)
                                "
                              >
                                {{ $t('channels.leave-now') }}
                              </button>
                            </div>
                          </template>
                        </v-popover>

                        <v-popover
                          v-if="
                            ChannelRoles[channel.user_role].can(
                              'channel.manage'
                            ) && user.id === channel.created_by
                          "
                        >
                          <a class="dropdown-item" href="#" @click.prevent
                            ><Icon family="fal" name="trash-alt" />
                            {{ $t('channels.delete-channel') }}</a
                          >
                          <template slot="popover">
                            <div class="dropdown-items">
                              <div class="dropdown-text">
                                {{ $t('general.are-you-sure') }}
                              </div>
                              <button
                                v-close-popover
                                class="dropdown-item btn btn-danger"
                                type="button"
                                @click.prevent.stop="
                                  onSubmitRemoveChannel(channel)
                                "
                              >
                                {{ $t('general.delete-now') }}
                              </button>
                            </div>
                          </template>
                        </v-popover>
                      </div>
                    </template>
                  </v-popover>

                  <div
                    class="close-meeting"
                    v-if="
                      channel.id == currentMeeting.channelId &&
                        currentMeeting.roomState !== 'closed'
                    "
                  >
                    <button
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: `Leave meeting`
                      }"
                      @click="$store.dispatch('meeting/close')"
                      class="btn btn-icon btn-sm"
                    >
                      <Icon family="far" name="phone" />
                    </button>
                  </div>

                  <div class="join-meeting" v-else-if="channel.meeting">
                    <button
                      @click="
                        $store.dispatch('meeting/join', {
                          room: channel.meeting.call_hash,
                          server_address: channel.meeting.server_address,
                          channelId: channel.id,
                          shouldJoinVideo: false
                        })
                      "
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: `Join meeting`
                      }"
                      class="btn btn-icon btn-sm btn-primary"
                    >
                      <Icon family="far" name="phone" />
                    </button>
                  </div>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li>
                    <Icon family="far" name="users" />
                    {{
                      $tc('channels.members-counter', channel.members.length)
                    }}
                  </li>
                  <li>
                    <Icon family="far" name="file" />
                    {{
                      $tc('channels.files-counter', channel.total_file_count)
                    }}
                  </li>
                  <li>
                    <Icon family="far" name="clock" />
                    {{
                      $t('channels.last-updated', {
                        time: parseTime(channel.last_active_on).fromNow()
                      })
                    }}
                  </li>
                </ul>

                <ul class="avatars-list">
                  <li>
                    <Avatar
                      v-if="channel.counterpart"
                      light
                      :name="channel.counterpart.display_name"
                      :user-id="channel.counterpart.id"
                      :has-avatar="channel.counterpart.has_avatar"
                      :cache="channel.counterpart.updated_on_ts"
                      :active="channel.counterpart.online_status"
                      size="medium"
                    />
                    <Avatar
                      v-else-if="channel.has_logo"
                      light
                      :name="channel.name"
                      :channel-id="channel.id"
                      :has-avatar="channel.has_logo"
                      :cache="channel.updated_on_ts"
                      size="medium"
                      type="logo"
                    />
                  </li>
                </ul>
              </div>
            </router-link>
          </div>
          <a
            class="auto-archive-load-more"
            @click="onToggleArchived"
            v-if="autoArchivedAmount > 0"
          >
            {{
              $tc('channels.sidebar.auto-archive-load-more', autoArchivedAmount)
            }}
          </a>
        </div>
      </div>
    </section>

    <ChannelCreateModal />
    <ChannelSettingsModal v-if="currentChannel" :channel="currentChannel" />
  </div>
</template>

<script>
import Vue from 'vue';
import _ from 'lodash';
import Icon from 'airsend/components/Icon.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import Toaster from 'airsend/components/Toaster.vue';
import Utils from 'airsend/client/utils';
import { parseTime } from 'airsend/utils';

import ChannelSettingsModal from '../components/Modals/ChannelSettingsV2.vue';
import ChannelCreateModal from '../components/Modals/ChannelCreateV2.vue';
import SortFilter from '../components/SortFilter.vue';

import MeetingWidget from '../components/Meeting/Widget.vue';

import TeamHome from 'airsend/components/Teams/TeamHome.vue';

import { ChannelRoles } from 'airsend/constants';

export default {
  name: 'Home',
  components: {
    Icon,
    Modal,
    Avatar,
    Loader,
    ChannelSettingsModal,
    SortFilter,
    Toaster,
    MeetingWidget,
    ChannelCreateModal,
    TeamHome
  },
  data() {
    return {
      errors: {},
      hover: null,
      userChannels: '',
      ChannelRoles,
      preEmail: '', // auxiliar input for pre email insertion
      showArchived: false,
      form: {
        channel_name: '',
        emails: [],
        copy_from_channel_id: '',
        is_public: false
      },
      currentUser: this.$store.state.core.user,
      currentChannel: null,
      useExternalToaster: false
    };
  },
  computed: {
    useTeams() {
      return this.$store.state.core.useTeams;
    },
    user() {
      return this.$store.state.core.user;
    },
    teamId() {
      return this.$route.params['id'] || undefined;
    },
    currentTeam() {
      return this.teamId
        ? this.$store.getters['teams/getTeamById'](this.teamId)
        : null;
    },
    userPreferences() {
      return this.$store.getters['core/getUserPreferences'];
    },
    isDashboardActionsOn() {
      return (
        (this.channels.length === 0 &&
          this.$store.state.loading['channel.list']) ||
        this.$store.state.loading['channels/list'] ||
        this.$store.state.loading['channels/sync'] ||
        this.$store.state.loading['channel.rename'] ||
        this.$store.state.loading['channel.close'] ||
        this.$store.state.loading['channel.remove'] ||
        this.$store.state.loading['channel.activate'] ||
        this.$store.state.loading['channel.leave'] ||
        this.$store.state.loading['channel.export']
      );
    },
    channels() {
      return this.$store.getters['channels/getSortedChannels']('home').channels;
    },
    currentMeeting() {
      return this.$store.state.meeting;
    },
    actualChannels() {
      return this.$store.getters['channels/getActualChannels'];
    },
    members() {
      return this.$store.state.channels.allMembers;
    },
    channelList() {
      if (!this.showArchived) {
        return _.filter(
          this.channels,
          (o, i) => !o.is_autoarchived || o.unread_count != 0 || i < 11
        );
      } else {
        return this.channels;
      }
    },
    autoArchivedAmount() {
      return this.channels.length - this.channelList.length;
    }
  },
  watch: {
    userPreferences: {
      immediate: true,
      deep: true,
      handler(preferences) {
        this.updateObserver(preferences);
      }
    },
    $route(to, from) {
      if (to.params && from.params && to.params.id !== from.params.id) {
        this.updateObserver();
      }
    }
  },
  mounted() {
    this.$store.dispatch('core/setTitle', 'AirSend');

    // initial load
    this.updateObserver();
  },
  methods: {
    parseTime: parseTime,
    onToasterWrapperCreated() {
      this.useExternalToaster = true;
    },
    onToasterWrapperDeleted() {
      this.useExternalToaster = false;
    },
    getTeamColor(team_id) {
      return this.$store.getters['teams/getTeamColor'](team_id);
    },
    getTeamName(team_id) {
      return this.$store.getters['teams/getTeamName'](team_id);
    },
    openTeam(e, team_id) {
      e.preventDefault();
      this.$modal.show('team-settings', { id: team_id, tab: 'members' });
    },

    // this will update the worker observer to remount the listing
    updateObserver(newPreferences = null) {
      const preferences = newPreferences
        ? newPreferences
        : this.userPreferences;

      this.$store.dispatch('channels/setObservable', {
        id: 'home',
        params: {
          filterBy: preferences.listing.filterBy,
          sortBy: preferences.listing.sortBy,
          teams: this.teamId ? [parseInt(this.teamId)] : []
        }
      });

      this.$store.dispatch('core/setUserPreference', {
        ['listing.lastTeam']: this.teamId
      });
    },

    onToggleArchived() {
      this.showArchived = !this.showArchived;
    },

    async onSubmitMarkAsRead({ id, channel_name }) {
      await this.$store.dispatch('channels/readAll', {
        channel_id: id,
        channel_name
      });
    },

    // #todo Merge all asyn functions to one
    async onSubmitRemoveChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/remove', {
        ...this.form,
        channel_id: id,
        channel_name
      });
    },

    async onSubmitCloseChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/close', {
        ...this.form,
        channel_id: id,
        channel_name
      });
    },

    async toggleChannelMute({ id, channel_name }) {
      await this.$store.dispatch('channels/mute', {
        channel_id: id,
        channel_name
      });
    },

    onSubmitDuplicateChannel({ id, members }) {
      // filter invited users (not owner)
      const invited = _.filter(members, item => {
        return item.id !== this.currentUser.id;
      });
      this.$modal.show('channel-create', {
        copy_from_channel_id: id,
        emails: invited
      });
    },

    async onSubmitActivateChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/activate', {
        ...this.form,
        channel_id: id,
        channel_name
      });
    },

    async onSubmitLeaveChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/leave', {
        ...this.form,
        channel_id: id,
        channel_name
      });
    },
    openModal(channel) {
      this.currentChannel = channel;
      setTimeout(() => {
        this.$modal.show('channel-settings');
      }, 500);
    },
    updateEmails(emails) {
      this.form.emails = emails;
    }
  }
};
</script>
