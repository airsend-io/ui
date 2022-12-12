<template>
  <Modal
    name="incoming-meeting-invite"
    className="modal-meeting"
    :title="$t('meeting.invite.title')"
    @closed="onClose"
  >
    <Loader :loading="this.$store.state.loading['channel.join']" full />

    <form novalidate="true" @submit="onSubmit" v-if="channel && invitedBy">
      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="modal-meeting-info text-center">
        <Avatar
          :name="channel.counterpart.display_name"
          :user-id="channel.counterpart.id"
          :cache="channel.counterpart.img_cache"
          :has-avatar="channel.counterpart.has_avatar"
          size="full"
          :active="channel.counterpart.online_status"
          v-if="channel.counterpart"
        />
        <Avatar
          :name="channel.channel_name"
          :channel-id="channel.id"
          type="logo"
          :cache="0"
          :has-avatar="channel.has_logo"
          size="full"
          v-else
        />

        <h1>{{ callHeading }}</h1>
        <p v-if="!channel.counterpart" v-html="callBody"></p>
      </div>

      <hr class="my-4" />

      <div class="d-block text-center">
        <button
          type="button"
          class="btn btn-icon"
          @click="() => this.$modal.hide('incoming-meeting-invite')"
          v-tooltip="{
            content: $t('meeting.invite.dismiss')
          }"
        >
          <Icon name="times" />
        </button>

        <button
          v-if="user.id"
          type="submit"
          class="btn btn-icon btn-primary btn-ripple mx-2"
          v-tooltip="{
            content: $t('meeting.invite.join')
          }"
        >
          <Icon name="phone" />
        </button>
      </div>
    </form>
  </Modal>
</template>
<script>
import _ from 'lodash';
import moment from 'moment';
import Vue from 'vue';
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import AutoComplete from 'airsend/components/AutoComplete.vue';
import { parseMessageContent } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus';
import { Howl } from 'howler';
import store from 'store';

export default {
  components: {
    Modal,
    Avatar,
    Icon,
    Loader,
    AutoComplete
  },
  props: {},
  data() {
    return {
      errors: {},
      ringtone: null,
      timeout: null,
      users: []
    };
  },
  mounted() {
    /*
      if(window.isElectron) {
        ipcRenderer.on('call-accepted', this.onSubmit);
        ipcRenderer.on('call-ignored', () => {
          this.$modal.hide('incoming-meeting-invite')
        });
      }
    */
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    channel() {
      if (!this.invite) return null;
      return this.$store.getters['channels/getChannelById'](
        this.invite.channel_id
      );
    },
    invitedBy() {
      if (!this.channel) return null;
      return _.find(this.channel.members, { id: this.invite.from_user_id });
    },
    invite() {
      return this.$store.state.meeting.invite;
    },
    logoUrl() {
      if (this.channel) {
        const { hash } = this.$router.history.current.query;
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/channel.image.get?channel_id=${
          this.channel.id
        }&channel_asset_type=logo&token=${
          hash ? hash : store.get('jwt')
        }&cache=${this.channel.updated_on_ts}`;
      }
      return '';
    },
    callHeading() {
      return this.channel.counterpart
        ? this.channel.counterpart.display_name
        : this.channel.channel_name;
    },
    callBody() {
      return this.$t('meeting.invite.description', {
        userName: this.invitedBy.display_name,
        channelName: this.channel.channel_name
      });
    },
    imageAvatar() {
      const hash = store.get('jwt');
      if (this.channel.one_one) {
        if (!this.channel.counterpart.has_avatar) return null;
        return `${process.env.VUE_APP_ROOT_API}/v1/user.image.get?user_id=${this.channel.counterpart.id}&image_class=medium&token=${hash}&v=0`;
      } else {
        if (!this.channel.has_logo) return null;
        return `${process.env.VUE_APP_ROOT_API}/v1/channel.logo.get?channel_id=${this.channel.id}&channel_asset_type=medium&token=${hash}&v=0`;
      }
      return null;
    }
  },
  watch: {
    invite(newVal, oldVal) {
      if (
        newVal &&
        (!oldVal || !newVal || newVal.call_hash !== oldVal.call_hash)
      ) {
        this.open();
        if (window.isElectron) {
          ipcRenderer.send('focus');
        }
        /*
        if(window.isElectron) ipcRenderer.send('call-started', {
          channelName: this.channel.channel_name,
          imageAvatar: this.imageAvatar,
          heading: this.callHeading,
          body: this.callBody,
          isOneOne: this.channel.one_one
        });
        */
      } else {
        this.$modal.hide('incoming-meeting-invite');
        //if(window.isElectron) ipcRenderer.send('call-ignored');
      }
    }
  },
  methods: {
    open() {
      clearTimeout(this.timeout);

      if (!this.ringtone) {
        this.ringtone = new Howl({
          src: ['/ringtone.wav'],
          loop: true
        });
      } else {
        this.ringtone.stop();
      }

      this.ringtone.play();

      this.timeout = setTimeout(() => {
        this.$modal.hide('incoming-meeting-invite');
      }, 15000);

      this.$modal.show('incoming-meeting-invite');
    },

    onClose() {
      clearTimeout(this.timeout);

      this.ringtone.stop();

      this.$store.dispatch('meeting/acceptInvite', {
        call_hash: this.invite.call_hash,
        user_id: this.user.id,
        accept: 0
      });
    },
    async onSubmit(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }

      this.$router.push(`/channel/${this.channel.id}`);

      this.$modal.hide('incoming-meeting-invite');

      // reset data errors
      this.errors = {};

      this.$store.dispatch('meeting/join', {
        room: this.invite.call_hash,
        channelId: this.channel.id
      });
    }
  }
};
</script>
