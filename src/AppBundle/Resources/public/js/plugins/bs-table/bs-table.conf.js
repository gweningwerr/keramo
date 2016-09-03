$(function () {
	// ставим дефолтные настройки для аяксовых таблиц с сортировкой и пр.
	$.extend( true, $.fn.bootstrapTable.defaults, {
		iconsPrefix: 'fa',
		icons: {
			paginationSwitchDown: 'fa-sort-desc',
			paginationSwitchUp: 'fa-sort-asc',
			refresh: 'fa-refresh',
			toggle: 'fa-list-alt',
			columns: 'fa-eye mr5',
			detailOpen: 'fa-plus-square-o',
			detailClose: 'fa-minus-square-o'
		},
		pageSize: 25,
		pageList: [10, 25, 50, 100, 500, 1000],
		showRefresh: true,		// обновление
		cache: false,			// кеширование
		search: true,			// поиск
		pagination: true,		// пагинация
		showColumns: true,		// возможность скрывать столбцы
		method: 'POST',
		queryParams: function (params) {
			var param = {};
			
			param.bstable = params;
			//param.bstable.filter = func_get_form_vals(bsToolbarFilter);
			
			return param;
		}
	} );
		
	// if (bsToolbarFilter) {
	// 	$.extend($.fn.bootstrapTable.defaults, {
	// 		showFilter: true,
	// 		toolbar: vars.bsToolbar.class,
	// 		showRefresh: false		// обновление
	// 	});
	// } else {
	// 	$.extend($.fn.bootstrapTable.defaults, {
	// 		showFilter: false,
	// 		toolbar: '',
	// 		showRefresh: true		// обновление
	// 	});
	// }
});



$(document).ready(function () {

	if (adm.$bstable().length > 0) {
		adm.$bstable().each(function () {
			var $bst = $(this);
			if ($bst.hasClass('user-list')) {
				$bst.bootstrapTable({
					sidePagination: 'server',
					sortName: 'id',
					sortOrder: 'desc',
					showDell: true,
					//url: url
				});
			}
		});
		
		var $toolbar = $('.fixed-table-toolbar');
		$('.page-heading').append($toolbar);
		
		adm.$bstable().on('load-success.bs.table', function (e, data) {
			$('[rel="tooltip"]').tooltip({
				container: 'body'
			});
		});
		
		
	}
});



///////////////////////////////////////////////////////////////////
//	функции для bootstrapTable
///////////////////////////////////////////////////////////////////

function formatterId(value, row, index) {
	if (row.links && row.links.edit) {
		value = '<a href="' + row.links.edit + '">' + value + '</a>';
	}
	return value;
}
/**
 * формируем список операций
 * @param value
 * @param row
 * @returns {*}
 */
function formatterActions(value, row) {
	if (row.actions && row.links) {
		value = '<div class="btn-group btn-group-xs">';
		$.each(row.actions, function( name, link ) {
			switch (name) {
				case 'delete':
					value += '<a href="' + link + '" title="' + name + '" class="btn btn-danger"><i class="fa fa-times"></i></a>';
					break;
				case 'edit':
					value += '<a href="' + link + '" title="' + name + '" class="btn btn-default"><i class="fa fa-pencil"></i></a>';
					break;
			}
		});
		value += '</div>'
	}
	return value;
}

// function funcBSgetIdSelections() {
// 	return $.map(adm.$bstable().bootstrapTable('getSelections'), function (row) {
// 		return row.id
// 	});
// }


//window.operateEvents = {
//	'click .full_info_logs_admin': function (e, value, row, index) {
//		e.preventDefault();
//		var param = "&action=get_full_log&id="+row['id'];
//		func_send_ajax(param, false, function (callback) {
//			var result = JSON.parse(JSON.stringify(callback.body));
//			func_new_modal_show('info', row['title'], result);
//		});
//	},
//
//
//	'click .like': function (e, value, row, index) {
//
//		alert('You click like icon, row: ' + JSON.stringify(row));
//		console.log(value, row, index);
//	},
//	'click .edit': function (e, value, row, index) {
//		alert('You click edit icon, row: ' + JSON.stringify(row));
//		console.log(value, row, index);
//	},
//	'click .remove': function (e, value, row, index) {
//		alert('You click remove icon, row: ' + JSON.stringify(row));
//		console.log(value, row, index);
//	}
//};



