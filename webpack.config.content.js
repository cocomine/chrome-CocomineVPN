const path = require('path');
const webpack = require('webpack');

/**
 * Bundles the MV3 content script (and its TS deps) straight into public/content.js.
 */
module.exports = (_env, argv = {}) => {
  const isProd = argv.mode === 'production';

  return [{
    entry: path.resolve(__dirname, 'src/extension/content.ts'),
    output: {
      filename: 'content.js',
      path: path.resolve(__dirname, 'public'),
      clean: false,
    },
    mode: isProd ? 'production' : 'development',
    target: ['web', 'es2020'],
    devtool: isProd ? 'source-map' : 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.[tj]sx?$/,
          include: path.resolve(__dirname, 'src/extension'),
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.extension.json',
              transpileOnly: true,
            },
          },
        },
      ],
    },
    optimization: {
      minimize: isProd,
    },
    stats: 'errors-warnings',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      }),
    ],
  },{
    entry: path.resolve(__dirname, 'src/extension/service-worker.ts'),
    output: {
      filename: 'service-worker.js',
      path: path.resolve(__dirname, 'public'),
      clean: false,
    },
    mode: isProd ? 'production' : 'development',
    target: ['web', 'es2020'],
    devtool: isProd ? 'source-map' : 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.[tj]sx?$/,
          include: path.resolve(__dirname, 'src/extension'),
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.extension.json',
              transpileOnly: true,
            },
          },
        },
      ],
    },
    optimization: {
      minimize: isProd,
    },
    stats: 'errors-warnings',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      }),
    ],
  }];
};
