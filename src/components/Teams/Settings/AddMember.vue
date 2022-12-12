<template>
  <div>
    <Loader :loading="loading" full />
    <button class="mb-3 btn btn-link" @click="$emit('return')">
      <Icon name="caret-left" family="fas" class="h5" />
      {{ $t('teams.settings.add-member-tab-back') }}
    </button>
    <form novalidate="true" @submit.prevent.stop>
      <div v-if="typeof errors === 'string'" class="alert alert-danger">
        {{ errors }}
      </div>
      <AddMembers
        ref="addMember"
        :siblings="siblings"
        @updateEmails="emails => (form.emails = emails)"
        teamContext
      />

      <ChannelSelector
        v-model="form.selectedChannels"
        :channels="channelsAvailable"
      />

      <div class="form-group text-center pt-2">
        <button
          class="btn btn-primary btn-rounded px-4 mx-2"
          @click="onSubmitAddMembers"
          :disabled="!form.emails.length"
        >
          {{ $t('general.add') }}
        </button>
        <button
          class="btn btn-primary btn-ghost mx-2"
          type="button"
          @click="$emit('return')"
        >
          {{ $t('general.cancel') }}
        </button>
      </div>
    </form>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Loader from 'airsend/components/Loader.vue';
import AddMembers from 'airsend/components/AddMemberAsEmail.vue';
import ChannelSelector from 'airsend/components/ChannelMultiSelector.vue';
import { parseTime } from 'airsend/utils';

import MemberBadge from 'airsend/components/MemberBadge.vue';

export default {
  components: {
    Modal,
    Icon,
    Avatar,
    Loader,
    MemberBadge,
    AddMembers,
    ChannelSelector
  },
  props: {
    team: {
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
        emails: [],
        selectedChannels: []
      }
    };
  },
  computed: {
    siblings() {
      let siblings = this.$store.getters['channels/getSiblingMembers'];
      return siblings.filter(s => !_.find(this.members, { id: s.value })); //remove members from team
    },
    channelsAvailable() {
      return this.team.all_channels || [];
    },
    members() {
      return this.team.members;
    },
    allowLinksCreation() {
      return false;
    },
    loading() {
      return this.$store.state.loading['teams/addMembers'];
    }
  },
  methods: {
    onKeyDownLinkInput(e) {
      e.preventDefault();
    },

    onFocusLinkInput(e) {
      e.target.select();
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
        this.errors = this.$t('teams.forms.add-people-to-the-team-empty');
        return;
      }

      // check if user exists in system
      const response = await this.$store.dispatch('teams/addMembers', {
        ...this.form,
        channels: this.form.selectedChannels,
        team_id: this.team.id
      });

      if (response.ok) {
        // clean form
        Vue.set(this, 'form', {
          emails: []
        });

        this.$emit('return');

        this.$modal.hide('channel-add-members');
      } else {
        this.errors = response.error;
      }
    },
    parseTime: parseTime
  }
};
</script>
