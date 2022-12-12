<template>
  <div class="form-group col-sm" :class="{ [`is-invalid`]: errors[id] }">
    <label v-if="label" :class="{ [`is-optional`]: optional }" :for="id"
      >{{ label }}{{ required ? '*' : '' }}
      <Icon
        v-if="hint"
        v-tooltip="{ content: hint }"
        class="hint"
        name="info-circle"
        family="fas"
      />
      <small v-if="optional">{{ $t('Optional') }}</small></label
    >
    <slot name="header" />

    <div
      class="input-group"
      :class="{
        ['borderless']: borderless,
        ['rounded']: rounded,
        [`input-group-${formSize}`]: formSize,
        [`input-group-file`]: type === 'file'
      }"
      v-on="type === 'file' ? { click: onFocusUpload } : {}"
    >
      <div
        v-for="(prepend, index) in prepends"
        :key="index + '-prepend'"
        class="input-group-prepend"
        @click="prepend.action ? prepend.action() : defaultAction()"
      >
        <Icon
          :ref="prepend.ref ? prepend.ref : `${prepend.icon}-icon-ref`"
          :class="
            `input-group-text ${prepend.iconBold ? 'font-weight-bold' : ''} ${
              prepend.action ? 'cursor-pointer' : ''
            } border-0`
          "
          family="fal"
          :name="prepend.icon"
          :animation="prepend.animation"
        />
      </div>
      <div
        v-if="$slots['input-prepend']"
        class="input-group-prepend"
        @click="addFocus"
      >
        <slot name="input-prepend" />
      </div>
      <textarea
        :id="id"
        :ref="id"
        :type="type"
        class="form-control border-0"
        :class="inputClass"
        :value="type !== 'file' ? value : ''"
        :accept="accept"
        :placeholder="placeholder"
        :aria-label="placeholder"
        :required="required"
        :aria-required="required"
        :autocomplete="autoComplete ? 'on' : 'off'"
        :disabled="disabled"
        :readonly="readonly"
        @focus="onFocus"
        @blur="onBlur"
        @keyup="$emit('keyup', $event)"
        @keydown="$emit('keydown', $event)"
        @input="updateValue"
        @click="defaultAction"
        @copy="onCopy"
      />
      <div
        v-if="type === 'file' && currentSelection.length > 0"
        class="files-selection"
      >
        {{ currentSelection[0].name }}
      </div>
      <div
        v-if="$slots['input-append']"
        class="input-group-append"
        @click="addFocus"
      >
        <slot name="input-append" />
      </div>
      <div
        v-for="(append, index) in appends"
        :key="index + '-append'"
        tabindex="0"
        class="input-group-append"
        popover
        @click="append.action ? append.action() : defaultAction()"
        @keydown.enter.prevent="
          append.action ? append.action() : defaultAction()
        "
        @keydown.space.prevent="
          append.action ? append.action() : defaultAction()
        "
      >
        <Icon
          :ref="append.ref ? append.ref : `${append.icon}-icon-ref`"
          :class="
            `input-group-text  ${append.iconBold ? 'font-weight-bold' : ''}  ${
              append.action ? 'cursor-pointer' : ''
            } border-0`
          "
          :title="append.title"
          family="fal"
          :name="append.icon"
        />
      </div>
      <div v-if="type === 'file'" class="input-group-append">
        <button
          v-if="currentSelection.length > 0"
          class="btn btn-cancel"
          type="button"
          @click="onCancelUpload"
          @focus="onFocus"
        >
          <Icon family="fas" name="times" />
        </button>
        <button
          v-else
          class="btn btn-upload"
          type="button"
          @click="onFocusUpload"
          @focus="onFocus"
        >
          {{ $t('Upload') }}
        </button>
      </div>
    </div>

    <small
      v-if="errors[id]"
      class="form-text text-danger"
      v-html="errors[id].message"
    ></small>
    <small v-else-if="description" class="form-text">{{ description }}</small>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';

import { v4 as uuid } from 'uuid';

export default {
  components: {
    Icon
  },
  props: {
    id: {
      type: String,
      default: uuid()
    },
    type: {
      default: 'text',
      type: String
    },
    value: { type: [String, Number], default: '' },
    description: { type: String, default: '' },
    label: { type: String, default: '' },
    accept: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    inputClass: { type: String, default: '' },
    errors: {
      type: Object,
      default: () => {
        return {};
      }
    },
    focus: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    // if enabled will strictly show the optional message
    optional: {
      type: Boolean,
      default: false
    },
    autoComplete: {
      type: Boolean,
      default: false
    },
    appends: {
      type: Array,
      default: () => []
    },
    prepends: {
      type: Array,
      default: () => []
    },
    formSize: {
      type: String,
      default: '',
      validator: formSize => {
        return ['sm', 'lg', ''].includes(formSize);
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    hint: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    },
    // auto select text when focusing input
    autoSelect: {
      type: Boolean,
      default: false
    },
    borderless: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentSelection: []
    };
  },
  watch: {
    // watch focus to programmatically focus again
    focus(isEnabled) {
      if (isEnabled && this.id) {
        setTimeout(() => {
          this.$refs[this.id].focus();
        }, 200);
      }
    }
  },
  mounted() {
    if (this.focus && this.id) {
      setTimeout(() => {
        if (this.$refs[this.id]) this.$refs[this.id].focus();
      }, 200);
    }

    let el = this.$refs[this.id];
    if (el) {
      var offset = el.offsetHeight - el.clientHeight;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + offset + 'px';
    }
  },
  methods: {
    updateValue: function(e) {
      if (this.type === 'file') {
        const items = e.target.files;
        let files = [];

        // go on each item
        for (let i = 0; i < items.length; i++) {
          const entry =
            items[i] instanceof DataTransferItem
              ? items[i].webkitGetAsEntry()
              : items[i];

          if (entry.isFile || entry instanceof File) {
            files.push(entry);
          }
        }

        this.currentSelection = files;
        this.$emit('input', files);
      } else {
        let el = this.$refs[this.id];

        var offset = el.offsetHeight - el.clientHeight;

        el.style.height = 'auto';
        el.style.height = el.scrollHeight + offset + 'px';

        this.$emit('input', e.target.value);
      }
    },
    async defaultAction() {
      this.$emit('click');
    },
    onFocus(e) {
      this.$emit('focus');
      if (this.autoSelect) {
        e.target.select();
      }
    },
    onCopy(e) {
      this.$emit('copy', e);
    },
    addFocus() {
      this.$refs[this.id].focus();
    },
    onBlur() {
      this.$emit('blur');
    },
    onFocusUpload(e) {
      e.stopPropagation();
      // if it's a button click
      if (
        e.target.className.indexOf('btn-upload') > -1 &&
        e.target.className.indexOf('btn-cancel') === -1
      ) {
        this.$refs[this.id].click();
        // else if it's the wrapper
      } else if (e.target.getElementsByClassName('btn-upload')[0]) {
        e.target.getElementsByClassName('btn-upload')[0].focus();
        e.target.getElementsByClassName('btn-upload')[0].click();
      }
    },
    onCancelUpload() {
      this.currentSelection = [];
      this.$emit('input', null);
    }
  }
};
</script>
<style lang="scss" scoped>
.input-group {
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  textarea.form-control {
    box-sizing: border-box;
    min-height: 38px;
    max-height: 200px;
  }
  &.input-group-file {
    cursor: pointer;
    input {
      opacity: 0;
      display: none;
      padding: 0.2rem 0;
    }
    .files-selection {
      padding: 0.35rem 0.75rem;
      position: relative;
      flex: 1 1 0%;
      min-width: 0;
      margin-bottom: 0;
      color: var(--text-medium);
      height: auto;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .input-group-append {
      margin-left: auto;
    }
    .btn {
      min-width: auto;
      padding: 0.32rem 1rem;
      margin-left: auto !important;
      box-shadow: none;
      &.btn-upload {
        color: var(--color-primary);
      }
      &.btn-cancel .inline-icon {
        color: var(--text-medium);
      }
    }
  }
}

label.is-optional {
  display: flex;
  align-items: center;
  small {
    font-size: 0.7rem;
    font-weight: 500;
    margin-left: auto;
    color: var(--text-light);
  }
}
.inline-icon.hint {
  margin-left: 0.5rem;
  color: var(--color-primary);
}

.input-group-text {
  background-color: transparent;
  padding: auto 2px !important;
}
.has-append {
  border-right: 0;
}
.has-prepend {
  border-left: 0;
}

input:focus {
  outline: none;
  box-shadow: none !important;
  border-color: var(--border-color);
}
.input-group {
  transition: all 0.2s ease;
}
.input-group:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem var(--color-primary--shadow);
}
.inline-icon {
  margin: auto;
  font-size: 12px;
  color: #8a94a6;
  align-items: center !important;
}
.cursor-pointer {
  cursor: pointer;
}
.form-group {
  box-sizing: border-box;
}
.borderless:not(:focus) {
  border: transparent;
  input {
    background: unset;
  }
}
.rounded {
  border-radius: 25px !important;
  input {
    border-radius: 25px;
  }
}
input[type='password']::-ms-reveal,
input[type='password']::-ms-clear {
  display: none;
}
</style>
