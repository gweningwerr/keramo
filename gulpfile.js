var gulp = require('gulp'),
    less = require('gulp-less'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    minifyJs = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    plumber = require('gulp-plumber'),
    debug = require('gulp-debug'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    strip = require('gulp-strip-comments'),
	rigger = require('gulp-rigger'),
	argv = require('yargs').argv,				// получение переменных
	isDebag = argv.debag ? false : true			// определение дебага
	;

var buld = {
	less: {
		lib: [
			'bower_components/bootstrap/less/bootstrap.less',
			'bower_components/angular-bootstrap/ui-bootstrap-csp.css',
			'bower_components/font-awesome-less/css/font-awesome.css'
		],
		base: [
			'src/AppBundle/Resources/public/css/*.less'
		]
	},
	js: {
		lib: [
			'bower_components/jquery/dist/jquery.js',
			'bower_components/angular/angular.js',
			'bower_components/angular-animate/angular-animate.js',
			'bower_components/angular-sanitize/angular-sanitize.js',
			'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
			'bower_components/angular-bootstrap/ui-bootstrap.js'
			//'bower_components/bootstrap/dist/js/bootstrap.js'
		],
		base: [
			'src/AppBundle/Resources/public/js/adminka.js',
			'src/AppBundle/Resources/public/js/*.js'
		]
	}
};
/////////////////////////////////////////////////////////////////
// gulp buld:less:lib
/////////////////////////////////////////////////////////////////
gulp.task('buld:less:lib', function () {
    return gulp.src( buld.less.lib )
		.pipe(rigger()) 				// Прогоним через rigger
		.pipe(less())
		.pipe(concat('lib.css'))
		.pipe(gulp.dest('web/css/'))
		// собираем версию min
        .pipe(cssmin())					// сжимаем
        .pipe(rename({suffix: '.min'}))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('web/css/'));
});
/////////////////////////////////////////////////////////////////
// gulp buld:less
/////////////////////////////////////////////////////////////////
gulp.task('buld:less', function () {
    return gulp.src( buld.less.base )
        .pipe(less())
		.pipe(gulp.dest('web/css/'))
		// собираем версию min
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('web/css/'));
});
/////////////////////////////////////////////////////////////////
// gulp buld:fonts
/////////////////////////////////////////////////////////////////
gulp.task('buld:fonts', function () {
    return gulp.src([
    	'bower_components/bootstrap/fonts/*',
		'bower_components/font-awesome-less/fonts/*'
	])
        .pipe(gulp.dest('web/fonts/'))
});


/////////////////////////////////////////////////////////////////
// gulp buld:js:lib
/////////////////////////////////////////////////////////////////
gulp.task('buld:js:lib', function() {
	gulp.src( buld.js.lib )
		.pipe(rigger()) 				// Прогоним через rigger
		.pipe(sourcemaps.init()) 		// Инициализируем sourcemap
		.pipe(sourcemaps.write()) 		// Пропишем карты
		.pipe(concat('lib.js'))
		.pipe(gulp.dest('web/js/'))
		// собираем версию min
		//.pipe(strip())					// чистим комменты
		.pipe(minifyJs())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('web/js/'))
	;
	
});
/////////////////////////////////////////////////////////////////
// gulp buld:js
/////////////////////////////////////////////////////////////////
gulp.task('buld:js', function() {

	if (isDebag) {
		gulp.src( buld.js.base )
			.pipe(debug({title: 'debug:'}))
			.pipe(rigger()) 				// Прогоним через rigger
			.pipe(sourcemaps.init()) 		// Инициализируем sourcemap
			.pipe(jshint()) 				// проверка синтаксиса
			.pipe(jshint.reporter('default'))
			.pipe(sourcemaps.write()) 		// Пропишем карты
			.pipe(gulp.dest('web/js/'))
			// собираем версию min
			.pipe(strip())					// чистим комменты
			.pipe(minifyJs())
			.pipe(rename({suffix: '.min'}))
			.pipe(gulp.dest('web/js/'))
		;
	} else {
		gulp.src( buld.js.base )
			.pipe(rigger()) 				// Прогоним через rigger
			.pipe(sourcemaps.init()) 		// Инициализируем sourcemap
			.pipe(sourcemaps.write()) 		// Пропишем карты
			.pipe(gulp.dest('web/js/'))
			// собираем версию min
			.pipe(strip())					// чистим комменты
			.pipe(minifyJs())
			.pipe(rename({suffix: '.min'}))
			.pipe(gulp.dest('web/js/'))
		;
	}
	
});

// отчистка папок
gulp.task('clean', function () {
    return gulp.src(['web/css/*', 'web/js/*', 'web/img/*', 'web/fonts/*'])
        .pipe(clean());
});

gulp.task('default', ['clean'], function () {
    var tasks = [
    	'buld:js:lib',
		'buld:js',
		'buld:less:lib',
		'buld:less',
		'buld:fonts'
	];
    tasks.forEach(function (val) {
        gulp.start(val);
    });
});

// компиляция скриптов занимает много времени поэтому тут работа над скриптами разбита на отдельные task
// следить за изменениями во всех файлах less и в скриптах (те которые в корне js/ , в папках common-scripts, helpers)
// gulp watch
gulp.task('watch', function () {
    var less = gulp.watch(buld.less.base, ['buld:less']),
        js = gulp.watch(buld.js.base, ['buld:js']);
});
  
