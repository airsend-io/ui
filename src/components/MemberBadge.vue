<template>
  <div class="members-list-item-role" v-if="badge">
    <div class="member-badge badge">
      {{ $t(`channels.members-badge-${badge.title}`) }}
    </div>
  </div>
</template>
<script>
import { ChannelRoles } from 'airsend/constants';

export default {
  name: 'MemberBadge',
  props: {
    member: Object,
    channel: Object
  },
  computed: {
    badge() {
      return ChannelRoles[this.member.user_role];
    }
  }
};
</script>
