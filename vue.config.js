const path = require('path');
const WorkerPlugin = require('worker-plugin');

module.exports = {
  chainWebpack: config => {
    config.module.rules.delete('svg');
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.svg$/,
          use: ['babel-loader', 'vue-svg-loader']
        }
      ]
    },
    resolve: {
      alias: {
        main: path.resolve(__dirname, 'src/'),
        airsend: path.resolve(__dirname, 'src/'),
      }
    },
    devServer: {
      proxy: {
        '^/api': {
          target: process.env.VUE_APP_ROOT_API,
          pathRewrite: {
            '^/api': '/' // rewrite path
          },
          ws: true,
          changeOrigin: true
        }
      }
    },
    plugins: [new WorkerPlugin({
      preserveTypeModule: true,
      worker: false
    })]
  }
};
