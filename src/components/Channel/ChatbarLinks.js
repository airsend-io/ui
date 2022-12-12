import { Command, Mark, markPasteRule, mergeAttributes } from '@tiptap/core';

import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * A regex that matches any string that contains a link
 */
export const pasteRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)/gi;

export default Mark.create({
  name: 'link',
  priority: 1000,

  inclusive: false,

  addPasteRules() {
    return [
      markPasteRule(pasteRegex, this.type, match => ({ href: match[0] }))
    ];
  },

  addAttributes() {
    return {
      href: {
        default: null
      }
    };
  },

  parseHTML() {
    return [{ tag: 'a[href]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', {}, 0];
  },

  addCommands() {
    return {
      setLink: attributes => ({ commands }) => {
        return commands.setMark('link', attributes);
      },
      toggleLink: attributes => ({ commands }) => {
        return commands.toggleMark('link', attributes);
      },
      unsetLink: () => ({ commands }) => {
        return commands.unsetMark('link');
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('handlePasteLink'),
        props: {
          transformPasted: slice => {
            const content = slice.content.firstChild;

            if (content.marks) {
              const [mark] = content.marks;

              // has an url
              if (mark && mark.attrs && mark.attrs.href) {
                content.text = mark.attrs.href;
              }
            }

            return slice;
          }
        }
      })
    ];
  }
});
