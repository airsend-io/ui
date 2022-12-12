<template>
  <div class="add-due-date-task">
    <Loader :loading="loading" :full="true" />
    <div v-if="has_due">
      <span class="add-due-date-text">
        {{ $t('actions.forms.action-add-due-date') }}
      </span>
      <div class="add-due-date-body">
        <div class="input-wrapper">
          <Icon family="far" name="calendar-plus" />
          <div
            class="form-group mb-0"
            :class="{ [`is-invalid`]: errors['action_due_date'] }"
          >
            <datetime
              v-model="action_due_date"
              class="theme-airsend"
              input-class="form-control"
              type="date"
            ></datetime>
            <small
              v-if="errors['action_due_date']"
              class="form-text text-danger"
              >{{ errors['action_due_date'] }}</small
            >
          </div>
        </div>

        <div class="input-wrapper">
          <Icon family="far" name="clock" />
          <div
            class="form-group mb-0"
            :class="{ [`is-invalid`]: errors['action_due_time'] }"
          >
            <datetime
              v-model="action_due_time"
              class="theme-airsend"
              input-class="form-control"
              type="time"
              :minute-step="5"
              auto
              use12-hour
            ></datetime>
            <small
              v-if="errors['action_due_time']"
              class="form-text text-danger"
              >{{ errors['action_due_time'] }}</small
            >
          </div>
        </div>
      </div>
      <div class="add-due-date-footer">
        <button
          class="btn btn-primary"
          :disabled="unmodified_date"
          @click="$emit('save', new_due_on)"
        >
          {{ $t('general.save') }}
        </button>

        <Popover
          ref="popover-remove-confirmation"
          v-if="has_due_saved"
          @hide="onRemovePopoverClose"
          @show="onRemovePopoverShow"
        >
          <button class="btn btn-outline-primary">
            {{ $t('actions.forms.action-remove-due-date') }}
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
                @click="removeDueDate"
              >
                {{ $t('general.delete-now') }}
              </button>
            </div>
          </template>
        </Popover>
        <div v-else>
          <button
            class="btn btn-outline-primary"
            @click="has_due = false"
            :disabled="disabled"
          >
            {{ $t('general.cancel') }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="no-due-date">
      <h2>{{ $t('actions.no-due-date') }}</h2>
      <Icon family="far" name="calendar-plus" />
      <button class="btn btn-link" @click="has_due = true" :disabled="disabled">
        {{ $t('actions.forms.action-add-due-date') }}
      </button>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
import Loader from 'airsend/components/Loader';
import moment from 'moment';
import { parseTime } from 'airsend/utils';

export default {
  data() {
    return {
      action_due_date: null,
      action_due_time: null,
      has_due: false,
      has_due_saved: false
    };
  },
  mounted() {
    if (this.due_on) {
      this.action_due_date = parseTime(this.due_on)
        .endOf('day')
        .toISOString();
      this.action_due_time = parseTime(this.due_on).toISOString();
      this.has_due = true;
      this.has_due_saved = true;
    } else {
      this.action_due_date = moment()
        .endOf('day')
        .add(1, 'day')
        .toISOString();
      this.action_due_time = moment.utc().toISOString();
      this.has_due = false;
      this.has_due_saved = false;
    }
  },
  computed: {
    new_due_on() {
      if (!this.has_due) return '';
      return moment(
        `${moment(this.action_due_date).format('YYYY-MM-DD')} ${moment(
          this.action_due_time
        ).format('HH:mm')}`,
        'YYYY-MM-DD HH:mm'
      )
        .utc()
        .format('YYYY-MM-DD HH:mm:ss');
    },
    loading() {
      return this.$store.state.loading['actions/update'];
    },
    unmodified_date() {
      return this.new_due_on === this.due_on;
    }
  },
  methods: {
    removeDueDate(e) {
      this.has_due = false;
      if (!this.unmodified_date) {
        this.$emit('save', this.new_due_on); //new_due_on is ""
      }
    },
    onRemovePopoverClose() {
      setTimeout(() => {
        this.$emit('lock', false); //delay unlock for 50ms, time enought to the button click be processed before unlock the parent modal
      }, 50);
    },
    onRemovePopoverShow() {
      this.$emit('lock', true);
    },
    parseTime: parseTime
  },
  props: {
    due_on: {
      type: String,
      required: true
    },
    errors: {
      type: Object,
      required: false,
      default: () => {
        return {};
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  components: {
    Icon,
    Loader,
    Popover
  }
};
</script>

<style></style>
