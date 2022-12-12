<template>
  <div>
    <Modal
      name="channel-add-members"
      :title="$t('channels.invite-title')"
      @opened="onOpen"
    >
      <Loader
        :loading="
          this.$store.state.loading['channel.invite'] ||
            this.$store.state.loading['channel.update']
        "
        full
      />
      <form novalidate="true" @submit.prevent.stop="onSubmitAddMembers">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>
        <AddMembers
          ref="addMember"
          :siblings="siblings"
          @updateEmails="emails => (form.emails = emails)"
        />

        <div class="form-group text-center pt-2">
          <button class="btn btn-primary btn-rounded px-4 mx-2">
            {{ $t('general.add') }}
          </button>
          <button
            class="btn btn-primary btn-ghost mx-2"
            type="button"
            @click="$modal.hide('channel-add-members')"
          >
            {{ $t('general.cancel') }}
          </button>
        </div>

        <div class="text-divider my-2">
          <span>{{ $t('general.or') }}</span>
        </div>

        <div class="form-group form-section">
          <div class="row">
            <div class="col">
              <h4>{{ $t('channels.settings.public-link-title') }}</h4>
              <input
                ref="channelLink"
                class="form-control my-3"
                readonly="readonly"
                @focus="onFocusLinkInput"
                :value="channel.public_url"
                v-if="channel.public_url"
              />
              <p>{{ $t('channels.settings.public-link-description') }}</p>
            </div>
            <div class="col-md-3">
              <button
                class="btn btn-link mx-sm-2 mt-md-3"
                type="button"
                @click="onCopyLink"
                v-if="channel.public_url"
              >
                <Icon name="copy" /> {{ $t('general.link-copy') }}
              </button>
              <button
                class="btn btn-link mx-sm-2"
                type="button"
                @click="onToggleLink"
                v-if="!channel.public_url"
              >
                <Icon name="link" /> {{ $t('general.link-create') }}
              </button>
              <button
                class="btn btn-link mx-sm-2"
                type="button"
                @click="onToggleLink"
                v-else
              >
                <Icon name="trash-alt" /> {{ $t('general.link-delete') }}
              </button>
            </div>
          </div>
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
import Avatar from 'airsend/components/Avatar.vue';
import Loader from 'airsend/components/Loader.vue';
import AddMembers from '../AddMemberAsEmail.vue';
import Utils from 'airsend/client/utils';
import { parseTime } from 'airsend/utils';

import MemberBadge from 'airsend/components/MemberBadge.vue';
// #todo better name for Kitchen

export default {
  components: {
    Modal,
    Icon,
    Avatar,
    Loader,
    MemberBadge,
    AddMembers
  },
  props: {
    channel: {
      type: Object,
      default: () => {
        return {
          members: []
        };
      }
    },
    userId: Number
  },
  data() {
    return {
      errors: {},
      form: {
        emails: []
      }
    };
  },
  computed: {
    siblings() {
      return this.$store.getters['channels/getSiblingMembers'];
    }
  },
  methods: {
    onOpen() {
      this.$refs.addMember.focusInput();
      this.errors = {};
    },

    onCopyLink() {
      if (this.$refs.channelLink) this.$refs.channelLink.focus();
      document.execCommand('copy');
    },

    onKeyDownLinkInput(e) {
      e.preventDefault();
    },

    onFocusLinkInput(e) {
      e.target.select();
    },

    // toggle channel link
    async onToggleLink() {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/update', {
        channel_id: this.channel.id,
        allow_join: !this.channel.public_url ? 1 : 0,
        noToast: true
      });

      if (!response.ok) {
        this.errors = response.error;
      }

      // wait for next tick to focus on input
      this.$nextTick(() => {
        if (this.$refs.channelLink) this.$refs.channelLink.focus();
      });
    },

    openNewMemberModal: function() {
      this.$modal.hide('channel-members');
      this.$modal.show('channel-add-members');
    },
    onSubmitAddMembers: async function(e) {
      // reset errors
      this.errors = {};

      const { addMember } = this.$refs;
      const { emailBox } = addMember.$refs;

      if (emailBox.value !== '' && emailBox.results.length === 0) {
        addMember.onChangeEmails(null, emailBox.value);
        if (addMember.errors['emails']) return;
      } else if (emailBox.value === '') {
        emailBox.clear();
      }

      if (this.form.emails.length === 0) {
        this.errors = this.$t('channels.forms.add-people-to-the-channel-empty');
        return;
      }

      // check if user exists in system
      const response = await this.$store.dispatch('channels/addMembers', {
        ...this.form,
        channel_id: this.channel.id
      });

      if (response.ok) {
        // clean form
        Vue.set(this, 'form', {
          emails: []
        });

        this.$modal.hide('channel-add-members');
      } else {
        this.errors = response.error;
      }
    },

    removeMember: async function(memberId) {
      // #todo : fix the error while removing members
      const payload = {
        channel_id: this.channel.id,
        user_id: memberId
      };
      const response = await this.$store.dispatch(
        'channels/removeMember',
        payload
      );
      if (response.ok) {
        // Throw Success in Pop/Toast
      } else {
        console.error(response.error);
        // Throw error in Pop/Toast
      }
    },
    parseTime: parseTime
  }
};
</script>
