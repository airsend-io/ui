<template>
  <div
    class="announcement-content wiki-content"
    style="white-space: pre-wrap"
    ref="announcement"
    v-html="displayContent"
  ></div>
</template>

<script>
import { markdownToHtml } from 'airsend/utils';

export default {
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  computed: {
    displayContent() {
      const { announcements } = this.team;
      return announcements && announcements !== ''
        ? markdownToHtml(announcements, '', true)
        : '';
    }
  }
};
</script>

<style></style>
