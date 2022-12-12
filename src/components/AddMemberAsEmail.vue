<template>
  <div>
    <div class="form-group" :class="{ [`is-invalid`]: errors['emails'] }">
      <label for="emails" class="mb-2 optional"
        >{{
          $t(
            teamContext
              ? 'teams.forms.add-people-to-the-team'
              : 'channels.forms.add-people-to-the-channel'
          )
        }}
        <span class="optional" v-if="!teamContext">{{
          $t('general.optional')
        }}</span></label
      >

      <AutoComplete
        ref="emailBox"
        :data="siblings"
        :placeholder="
          $t('channels.forms.add-people-to-the-channel-placeholder')
        "
        @select="onSelectAssignee"
        @noSelectionKeyup="onChangeEmails"
      />
      <small v-if="errors['emails']" class="form-text text-danger">{{
        errors['emails']
      }}</small>
    </div>

    <div v-if="this.emails.length > 0" class="form-group chip-group mb-0">
      <div v-for="(user, index) in this.emails" :key="index" class="chip">
        <Avatar
          v-if="typeof user !== 'string'"
          :name="user.display_name"
          :user-id="user.id"
          :has-avatar="user.has_avatar"
          :cache="0"
          size="medium"
          :active="user.online_status"
        />
        <p>{{ typeof user !== 'string' ? user.display_name : user }}</p>
        <button
          type="button"
          name="button"
          class="btn btn-icon"
          @click="onRemoveEmail(index)"
        >
          <Icon family="far" name="times" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Avatar from 'airsend/components/Avatar.vue';
import AutoComplete from 'airsend/components/AutoComplete.vue';
import _ from 'lodash';
import Icon from 'airsend/components/Icon.vue';
import Utils from 'airsend/client/utils';

export default {
  components: {
    Avatar,
    AutoComplete,
    Icon
  },
  data() {
    return {
      errors: {},
      emails: []
    };
  },
  props: {
    siblings: {
      type: Array,
      default: () => []
    },
    teamContext: {
      type: Boolean
    }
  },
  methods: {
    onSelectAssignee(id) {
      const { user } = _.find(this.siblings, { value: id });
      const isAdded = _.findIndex(this.emails, { id });

      if (isAdded === -1 && user) {
        this.emails.push(user);
      }

      this.errors = false;
      this.$emit('updateEmails', this.emails);
    },
    onChangeEmails: function(e, v) {
      Vue.set(this, 'errors', {});

      // map of separator keys
      const separatorKeys = [' ', ',', ';', '/'];
      let emailList = v;

      if (
        (!e ||
          separatorKeys.indexOf(e.key) > -1 ||
          e.key === 'Enter' ||
          e.type === 'blur') &&
        emailList !== ''
      ) {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }

        // remove spaces
        emailList = emailList.replace(new RegExp(' ', 'g'), '');

        // replace chars to pipe
        for (var i = 0; i < separatorKeys.length; i++) {
          emailList = emailList.replace(new RegExp(separatorKeys[i], 'g'), '|');
        }

        emailList = emailList.split('|');

        let invalidEmails = [];

        for (var i = 0; i < emailList.length; i++) {
          const email = emailList[i];

          if (Utils.validateEmail(email)) {
            // check if email is already added
            if (
              this.emails.indexOf(email) === -1 &&
              _.findIndex(this.emails, { email }) === -1
            ) {
              // push simple email
              this.emails.push(email);

              // check if user exists in system
              this.$store
                .dispatch('channels/checkUser', email)
                .then(response => {
                  if (response) {
                    const index = this.emails.indexOf(email);
                    Vue.set(this.emails, index, { ...response, email });
                  }
                });
            }
          } else {
            invalidEmails.push(email);
          }
        }

        if (invalidEmails.length === 0) {
          // reset field
          this.$refs.emailBox.clear();
        } else {
          this.$refs.emailBox.setValue(invalidEmails.join(', '));
          Vue.set(
            this.errors,
            'emails',
            this.$t('general.errors.invalid-email')
          );
        }
      }
      this.$emit('updateEmails', this.emails);
      return e;
    },
    onRemoveEmail: function(removed) {
      let filteredEmails = this.emails.filter(function(value, index) {
        return index !== removed;
      });

      this.emails = filteredEmails;
      this.$emit('updateEmails', this.emails);
    },
    focusInput() {
      this.$refs.emailBox.focus();
    }
  }
};
</script>
