const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico'
    }),
  ],
  devtool: 'source-map',
  devServer: {
    host: '0.0.0.0', 
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    open: true,
    historyApiFallback: true,
    allowedHosts: 'all',
    
    // --- THIS IS THE MAGIC ---
    // Add this proxy configuration.
    proxy: {
      // Any request that starts with '/api' will be forwarded.
      '/api': {
        // Target your backend server
        target: 'http://localhost:5000',
        // This is recommended for avoiding issues with virtual hosts
        changeOrigin: true,
      },
    },
  },
};