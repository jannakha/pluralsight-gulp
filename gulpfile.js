var gulp = require('gulp');
var config = require('./gulpconfig.js')();
var del = require('del');
var args = require('yargs').argv;
var browserSync = require('browser-sync');

//all gulp plugins, lazy loaded
var $ = require('gulp-load-plugins')({lazy: true});

var port = process.env.PORT || config.defaultPort;

//gulp plugins - can register plugins one by one or with gulp-load-plugins - all plugins are downloaded/registered
//var jshint = require('gulp-jshint');
//var jscs = require('gulp-jscs');
//var util = require('gulp-util');
//var gulpprint = require('gulp-print');
//var gulpif = require('gulp-if');

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('vet', function() {

    log('Analyzing source with JSHint and JSCS');

    return gulp
    //.src(['./src/**/*.js', './*.js']) //move this to gulp.config.js
    .src(config.alljs) //move this to gulpconfig.js
    .pipe($.if(args.verbose, $.print())) //print only when --verbose argument is used
    .pipe($.jscs())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
    .pipe($.jshint.reporter('fail')); //report to CI tool
});

gulp.task('styles', ['clean-styles'], function() {
    log('Compiling less to css');

    return gulp
    .src(config.less).pipe($.if(args.verbose, $.print())) //print only when --verbose argument is used
    .pipe($.plumber())
    .pipe($.less())
    //.on('error', errorLogger)
    .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
    .pipe(gulp.dest(config.temp));
});

gulp.task('images', ['clean-images'], function() {
  log('copying images');
  return gulp
    .src(config.images)
    .pipe($.if(args.verbose, $.print())) //print only when --verbose argument is used
    .pipe($.imagemin({optimizationLevel: 4}))
    .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('fonts', ['clean-fonts'], function() {
    log('copying fonts');
    return gulp
    .src(config.fonts)
    .pipe($.if(args.verbose, $.print())) //print only when --verbose argument is used
    .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('less-watcher', function() {
    gulp.watch([config.less], ['styles']);
});

gulp.task('clean-styles', function(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

gulp.task('clean-fonts', function(done) {
  var files = config.build + 'fonts/**/*.*';
  clean(files, done);
});

gulp.task('clean-images', function(done) {
  var files = config.build + 'images/**/*.*';
  clean(files, done);
});

gulp.task('clean-code', function(done) {
  var files = [].concat(
    config.temp + '**/*.js',
    config.buld + '**/*.html',
    config.build + 'js/**/*.js'
  );

  clean(files, done);
});

gulp.task('templatecache', ['clean-code'], function() {
  log('Creating AngJS $templateCache');
  return gulp
    .src(config.htmltemplates)
    .pipe($.minifyHtml({empty: true}))
    .pipe($.angularTemplatecache( //gulp-angular-templatecache
      config.templateCache.file,
      config.templateCache.options
    ))
    .pipe(gulp.dest(config.temp));
});

gulp.task('wiredep', function() {
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp
    .src(config.index)
    .pipe(wiredep(options))
    .pipe($.inject(gulp.src(config.js)))
    .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function() {
    return gulp
    .src(config.index)
    .pipe($.inject(gulp.src(config.css)))
    .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function() {
    var isDev = true;
    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
          'PORT' : port,
          'NOE_ENV' : isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };
    return $.nodemon(nodeOptions)
      .on('restart', ['vet'], function(){
          log('*** nodemod restarted');
        setTimeout(function() {
            browserSync.notify('reloading now...');
            browserSync.reload({stream: false});
        }, config.browserReloadDelay)
      })
      .on('exit', function(){
        log('*** nodemod exited');
      })
      .on('crash', function(){
        log('*** nodemod crashed');
      })
      .on('start', function(){
        log('*** nodemod started');
          startBrowserSync();

      });
});

gulp.task('optimize', ['inject'], function() {
  log('optimizing js/css/html');

  var templateCache = config.temp + config.templateCache.file;

  return gulp
    .src(config.index)
    .pipe($.plumber())
    .pipe($.inject(gulp.src(templateCache, {read: false}, {
      starttag: '<!-- inject:templates:js -->'
    })))
    .pipe(gulp.dest(config.build));
});

function changeEvent(event) {
    var strPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(strPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    if(browserSync.active && args.nosync) {
      return;
    }

    log('... using browser sync ...');

    gulp.watch([config.less], ['styles'])
      .on('change', function(event) { changeEvent(event) });

    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
          config.client + '**/*.*',
          '!' + config.client + '**/*.less',
          config.temp + '**/*.css'
        ],
        ghostMode: {
          clicks: true,
          location: false,
          forms: true,
          scroll: true
        },
      injectChanges: true,
      logFilesChanges: true,
      logLevel: 'debug',
      logPrefix: 'gulp-patterns',
      notify: true,
      reloadDelay: 1000
    };
    browserSync(options);
}

function clean(path, done) {
    log('cleaning files...' + path);
    del(path, done);
}

function errorLogger(error) {
    log('*** start of error ***');
    log(error);
    log('*** end of error ***');
    this.emit('end');
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
