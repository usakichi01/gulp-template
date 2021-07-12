const gulp = require('gulp'),
  sass = require('gulp-sass'),
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),
  sassGlob = require('gulp-sass-glob'),
  crlf = require('gulp-cr-lf-replace'),
  browserSync = require('browser-sync'),
  ssi = require('connect-ssi'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  cssdeclsort = require('css-declaration-sorter'),
  sourcemaps = require('gulp-sourcemaps'),
  mqpacker = require('css-mqpacker'),
  ejs = require('gulp-ejs'),
  htmlbeautify = require("gulp-html-beautify"),
  fs = require('fs'),
  replace = require('gulp-replace'),
  rename = require('gulp-rename'),
  changed = require('gulp-changed'),
  imagemin = require('gulp-imagemin'),
  imageminJpg = require('imagemin-jpeg-recompress'),
  imageminPng = require('imagemin-pngquant'),
  imageminGif = require('imagemin-gifsicle');

// path設定
const paths = {
  srcDir: './src',
  src: {
    scss: './src/**/*.scss',
    images: './src/img-min/**/*.+(jpg|jpeg|png|gif)',
    ejs: './src/**/*.ejs'
  },
  distDir: './dist'
};

/*
* 画像の圧縮タスク
*/
gulp.task('image-min', function () {
  return gulp.src(paths.src.images)
    .pipe(changed(paths.distDir))
    .pipe(imagemin([
      imageminPng(),
      imageminJpg(),
      imageminGif({
        interlaced: false,
        optimizationLevel: 3,
        colors: 180
      })
    ]
    ))
    .pipe(gulp.dest('./'));
});


/*
* scssのコンパイル
*/
gulp.task('sass', function () {
  return gulp
    .src(paths.src.scss)
    .pipe(sourcemaps.init())
    .pipe(
      plumber({
        errorHandler: notify.onError('Error: <%= error.message %>')
      })
    )
    .pipe(
      sassGlob({
        ignorePaths: ['']
      })
    )
    .pipe(
      sass({
        outputStyle: 'expanded'
      })
    )
    .pipe(postcss([mqpacker()]))
    .pipe(
      postcss([
        autoprefixer({
          cascade: false
        })
      ])
    )
    .pipe(
      crlf({
        changeCode: 'CR+LF'
      })
    )
    .pipe(
      postcss([
        cssdeclsort({
          order: 'smacss'
        })
      ])
    )
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.distDir));
});


/*
* ejsのコンパイル
*/
gulp.task('ejs', function () {
  const metaJson = JSON.parse(fs.readFileSync("src/common/json/meta.json", "utf-8"));
  const options = {
    indent_size: 2
  };
  return gulp
    .src([paths.src.ejs, '!' + 'src/**/_*.ejs'])
    .pipe(ejs({ json: metaJson }))
    .pipe(rename({ extname: '.html' }))
    .pipe(crlf({ changeCode: 'CR+LF' }))
    .pipe(htmlbeautify(options))
    .pipe(replace(/[\s\S]*?(<!DOCTYPE)/, '$1'))
    .pipe(gulp.dest(paths.distDir));
});


/*
* 保存時のリロード
*/
gulp.task('browser-sync', function (done) {
  browserSync.init({
    server: {
      baseDir: paths.distDir,
      port: 3001,
      middleware: [
        ssi({
          baseDir: paths.distDir,
          ext: '.html'
        })
      ]
    },
    startPath: 'index.html',
    open: 'external',
    notify: false
  });
  done();
});

gulp.task('bs-reload', function (done) {
  browserSync.reload();
  done();
});


/*
* 監視
*/
gulp.task('watch-sass', function (done) {
  gulp.watch(paths.src.scss, gulp.task('sass'));
  gulp.watch(paths.src.scss, gulp.task('bs-reload'));
});

gulp.task('watch-ejs', function (done) {
  gulp.watch(paths.src.ejs, gulp.task('ejs'));
  gulp.watch(paths.src.ejs, gulp.task('bs-reload'));
  gulp.watch(paths.distDir + '/**/*.html', gulp.task('bs-reload'));
});


/*
* デフォルト設定
*/
gulp.task('default', gulp.series(gulp.parallel('sass', 'ejs', 'browser-sync', 'watch-sass', 'watch-ejs'),
  function (done) {
    done();
  }
));
