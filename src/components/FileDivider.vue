<template>
  <div class="file-explorer-single file-explorer-single--divider">
    <div class="file-divider">
      <span>{{ $t(when) }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'file-divider',
  props: {
    when: {
      type: String
    }
  }
};
</script>
