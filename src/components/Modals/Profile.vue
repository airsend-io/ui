<template>
  <LeftTabbedModal
    name="profile-settings"
    :title="$t('general.settings')"
    theme="noPadding"
    class-name="channel-settings"
    @before-open="beforeOpen"
    @opened="onOpen"
  >
    <template v-slot:tabs>
      <ul>
        <li
          :class="{ active: currentTab === 'profile' }"
          @click="switchTab('profile')"
        >
          <Icon family="far" name="user" />
          <span>{{ $t('settings.profile.profile') }}</span>
        </li>

        <li
          :class="{ active: currentTab === 'notifications' }"
          @click="switchTab('notifications')"
        >
          <Icon family="far" name="bell" />
          <span>{{ $t('settings.notifications.notifications') }}</span>
        </li>

        <li
          :class="{ active: currentTab === 'contact-form' }"
          @click="switchTab('contact-form')"
        >
          <Icon family="far" name="file-contract" />
          <span>{{ $t('settings.contact-form.title') }}</span>
        </li>

        <li
          :class="{ active: currentTab === 'account' }"
          @click="switchTab('account')"
        >
          <Icon family="far" name="cog" />
          <span>{{ $t('settings.account.account') }}</span>
        </li>
      </ul>
    </template>

    <template v-slot:body>
      <div class="tabbed--content">
        <form
          v-if="currentTab === 'profile'"
          novalidate="true"
          @submit="onSubmitProfile"
        >
          <Loader
            :loading="
              $store.state.loading['user.profile.set'] ||
                $store.state.loading['user.image.set']
            "
            full
          />

          <div class="profile-block">
            <Avatar
              :name="user.display_name"
              :user-id="user.id"
              :cache="user.updated_on_ts"
              :has-avatar="user.has_avatar"
              size="full"
              editable
              @changed="onChangeAvatar"
              @revertChanges="onRevertAvatar"
            />
            <h4>
              {{ profileForm.name ? profileForm.name : user.display_name }}
            </h4>
            <p class="mb-2">{{ user.email }}</p>
            <p>
              <span class="badge badge-primary text-uppercase">{{
                user.plan
              }}</span>
            </p>

            <div
              v-tooltip="{
                content: `<b>${$t(
                  'settings.profile.usage-quota'
                )}:</b> ${bytesToSize(user.user_fs_stats.quota)}<br><b>${$t(
                  'settings.profile.usage-used'
                )}:</b> ${(
                  (user.user_fs_stats.total_fs_size * 100) /
                  user.user_fs_stats.quota
                ).toFixed(2)}%<br><b>${$t(
                  'settings.profile.usage-items'
                )}:</b> ${user.user_fs_stats.total_fs_count}`
              }"
              class="progress progress-big mb-4"
              style="max-width:300px;margin:0 auto"
            >
              <div class="progress-title">
                <span
                  >{{ bytesToSize(user.user_fs_stats.total_fs_size) }} /
                  {{ bytesToSize(user.user_fs_stats.quota) }}</span
                >
              </div>
              <div
                class="progress-bar"
                role="progressbar"
                :style="{
                  width:
                    (
                      (user.user_fs_stats.total_fs_size * 100) /
                      user.user_fs_stats.quota
                    ).toFixed(2) + '%'
                }"
                aria-valuenow="25"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>

          <div v-if="typeof errors === 'string'" class="alert alert-danger">
            {{ errors }}
          </div>

          <div class="form-group" :class="{ [`is-invalid`]: errors['name'] }">
            <label for="name" class="mb-2">{{
              $t('settings.profile.full-name')
            }}</label>
            <input
              id="name"
              ref="name"
              v-model="profileForm.name"
              type="text"
              class="form-control"
              placeholder=""
              autofocus
            />
            <small v-if="errors['name']" class="form-text text-danger">{{
              errors['name']
            }}</small>
          </div>

          <div class="form-group" :class="{ [`is-invalid`]: errors['phone'] }">
            <label for="phone" class="mb-2 optional">{{
              $t('settings.profile.phone-number')
            }}</label>
            <input
              id="phone"
              ref="phone"
              v-model="profileForm.phone"
              type="text"
              class="form-control"
              placeholder=""
            />
            <small v-if="errors['phone']" class="form-text text-danger">{{
              errors['phone']
            }}</small>
          </div>

          <hr v-if="changed" class="my-4" />

          <button
            v-if="changed"
            class="btn btn-primary btn-rounded mx-auto d-block"
          >
            {{ $t('settings.save') }}
          </button>
        </form>

        <form
          v-if="currentTab === 'notifications'"
          novalidate="true"
          @submit="onSubmitNotifications"
        >
          <Loader
            :loading="$store.state.loading['user.notifications.manage']"
            full
          />

          <div v-if="typeof errors === 'string'" class="alert alert-danger">
            {{ errors }}
          </div>

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['notification_option'] }"
          >
            <label for="notification_option" class="mb-2">{{
              $t('settings.notifications.email-subscription')
            }}</label>
            <select
              v-model="notifications"
              class="form-control"
              placeholder="Please select"
            >
              <option value="2">{{
                $t('settings.notifications.all-notifications')
              }}</option>
              <option value="1">{{
                $t('settings.notifications.mention-notifications')
              }}</option>
              <option value="0">{{
                $t('settings.notifications.no-notifications')
              }}</option>
            </select>
            <small
              v-if="errors['notification_option']"
              class="form-text text-danger"
              >{{ errors['notification_option'] }}</small
            >
          </div>

          <hr class="my-4" />

          <button class="btn btn-primary btn-rounded mx-auto d-block">
            {{ $t('settings.save') }}
          </button>
        </form>

        <div v-if="currentTab === 'account'">
          <div class="form-group form-section">
            <div class="row">
              <div class="col">
                <h4>{{ $t('settings.account.change-password') }}</h4>
                <p>
                  {{ $t('settings.account.change-password-description') }}
                </p>
              </div>
              <div class="col-md-3">
                <button
                  class="btn btn-link mx-sm-2 mt-md-3"
                  v-if="currentSubTab !== 'password'"
                  @click="switchSubTab('password')"
                  type="button"
                >
                  <Icon name="key" />
                  {{ $t('settings.account.change-password-button') }}
                </button>
              </div>
            </div>
          </div>

          <form
            v-if="currentSubTab === 'password'"
            class="boxed boxed--light mb-4"
            novalidate="true"
            @submit="onSubmitPassword"
          >
            <Loader :loading="$store.state.loading['password.update']" full />

            <div
              v-if="typeof errors === 'string'"
              class="alert alert-danger"
              v-html="errors"
            ></div>

            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['current_password'] }"
            >
              <label
                for="current_password"
                ref="currentPassword"
                class="mb-2"
                >{{ $t('settings.password.old-password') }}</label
              >
              <input
                id="current_password"
                ref="current_password"
                v-model="passwordForm.current_password"
                type="password"
                class="form-control"
                placeholder=""
                autofocus
              />
              <small
                v-if="errors['current_password']"
                class="form-text text-danger"
                >{{
                  $t(
                    errors['current_password'].message,
                    errors['current_password'].meta
                  )
                }}</small
              >
            </div>

            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['new_password'] }"
            >
              <label for="new_password" class="mb-2">{{
                $t('settings.password.new-password')
              }}</label>
              <input
                id="new_password"
                ref="new_password"
                v-model="passwordForm.new_password"
                type="password"
                class="form-control"
                placeholder=""
              />
              <small
                v-if="errors['new_password']"
                class="form-text text-danger"
                >{{
                  $t(
                    errors['new_password'].message,
                    errors['new_password'].meta
                  )
                }}</small
              >
            </div>

            <div class="form-group text-center">
              <button
                class="btn btn-primary btn-ghost btn-rounded mx-2"
                type="button"
                @click="switchSubTab('')"
              >
                {{ $t('general.cancel') }}
              </button>

              <button class="btn btn-primary btn-rounded mx-2">
                {{ $t('settings.password.update') }}
              </button>
            </div>
          </form>

          <hr />

          <div class="form-group form-section">
            <div class="row">
              <div class="col">
                <h4>{{ $t('settings.account.delete-account') }}</h4>
                <p>{{ $t('settings.account.delete-account-description') }}</p>
              </div>
              <div class="col-md-3">
                <button
                  class="btn btn-link btn-link--danger mx-sm-2 mt-md-3"
                  v-if="currentSubTab !== 'delete_account'"
                  @click="switchSubTab('delete_account')"
                  type="button"
                >
                  <Icon name="trash-alt" />
                  {{ $t('settings.account.delete-account-button') }}
                </button>
              </div>
            </div>
          </div>

          <form
            v-if="currentSubTab === 'delete_account'"
            class="boxed boxed--light mb-4"
            novalidate="true"
            @submit="onSubmitAccountDelete"
          >
            <Loader :loading="$store.state.loading['user.delete']" full />

            <div
              v-if="typeof errors === 'string'"
              class="alert alert-danger"
              v-html="errors"
            ></div>

            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['email'] }"
            >
              <label for="email" ref="currentPassword" class="mb-2">{{
                $t('settings.account.confirm-email')
              }}</label>
              <input
                id="email"
                ref="email"
                v-model="deleteForm.email"
                type="email"
                class="form-control"
                placeholder=""
                autofocus
              />
              <small v-if="errors['email']" class="form-text text-danger">{{
                $t(errors['email'].message, errors['email'].meta)
              }}</small>
            </div>

            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['feedback'] }"
            >
              <label for="feedback" class="mb-2 optional">
                {{ $t('settings.account.delete-feedback') }}
                <span class="optional">{{ $t('general.optional') }}</span>
              </label>
              <textarea
                id="feedback"
                ref="feedback"
                v-model="deleteForm.feedback"
                class="form-control"
                :placeholder="
                  $t('settings.account.delete-feedback-placeholder')
                "
              ></textarea>
              <small v-if="errors['feedback']" class="form-text text-danger">{{
                $t(errors['feedback'].message, errors['feedback'].meta)
              }}</small>
            </div>

            <div class="form-group text-center">
              <button
                class="btn btn-danger btn-ghost btn-rounded mx-2"
                type="button"
                @click="switchSubTab('')"
              >
                {{ $t('general.cancel') }}
              </button>

              <button class="btn btn-danger btn-rounded mx-2">
                {{ $t('settings.account.delete-button') }}
              </button>
            </div>
          </form>
        </div>

        <div v-if="currentTab === 'contact-form'">
          <ContactForm />
        </div>
      </div>
    </template>
  </LeftTabbedModal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import ContactForm from '../ContactForm.vue';

import { bytesToSize } from 'airsend/utils';
import LeftTabbedModal from './templates/LeftTabbedModal.vue';

export default {
  components: {
    Modal,
    Avatar,
    Loader,
    ContactForm,
    Icon,
    LeftTabbedModal
  },
  data() {
    return {
      avatar: null,
      changed: false,
      errors: {},
      currentTab: 'profile',
      currentSubTab: '',
      profileForm: {
        name: '',
        phone: ''
      },
      passwordForm: {
        current_password: '',
        new_password: ''
      },
      deleteForm: {
        password: '',
        feedback: ''
      },
      notifications: '0'
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    meeting() {
      return this.$store.state.meeting;
    }
  },
  watch: {
    ['profileForm.name']: function() {
      if (this.profileForm.name !== this.user.display_name) {
        this.changed = true;
      }
    },
    ['profileForm.phone']: function() {
      if (this.profileForm.phone !== this.user.phone) {
        this.changed = true;
      }
    }
  },
  methods: {
    switchTab(tabName) {
      this.currentTab = tabName;
    },
    switchSubTab(tabName) {
      this.currentSubTab = tabName;
      this.errors = {};

      this.$nextTick(() => {
        if (this.$refs.currentPassword) this.$refs.currentPassword.focus();
      });
    },
    onChangeAvatar(file) {
      this.avatar = file;
      this.changed = true;
    },
    onRevertAvatar() {
      this.avatar = null;
      this.changed = false;
    },
    beforeOpen({ params }) {
      if (params) {
        this.currentTab = params;
      } else {
        this.currentTab = 'profile';
      }
    },

    onOpen() {
      // reset fields
      this.profileForm.name = this.user.display_name;
      this.profileForm.phone = this.user.phone;

      this.notifications = this.user.notifications_config;
      this.currentSubTab = '';

      this.errors = {};

      this.passwordForm = {
        current_password: '',
        new_password: ''
      };

      this.deleteForm = {
        current_password: '',
        feedback: ''
      };

      this.changed = false;
    },
    async onSubmitProfile(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      const response = await this.$store.dispatch('core/updateProfile', {
        ...this.profileForm,
        avatar: this.avatar
      });

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('profile-settings');
    },
    async onSubmitNotifications(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      const response = await this.$store.dispatch('core/notifications', {
        notification_option: this.notifications
      });

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('profile-settings');
    },
    async onSubmitPassword(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      const response = await this.$store.dispatch('core/updatePassword', {
        ...this.passwordForm,
        user_id: this.user.id
      });

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('profile-settings');
    },

    async onSubmitAccountDelete(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      if (this.deleteForm.email !== this.user.email) {
        this.errors['email'] = {
          message: 'settings.account.confirm-email-error'
        };
        return;
      }

      const response = await this.$store.dispatch('core/deleteAccount', {
        ...this.deleteForm
      });

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.$modal.hide('profile-settings');
    },
    bytesToSize: bytesToSize
  }
};
</script>
