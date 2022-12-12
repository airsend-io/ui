<template>
  <div class="chat-message-row"
    ref="row"
    v-bind:class="{
      'chat-message-row--loading': message.sending,
      'chat-message-row--deleted': message.is_deleted,
      'chat-message-row--mentioned': (message.content && (message.content.search(`(user://${user.id})`) > -1 || message.content.search(`(user://all)`) > -1)),
      'chat-message-row--mine': (message.user_id === user.id),
      'chat-message-row--has-reactions': message.emoticons.length > 0,
      'chat-message-row--extension': message.is_extension,
      'chat-message-row--middle-extension': message.is_middle_extension,
      'chat-message-row--meta': isMetaOpen,
      'chat-message-row--highlighted': $route.query.highlight &&  message.id == $route.query.highlight
    }"
    :data-plain-text="`[${parseTime(message.created_on).format('YYYY-MM-DD hh:mm A')}] ${message.display_name}: ${message.plain_content}`"
    >
    <div class="chat-message-body">

      <div class="chat-message-content-author" :class="{[`chat-message-content-author--visible`]: !message.is_extension || isMetaOpen }"">
        <a v-if="!message.is_extension">{{message.display_name}}</a><small> <span v-if="!message.is_extension">-</span> <Icon family="far" name="pencil" v-if="message.is_edited && !message.is_deleted" /> {{parseTime(message.created_on).format("hh:mm A")}}</small>

        <Popover
          v-if="message.read_by && !message.sending"
          :disabled="(message.read_by.length === 0)"
          class="chat-message-read-by"
          @show="onOpenPopover('read-receipts')"
          >
            <div class="chat-message-read-by">
              <span v-if="channel.one_one && message.read_by.length === 1">{{$t('messages.seen')}}</span>
              <span v-else-if="message.read_by.length === channel.members.length-1">{{$t('messages.seen-by-everyone')}}</span>
              <span v-else-if="message.read_by.length > 0">{{$t(`messages.seen-by${(message.read_by.length > 1) ? '-plus' : ''}`, { count: message.read_by.length-1, userName: message.read_by[0].user_id === user.id ? $t('meeting.you') : message.read_by[0].display_name })}}</span>
            </div>
            <template slot="popover" >
              <div class="popover-people" v-if="currentPopover === 'read-receipts'" :options="{wheelPropagation:false}">
                <li class="popover-people-single" v-for="user in message.read_by" v-bind:key="user.user_id">
                  <Avatar :name="user.display_name" :user-id="user.user_id" :has-avatar="user.has_avatar" :cache="(user) ? user.updated_on_ts : 0" size="medium" />
                  <div class="popover-people-description">
                    {{user.display_name}}
                  </div>
                </li>
              </div>
            </template>
        </Popover>

      </div>

      <div class="chat-message-content" :class="{'chat-message-content--has-source': message.source && message.source === 'email'}" @click="toggleMessageMeta">
        <div class="fc-win" v-if="message.win"></div>

        <Icon family="fas" name="envelope" class="chat-message-content-source" v-if="message.source && message.source === 'email'" v-tooltip="{offset: -5, content: 'Sent via email'}" />

        <div class="chat-message-content-reply" v-if="message.parent_message" @click="onClickQuote">
          <Icon family="fad" name="quote-left" />
          <div class="chat-message-content-image" v-if="isWebImg(message.parent_message.content)"><img :src="message.parent_message.content" /></div>
          <div class="chat-message-content-reply-quote" v-if="!isWebImg(message.parent_message.content)" @click="onClickMessage" v-html="message.parent_message_rich_content"></div>
          <ChatMessageAttachments class="mt-2" :version="message.created_on_ts" :attachments="message.parent_message.files" v-if="message.parent_message.files && message.parent_message.files.length > 0" />
          <div class="chat-message-content-reply-author">{{message.parent_message.display_name}} - {{parseTime(message.parent_message.created_on).format("dddd, hh:mm A")}}</div>
        </div>

        <ChatMessageUnfurl :unfurl="message.unfurl" v-if="message.unfurl && !message.win && !isWebImg(message.content)" />
        <ChatMessageImages :version="message.created_on_ts" :messageId="message.id" :loading="message.sending" :images="message.images" v-if="message.images.length > 0" />

        <div class="chat-message-content-text" v-if="message.is_deleted">{{$t('messages.message-deleted')}}</div>
        <div class="chat-message-content-text" v-else-if="message.rich_content !== '' && !isWebImg(message.content)"  @click="onClickMessage" v-html="message.rich_content"></div>

        <div class="chat-message-content-image" v-if="isWebImg(message.content)">
          <a v-if="message.content.search('giphy.com') === -1" :href="message.content" target="_blank" >
            <img :src="message.content" /> 
          </a>
          
          <img v-else :src="message.content" /> 

          <div class="chat-message-content-image--giphy" v-if="message.content.search('giphy.com') > -1">
            <img :src="GiphyLogo" />
          </div>
        </div>
        <ChatMessageAttachments :version="message.created_on_ts" :loading="message.sending" :attachments="message.files" v-if="message.files.length > 0 && !isWebImg(message.content)" />
        <ul class="chat-message-content-reactions" v-if="message.emoticons.length > 0">
          <li v-for="(reaction, index) in message.reactions" :key="index" @click="(e)=>{e.stopPropagation()}">
            <Popover @show="onOpenPopover(index)">
              <a :class="isReactionPicked(reaction)">{{index}} <small v-if="reaction.length>1">{{reaction.length}}</small></a>
              <template slot="popover">
                <div class="popover-people" v-if="currentPopover === index" :options="{wheelPropagation:false}">
                  <li class="popover-people-single" v-for="uid in reaction" :key="uid" v-if="$store.getters['channels/getUserInChannel'](channel.id, uid)" :set="localUser = $store.getters['channels/getUserInChannel'](channel.id, uid)">
                    <Avatar :name="localUser.display_name" :user-id="localUser.id" :has-avatar="localUser.has_avatar" :cache="localUser.updated_on_ts" size="medium" />
                    <div class="popover-people-description">
                      {{$store.getters['channels/getUserInChannel'](channel.id, uid).display_name}}
                    </div>
                  </li>
                </div>
              </template>
            </Popover>
          </li>
        </ul>

      </div>

    </div>
    <ChatActions @reacted="onReact" @quote="onQuote" @jumpTo="onJumpTo" @delete="onDelete" @edit="onEdit" :message="message" :user-id="user.id" :context="context" v-if="!message.sending && !IS_READONLY && user.role.can('channel.message') && !message.is_deleted" />
  </div>
</template>

<script>

import _ from 'lodash';

import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';
import Popover from 'airsend/components/Popover.vue';
import ChatActions from 'airsend/components/ChatActions.vue';
import ChatMessageUnfurl from 'airsend/components/ChatMessageUnfurl.vue';
import ChatMessageAttachments from 'airsend/components/ChatMessageAttachments.vue';
import ChatMessageImages from 'airsend/components/ChatMessageImages.vue';
import GiphyLogo from 'airsend/assets/giphy.png';

import { parseMessageContent, parseTime, isWebImg } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

export default {
  props: {
    message: {
      type: Object
    },
    channel: {
      type: Object
    },
    context: {
      type: String,
      default: 'chat',
      validator: function (value) {
        return ['chat', 'action-history'].indexOf(value) !== -1;
      },
    },
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    },
    IS_READONLY() {
      return (this.$router.history.current.query.hash !== undefined || this.user.read_only === true)
    }
  },
  data() {
    return {
      isMetaOpen: false,
      currentPopover: null,
      GiphyLogo
    }
  },
  methods: {
    parseMessage: parseMessageContent,
    parseTime: parseTime,
    isReactionPicked(reaction) {
      return reaction.includes(this.user.id) 
        ? 'tooltip-target reaction-picked'
        : 'tooltip-target'
    },
    onOpenPopover(type) {
      this.currentPopover = type;
    },
    toggleMessageMeta() {
      this.isMetaOpen = !this.isMetaOpen;
    },
    onClickQuote() {
      EventBus.$emit('jump-to', { target: this.message.parent_message.message_id, channel: this.channel.id })
    },
    onReact({ reaction, type, id }) {

      this.$store.dispatch('channels/messageReact', {
        message_id: id,
        channel_id: this.channel.id,
        emoji_value: reaction,
        type: type
      })

    },
    onDelete({ id }) {
      this.$store.dispatch('channels/handleDeleteMessage', {
        message_id: id,
      });
    },
    onQuote(message) {
      this.$emit('quote', {
        ...message,
        content_rich: this.parseMessage(message.content, this.channel),
      });
    },
    onJumpTo(message) {
      this.$emit('jumpTo', message);
    },
    onEdit(message) {
      this.$emit('edit', message);
    },
    onClickMessage(e) {

      // handle mentions click
      if(e.target.tagName === 'SPAN' && e.target.classList.contains('mention')) {
        if(e.target.classList.contains('mention-action')){//click in action mention
          this.$modal.show('action-create', {context: 'view', id: e.target.dataset.mentionId});
        }
        else if(e.target.classList.contains('mention-user')){//click in user mention
          this.$modal.show('user-modal', this.channel.member[e.target.dataset.mentionId]);
        }
      }

      if(e.target.tagName === 'A') {

        const { target } = e;

        // if it's an internal link, browse locally
        if(target.href.indexOf('/u/') === -1 && ((target.hostname === window.location.hostname) || (window.isElectron && target.hostname === 'live.airsend.io'))) {

          e.preventDefault();
          e.stopPropagation();

          const url = new URL(target.href);
          this.$router.push(url.pathname);

        }

      }

    },
    isWebImg
  },
  components: {
    Icon,
    Avatar,
    Popover,
    ChatActions,
    ChatMessageUnfurl,
    ChatMessageAttachments,
    ChatMessageImages
  }
}
</script>
