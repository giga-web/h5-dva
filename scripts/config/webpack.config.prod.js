// Node
const path = require('path');

// 打包工具
const webpack = require('webpack');

// 自研-工具
const paths = require('../util/paths');

// 自研-插件
const InterpolateHtmlPlugin = require('../plugins/InterpolateHtmlPlugin');

// 开源-插件
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    index: [paths.IndexJs],
    asyncImport: paths.AsyncImportProdJS,
  },
  output: {
    filename: '[name].bundle.[hash].js',
    chunkFilename: '[name].chunk.[hash].js',
    path: paths.BuildDir,
    publicPath: '',
  },
  resolve: {
    alias: {
      '@': paths.SrcDir,
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  plugins: [
    // 替换新 html 文件中的变量
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: '',
      VERSION_TIME: new Date().getTime()
    }),

    // 基于 html 模板生成新的 html 文件
    new HtmlWebpackPlugin({
      template: paths.IndexHtml,
      chunks: ['index']
    }),

    // 将模块名称添加到工厂函数，以便它们出现在浏览器 profiler 中
    new webpack.NamedModulesPlugin(),

    // 固定块的名称
    new webpack.NamedChunksPlugin((chunk) => {
      if (chunk.name) {
        return chunk.name;
      }
      return Array.from(chunk.modulesIterable, ({ context, request }) => path.relative(context, request)).join('_');
    }),

    // 忽略moment的语言包，默认会加载所有语言包
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            
          }
        }
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {

            },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // 如果要大大加快编译速度，可以设置此标志。但是，您从应用程序中不同依赖项之间的静态类型检查中获得的许多好处将丢失。
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /[^(\.m)]\.less$/,
        // include: paths.NodeModulesDir,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => [
                require('postcss-preset-env')(),
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
              modifyVars: {
                '@font-size-base': '12px',
              },
            },
          },
        ],
      },
      {
        test: /\.m\.less$/,
        include: paths.SrcDir,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: {
                localIdentName: '[path][name]__[local]--[hash:base64:5]',
              },
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => [
                require('postcss-preset-env')(),
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
              modifyVars: {
                '@font-size-base': '12px',
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(csv|tsv)$/,
        use: [
          'csv-loader',
        ],
      },
      {
        test: /\.xml$/,
        use: [
          'xml-loader',
        ],
      },
    ]
  },
  optimization: {
    splitChunks: {
      chunks: (chunk) => {
        return false;
      },
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/](react|react-dom|antd|moment)[\\/]/,
          /*
          test(module, chunks) {
            // `module.resource` contains the absolute path of the file on disk.
            // Note the usage of `path.sep` instead of / or \, for cross-platform compatibility.
            const path = require('path');
            return module.resource &&
                 module.resource.endsWith('.svg') &&
                 module.resource.includes(`${path.sep}cacheable_svgs${path.sep}`);
          },
          */
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};