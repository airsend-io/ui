<template>
  <div class="team-start-free-trial-banner">
    <div class="content">
      <h2>Upgrade to <strong>AirSend Teams!</strong></h2>
      <h3>Easily manage your channels across teams</h3>

      <div class="price">
        <div class="value">
          <span>$</span>
          <span class="large">{{ subscriptionPrice.large }}</span>
          <span>.{{ subscriptionPrice.rest }}</span>
        </div>
        <p>per user / month</p>
      </div>

      <button class="btn btn-primary">START FREE TRIAL</button>
    </div>

    <TeamsBannerBike class="team-banner bike" />
    <TeamsBannerDecoration class="team-banner decorations" />
    <TeamsBannerWave class="team-banner wave" />
  </div>
</template>

<script>
import TeamsBannerBike from 'airsend/assets/team-banner-bike.svg';
import TeamsBannerDecoration from 'airsend/assets/team-banner-decorations.svg';
import TeamsBannerWave from 'airsend/assets/team-banner-wave.svg';

export default {
  components: {
    TeamsBannerBike,
    TeamsBannerDecoration,
    TeamsBannerWave
  },
  computed: {
    subscriptionPrice() {
      const [large, rest] = '4.99'.split('.');

      return { large, rest };
    }
  }
};
</script>

<style lang="scss" scoped>
.team-start-free-trial-banner {
  position: relative;
  height: 232px;
  overflow-x: hidden;
  background: #323e53;

  @media screen and (max-width: 630px) {
    .content {
      width: 100% !important;
      right: 0;
      left: 0 !important;
      padding: 0 37px;
    }
  }

  .content {
    position: absolute;
    left: 37px;
    top: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: fit-content;
    height: 100%;
    justify-content: center;
    align-items: center;

    h2 {
      font-style: italic;
      font-weight: 400;
      font-size: 20px;
    }

    h3 {
      font-size: 12px;
      font-weight: 400;
    }

    .price {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .value {
        display: flex;
        align-items: center;
        color: #a1cc3a;

        span:not(.large) {
          transform: translateY(-0.5rem);
          font-weight: 700;
          font-size: 12px;
        }

        span.large {
          font-size: 40px;
          font-weight: 700;
        }
      }

      p {
        font-weight: 700;
        font-size: 10px;
        color: #ffffff;
      }
    }

    button {
      text-transform: uppercase;
      text-align: center;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 1px;
      max-width: 100%;
      margin: 0;
    }
  }

  .team-banner {
    position: absolute;

    @media screen and (max-width: 630px) {
      &.bike {
        display: none;
      }
    }

    &.bike {
      bottom: 19px;
      right: 5px;
      z-index: 1;
    }

    &.decorations {
      top: 10px;
      right: 10px;
    }

    &.wave {
      right: 0;
      bottom: 0;
    }
  }
}
</style>
