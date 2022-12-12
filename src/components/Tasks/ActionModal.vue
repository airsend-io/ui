<template>
  <Modal
    name="action-create"
    :title="contextSettings.title"
    theme="noPadding"
    :max-width="1000"
    @before-open="beforeOpen"
    @opened="onOpen"
    id="action-create-modal"
  >
    <div class="tabbed--wrapper">
      <ul class="nav nav-pills nav-fill nav-justified" v-if="!createContext">
        <li class="nav-item">
          <a
            class="nav-link py-3"
            :class="{ active: currentTab === 'details' }"
            href="#"
            @click="switchTab('details')"
            >{{ $t('general.details') }}</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link py-3"
            :class="{
              active: currentTab === 'activity',
              disabled: loadingActivities
            }"
            href="#"
            @click="switchTab('activity')"
            >{{ $t('actions.forms.activity') }}</a
          >
        </li>
      </ul>
      <div class="tabbed--content p-5 py-2" v-if="currentTab === 'details'">
        <Loader
          :loading="this.$store.state.loading['action.create'] || loadingInfo"
          full
        />

        <form novalidate="true" @submit="onSubmit">
          <div v-if="typeof errors === 'string'" class="alert alert-danger">
            {{ errors }}
          </div>

          <div class="form-group" v-if="copyContext || moveContext">
            <label for="channel_id" class="mb-2">{{
              $t('actions.forms.action-channel')
            }}</label>
            <select
              class="form-control"
              placeholder="Please select"
              ref="action_channel"
              v-model="form.channel_id"
            >
              <option
                :value="channel.id"
                v-for="channel in channels"
                :disabled="moveContext && form.source_channel === channel.id"
                :key="channel.id"
              >
                {{ channel.channel_name }}
              </option>
            </select>
            <small v-if="errors['channel_id']" class="form-text text-danger">{{
              errors['channel_id']
            }}</small>
          </div>

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['action_name'] }"
          >
            <label for="action_name" class="mb-2">{{
              $t('actions.forms.action-name')
            }}</label>
            <InputBox
              ref="action_name"
              class="px-0"
              v-model="form.action_name"
              :disabled="viewContext"
              autofocus
              borderless
            />
            <small v-if="errors['action_name']" class="form-text text-danger">{{
              errors['action_name']
            }}</small>
          </div>

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['action_desc'] }"
          >
            <label for="action_desc" class="mb-2">{{
              $t('actions.forms.action-description')
            }}</label>
            <TextAreaBox
              ref="action_desc"
              class="px-0"
              v-model="form.action_desc"
              :disabled="viewContext"
              :placeholder="$t('actions.forms.action-description-placeholder')"
              borderless
              autofocus
            />
            <small v-if="errors['action_desc']" class="form-text text-danger">{{
              errors['action_desc']
            }}</small>
          </div>

          <div
            class="form-group"
            :class="{ [`is-invalid`]: errors['user_ids'] }"
          >
            <label for="user_ids" class="mb-2 optional">{{
              $t('actions.forms.action-who')
            }}</label>
            <AutoComplete
              :data="members"
              @select="onSelectAssignee"
              @error="onAssigneeError"
              :disabled="viewContext"
            />
            <small v-if="errors['user_ids']" class="form-text text-danger">{{
              errors['user_ids']
            }}</small>
          </div>

          <div class="form-group chip-group">
            <div
              v-for="(user, index) in this.users"
              :key="index"
              class="chip"
              :class="{ danger: user.conflict }"
            >
              <Avatar
                v-if="typeof user !== 'string'"
                :name="user.display_name"
                :user-id="user.id"
                :has-avatar="user.has_avatar"
                :cache="0"
                size="medium"
                :active="user.online_status"
              />
              <p>{{ user.display_name }}</p>
              <button
                type="button"
                name="button"
                class="btn btn-icon"
                @click="onRemoveUser(index)"
              >
                <Icon family="far" name="times" />
              </button>
            </div>
            <span
              v-if="hasUserConflict"
              class="text-danger small font-weight-bold d-block w-100"
              >*Users aren’t in the target channel</span
            >
          </div>

          <div class="boxed boxed--light mb-2">
            <div
              class="form-group"
              :class="{ [`is-invalid`]: errors['action_type'] }"
            >
              <label for="action_type" class="mb-2">{{
                $t('actions.forms.action-type')
              }}</label>
              <select
                v-model="form.action_type"
                class="form-control"
                placeholder="Please select"
                :disabled="viewContext"
              >
                <option value="1">{{ $t('actions.reminder') }}</option>
                <option value="2" disabled>
                  {{ $t('actions.internal-review') }}
                </option>
                <option value="3" disabled>
                  {{ $t('actions.require-update') }}
                </option>
                <option value="4" disabled>{{
                  $t('actions.require-sign')
                }}</option>
              </select>
              <small
                v-if="errors['action_type']"
                class="form-text text-danger"
                >{{ errors['action_type'] }}</small
              >
            </div>

            <div
              class="form-group form-check"
              :class="{ 'mb-0': !form.has_due }"
            >
              <input
                id="has_due"
                v-model="form.has_due"
                type="checkbox"
                class="form-check-input"
                :disabled="viewContext"
              />
              <label class="form-check-label" for="has_due">{{
                $t('actions.forms.action-include-due-date')
              }}</label>
            </div>

            <div v-if="form.has_due" class="row">
              <div class="col-md-8">
                <div
                  class="form-group mb-0"
                  :class="{ [`is-invalid`]: errors['action_due_date'] }"
                >
                  <label for="action_due_date" class="mb-2">Due by</label>
                  <datetime
                    v-model="form.action_due_date"
                    class="theme-airsend"
                    input-class="form-control"
                    type="date"
                    :disabled="viewContext"
                  ></datetime>
                  <small
                    v-if="errors['action_due_date']"
                    class="form-text text-danger"
                    >{{ errors['action_due_date'] }}</small
                  >
                </div>
              </div>

              <div class="col-md-4">
                <div
                  class="form-group mb-0"
                  :class="{ [`is-invalid`]: errors['action_due_time'] }"
                >
                  <label for="action_due_time" class="mb-2">Time</label>
                  <datetime
                    v-model="form.action_due_time"
                    class="theme-airsend"
                    input-class="form-control"
                    type="time"
                    :minute-step="5"
                    auto
                    use12-hour
                    :disabled="viewContext"
                  ></datetime>
                  <small
                    v-if="errors['action_due_time']"
                    class="form-text text-danger"
                    >{{ errors['action_due_time'] }}</small
                  >
                </div>
              </div>
            </div>
          </div>

          <hr class="my-4" />

          <button
            class="btn btn-primary btn-rounded mx-auto d-block"
            :disabled="(editContext && !formChanged) || hasUserConflict"
          >
            {{ contextSettings.ok }}
          </button>
        </form>
      </div>
      <div
        class="tabbed--content px-0 pt-2 pb-5"
        v-if="currentTab === 'activity'"
      >
        <Loader :loading="loadingActivities" full />

        <Activities
          :activities="actionActivities"
          :channel="channel"
          v-if="actionActivities"
        />
        <hr class="my-4" />

        <button
          class="btn btn-primary btn-rounded mx-auto d-block"
          @click="closeModal"
        >
          {{ $t('general.close') }}
        </button>
      </div>
    </div>
  </Modal>
</template>
<script>
import _ from 'lodash';
import moment from 'moment';
import Vue from 'vue';
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import AutoComplete from 'airsend/components/AutoComplete.vue';
import { parseMessageContent } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus';
import { parseTime } from 'airsend/utils';
import Activities from './Activities';

import InputBox from 'airsend/components/Forms/InputBox.vue';
import TextAreaBox from 'airsend/components/Forms/TextAreaBox.vue';

export default {
  components: {
    Modal,
    Avatar,
    Icon,
    Loader,
    AutoComplete,
    Activities,
    InputBox,
    TextAreaBox
  },
  props: {},
  data() {
    return {
      errors: {},
      users: [],
      form: {
        action_name: '',
        action_desc: '',
        action_type: '1',
        has_due: false,
        action_due_date: moment()
          .endOf('day')
          .add(1, 'day')
          .toISOString(),
        action_due_time: moment.utc().toISOString()
      },
      channel: {},
      context: 'create',
      editingId: false,
      formChanged: false,
      actionActivities: [],
      currentTab: 'details'
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    members() {
      if (!this.channel || Object.keys(this.channel).length === 0) return [];
      return this.channel.members.map(item => {
        return {
          title: item.display_name,
          description: item.email,
          value: item.id,
          user: item
        };
      });
    },
    loadingInfo() {
      return this.$store.state.loading['actions/info'];
    },
    loadingActivities() {
      return this.$store.state.loading['actions/activities'];
    },
    channels() {
      return this.$store.state.channels.all;
    },
    hasUserConflict() {
      const channelMembers =
        !this.channel || Object.keys(this.channel).length === 0
          ? []
          : this.channel.members;
      this.evaluateUserConflicts(this.users, channelMembers); //users in action, users in target channel
      return this.users.some(user => user.conflict);
    },
    createContext() {
      return this.context === 'create';
    },
    editContext() {
      return this.context === 'edit';
    },
    copyContext() {
      return this.context === 'copy';
    },
    moveContext() {
      return this.context === 'move';
    },
    viewContext() {
      return this.context === 'view';
    },
    contextSettings() {
      if (this.createContext) {
        return {
          title: this.$t('actions.create-new-action'),
          ok: this.$t('actions.create-action')
        };
      } else if (this.editContext) {
        return {
          title: this.$t('actions.forms.action-details'),
          ok: this.$t('general.save')
        };
      } else if (this.copyContext) {
        return {
          title: this.$t('actions.copy-to-channel'),
          ok: this.$t('actions.copy-to-channel')
        };
      } else if (this.moveContext) {
        return {
          title: this.$t('actions.move-to-channel'),
          ok: this.$t('actions.move-to-channel')
        };
      } else if (this.viewContext) {
        return {
          title: this.$t('actions.forms.action-details'),
          ok: this.$t('general.close')
        };
      }
    }
  },
  mounted() {
    EventBus.$on('action', this.onReceiveData);
    this.load();
    this.evaluateChannel();
  },
  destroyed() {
    EventBus.$off('action', this.onReceiveData);
  },
  methods: {
    load() {
      this.form = {
        action_name: '',
        action_desc: '',
        action_type: '1',
        has_due: false,
        action_due_date: moment()
          .endOf('day')
          .add(1, 'day')
          .toISOString(),
        action_due_time: moment.utc().toISOString()
      };
      this.channel = {};
      this.context = 'create';
      this.editingId = false;
      this.formChanged = false;
      this.actionActivities = [];
      this.errors = {};
      this.users = [];
      this.currentTab = 'details';
    },
    switchTab(tabName) {
      this.currentTab = tabName;
      this.errors = {};
    },
    closeModal() {
      this.$modal.hide('action-create');
    },
    onClose() {
      if ((this.copyContext || this.moveContext) && this.channel.id) {
        this.$router.push(`${this.channel.id}`);
      }
    },

    onReceiveData(data) {
      this.load();
      this.form.action_type = data.type;
      this.form.action_desc = parseMessageContent(
        data.message.content,
        this.channel,
        true
      );
      this.evaluateChannel();

      // add message owner
      this.onSelectAssignee(data.message.user_id);

      // parse mentions
      var pattern = /user:\/\/[0-9]{8}/g;
      var mentions = data.message.content.match(pattern);

      if (mentions) {
        mentions.forEach(user => {
          this.onSelectAssignee(parseInt(user.substring(user.length - 8)));
        });
      }

      this.$modal.show('action-create');
    },

    onOpen() {
      if (this.viewContext) return;

      if (this.copyContext || this.moveContext) {
        this.$refs.action_channel.addFocus();
      } else {
        this.$refs.action_name.addFocus();
      }
    },

    onAssigneeError(err) {
      this.errors = {
        user_ids: err
      };
    },

    onSelectAssignee(id) {
      const user = _.find(this.channel.members, { id });
      const isAdded = _.findIndex(this.users, { id });

      if (isAdded === -1 && user) {
        this.users.push(user);
      }

      this.errors = false;
    },

    onRemoveUser(index) {
      if (this.viewContext) return;
      Vue.delete(this.users, index);
    },

    async onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      if (this.viewContext) {
        this.$modal.hide('action-create');
        return;
      }

      // reset data errors
      this.errors = {};

      let payload = { ...this.form, channel_id: this.channel.id };

      payload.user_ids =
        this.users.length > 0 ? this.users.map(user => user.id) : [];

      if (this.form.has_due) {
        payload.action_due_date = moment(
          `${moment(payload.action_due_date).format('YYYY-MM-DD')} ${moment(
            payload.action_due_time
          ).format('HH:mm')}`,
          'YYYY-MM-DD HH:mm'
        )
          .utc()
          .format('YYYY-MM-DD HH:mm:ss');
        delete payload.action_due_time;

        // if there is no due date, remove props
      } else {
        delete payload.action_due_date;
        delete payload.action_due_time;
      }

      let response;
      if (this.editContext) {
        payload.id = this.editingId;
        response = await this.$store.dispatch('actions/update', payload);
      } else if (this.moveContext) {
        payload.channel_id = this.form.channel_id;
        payload.id = this.editingId;
        response = await this.$store.dispatch('actions/update', payload);
        //response = await this.$store.dispatch('actions/moveToChannel', payload);
      } else {
        response = await this.$store.dispatch('actions/create', payload);
      }

      if (response.ok) {
        this.$modal.hide('action-create');
      } else {
        this.errors = response.error;
      }
    },
    async beforeOpen({ params }) {
      this.load();
      if (params) {
        this.context = params.context;

        if (this.viewContext) {
          this.switchTab('activity');
          this.$store
            .dispatch('actions/activities', { action_id: params.id })
            .then(res => {
              this.actionActivities = res;
            });
          let _action = await this.$store.dispatch('actions/info', {
            action_id: params.id
          });

          params = { ...params, ..._action };
        }

        if (this.createContext) {
          this.evaluateChannel();

          this.form.action_desc =
            parseMessageContent(params.message.content, this.channel, true) ||
            '';

          if (params.name) {
            this.form.action_name = params.name;
          }

          // add message owner
          this.onSelectAssignee(params.message.user_id);

          // parse mentions
          var pattern = /user:\/\/[0-9]{8}/g;
          var mentions = params.message.content.match(pattern);

          if (mentions) {
            mentions.forEach(user => {
              this.onSelectAssignee(parseInt(user.substring(user.length - 8)));
            });
          }

          return;
        }

        this.editingId = params.id;
        this.form = {
          action_name: params.action_name,
          action_desc: params.action_desc || '',
          action_type: params.action_type,
          has_due: !!params.due_on_ts,
          source_channel: params.source_channel,
          action_due_date: moment()
            .endOf('day')
            .add(1, 'day')
            .toISOString(),
          action_due_time: moment.utc().toISOString()
        };
        if (params.channel_id) {
          this.form.channel_id = params.channel_id;
        }
        this.evaluateChannel();

        if (this.form.has_due) {
          (this.form.action_due_date = parseTime(params.due_on)
            .endOf('day')
            .toISOString()),
            (this.form.action_due_time = parseTime(
              params.due_on
            ).toISOString());
        } else {
          this.form.action_due_date = moment()
            .endOf('day')
            .add(1, 'day')
            .toISOString();
          this.form.action_due_time = moment.utc().toISOString();
        }
        this.users = params.users || [];

        this.$nextTick(() => {
          this.formChanged = false;
        });
      }

      if (this.editingId && !this.viewContext) {
        this.actionActivities = await this.$store.dispatch(
          'actions/activities',
          { channel_id: params.channel_id, action_id: this.editingId }
        );
      }
    },
    evaluateChannel() {
      if (this.copyContext || this.moveContext) {
        this.channel = this.$store.getters['channels/getChannelById'](
          this.form.channel_id
        );
      } else {
        let channel_id = parseInt(
          this.form.channel_id ? this.form.channel_id : this.$route.params.id
        );
        this.channel = this.$store.getters['channels/getChannelById'](
          channel_id
        );
      }
    },
    usersNotInChannel(actionUsers, channelUsers) {
      const notInChannel = actionUsers.filter(
        ({ id: id1 }) => !channelUsers.some(({ id: id2 }) => id2 === id1)
      );
      return notInChannel;
    },
    evaluateUserConflicts(usersInAction, usersInChannel) {
      if (usersInAction) {
        //check for user conflicts
        let conflicts = this.usersNotInChannel(usersInAction, usersInChannel);
        this.users.forEach(user => this.$set(user, 'conflict', false));
        if (conflicts) {
          conflicts.forEach(user => this.$set(user, 'conflict', true));
          return conflicts;
        }
      }
      return [];
    },
    parseTime: parseTime
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.formChanged = true;
      }
    },
    'form.channel_id'() {
      this.evaluateChannel();
    },
    users: {
      deep: true,
      handler() {
        this.formChanged = true;
      }
    }
  }
};
</script>
