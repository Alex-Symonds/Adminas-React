const path = require('path');

module.exports = {
  entry: {
    "jobpage": './src/jobPageApp.js'
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "adminas/static/adminas/scripts/"),
    publicPath: '/'
  },
  mode: "development",
  watch: true,
  module: {
    rules: [
      {
        test: /\.(?:js|mjs|cjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              ["@babel/preset-react", {"runtime": "automatic"}]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
        },
      },
    },
  }
};