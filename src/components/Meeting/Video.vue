<template>
  <video ref="video" autoplay playsInline muted />
</template>
<script>
export default {
  props: {
    consumer: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    consumer() {
      this.setTracks();
    }
  },
  mounted() {
    this.setTracks();
  },
  methods: {
    async setTracks() {
      console.log('Setting track');

      const stream = new MediaStream();

      stream.addTrack(this.consumer.track);

      this.$refs.video.srcObject = stream;

      this.$refs.video.oncanplay = () => {
        console.log('Video can play');
        //this.$refs.video.requestPictureInPicture();
      };

      console.log('Track done!');
    }
  }
};
</script>
