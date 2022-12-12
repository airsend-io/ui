<template>
  <div class="meeting-audio"> 
    <MeetingAudio
      v-for="audio in audios"
      :consumer="audio"
      :output-device-id="settings.selectedAudioOutputDevice"
      :key="audio.id"
    />
  </div>
</template>
<script>
import MeetingAudio from './Audio';

export default {
  components: {
    MeetingAudio
  },
  computed: {
    audios() {
      return this.$store.getters['meeting/getAudioConsumers'];
    },
    settings() {
      return this.$store.state.meeting.settings;
    }
  }
};
</script>
