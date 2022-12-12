<template>
  <div class="task-activities">
    <span>Activities</span>
    <div v-if="activities.length === 0" class="empty-wrapper">
      <div class="empty-box">
        <Icon family="far" name="comment-alt-slash" />
        <h4>{{ $t('actions.activities.empty') }}</h4>
      </div>
    </div>
    <div
      v-for="(activity, index) in activities"
      :key="index"
      class="task-activity chat-fragment"
    >
      <ChatMessage
        v-if="activity.history_type === 'mentioned'"
        :message="observableMessages[activity.attachments.message.id]"
        :channel="channel"
        context="action-history"
        @quote="onQuote"
        @jumpTo="onJumpTo"
        @edit="onEditMessage"
      />
      <div class="chat-message" v-else>
        <Avatar
          v-if="typeof activity.user !== 'string'"
          :name="activity.user.display_name"
          :user-id="activity.user.id"
          :has-avatar="activity.user.has_avatar"
          :cache="0"
          size="medium"
          :active="activity.user.online_status"
        />
        <div class="activity-content">
          <div class="activity-header">
            <span class="user-name">{{ activity.user.display_name }}</span>
            <span class="when" v-tooltip="{ content: activity.created_on }">{{
              parseTime(activity.created_on).fromNow()
            }}</span>
          </div>
          <div class="activity-body">
            <div v-if="activity.history_type === 'created'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.created', {
                      action_name: activity.attachments.action_name,
                      action_id: activity.action_id
                    })
                  )
                "
              />
            </div>

            <div v-else-if="activity.history_type === 'name_updated'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.name-updated', {
                      from: activity.attachments.from,
                      to: activity.attachments.to
                    })
                  )
                "
              />
            </div>

            <div v-else-if="activity.history_type === 'user_added'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.user-added', {
                      display_name: activity.attachments.user.display_name
                    })
                  )
                "
              />
            </div>

            <div v-else-if="activity.history_type === 'user_removed'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.user-removed', {
                      display_name: activity.attachments.user.display_name
                    })
                  )
                "
              />
            </div>

            <div v-else-if="activity.history_type === 'due_date_updated'">
              <span
                v-if="!activity.attachments.from && activity.attachments.to"
                v-html="
                  parseMessageContent(
                    $t('actions.activities.due-date-added', {
                      due_on: activity.attachments.to
                    })
                  )
                "
              />
              <span
                v-else-if="activity.attachments.from && activity.attachments.to"
                v-html="
                  parseMessageContent(
                    $t('actions.activities.due-date-updated', {
                      due_on: activity.attachments.to
                    })
                  )
                "
              />
              <span
                v-else-if="
                  activity.attachments.from && !activity.attachments.to
                "
                v-html="
                  parseMessageContent(
                    $t('actions.activities.due-date-removed', {
                      due_on: activity.attachments.to
                    })
                  )
                "
              />
            </div>

            <div v-else-if="activity.history_type === 'completed'">
              <span
                v-html="parseMessageContent($t('actions.activities.completed'))"
              />
            </div>

            <div v-else-if="activity.history_type === 'uncompleted'">
              <span
                v-html="
                  parseMessageContent($t('actions.activities.uncompleted'))
                "
              />
            </div>

            <div v-if="activity.history_type === 'subtask_added'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.subtask-added', {
                      action_name: activity.attachments.action.action_name
                    })
                  )
                "
              />
            </div>

            <div v-if="activity.history_type === 'subtask_removed'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.subtask-removed', {
                      action_name: activity.attachments.action.action_name
                    })
                  )
                "
              />
            </div>

            <div v-if="activity.history_type === 'parent_removed'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.parent-removed', {
                      action_name: activity.attachments.action.action_name
                    })
                  )
                "
              />
            </div>

            <div v-if="activity.history_type === 'moved_under'">
              <span
                v-html="
                  parseMessageContent(
                    $t('actions.activities.moved-under', {
                      action_name: activity.attachments.action.action_name
                    })
                  )
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import ChatMessage from 'airsend/components/ChatMessage.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import { EventBus } from 'airsend/event-bus';
import { parseTime, parseMessageContent } from 'airsend/utils';

export default {
  components: {
    ChatMessage,
    Avatar,
    Icon
  },
  props: {
    activities: {
      type: Array,
      required: true
    },
    channel: {
      type: Object,
      required: true
    }
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    observableMessages() {
      return this.$store.state.channels.observableMessages;
    }
  },
  methods: {
    parseTime,
    parseMessageContent,
    onQuote(e) {
      this.$modal.hide('action-create');
      EventBus.$emit('onQuote', e);
    },
    onEditMessage(e) {
      this.$modal.hide('action-create');
      EventBus.$emit('onEditMessage', e);
    },
    onJumpTo(message) {
      this.$modal.hide('action-create');
      this.$router.push(
        `/channel/${message.channel_id}/messages/${message.id}`
      );
    }
  }
};
</script>
