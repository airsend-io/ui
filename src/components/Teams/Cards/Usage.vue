<template>
  <div class="card card-float team-usage">
    <Loader full :loading="loading" />
    <div class="card-header">
      <h4>
        Usage
        <!-- $t('') -->
      </h4>
      <ul class="card-nav" @click.stop.prevent>
        <button class="btn btn-primary mr-3" v-if="false">
          <Icon family="far" name="crown" />
          <!-- Upgrade to PRO! -->
        </button>
        <span
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('channels.closed-channel')
          }"
          @click="onExpand"
          class="expand-icon"
          :class="{ invisible: !user.teamRole.can('teams.manage') }"
          ><Icon family="far" name="expand"
        /></span>
      </ul>
    </div>

    <div class="card-body">
      <div class="row align-items-center flex-nowrap overflow-hidden">
        <div class="d-flex flex-1">
          <Progress :value="usagePercent" :text="usageLabel" />
        </div>
        <div class="usage-info text-truncate">
          <div class="usage-info-item">
            <div class="icon">
              <Icon family="far" name="users" />
            </div>
            <span class="text-truncate">{{ team.members_count }} members</span>
          </div>
          <div class="usage-info-item">
            <div class="icon">
              <Icon family="fas" name="th" />
            </div>
            <span class="text-truncate">{{ channelsCount }} channels</span>
          </div>
          <div class="usage-info-item">
            <div class="icon">
              <Icon family="far" name="file" />
            </div>
            <span class="text-truncate">{{ fileCount }} files</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Progress from 'airsend/components/ProgressCircular.vue';
import Loader from 'airsend/components/Loader';
import { bytesToSize } from 'airsend/utils';

export default {
  props: {
    team: {
      required: true
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id);
    },
    loading() {
      return this.$store.state.loading['teams/get'];
    },
    fileCount() {
      return (
        (this.team.storage_stats &&
          this.team.storage_stats.folderCount +
            this.team.storage_stats.fileCount) ||
        0
      );
    },
    channelsCount() {
      return (this.team.all_channels && this.team.all_channels.length) || 0;
    },
    usagePercent() {
      return this.fs_total > 0
        ? ((this.fs_size / this.fs_total) * 100).toFixed(1)
        : 0.0;
    },
    fs_size() {
      return this.team && this.team.storage_used_size;
    },
    fs_total() {
      return this.team && this.team.storage_available_size;
    },
    usageLabel() {
      return `${this.bytesToSize(this.fs_size)} / ${this.bytesToSize(
        this.fs_total
      )}`;
    }
  },
  methods: {
    onExpand() {
      this.$modal.show('team-settings', { id: this.team.id, tab: 'settings' });
    },
    bytesToSize
  },
  components: {
    Icon,
    Progress,
    Loader
  }
};
</script>
