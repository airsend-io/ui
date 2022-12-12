<template>
  <div class="add-who-task">
    <Loader :loading="loading" :full="true" />

    <div class="form-group" :class="{ [`is-invalid`]: errors['user_ids'] }">
      <label for="user_ids" class="mb-2 optional add-who-text">{{
        $t('actions.forms.action-add-who')
      }}</label>
      <AutoComplete
        ref="autocomplete"
        :data="members"
        @select="onSelectAssignee"
        @error="onAssigneeError"
        :placeholder="$t('actions.forms.action-user-autocomplete')"
        :disabled="disabled"
        autofocus
      />
      <small v-if="errors['user_ids']" class="form-text text-danger">{{
        errors['user_ids']
      }}</small>
    </div>

    <div class="form-group chip-group">
      <div
        v-for="(user, index) in this.newUsers"
        :key="index"
        class="chip chip-sm"
      >
        <div class="avatar-wrapper">
          <Avatar
            v-if="typeof user !== 'string'"
            :name="user.display_name"
            :user-id="user.id"
            :has-avatar="user.has_avatar"
            :cache="0"
            size="small"
            :active="user.online_status"
          />
        </div>
        <p>{{ user.display_name }}</p>
        <button
          type="button"
          name="button"
          class="btn btn-icon"
          @click="onRemoveUser(index)"
        >
          <Icon family="far" name="times" />
        </button>
      </div>
    </div>
    <button
      class="btn btn-primary btn-rounded mx-auto d-block"
      :disabled="unmodifiedUsers || disabled"
      @click="$emit('save', newUsers)"
    >
      <span>{{ $t('general.save') }}</span>
    </button>
  </div>
</template>

<script>
import AutoComplete from 'airsend/components/AutoComplete.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import _ from 'lodash';
export default {
  props: {
    channel: {
      type: Object,
      required: true
    },
    users: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    this.newUsers = _.cloneDeep(this.users);
  },
  data() {
    return {
      newUsers: [],
      errors: { user_ids: '' }
    };
  },
  methods: {
    onSelectAssignee(id) {
      const user = _.find(this.channel.members, { id });
      const isAdded = _.findIndex(this.newUsers, { id });

      if (isAdded === -1 && user) {
        this.newUsers.push(user);
      }

      this.errors = { user_ids: '' };
    },
    onAssigneeError(err) {
      this.errors = {
        user_ids: err
      };
    },
    onRemoveUser(index) {
      if (this.disabled) return;
      this.$delete(this.newUsers, index);
    }
  },
  computed: {
    members() {
      if (!this.channel || Object.keys(this.channel).length === 0) return [];
      return this.channel.members.map(item => {
        return {
          title: item.display_name,
          description: item.email,
          value: item.id,
          user: item
        };
      });
    },
    loading() {
      return this.$store.state.loading['actions/update'];
    },
    unmodifiedUsers() {
      const users = this.users.map(user => user.id);
      const newUsers = this.newUsers.map(user => user.id);

      return _.isEqual(users, newUsers);
    }
  },
  components: {
    AutoComplete,
    Avatar,
    Icon,
    Loader
  }
};
</script>

<style></style>
