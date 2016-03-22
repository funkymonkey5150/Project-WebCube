
import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import AssetsPlugin from 'assets-webpack-plugin';
import cssnext from 'postcss-cssnext';
import postcssReporter from 'postcss-reporter';

const util = require('../utils');

const entries = {
  // http://christianalfoni.github.io/react-webpack-cookbook/Split-app-and-vendors.html
  common: [
    'whatwg-fetch', 'react', 'react-dom', 'react-css-modules', 'radium',
    'redux', 'react-redux', 'redux-actions', 'reselect', 'redux-thunk',
    'react-router', 'react-router-redux',
    'react-helmet', 'react-tap-event-plugin', 'react-addons-shallow-compare',
    'react-addons-css-transition-group',
    'core-decorators', 'classnames', 'eventemitter3',
  ],
  'example-app': ['./staticweb/example-app/deploy.js'],
  /* DO NOT MODIFY THIS! NEW ENTRY WILL BE AUTOMATICALLY APPENDED TO HERE */
};

for (const entry in entries) {
  // TODO: temporarily use babel-polyfill until babel-runtime 5.x -> 6.3.19+
  entries[entry].unshift('babel-polyfill');
  if (util.liveMode === 'refresh') {
    // http://webpack.github.io/docs/webpack-dev-server.html#inline-mode
    entries[entry].unshift(`webpack-dev-server/client?http://${util.serverHost}:${util.serverPort}`);
  } else if (util.liveMode === 'hmr') {
    // https://webpack.github.io/docs/webpack-dev-server.html#hot-module-replacement
    entries[entry].unshift(`webpack-dev-server/client?http://${util.serverHost}:${util.serverPort}`, 'webpack/hot/dev-server');
    // https://www.npmjs.com/package/webpack-hot-middleware
    // entries[entry].unshift('webpack-hot-middleware/client');
  }
}

const babelLoaderPlugins = [
  // https://phabricator.babeljs.io/T2645
  'transform-decorators-legacy',
  // https://github.com/babel/babel-loader#babel-is-injecting-helpers-into-each-file-and-bloating-my-code
  // https://medium.com/@jcse/clearing-up-the-babel-6-ecosystem-c7678a314bf3
  // https://phabricator.babeljs.io/T6644
  // https://github.com/babel/babel/pull/3142
  // TODO: temporarily use babel-polyfill until babel-runtime 5.x -> 6.3.19+
  // ['transform-runtime', { polyfill: true, regenerator: true }],
];
const reactTransformPlugins = ['react-transform', {
  transforms: [
    {
      transform: 'react-transform-catch-errors',
      imports: ['react', 'redbox-react'],
    },
    {
      transform: 'react-transform-hmr',
      imports: ['react'],
      locals: ['module'],
    },
    // {
    //   transform: 'react-transform-render-visualizer',
    // },
  ],
}];
if (!util.isProductionEnv && util.liveMode === 'hmr') {
  babelLoaderPlugins.push(reactTransformPlugins);
}

// https://github.com/ai/browserslist#queries
const browsers = [
  'Android 2.3',
  'Android >= 4',
  'Chrome >= 35',
  'Firefox >= 31',
  'Explorer >= 9',
  'iOS >= 7',
  'Opera >= 12',
  'Safari >= 7.1',
];
// const browsers = ['last 2 versions', 'ie 10'];
// const browsers = ['> 5%', 'last 2 versions', 'Firefox ESR', 'not ie <= 8'];
// const browsers = ['ie 6-8', 'opera 12.1', 'ios 6', 'android 4'];

const cssLoaderConfig = JSON.stringify({
  modules: true,
  importLoaders: 1,
  localIdentName: '[name]__[local]___[hash:base64:5]',
  sourceMap: !util.isProductionEnv,
  // https://github.com/webpack/css-loader#minification
  // https://github.com/webpack/css-loader/blob/master/lib/processCss.js
  minimize: util.isProductionEnv,
  // http://cssnano.co/options/
  // https://github.com/ben-eb/cssnano/blob/master/index.js
  // https://github.com/postcss/autoprefixer#options
  autoprefixer: {
    browsers,
    // https://github.com/postcss/autoprefixer#outdated-prefixes
    remove: false,
    add: true,
    cascade: false,
  },
  discardComments: {
    removeAll: true,
  },
  discardUnused: true,
  mergeIdents: true,
  // zindex: true,
  // normalizeUrl: true,
  // reduceIdents: true,
});

module.exports = {
  entry: entries,
  output: {
    filename: util.isProductionEnv
      ? 'js/[name]_[hash].js'
      : 'js/[name].js',
    chunkFilename: util.isProductionEnv
      ? 'js/[name]_[hash].js'
      : 'js/[name].js',
    path: path.join(__dirname, '..', 'build/public/static/'),
    publicPath: util.isCloudEnv
      ? process.env.APP_DEPLOY_STATIC_ROOT
      : '/static/',
  },
  resolve: {
    root: [
      path.join(__dirname, '..', 'src'),
    ],
    alias: {
      src: path.join(__dirname, '..', 'src'), // only for outside or `src/`
      data: path.join(__dirname, '..', 'data'), // only for outside or `src/`
    },
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx'],
  },
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      query: {
        presets: [
          'react',
          'es2015',
          'stage-1',
        ],
        plugins: babelLoaderPlugins,
        cacheDirectory: true,
      },
    }, {
      test: /\.scss$/,
      loader: ((cssOpt) => {
        // return `style?singleton!css?${cssOpt}!postcss!sass`;
        return ExtractTextPlugin.extract('style', `css?${cssOpt}!postcss!sass`);
      })(cssLoaderConfig),
    }, {
      test: /\.css$/,
      loader: ((cssOpt) => {
        // return `style?singleton!css?${cssOpt}!postcss`;
        return ExtractTextPlugin.extract('style', `css?${cssOpt}!postcss`);
      })(cssLoaderConfig),
    }, {
      test: /\.json$/,
      // https://www.npmjs.com/package/file-loader
      loader: util.isProductionEnv
        ? 'file?name=data/[name]_[hash].[ext]'
        : 'file?name=data/[name].[ext]',
    }, {
      test: /\.(gif|png|jpe?g|svg)$/i,
      loaders: [
        // https://www.npmjs.com/package/url-loader
        util.isProductionEnv
          ? 'url?limit=25000&name=assets/[name]_[hash].[ext]'
          : 'url?limit=25000&name=assets/[name].[ext]',
        // https://www.npmjs.com/package/image-webpack-loader
        ((imageOpt) => {
          return `image-webpack?${imageOpt}`;
        })(JSON.stringify({
          progressive: true,
          optimizationLevel: 7,
          interlaced: false,
          pngquant: {
            quality: '65-90',
            speed: 4,
          },
        })),
      ],
    }, {
      test: /\.(woff|woff2)$/,
      loader: util.isProductionEnv
        ? 'url?limit=25000&name=assets/[name]_[hash].[ext]'
        : 'url?limit=25000&name=assets/[name].[ext]',
    }, {
      test: /\.(ttf|eot|wav|mp3)$/,
      loader: util.isProductionEnv
        ? 'file?name=assets/[name]_[hash].[ext]'
        : 'file?name=assets/[name].[ext]',
    }],
  },
  // https://www.npmjs.com/package/postcss-loader
  postcss() {
    return [
      cssnext({
        browsers,
        features: {
          autoprefixer: false,
        },
      }),
      postcssReporter(),
    ];
  },
  plugins: [
    // http://mts.io/2015/04/08/webpack-shims-polyfills/
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': util.isProductionEnv
        ? '\'production\'' : '\'development\'',
    }),
    // http://christianalfoni.github.io/react-webpack-cookbook/Split-app-and-vendors.html
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: Infinity,
      // children: true, // Move common modules into the parent chunk
      // async: true, // Create an async commons chunk
    }),
    // https://www.npmjs.com/package/extract-text-webpack-plugin
    new ExtractTextPlugin(util.isProductionEnv
      ? 'css/[name]_[contenthash].css'
      : 'css/[name].css', { allChunks: true }),
    // https://www.npmjs.com/package/assets-webpack-plugin
    new AssetsPlugin({
      filename: 'configs/rev-version.json',
      fullPath: true,
      prettyPrint: true,
    }),
    // https://github.com/webpack/docs/wiki/optimization
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
  ].concat(!util.isProductionEnv ? [
    // https://github.com/glenjamin/webpack-hot-middleware
    new webpack.HotModuleReplacementPlugin(),
  ] : []).concat([
    new webpack.NoErrorsPlugin(),
  ]),
};
