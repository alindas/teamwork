const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // mode: 'production',
  // mode: 'development',
  // entry: path.resolve(__dirname, './src/app.tsx'),
  entry: './src/app.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      "zlib": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": false,
      // "crypto-browserify": require.resolve('crypto-browserify'),
    }
  },
  //  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        // loader: 'ts-loader', --v4
        use: ['ts-loader']
      },
      {
        test: /\.css$/,
        // loader: 'style-loader!css-loader', -- v4
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|mjs|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "@babel/preset-env", {
                "targets": {
                  "browsers": [
                    "last 2 versions",
                    "not ie <= 9"
                  ]
                }
              }
            ]
          ],
        }
      }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale/, /en\.js/),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist'),
    proxy: {
      "/api": {
        target: "http://8.134.69.146:8080",
        pathRewrite: {
          "^/api": "",
        },
      },
    }
  }
};
