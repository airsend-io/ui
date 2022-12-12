<template>
  <portal to="modal-wrapper" :order="2">
    <Modal
      name="channel-create"
      :title="$t('general.create-new-channel')"
      @opened="onOpen"
    >
      <Loader :loading="$store.state.loading['channel.create']" full />

      <form novalidate="true" @submit.prevent.stop="onSubmit">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

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

        <div class="form-group" :class="{ [`is-invalid`]: errors['blurb'] }">
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
            errors['blurb']
          }}</small>
        </div>

        <AddMembers :siblings="siblings" @updateEmails="onUpdateEmails" />

        <div class="p-3 mb-2 boxed boxed--light">
          <div class="custom-control custom-switch">
            <input
              id="is_public"
              v-model="form.is_public"
              type="checkbox"
              class="custom-control-input"
            />
            <label class="custom-control-label" for="is_public"
              >{{ $t('channels.forms.make-channel-public') }}
              <Icon
                v-tooltip="{
                  content: $t('channels.forms.make-channel-public-hint')
                }"
                family="fas"
                name="info-circle"
                class="text-airsend ml-1"
            /></label>
          </div>
        </div>

        <hr class="mt-4 mb-3" />

        <div
          class="form-group mt-0"
          :class="{ [`is-invalid`]: errors['copy_from_channel_id'] }"
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
          <small
            v-if="errors['copy_from_channel_id']"
            class="form-text text-danger"
            >{{ errors['copy_from_channel_id'] }}</small
          >
        </div>

        <hr class="my-4" />

        <button
          class="btn btn-primary btn-rounded mx-auto d-block"
          :class="{ disabled: this.form.channel_name === '' }"
        >
          {{ $t('channels.forms.create-channel') }}
        </button>
      </form>
    </Modal>
  </portal>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import AddMembers from '../AddMemberAsEmail.vue';

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
      form: {
        channel_name: '',
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
    siblings() {
      return this.$store.getters['channels/getSiblingMembers'];
    },
    actualChannels() {
      return this.$store.getters['channels/getActualChannels'];
    }
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

        this.$modal.hide('channel-create');
      } else {
        this.errors = response.error;
      }
    },
    onOpen(e = {}) {
      this.form = {
        channel_name: '',
        emails: [],
        copy_from_channel_id: ''
        // ...e.params
      };

      this.$refs.channel_name.focus();
    },
    onUpdateEmails(emails) {
      this.form.emails = emails;
    }
  }
};
</script>
