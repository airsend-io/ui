<template>
  <div>
    <Modal name="move-to-group" :title="$t(`channels.groups.move-to-group`)">
      <div v-if="!groups.length" class="p-3">
        {{ $t('channels.groups.no-groups') }}
      </div>
      <div
        class="item-channel d-flex align-items-center"
        v-for="group in groups"
        :key="group.id"
        @click="moveToGroup(group.id)"
      >
        <div class="list-group-item-content ml-2 text-truncate">
          {{ group.name }}
        </div>
      </div>
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
    return {};
  },

  props: {
    channel: {
      type: Object
    }
  },
  computed: {
    groups() {
      let groups = this.$store.state.channels.groups;
      return groups.filter(group => !['all', 'dm', 'favs'].includes(group.id));
    }
  },
  methods: {
    moveToGroup(id) {
      this.$store.dispatch('channels/addToGroup', {
        channel_group_id: id,
        channel_id: this.channel.id
      });
      this.$modal.hide('move-to-group');
    }
  }
};
</script>
