<template>
  <div
    ref="actions"
    class="chat-message-actions d-flex"
    :class="{
      ['chat-message-actions-history-context']: isActionHistoryContext
    }"
  >
    <div
      class="btn btn-icon"
      v-tooltip="{
        delay: { show: 1000, hide: 0 },
        offset: -5,
        content: $t('messages.actions-reply')
      }"
      @click="onQuote"
      v-if="isChatContext"
    >
      <Icon family="far" name="reply" />
    </div>

    <Popover
      ref="popover-emoji"
      popoverClass="popover-limited"
      @auto-hide="forcePopoverClose"
      @hide-apply="forcePopoverClose"
      @show="openPopover('emoji', $event)"
      v-if="isChatContext"
    >
      <Icon
        class="btn btn-icon"
        family="far"
        name="smile-wink"
        v-tooltip="{
          delay: { show: 1000, hide: 0 },
          offset: -5,
          content: $t('messages.actions-react')
        }"
      />
      <template slot="popover">
        <ul class="popover-emoji" @mouseleave="forcePopoverClose">
          <li
            v-for="reaction in reactions"
            v-bind:key="reaction"
            v-bind:class="{
              [`popover-emoji-item--picked`]:
                message.reactions[reaction] &&
                message.reactions[reaction].indexOf(userId) > -1
            }"
          >
            <a @click="onReact(reaction, $event)">{{ reaction }}</a>
          </li>
        </ul>
      </template>
    </Popover>

    <Popover
      ref="popover-remind"
      @auto-hide="forcePopoverClose"
      @hide-apply="forcePopoverClose"
      @show="openPopover('remind', $event)"
      v-if="isChatContext"
    >
      <Icon
        class="btn btn-icon"
        family="far"
        name="bolt"
        v-tooltip="{
          delay: { show: 1000, hide: 0 },
          offset: -5,
          content: $t('messages.actions-add-action')
        }"
      />
      <template slot="popover">
        <div @mouseleave="forcePopoverClose">
          <div class="dropdown-items">
            <button
              class="dropdown-item"
              type="button"
              @click="onClickAction(1)"
            >
              <a>{{ $t('messages.actions-add-action-remind') }}</a>
            </button>
          </div>
        </div>
      </template>
    </Popover>

    <Popover
      ref="popover-action"
      @auto-hide="forcePopoverClose"
      @hide-apply="forcePopoverClose"
      @show="openPopover('action', $event)"
      v-if="userId === message.user_id && isChatContext"
    >
      <Icon
        class="btn btn-icon"
        family="far"
        name="ellipsis-h"
        v-tooltip="{
          delay: { show: 1000, hide: 0 },
          offset: -5,
          content: 'More options'
        }"
      />
      <template slot="popover">
        <div @mouseleave="forcePopoverClose">
          <div class="dropdown-items">
            <button
              class="dropdown-item"
              type="button"
              @click="onEdit"
              v-if="message.content !== ''"
            >
              <Icon family="far" name="pen" /> {{ $t('messages.actions-edit') }}
            </button>
            <button class="dropdown-item" type="button" @click="onDelete">
              <Icon family="far" name="trash" />
              {{ $t('messages.actions-delete') }}
            </button>
          </div>
        </div>
      </template>
    </Popover>

    <div
      class="btn btn-icon"
      v-tooltip="{
        delay: { show: 1000, hide: 0 },
        offset: -5,
        content: $t('messages.actions-show-in-chat')
      }"
      @click="onJumpTo"
      v-if="isActionHistoryContext"
    >
      <Icon family="far" name="comment-alt-dots" />
    </div>
  </div>
</template>

<script>
import { EventBus } from 'airsend/event-bus';
import Icon from 'airsend/components/Icon.vue';
import Popover from 'airsend/components/Popover.vue';

export default {
  props: {
    message: {
      type: Object
    },
    userId: {
      type: Number
    },
    context: {
      type: String,
      default: 'chat',
      validator: function(value) {
        return ['chat', 'action-history'].indexOf(value) !== -1;
      }
    }
  },
  data() {
    return {
      current: '',
      reactions: ['👍', '😀', '❤️', '🤣', '🙏', '😲', '😭', '🤔']
    };
  },
  computed: {
    isChatContext() {
      return this.context === 'chat';
    },
    isActionHistoryContext() {
      return this.context === 'action-history';
    }
  },
  methods: {
    onClickAction(type) {
      this.$modal.show('action-create', {
        context: 'create',
        message: this.message
      });
      this.forcePopoverClose();
    },
    onReact(reaction) {
      this.$emit('reacted', {
        reaction: reaction,
        id: this.message.id,
        type: !(
          this.message.reactions[reaction] &&
          this.message.reactions[reaction].indexOf(this.userId) > -1
        )
      });
      this.forcePopoverClose();
    },
    onQuote() {
      this.$emit('quote', this.message);
    },
    onJumpTo() {
      this.$emit('jumpTo', this.message);
    },
    onDelete() {
      this.$emit('delete', this.message);
      this.forcePopoverClose();
    },
    onEdit() {
      this.$emit('edit', this.message);
      this.forcePopoverClose();
    },
    openPopover(type, e) {
      if (this.current !== type) {
        this.current = type;
      } else {
        this.current = '';
      }
    },
    forcePopoverClose() {
      if (this.current !== '') {
        this.$refs[`popover-${this.current}`] &&
          this.$refs[`popover-${this.current}`].hide();
      }
      this.current = '';
    }
  },
  watch: {
    current() {
      if (this.current == '')
        this.$refs && this.$refs.actions.classList.remove('show');
      else this.$refs.actions.classList.add('show');
    }
  },
  components: {
    Icon,
    Popover
  }
};
</script>
