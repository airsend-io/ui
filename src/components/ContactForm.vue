<template>
  <div class="contact-form-config">
    <Loader :loading="loading" full />

    <div class="form-group form-section">
      <div class="row">
        <div class="col">
          <h4>{{ $t('settings.contact-form.creation-title') }}</h4>
          <p v-html="$t('settings.contact-form.creation-description')"></p>
        </div>
        <div class="col-md-3" v-if="!(contactForm && contactForm.id)">
          <button
            class="btn btn-link mt-md-3"
            type="button"
            @click="createForm"
          >
            <Icon name="plus" />
            {{ $t('settings.contact-form.creation-button') }}
          </button>
        </div>
        <div class="col-md-12" v-else>
          <hr />
          <h4>{{ $t('settings.contact-form.usage-title') }}</h4>
          <p>{{ $t('settings.contact-form.usage-step-1') }}</p>

          <div class="row">
            <div class="col-md-9">
              <div
                class="code-wrapper"
                id="script-container"
                @click="copyScript"
              >
                <div class="copy-control">
                  {{
                    copied
                      ? $t('settings.contact-form.code-copied')
                      : $t('settings.contact-form.code-copy')
                  }}
                </div>
                <code>
                  &lt;div class="airsend-contact-src" data-airsend-form-hash="{{
                    contactForm.form_hash
                  }}" data-airsend-form-color="{{ themeColor }}"
                  data-airsend-form-id="{{ contactForm.id }}"&gt;&lt;/div&gt;
                  <br />
                  &lt;script src="{{ linkUrl }}" defer&gt;&lt;/script&gt;
                </code>
              </div>
              <p>{{ $t('settings.contact-form.usage-step-2') }}</p>
              <br />
              <p>{{ $t('settings.contact-form.usage-step-3') }}</p>
            </div>
            <div class="col-md-3">
              <button
                class="btn btn-link mx-sm-2 mt-md-3"
                type="button"
                @click="copyScript"
              >
                <Icon name="copy" />
                {{ $t('settings.contact-form.button-copy') }}
              </button>
              <button
                class="btn btn-link mx-sm-2"
                type="button"
                @click="deleteForm"
              >
                <Icon name="trash-alt" />
                {{ $t('settings.contact-form.button-delete') }}
              </button>
            </div>
            <hr />
            <div class="col-md-12">
              <h4>{{ $t('settings.contact-form.theme-color') }}</h4>
              <v-input-colorpicker v-model="themeColor" />
            </div>
            <hr />
            <div class="col-md-9">
              <h4>{{ $t('settings.contact-form.submission-title') }}</h4>
              <div
                class="form-group text-center"
                v-if="responseMessage !== null"
              >
                <textarea
                  class="form-control"
                  v-model="responseMessage"
                ></textarea>
              </div>
            </div>
            <div class="col-md-3">
              <button
                class="btn btn-link mx-sm-2 mt-md-3"
                type="button"
                @click="saveForm"
              >
                <Icon name="copy" /> {{ $t('general.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Checkbox from 'airsend/components/Checkbox.vue';
import Loader from 'airsend/components/Loader.vue';
import InputColorPicker from 'vue-native-color-picker';

export default {
  components: {
    Modal,
    Loader,
    Icon,
    Checkbox,
    'v-input-colorpicker': InputColorPicker
  },
  data() {
    return {
      copied: false,
      responseMessage: 'Thank you',
      themeColor: '#0097C0',
      linkUrl:
        window.origin.includes('live.airsend.io') ||
        window.origin.includes('file://')
          ? 'https://live.airsend.io/embed/contactform.js'
          : `${window.origin}/embed/contactform.dev.js`
    };
  },
  computed: {
    contactForm() {
      return this.$store.state.core.contactForm;
    },
    loading() {
      return (
        this.$store.state.loading['core/getContactForm'] ||
        this.$store.state.loading['core/createContactForm'] ||
        this.$store.state.loading['core/updateContactForm'] ||
        this.$store.state.loading['core/deleteContactForm']
      );
    }
  },
  async mounted() {
    let formDetails = await this.$store.dispatch('core/getContactForm');
    this.updateForm();
  },
  methods: {
    updateForm() {
      this.responseMessage = this.contactForm.confirmation_message;
      if (this.contactForm.color)
        this.themeColor = '#' + this.contactForm.color;
    },
    copyScript() {
      let temp = document.createElement('textarea');
      document.body.appendChild(temp);
      temp.value = document.querySelector('code').innerText;
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);

      this.copied = true;
      setTimeout(() => (this.copied = false), 5000);
    },
    async createForm() {
      await this.$store.dispatch('core/createContactForm');
      this.updateForm();
    },
    async saveForm() {
      let data = {
        color: this.themeColor.substring(1),
        confirmation_message: this.responseMessage,
        form_id: this.contactForm.id
      };
      await this.$store.dispatch('core/updateContactForm', data);
    },
    deleteForm() {
      let data = {
        form_id: this.contactForm.id
      };
      this.$store.dispatch('core/deleteContactForm', data);
    }
  }
};
</script>
