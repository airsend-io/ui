<template>
  <div>
    <Drag
      @drag="drag"
      :transfer-data="channel"
      class="d-flex align-items-center can-drag text-truncate w-100"
      v-for="channel in channelList"
      :key="channel.id"
    >
      <div
        class="list-group-item list-group-item-action"
        :class="{
          active: channel.id === currentChannelId,
          unread: channel.unread_count > 0,
          compactView: isCompactView,
          channelMuted: channel.muted
        }"
        @click="() => onClickChannel(channel)"
        :data-id="`${channel.id}-channel-item`"
        :data-channel_id="channel.id"
        :data-unread_count="channel.unread_count"
        :ref="`${channel.id}-channel-item`"
      >
        <div
          v-if="channel.team_id && useTeams"
          class="team-color-tag"
          :style="{ ['background-color']: getTeamColor(channel.team_id) }"
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
        <div class="list-group-item-content">
          <h5>
            {{
              !channel.one_one
                ? channel.channel_name
                : channel.counterpart
                ? channel.counterpart.display_name
                : 'Direct Conversation'
            }}
          </h5>

          <UnreadBadge
            :unread_count="channel.unread_count"
            :muted="channel.muted"
          />

          <small>
            {{ parseTime(channel.last_active_on) }}
            <Icon v-if="channel.muted" family="fal" name="volume-slash" />
          </small>

          <small class="ml-1" v-if="channel.is_favorite">
            <Icon family="fas" name="thumbtack" />
          </small>

          <div
            v-if="
              channel.latest_message &&
                channel.latest_message.content &&
                !isCompactView
            "
            class="last-message"
          >
            <span v-if="channel.latest_message.user_id !== 91000001">
              {{ channel.last_message_author }}:
            </span>
            {{ channel.last_message_content }}
          </div>

          <div class="floating-controlls">
            <div
              class="more-options"
              @mouseover="hover = channel.id"
              @click.prevent.stop
            >
              <button
                v-tooltip="{
                  delay: 1000,
                  offset: -5,
                  content: $t('general.more-options')
                }"
                v-if="hover !== channel.id"
                class="btn-trigger btn btn-icon btn-sm"
              >
                <Icon family="far" name="ellipsis-h" />
              </button>
              <Popover v-else>
                <button
                  v-tooltip="{
                    delay: 1000,
                    offset: -5,
                    content: $t('general.more-options')
                  }"
                  class="btn-trigger btn btn-icon btn-sm"
                >
                  <Icon family="far" name="ellipsis-h" />
                </button>
                <template slot="popover">
                  <div class="dropdown-items">
                    <button
                      v-if="!channel.muted"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent.stop="toggleChannelMute(channel)"
                    >
                      <Icon family="fal" name="volume-slash" />
                      {{ $t('channels.mute-channel') }}
                    </button>

                    <button
                      v-if="channel.muted"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent.stop="toggleChannelMute(channel)"
                    >
                      <Icon family="fal" name="volume" />
                      {{ $t('channels.unmute-channel') }}
                    </button>

                    <button
                      v-if="channel.unread_count > 0"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="onSubmitMarkAsRead(channel)"
                    >
                      <Icon family="fal" name="check-double" />
                      {{ $t('channels.mark-all-as-read') }}
                    </button>

                    <button
                      v-if="!channel.is_favorite"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="addToFavorite(channel)"
                    >
                      <Icon family="fal" name="thumbtack" />
                      {{ $t('channels.add-favorite') }}
                    </button>

                    <button
                      v-else
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="removeFromFavorite(channel)"
                    >
                      <Icon family="fas" name="thumbtack" />
                      {{ $t('channels.remove-favorite') }}
                    </button>

                    <button
                      v-if="channel.channel_group_id !== -1"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="removeFromGroup(channel)"
                    >
                      <Icon family="fal" name="minus-square" />
                      {{ $t('channels.groups.remove-from-group') }}
                    </button>

                    <button
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="$emit('moveToGroup', channel)"
                    >
                      <Icon family="fal" name="arrow-alt-to-right" />
                      {{ $t('channels.groups.move-to-group') }}
                    </button>

                    <Popover
                      v-if="
                        channel.channel_status === 1 &&
                          ChannelRoles[channel.user_role].can('channel.manage')
                      "
                    >
                      <button class="dropdown-item" type="button">
                        <Icon family="fal" name="lock" />
                        {{ $t('channels.close-channel') }}
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
                            @click.prevent.stop="onSubmitCloseChannel(channel)"
                          >
                            {{ $t('general.close-now') }}
                          </button>
                        </div>
                      </template>
                    </Popover>

                    <Popover
                      v-if="!channel.blocked_on && channel.one_one"
                      trigger="hover"
                      placement="left-start"
                      popoverArrowClass="d-none"
                      :offset="-12"
                    >
                      <button
                        v-close-popover
                        class="dropdown-item d-flex align-items-center"
                        type="button"
                      >
                        <Icon family="fal" name="ban" />
                        Block
                        {{
                          channel &&
                            channel.counterpart &&
                            channel.counterpart.display_name
                        }}
                        <Icon
                          family="fal"
                          name="chevron-right"
                          class="ml-3 mr-0"
                        />
                      </button>
                      <template slot="popover">
                        <div class="dropdown-items team-filter-switcher">
                          <button
                            v-close-popover
                            class="dropdown-item"
                            type="button"
                            @click="() => blockChannel(channel)"
                          >
                            <span>Only block</span>
                          </button>

                          <button
                            v-close-popover
                            class="dropdown-item"
                            type="button"
                            @click="() => reportChannel(channel)"
                          >
                            <span>Report and block</span>
                          </button>
                        </div>
                      </template>
                    </Popover>

                    <button
                      v-if="channel.blocked_on && channel.one_one"
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      @click.prevent="unblockChannel(channel)"
                    >
                      <Icon family="fal" name="ban" />
                      Unblock channel
                    </button>

                    <Popover
                      v-if="user.id !== channel.created_by && !channel.one_one"
                    >
                      <button class="dropdown-item" type="button">
                        <Icon family="fal" name="sign-out" />
                        {{ $t('channels.leave-channel') }}
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
                            @click.prevent.stop="onSubmitLeaveChannel(channel)"
                          >
                            {{ $t('channels.leave-now') }}
                          </button>
                        </div>
                      </template>
                    </Popover>

                    <Popover
                      v-if="
                        ChannelRoles[channel.user_role].can('channel.manage') &&
                          user.id === channel.created_by
                      "
                    >
                      <button class="dropdown-item" type="button">
                        <Icon family="fal" name="trash-alt" />
                        {{ $t('channels.delete-channel') }}
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
                            @click.prevent.stop="onSubmitRemoveChannel(channel)"
                          >
                            {{ $t('general.delete-now') }}
                          </button>
                        </div>
                      </template>
                    </Popover>
                  </div>
                </template>
              </Popover>
            </div>

            <div
              class="join-meeting"
              v-if="channel.meeting && channel.id != currentMeeting.channelId"
            >
              <button
                v-tooltip="{
                  delay: 1000,
                  offset: -5,
                  content: `Join meeting`
                }"
                @click="joinMeeting(channel)"
                class="btn btn-icon btn-sm btn-primary"
              >
                <Icon family="far" name="phone" />
              </button>
            </div>

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

            <div
              class="join-meeting"
              v-if="
                channel.ongoing_call && channel.id !== currentMeeting.channelId
              "
            >
              <button
                @click="
                  $store.dispatch('meeting/join', {
                    room: channel.ongoing_call.call_hash,
                    server_address: channel.ongoing_call.server_address,
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
                <Icon family="far" name="phone-plus" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Drag>
    <a
      class="auto-archive-load-more"
      @click="onToggleArchived"
      v-if="autoArchivedAmount > 0"
    >
      {{ $tc('channels.sidebar.auto-archive-load-more', autoArchivedAmount) }}
    </a>
  </div>
</template>

<script>
import Vue from 'vue';
import _ from 'lodash';
import moment from 'moment';
import store from 'store';
import { Drop, Drag } from 'vue-drag-drop';

import { parseMessageContent, parseTime } from 'airsend/utils';
import Popover from 'airsend/components/Popover.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import UnreadBadge from 'airsend/components/UnreadBadge.vue';

import { ChannelRoles } from 'airsend/constants';

export default {
  components: {
    Avatar,
    Icon,
    Popover,
    Drag,
    Drop,
    UnreadBadge
  },
  data() {
    return {
      ChannelRoles,
      hover: null,
      mounted: false,
      showArchived: false
    };
  },
  props: {
    loadChannel: {
      required: false
    },
    isCompactView: {
      type: Boolean,
      default: false
    },
    channels: {
      type: Array,
      default: () => []
    },
    unreadChannelsList: {
      type: Object,
      default: () => {}
    },
    groupId: {
      default: null
    },
    index: {
      default: 0
    }
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    autoArchivedAmount() {
      return this.channels.length - this.channelList.length;
    },
    channelList() {
      if (!this.showArchived) {
        return _.filter(
          this.channels,
          (o, i) => !o.is_autoarchived || o.unread_count != 0 || i < 5
        );
      } else {
        return this.channels;
      }
    },
    currentChannelId() {
      return parseInt(this.$route.params.id);
    },
    currentMeeting() {
      return this.$store.state.meeting;
    },
    useTeams() {
      return this.$store.state.core.useTeams;
    }
  },
  methods: {
    reportChannel(channel) {
      this.$modal.show('one-one-report-spam', {
        username: channel.counterpart.display_name,
        channel: channel
      });
    },
    blockChannel(channel) {
      this.$store.dispatch('channels/blockChannel', { channel });
    },
    async unblockChannel(channel) {
      await this.$store.dispatch('channels/unblockChannel', { channel });

      if (this.currentChannelId === channel.id) {
        this.$emit('unblocked', true);
      }
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
    onToggleArchived() {
      this.showArchived = !this.showArchived;
    },
    parseMessageContent: parseMessageContent,
    parseTime(time) {
      var a = moment();
      var b = parseTime(time);

      const difference = a.diff(b, 'days');

      // if it's less than 24h
      if (difference < 1) {
        return b.format('hh:mm A');
      } else if (difference >= 1 && difference <= 7) {
        return b.format('ddd');
      } else {
        return b.format('MM/DD/YYYY');
      }
    },
    onClickChannel(channel) {
      this.$router.push({
        name: 'channel',
        params: {
          id: channel.id,
          target: channel.oldest_unread_message_id
            ? channel.oldest_unread_message_id
            : channel.read_watermark_id
        }
      });
    },

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

    async onSubmitLeaveChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/leave', {
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

    async onSubmitMarkAsRead({ id, channel_name }) {
      await this.$store.dispatch('channels/readAll', {
        channel_id: id,
        channel_name
      });
    },

    addToFavorite({ id }) {
      this.$store.dispatch('channels/addToFav', { id });
    },

    removeFromFavorite({ id }) {
      this.$store.dispatch('channels/removeFromFav', { id });
    },

    removeFromGroup(channel) {
      this.$store.dispatch('channels/removeFromGroup', {
        channel_group_id: channel.channel_group_id,
        channel_id: channel.id
      });
    },

    joinMeeting({ id, meeting }) {
      this.$store.dispatch('meeting/join', {
        room: meeting.call_hash,
        channelId: id
      });
    },

    drag(arg, e) {
      this.$emit('onDrag', e);
    }
  },
  watch: {
    unreadChannelsList: {
      deep: true,
      handler(unreadChannelsList, previusUnreadChannelsList) {
        if (!this.mounted) return;

        let noLongerInUnreadList = Object.keys(
          previusUnreadChannelsList
        ).reduce((diff, key) => {
          if (unreadChannelsList[key] && previusUnreadChannelsList[key])
            return diff; //channel still has unread messages

          return {
            ...diff,
            [key]: previusUnreadChannelsList[key]
          };
        }, {});

        for (let channel_id in noLongerInUnreadList) {
          let unreadChannel = this.$refs[`${channel_id}-channel-item`][0];
          this.$emit('unreadChannelRemoved', {
            group_id: this.group_id,
            channel_id,
            unreadChannel
          });
        }

        this.$nextTick(() => {
          for (let channel_id in unreadChannelsList) {
            let unreadChannel = this.$refs[`${channel_id}-channel-item`][0];
            this.$emit('unreadChannel', {
              groupId: this.groupId,
              element: unreadChannel
            });
          }
        });
      }
    },
    index: {
      handler() {
        this.$nextTick(function() {
          for (let channel_id in this.unreadChannelsList) {
            let unreadChannel = this.$refs[`${channel_id}-channel-item`][0];
            this.$emit('elementMoved', {
              groupId: this.groupId,
              element: unreadChannel
            });
          }
        });
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      for (let channel_id in this.unreadChannelsList) {
        let unreadChannel = this.$refs[`${channel_id}-channel-item`][0];
        this.$emit('unreadChannel', {
          group_id: this.groupId,
          element: unreadChannel
        });
      }
      this.mounted = true;
    });
  },
  beforeDestroy() {
    for (let channel_id in this.unreadChannelsList) {
      let unreadChannel = this.$refs[`${channel_id}-channel-item`][0];
      this.$emit('unreadChannelRemoved', {
        group_id: this.group_id,
        channel_id,
        unreadChannel
      });
    }
  }
};
</script>
