<template>
  <Modal
    name="attach-team-to-channel"
    :title="$t('teams.channel-settings-attach-channel')"
    @before-open="onOpen"
  >
    <Loader :loading="this.$store.state.loading['channels/transfer']" full />
    <div class="attach-team-to-channel">
      <span v-if="this.error" class="alert alert-danger d-block mb-3">{{
        this.error
      }}</span>

      <span v-html="$t('teams.settings.channel-attach-team-warning')" />

      <ul class="my-3">
        <li
          v-if="!isDetach"
          v-html="
            $t('teams.settings.channel-attach-team-single-team-information')
          "
        />
        <li
          v-if="!isDetach"
          v-html="
            $t('teams.settings.channel-attach-team-team-information', {
              team_name: team.name
            })
          "
        />
        <li
          v-if="!isDetach"
          v-html="
            $t('teams.settings.channel-attach-team-take-ownership-information')
          "
        />
        <li
          v-if="isDetach"
          v-html="$t('teams.settings.channel-attach-team-detach-information')"
        />
      </ul>

      <span
        class="my-3"
        v-html="
          $t('teams.settings.channel-attach-team--confirmation-message', {
            team_name: isDetach
              ? $t('teams.settings.detach')
              : team && team.name
          })
        "
      />

      <input
        type="text"
        class="form-control my-3"
        v-model="teamNameInput"
        :placeholder="team && team.name"
      />

      <button
        class="btn btn-primary"
        :disabled="
          isDetach
            ? teamNameInput !== $t('teams.settings.detach')
            : teamNameInput !== (team && team.name)
        "
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
  components: {
    Modal,
    Loader,
    Icon
  },
  data() {
    return {
      team: {},
      channel: {},
      teamNameInput: '',
      error: ''
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    },
    isDetach() {
      return !this.team;
    }
  },
  methods: {
    onOpen(e) {
      const { params } = e;
      const { team, channel } = params;
      this.team = team;
      this.channel = channel;
      this.teamNameInput = '';
      this.error = '';
    },

    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      this.error = '';

      const response = await this.$store.dispatch('channels/transfer', {
        channel_id: this.channel.id,
        new_owner_id: this.user.id,
        ...(this.team && { team_id: this.team.id })
      });

      if (response.ok) {
        this.$modal.hide('attach-team-to-channel');
        this.$modal.hide('channel-settings');
      } else {
        this.error = response.meta.error;
      }
    }
  }
};
</script>
