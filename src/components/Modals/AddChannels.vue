<template>
  <div>
    <Modal
      name="add-channels"
      :title="
        $t(`channels.groups.add-channels-to-group`, { groupName: group.name })
      "
      @opened="onOpen"
    >
      <Loader
        :loading="
          $store.state.loading['channel.group.add'] ||
            $store.state.loading['channel.list']
        "
        full
      />

      <form novalidate="true" @submit.prevent.stop="onSubmit">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>
        <div class="row add-channels-wrapper">
          <div class="col-md-6  filter-channel">
            <Icon name="search" class="icon-filter-search" />
            <input
              ref="input"
              v-model="filterChannel"
              class="form-control form-control-sm filter-channels-form"
              type="text"
              :placeholder="$t('channels.switcher-filter')"
            />
            <button
              v-if="filterChannel !== ''"
              type="button"
              class="btn btn-icon btn-sm cancel-search"
              @click="filterChannel = ''"
            >
              <Icon family="far" name="times" class="icon-close" />
            </button>
            <div
              v-if="filterChannel.trim() && filteredChannels.length === 0"
              class="empty-wrapper"
            >
              <div class="empty-box">
                <Icon family="fal" name="filter" />
                <h4>{{ $t('channels.switcher-no-channels') }}</h4>
                <p>{{ $t('general.try-another-keyword') }}</p>
              </div>
            </div>
            <perfect-scrollbar v-else>
              <Drag
                v-for="channel in filterChannel.trim()
                  ? filteredChannels
                  : channels"
                :key="channel.id"
                :transfer-data="channel"
                :set="
                  (counterpart = channel.one_one
                    ? getCounterpart(channel)
                    : null)
                "
                :class="[{ 'muted-channel': isChannelAdded(channel.id) }]"
                class=""
              >
                <div
                  class="item-channel d-flex align-items-center"
                  @click="addedChannels.push(channel)"
                >
                  <Avatar
                    v-if="channel && channel.one_one && counterpart"
                    :name="counterpart.display_name"
                    :active="counterpart.online_status"
                    :user-id="counterpart.id"
                    :has-avatar="counterpart.has_avatar"
                    :cache="counterpart.updated_on_ts"
                    size="small"
                    light
                  />
                  <Avatar
                    v-else-if="channel"
                    :name="channel.channel_name"
                    type="logo"
                    :channel-id="channel.id"
                    :has-avatar="channel.has_logo"
                    :cache="channel.updated_on_ts"
                    size="small"
                    light
                  />
                  <div class="list-group-item-content ml-2 text-truncate">
                    {{
                      !channel.one_one
                        ? channel.channel_name
                        : counterpart
                        ? counterpart.display_name
                        : $t('channels.direct-conversation')
                    }}
                  </div>
                </div>
              </Drag>
            </perfect-scrollbar>
          </div>
          <Drop
            class="col-md-6  channels-in-group"
            @drop="handleDrop"
            :class="{ dropActive }"
            @dragover="dropActive = true"
            @dragleave="dropActive = false"
          >
            <div class="droppable-area">
              <h5>{{ $t('channels.groups.channels-in-the-group') }}</h5>
              <div v-if="!addedChannels.length" class="empty-channels">
                <Icon name="plus-circle" />
                <p>{{ $t('channels.groups.empty') }}</p>
                <p>{{ $t('channels.groups.empty-description') }}</p>
              </div>
              <perfect-scrollbar v-else>
                <div
                  v-for="channel in addedChannels"
                  :key="channel.id"
                  class="item-channel d-flex align-items-center"
                  :set="
                    (counterpart = channel.one_one
                      ? getCounterpart(channel)
                      : null)
                  "
                >
                  <Avatar
                    v-if="channel && channel.one_one && counterpart"
                    :name="counterpart.display_name"
                    :active="counterpart.online_status"
                    :user-id="counterpart.id"
                    :has-avatar="counterpart.has_avatar"
                    :cache="counterpart.updated_on_ts"
                    size="small"
                    light
                  />
                  <Avatar
                    v-else-if="channel"
                    :name="channel.channel_name"
                    type="logo"
                    :channel-id="channel.id"
                    :has-avatar="channel.has_logo"
                    :cache="channel.updated_on_ts"
                    size="small"
                    light
                  />
                  <div class="list-group-item-content ml-2 text-truncate">
                    {{
                      !channel.one_one
                        ? channel.channel_name
                        : counterpart
                        ? counterpart.display_name
                        : $t('channels.direct-conversation')
                    }}
                  </div>
                  <div
                    class="remove-from-channel"
                    @click="removeFromChannel(channel)"
                  >
                    <Icon name="times" family="fal" />
                  </div>
                </div>
              </perfect-scrollbar>
            </div>
          </Drop>
          <div class="transfer-indicator">
            <Icon name="exchange-alt" family="fad" />
          </div>
        </div>

        <div class="form-group text-center mt-5">
          <button
            class="btn btn-primary btn-rounded mx-2"
            :class="{ disabled: !this.addedChannels.length }"
          >
            {{ $t('channels.groups.add-channels') }}
          </button>

          <button
            class="btn btn-primary btn-ghost mx-2"
            type="button"
            @click="$modal.hide('add-channels')"
          >
            {{ $t('general.cancel') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import AddMembers from '../AddMemberAsEmail.vue';
import { Drag, Drop } from 'vue-drag-drop';
import Avatar from 'airsend/components/Avatar.vue';

export default {
  components: {
    Avatar,
    Modal,
    Icon,
    Loader,
    AddMembers,
    Drag,
    Drop
  },
  data() {
    return {
      errors: {},
      channelsOfThisGroup: [],
      userChannels: '',
      isAdvanced: false,
      filterChannel: '',
      addedChannels: [],
      dropActive: false,
      form: {
        channel_name: '',
        emails: [],
        copy_from_channel_id: '',
        is_public: false
      }
    };
  },

  props: {
    group: {
      type: Object
    },
    channels: {
      type: Array
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.core.user;
    },
    siblings() {
      return this.$store.getters['channels/getSiblingMembers'];
    },
    actualChannels() {
      return this.$store.getters['channels/getActualChannels'];
    },
    filteredChannels() {
      let channels = this.channels;
      let filter = this.filterChannel.trim().toLowerCase();
      return channels.filter(channel => {
        let name = channel.channel_name.toLowerCase();
        if (name.includes(filter)) return true;
      });
    }
  },
  methods: {
    getCounterpart(channel) {
      return _.find(channel.members, member => {
        return member.id !== this.currentUser.id;
      });
    },
    onSubmit: async function() {
      // reset errors
      this.errors = {};

      let channels = this.addedChannels.map(channel => channel.id);
      const response = await this.$store.dispatch(
        'channels/addChannelsToGroup',
        { channel_group_id: this.group.id, channels }
      );

      if (response) {
        this.$modal.hide('add-channels');
      } else {
        this.errors = this.$t('channels.groups.failed-to-add-channels');
      }
    },
    onOpen() {
      this.$refs.input.focus();
      this.addedChannels = [];
      if (this.channels.length) {
        this.addedChannels = this.channels.filter(
          channel => channel.channel_group_id == this.group.id
        );
        this.channelsOfThisGroup = [...this.addedChannels];
      }
    },
    handleDrop(data) {
      this.dropActive = false;
      this.addedChannels.push(data);
    },
    isChannelAdded(id) {
      let selectedChannels = this.addedChannels.find(
        channel => id == channel.id
      );
      return selectedChannels ? true : false;
    },
    removeFromGroup(channel) {
      this.$store.dispatch('channels/removeFromGroup', {
        channel_group_id: channel.channel_group_id,
        channel_id: channel.id
      });
    },
    removeFromChannel(selectedChannel) {
      // remove from back end
      let isAlreadyAdded = this.channelsOfThisGroup.filter(
        channel => selectedChannel.id == channel.id
      );
      if (isAlreadyAdded.length) {
        this.removeFromGroup(selectedChannel);
      }
      // remove from temp list
      let addedChannels = this.addedChannels.filter(
        channel => selectedChannel.id != channel.id
      );
      this.addedChannels = addedChannels;
    }
  }
};
</script>
