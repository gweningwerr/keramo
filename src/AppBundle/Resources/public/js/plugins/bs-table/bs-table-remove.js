

/**
 * Реадизация фильтров для bootstrapTable
 */

!function($) {
	'use strict';


	$.extend($.fn.bootstrapTable.defaults, {
		showDell: true,
		btnDellId: "remove"	// id кнопки удаления
	});


	$.extend($.fn.bootstrapTable.events, {
		'dell-options.bs.table': 'onDellOptions'
	});


	var BootstrapTable = $.fn.bootstrapTable.Constructor,
		_init = BootstrapTable.prototype.init,
		_initToolbar = BootstrapTable.prototype.initToolbar;


	BootstrapTable.prototype.initToolbar = function () {
		_initToolbar.apply(this, Array.prototype.slice.apply(arguments));
		var that = this;
		if (that.options.showDell) {
			that.$toolbar
				.find(".columns")
				.prepend('' +
				//'<div class="form-group">' +
				'	<button disabled="" id="' + that.options.btnDellId + '" class="btn btn-danger" title="удалить" data-loading-text="удаление ...">' +
				'		<i class="fa fa-trash"></i>' +
				'	</button>' +
				//'</div>'+
				'');

			that.$delBtn = $('#'+that.options.btnDellId);

			that.$toolbar.delegate('#'+that.options.btnDellId, 'click', function(e) {
				e.preventDefault();

				var ids = funcBSgetIdSelections();
				var cntRow = ids.length;



				var msg = '';
				var nameLog = cntRow > 1 ? 'логов ' : 'лога ';
				msg += '<b>Внимание</b>: Требуется подтверждение. Вернуть будет нельзя! ';
				msg += '<br><b>Операция</b>: Удаление ' + nameLog;
				msg += '<br><b>Количество строк</b>: ' + cntRow + '<pre>' + ids + '</pre>';

				BootstrapDialog.confirm(msg, function(result){
					if(result) {
						that.dell(ids);
					}
				});



			});
		}


	};

	BootstrapTable.prototype.init = function () {
		_init.apply(this, Array.prototype.slice.apply(arguments));

		var that = this;

		// ставим слежение за выбранными чекбоксами
		// и в зависимости от их статуса меняем стутус кнопки на активную или наоборот
		if (that.options.showDell) {
			that.$el.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table', function () {
				that.$delBtn.prop('disabled', !$bstable.bootstrapTable('getSelections').length);

			});
		}


	};

	// функция удаления каких либо значений (строк) через BootstrapTable
	BootstrapTable.prototype.dell = function(ids) {
		var that = this;

		var param = {};
		param.cont	= vars.sendTo.cont;
		param.mod	= vars.sendTo.mod;
		param.func	= vars.sendTo.func;
		param.do	= 'delete';
		param.id	= ids;


		// анимация для кнопки запуска обновления
		that.$delBtn.button('loading');

		func_send_ajax(param, false, function (res) {
			var delay = 0;
			var cnt = 0;
			var cntRow = res.length;
			$.each(res, function (i, val) {
				setTimeout(function(){
					func_msg_notify(val.status, val.msg, 'Удаление лога');
					if (val.status == 'success') {
						$bstable.bootstrapTable('remove', {
							field: 'id',
							values: [val.id]
						});
					}

					cnt ++;
					if (cntRow == cnt) {
						// скидываем анимацю кнопки
						that.$delBtn.button('reset');
						setTimeout(function(){
							// деактивируем кнопку
							that.$delBtn.prop('disabled', true);
						}, 1);
						setTimeout(function(){
							that.refresh();
							func_msg_notify('success', 'Удалено строк: ' +cntRow);
						}, 1000);
					}

				}, delay += 1000);

			});


		});

	};


}(jQuery);