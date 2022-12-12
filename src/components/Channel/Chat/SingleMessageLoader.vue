<template>
  <div class="chat-message chat-message--aggregated chat-message--loader">
    <div class="avatar"></div>
    <div class="chat-message-aggregated-content">
      <div class="chat-message-row">
        <div class="chat-message-body">
          <div
            class="chat-message-content-author"
            :style="`width:${author}%`"
          ></div>
          <ul class="chat-message-content-loaders">
            <li
              v-for="item in items"
              v-if="item >= 30"
              :style="`width:${item}%`"
            ></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { random } from 'lodash';

export default {
  data() {
    return {
      author: random(20, 40),
      items: [random(30, 70), random(0, 70), random(0, 70), random(0, 70)]
    };
  }
};
</script>
