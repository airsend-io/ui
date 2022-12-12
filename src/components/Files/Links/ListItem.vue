<template>
  <a
    class="link-single"
    :class="{ ['link-single--optionsOpened']: isoptionsOpened }"
    @mouseover="hoverActive = true"
    @mouseleave="hoverActive = false"
    @click="onClickLink"
    :href="item.url_data.url"
    target="_blank"
  >
    <div class="link-image">
      <ImageComponent
        :src="thumb"
        v-if="thumb && !thumbError"
        :key="thumb"
        @error="thumbError = true"
      />
      <ImageComponent
        :src="item.url_data.favicon"
        v-else-if="item.url_data.favicon && !favError"
        :key="item.url_data.favicon"
        @error="favError = true"
      />
      <div class="img-wrapper" v-else>
        <Icon family="fas" name="link" />
      </div>
    </div>
    <div class="link-body">
      <div class="title">
        <span>{{ itemTitle }}</span>
      </div>
      <div class="description">
        <span v-if="messageContent"
          >{{ messageAuthor }}: {{ messageContent }}</span
        >
        <span v-else>{{
          $t('links.author-sent-link', { display_name: messageAuthor })
        }}</span>
      </div>
      <div class="link">
        <img
          v-if="item.url_data.favicon && !favError"
          class="favicon"
          :src="item.url_data.favicon"
          alt=""
          @error="favError = true"
        />
        <span>{{ item.url_data.url }}</span>
      </div>
    </div>
    <Popover
      @apply-hide="isoptionsOpened = false"
      @show="isoptionsOpened = true"
      v-if="hoverActive || isoptionsOpened"
    >
      <button
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('general.more-options')
        }"
        class="btn btn-icon more-options"
      >
        <Icon family="fal" name="ellipsis-h" />
      </button>
      <template slot="popover">
        <div class="dropdown-items">
          <button
            v-close-popover
            class="dropdown-item"
            type="button"
            @click="onJumpTo(item.message)"
          >
            <Icon family="fal" name="comment-alt-dots" />
            {{ $t('links.more-options.item-show-in-chat') }}
          </button>
          <button
            v-close-popover
            class="dropdown-item"
            type="button"
            @click="openLink(item.url_data.url)"
          >
            <Icon family="fal" name="link" />
            {{ $t('links.more-options.item-open-link') }}
          </button>
        </div>
      </template>
    </Popover>
  </a>
</template>

<script>
import ImageComponent from 'airsend/components/ImageComponent';
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';

import { parseMessageContent, isValidURL } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  components: {
    ImageComponent,
    Popover,
    Icon
  },
  data() {
    return {
      isoptionsOpened: false,
      hoverActive: false,
      thumbError: false,
      favError: false
    };
  },
  computed: {
    thumb() {
      if (
        this.item.url_data.images &&
        this.item.url_data.images.length > 0 &&
        this.item.url_data.images[0][0]
      ) {
        return this.item.url_data.images[0][0].url;
      }
      return null;
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    messageContent() {
      if (this.isValidURL(this.item.message.content)) return null;

      return parseMessageContent(this.item.message.content, this.channel, true);
    },
    messageAuthor() {
      return this.$store.getters['channels/getUserInChannel'](
        this.channel.id,
        this.item.message.user_id
      ).display_name;
    },
    itemTitle() {
      return this.item.url_data.title
        ? this.item.url_data.title
        : this.getUrlDomain(this.item.url_data.url);
    }
  },
  methods: {
    openLink(url) {
      window.open(url);
    },
    onClickLink(e) {
      // prevent browsing when clicking popover
      if (e.target.className.includes('btn')) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    getUrlDomain(url) {
      return new URL(url).host.replace('www.', '') || '';
    },
    onJumpTo(message) {
      EventBus.$emit('jump-to', {
        target: message.id,
        channel: message.channel_id
      });
      this.$router.push({
        query: { ...this.$route.query, highlight: message.id }
      });
    },
    isValidURL,
    parseMessageContent
  },
  watch: {
    'item.url_data.favicon'() {
      this.favError = false;
    },
    thumb() {
      this.thumbError = false;
    }
  }
};
</script>

<style></style>
