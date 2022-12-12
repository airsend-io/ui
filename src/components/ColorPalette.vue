<template>
  <div class="color-palette" :class="{ ['disabled']: disabled }">
    <div
      class="color-item"
      v-for="colorHex in items"
      :key="colorHex"
      :style="{ 'background-color': colorHex }"
      :class="{ selected: value === colorHex }"
      @click="disabled ? () => {} : onSelect(colorHex)"
    ></div>
    <Popover
      v-tooltip="{
        delay: { show: 1000, hide: 0 },
        content: 'add a new color'
      }"
      offset="5"
      popoverClass="no-padding light-background"
      :disabled="disabled"
    >
      <div class="color-item new-color"></div>
      <template slot="popover">
        <Chrome v-model="colorToAdd" />
        <button class="my-2 btn btn-primary" @click="onAdd" v-close-popover>
          Add
        </button>
      </template>
    </Popover>
  </div>
</template>

<script>
import { Photoshop, Chrome } from 'vue-color';
import Popover from 'airsend/components/Popover';

export default {
  components: {
    Photoshop,
    Chrome,
    Popover
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onSelect(color) {
      this.$emit('input', color);
    },
    onAdd() {
      this.$emit('onAddColor', this.colorToAdd.hex8);
    }
  },
  data() {
    return {
      colorToAdd: '#194d33'
    };
  }
};
</script>
