<template>
  <div
    class="chat-fragment-typing"
    v-if="people && people.length > 0 && !channel.blocked_on"
  >
    <div class="typing-indicator-wrapper">
      <span v-if="people.length > 0 && people.length <= 2">
        {{
          $tc('channels.someone-is-typing', people.length, {
            userName: people[0],
            userName2: people[1]
          })
        }}
      </span>
      <span v-else-if="people.length > 2">
        {{
          $tc('channels.someone-is-typing-multiple', people.length - 2, {
            userName: people[0],
            userName2: people[1],
            count: people.length - 2
          })
        }}
      </span>

      <div class="chat-fragment-typing-indicator">
        <span class="indicator-ball indicator-ball1"></span>
        <span class="indicator-ball indicator-ball2 "></span>
        <span class="indicator-ball indicator-ball3"></span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    people: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    }
  }
};
</script>
