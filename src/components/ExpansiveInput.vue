<template>
  <div class="expansive-input-wrapper" :class="{ ['is-mobile']: isMobile }">
    <div
      class="form-group form-group--search input-container"
      :class="{ ['is-searching']: isSearching && isMobile }"
    >
      <button
        type="button"
        class="btn btn-icon btn-sm search-btn"
        @click="isSearching = !isSearching"
      >
        <Icon family="far" name="search" />
      </button>
      <input
        ref="input"
        class="form-control form-control--rounded form-control--large"
        :class="{ ['is-searching']: isSearching }"
        :value="value"
        type="text"
        :placeholder="placeholder"
        @input="$emit('input', $event.target.value)"
      />
      <button
        type="button"
        class="btn btn-icon btn-sm close-btn"
        :class="{ ['is-searching']: isSearching }"
        @click="handleCloseButton"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('navbar.cancel-search-hint')
        }"
      >
        <Icon family="far" name="times" class="icon-close" />
      </button>
    </div>

    <div
      class="options-container"
      :class="{ ['is-searching']: isSearching && isMobile }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';

export default {
  data() {
    return {
      isSearching: false
    };
  },
  components: {
    Icon
  },
  props: {
    placeholder: {
      type: String,
      required: false
    },
    value: {
      type: String,
      required: false
    }
  },
  computed: {
    isMobile() {
      return this.$store.state.core.isMobile;
    }
  },
  methods: {
    handleCloseButton() {
      if (this.$props.value) {
        this.$emit('input', '');
      } else {
        this.isSearching = false;
      }
    },
    open() {
      this.$emit('open');
    },

    close() {
      this.$emit('close');
    }
  },
  watch: {
    isSearching(value) {
      if (value) {
        this.open();

        setTimeout(() => {
          this.$refs.input.focus();
        }, 350);
      } else {
        this.close();
      }
    }
  }
};
</script>

<style lang="scss">
.expansive-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;

  .input-container {
    .search-btn {
      left: 0.25rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .close-btn {
      right: 0.25rem;
      top: 50%;
      transform: translateY(-50%);
    }

    input {
      transition: all 0.4s ease;
      padding-left: 2.75rem;
    }
  }

  .options-container {
    overflow-x: hidden !important;

    button {
      margin: 0 0 0 16px !important;
    }

    button,
    span {
      transition: all 0.4s ease;
    }

    display: flex;
    align-items: center;
    transition: all 0.4s ease;
  }

  &.is-mobile {
    .input-container {
      margin-right: 32px;
      flex: 0 0 0px;
      transition: all 0.4s ease;

      &.is-searching {
        margin-right: 16px;
        flex: 0 0 calc(100% - 96px);
      }

      .close-btn {
        display: none;

        &.is-searching {
          display: initial;
        }
      }

      input:not(.is-searching) {
        min-width: 0 !important;
        visibility: hidden;
        padding: 0;
        opacity: 0;
        border-color: transparent !important;

        &::placeholder {
          visibility: hidden;
        }
      }
    }

    .options-container.is-searching {
      button {
        width: 20px !important;
        overflow: hidden;

        span {
          opacity: 0;
        }
      }
    }
  }
}
</style>
