const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js'],
      };
      return config;
    },
  },
};
