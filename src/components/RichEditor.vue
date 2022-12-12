<template>
  <div class="editor">
    <EditorMenuBubble
      class="menububble"
      :editor="editor"
      @hide="hideLinkMenu"
      v-slot="{ commands, isActive, getMarkAttrs, menu }"
    >
      <div
        class="menububble"
        :class="{ 'is-active': menu.isActive }"
        :style="`left: ${menu.left}px; bottom: ${menu.bottom}px;`"
      >
        <form
          class="menububble__form"
          v-if="linkMenuIsActive"
          @submit.prevent="setLinkUrl(commands.link, linkUrl)"
        >
          <input
            class="menububble__input"
            type="text"
            v-model="linkUrl"
            placeholder="https://"
            ref="linkInput"
            @keydown.esc="hideLinkMenu"
          />
          <button
            class="menububble__button"
            @click="setLinkUrl(commands.link, null)"
            type="button"
          >
            <Icon family="far" name="times" />
          </button>
        </form>

        <template v-else>
          <button
            class="menububble__button"
            @click="showLinkMenu(getMarkAttrs('link'))"
            :class="{ 'is-active': isActive.link() }"
          >
            <span>{{ isActive.link() ? 'Update Link' : 'Add Link' }}</span>
            <Icon family="far" name="link" />
          </button>
        </template>
      </div>
    </EditorMenuBubble>

    <EditorMenuBar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Bold' }"
          :class="{ 'is-active': isActive.bold() }"
          @click="commands.bold"
        >
          <Icon family="far" name="bold" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Italic' }"
          :class="{ 'is-active': isActive.italic() }"
          @click="commands.italic"
        >
          <Icon family="far" name="italic" />
        </button>

        <button
          style="display:none"
          class="menubar__button"
          :class="{ 'is-active': isActive.strike() }"
          @click="commands.strike"
        >
          <Icon family="far" name="strikethrough" />
        </button>

        <button
          style="display:none"
          class="menubar__button"
          :class="{ 'is-active': isActive.underline() }"
          @click="commands.underline"
        >
          <Icon family="far" name="underline" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Line of Code' }"
          :class="{ 'is-active': isActive.code() }"
          @click="commands.code"
        >
          <Icon family="far" name="code" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Paragraph' }"
          :class="{ 'is-active': isActive.paragraph() }"
          @click="commands.paragraph"
        >
          <Icon family="far" name="paragraph" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Title 1' }"
          :class="{ 'is-active': isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >
          H1
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Title 2' }"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          H2
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Title 3' }"
          :class="{ 'is-active': isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >
          H3
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Unordered List' }"
          :class="{ 'is-active': isActive.bullet_list() }"
          @click="commands.bullet_list"
        >
          <Icon name="list-ul" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Ordered List' }"
          :class="{ 'is-active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <Icon family="far" name="list-ol" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Blockquote' }"
          :class="{ 'is-active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
          <Icon family="far" name="quote-right" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Code Block' }"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <Icon family="far" name="window-maximize" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Horizontal Rule' }"
          @click="commands.horizontal_rule"
        >
          <Icon family="far" name="horizontal-rule" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Undo' }"
          @click="commands.undo"
        >
          <Icon family="far" name="undo" />
        </button>

        <button
          class="menubar__button"
          v-tooltip="{ delay: 1000, offset: -5, content: 'Redo' }"
          @click="commands.redo"
        >
          <Icon family="far" name="redo" />
        </button>
      </div>
    </EditorMenuBar>

    <EditorContent class="editor__content" :editor="editor" />
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar, EditorMenuBubble } from 'tiptap';
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Image,
  Underline,
  History
} from 'tiptap-extensions';

import Icon from 'airsend/components/Icon.vue';

export default {
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  components: {
    EditorContent,
    EditorMenuBar,
    EditorMenuBubble,
    Icon
  },
  data() {
    return {
      editor: new Editor({
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new HorizontalRule(),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Link(),
          new Bold(),
          new Code(),
          new Italic(),
          new Strike(),
          new Image(),
          new Underline(),
          new History()
        ],
        onUpdate: e => {
          let html = e.getHTML();

          // send update event
          this.$emit('update', html);

          return false;
        },
        content: this.content
      }),
      linkUrl: null,
      linkMenuIsActive: false
    };
  },
  methods: {
    showLinkMenu(attrs) {
      this.linkUrl = attrs.href;
      this.linkMenuIsActive = true;
      this.$nextTick(() => {
        this.$refs.linkInput.focus();
      });
    },
    hideLinkMenu() {
      this.linkUrl = null;
      this.linkMenuIsActive = false;
    },
    setLinkUrl(command, url) {
      command({ href: url });
      this.hideLinkMenu();
    }
  },
  beforeDestroy() {
    this.editor.destroy();
  }
};
</script>
