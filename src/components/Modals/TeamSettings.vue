<template>
  <portal to="modal-wrapper" :order="1">
    <Modal
      name="team-settings"
      :title="team && team.name"
      className="teams-settings"
      @before-open="onOpen"
    >
      <template v-slot:tabs>
        <ul>
          <li class="item-title">
            {{ $t('teams.settings.tab-title').toUpperCase() }}
          </li>
          <li
            :class="{ active: page === 'settings' }"
            @click="page = 'settings'"
            v-if="user.teamRole.can('settings.tabs.settings')"
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-settings')
            }"
          >
            <Icon family="far" name="cog" />
            <span>{{ $t('teams.settings.tab-settings') }}</span>
          </li>
          <li
            :class="{ active: page === 'members' }"
            @click="page = 'members'"
            v-if="user.teamRole.can('settings.tabs.members')"
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-members')
            }"
          >
            <Icon family="far" name="users" />
            <span>{{ $t('teams.settings.tab-members') }}</span>
          </li>
          <li
            :class="{ active: page === 'channels' }"
            @click="page = 'channels'"
            v-if="user.teamRole.can('settings.tabs.channels')"
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-channels')
            }"
          >
            <Icon family="fas" name="th" />
            <span>{{ $t('teams.settings.tab-channels') }}</span>
          </li>
          <li
            :class="{ active: page === 'open-channels' }"
            @click="page = 'open-channels'"
            v-if="user.teamRole.can('settings.tabs.open-channels')"
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-open-channels')
            }"
          >
            <Icon family="fal" name="th" />
            <span>{{ $t('teams.settings.tab-open-channels') }}</span>
          </li>

          <li
            :class="{ active: page === 'announcements' }"
            @click="page = 'announcements'"
            v-if="
              user.teamRole.can('settings.tabs.announcements') &&
                team.announcements
            "
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-announcements')
            }"
          >
            <Icon family="fal" name="bullhorn" />
            <span>{{ $t('teams.settings.tab-announcements') }}</span>
          </li>

          <li
            :class="{ active: page === 'files' }"
            @click="page = 'files'"
            v-if="false"
            v-tooltip="{
              delay: { show: 500 },
              content: $t('teams.settings.tab-files')
            }"
          >
            <Icon family="far" name="file" />
            <span>{{ $t('teams.settings.tab-files') }}</span>
          </li>
        </ul>
      </template>
      <template v-slot:subheader>
        <portal-target name="modal-subheader" />
      </template>
      <template class="body" v-slot:body>
        <Loader full :loading="loading" />
        <Settings v-if="page === 'settings'" :team="team" />
        <Members
          v-else-if="page === 'members'"
          :team="team"
          @inviteUser="inviteUser"
        />
        <Channels v-else-if="page === 'channels'" :team="team" />
        <AddMember
          v-else-if="page === 'invite-user'"
          :team="team"
          @return="page = 'members'"
        />
        <OpenChannels
          v-else-if="page === 'open-channels'"
          :team="team"
          @openTab="
            tab => {
              page = tab;
            }
          "
        />
        <Announcements v-else-if="page === 'announcements'" :team="team" />
      </template>
    </Modal>
  </portal>
</template>
<script>
import Modal from 'airsend/components/Modals/templates/LeftTabbedModal.vue';
import Loader from 'airsend/components/Loader.vue';
import Popover from 'airsend/components/Popover.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import { parseTime } from 'airsend/utils';

import Settings from '../Teams/Settings/Settings.vue';
import Members from '../Teams/Settings/Members.vue';
import AddMember from '../Teams/Settings/AddMember.vue';
import Channels from '../Teams/Settings/Channels.vue';
import Billing from '../Teams/Settings/Billing.vue';
// import Files from '../Teams/Settings/Files.vue'
import OpenChannels from '../Teams/Settings/OpenChannels.vue';
import Announcements from '../Teams/Settings/Announcements.vue';

export default {
  components: {
    Modal,
    Loader,
    Avatar,
    Icon,
    Settings,
    Members,
    Popover,
    AddMember,
    Channels,
    Billing,
    OpenChannels,
    Announcements
  },
  data() {
    return {
      page: '',
      teamId: ''
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id);
    },
    loading() {
      return this.$store.state.loading['teams/get'];
    },
    team() {
      return this.teamId
        ? this.$store.getters['teams/getTeamById'](this.teamId)
        : {};
    }
  },
  methods: {
    onOpen(e) {
      this.page = e.params.tab || 'settings';
      this.teamId = e.params.id;

      //if team is not in memory, fetch it
      if (!this.$store.state.teams.single[this.teamId]) {
        this.$store.dispatch('teams/get', { id: this.teamId });
      }
    },
    onAddColor(hex8) {
      this.colors.push(hex8);
    },
    inviteUser() {
      this.page = 'invite-user';
    },
    parseTime
  }
};
</script>
