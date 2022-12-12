<template>
  <div>
    <div class="form-group" :class="{ [`is-invalid`]: errors['channels'] }">
      <label for="channels" class="mb-2 optional"
        >{{ $t('teams.forms.add-people-channel-list') }}
        <span class="optional">{{ $t('general.optional') }}</span>
      </label>

      <AutoComplete
        ref="input"
        :data="channels"
        :placeholder="$t('teams.forms.add-people-channel-list-placeholder')"
        :keys="['channel_email', 'channel_name']"
        @select="onSelect"
      >
        <template slot-scope="{ item }">
          <a
            ><Avatar
              v-if="item && item.one_one && item.counterpart"
              :name="item.counterpart.display_name"
              :active="item.counterpart.online_status"
              :user-id="item.counterpart.id"
              :has-avatar="item.counterpart.has_avatar"
              :cache="item.counterpart.updated_on_ts"
              size="medium"
              light
            />
            <Avatar
              v-else-if="item"
              :name="item.channel_name"
              type="logo"
              :channel-id="item.id"
              :has-avatar="item.has_logo"
              :cache="item.updated_on_ts"
              size="medium"
              light
            />
            <div class="dropdown-title">
              {{ item.channel_name }}
            </div></a
          >
        </template>
      </AutoComplete>
      <small v-if="errors['channels']" class="form-text text-danger">{{
        errors['channels']
      }}</small>
    </div>

    <div v-if="value.length > 0" class="form-group chip-group mb-0">
      <div v-for="(channel, index) in value" :key="index" class="chip">
        <Avatar
          v-if="channel && channel.one_one && channel.counterpart"
          :name="channel.counterpart.display_name"
          :active="channel.counterpart.online_status"
          :user-id="channel.counterpart.id"
          :has-avatar="channel.counterpart.has_avatar"
          :cache="channel.counterpart.updated_on_ts"
          size="medium"
          light
        />
        <Avatar
          v-else-if="channel"
          :name="channel.channel_name"
          type="logo"
          :channel-id="channel.id"
          :has-avatar="channel.has_logo"
          :cache="channel.updated_on_ts"
          size="medium"
          light
        />
        <p>{{ channel.channel_name }}</p>
        <button
          type="button"
          name="button"
          class="btn btn-icon"
          @click="onRemoveChannel(index)"
        >
          <Icon family="far" name="times" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Avatar from 'airsend/components/Avatar.vue';
import AutoComplete from 'airsend/components/GenericAutoComplete.vue';
import _ from 'lodash';
import Icon from 'airsend/components/Icon.vue';
import Utils from 'airsend/client/utils';

export default {
  components: {
    Avatar,
    AutoComplete,
    Icon
  },
  data() {
    return {
      errors: {}
    };
  },
  props: {
    channels: {
      type: Array,
      default: () => []
    },
    value: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    onSelect(item) {
      const isAdded = _.findIndex(this.value, { id: item.id });

      if (isAdded === -1) {
        this.$emit('input', [...this.value, item]);
      }

      this.errors = false;
    },
    onRemoveChannel(removed) {
      let filtred = this.value.filter(function(value, index) {
        return index !== removed;
      });

      this.$emit('input', filtred);
    },
    focusInput() {
      this.$refs.input.focus();
    }
  }
};
</script>
