import baseConfig from './eslint.config.js';

export default [
  ...baseConfig,
  {
    linterOptions: {
      noInlineConfig: true,
    },
  },
];
