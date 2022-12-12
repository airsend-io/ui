<template>
  <div>
    <Loader full :loading="loading['settings']" />
    <div class="section general-usage">
      <span class="section-title">Usage</span>
      <div class="section-body">
        <Progress :value="usagePercent" :text="usageLabel" />
        <div class="general-usage-info">
          <div class="usage-info-item">
            <span class="value">{{ membersCount }}</span>
            <span class="key">{{
              $t('teams.settings.settings-tab-usage-members')
            }}</span>
          </div>
          <div class="usage-info-item">
            <span class="value">{{ channelsCount }}</span>
            <span class="key">{{
              $t('teams.settings.settings-tab-usage-channels')
            }}</span>
          </div>
          <div class="usage-info-item">
            <span class="value">{{ fileCount }}</span>
            <span class="key">{{
              $t('teams.settings.settings-tab-usage-files')
            }}</span>
          </div>
        </div>
        <button class="btn btn-primary invisible upgrade-to-pro">
          <Icon family="far" name="crown" />
          Upgrade to PRO!
        </button>
      </div>
    </div>

    <div class="section">
      <span class="section-title">{{
        $t('teams.forms.settings-tab-team-name')
      }}</span>
      <div class="section-body">
        <input
          type="text"
          class="form-control"
          v-model="teamName"
          @input="hasUnsavedChanges = true"
        />
      </div>
    </div>

    <div class="section color-tag has-switcher">
      <span class="section-title">{{
        $t('teams.forms.settings-tab-color-tag')
      }}</span>
      <div class="section-body">
        <div class="section-content">
          <span class="section-description">{{
            $t('teams.forms.settings-tab-color-tag-description')
          }}</span>
          <ColorPalette
            :items="colors"
            v-model="color"
            @onAddColor="onAddColor"
            :disabled="!useColorTags"
            @input="onChangeColor"
          />
        </div>
        <div class="section-switcher">
          <ToggleSwitch
            v-model="useColorTags"
            :loading="loading['color_tag']"
            @input="onUseColorTagsInput"
          />
        </div>
      </div>
    </div>

    <div class="section announcements has-switcher">
      <span class="section-title">{{
        $t('teams.forms.settings-tab-announcements')
      }}</span>
      <div class="section-body">
        <div class="section-content mr-2">
          <span class="section-description">{{
            $t('teams.forms.settings-tab-announcements-description')
          }}</span>

          <textarea
            class="form-control announcements-textarea"
            :class="{ 'is-invalid': announcementsOverflow }"
            :placeholder="
              $t('teams.forms.settings-tab-announcements-placeholder')
            "
            ref="announcements"
            v-model="teamAnnouncements"
            :readonly="!useAnnouncements"
            @click="useAnnouncements = true"
            @input="onAnnouncementsInput"
            rows="2"
          ></textarea>

          <div class="announcements-length-warning">
            <span :class="{ 'text-danger': announcementsOverflow }"
              >{{ announcementsLength }}/{{ announcementsMaxLength }}</span
            >
          </div>
        </div>
        <div class="section-switcher">
          <ToggleSwitch
            v-model="useAnnouncements"
            :loading="loading.announcements"
            @input="onUseAnnouncementsInput"
          />
        </div>
      </div>
    </div>

    <!-- TODO - team policies -->
    <div class="section privacy" v-if="false">
      <span class="section-title">Privacy</span>
      <div class="section-body">
        <div class="section-content">
          <div class="section-item">
            <span class="item-name">Allow anyone to be added to this team</span>
            <ToggleSwitch
              :value="team.channel_settings_1"
              :loading="loading.channel_settings_1"
              class="item-switcher"
              @input="onSwitchInput('channel_settings_1')"
            />
          </div>
          <div class="section-item">
            <span class="item-name"
              >Allow anyone to invite guests to team channels</span
            >
            <ToggleSwitch
              :value="team.channel_settings_2"
              :loading="loading.channel_settings_2"
              class="item-switcher"
              @input="onSwitchInput('channel_settings_2')"
            />
          </div>
          <div class="section-item">
            <span class="item-name">Allow creating public team channels</span>
            <ToggleSwitch
              :value="team.channel_settings_3"
              :loading="loading.channel_settings_3"
              class="item-switcher"
              @input="onSwitchInput('channel_settings_3')"
            />
          </div>
          <div class="section-item">
            <span class="item-name"
              >Allow any channel owner or channel admin to delete team
              channels</span
            >
            <ToggleSwitch
              :value="team.channel_settings_4"
              :loading="loading.channel_settings_4"
              class="item-switcher"
              @input="onSwitchInput('channel_settings_4')"
            />
          </div>
          <div class="section-item">
            <span class="item-name"
              >Allow any guest to become admin or owner of a team channel</span
            >
            <ToggleSwitch
              :value="team.channel_settings_5"
              :loading="loading.channel_settings_5"
              class="item-switcher"
              @input="onSwitchInput('channel_settings_5')"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="section footer" v-if="hasUnsavedChanges">
      <button
        class="btn btn-primary"
        @click="onSaveChanges"
        :disabled="announcementsOverflow"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script>
import Progress from 'airsend/components/ProgressCircular.vue';
import ColorPalette from 'airsend/components/ColorPalette.vue';
import ToggleSwitch from 'airsend/components/ToggleSwitch.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';

import { bytesToSize } from 'airsend/utils';

export default {
  components: {
    Progress,
    ColorPalette,
    ToggleSwitch,
    Icon,
    Loader
  },
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      color: '#FF6900',
      colors: [
        '#FF6900FF',
        '#FCB900FF',
        '#7BDCB5FF',
        '#00D084FF',
        '#8ED1FCFF',
        '#0693E3FF',
        '#ABB8C3FF',
        '#EB144CFF',
        '#F78DA7FF',
        '#9900EFFF'
      ],
      useColorTags: true,
      useAnnouncements: true,
      loading: {},
      teamName: '',
      teamAnnouncements: '',
      hasUnsavedChanges: false
    };
  },
  methods: {
    onAddColor(hex8) {
      this.colors.push(hex8);
    },
    async onUseColorTagsInput(useColors) {
      if (!useColors) {
        this.$set(this.loading, 'color_tag', true);
        await this.$store.dispatch('teams/set', {
          team_id: this.team.id,
          color_tag: null
        });
        this.$delete(this.loading, 'color_tag');
      }
    },
    async onUseAnnouncementsInput(useAnnouncements) {
      if (!useAnnouncements) {
        this.$set(this.loading, 'announcements', true);
        this.teamAnnouncements = '';

        const response = await this.$store.dispatch('teams/set', {
          team_id: this.team.id,
          announcements: ''
        });

        if (!response.ok) {
          this.teamAnnouncements = this.team.announcements;
          this.useAnnouncements = true;
        }

        this.$delete(this.loading, 'announcements');
      }
    },
    onAnnouncementsInput({ target }) {
      this.hasUnsavedChanges = true;
      let el = this.$refs['announcements'];

      var offset = el.offsetHeight - el.clientHeight;

      el.style.height = 'auto';
      el.style.height = el.scrollHeight + offset + 'px';
    },
    async onSaveChanges() {
      let payload = { team_id: this.team.id };
      this.$set(this.loading, 'settings', true);
      let error = false;

      if (this.teamName !== this.team.name) {
        const response = await this.$store.dispatch('teams/update', {
          ...payload,
          name: this.teamName
        });
        if (!response.ok) error = true;
      }

      if (this.teamAnnouncements !== this.team.announcements) {
        const response = await this.$store.dispatch('teams/set', {
          ...payload,
          announcements: this.teamAnnouncements
        });
        if (!response.ok) error = true;
      }

      this.$delete(this.loading, 'settings');

      if (!error) {
        this.hasUnsavedChanges = false;
      }
    },
    async onSwitchInput(key) {
      this.$set(this.loading, key, true);

      await this.$store.dispatch('teams/update', {
        id: this.team.id,
        [key]: !this.team[key]
      });
      this.$delete(this.loading, key);
    },
    async onChangeColor() {
      this.$set(this.loading, 'color_tag', true);

      await this.$store.dispatch('teams/set', {
        team_id: this.team.id,
        color_tag: this.color.replace('#', '')
      });

      this.$delete(this.loading, 'color_tag');
    },
    bytesToSize
  },
  computed: {
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
    },
    announcementsLength() {
      return this.teamAnnouncements.length;
    },
    announcementsMaxLength() {
      return 255;
    },
    announcementsOverflow() {
      return this.announcementsLength > this.announcementsMaxLength;
    },
    channelsCount() {
      return (
        (this.team &&
          this.team.all_channels &&
          this.team.all_channels.length) ||
        0
      );
    },
    membersCount() {
      return (this.team && this.team.members_count) || 0;
    },
    fileCount() {
      if (!this.team || !this.team.storage_stats) return 0;
      return (
        this.team.storage_stats.folderCount +
          this.team.storage_stats.fileCount +
          this.team.storage_stats.versionsCount +
          this.team.storage_stats.sidecarCount || 0
      );
    }
  },
  watch: {
    team: {
      immediate: true,
      deep: true,
      handler() {
        this.teamName = this.team.name;
        this.teamAnnouncements = this.team.announcements;
        this.useAnnouncements = !!this.team.announcements;

        this.$nextTick(() => {
          let el = this.$refs['announcements'];
          if (el) {
            var offset = el.offsetHeight - el.clientHeight;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + offset + 'px';
          }
        });

        if (this.team.tag_color) {
          this.color = `#${this.team.tag_color}`;
          const _color = this.colors.find(color => color === this.color);
          if (!_color) this.onAddColor(this.color);
        } else {
          this.useColorTags = false;
        }
      }
    }
  }
};
</script>
