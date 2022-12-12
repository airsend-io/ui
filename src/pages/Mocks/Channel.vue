<template>
  <div class="page-content">
    <div class="container-fluid fullheight">
      <div class="row fullheight">
        <div id="chat-fragment" class="chat-fragment">
          <div class="chat-divider"><span>Tuesday, July 16</span></div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Madhan</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check-double" /> Seen by
                  everyone</span
                >
              </div>
              <div class="chat-message-content-text">
                Creating a channel for us to exchange files regarding this
                property. Please post any questions you have for me as well.
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-divider"><span>Wednesday, July 17</span></div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://www.fakepersongenerator.com/Face/male/male1085276822998.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Me</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Seen by Madhan
                  <b>+ 2 more</b></span
                >
              </div>
              <div class="chat-message-content-text">
                Awesome.. looking forward to see the proposal
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Madhan</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Seen by Madhan
                  <b>+ 2 more</b></span
                >
              </div>
              <div class="chat-message-content-text">Here it is</div>

              <div class="chat-message-content-attachment">
                <p>3 files uploaded</p>

                <ul class="attachment-list">
                  <li>
                    <a href="#">
                      <Icon family="fad" name="file-pdf" />
                      <div>
                        <p>proposal.pdf</p>
                        <small>4.5mb</small>
                      </div>
                    </a>
                  </li>

                  <li>
                    <a href="#">
                      <Icon family="fad" name="file" />
                      <div>
                        <p>+2 files</p>
                        <small>Click to see all files</small>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-notice">
            <span
              ><Icon family="fas" name="bolt" />
              <a href="#">@madhan</a> assigned you the action
              <strong>"Review"</strong>, on <a href="#">proposal.pdf</a> and
              <a href="#">2 more items.</a></span
            >
          </div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://www.fakepersongenerator.com/Face/male/male1085276822998.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Me</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Seen by Madhan
                  <b>+ 1 more</b></span
                >
              </div>
              <div class="chat-message-content-text">
                Great, I will review these shortly. In the meantime could you
                upload more pictures ?
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Madhan</a> replying to <a>You</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Seen by Madhan + 1
                  more</span
                >
              </div>
              <div class="chat-message-content-reply">
                <Icon family="fad" name="quote-left" />
                <div class="chat-message-content-reply-author">
                  You Said:
                </div>
                <div class="chat-message-content-reply-quote">
                  Great, I will review these shortly. In the meantime could you
                  upload more pictures ?
                </div>
              </div>
              <div class="chat-message-content-text">
                Sure, assigning this action to @corentin
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-notice">
            <span
              ><Icon family="fas" name="bolt" />
              <a href="#">@madhan</a> assigned <a href="#">@corentin</a> the
              action <strong>"Add More Pictures".</strong></span
            >
          </div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://www.fakepersongenerator.com/Face/male/male1085276822998.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Me</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Seen by Madhan</span
                >
              </div>
              <div class="chat-message-content-text">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-divider chat-divider--unread">
            <span>Unread messages</span>
          </div>

          <div class="chat-message">
            <div
              class="avatar"
              style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
            ></div>
            <div class="chat-message-content">
              <div class="chat-message-content-author">
                <a>Madhan</a><small> - 5:36PM</small>
                <span class="chat-message-read-by"
                  ><Icon family="far" name="check" /> Sent</span
                >
              </div>
              <div class="chat-message-content-text">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </div>
            </div>
            <ChatActions />
          </div>

          <div class="chat-fragment-footer">
            <div class="btn btn-icon">
              <Icon family="far" name="file-image" />
            </div>

            <div class="btn btn-icon">
              <Icon family="far" name="smile-wink" />
            </div>

            <div class="btn btn-icon">
              <Icon family="far" name="paperclip" />
            </div>

            <div class="chatbar">
              <Editor />
            </div>

            <div class="btn btn-icon btn-send">
              <Icon family="fas" name="paper-plane" />
            </div>
          </div>
        </div>

        <ChannelSidebar />
      </div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';
import ChatActions from 'airsend/components/ChatActions.vue';

import ChannelSidebar from '../../components/ChannelSidebar.vue';

export default {
  name: 'Channel',
  components: {
    Icon,
    ChannelSidebar,
    ChatActions
  },
  mounted() {
    // initially scroll to bottom
    var container = this.$el.querySelector('#chat-fragment');
    container.scrollTop = container.scrollHeight;
  }
};
</script>
