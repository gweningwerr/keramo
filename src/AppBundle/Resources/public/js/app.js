// инклудим зависимые файлы
//= plugins/ajax.js
/**
 * Проверяем на соответсвие с URL
 * @param href
 * @returns {boolean}
 */
function isUrl(href) {
	return window.location.href.indexOf(href) !== -1;
}
$(document).ready(function () {
	//$.fn.select2.defaults.set( "theme", "bootstrap" );
	$( ".select2" ).select2({
		theme: "bootstrap",
		allowClear: true,
		width: '100%'
	});
});
