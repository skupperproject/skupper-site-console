import path from 'path';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const ROOT = process.cwd();

const config: any = {
  entry: path.join(ROOT, 'src/local/index.tsx'),
  mode: 'development',
  devtool: 'eval-source-map',

  devServer: {
    port: 3000,
    historyApiFallback: true,
    static: {
      directory: path.join(ROOT, 'src/local/public')
    },
    compress: true
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsConfigPathsPlugin({ configFile: path.join(ROOT, 'tsconfig.json') })]
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      },
      {
        test: /\.(svg|jpg|jpeg|png)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[contenthash][ext]'
        }
      },
      {
        test: /\.(png)$/i,
        type: 'asset/resource',
        exclude: /assets/,
        generator: {
          filename: '[name].[contenthash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      },
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(ROOT, 'locales'), to: 'locales' }]
    }),
    new HtmlWebpackPlugin({
      template: path.join(ROOT, 'src/local/public/index.html'),
      templateParameters: {
        title: ''
      }
    })
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.mode = 'production';
  if (config.output) {
    config.output.filename = '[name]-bundle-[hash].min.js';
    config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  }
  if (config.optimization) {
    config.optimization.chunkIds = 'deterministic';
    config.optimization.minimize = true;
  }
  config.devtool = false;
}

export default config;
