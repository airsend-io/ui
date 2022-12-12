<template>
  <a class="chat-message-unfurl" :href="unfurl.url" target="_blank">
    <div
      class="unfurl-cover"
      v-if="unfurl.images && unfurl.images[0] && unfurl.images[0][0]"
    >
      <img :src="unfurl.images[0][0].url" :alt="unfurl.title" />
    </div>
    <h4 class="unfurl-title" v-if="unfurl.title">{{ unfurl.title }}</h4>
    <p class="unfurl-description" v-if="unfurl.description">
      {{ unfurl.description }}
    </p>
    <div class="unfurl-footer">
      <img class="unfurl-favicon" :src="unfurl.favicon" v-if="unfurl.favicon" />
      <p class="unfurl-url">{{ unfurl.url }}</p>
    </div>
  </a>
</template>

<script>
export default {
  props: {
    unfurl: {
      type: Object
    }
  },
  methods: {},
  components: {}
};
</script>
