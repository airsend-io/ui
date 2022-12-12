<template>
  <div class="link-single link-single--divider">
    <div class="link-divider">
      <span>{{ $t(when) }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    when: {
      type: String
    }
  }
};
</script>
