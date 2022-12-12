import Tribute from 'tributejs';

const VueTribute = {
  name: 'vue-tribute',
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  watch: {
    options: {
      immediate: false,
      deep: true,
      handler() {
        if (this.tribute) {
          this.$nextTick(() => {
            this.tribute.detach(this.element);
            this.tribute = new Tribute(this.options);
            this.tribute.attach(this.element);
            this.element.tributeInstance = this.tribute;
          });
        }
      }
    }
  },
  mounted() {
    if (typeof Tribute === 'undefined') {
      throw new Error('[vue-tribute] cannot locate tributejs!');
    }

    this.element = this.$slots.default[0].elm;

    this.tribute = new Tribute(this.options);

    this.tribute.attach(this.element);

    this.element.tributeInstance = this.tribute;

    this.element.addEventListener('tribute-replaced', e => {
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
    });

    this.element.addEventListener('tribute-active-true', () => {
      this.$emit('toggled', true);
    });

    this.element.addEventListener('tribute-active-false', () => {
      this.$emit('toggled', false);
    });
  },
  beforeDestroy() {
    if (this.tribute) {
      this.tribute.detach(this.element);
    }
  },
  render(h) {
    return h(
      'div',
      {
        staticClass: 'v-tribute'
      },
      this.$slots.default
    );
  }
};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.component(VueTribute.name, VueTribute);
}

export default VueTribute;
