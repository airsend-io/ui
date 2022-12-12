<template>
  <Modal
    name="team-create"
    title="Create New Team"
    theme="noPadding"
    className="new-team"
    @before-open="beforeOpen"
    @opened="onOpen"
  >
    <Loader full :loading="loading" />
    <div v-if="page === 'team-creation'" class="team-creation">
      <TeamReadMore />

      <form novalidate="true" @submit.prevent.stop="onSubmit" class="px-5 py-4">
        <div v-if="typeof errors === 'string'" class="alert alert-danger">
          {{ errors }}
        </div>

        <div class="form-group" :class="{ [`is-invalid`]: errors['name'] }">
          <label for="team_name" class="mb-2">{{
            $t('teams.team-name')
          }}</label>
          <input
            id="team_name"
            ref="team_name"
            v-model="form.name"
            type="team_name"
            class="form-control"
            placeholder
            autofocus
          />
          <small v-if="errors['name']" class="form-text text-danger">{{
            $t(errors['name'].message, errors['name'].meta)
          }}</small>
        </div>

        <hr class="my-4" />

        <div class="form-group text-center">
          <button
            class="btn btn-primary btn-rounded mx-2"
            :class="{ disabled: this.form.name === '' }"
          >
            {{ $t('teams.forms.create-team') }}
          </button>

          <button
            class="btn btn-primary btn-ghost mx-2"
            type="button"
            @click="$modal.hide('team-create')"
          >
            {{ $t('general.cancel') }}
          </button>
        </div>
      </form>
    </div>

    <div class="team-billing" v-if="page === 'team-billing'">
      <div class="team-billing-header">
        <div class="team-billing-title">
          <h2>Airsend Teams</h2>
          <a href="#">Learn more</a>
        </div>
        <ul>
          <li v-if="isFreeTrialAvailable">30 days free trial</li>
          <li>
            $ 4.99 per user, per month, minimum 5 users after the test period
          </li>
        </ul>

        <div class="seats-slider">
          <div class="seats-quantity">
            <h3>{{ seats }}</h3>
            <span>seats</span>
          </div>
          <Slider
            v-model="seats"
            :teamSeatsUsed="teamSeatsUsed"
            :teamSeatsAvailable="teamSeatsAvailable"
          />
        </div>

        <div class="seats-legend" v-if="teamSeatsUsed || teamSeatsAvailable">
          <div class="legend-item taken-section">
            Taken seats ({{ teamSeatsUsed }})
          </div>
          <div class="legend-item unused-seats-section">
            Unused seats ({{ teamSeatsUnused }})
          </div>
          <div class="legend-item new-seats-section">
            New seats ({{ teamSeatsNew }})
          </div>
        </div>

        <div class="subscription-types">
          <div
            class="subscription-option"
            :class="{ active: activePlan === 'montly' }"
            @click="activePlan = 'montly'"
          >
            <Checkbox :checked="activePlan === 'montly'" />
            <div class="option-text">
              <h3>Monthly</h3>
              <span>Pay montly, cancel anytime</span>
            </div>
            <div class="option-value">
              <h4>$ {{ montlyPrice }}</h4>
              <span>per month</span>
            </div>
          </div>

          <div
            class="subscription-option"
            :class="{ active: activePlan === 'yearly' }"
            @click="activePlan = 'yearly'"
          >
            <Checkbox :checked="activePlan === 'yearly'" />
            <div class="option-text">
              <h3>Yearly</h3>
              <span>Save <b>10%</b> by paying early</span>
            </div>
            <div class="option-value">
              <h4>$ {{ yearlyPrice }}</h4>
              <span>per year</span>
            </div>
          </div>

          <small class="subscription-info-text"
            >* This billing includes only new seats.
          </small>
        </div>

        <hr />

        <div class="billing">
          <div v-if="availableCreditCards" class="billing-saved-credit-card">
            <span
              >Proceed with <b>{{ activePaymentMethod }}</b></span
            >
            <Popover>
              <button class="btn btn-link">Choose payment method</button>
              <template slot="popover">
                <div class="dropdown-items">
                  <button
                    v-close-popover
                    class="dropdown-item"
                    type="button"
                    @click="activePaymentMethod = 'New credit card'"
                  >
                    Add credit card
                  </button>
                  <button
                    v-close-popover
                    class="dropdown-item"
                    type="button"
                    v-for="(card, index) in availableCreditCards"
                    :key="index"
                    @click="activePaymentMethod = card"
                  >
                    {{ card }}
                  </button>
                </div>
              </template>
            </Popover>
          </div>
          <CreditCard v-if="activePaymentMethod === 'New credit card'" />
        </div>

        <hr />

        <button class="btn btn-primary mx-auto d-block" @click="onCreateTeam">
          Start free trial
        </button>
      </div>
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import Popover from 'airsend/components/Popover.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Checkbox from 'airsend/components/Checkbox.vue';
import Icon from 'airsend/components/Icon.vue';
import CreditCard from 'airsend/components/CreditCard.vue';
import Slider from 'airsend/components/Teams/AddSeatsSlider.vue';
import { parseTime } from 'airsend/utils';

import Settings from '../Teams/Settings/Settings.vue';
import Members from '../Teams/Settings/Members.vue';
import AddMember from '../Teams/Settings/AddMember.vue';
import Channels from '../Teams/Settings/Channels.vue';
// import Files from '../Teams/Settings/Files.vue'

import TeamReadMore from 'airsend/components/Banners/TeamReadMore.vue';

export default {
  components: {
    Modal,
    Loader,
    Avatar,
    Icon,
    Settings,
    Members,
    Popover,
    AddMember,
    Channels,
    TeamReadMore,
    Checkbox,
    CreditCard,
    Slider
  },
  data() {
    return {
      teamName: '',
      errors: {},
      form: {
        name: ''
      },
      page: 'team-creation',
      seats: 5,
      activePlan: 'montly',
      //errors: {},
      activePaymentMethod: ''
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    loading() {
      return this.$store.state.loading['teams/create'];
    },
    yearlyPrice() {
      return (this.teamSeatsNew * 4.99 * 12 * 0.9).toFixed(2);
    },
    montlyPrice() {
      return (this.teamSeatsNew * 4.99).toFixed(2);
    },
    teamSeatsUsed() {
      return 100;
      return this.user.team_seats_used;
    },
    teamSeatsAvailable() {
      return this.user.team_seats_available;
    },
    teamSeatsUnused() {
      return this.teamSeatsAvailable - this.teamSeatsUsed;
    },
    teamSeatsNew() {
      return this.seats - this.teamSeatsAvailable;
    },
    isFreeTrialAvailable() {
      return this.teamSeatsAvailable == 0;
    },
    availableCreditCards() {
      return ['**** **** **** 0000'];
    }
  },
  methods: {
    beforeOpen(e) {
      this.page = 'team-creation';
      this.errors = {};
      this.form.name = '';
      if (this.availableCreditCards) {
        this.activePaymentMethod = this.availableCreditCards[0];
      }
    },
    onOpen(e) {
      this.$refs.team_name.focus();
    },
    async onSubmit() {
      this.errors = {};

      const response = await this.$store.dispatch('teams/create', this.form);

      if (response.ok) {
        this.$modal.hide('team-create');
        this.$router.push(`/team/${response.data.team.id}`);
      } else {
        this.errors = response.error;
      }
      return;
    },
    onContinueTeamCreation() {
      this.page = 'team-billing';
    },
    parseTime
  }
};
</script>

<style lang="scss">
/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}
.slide-fade-enter {
  /* .slide-fade-leave-active below version 2.1.8 */
  // transform: translateX(-10px);
  opacity: 0;
}
.slide-fade-leave-to {
  // transform: translateX(10px);
  opacity: 0;
}

.new-team-header {
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
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 1px;
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
