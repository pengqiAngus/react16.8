const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
module.exports = {
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
              presets: [['@babel/preset-env', { targets: 'defaults' }]],
          },
        },
      },
    ],
  },
  plugins: [
      new HtmlWebpackPlugin({
        title: 'React 16.8',
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
};