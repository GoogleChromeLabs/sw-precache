import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import gutil from 'gulp-util';
import nodemon from 'nodemon';
import packageJson from './package.json';
import path from 'path';
import source from 'vinyl-source-stream';
import sequence from 'run-sequence';
import swPrecache from 'sw-precache';

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const THIRD_PARTY_MODULES = ['react', 'react-router'];

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('bundle-app', () => {
  const bundler = browserify({
    entries: path.join(SRC_DIR, 'components', 'client.jsx'),
    extensions: ['.jsx'],
    transform: [babelify]
  });
  THIRD_PARTY_MODULES.forEach(module => bundler.external(module));

  return bundler.bundle()
    .on('error', function(error) {
      gutil.log('Babelify error:', error.message);
      this.emit('end');
    })
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('bundle-third-party', () => {
  const bundler = browserify();
  THIRD_PARTY_MODULES.forEach(module => bundler.require(module));

  return bundler.bundle()
    .on('error', function(error) {
      gutil.log('Babelify error:', error.message);
      this.emit('end');
    })
    .pipe(source('third-party.js'))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('copy-static', () => {
  return gulp.src(`${SRC_DIR}/static/**/*`)
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('copy-third-party', () => {
  return gulp.src('node_modules/sw-toolbox/sw-toolbox.js')
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('generate-service-worker', () => {
  const serviceWorkerFile = path.join(BUILD_DIR, 'service-worker.js');
  return del(serviceWorkerFile).then(() => {
    return swPrecache.write(serviceWorkerFile, {
      cacheId: packageJson.name,
      directoryIndex: null,
      dynamicUrlToDependencies: {
        '/shell': [`${SRC_DIR}/views/index.handlebars`]
      },
      importScripts: ['sw-toolbox.js', 'sw-toolbox-config.js'].map(script => `js/${script}`),
      logger: gutil.log,
      navigateFallback: '/shell',
      staticFileGlobs: [`${BUILD_DIR}/**/*.js`],
      stripPrefix: 'build/',
      verbose: true
    });
  });
});

gulp.task('build', callback => {
  sequence(
    ['bundle-app', 'bundle-third-party', 'copy-static', 'copy-third-party'],
    'generate-service-worker',
    callback
  );
});

gulp.task('serve', callback => {
  nodemon({
    script: 'index.js',
    ext: 'js jsx html',
    watch: [SRC_DIR, BUILD_DIR],
    verbose: true
  }).on('start', () => {
    gutil.log('Server started.');
  }).on('crash', () => {
    gutil.log('Server crashed.');
  }).on('restart', files => {
    gutil.log('Restarted server. Changed files: ', files);
  }).on('quit', callback);
});

gulp.task('lint', () => {
  return gulp.src([`${SRC_DIR}/**/*.{js,jsx}`, '*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('watch', () => {
  gulp.watch(`${SRC_DIR}/**/*.{js,jsx}`, ['bundle-app', 'lint']);
  gulp.watch(`${SRC_DIR}/static/**/*`, ['copy-static']);
});

gulp.task('default', callback => {
  sequence('clean', 'build', ['serve', 'watch'], callback);
});
