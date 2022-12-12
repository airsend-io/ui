<template>
  <div class="toggle-switch" :class="{ ['loading']: loading }">
    <input
      type="checkbox"
      :id="uuid"
      @input="e => onInput(e.target.checked)"
      :checked="value"
    />
    <label :for="uuid" class="slider round"><span></span></label>
  </div>
</template>

<script>
//Refference: https://www.w3schools.com/howto/howto_css_switch.asp

import { v1 as uuid } from 'uuid';
export default {
  props: {
    value: {
      required: true,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      uuid: ''
    };
  },
  created() {
    this.uuid = uuid();
  },
  methods: {
    onInput(value) {
      this.$emit('input', value);
    }
  }
};
</script>

<style></style>
