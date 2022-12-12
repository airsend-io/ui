<template>
  <div v-if="users && users.length > 0" class="users-chips">
    <Popover>
      <div class="users-icons avatar-list">
        <div
          class="avatar-wrapper"
          v-for="user in users.length === 3
            ? users.slice(0, 3)
            : users.slice(0, 2)"
          :key="`${user.id}-user-chip`"
        >
          <Avatar
            :name="user.display_name"
            :user-id="parseInt(user.id)"
            :has-avatar="user.has_avatar"
            :cache="0"
            size="small"
            :isGuest="isGuest(user.id)"
          />
        </div>
        <div v-if="users.length > 3" class="avatar-wrapper">
          <div class="avatar">+{{ users.length - 2 }}</div>
        </div>
      </div>

      <template slot="popover">
        <perfect-scrollbar class="popover-people">
          <li
            v-for="user in users"
            :key="user.id"
            class="popover-people-single"
          >
            <Avatar
              :name="user.display_name"
              :user-id="parseInt(user.id)"
              :has-avatar="user.has_avatar"
              :cache="0"
              size="medium"
              :isGuest="isGuest(user.id)"
            />
            <div class="popover-people-description">
              {{ user.display_name }}
            </div>
          </li>
        </perfect-scrollbar>
      </template>
    </Popover>
  </div>
</template>

<script>
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
export default {
  components: {
    Avatar,
    Popover
  },
  props: {
    users: {
      type: Array,
      required: true
    },
    team: {
      type: Object,
      required: false
    }
  },

  computed: {
    user() {
      return this.$store.getters['core/getUser']();
    },
    amIAssigned() {
      return _.findIndex(this.users, { id: this.user.id }) > -1;
    },
    teamMembers() {
      return (
        this.$store.getters['teams/getMembers'][this.team && this.team.id] || []
      );
    }
  },
  methods: {
    isGuest(user_id) {
      if (!this.team || !this.team.id) return false;

      if (this.teamMembers.length === 0) return false;
      return !this.teamMembers[user_id];
    }
  }
};
</script>

<style></style>
