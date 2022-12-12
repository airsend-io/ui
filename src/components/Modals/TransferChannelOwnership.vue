<template>
  <Modal
    name="transfer-channel-ownership"
    :title="$t('channels.settings.channel-transfer-ownership')"
    @before-open="onOpen"
  >
    <Loader :loading="this.$store.state.loading['channels/transfer']" full />
    <div class="transfer-channel-ownership">
      <span v-if="this.error" class="alert alert-danger d-block mb-3">{{
        this.error
      }}</span>

      <span
        v-html="
          $t('channels.settings.channel-transfer-ownership-warning', {
            channel_name: channel && channel.channel_name,
            new_owner: new_owner && new_owner.display_name
          })
        "
      />
      <ul class="my-3">
        <li
          v-html="
            $t(
              'channels.settings.channel-transfer-ownership-single-owner-information'
            )
          "
        />
        <li
          v-html="
            $t(
              'channels.settings.channel-transfer-ownership-owner-information',
              { new_owner: new_owner && new_owner.display_name }
            )
          "
        />

        <li
          v-if="team && isNewOwnerPartOfTeam"
          v-html="
            $t(
              'channels.settings.channel-transfer-ownership-team-information',
              {
                channel_name: channel && channel.channel_name,
                team_name: team.name
              }
            )
          "
        />
        <li
          v-if="team && !isNewOwnerPartOfTeam"
          v-html="
            $t(
              'channels.settings.channel-transfer-ownership-owner-out-of-team-information',
              {
                new_owner: new_owner && new_owner.display_name,
                team_name: team.name
              }
            )
          "
        />
      </ul>

      <span
        class="my-3"
        v-html="
          $t(
            'channels.settings.channel-transfer-ownership-confirmation-message',
            {
              channel_name: channel && channel.channel_name,
              new_owner: new_owner && new_owner.display_name
            }
          )
        "
      />

      <input
        type="text"
        class="form-control my-3"
        v-model="ownerNameInput"
        :placeholder="new_owner && new_owner.display_name"
      />

      <button
        class="btn btn-primary"
        :disabled="ownerNameInput !== (new_owner && new_owner.display_name)"
        @click="onSubmit"
      >
        Save
      </button>
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

import Icon from 'airsend/components/Icon.vue';

export default {
  name: 'transfer-channel-ownership',
  components: {
    Modal,
    Loader,
    Icon
  },
  data() {
    return {
      channel: {},
      new_owner: {},
      ownerNameInput: '',
      error: '',
      team_transfer: false
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    },
    team() {
      const teams = this.$store.state.teams.all;
      const teamIndex = _.findIndex(teams, { id: this.channel.team_id });
      if (teamIndex === -1) return null;
      return this.$store.state.teams.all[teamIndex];
    },
    teamMembers() {
      return this.$store.state.teams.members[this.channel.team_id] || [];
    },
    isNewOwnerPartOfTeam() {
      const userIndex = _.findIndex(this.teamMembers, {
        id: this.new_owner.id
      });
      return userIndex >= 0;
    }
  },
  methods: {
    onOpen(e) {
      const { params } = e;
      const { new_owner, channel, team_transfer } = params;
      this.new_owner = new_owner;
      this.channel = channel;
      this.ownerNameInput = '';
      this.error = '';

      if (team_transfer) {
        this.team_transfer = team_transfer;
      } else {
        this.team_transfer = false;
      }

      if (
        channel &&
        channel.team_id &&
        !this.$store.state.teams.members[channel.team_id]
      ) {
        this.$store.dispatch('teams/getMembers', { id: channel.team_id });
      }
    },

    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      this.error = '';

      let payload = {
        channel_id: this.channel.id,
        new_owner_id: this.new_owner.id,
        ...(this.channel.team_id && { team_id: this.channel.team_id })
      };
      let response;
      if (this.team_transfer) {
        response = await this.$store.dispatch(
          'teams/transferChannelOwnership',
          payload
        );
      } else {
        response = await this.$store.dispatch('channels/transfer', payload);
      }

      if (response.ok) {
        this.$modal.hide('attach-team-to-channel');
      } else {
        this.error = response.meta.error;
      }
    }
  }
};
</script>
