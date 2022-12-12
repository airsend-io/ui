<template>
  <div class="team-channels channel-list">
    <li
      v-for="channel in openChannels"
      :key="channel.id"
      class="channel-list-item"
    >
      <Avatar
        v-if="channel"
        :name="channel.name"
        type="logo"
        :channel-id="channel.id"
        :has-avatar="channel.has_logo"
        size="small"
        light
      />

      <!-- Name and Email -->
      <div class="display-name">
        <h4>
          <span
            class="channel-name"
            v-tooltip="{
              delay: 1000,
              content: channel.name
            }"
            >{{ channel.name }}</span
          >
        </h4>
      </div>

      <!-- users -->
      <div class="channel-list-item-users-count px-3">
        <span>{{
          $tc('channels.members-counter', channel.members_count)
        }}</span>
      </div>

      <!-- channel actions -->
      <button
        class="btn btn-outline-primary pl-3"
        v-if="channel.has_joined"
        @click="onOpenChannel(channel)"
      >
        {{ $t('teams.channel-public-options-open') }}
      </button>
      <button
        class="btn btn-outline-primary"
        v-else
        @click="onJoinChannel(channel)"
      >
        {{ $t('teams.channel-public-options-join') }}
      </button>
    </li>

    <div
      class="empty-wrapper"
      v-if="user.teamRole.can('teams.manage') && !openChannels.length"
    >
      <div class="empty-box empty-box--meeting empty-box--boxed">
        <Icon family="fal" name="exclamation-triangle" class="mb-4" />
        <h4 class="text-center">
          {{ $t('teams.settings.team-open-channels-empty-title') }}
        </h4>
        <p class="text-center">
          {{ $t('teams.settings.team-open-channels-empty-description') }}
        </p>
        <button
          class="btn btn-outline-primary mx-auto"
          @click="onOpenChannelsTab"
        >
          {{ $t('teams.settings.team-open-channels-empty-action') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';

import _ from 'lodash';

export default {
  components: {
    Avatar,
    Icon
  },
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id) || {};
    },
    openChannels() {
      return this.team.open_channels
        ? _.orderBy(this.team.open_channels, 'has_joined', 'asc')
        : [];
    }
  },
  methods: {
    async onJoinChannel(channel) {
      const response = await this.$store.dispatch(
        'channels/joinOpenTeamChannel',
        {
          channel_id: channel.id
        }
      );

      if (response.ok) {
        this.onOpenChannel(channel);
      }
    },
    onOpenChannel(channel) {
      this.$router.push({ name: 'channel', params: { id: channel.id } });
      this.$modal.hide('team-settings');
    },
    onOpenChannelsTab() {
      this.$emit('openTab', 'channels');
    }
  }
};
</script>

<style></style>
