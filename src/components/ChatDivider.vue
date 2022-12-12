<template>
  <div class="chat-message chat-message--sticky">
    <div class="chat-divider">
      <span>{{
        parseTime(message.time).format($t('general.date-format'))
      }}</span>
    </div>
  </div>
</template>

<script>
import { parseTime } from 'airsend/utils';

export default {
  props: {
    message: {
      type: Object
    }
  },
  methods: {
    parseTime: parseTime
  },
  components: {}
};
</script>
