<template>
  <div class="credit-card-wrapper">
    <div class="card-wrapper"></div>

    <form id="cc-form">
      <label for="name">Card Holder Name</label>
      <input
        type="text"
        class="form-control"
        name="name"
        id="cc-name"
        placeholder="John Doe"
      />

      <label for="number">Card Number</label>
      <input
        type="text"
        class="form-control"
        name="number"
        id="cc-number"
        placeholder="0000 0000 0000 0000"
      />

      <label for="name">Expiry</label>
      <input
        type="text"
        class="form-control"
        name="expiry"
        id="cc-expiration"
        placeholder="MM/YYYY"
      />

      <label for="name">CVV</label>
      <input
        type="text"
        class="form-control"
        name="cvc"
        id="cc-cvv"
        placeholder="000"
      />
    </form>
  </div>
</template>

<script>
import * as Card from 'card';

export default {
  name: 'Form CreditCard',
  mounted() {
    new Card({
      form: 'form#cc-form',
      container: '.card-wrapper',
      formSelectors: {
        numberInput: 'input#cc-number',
        expiryInput: 'input#cc-expiration',
        cvcInput: 'input#cc-cvv',
        nameInput: 'input#cc-name'
      },
      formatting: true,
      placeholders: {
        number: '0000 0000 0000 0000',
        name: 'Full Name',
        expiry: '••/••',
        cvc: '•••'
      }
    });
  }
};
</script>
