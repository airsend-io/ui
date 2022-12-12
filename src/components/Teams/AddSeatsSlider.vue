<template>
  <div class="range-slider" id="range-slider"></div>
</template>

<script>
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

export default {
  name: 'Slider',
  props: {
    teamSeatsAvailable: {
      default: 0
    },
    teamSeatsUsed: {
      default: 0
    },
    value: {
      required: true
    }
  },
  computed: {
    teamSeatsMax() {
      return this.teamSeatsAvailable * 2;
    }
  },
  mounted() {
    var slider = document.getElementById('range-slider');
    noUiSlider.create(slider, {
      start: [this.teamSeatsUsed, this.teamSeatsAvailable, this.value],
      connect: [true, true, true, false],
      range: {
        min: [0],
        max: [this.teamSeatsMax]
      },
      step: 1
    });

    var classes = [
      'segment-taken-seats',
      'unused-seats-section',
      'segment-current-selection'
    ];

    var connect = slider.querySelectorAll('.noUi-connect');

    for (var i = 0; i < connect.length; i++) {
      connect[i].classList.add(classes[i]);
    }

    // To disable one handle
    var origins = slider.getElementsByClassName('noUi-origin');
    origins[0].setAttribute('disabled', true);
    origins[1].setAttribute('disabled', true);

    slider.noUiSlider.on('change', this.onChange);
  },
  methods: {
    onChange(values, handle) {
      console.log(values, handle);
      this.$emit('input', parseInt(values[2]));
    }
  }
};
</script>
