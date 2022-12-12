<template>
  <i
    class="inline-icon"
    :class="[family, `fa-${name}`, animation ? `fa-${animation}` : '']"
  ></i>
</template>
<script>
export default {
  name: 'Icon',
  props: {
    name: {
      type: String,
      default: 'none'
    },
    family: {
      type: String,
      default: 'far',
      validator: function(value) {
        return ['far', 'fas', 'fal', 'fab', 'fad'].indexOf(value) !== -1;
      }
    },
    animation: {
      type: String,
      default: '',
      validator: function(value) {
        return ['spin', 'pulse', ''].indexOf(value) !== -1;
      }
    }
  }
};
</script>
