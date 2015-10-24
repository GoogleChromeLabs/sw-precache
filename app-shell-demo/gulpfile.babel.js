import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import del from 'del';
import eslint from 'gulp-eslint';
import glob from 'glob';
import gulp from 'gulp';
import gutil from 'gulp-util';
import merge from 'merge-stream';
import nodemon from 'nodemon';
import packageJson from './package.json';
import path from 'path';
import rev from 'gulp-rev';
import sequence from 'run-sequence';
import source from 'vinyl-source-stream';
import swPrecache from 'sw-precache';

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const THIRD_PARTY_MODULES = ['react', 'react-router'];

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('bundle-app', () => {
  let bundler = browserify({
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
  let bundler = browserify();
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

gulp.task('copy-third-party-sw', () => {
  return gulp.src('node_modules/sw-toolbox/sw-toolbox.js')
    .pipe(gulp.dest(`${BUILD_DIR}/sw`));
});

gulp.task('version-assets', () => {
  let jsStream = gulp.src(`${BUILD_DIR}/js/**/*`)
    .pipe(rev())
    .pipe(gulp.dest(`${BUILD_DIR}/js-rev`))
    .pipe(rev.manifest())
    .pipe(gulp.dest(BUILD_DIR));

  let swStream = gulp.src(`${BUILD_DIR}/sw/**/*`)
    .pipe(rev())
    .pipe(gulp.dest(`${BUILD_DIR}/sw-rev`));

  return merge(jsStream, swStream);
});

gulp.task('generate-service-worker', () => {
  let serviceWorkerFile = path.join(BUILD_DIR, 'service-worker.js');

  let swScripts = [];
  let swToolboxRegex = /sw-toolbox-[a-f0-9]{10}\.js$/;
  glob.sync('sw-rev/**/*.js', {cwd: BUILD_DIR}).forEach(file => {
    if (file.match(swToolboxRegex)) {
      // The sw-toolbox.js script (with the hash in its filename) needs to be imported first.
      swScripts.unshift(file);
    } else {
      swScripts.push(file);
    }
  });

  return del(serviceWorkerFile).then(() => {
    return swPrecache.write(serviceWorkerFile, {
      cacheId: packageJson.name,
      directoryIndex: null,
      dynamicUrlToDependencies: {
        '/shell': [...glob.sync(`${BUILD_DIR}/js-rev/**/*.js`), `${SRC_DIR}/views/index.handlebars`]
      },
      importScripts: swScripts,
      logger: gutil.log,
      navigateFallback: '/shell',
      staticFileGlobs: [`${BUILD_DIR}/js-rev/**/*.js`],
      stripPrefix: 'build/',
      verbose: true
    });
  });
});

gulp.task('build', callback => {
  sequence(
    ['bundle-app', 'bundle-third-party', 'copy-static', 'copy-third-party-sw'],
    'version-assets',
    'generate-service-worker',
    callback
  );
});

gulp.task('serve', callback => {
  nodemon({
    script: 'index.js',
    ext: 'js jsx html json',
    watch: [SRC_DIR, BUILD_DIR],
    verbose: true,
    delay: 3
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
  gulp.watch(`${SRC_DIR}/**/*.{js,jsx}`, sequence('bundle-app', 'lint', 'version-assets'));
  gulp.watch(`${SRC_DIR}/static/**/*`, ['copy-static']);
});

gulp.task('default', callback => {
  sequence('clean', 'build', ['watch', 'serve'], callback);
});

process.on('SIGINT', process.exit);
