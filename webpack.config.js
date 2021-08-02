'use strict';

const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const purgecss = require('@fullhuman/postcss-purgecss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const distPath = resolve(__dirname, 'dist');

const base = {
  mode,
  devtool: mode === 'production' ? 'nosources-source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [ 'babel-loader' ],
      },
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.(.js|.jsx)$/,
        parallel: true,
        terserOptions: {
          compress: {},
        }
      }),
    ],
  },
  output: {
    path: distPath,
    chunkFilename: '[name].chunk.js',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', 'jsx']
  },
};

const renderPlugins = [
  new HtmlWebpackPlugin({ template: resolve(__dirname, 'index.html') }),
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
    chunkFilename: '[id].[contenthash].css',
  })
];

const config = env => {
  const preload = !!(env && env.preload);
  const main = Object.assign({}, base, {
  target: preload ? 'electron-preload' : 'electron-main',
    output: Object.assign({}, base.output, {
      path: resolve(base.output.path, 'main')
    }),
    entry: preload ? { preload: resolve(__dirname, 'preload.js') }
      : { index: resolve(__dirname, 'main.js') },
    plugins: preload ? undefined : [
      new webpack.DefinePlugin({
        '__dist': `"${distPath}"`
      })
    ],
  });
  
  const renderer = Object.assign({}, base, {
    target: "electron-renderer",
    module: Object.assign({}, base.module, {
      rules: [
        ...base.module.rules,
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    tailwindcss(resolve(__dirname, './tailwind.config.js')),
                    autoprefixer,
                    mode === 'production'
                      ? purgecss({
                          content: [
                            resolve(__dirname, './renderer.js'),
                          ],
                          defaultExtractor: content =>
                            content.match(/[A-Za-z0-9-_:/]+/g) || []
                        })
                      : undefined
                  ]
                }
              }
            }
          ],
        },
      ],
    }),
    optimization: Object.assign({}, base.optimization, {
      minimize: base.optimization.minimize,
      minimizer: [
        ...base.optimization.minimizer,
        '...',
        new CssMinimizerPlugin()
      ]
    }),
    output: Object.assign({}, base.output, {
      path: resolve(base.output.path, "renderer"),
    }),
    entry: { renderer: resolve(__dirname, "renderer.js") },
    plugins: renderPlugins,
  });
  return [main, renderer];
};

module.exports = config;
