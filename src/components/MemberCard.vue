<template>
  <div>
    <Popover
      :delay="{ show: 0, hide: 250 }"
      trigger="hover"
      container=".chat-fragment-scroller-wrapper"
      popoverBaseClass="tooltip popover-member-card"
      placement="right"
    >
      <Avatar
        :name="author.display_name"
        :user-id="author.id"
        :has-avatar="author.has_avatar"
        :cache="author.updated_on_ts"
        size="medium"
        :active="author.online_status"
        v-if="!message.is_extension"
        :isGuest="isGuest"
      />
      <template slot="popover">
        <Loader :loading="loading" full />

        <div class="member-card-avatar">
          <Avatar
            :name="author.display_name"
            :user-id="author.id"
            :has-avatar="author.has_avatar"
            :cache="author.updated_on_ts"
            size="full"
            :active="author.online_status"
            preview
            :isGuest="isGuest"
          />
          <MemberBadge :member="author" :channel="channel" />
        </div>
        <div class="member-card-description">
          <h5>{{ author.display_name }}</h5>
          <span v-if="author.email">{{ author.email }}</span>
          <div
            class="last-seen"
            v-if="author.last_active_on && !author.online_status"
          >
            {{
              $t('channels.last-seen', {
                time: parseTime(author.last_active_on).fromNow()
              })
            }}
          </div>
          <div class="last-seen" v-else-if="author.online_status">
            {{ $t('channels.members-online-now') }}
          </div>
          <button
            @click="createOneToOne"
            class="btn btn-link btn-sm mt-2"
            v-if="author.id !== user.id && !IS_READONLY"
          >
            <Icon name="paper-plane" family="fas" />
            {{ $t('channels.direct-message') }}
          </button>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script>
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import MemberBadge from 'airsend/components/MemberBadge.vue';
import { parseTime } from 'airsend/utils';
import _ from 'lodash';

export default {
  props: ['author', 'message', 'channel', 'team_id'],
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    loading() {
      return this.$store.state.loading['channel.one-on-one'];
    },
    IS_READONLY() {
      return (
        (this.channel &&
          this.$router.history.current.query.hash !== undefined) ||
        this.user.read_only === true
      );
    },
    isGuest() {
      const teamMembers =
        this.$store.getters['teams/getMembers'][this.team_id] || [];
      if (teamMembers.length === 0) return false;
      return !teamMembers[this.author.id];
    }
  },
  methods: {
    parseTime: parseTime,
    async createOneToOne() {
      const response = await this.$store.dispatch(
        'channels/createOneOnOne',
        this.author.id
      );
    }
  },
  components: {
    Avatar,
    Popover,
    Icon,
    MemberBadge,
    Loader
  }
};
</script>
