<template>
  <section class="card-section team-card-section">
    <div class="container-fluid">
      <CardsLoader v-if="loading" />
      <div v-else>
        <h5 class="team-name d-none">{{ team.name }}</h5>
        <div class="row">
          <div class="col-lg-6 col-md-4" v-if="team.announcements">
            <Announcements :team="team" />
          </div>
          <div
            class="col-lg-3 col-md-4"
            v-if="user.teamRole.can('teams.manage')"
          >
            <Usage :team="team" />
          </div>
          <div class="col-lg-3 col-md-4">
            <OpenChannels :team="team" v-if="showOpenChannels" />
          </div>
          <div class="col-lg-3 col-md-4" v-if="false">
            <PendingActions :team="team" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ChannelRoles } from 'airsend/constants';
import { parseTime } from 'airsend/utils';

import Announcements from 'airsend/components/Teams/Cards/Announcements.vue';
import Usage from 'airsend/components/Teams/Cards/Usage.vue';
import OpenChannels from 'airsend/components/Teams/Cards/OpenChannels.vue';
import PendingActions from 'airsend/components/Teams/Cards/PendingActions.vue';
import CardsLoader from './Cards/CardsLoader.vue';

export default {
  props: {
    teamId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      errors: {},
      ChannelRoles
    };
  },
  computed: {
    loading() {
      return this.$store.state.loading['teams/get'];
    },
    user() {
      if (!this.teamId) return {};
      return this.$store.getters['core/getUser'](null, this.teamId);
    },
    userPreferences() {
      return this.$store.getters['channels/getUserPreferences'];
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
    team() {
      return this.teamId
        ? this.$store.getters['teams/getTeamById'](this.teamId)
        : {};
    },
    showOpenChannels() {
      return (
        this.user.teamRole.can('teams.manage') ||
        (this.team && this.team.open_channels && this.team.open_channels.length)
      );
    }
  },
  watch: {
    teamId: {
      immediate: true,
      handler(id) {
        if (id && !this.$store.state.teams.single[id]) {
          this.$store.dispatch('teams/get', { id });
        }
      }
    }
  },
  components: {
    Announcements,
    Usage,
    OpenChannels,
    PendingActions,
    CardsLoader
  }
};
</script>
