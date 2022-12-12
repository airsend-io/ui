<template>
  <div>
    <Modal
      name="channel-add-members"
      title="Add Members"
      @opened="onOpen"
      :class="{ 'no-scroll': true }"
    >
      <Loader :loading="this.$store.state.loading['channel.invite']" full />
      <form novalidate="true" @submit.prevent.stop="onSubmitAddMembers">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>
        <AddMembers
          ref="addMember"
          :siblings="siblings"
          @updateEmails="emails => (form.emails = emails)"
        />
        <hr class="my-4" />
        <button class="btn btn-primary btn-rounded mx-auto d-block">
          {{ $t('channels.forms.add-members') }}
        </button>
      </form>
    </Modal>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Modal from 'airsend/components/Modal.vue';
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
      preEmail: '', // auxiliar input for pre email insertion
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
    parseTime: parseTime
  }
};
</script>
