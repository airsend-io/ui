<template>
  <div class="chat-loader">
    <SingleMessageLoader />
    <SingleMessageLoader />
    <SingleMessageLoader />
    <SingleMessageLoader />
    <SingleMessageLoader />
  </div>
</template>
<script>
import SingleMessageLoader from './Channel/Chat/SingleMessageLoader.vue';

export default {
  props: {
    loading: {
      type: Boolean,
      default: true
    }
  },
  components: {
    SingleMessageLoader
  }
};
</script>
