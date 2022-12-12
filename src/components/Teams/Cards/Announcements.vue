<template>
  <div class="card card-float team-announcements">
    <Loader full :loading="loading" />
    <div class="card-header">
      <h4>
        Announcements
        <!-- $t('') -->
      </h4>
      <ul class="card-nav" @click.stop.prevent>
        <span
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('channels.closed-channel')
          }"
          :class="{ invisible: !user.teamRole.can('teams.manage') }"
          @click="onEdit"
          class="expand-icon"
          ><Icon family="far" name="pencil-alt"
        /></span>
      </ul>
    </div>
    <div class="card-body" ref="card-body">
      <a class="card-overflow" v-if="isOverflowing" @click="onExpand"
        >View all</a
      >
      <div
        class="announcement-content wiki-content"
        style="min-height:0;"
        ref="announcement"
        v-html="displayContent"
      ></div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader';
import { markdownToHtml } from 'airsend/utils';

export default {
  props: {
    team: {
      required: true
    }
  },
  data() {
    return {
      isOverflowing: false
    };
  },
  computed: {
    loading() {
      return this.$store.state.loading['teams/get'];
    },
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id);
    },
    displayContent() {
      const { announcements } = this.team;
      return announcements && announcements !== ''
        ? markdownToHtml(announcements, '', true)
        : '';
    }
  },
  updated() {
    this.onUpdateContent();
  },
  mounted() {
    this.onUpdateContent();
  },
  methods: {
    onEdit() {
      this.$modal.show('team-settings', { id: this.team.id, tab: 'settings' });
    },
    onExpand() {
      this.$modal.show('team-settings', {
        id: this.team.id,
        tab: 'announcements'
      });
    },
    onUpdateContent() {
      if (
        this.$refs['card-body'] &&
        this.$refs['announcement'] &&
        this.$refs['announcement'].clientHeight >
          this.$refs['card-body'].clientHeight - 26
      ) {
        this.isOverflowing = true;
      } else {
        this.isOverflowing = false;
      }
    }
  },
  components: {
    Icon,
    Loader
  }
};
</script>
