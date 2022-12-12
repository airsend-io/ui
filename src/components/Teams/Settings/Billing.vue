<template>
  <div>
    <Loader full :loading="loading['team_name']" />

    <div class="section billing has-switcher">
      <span class="section-title">Billing</span>
      <div class="section-body">
        <div class="section-content">
          <span class="section-description"
            >This credit card will be used to pay your subscription</span
          >
          <span>**** **** **** 1234</span>
        </div>
        <div class="section-switcher">
          <button class="btn btn-link">Change</button>
        </div>
      </div>
    </div>

    <div class="section privacy">
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
      <button class="btn btn-primary" @click="onSave">Save</button>
    </div>
  </div>
</template>

<script>
import Progress from 'airsend/components/ProgressCircular.vue';
import ColorPalette from 'airsend/components/ColorPalette.vue';
import ToggleSwitch from 'airsend/components/ToggleSwitch.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';

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
      colors: ['#FF6900', '#FCB900', '#7BDCB5', '#00D084'],
      useColorTags: true,
      loading: {},
      team_name: '',
      hasUnsavedChanges: false
    };
  },
  methods: {
    onAddColor(hex8) {
      this.colors.push(hex8);
    },
    async onSave() {
      this.$set(this.loading, 'team_name', true);
      await this.$store.dispatch('teams/update', {
        id: this.team.id,
        team_name: this.team_name
      });
      this.$delete(this.loading, 'team_name');
      this.hasUnsavedChanges = false;
    },
    async onSwitchInput(key) {
      this.$set(this.loading, key, true);

      await this.$store.dispatch('teams/update', {
        id: this.team.id,
        [key]: !this.team[key]
      });
      this.$delete(this.loading, key);
    }
  },
  watch: {
    team: {
      immediate: true,
      handler() {
        console.log(this.team);
        this.team_name = this.team.team_name;
      }
    }
  }
};
</script>
