<template>
  <div class="link-single">
    <div class="link-image">
      <ImageComponent />
    </div>
    <div class="link-body">
      <div class="title">
        <TextLoader />
      </div>
      <div class="description">
        <TextLoader :width="200 + Math.random() * 200" />
      </div>
    </div>
  </div>
</template>

<script>
import ImageComponent from 'airsend/components/ImageComponent';
import TextLoader from 'airsend/components/TextLoader';
import Icon from 'airsend/components/Icon';
export default {
  components: {
    ImageComponent,
    TextLoader,
    Icon
  },
  data() {
    return {
      isoptionsOpened: false,
      hoverActive: false,
      thumbError: false,
      favError: false
    };
  }
};
</script>

<style></style>
