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