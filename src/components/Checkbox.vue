<template>
  <label class="checkbox">
    <input
      type="checkbox"
      :id="id"
      :class="{ checked: checked }"
      :checked="checked"
      @input="onInput"
      @change="onChange"
      :disabled="disabled"
    />
    <span class="checkmark">
      <Icon family="fas" name="check" />
    </span>
  </label>
</template>

<script>
import Icon from 'airsend/components/Icon';

export default {
  props: {
    checked: Boolean,
    id: String,
    disabled: {
      default: false,
      type: Boolean
    }
  },
  components: {
    Icon
  },
  methods: {
    onInput(e) {
      this.checked = e.target.checked;
      this.$emit('input', e.target.checked);
    },
    onChange(e) {
      this.checked = e.target.checked;
      this.$emit('change', e.target.checked);
    }
  }
};
</script>
