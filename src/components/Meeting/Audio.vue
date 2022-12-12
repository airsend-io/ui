<template>
  <audio ref="audio" autoplay />
</template>
<script>
export default {
  props: {
    consumer: {
      type: Object,
      default: () => {}
    },
    outputDeviceId: {
      type: String,
      default: 'default'
    }
  },
  watch: {
    consumer: {
      deep: true,
      handler() {
        this.setTracks();
      }
    },
    outputDeviceId() {
      this.setOutputDevice();
    }
  },
  mounted() {
    this.setTracks();
  },
  methods: {
    async setTracks() {
      const stream = new MediaStream();
      stream.addTrack(this.consumer.track);
      this.$refs.audio.srcObject = stream;
      this.$refs.audio.oncanplay = () => {
        /*this.$refs.audio.play();*/
      };

      this.$refs.audio.volume = this.consumer.remotelyPaused ? 0 : 1;

      this.setOutputDevice();
    },
    setOutputDevice() {
      if (
        this.outputDeviceId &&
        typeof this.$refs.audio.setSinkId === 'function'
      ) {
        this.$refs.audio.setSinkId(this.outputDeviceId);
      }
    }
  }
};
</script>
