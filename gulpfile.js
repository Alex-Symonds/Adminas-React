// Build file bundling JavaScript, applying Babel/JSX transpiling (when needed) and uglifying.
var concat = require('gulp-concat');
// var babel = require("gulp-babel");
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');

const { watch } = require('gulp');
const sass = require('gulp-dart-sass');

const PATH_WORKING_SCRIPTS = 'src/';
const PATH_BUILT_SCRIPTS = 'adminas/static/adminas/scripts/';

const PATH_SCSS_FILES = 'scss';
const PATH_DIST_CSS = 'adminas/static/adminas/styles';

function css(){
  return gulp.src([`${PATH_SCSS_FILES}/*.scss`])
  .pipe(sass().on('error', sass.logError))
  .pipe(cleanCSS())
  .pipe(gulp.dest(PATH_DIST_CSS));
}

// function jsReact() {
//     return gulp.src([
//       `${PATH_WORKING_SCRIPTS}react-util.js`, 
//       `${PATH_WORKING_SCRIPTS}hooks/*.js`,
//       `${PATH_WORKING_SCRIPTS}reactComponents/*.js`,
//       `${PATH_WORKING_SCRIPTS}reactComponentsWithHooks/*.js`,
//       `${PATH_WORKING_SCRIPTS}react-job-page*.js`,
//       `${PATH_WORKING_SCRIPTS}app.js`,
//     ])
//         .pipe(concat('react-job.js'))
//         .pipe(babel({
//             presets: ["@babel/preset-react"]
//           }))
//         .pipe(uglify())
//         .pipe(rename({ extname: '.min.js' }))
//         .pipe(gulp.dest(PATH_BUILT_SCRIPTS));
// }

// function jsModuleManagement(){
//   return gulp.src(`${PATH_WORKING_SCRIPTS}manage_modules.js`)
//   .pipe(uglify())
//   .pipe(rename({ extname: '.min.js' }))
//   .pipe(gulp.dest(PATH_BUILT_SCRIPTS));
// }

// function jsRecords(){
//   return gulp.src([
//     `${PATH_WORKING_SCRIPTS}records_filter.js`,
//     `${PATH_WORKING_SCRIPTS}records_modal.js`,
//     `${PATH_WORKING_SCRIPTS}records_scrollShadows.js`,
//   ])
//   .pipe(concat('records.js'))
//   .pipe(uglify())
//   .pipe(rename({ extname: '.min.js' }))
//   .pipe(gulp.dest(PATH_BUILT_SCRIPTS));
// }

// function jsMain() {
//   return buildConcat([
//         /* Files used on multiple pages */
//         `${PATH_WORKING_SCRIPTS}util.js`, 
//         `${PATH_WORKING_SCRIPTS}job_comments.js`, 
//         `${PATH_WORKING_SCRIPTS}todo_management.js`,
//         /* Single-page files, but very small */
//         `${PATH_WORKING_SCRIPTS}document_main.js`,
//         `${PATH_WORKING_SCRIPTS}auto_address.js`,
//         `${PATH_WORKING_SCRIPTS}job_delete.js`,
//         `${PATH_WORKING_SCRIPTS}animation_helper.js`,
//         `${PATH_WORKING_SCRIPTS}todo_comments.js`,
//         `${PATH_WORKING_SCRIPTS}todo_status.js`,
//         `${PATH_WORKING_SCRIPTS}modal.js`,
//       ],
//       'main.js');
// }

// function jsDocumentBuilder() {
//   return buildConcat([ 
//         `${PATH_WORKING_SCRIPTS}document_builder_main.js`,
//         `${PATH_WORKING_SCRIPTS}document_items.js`
//       ],
//       'document_builder.js');
// }


// function buildConcat(glob_arr, filename){
//     return gulp.src(glob_arr)
//     .pipe(concat(filename))
//     .pipe(uglify())
//     .pipe(rename({ extname: '.min.js' }))
//     .pipe(gulp.dest(PATH_BUILT_SCRIPTS));
// }

// exports.default = gulp.parallel(jsReact, jsMain, jsDocumentBuilder, jsModuleManagement, css);

exports.default = function(){
  // watch(PATH_WORKING_SCRIPTS, jsReact);
  // watch(PATH_WORKING_SCRIPTS, jsMain);
  // watch(PATH_WORKING_SCRIPTS, jsDocumentBuilder);
  // watch(PATH_WORKING_SCRIPTS, jsModuleManagement);
  // watch(PATH_WORKING_SCRIPTS, jsRecords);
  watch(PATH_SCSS_FILES, css);
};