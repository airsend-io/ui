<template>
  <Modal
    name="join-channel"
    :title="$t('channels.public-channel')"
    @opened="onOpen"
  >
    <Loader :loading="this.$store.state.loading['channel.join']" full />

    <form v-if="channel" novalidate="true" @submit="onSubmit">
      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>

      <div class="public-channel-info">
        <img
          v-if="channel.has_logo"
          style="border-radius:100%;"
          :src="logoUrl"
          :alt="channel.channel_name"
        />
        <h1>{{ channel.channel_name }}</h1>
        <p v-if="channel.blurb">{{ channel.blurb }}</p>
      </div>

      <hr class="my-4" />

      <div class="d-block text-center">
        <button
          type="button"
          class="btn btn-default btn-rounded mx-1"
          @click="() => this.$modal.hide('join-channel')"
        >
          {{ $t('channels.public-explore-contents') }}
        </button>

        <button
          v-if="user.id"
          tyle="submit"
          class="btn btn-primary btn-rounded mx-1"
        >
          {{
            $t(
              channel.require_join_approval
                ? 'channels.public-ask-to-join-channel'
                : 'channels.public-join-channel'
            )
          }}
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary btn-rounded mx-1"
          @click="
            () => {
              this.$modal.hide('join-channel');
              this.$modal.show('auth');
            }
          "
        >
          {{ $t('general.login-or-signup') }}
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
      users: []
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
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
    }
  },
  mounted() {},
  destroyed() {},
  methods: {
    onOpen() {
      // this.$refs.action_name.focus();
    },

    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      const { hash } = this.$router.history.current.query;

      const response = await this.$store.dispatch('channels/join', {
        channel_id: this.channel.id,
        require_approval: this.channel.require_join_approval,
        public_hash: hash
      });

      if (response.ok) {
        this.$modal.hide('join-channel');
      } else {
        this.errors = response.error;
      }
    }
  }
};
</script>
