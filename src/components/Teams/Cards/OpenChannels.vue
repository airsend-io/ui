<template>
  <div class="card card-float open-channels">
    <Loader full :loading="loading" />
    <div class="card-header">
      <h4>
        {{ $t('teams.settings.tab-open-channels') }}
      </h4>
      <ul class="card-nav" @click.stop.prevent>
        <span
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: '' //$t('')
          }"
          class="channel-status-icon expand-icon"
          @click="onExpand"
          ><Icon family="far" name="expand"
        /></span>
      </ul>
    </div>

    <div class="card-body">
      <a class="card-overflow" v-if="isOverflowing" @click="onExpand">{{
        $tc(
          'teams.settings.team-open-channels-more-channels',
          moreChannelsCount
        )
      }}</a>
      <ul class="details-list" v-if="splitedChannels.length">
        <li v-for="(channel, index) in splitedChannels" :key="index">
          <div class="channel-name overflow-hidden">
            <Avatar
              v-if="channel"
              :name="channel.name"
              type="logo"
              :channel-id="channel.id"
              :has-avatar="channel.has_logo"
              size="xs"
              light
            />
            <!-- change this to img later -->
            <!-- <img :src="channel.logo" alt="" /> -->
            <span class="text-truncate">{{ channel.name }}</span>
          </div>

          <div class="channel-settings">
            <span>{{
              $tc('channels.members-counter', channel.members_count)
            }}</span>

            <div class="more-options" @click.prevent.stop>
              <Popover>
                <button class="btn-trigger btn btn-icon btn-sm">
                  <Icon family="far" name="ellipsis-h" />
                </button>

                <template slot="popover">
                  <div class="dropdown-items">
                    <button
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      v-if="!channel.has_joined"
                      @click="onJoinChannel(channel)"
                    >
                      {{ $t('teams.channel-public-options-join') }}
                    </button>
                    <button
                      v-close-popover
                      class="dropdown-item"
                      type="button"
                      v-else
                      @click="onOpenChannel(channel)"
                    >
                      {{ $t('teams.channel-public-options-open') }}
                    </button>
                  </div>
                </template>
              </Popover>
            </div>
          </div>
        </li>
      </ul>
      <div v-else-if="user.teamRole.can('teams.manage')" class="empty-card">
        <span>{{ $t('teams.settings.team-open-channels-empty-title') }}</span>
        <small>{{
          $t('teams.settings.team-open-channels-empty-description')
        }}</small>
        <button class="btn btn-primary" @click="onOpenChannelsTab">
          {{ $t('teams.settings.team-open-channels-empty-action') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Avatar from 'airsend/components/Avatar';
import Popover from 'airsend/components/Popover';
import Loader from 'airsend/components/Loader';

export default {
  props: {
    team: {
      required: true
    }
  },
  computed: {
    splitedChannels() {
      return this.openChannels.slice(0, this.isOverflowing ? 2 : 3);
    },
    loading() {
      return this.$store.state.loading['teams/get'];
    },
    user() {
      return this.$store.getters['core/getUser'](null, this.team.id);
    },
    openChannels() {
      return this.team.open_channels
        ? _.orderBy(this.team.open_channels, 'has_joined', 'asc')
        : [];
    },
    isOverflowing() {
      return this.openChannels && this.openChannels.length > 3;
    },
    moreChannelsCount() {
      return (
        (this.openChannels && this.openChannels.length) -
        (this.isOverflowing ? 2 : 3)
      );
    }
  },
  methods: {
    onExpand() {
      this.$modal.show('team-settings', {
        id: this.team.id,
        tab: 'open-channels'
      });
    },
    onOpenChannelsTab() {
      this.$modal.show('team-settings', { id: this.team.id, tab: 'channels' });
    },
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
    }
  },
  components: {
    Icon,
    Popover,
    Loader,
    Avatar
  }
};
</script>
