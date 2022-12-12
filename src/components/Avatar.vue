<template>
  <div
    @click="onPreview"
    class="avatar"
    v-bind:class="{
      [`avatar--has-image`]: this.hasAvatar,
      [`avatar--light`]: this.light,
      [`avatar--guest`]: this.isGuest
    }"
  >
    <div
      class="avatar-body"
      v-bind:class="{
        [`avatar--rounded`]: rounded,
        [`avatar--clickable`]: preview && this.image
      }"
    >
      <img :src="this.image" :alt="name" v-if="this.image" />
      <croppa
        v-model="imageCropper"
        ref="cropper"
        :canvas-color="canvasColor"
        :placeholder="''"
        :placeholder-font-size="20"
        :placeholder-color="'#fff'"
        :accept="'image/*'"
        :initial-size="initialSize"
        :prevent-white-space="true"
        :disable-scroll-to-zoom="true"
        @file-choose="handleCroppa"
        @new-image-drawn="onNewImage"
        @move="handleCroppa"
        @zoom="onZoom"
        :c="this.type === 'background' ? 8 : 2"
        v-if="editable"
      ></croppa>
      <Popover
        ref="image-options"
        class="avatar-edit"
        v-if="editable"
        v-tooltip="{
          delay: { show: 1000, hide: 0 },
          content: $t('settings.profile.change-profile-picture')
        }"
      >
        <span
          ><Icon
            family="far"
            :name="optionsCount > 0 ? 'ellipsis-h' : 'pencil-alt'"
        /></span>
        <template slot="popover">
          <div class="dropdown-items">
            <button
              class="dropdown-item"
              type="button"
              v-close-popover
              @click="chooseFile"
              v-if="editable"
            >
              <Icon family="far" name="upload" />
              <a>{{ $t('settings.profile.upload-profile-picture') }}</a>
            </button>
            <button
              class="dropdown-item"
              type="button"
              v-close-popover
              @click="discardChanges"
              v-if="editable && edited"
            >
              <Icon family="fas" name="undo" />
              <a>{{
                $t('settings.profile.discard-profile-picture-changes')
              }}</a>
            </button>
            <button
              class="dropdown-item"
              type="button"
              v-close-popover
              @click="onRemove"
              v-if="editable && removable && image"
            >
              <Icon family="far" name="trash" />
              <a>{{ $t('settings.profile.remove-profile-picture') }}</a>
            </button>
          </div>
        </template>
      </Popover>
      <!-- <div class="avatar-guest" v-if="isGuest" v-tooltip="{content: $t('teams.avatar-guest-tooltip')}">
        <span>{{$t('teams.avatar-guest')}}</span>
      </div> -->

      <span class="avatar-text">{{ initials }}</span>
      <slot></slot>
    </div>
    <span class="avatar-status" v-if="active"></span>
    <div
      class="avatar-guest"
      v-if="isGuest"
      v-tooltip="{ content: $t('teams.avatar-guest-tooltip') }"
    >
      <Icon family="fas" name="suitcase-rolling" />
      <Icon family="fas" name="suitcase-rolling" />
    </div>
    <input
      type="range"
      class="custom-range zoom-range"
      v-if="edited"
      @input="onSliderZoomChange"
      v-model="zoom.value"
      :min="zoom.SliderMin"
      :max="zoom.SliderMax"
      :step="0.01"
    />
  </div>
</template>
<script>
import Icon from './Icon';
import qs from 'query-string';
import store from 'store';
import Logo from 'airsend/assets/airsend-icon-color.svg';
import { EventBus } from 'airsend/event-bus.js';
import Popover from 'airsend/components/Popover';

export default {
  props: {
    name: {
      type: String,
      default: ''
    },
    preview: {
      type: Boolean,
      default: false
    },
    userId: {
      type: Number,
      default: 0
    },
    hasAvatar: {
      type: Boolean,
      default: false
    },
    isMeeting: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'small'
    },
    cache: {
      type: Number,
      default: 0
    },
    editable: {
      type: Boolean,
      default: false
    },
    removable: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: Boolean,
      default: true
    },
    light: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: ''
    },
    channelId: {
      type: Number,
      default: 0
    },
    privateOnly: {
      type: Boolean,
      default: false
    },
    isGuest: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      imageCropper: null,
      cropTimeout: null,
      zoomTimeout: null,
      canvasColor: this.type ? 'transparent' : '#0097C0',
      initialSize: this.type ? 'contain' : 'cover',
      edited: false,
      zoom: {
        value: null,
        min: 0,
        max: 0
      }
    };
  },
  computed: {
    // compute name initials
    initials: function() {
      if (!this.name) return;
      var names = this.name.split(' '),
        initials = names[0].substring(0, 1).toUpperCase();

      if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
      }
      return initials;
    },
    image: function() {
      const { hash } = this.$router.history.current.query;

      if (this.channelId && this.hasAvatar) {
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/channel.image.get?channel_id=${
          this.channelId
        }&channel_asset_type=${this.type}&token=${
          hash && !this.privateOnly ? hash : store.get('jwt')
        }&v=${this.cache}`;
      }
      if (this.hasAvatar) {
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/user.image.get?${qs.stringify({
          user_id: this.userId,
          image_class: this.size,
          token: hash && !this.privateOnly ? hash : store.get('jwt'),
          call_hash: this.isMeeting
            ? this.$router.history.current.params.hash
            : undefined,
          v: this.cache
        })}`;
      }
      return null;
    },
    optionsCount() {
      let options = 0;
      if (!this.editable) return options;
      if (this.edited) options++;
      if (this.removable && this.image) options++;
      return options;
    }
  },
  methods: {
    handleCroppa() {
      clearTimeout(this.cropTimeout);
      this.cropTimeout = setTimeout(() => {
        this.imageCropper.generateBlob(
          blob => {
            this.$emit(
              'changed',
              new File([blob], 'avatar.png', { type: 'image/png' })
            );
          },
          'image/png',
          this.type === 'background' ? 1 : 0.8
        ); // 80% compressed jpeg file
      }, 500);
    },
    onPreview() {
      if (this.preview && this.image) {
        EventBus.$emit(
          'file-preview',
          [
            {
              file: `${this.name}'s Avatar.jpg`,
              path: this.image,
              noBlob: true,
              noDownload: true,
              thumb: this.image
            }
          ],
          0
        );
      }
    },
    onNewImage() {
      // fix meta orientation
      let meta = this.imageCropper.getMetadata();
      meta.orientation = 1;
      this.imageCropper.applyMetadata(meta);

      this.zoom = {
        value: this.imageCropper.scaleRatio + this.imageCropper.scaleRatio / 2,
        SliderMin: this.imageCropper.scaleRatio,
        SliderMax: this.imageCropper.scaleRatio * 2
      };
      this.handleCroppa();
    },
    onSliderZoomChange(evt) {
      var increment = evt.target.value;
      this.imageCropper.scaleRatio = +increment;
    },
    onZoom() {
      this.zoom.value = this.imageCropper.scaleRatio;
      this.handleCroppa();
    },
    chooseFile() {
      this.$refs.cropper.chooseFile();
    },
    discardChanges() {
      this.$refs.cropper.refresh();
      this.edited = false;
      this.$emit('revertChanges');
    },
    onRemove() {
      this.$emit('removeImage');
    }
  },
  components: {
    Icon,
    Logo,
    Popover
  },
  watch: {
    'imageCropper.img'(image) {
      if (image) {
        this.edited = true;
      }
    }
  }
};
</script>
