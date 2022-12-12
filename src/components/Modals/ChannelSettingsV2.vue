<template>
  <div>
    <Modal
      name="channel-settings"
      :title="$t('channels.channel-settings')"
      theme="noPadding"
      class-name="channel-settings"
      @opened="onOpen"
    >
      <div class="tabbed--wrapper">
        <ul class="nav nav-pills nav-dynamic">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="[currentTab === 'general' ? 'active' : '']"
              href="#"
              @click="switchTab('general')"
              >{{ $t('channels.settings.general') }}</a
            >
          </li>
          <li v-if="user.role.can('channel.manage')" class="nav-item">
            <a
              class="nav-link"
              :class="[currentTab === 'customization' ? 'active' : '']"
              href="#"
              @click="switchTab('customization')"
              >{{ $t('channels.settings.customization') }}</a
            >
          </li>
          <li
            v-if="user.role.can('channel.manage') || channel.one_one"
            class="nav-item"
          >
            <a
              class="nav-link"
              :class="[currentTab === 'operations' ? 'active' : '']"
              href="#"
              @click="switchTab('operations')"
              >{{ $t('channels.settings.channel-operations') }}</a
            >
          </li>
        </ul>

        <div class="tabbed--content">
          <div v-if="currentTab === 'general'" class="tabbed--single">
            <Loader :loading="isLoading" full />

            <div v-if="typeof errors === 'string'" class="alert alert-danger">
              {{ errors }}
            </div>

            <form
              @submit="onSubmitUpdate"
              v-if="user.role.can('channel.manage') && !channel.one_one"
            >
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
                <small
                  v-if="errors['channel_name']"
                  class="form-text text-danger"
                  >{{
                    $t(
                      errors['channel_name'].message,
                      errors['channel_name'].meta
                    )
                  }}</small
                >
              </div>

              <div
                class="form-group"
                :class="{ [`is-invalid`]: errors['blurb'] }"
              >
                <label for="blurb" class="mb-2 optional"
                  >{{ $t('channels.forms.channel-description') }}
                  <span class="optional">{{
                    $t('general.optional')
                  }}</span></label
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

              <div
                class="form-group mb-4"
                :class="{ [`is-invalid`]: errors['channel_name'] }"
                v-if="channel.public_url"
              >
                <label for="channel_name" class="mb-2">{{
                  $t('channels.settings.permissions-title')
                }}</label>

                <div class="form-group form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.require_join_approval"
                    id="require_join_approval"
                  />
                  <label class="form-check-label" for="require_join_approval">
                    {{ $t('channels.settings.permissions-requires-approval') }}
                  </label>
                </div>

                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.allow_external_read"
                    id="allow_external_read"
                  />
                  <label class="form-check-label" for="allow_external_read">
                    {{ $t('channels.settings.permissions-external-read') }}
                  </label>
                </div>
              </div>

              <div class="form-group text-center">
                <button
                  class="btn btn-primary btn-rounded px-5 mx-2"
                  :disabled="!formChanged"
                >
                  {{ $t('general.save') }}
                </button>
              </div>
            </form>

            <hr
              class="my-4"
              v-if="user.role.can('channel.manage') && !channel.one_one"
            />

            <div
              class="form-group form-section"
              v-if="user.role.can('channel.manage') && !channel.one_one"
            >
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

            <hr
              class="my-4"
              v-if="user.role.can('channel.manage') && !channel.one_one"
            />

            <div class="form-group form-section">
              <div class="row">
                <div class="col">
                  <h4>
                    {{ $t('channels.settings.channel-email') }}
                    <Icon
                      v-tooltip="{
                        content: $t('channels.settings.channel-email-hint')
                      }"
                      family="fas"
                      name="info-circle"
                      class="text-airsend"
                    />
                  </h4>
                  <input
                    ref="channelEmail"
                    class="form-control my-3"
                    readonly="readonly"
                    @focus="onFocusLinkInput"
                    :value="channel.member_email"
                  />
                  <p>{{ $t('channels.settings.channel-email-description') }}</p>
                </div>
                <div class="col-md-3">
                  <button
                    class="btn btn-link mx-sm-2 mt-md-3"
                    type="button"
                    @click="onCopyEmail"
                  >
                    <Icon name="copy" />
                    {{ $t('channels.settings.channel-email-button') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="currentTab === 'customization'"
            class="tabbed--single  customization-tab"
          >
            <Loader :loading="imageUploading" full />
            <form
              class="upload-image-placeholder"
              novalidate="true"
              @submit.prevent.stop="onImageUpdate('background')"
            >
              <label>{{ $t('channels.settings.channel-background') }}</label>
              <div class="profile-block drag-drop-area">
                <Avatar
                  :type="'background'"
                  :channel-id="channel.id"
                  :has-avatar="channel.has_background"
                  :cache="this.channel.updated_on_ts"
                  editable
                  removable
                  :rounded="false"
                  @changed="onChangeAvatar($event, 'background')"
                  @removeImage="removeImage('background')"
                  @revertChanges="revertChanges('background')"
                />
              </div>
              <button
                class="btn btn-primary btn-rounded btn-full"
                :disabled="!background_changed"
              >
                <Icon family="fas" name="upload" />
                {{ $t('channels.settings.channel-background-change') }}
              </button>
            </form>
            <form
              class="upload-image-placeholder"
              novalidate="true"
              @submit.prevent.stop="onImageUpdate('logo')"
            >
              <label>{{ $t('channels.settings.channel-logo') }}</label>
              <div class="profile-block drag-drop-area">
                <Avatar
                  :type="'logo'"
                  :channel-id="channel.id"
                  :has-avatar="channel.has_logo"
                  :cache="channel.updated_on_ts"
                  size="full"
                  editable
                  removable
                  :rounded="false"
                  @changed="onChangeAvatar($event, 'logo')"
                  @removeImage="removeImage('logo')"
                  @revertChanges="revertChanges('logo')"
                />
              </div>
              <button
                class="btn btn-primary btn-rounded btn-full"
                :disabled="!logo_changed"
              >
                <Icon family="fas" name="upload" />
                {{ $t('channels.settings.channel-logo-change') }}
              </button>
            </form>
          </div>

          <div v-if="currentTab === 'operations'" class="tabbed--single">
            <Loader :loading="isLoading" full />

            <div v-if="typeof errors === 'string'" class="alert alert-danger">
              {{ errors }}
            </div>

            <div
              v-if="user.role.can('channel.manage') || channel.one_one"
              class="form-group form-section"
            >
              <div class="row">
                <div class="col">
                  <h4>{{ $t('channels.settings.channel-export') }}</h4>
                  <p>
                    {{ $t('channels.settings.channel-export-description') }}
                  </p>
                </div>
                <div class="col-md-3">
                  <button
                    class="btn btn-link mx-sm-2 mt-md-3"
                    type="button"
                    @click="onExportChannel"
                  >
                    <Icon name="download" /> {{ $t('general.export') }}
                  </button>
                </div>
              </div>
            </div>

            <hr class="my-4" v-if="user.role.can('channel.manage')" />

            <div
              class="form-group form-section"
              v-if="isChannelClosed && user.role.can('channel.manage')"
            >
              <div class="row">
                <div class="col">
                  <h4>{{ $t('channels.settings.channel-reopen') }}</h4>
                  <p>
                    {{ $t('channels.settings.channel-reopen-description') }}
                  </p>
                </div>
                <div class="col-md-3">
                  <v-popover>
                    <button class="btn btn-link mx-sm-2 mt-md-3" type="button">
                      <Icon name="unlock" />
                      {{ $t('channels.settings.channel-reopen-button') }}
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <div class="dropdown-text">
                          {{ $t('general.are-you-sure') }}
                        </div>
                        <button
                          v-close-popover
                          class="dropdown-item btn btn-primary"
                          type="button"
                          @click="onReopenChannel"
                        >
                          {{
                            $t(
                              'channels.settings.channel-reopen-button-confirm'
                            )
                          }}
                        </button>
                      </div>
                    </template>
                  </v-popover>
                </div>
              </div>
            </div>

            <div
              class="form-group form-section"
              v-else-if="user.role.can('channel.manage')"
            >
              <div class="row">
                <div class="col">
                  <h4>{{ $t('channels.close-channel') }}</h4>
                  <p>{{ $t('channels.settings.channel-close-description') }}</p>
                </div>
                <div class="col-md-3">
                  <v-popover>
                    <button class="btn btn-link mx-sm-2 mt-md-3" type="button">
                      <Icon name="lock" /> {{ $t('general.close-channel') }}
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <div class="dropdown-text">
                          {{ $t('general.are-you-sure') }}
                        </div>
                        <button
                          v-close-popover
                          class="dropdown-item btn btn-primary"
                          type="button"
                          @click="onCloseChannel"
                        >
                          {{ $t('general.close-now') }}
                        </button>
                      </div>
                    </template>
                  </v-popover>
                </div>
              </div>
            </div>

            <hr
              class="my-4"
              v-if="
                user.id === channel.created_by && useTeams && !channel.one_one
              "
            />

            <div
              class="form-group form-section"
              v-if="
                user.id === channel.created_by && useTeams && !channel.one_one
              "
            >
              <div class="row">
                <div class="col">
                  <h4>{{ $t('teams.channel-settings-set-group') }}</h4>
                  <p>
                    {{ $t('teams.channel-settings-set-group-description') }}
                  </p>
                </div>
                <div class="col-md-3">
                  <Popover>
                    <button class="btn btn-link mx-sm-2 mt-md-3" type="button">
                      <Icon name="exchange-alt" />
                      {{ $t('teams.channel-settings-choose-team') }}
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <button
                          class="dropdown-item"
                          type="button"
                          v-close-popover
                          @click="onAttachTeam(null)"
                          :disabled="!channel.team_id"
                        >
                          <Icon
                            family="fas"
                            name="check"
                            :class="{ invisible: channel.team_id }"
                          />
                          <a>None</a>
                        </button>
                        <button
                          class="dropdown-item"
                          type="button"
                          v-close-popover
                          @click="onAttachTeam(team)"
                          v-for="team in teams"
                          :key="team.id"
                          :disabled="channel.team_id === team.id"
                        >
                          <Icon
                            family="fas"
                            name="check"
                            :class="{ invisible: channel.team_id !== team.id }"
                          />
                          <a>{{ team.name }}</a>
                        </button>
                      </div>
                    </template>
                  </Popover>
                </div>
              </div>
              <AttachTeamToChannel />
            </div>

            <hr class="my-4" v-if="user.id === channel.created_by" />

            <div
              class="form-group form-section"
              v-if="user.id === channel.created_by"
            >
              <div class="row">
                <div class="col">
                  <h4>{{ $t('channels.delete-channel') }}</h4>
                  <p>
                    {{ $t('channels.settings.channel-delete-description') }}
                  </p>
                </div>
                <div class="col-md-3">
                  <v-popover>
                    <button
                      class="btn btn-link btn-link--danger mx-sm-2 mt-md-3"
                      type="button"
                    >
                      <Icon name="trash-alt" /> {{ $t('general.delete') }}
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <div class="dropdown-text">
                          {{ $t('general.are-you-sure') }}
                        </div>
                        <button
                          v-close-popover
                          class="dropdown-item btn btn-danger"
                          type="button"
                          @click="onDeleteChannel"
                        >
                          {{ $t('general.delete-now') }}
                        </button>
                      </div>
                    </template>
                  </v-popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Popover from 'airsend/components/Popover.vue';

import AttachTeamToChannel from 'airsend/components/Modals/AttachTeamToChannel.vue';

import { ChannelRoles } from 'airsend/constants';

export default {
  components: {
    Modal,
    Loader,
    Avatar,
    Icon,
    Popover,
    AttachTeamToChannel
  },
  props: ['channel'],
  data() {
    return {
      errors: {},
      ChannelRoles,
      formChanged: false,
      form: {
        channel_name: this.channel.channel_name,
        blurb: this.channel.blurb,
        require_join_approval: this.channel.require_join_approval,
        allow_external_read: this.channel.allow_external_read
      },
      currentTab: 'general',
      imageUploading: false,
      background_changed: false,
      logo_changed: false,
      copied_member_email: false,
      copied_public_url: false,
      transferToTeam: null
    };
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.formChanged = true;
      }
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    },
    isLoading() {
      return (
        this.$store.state.loading['channel.rename'] ||
        this.$store.state.loading['channel.close'] ||
        this.$store.state.loading['channel.remove'] ||
        this.$store.state.loading['channel.activate'] ||
        this.$store.state.loading['channel.update'] ||
        this.$store.state.loading['channel.export']
      );
    },
    isChannelClosed() {
      return this.channel.channel_status === 2;
    },
    teams() {
      return this.$store.state.teams.all || [];
    },
    useTeams() {
      return this.$store.state.core.useTeams;
    }
  },
  methods: {
    onOpen() {
      this.currentTab = 'general';

      this.form = {
        channel_name: this.channel.channel_name,
        blurb: this.channel.blurb,
        require_join_approval: this.channel.require_join_approval,
        allow_external_read: this.channel.allow_external_read
      };

      this.avatar = null;

      this.background_changed = false;
      this.logo_changed = false;

      // wait for next tick to reset changed state
      this.$nextTick(() => {
        this.formChanged = false;
      });
    },

    async onSubmitUpdate(e) {
      e.preventDefault();

      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/update', {
        ...this.form,
        channel_id: this.channel.id,
        noToast: true,
        require_join_approval: this.form.require_join_approval ? 1 : 0,
        allow_external_read: this.form.allow_external_read ? 1 : 0
      });

      if (!response.ok) {
        this.errors = response.error;
        return;
      }

      this.formChanged = false;
    },

    async onDeleteChannel() {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/remove', {
        ...this.form,
        channel_id: this.channel.id
      });
      if (response.ok) {
        this.$modal.hide('channel-settings');
      } else {
        this.errors = response.error;
      }
    },

    async onCloseChannel() {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/close', {
        ...this.form,
        channel_id: this.channel.id
      });
      if (response.ok) {
        this.$modal.hide('channel-settings');
      } else {
        this.errors = response.error;
      }
    },

    async onReopenChannel() {
      // reset errors
      this.errors = {};
      const response = await this.$store.dispatch('channels/activate', {
        ...this.form,
        channel_id: this.channel.id
      });
      if (response.ok) {
        this.channel.channel_status = 1;
        this.$modal.hide('channel-settings');
      } else {
        this.errors = response.error;
      }
    },

    onChangeAvatar(file, type) {
      this.avatar = file;
      this.changed = true;
      this[`${type}_changed`] = true;
    },
    copyToClipboard(str, type) {
      const el = document.createElement('textarea');
      el.value = str;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this[`copied_${type}`] = true;

      setTimeout(() => {
        this[`copied_${type}`] = false;
      }, 2000);
    },
    async onExportChannel() {
      const response = await this.$store.dispatch('channels/export', {
        channel_id: this.channel.id,
        channel_name: this.channel.channel_name
      });
    },
    async onImageUpdate(type) {
      // reset data errors
      this.errors = {};
      this.imageUploading = true;

      const response = await this.$store.dispatch('channels/updateImage', {
        channel_id: this.channel.id,
        type: type,
        avatar: this.avatar
      });
      this.imageUploading = false;
      if (response.ok) {
        this.$modal.hide('channel-settings');
      } else {
        this.errors.imageUpdate = response.error;
      }
    },
    async removeImage(type) {
      this.errors = {};
      this.imageUploading = true;

      const response = await this.$store.dispatch('channels/updateImage', {
        clear_asset: true,
        channel_id: this.channel.id,
        type: type
      });
      this.imageUploading = false;
      if (response.ok) {
        this.$modal.hide('channel-settings');
      } else {
        this.errors.imageUpdate = response.error;
      }
    },
    revertChanges(type) {
      this.avatar = null;
      this[`${type}_changed`] = false;
    },
    switchTab(tabName) {
      this.currentTab = tabName;
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

    onCopyLink() {
      if (this.$refs.channelLink) this.$refs.channelLink.focus();
      document.execCommand('copy');
    },

    onCopyEmail() {
      if (this.$refs.channelEmail) this.$refs.channelEmail.focus();
      document.execCommand('copy');
    },
    onAttachTeam(team) {
      this.$modal.show('attach-team-to-channel', {
        team,
        channel: this.channel
      });
    }
  }
};
</script>
