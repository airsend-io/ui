<template>
  <div class="teams-tabs">
    <perfect-scrollbar :suppressScrollY="true">
      <div class="tabs-container">
        <router-link
          :to="
            isNotAllChannels(team.id) ? { path: `/team/${team.id}`, team } : '/'
          "
          @mouseover="hovering = team.id"
          class="team-tab-item"
          :class="{ ['active']: isTabActive(team.id) }"
          v-for="(team, index) in teams"
          :key="index"
        >
          <h4>
            {{ team.name }}
          </h4>
        </router-link>
      </div>
    </perfect-scrollbar>

    <div class="team-tab-right-controls">
      <a class="create-new-team" href="#" @click="onNewTeam">
        <Icon family="fal" name="plus" />
        {{ $t('teams.new-team') }}
      </a>
      <a
        v-if="
          isNotAllChannels(currentActiveTab) &&
            user.teamRole.can('teams.manage')
        "
        class="manage-team"
        @click="openTeamSettings(currentActiveTab)"
        href="#"
      >
        <Icon family="fas" name="cog" />
        {{ $t('teams.manage-team') }}
      </a>
    </div>

    <TeamCreateModal />
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover';
import TeamCreateModal from 'airsend/components/Modals/TeamCreate';

export default {
  data() {
    return {
      defaultTeam: {
        id: 1,
        name: this.$t('teams.all-channels')
      },
      hovering: null
    };
  },
  computed: {
    userTeams() {
      return this.$store.state.teams.all || [];
    },
    teams() {
      return [this.defaultTeam, ...this.userTeams];
    },
    currentActiveTab() {
      return parseInt(this.$route.params['id'] || this.defaultTeam.id);
    },
    user() {
      return this.$store.getters['core/getUser'](null, this.currentActiveTab);
    }
  },
  methods: {
    isNotAllChannels(teamId) {
      return teamId !== this.defaultTeam.id;
    },
    isTabActive(teamId) {
      return this.currentActiveTab == teamId;
    },
    onNewTeam() {
      this.$modal.show('team-create');
    },
    openTeamSettings(teamId) {
      this.$modal.show('team-settings', { id: teamId });
    },
    getUserFromTeam(teamId) {
      return this.$store.getters['core/getUser'](null, teamId);
    }
  },
  components: {
    Icon,
    Popover,
    TeamCreateModal
  }
};
</script>
