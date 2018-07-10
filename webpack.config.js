const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const {AngularCompilerPlugin} = require('@ngtools/webpack');


module.exports = function () {
  return {
    entry: {
      main: './src/main.ts',
    },
    output: {
      path: __dirname + '/dist',
      filename: 'app.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        // {test: /\.ts$/, loaders: ['@ngtools/webpack']},
        {test: /\.css$/, loader: 'raw-loader'},
        {test: /\.html$/, loader: 'raw-loader'},
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                configFileName: 'tsconfig.json',
                useCache: true
              }
            },
            {
              loader: 'angular2-template-loader'
            },
          ]
        },
      ]
    },

    plugins: [
      new CopyWebpackPlugin([
        {from: 'src/assets', to: 'assets'}
      ]),
      new HtmlWebpackPlugin({
        template: __dirname + '/src/index.html',
        output: __dirname + '/dist',
        inject: 'body'
      }),
      // new AngularCompilerPlugin({
      //   tsConfigPath: './tsconfig.json',
      //   // mainPath: './src/main.ts',
      //   entryModule: './src/app/app.module.ts#AppModule',
      //   sourceMap: true
      // })
    ]
  };
};
