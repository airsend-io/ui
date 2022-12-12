import { Node, mergeAttributes } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from 'prosemirror-state';

export default Node.create({
  name: 'mention-action',

  defaultOptions: {
    HTMLAttributes: {},
    suggestion: {
      char: '#',
      command: ({ editor, range, props }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            {
              type: 'mention-action',
              attrs: props
            },
            {
              type: 'text',
              text: ' '
            }
          ])
          .run();
      }
      /*
      allow: ({ editor, range }) => {
        return editor.can().replaceRange(range, 'mention-action')
      },
      */
    }
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => {
          return {
            id: element.getAttribute('data-mention-id'),
            name: element.innerText
          };
        },
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-mention-id': `action://${attributes.id}`
          };
        }
      },
      name: {
        default: null,
        parseHTML: element => {
          return {
            id: element.getAttribute('data-mention-id')
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mention-action]'
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      `${node.attrs.name}`
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.id}`;
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === 'mention-action') {
              isMention = true;
              tr.insertText(
                this.options.suggestion.char || '',
                pos,
                pos + node.nodeSize
              );

              return false;
            }
          });

          return isMention;
        })
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: new PluginKey('suggestion-action'),
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
});
