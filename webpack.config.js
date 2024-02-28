const path = require('path');

module.exports = {
  entry: {
    "jobpage": './src/jobPageApp.js',
    "docBuilder": [
      './src/document_builder_main.js', 
      './src/document_builder_items.js'
    ],
    "docMain": './src/document_main.js',
    "jobEdit": [
      './src/job_delete.js',
      './src/auto_address.js'
    ],
    "todo": [
      './src/todo_comments.js',
      './src/todo_remove.js',
      './src/todo_status.js', 
      './src/job_comments.js', 
    ],
    "records": [
      './src/records_filter.js',
      './src/records_modal.js',
      './src/records_scrollShadows.js',
      './src/records_todo.js',
    ],
    "manage_modules": './src/manage_modules.js',
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "adminas/static/adminas/scripts/"),
    publicPath: '/'
  },
  mode: "production",
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
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       reactVendor: {
  //         test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
  //         name: 'vendor-react',
  //         chunks: 'all',
  //       },
  //     },
  //   },
  // }
};