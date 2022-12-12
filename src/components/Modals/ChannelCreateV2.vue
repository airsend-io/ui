<template>
   <portal to="modal-wrapper" :order="2">
    <Modal
      name="channel-create"
      :title="$t('general.create-new-channel')"
      @before-open="beforeOpen"
      @opened="onOpen"
    >

      <Loader :loading="$store.state.loading['channel.create']" full />

      <form novalidate="true" @submit.prevent.stop="onSubmit">

        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <p class="text-sm text--light">{{$t('channels.channels-explanation')}}</p>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['channel_name'] }"
        >
          <label for="channel_name" class="mb-2">{{
            $t('channels.forms.channel-name')
          }}</label>
          <input
            id="channel_name"
            ref="channel_name"
            v-model="form.channel_name"
            type="channel_name"
            class="form-control"
            placeholder
            autofocus
          />
          <small v-if="errors['channel_name']" class="form-text text-danger">{{
            $t(errors['channel_name'].message, errors['channel_name'].meta)
          }}</small>
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['team_id'] }"
          v-if="useTeams && userTeams && userTeams.length > 0"
        >
          <label for="team_id" class="mb-2 optional"
            >{{ $t('channels.forms.channel-team') }}
            <span class="optional">{{ $t('general.optional') }}</span></label
          >
          <select
            id="team_id"
            ref="team_id"
            v-model="form.team_id"
            type="team_id"
            class="form-control"
            :class="{
              'form-control--placeholder': form.team_id === ''
            }"
          >
            <option value="" selected>{{
              $t('channels.forms.optionally-select-a-team')
            }}</option>
            <option
              v-for="team in userTeams"
              :value="team.id"
              >{{ team.name }}</option>
          </select>
          <small v-if="errors['team_id']" class="form-text text-danger">{{
            $t(errors['team_id'].message, errors['team_id'].meta)
          }}</small>
        </div>

        <div
          class="form-group"
        >
          <button
            type="button"
            class="btn btn-link btn-collapsible"
            :class="{active: isAdvanced}"
            @click="isAdvanced = !isAdvanced"
          >
            <Icon family="fas" name="caret-right" /> {{ $t('general.advanced') }}
          </button>
        </div>

        <div class="form-group" :class="{ [`is-invalid`]: errors['blurb'] }" v-if="isAdvanced">
          <label for="blurb" class="mb-2 optional"
            >{{ $t('channels.forms.channel-description') }}
            <span class="optional">{{ $t('general.optional') }}</span></label
          >
          <textarea
            id="blurb"
            ref="blurb"
            v-model="form.blurb"
            type="blurb"
            class="form-control"
            placeholder
            autofocus
          >
          </textarea>
          <small v-if="errors['blurb']" class="form-text text-danger">{{
            $t(errors['blurb'].message, errors['blurb'].meta)
          }}</small>
        </div>

        <div
          class="form-group"
          :class="{ [`is-invalid`]: errors['copy_from_channel_id'] }"
          v-if="isAdvanced"
        >
          <label for="copy_from_channel_id" class="mb-2 optional"
            >{{ $t('channels.forms.copy-from-channel') }}
            <Icon
              v-tooltip="{
                content: $t('channels.forms.copy-from-channel-hint')
              }"
              family="fas"
              name="info-circle"
              class="text-airsend ml-1"
            />
            <span class="optional">{{ $t('general.optional') }}</span></label
          >
          <select
            id="copy_from_channel_id"
            ref="copy_from_channel_id"
            v-model="form.copy_from_channel_id"
            type="copy_from_channel_id"
            class="form-control"
            :class="{
              'form-control--placeholder': form.copy_from_channel_id === ''
            }"
            placeholder="Select a template"
            autofocus
          >
            <option value="" selected>{{
              $t('channels.forms.optionally-select-a-template')
            }}</option>
            <option
              v-for="channel in actualChannels"
              v-if="currentUser.id === channel.created_by"
              :value="channel.id"
              >{{ channel.channel_name }}</option
            >
          </select>
          <small v-if="errors['copy_channel_from_id']" class="form-text text-danger">{{
            $t(errors['copy_channel_from_id'].message, errors['copy_channel_from_id'].meta)
          }}</small>
        </div>

        <hr class="my-4" />

        <div class="form-group text-center">

          <button
            class="btn btn-primary btn-rounded mx-2"
            :class="{ disabled: this.form.channel_name === '' }"
          >
            {{ $t('channels.forms.create-channel') }}
          </button>

          <button class="btn btn-primary btn-ghost mx-2" type="button" @click="$modal.hide('channel-create')">
            {{ $t('general.cancel') }}
          </button>

        </div>

      </form>

    </Modal>
   </portal>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import AddMembers from '../AddMemberAsEmail.vue'

export default {
  components: {
    Modal,
    Icon,
    Loader,
    AddMembers
  },
  data() {
    return {
      errors: {},
      userChannels: '',
      isAdvanced: false,
      form: {
        channel_name: '',
        team_id: '',
        emails: [],
        copy_from_channel_id: '',
        is_public: false
      }
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.core.user;
    },
    actualChannels() {
      return this.$store.getters['channels/getActualChannels'];
    },
    userTeams(){
      return this.$store.state.teams.all || [];
    },
    useTeams() {
      return this.$store.state.core.useTeams;
    },
  },
  methods: {
    onSubmit: async function() {
      // reset errors
      this.errors = {};

      // check if user exists in system
      const response = await this.$store.dispatch('channels/create', this.form);

      if (response.ok) {
        // clean form
        Vue.set(this, 'form', {
          channel_name: '',
          emails: []
        });

        this.$modal.hide('team-settings');
        this.$modal.hide('channel-create');
      } else {
        this.errors = response.error;
      }
    },
    beforeOpen(e) {

      this.form = {
        channel_name: '',
        team_id: '',
        emails: [],
        copy_from_channel_id: '',
        ...(e.params ? e.params : {})
      };

    },
    onOpen(e) {
      this.$refs.channel_name.focus()
    },
    onUpdateEmails(emails){
      this.form.emails = emails;
    },
  }
};
</script>
