module.exports = function() {
  var client = './src/client/';
  var clientApp = client + 'app/';
  var server = './src/server/';
  var temp = '.tmp/';

  var config = {
    temp: temp,
    alljs: [
      './src/**/*.js',
      './*.js'
    ], // js for vet task
    build: './build/',
    less: [
      client + 'styles/styles.less',
      './bower_components/bootstrap/less/bootstrap.less'
    ],
    client: client,
    index: client + 'index.html',
    css: [
      temp + 'styles.css',
      temp + 'bootstrap.css'
    ],
    fonts: './bower_components/font-awesome/fonts/**/*.*',
    images: client + 'images/**/*.*',
    htmltemplates: clientApp + '**/*.html',
    js: [
      clientApp + '**/*.module.js',
      clientApp + '**/*.js',
      '!' + clientApp + '**/*.spec.js'
    ],

    /**
     *  Bower and NPM locations
     */
    bower : {
      json: require('./bower.json'),
      directory: './bower_components/',
      ignorePath: '../..'
    },

    /**
     * Angular template cache
     */
    templateCache : {
      file: 'templates.js',
      options: {
        module: 'app.core',
        standAlong: false,
        root: 'app/'
      }
    },

    /**
     * Node settings
     */
    defaultPort: 7203,
    nodeServer: server + 'app.js',
    server: server,
    browserReloadDelay: 1000
  };


    config.getWiredepDefaultOptions = function () {
      var options = {
        bowerJson: config.bower.json,
        directory: config.bower.directory,
        ignorePath: config.bower.ignorePath
      }

      return options;
    }

    return config;
};
