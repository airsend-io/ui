<template>
  <div class="team-channels channel-list">
    <TransferChannelOwnership />
    <AttachTeamToChannel />
    <portal to="modal-subheader">
      <div class="teams-settings-subheader">
        <ExpansiveInput placeholder="Filter channels..." v-model="filter">
          <Popover>
            <button class="btn btn-link">
              <Icon family="far" name="plus" />
              Add channel
            </button>

            <template slot="popover">
              <div class="dropdown-items team-filter-switcher">
                <div class="dropdown-title">
                  {{
                    $t(
                      'teams.settings.team-channels-create-new-channel-divider'
                    )
                  }}
                </div>
                <button
                  class="dropdown-item"
                  @click="onCreateChannel"
                  v-close-popover
                >
                  {{ $t('general.create-new-channel') }}
                </button>

                <div class="dropdown-divider"></div>
                <div class="dropdown-title">
                  {{
                    $t(
                      'teams.settings.team-channels-create-transfer-channel-divider'
                    )
                  }}
                </div>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-for="channel in availableChannels"
                  :key="channel.id"
                  @click="() => onAttachTeamChannel(channel)"
                >
                  <span>{{ channel.channel_name }}</span>
                  <div
                    v-if="channel.team_id"
                    class="color-item"
                    :style="{
                      'background-color': getTeamColor(channel.team_id)
                    }"
                  ></div>
                </button>
              </div>
            </template>
          </Popover>

          <Popover
            popoverClass="sory-by-popover"
            container=".teams-settings-subheader"
          >
            <button class="btn btn-link sort-by">
              <Icon family="far" name="sort-amount-down-alt" />
              <span
                v-if="sortBy === 'display_name-asc'"
                v-html="$t('teams.sort-by-name')"
              />
              <span
                v-if="sortBy === 'total_file_size-desc'"
                v-html="$t('teams.sort-by-quota')"
              />
              <span
                v-if="sortBy === 'action_count-asc'"
                v-html="$t('teams.sort-by-actions-count')"
              />
            </button>

            <template slot="popover">
              <div class="dropdown-items">
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-name')"
                  @click="sortBy = 'display_name-asc'"
                ></button>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-quota')"
                  @click="sortBy = 'total_file_size-desc'"
                ></button>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-actions-count')"
                  @click="sortBy = 'action_count-asc'"
                ></button>
              </div>
            </template>
          </Popover>
        </ExpansiveInput>
      </div>
    </portal>

    <Loader full :loading="loading" />
    <li
      v-for="channel in sortedChannels"
      :key="channel.id"
      class="channel-list-item"
    >
      <Avatar
        v-if="channel && channel.one_one && channel.counterpart"
        :name="channel.counterpart.display_name"
        :active="channel.counterpart.online_status"
        :user-id="channel.counterpart.id"
        :has-avatar="channel.counterpart.has_avatar"
        :cache="channel.counterpart.updated_on_ts"
        size="small"
        light
        private-only
      />
      <Avatar
        v-else-if="channel"
        :name="channel.channel_name"
        type="logo"
        :channel-id="channel.id"
        :has-avatar="channel.has_logo"
        :cache="channel.updated_on_ts"
        size="small"
        light
        private-only
      />

      <!-- Name and Email -->
      <div class="display-name">
        <h4 :class="{ 'mb-0': channel.one_one }">
          <span
            class="channel-name"
            v-tooltip="{
              delay: 1000,
              content: channel.channel_name
            }"
            >{{ channel.channel_name }}</span
          >
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
            v-if="channel.open_team_join"
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('channels.open-team-channel')
            }"
            class="channel-status-icon ml-1"
            ><Icon family="fas" name="globe" />
          </span>
          <span
            v-if="hasGuestsMembers(channel)"
            v-tooltip="{
              delay: 1000,
              offset: 5,
              content: $t('channels.has-guests')
            }"
            class="channel-status-icon ml-1"
            ><Icon family="fad" name="user-slash" />
          </span>
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
        </h4>
        <small
          v-html="
            $tc(
              'teams.settings.channels-tab-members-count',
              channel.members && channel.members.length
            )
          "
        />
      </div>

      <!-- users -->
      <div class="channel-list-item-users px-3">
        <UsersChips :users="channel.members" :team="team" />
      </div>

      <!-- Team channels -->
      <div
        class="channel-list-item-files-count px-3"
        v-html="
          $tc('teams.settings.channels-tab-files-count', channel.total_fs_count)
        "
      />

      <!-- Quota usage-->
      <div class="channel-list-item-quota px-3">
        <span>{{ bytesToSize(channel.total_fs_size) }}</span>
      </div>

      <!-- Actions count-->
      <div
        class="channel-list-actions-count px-3"
        v-html="
          $tc('teams.settings.channels-tab-actions-count', channel.action_count)
        "
      />

      <!-- Kick from channel -->
      <Popover
        class="pl-3"
        :autoHide="transferOwnershipPopoverChannel === null"
      >
        <a class="btn btn-icon btn-sm">
          <Icon family="far" name="ellipsis-h" />
        </a>
        <template slot="popover">
          <div class="dropdown-items">
            <button
              v-close-popover
              class="dropdown-item"
              type="button"
              @click="onManageMembers(channel)"
              v-tooltip="{
                content: $t(
                  'teams.settings.channel-settings-open-channel-description'
                ),
                delay: 500
              }"
            >
              {{ $t('teams.settings.channel-settings-manage-members') }}
            </button>

            <button
              v-close-popover
              v-if="!channel.open_team_join"
              class="dropdown-item"
              type="button"
              @click="onOpenChannel(channel)"
              v-tooltip="{
                content: $t(
                  'teams.settings.channel-settings-open-channel-description'
                ),
                delay: 500
              }"
            >
              {{ $t('teams.settings.channel-settings-open-channel') }}
            </button>
            <button
              v-close-popover
              v-else
              class="dropdown-item"
              type="button"
              @click="onCloseChannel(channel)"
              v-tooltip="{
                content: $t(
                  'teams.settings.channel-settings-open-channel-description'
                ),
                delay: 500
              }"
            >
              {{ $t('teams.settings.channel-settings-close-channel') }}
            </button>

            <Popover
              trigger="hover"
              placement="left-start"
              popoverArrowClass="d-none"
              :offset="-12"
              v-if="user.teamRole.can('settings.take-channel-ownership')"
              @apply-show="transferOwnershipPopoverChannel = channel.id"
              @apply-hide="transferOwnershipPopoverChannel = null"
            >
              <button class="dropdown-item dropdown-tree" type="button">
                {{ $t('teams.settings.channel-settings-transfer-ownership') }}
                <Icon family="fal" name="chevron-right" class="active" />
              </button>
              <template slot="popover">
                <div class="dropdown-items team-filter-switcher">
                  <!-- <div class="dropdown-item dropdown-input">
                    <input type="text" class="form-control form-control-sm" placeholder="Search users..." v-if="transferOwnershipPopoverChannel === channel.id">
                  </div> -->
                  <button
                    v-close-popover.all
                    class="dropdown-item"
                    type="button"
                    v-for="member in channel.members"
                    :key="member.id"
                    :disabled="member.id === channel.owned_by"
                    @click="onTransferOwnership(channel, member)"
                  >
                    <span>{{ member.display_name }}</span>
                  </button>
                </div>
              </template>
            </Popover>
          </div>
        </template>
      </Popover>
    </li>
    <div class="empty-wrapper" v-if="!sortedChannels.length">
      <div class="empty-box empty-box--meeting empty-box--boxed">
        <Icon family="fal" name="exclamation-triangle" class="mb-4" />
        <h4 class="text-center">
          {{ $t('teams.settings.team-channels-empty-title') }}
        </h4>
        <p class="text-center">
          {{ $t('teams.settings.team-channels-empty-description') }}
        </p>
        <p class="text-center">
          {{ $t('teams.settings.team-channels-empty-description2') }}
        </p>
      </div>
    </div>
    <ChannelMembers :team="team" :channel="selectedChannel" />
    <ChannelAddMembers :channel="selectedChannel" />
  </div>
</template>

<script>
import { TeamRoles, ChannelRoles } from 'airsend/constants';
import { parseTime } from 'airsend/utils';
import Avatar from 'airsend/components/Avatar.vue';
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';
import UsersChips from 'airsend/components/UsersChips.vue';
import Popover from 'airsend/components/Popover.vue';
import ExpansiveInput from 'airsend/components/ExpansiveInput.vue';

import TransferChannelOwnership from 'airsend/components/Modals/TransferChannelOwnership.vue';
import AttachTeamToChannel from 'airsend/components/Modals/AttachTeamToChannel.vue';

import ChannelMembers from 'airsend/components/Modals/ChannelMembers.vue';
import ChannelAddMembers from '../../Modals/ChannelAddMembers.vue';

import Fuse from 'fuse.js';
import _ from 'lodash';
import { bytesToSize } from 'airsend/utils';

export default {
  components: {
    Avatar,
    Loader,
    Icon,
    UsersChips,
    Popover,
    TransferChannelOwnership,
    AttachTeamToChannel,
    ExpansiveInput,
    ChannelMembers,
    ChannelAddMembers
  },
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      TeamRoles,
      ChannelRoles,
      sortBy: 'display_name-asc',
      filter: '',
      transferOwnershipPopoverChannel: null,
      transferOwnershipQuery: '',
      selectedChannelId: null
    };
  },
  mounted() {
    if (this.team.id && !this.$store.state.teams.members[this.team.id]) {
      this.$store.dispatch('teams/getMembers', { id: this.team.id });
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id) || {};
    },
    sortedChannels() {
      let channels = _.cloneDeep(this.team.all_channels);

      //filter
      if (this.filter) {
        const fuse = new Fuse(channels, {
          threshold: 0.2,
          keys: ['channel_email', 'channel_name', 'members.display_name']
        });

        channels = fuse.search(this.filter);
      }

      //sort
      const [field, type] = this.sortBy.split('-');
      channels = _.orderBy(channels, field, type);

      return channels;
    },
    availableChannels() {
      let channels = this.$store.getters['channels/getActualChannels'];
      channels = channels.filter(channel => {
        if (channel.one_one) return false;
        if (channel.team_id === this.team.id) return false;
        if (channel.owned_by !== this.user.id) return false;
        return true;
      });

      channels = _.orderBy(channels, 'team_id', 'desc');

      return channels;
    },
    loading() {
      return this.$store.state.loading['teams/getMembers'];
    },
    selectedChannel() {
      if (this.selectedChannelId) {
        const channel = _.find(this.sortedChannels, {
          id: this.selectedChannelId
        });
        if (channel) {
          return {
            ...channel
          };
        }
      }

      return {
        member: []
      };
    }
  },
  methods: {
    onTransferOwnership(channel, member) {
      this.$modal.show('transfer-channel-ownership', {
        channel: channel,
        new_owner: member,
        team_transfer: true
      });
    },
    onCreateChannel() {
      this.$modal.show('channel-create', {
        team_id: this.team.id ? this.team.id : ''
      });
    },

    onManageMembers(channel) {
      this.selectedChannelId = channel.id;

      this.$modal.show('channel-members', { channel });
    },

    onAttachTeamChannel(channel) {
      this.$modal.show('attach-team-to-channel', { team: this.team, channel });
    },

    hasGuestsMembers(channel) {
      return channel.members.some(user => this.isGuest(user.id, this.team.id));
    },

    isGuest(user_id, team_id) {
      const members = this.$store.getters['teams/getMembers'][team_id] || [];
      if (members.length === 0) return false;
      return !members[user_id];
    },

    getTeamColor(team_id) {
      return this.$store.getters['teams/getTeamColor'](team_id);
    },

    async onOpenChannel(channel) {
      this.$store.dispatch('teams/channelOpenStatus', {
        channel_id: channel.id,
        open: true
      });
    },
    onCloseChannel(channel) {
      this.$store.dispatch('teams/channelOpenStatus', {
        channel_id: channel.id,
        open: false
      });
    },
    parseTime,
    bytesToSize,
    addChannel() {
      this.$emit('addChannel');
    }
  }
};
</script>

<style></style>
