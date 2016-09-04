// инклудим зависимые файлы
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8g0LjQvdC60LvRg9C00LjQvCDQt9Cw0LLQuNGB0LjQvNGL0LUg0YTQsNC50LvRi1xyXG4vKipcclxuICogQ3JlYXRlZCBieSBNaWhhaWxTaGlybmluIG9uIDAxLjA1LjE2LlxyXG4gKi9cclxuICAgICAgICAgXHJcbiQuYWpheFNldHVwKHtcclxuXHRoZWFkZXJzOiB7ICdYLUNTUkZUb2tlbic6IGdldFRva2VuKCkgfSxcclxuXHRlcnJvcjogZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcblx0XHR2YXIgZV9tc2cgPSAnPGI+dGV4dFN0YXR1czwvYj46ICcrdGV4dFN0YXR1cytcclxuXHRcdFx0Jzxicj4gPGI+ZXJyb3JUaHJvd248L2I+OiAnK2Vycm9yVGhyb3duK1xyXG5cdFx0XHQnPGJyPiA8Yj5yZXNwb25zZVRleHQ8L2I+OiAnK1xyXG5cdFx0XHQnPHByZT4nK2pxWEhSLnJlc3BvbnNlVGV4dCsnPC9wcmU+JztcclxuXHRcdGNvbnNvbGUubG9nKCdlcnJvcicsICfQntGI0LjQsdC60LAg0L/RgNC4IEFMQVgg0LfQsNC/0YDQvtGB0LUuJywgZV9tc2cpO1xyXG5cdFx0Ly8g0LXRgdC70Lgg0LXRgdGC0Ywg0LvQvtCw0LTQtdGA0YssINGC0L4g0YPQtNCw0LvRj9C10Lwg0LjRhVxyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0JChkb2N1bWVudCkuZmluZCgnI2xheW91dCcpLnJlbW92ZSgpO1xyXG5cdFx0XHRpZiAoYWRtICYmIGFkbSAhPT0gdW5kZWZpbmVkICYmIGFkbSAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdC8vYWRtLmxvYWRlci5jbG9zZSgpO1xyXG5cdFx0XHRcdEJzRGlhbG9nLmFsZXJ0KHtcclxuXHRcdFx0XHRcdHRpdGxlOiAn0J7RiNC40LHQutCwINC/0YDQuCBBTEFYINC30LDQv9GA0L7RgdC1JyxcclxuXHRcdFx0XHRcdG1lc3NhZ2U6IGpxWEhSLnJlc3BvbnNlVGV4dCxcclxuXHRcdFx0XHRcdGNsb3NhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdFx0c2l6ZTogQnNEaWFsb2cuU0laRV9MQVJHRVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9LCA1MDApO1xyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuLy8g0L/QvtC70YPRh9Cw0LXQvCDQt9C90LDRh9C10L3QuNC1INGC0L7QutC10L3QsCDQuNC3IG1ldGEg0LfQsNC/0LjRgdC4INCyIEhUTUwg0LTQvtC60YPQvNC10L3RgtC1XHJcbmZ1bmN0aW9uIGdldFRva2VuKCkge1xyXG5cdHZhciBjc3JmX3Rva2VuID0gJCgnbWV0YVtuYW1lPWNzcmYtdG9rZW5dJykuYXR0cignY29udGVudCcpO1xyXG5cdHJldHVybiBjc3JmX3Rva2VuID8gY3NyZl90b2tlbiA6IG51bGwgO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqINCl0LXQu9C/0LXRgCDQv9C+INC+0YLQv9GA0LDQstC60LrQtSBBSkFYINC30LDQv9GA0YHQvtCyXHJcbiAqINC/0L7QutCwINC30LDQs9C+0YLQvtCy0LrQsCwg0L/QvtGB0YLQtdC/0LXQvdC90L4g0YDQsNGB0YnQuNGA0LjQvFxyXG4gKiB0b2RvINGB0LTQtdC70LDRgtGMINGA0LXQsNC70LjQt9Cw0YbQuNGOINC80L7QtNCw0LvRjNC90YvRhSDQvtC60L7QvSDQuCDRgdGC0LjQutC10YDQvtCyXHJcbiAqINC90LAg0L/RgNC40LzQtdC8INC/0L7Qu9GD0YfQsNC10Lwg0LTQsNC90L3Ri9C1INCyIGpzb246XHJcbiAqIFx0ZGF0YS5jb250ZW50IC0g0YLQtdC70L4g0L7RgtCy0LXRgtCwINGBINGB0LXRgNCy0LXRgNCwXHJcbiAqIFx0ZGF0YS5zdGF0dXNcdC0g0YHRgtCw0YLRg9GBINC+0YLQstC10YLQsFxyXG4gKiBAcGFyYW0gb3B0aW9uc1xyXG4gKiBAcGFyYW0gY2FsbGJhY2tcclxuICovXHJcbmZ1bmN0aW9uIHNlbmRBamF4KG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcblx0Ly8g0J/QsNGA0LDQvNC10YLRgNGLINC30LDQv9GA0L7RgdCwINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOXHJcblx0dmFyIGRlZmF1bHRzID0ge1xyXG5cdFx0dXJsOiBcIi9cIixcclxuXHRcdGRhdGE6IHt9LFxyXG5cdFx0dGltZW91dDogNTAwMDAsXHJcblx0XHR0eXBlOiAnR0VUJyxcclxuXHRcdGNhY2hlOiBmYWxzZSxcclxuXHRcdGRhdGFUeXBlOiBcIlwiXHJcblx0fTtcclxuXHJcblx0dmFyIHBhcmFtcyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcblx0Ly9jb25zb2xlLmxvZyAoJ3NlbmRBamF4IHVybCcsIHBhcmFtcy51cmwpO1xyXG5cdC8vZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YVN0cmluZyksXHJcblx0JC5hamF4KCB7XHJcblx0XHR1cmw6IHBhcmFtcy51cmwsXHJcblx0XHRkYXRhOiBwYXJhbXMuZGF0YSxcclxuXHRcdHRpbWVvdXQ6IHBhcmFtcy50aW1lb3V0LFxyXG5cdFx0dHlwZTogcGFyYW1zLnR5cGUsXHJcblx0XHRjYWNoZTogcGFyYW1zLmNhY2hlLFxyXG5cdFx0ZGF0YVR5cGU6IHBhcmFtcy5kYXRhVHlwZSxcclxuXHJcblx0XHRzdWNjZXNzOmZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG5cdFx0XHRcdFx0Ly9BcHAuTWVzc2FnZXMuZXJyb3IoZGF0YS5jb250ZW50KTtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nIChcIkFwcC5NZXNzYWdlcy5lcnJvclwiLCBkYXRhLmNvbnRlbnQgLCBwYXJhbXMudXJsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FsbGJhY2soZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2cgKFwiY2FsbGJhY2sg0L3QtSDRgdGA0LDQsdC+0YLQsNC7XCIsIGNhbGxiYWNrKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0fSk7XHJcblxyXG59XHJcbmZ1bmN0aW9uIHVwbG9hZEFqYXgob3B0aW9ucywgY2FsbGJhY2spIHtcclxuXHQvLyDQn9Cw0YDQsNC80LXRgtGA0Ysg0LfQsNC/0YDQvtGB0LAg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y5cclxuXHR2YXIgZGVmYXVsdHMgPSB7XHJcblx0XHR1cmw6IFwiL1wiLFxyXG5cdFx0ZGF0YToge30sXHJcblx0XHR0aW1lb3V0OiA1MDAwMCxcclxuXHRcdGNhY2hlOiBmYWxzZSxcclxuXHRcdGRhdGFUeXBlOiBcIlwiLFxyXG5cdFx0dHlwZTogJ1BPU1QnLFxyXG5cdFx0Y29udGVudFR5cGU6IGZhbHNlLFxyXG5cdFx0cHJvY2Vzc0RhdGE6IGZhbHNlXHJcblx0fTtcclxuXHR2YXIgcGFyYW1zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuXHQkLmFqYXgoIHtcclxuXHRcdHVybDogXHRcdFx0cGFyYW1zLnVybCxcclxuXHRcdGRhdGE6IFx0XHRcdHBhcmFtcy5kYXRhLFxyXG5cdFx0dGltZW91dDogXHRcdHBhcmFtcy50aW1lb3V0LFxyXG5cdFx0dHlwZTogXHRcdFx0cGFyYW1zLnR5cGUsXHJcblx0XHRjYWNoZTogXHRcdFx0cGFyYW1zLmNhY2hlLFxyXG5cdFx0ZGF0YVR5cGU6IFx0XHRwYXJhbXMuZGF0YVR5cGUsXHJcblx0XHRjb250ZW50VHlwZTpcdHBhcmFtcy5jb250ZW50VHlwZSxcclxuXHRcdHByb2Nlc3NEYXRhOlx0cGFyYW1zLnByb2Nlc3NEYXRhLFxyXG5cclxuXHRcdHN1Y2Nlc3M6ZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdGlmIChkYXRhLnN0YXR1cyA9PSAnZXJyb3InKSB7XHJcblx0XHRcdFx0XHQvL0FwcC5NZXNzYWdlcy5lcnJvcihkYXRhLmNvbnRlbnQpO1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cgKFwiQXBwLk1lc3NhZ2VzLmVycm9yXCIsIGRhdGEuY29udGVudCAsIHBhcmFtcy51cmwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWxsYmFjayhkYXRhKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyAoXCJjYWxsYmFjayDQvdC1INGB0YDQsNCx0L7RgtCw0LtcIiwgY2FsbGJhY2spO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiDQn9GA0L7QstC10YDRj9C10Lwg0L7RgtCy0LXRgiBBSkFYINC30LDQv9GA0L7RgdCwXHJcbiAqIEBwYXJhbSB2YWx1ZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXHJcbmZ1bmN0aW9uIGlzT0sodmFsdWUpIHtcclxuXHRpZiAodmFsdWUuc3RhdHVzKSB7XHJcblx0XHRpZiAodmFsdWUuc3RhdHVzID09ICdzdWNjZXNzJykge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHZhbHVlID09ICdzdWNjZXNzJztcclxufVxyXG5cclxuXHJcblxyXG4vLyQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuLy9cdCQoJy50ZXN0dCcpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcclxuLy9cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4vL1x0XHR2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG4vL1x0XHR2YXIgcm9sZSA9ICR0aGlzLmF0dHIoJ2RhdGEtcm9sZScpO1xyXG4vL1x0XHR2YXIgdXJsID0gJy9lbi9maWx0ZXIvYWRkJztcclxuLy9cclxuLy9cclxuLy9cdFx0c2VuZEFqYXgoe1xyXG4vL1x0XHRcdHVybDogdXJsXHJcbi8vXHRcdH0sIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4vL1x0XHRcdGNvbnNvbGUubG9nKCdjYWxsYmFjaycgLCBjYWxsYmFjayk7XHJcbi8vXHRcdH0pO1xyXG4vL1xyXG4vL1xyXG4vL1x0fSk7XHJcbi8vXHJcbi8vfSk7XHJcbi8qKlxyXG4gKiDQn9GA0L7QstC10YDRj9C10Lwg0L3QsCDRgdC+0L7RgtCy0LXRgtGB0LLQuNC1INGBIFVSTFxyXG4gKiBAcGFyYW0gaHJlZlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXHJcbmZ1bmN0aW9uIGlzVXJsKGhyZWYpIHtcclxuXHRyZXR1cm4gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihocmVmKSAhPT0gLTE7XHJcbn1cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG5cdC8vJC5mbi5zZWxlY3QyLmRlZmF1bHRzLnNldCggXCJ0aGVtZVwiLCBcImJvb3RzdHJhcFwiICk7XHJcblx0JCggXCIuc2VsZWN0MlwiICkuc2VsZWN0Mih7XHJcblx0XHR0aGVtZTogXCJib290c3RyYXBcIixcclxuXHRcdGFsbG93Q2xlYXI6IHRydWUsXHJcblx0XHR3aWR0aDogJzEwMCUnXHJcblx0fSk7XHJcbn0pOyJdLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
