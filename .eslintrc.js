module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/base',
    'eslint:recommended',
    'prettier/vue',
  ],
  // TODO: refine linting
  rules: {
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/no-v-html': 'off',
    'no-unused-vars': 'off',
    'no-empty-character-class': 'off',
    'no-dupe-keys': 'off',
    'no-prototype-builtins': 'off',
    'no-unreachable': 'off',
    'no-redeclare': 'off',
    'no-empty': 'off',
    'quotes': 'off',
    'no-constant-condition': 'off',
    'no-undef': 'off',
    'no-useless-escape': 'off',
    'no-control-regex': 'off',
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    quotes: [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: false }
    ]
  },
  globals: {
    $nuxt: true
  }
};
