/**
 * Created by MihailShirnin on 01.05.16.
 */
         
$.ajaxSetup({
	headers: { 'X-CSRFToken': getToken() },
	error: function(jqXHR, textStatus, errorThrown) {
		var e_msg = '<b>textStatus</b>: '+textStatus+
			'<br> <b>errorThrown</b>: '+errorThrown+
			'<br> <b>responseText</b>: '+
			'<pre>'+jqXHR.responseText+'</pre>';
		console.log('error', 'Ошибка при ALAX запросе.', e_msg);
		// если есть лоадеры, то удаляем их
		setTimeout(function() {
			$(document).find('#layout').remove();
			if (adm && adm !== undefined && adm !== null) {
				//adm.loader.close();
				BsDialog.alert({
					title: 'Ошибка при ALAX запросе',
					message: jqXHR.responseText,
					closable: true,
					size: BsDialog.SIZE_LARGE
				});
			}
		}, 500);

	}
});

// получаем значение токена из meta записи в HTML документе
function getToken() {
	var csrf_token = $('meta[name=csrf-token]').attr('content');
	return csrf_token ? csrf_token : null ;
}


/**
 * Хелпер по отправкке AJAX запрсов
 * пока заготовка, постепенно расщирим
 * todo сделать реализацию модальных окон и стикеров
 * на примем получаем данные в json:
 * 	data.content - тело ответа с сервера
 * 	data.status	- статус ответа
 * @param options
 * @param callback
 */
function sendAjax(options, callback) {
	// Параметры запроса по умолчанию
	var defaults = {
		url: "/",
		data: {},
		timeout: 50000,
		type: 'GET',
		cache: false,
		dataType: ""
	};

	var params = $.extend({}, defaults, options);
	//console.log ('sendAjax url', params.url);
	//data: JSON.stringify(dataString),
	$.ajax( {
		url: params.url,
		data: params.data,
		timeout: params.timeout,
		type: params.type,
		cache: params.cache,
		dataType: params.dataType,

		success:function(data) {
			if (typeof callback == "function") {
				if (data.status == 'error') {
					//App.Messages.error(data.content);
					console.log ("App.Messages.error", data.content , params.url);
				}
				callback(data);
			} else {
				console.log ("callback не сработал", callback);
			}

		}

	});

}
function uploadAjax(options, callback) {
	// Параметры запроса по умолчанию
	var defaults = {
		url: "/",
		data: {},
		timeout: 50000,
		cache: false,
		dataType: "",
		type: 'POST',
		contentType: false,
		processData: false
	};
	var params = $.extend({}, defaults, options);
	$.ajax( {
		url: 			params.url,
		data: 			params.data,
		timeout: 		params.timeout,
		type: 			params.type,
		cache: 			params.cache,
		dataType: 		params.dataType,
		contentType:	params.contentType,
		processData:	params.processData,

		success:function(data) {
			if (typeof callback == "function") {
				if (data.status == 'error') {
					//App.Messages.error(data.content);
					console.log ("App.Messages.error", data.content , params.url);
				}
				callback(data);
			} else {
				console.log ("callback не сработал", callback);
			}

		}

	});
}


/**
 * Проверяем ответ AJAX запроса
 * @param value
 * @returns {boolean}
 */
function isOK(value) {
	if (value.status) {
		if (value.status == 'success') {
			return true;
		}
	}
	return value == 'success';
}



//$(document).ready(function () {
//	$('.testt').click(function(e) {
//		e.preventDefault();
//		var $this = $(this);
//		var role = $this.attr('data-role');
//		var url = '/en/filter/add';
//
//
//		sendAjax({
//			url: url
//		}, function (callback) {
//			console.log('callback' , callback);
//		});
//
//
//	});
//
//});