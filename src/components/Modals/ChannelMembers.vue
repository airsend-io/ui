<template>
  <div>
    <Modal
      name="channel-members"
      :title="$t('general.members')"
      theme="noPadding"
      class-name="channel-settings"
      @opened="onOpen"
    >
      <Loader :loading="loading" full />

      <div class="tabbed--wrapper">
        <div
          class="tabbed--message"
          v-if="channel.pending_members && channel.pending_members.length > 0"
        >
          {{
            $tc(
              'channels.invite.members-waiting-approval',
              channel.pending_members.length
            )
          }}
          <a
            class="ml-2"
            @click="currentTab = 'requires-approval'"
            v-if="currentTab !== 'requires-approval'"
            >{{ $t('general.view') }}</a
          >
        </div>

        <ul class="nav nav-pills nav-dynamic">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="[currentTab === 'meeting' ? 'active' : '']"
              href="#"
              @click="currentTab = 'meeting'"
              v-if="
                meeting.channelId == channel.id || $route.name === 'meeting'
              "
              >{{ $t('meeting.in-the-meeting') }} ({{
                meeting.peers.length + 1
              }})</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              :class="[currentTab === 'members' ? 'active' : '']"
              href="#"
              @click="currentTab = 'members'"
              v-if="$route.name !== 'meeting'"
              >{{ $t('general.members') }} ({{
                channel.members && channel.members.length
              }})</a
            >
          </li>
          <li
            v-if="user.role.can('channel.manage') && channel.pending_members"
            class="nav-item"
          >
            <a
              class="nav-link"
              :class="[currentTab === 'requires-approval' ? 'active' : '']"
              href="#"
              @click="currentTab = 'requires-approval'"
              >{{ $t('channels.invite.requires-approval') }} ({{
                channel.pending_members && channel.pending_members.length
              }})</a
            >
          </li>
          <li
            v-if="
              (user.role.can('channel.invite') ||
                user.teamRole.can('channel.invite')) &&
                !channel.one_one
            "
            class="nav-item ml-auto mr-4 my-2"
          >
            <button
              class="btn btn-link"
              type="button"
              @click="openNewMemberModal"
            >
              <Icon name="user-plus" /> {{ $t('channels.add-new-member') }}
            </button>
          </li>
        </ul>

        <div class="tabbed--content">
          <div class="form-group form-group--icon form-group--search mb-3">
            <Icon family="far" name="filter" />
            <input
              ref="input"
              v-model="query"
              class="form-control form-control-sm form-control--rounded form-control--large"
              type="text"
              :placeholder="$t('channels.members-filter')"
            />
            <button
              v-if="query !== ''"
              type="button"
              class="btn btn-icon btn-sm"
              @click="onCancelSearch"
            >
              <Icon family="far" name="times" class="icon-close" />
            </button>
          </div>

          <div v-if="typeof errors === 'string'" class="alert alert-danger">
            {{ errors }}
          </div>

          <perfect-scrollbar
            class="members-list"
            v-if="currentTab === 'meeting'"
          >
            <div
              v-if="
                peers &&
                  peers.length === 0 &&
                  inviteableMembers &&
                  inviteableMembers.length === 0 &&
                  query !== ''
              "
              class="empty-wrapper"
            >
              <div class="empty-box">
                <Icon family="fal" name="users" />
                <h4>{{ $t('channels.members-empty') }}</h4>
                <p>{{ $t('general.try-another-keyword') }}</p>
              </div>
            </div>

            <li class="members-list-item" v-if="query === ''">
              <Avatar
                v-if="user.id"
                size="medium"
                :name="user.display_name"
                :user-id="user.id"
                :has-avatar="user.has_avatar"
                :cache="user.updated_on_ts"
              />
              <Avatar v-else size="medium" :name="meeting.guest.display_name" />

              <div class="display-name">
                <h4 class="mb-0">
                  {{ $t('meeting.you') }}
                </h4>
              </div>

              <div class="peer-properties">
                <Icon
                  name="microphone"
                  family="far"
                  v-tooltip="$t('meeting.member-has-microphone')"
                  v-if="meeting.micProducer && !meeting.micProducer._paused"
                />
                <Icon
                  name="microphone-slash"
                  family="far"
                  v-tooltip="$t('meeting.member-has-microphone-muted')"
                  v-else-if="meeting.micProducer && meeting.micProducer._paused"
                />
                <Icon
                  name="video"
                  family="far"
                  v-tooltip="$t('meeting.member-has-webcam')"
                  v-if="meeting.webcamProducer"
                />
                <Icon
                  name="desktop"
                  family="far"
                  v-tooltip="$t('meeting.member-has-screen')"
                  v-if="meeting.screenSharingProducer"
                />
              </div>
            </li>

            <li
              v-for="peer in peers"
              :key="peer.id"
              :set="(member = getUser(peer.id))"
              class="members-list-item"
            >
              <Avatar
                :name="member.display_name"
                :user-id="member.id"
                :has-avatar="member.has_avatar"
                :cache="member.updated_on_ts"
                size="medium"
                :active="true"
                v-if="member"
              />
              <Avatar :name="peer.displayName" :active="true" v-else />

              <div class="display-name">
                <h4 class="mb-0">
                  {{ peer.displayName }}
                </h4>
              </div>

              <div
                class="peer-properties"
                :set="(consumers = getConsumers(peer.id))"
              >
                <Icon
                  name="microphone"
                  family="far"
                  v-tooltip="$t('meeting.member-has-microphone')"
                  v-if="consumers.mic && !consumers.mic.remotelyPaused"
                />
                <Icon
                  name="microphone-slash"
                  family="far"
                  v-tooltip="$t('meeting.member-has-microphone-muted')"
                  v-else-if="consumers.mic && consumers.mic.remotelyPaused"
                />

                <Icon
                  name="video"
                  family="far"
                  v-tooltip="$t('meeting.member-has-webcam')"
                  v-if="consumers.webcam && !consumers.webcam.remotelyPaused"
                />

                <Icon
                  name="desktop"
                  family="far"
                  v-tooltip="$t('meeting.member-has-screen')"
                  v-if="consumers.screen && !consumers.screen.remotelyPaused"
                />

                <Popover>
                  <button
                    v-tooltip="{
                      delay: 1000,
                      offset: 5,
                      content: $t('general.more-options')
                    }"
                    v-if="
                      meetingUser &&
                        meetingUser.id != peer.id &&
                        meetingUser.permissions.MODERATE_ROOM
                    "
                    class="btn btn-icon btn-sm"
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
                        @click="
                          $store.dispatch('meeting/stopPeerVideo', peer.id)
                        "
                      >
                        <Icon family="fal" name="video-slash" />
                        {{ $t('meeting.moderator.disable-video') }}
                      </button>
                      <button
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        v-if="consumers.screen"
                        @click="
                          $store.dispatch('meeting/stopPeerScreen', peer.id)
                        "
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
            </li>

            <li
              v-for="invitee in inviteableMembers"
              :key="invitee.id"
              class="members-list-item members-list-item--transparent"
            >
              <Avatar
                :name="invitee.display_name"
                :user-id="invitee.id"
                :has-avatar="invitee.has_avatar"
                :cache="invitee.updated_on_ts"
                size="medium"
                :active="invitee.online_status"
              />

              <div class="display-name">
                <h4 class="mb-0">
                  {{ invitee.display_name }}
                </h4>
              </div>

              <div
                v-if="!invitee.online_status && invitee.account_status !== 50"
                class="members-list-item-role-lastseen"
                v-html="
                  $t('channels.last-seen-nl', {
                    time: parseTime(invitee.last_active_on).fromNow()
                  })
                "
              ></div>
              <div
                v-else-if="
                  invitee.online_status && invitee.account_status !== 50
                "
                class="members-list-item-role-lastseen"
              >
                {{ $t('channels.members-online-now') }}
              </div>
              <div v-else class="members-list-item-role-lastseen">
                {{ $t('channels.members-never-seen') }}
              </div>

              <div class="ml-auto d-flex">
                <button
                  type="button"
                  v-tooltip="$t('meeting.add-to-call')"
                  class="btn btn-icon btn-primary btn-sm"
                  name="button"
                  @click="inviteMember(invitee.id)"
                  v-if="!isInvited[invitee.id]"
                >
                  <Icon family="fal" name="plus" />
                </button>

                <div
                  v-if="isInvited[invitee.id]"
                  class="members-list-item-role-lastseen text-right mr-0 pr-0"
                >
                  {{
                    $t('meeting.invite.inviting', {
                      userName: invitee.display_name
                    })
                  }}
                </div>
              </div>
            </li>
          </perfect-scrollbar>
          <perfect-scrollbar class="members-list" v-else>
            <TransferChannelOwnership v-if="user.id === channel.owned_by" />

            <div v-if="members && members.length === 0" class="empty-wrapper">
              <div class="empty-box">
                <Icon family="fal" name="users" />
                <h4>{{ $t('channels.members-empty') }}</h4>
                <p>{{ $t('general.try-another-keyword') }}</p>
              </div>
            </div>

            <li
              v-for="member in members"
              :key="member.id"
              class="members-list-item"
            >
              <Avatar
                :name="member.display_name"
                :user-id="member.id"
                :has-avatar="member.has_avatar"
                :cache="member.updated_on_ts"
                size="medium"
                :active="member.online_status"
                :isGuest="isGuest(member.id)"
              />

              <!-- Name and Email -->
              <div class="display-name">
                <h4 :class="{ 'mb-0': !member.email }">
                  {{ member.display_name }}
                </h4>
                <small v-if="member.email">{{ member.email }}</small>
              </div>

              <!-- Badge -->
              <fragment v-if="ChannelRoles[member.user_role]">
                <v-popover
                  v-if="
                    user.role.can('channel.promote') &&
                      member.id !== user.id &&
                      member.id !== channel.owned_by
                  "
                >
                  <div
                    class="members-list-item-role members-list-item-role--link"
                  >
                    <div class="member-badge badge">
                      {{
                        channel.owned_by === member.id
                          ? $t('channels.members-badge-owner')
                          : $t(
                              `channels.members-badge-${
                                ChannelRoles[member.user_role].title
                              }`
                            )
                      }}
                      <Icon family="fas" name="caret-down" />
                    </div>
                  </div>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <button
                        v-for="id in Object.keys(ChannelRoles)"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        :class="{ active: member.user_role == id }"
                        :set="(role = ChannelRoles[id])"
                        @click="onChangeRole(member, id)"
                        :key="id"
                      >
                        <Icon family="fal" :name="role.icon" />
                        {{ $t(`channels.members-badge-${role.title}`) }}
                        <Icon
                          v-tooltip="{
                            offset: 5,
                            content: $t(
                              `channels.members-badge-${role.title}-description`
                            )
                          }"
                          family="fas"
                          name="info-circle"
                          class="icon-info"
                        />
                      </button>
                      <button
                        v-if="user.id === channel.owned_by"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="onTransferOwnership(member)"
                      >
                        <Icon family="fal" :name="role.icon" />
                        {{ $t(`channels.members-badge-owner`) }}
                        <Icon
                          v-tooltip="{
                            offset: 5,
                            content: $t(
                              `channels.members-badge-owner-description`
                            )
                          }"
                          family="fas"
                          name="info-circle"
                          class="icon-info"
                        />
                      </button>
                    </div>
                  </template>
                </v-popover>
                <div v-else class="members-list-item-role">
                  <div class="member-badge badge">
                    {{
                      channel.owned_by === member.id
                        ? $t('channels.members-badge-owner')
                        : $t(
                            `channels.members-badge-${
                              ChannelRoles[member.user_role].title
                            }`
                          )
                    }}
                  </div>
                </div>
              </fragment>

              <!-- Last seen -->
              <div
                v-if="!member.online_status && member.account_status !== 50"
                class="members-list-item-role-lastseen"
                v-html="
                  $t('channels.last-seen-nl', {
                    time: parseTime(member.last_active_on).fromNow()
                  })
                "
              ></div>
              <div
                v-else-if="member.online_status && member.account_status !== 50"
                class="members-list-item-role-lastseen"
              >
                {{ $t('channels.members-online-now') }}
              </div>
              <div v-else class="members-list-item-role-lastseen">
                {{ $t('channels.members-never-seen') }}
              </div>

              <!-- Approve request to join channel -->
              <button
                v-if="
                  currentTab === 'requires-approval' &&
                    user.role.can('channel.approve')
                "
                @click="approveJoinRequest(member.id)"
                class="btn btn-primary text-nowrap"
              >
                <Icon family="far" name="check" />
                {{ $t(`channels.invite.approve`) }}
              </button>

              <!-- Approve request to join channel -->
              <v-popover
                v-if="
                  currentTab === 'requires-approval' &&
                    user.role.can('channel.approve')
                "
              >
                <a
                  class="btn btn-icon btn-sm ml-2"
                  v-tooltip="{
                    delay: 1000,
                    offset: 5,
                    content: $t('general.more-options')
                  }"
                >
                  <Icon family="far" name="ellipsis-h" />
                </a>
                <template slot="popover">
                  <div class="dropdown-items">
                    <button
                      v-close-popover
                      @click="createOneToOne(member.id)"
                      class="dropdown-item"
                      type="button"
                    >
                      <Icon family="fal" name="paper-plane" />
                      {{ $t('channels.direct-conversation') }}
                    </button>

                    <button
                      v-close-popover
                      class="dropdown-item"
                      @click="rejectJoinRequest(member.id)"
                      type="button"
                    >
                      <Icon family="fal" name="user-times" />
                      {{ $t('channels.invite.reject') }}
                    </button>
                  </div>
                </template>
              </v-popover>

              <!-- Kick from channel -->
              <v-popover
                v-if="
                  currentTab === 'members' &&
                    member.id !== user.id &&
                    (user.role.can('channel.kick') ||
                      user.teamRole.can('channel.invite')) &&
                    !channel.one_one &&
                    channel.owned_by !== member.id
                "
                class="v-popover-right"
              >
                <a class="btn btn-icon btn-sm">
                  <Icon family="far" name="times" />
                </a>
                <template slot="popover">
                  <div class="dropdown-items">
                    <div class="dropdown-text">
                      {{ $t('general.are-you-sure') }}
                    </div>
                    <button
                      v-close-popover
                      class="dropdown-item btn btn-danger"
                      type="button"
                      @click="removeMember(member.id)"
                    >
                      {{ $t('channels.members-remove') }}
                    </button>
                  </div>
                </template>
              </v-popover>
            </li>
          </perfect-scrollbar>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Fuse from 'fuse.js';
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';
import Popover from 'airsend/components/Popover.vue';
import TransferChannelOwnership from 'airsend/components/Modals/TransferChannelOwnership.vue';

import ChannelMembersAddModal from './ChannelAddMembers.vue';
import Utils from 'airsend/client/utils';
import { parseTime } from 'airsend/utils';

import MemberBadge from 'airsend/components/MemberBadge.vue';
import { EventBus } from 'airsend/event-bus';

import { ChannelRoles } from 'airsend/constants';

export default {
  components: {
    Modal,
    Avatar,
    Loader,
    Icon,
    Popover,
    MemberBadge,
    ChannelMembersAddModal,
    TransferChannelOwnership
  },
  props: {
    channel: {
      type: Object,
      default: () => {
        return {
          members: []
        };
      }
    },
    team: {
      type: Object,
      required: false
    }
  },
  data() {
    return {
      errors: {},
      ChannelRoles,
      currentTab: 'members',
      query: '',
      preEmail: '', // auxiliar input for pre email insertion
      isInvited: {},
      form: {
        emails: []
      }
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](
        this.channel.id,
        this.team ? this.team.id : null
      );
    },
    meeting() {
      return this.$store.state.meeting;
    },
    meetingUser() {
      return this.$store.getters['meeting/getMe'];
    },
    loading() {
      return (
        this.$store.state.loading['channel.user.setrole'] ||
        this.$store.state.loading['channel.one-on-one'] ||
        this.$store.state.loading['channel.approveJoin'] ||
        this.$store.state.loading['channel.removeJoin'] ||
        this.$store.state.loading['channel.kick']
      );
    },
    allMembers() {
      const allMembers = this.$store.getters['channels/getSortedMembers'](
        this.channel.id,
        this.currentTab === 'requires-approval'
      );

      if (!allMembers.length) {
        //user does not have access to channel members (user is a team manager)
        return this.channel.members;
      } else {
        return allMembers;
      }
    },
    members() {
      // fuzzy search
      if (this.query) {
        const fuse = new Fuse(this.allMembers, {
          threshold: 0.2,
          keys: ['display_name']
        });

        return fuse.search(this.query);
      }

      return this.allMembers;
    },

    peers() {
      if (!this.channel.meeting && this.$route.name !== 'meeting') return [];

      // fuzzy search
      if (this.query) {
        const fuse = new Fuse(this.meeting.peers, {
          threshold: 0.2,
          keys: ['displayName']
        });

        return fuse.search(this.query);
      }

      // keep user on top
      return _.sortBy(this.meeting.peers, 'displayName');
    },

    mappedPeers() {
      return this.$store.getters['meeting/getMappedPeers'];
    },

    inviteableMembers() {
      return this.members.filter(member => {
        return !this.mappedPeers[member.id] && member.id != this.user.id;
      });
    },
    teamMembers() {
      return (
        this.$store.getters['teams/getMembers'][this.channel.team_id] || []
      );
    }
  },
  mounted() {
    EventBus.$on('addNewMembers', this.openNewMemberModal);
  },
  methods: {
    onOpen() {
      this.currentTab =
        this.$route.name === 'meeting' ||
        (this.meeting && this.meeting.channelId == this.channel.id)
          ? 'meeting'
          : 'members';
      this.query = '';
      this.isInvited = {};
      this.$refs.input.focus();
    },
    isGuest(user_id) {
      if (this.teamMembers.length === 0) return false;
      return !this.teamMembers[user_id];
    },
    async onChangeRole(member, role) {
      const response = await this.$store.dispatch('channels/setUserRole', {
        channel_id: this.channel.id,
        user_id: member.id,
        user_role: role
      });
    },
    openNewMemberModal: function() {
      this.$modal.hide('channel-members');
      this.$modal.show('channel-add-members');
    },

    removeMember: async function(memberId) {
      // #todo : fix the error while removing members
      const payload = {
        channel_id: this.channel.id,
        user_id: memberId
      };
      const response = await this.$store.dispatch(
        'channels/removeMember',
        payload
      );
      if (response.ok) {
        // Throw Success in Pop/Toast
      } else {
        console.error(response.error);
        // Throw error in Pop/Toast
      }
    },

    onCancelSearch() {
      this.query = '';
    },

    async createOneToOne(id) {
      const response = await this.$store.dispatch(
        'channels/createOneOnOne',
        id
      );
      this.$modal.hide('channel-members');
    },

    async approveJoinRequest(id) {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/approveJoin', {
        channel_id: this.channel.id,
        user_id: id
      });

      if (!response.ok) {
        this.errors = response.error;
      }
    },

    async rejectJoinRequest(id) {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/rejectJoin', {
        channel_id: this.channel.id,
        user_id: id
      });

      if (!response.ok) {
        this.errors = response.error;
      }
    },

    async inviteMember(id) {
      this.errors = {};

      Vue.set(
        this.isInvited,
        id,
        setTimeout(() => {
          Vue.set(this.isInvited, id, null);
        }, 15000)
      );

      const response = await this.$store.dispatch('meeting/invite', id);

      if (!response.ok) {
        this.errors = response.error;
      }
    },

    getUser(id) {
      if (this.channel.id) {
        return this.$store.getters['channels/getUserInChannel'](
          this.channel.id,
          id
        );
      } else {
        return null;
      }
    },

    getConsumers(id) {
      return this.$store.getters['meeting/getConsumerByType'](id);
    },
    onTransferOwnership(member) {
      this.$modal.show('transfer-channel-ownership', {
        channel: this.channel,
        new_owner: member
      });
    },

    parseTime: parseTime
  }
};
</script>
