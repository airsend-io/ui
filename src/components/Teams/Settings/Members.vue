<template>
  <div class="team-members members-list">
    <Loader full :loading="loading" />
    <portal to="modal-subheader">
      <div class="teams-settings-subheader">
        <ExpansiveInput placeholder="Filter users..." v-model="filter">
          <button
            class="btn btn-link"
            @click="inviteUser"
            v-if="user.teamRole.can('settings.members.invite')"
          >
            <Icon family="far" name="plus" />
            Invite user
          </button>

          <Popover
            popoverClass="sory-by-popover"
            container=".teams-settings-subheader"
          >
            <button class="btn btn-link sort-by">
              <Icon family="far" name="sort-amount-down-alt" />
              <span
                v-if="sortBy === 'role-desc'"
                v-html="$t('teams.sort-by-role')"
              ></span>
              <span
                v-else-if="sortBy === 'name-asc'"
                v-html="$t('teams.sort-by-name')"
              ></span>
              <span
                v-else-if="sortBy === 'channels_count-asc'"
                v-html="$t('teams.sort-by-channels-count')"
              ></span>
              <span
                v-else-if="sortBy === 'fs_size-asc'"
                v-html="$t('teams.sort-by-quota')"
              ></span>
            </button>
            <template slot="popover">
              <div class="dropdown-items">
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-role')"
                  @click="sortBy = 'role-desc'"
                ></button>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-name')"
                  @click="sortBy = 'name-asc'"
                ></button>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-channels-count')"
                  @click="sortBy = 'channels_count-asc'"
                ></button>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  v-html="$t('teams.sort-by-quota')"
                  @click="sortBy = 'fs_size-asc'"
                ></button>
              </div>
            </template>
          </Popover>
        </ExpansiveInput>
      </div>
    </portal>

    <li
      v-for="member in sortedMembers"
      :key="member.id"
      class="members-list-item"
    >
      <Avatar
        :name="member.name"
        :user-id="member.id"
        :has-avatar="member.has_avatar"
        :cache="member.updated_on_ts"
        size="medium"
        :active="member.online_status"
      />

      <!-- Name and Email -->
      <div class="display-name">
        <h4 :class="{ 'mb-0': !member.email }">
          {{ member.name }}
        </h4>
        <small v-if="member.email">{{ member.email }}</small>
      </div>

      <!-- Badge -->
      <fragment v-if="TeamRoles[member.role]">
        <Popover
          v-if="
            user.teamRole.can('settings.members.promote') &&
              team.role_id >= member.role &&
              member.id !== user.id &&
              member.id !== team.created_by
          "
        >
          <div class="members-list-item-role members-list-item-role--link">
            <div class="member-badge badge">
              {{
                team.created_by === member.id
                  ? $t('teams.forms.members-badge-owner')
                  : $t(
                      `teams.forms.members-badge-${
                        TeamRoles[member.role].title
                      }`
                    )
              }}
              <Icon family="fas" name="caret-down" />
            </div>
          </div>
          <template slot="popover">
            <div class="dropdown-items">
              <button
                v-for="id in availableRoles"
                :key="id"
                v-close-popover
                class="dropdown-item"
                type="button"
                :class="{ active: member.role == id }"
                :set="(role = TeamRoles[id])"
                @click="onChangeRole(member, id)"
              >
                <Icon family="fal" :name="role.icon" />
                {{ $t(`teams.forms.members-badge-${role.title}`) }}
                <Icon
                  v-tooltip="{
                    offset: 5,
                    content: $t(
                      `teams.forms.members-badge-${role.title}-description`
                    )
                  }"
                  family="fas"
                  name="info-circle"
                  class="icon-info"
                />
              </button>
            </div>
          </template>
        </Popover>
        <div v-else class="members-list-item-role">
          <div class="member-badge badge">
            {{
              team.created_by === member.id
                ? $t('teams.forms.members-badge-owner')
                : $t(
                    `teams.forms.members-badge-${TeamRoles[member.role].title}`
                  )
            }}
          </div>
        </div>
      </fragment>

      <!-- Team channels -->
      <div
        class="members-list-item-team-channels"
        v-html="
          $tc('teams.settings.members-tab-team-channels', member.channels_count)
        "
      />

      <!-- Quota usage-->
      <div class="members-list-item-quota">
        <b>{{ bytesToSize(member.fs_size) }} </b>
      </div>
      <!-- Kick from channel -->
      <v-popover
        v-if="
          member.id !== user.id &&
            user.teamRole.can('settings.members.kick') &&
            team.role_id >= member.role
        "
        class="pl-3"
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
              @click="onRemoveMember(member.id)"
            >
              {{ $t('channels.members-remove') }}
            </button>
          </div>
        </template>
      </v-popover>
    </li>
  </div>
</template>

<script>
import { TeamRoles, ChannelRoles } from 'airsend/constants';
import { parseTime } from 'airsend/utils';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Popover from 'airsend/components/Popover.vue';
import Loader from 'airsend/components/Loader.vue';
import ExpansiveInput from 'airsend/components/ExpansiveInput.vue';

import { bytesToSize } from 'airsend/utils';

import Fuse from 'fuse.js';
import _ from 'lodash';

export default {
  components: {
    Loader,
    Popover,
    Avatar,
    Icon,
    ExpansiveInput
  },
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  created() {
    if (this.team.id && !this.$store.state.teams.members[this.team.id]) {
      this.$store.dispatch('teams/getMembers', { id: this.team.id });
    }
  },
  data() {
    return {
      TeamRoles,
      ChannelRoles,
      filter: '',
      sortBy: 'name-asc',
      isSearching: false
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id);
    },
    sortedMembers() {
      let members = _.cloneDeep(this.team.members);

      //filter
      if (this.filter) {
        const fuse = new Fuse(members, {
          threshold: 0.2,
          keys: ['display_name', 'email']
        });

        members = fuse.search(this.filter);
      }

      //sort
      const [field, type] = this.sortBy.split('-');
      members = _.orderBy(members, field, type);

      return members;
    },
    loading() {
      return this.$store.state.loading['teams/getMembers'];
    },
    availableRoles() {
      let roles = { ...TeamRoles };
      delete roles[100];
      return Object.keys(roles);
    }
  },
  methods: {
    inviteUser() {
      this.$emit('inviteUser');
    },
    async onRemoveMember(memberId) {
      const payload = {
        team_id: this.team.id,
        user_id: memberId
      };
      const response = await this.$store.dispatch(
        'teams/removeMember',
        payload
      );

      //this.$store.dispatch('teams/getMembers', {id: this.team.id});
    },
    async onChangeRole(member, role) {
      const payload = {
        team_id: this.team.id,
        user_id: member.id,
        role
      };

      const response = await this.$store.dispatch('teams/setRole', payload);
    },
    bytesToSize,
    parseTime
  }
};
</script>
