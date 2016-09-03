

/**
 * Реадизация фильтров для bootstrapTable
 */

!function($) {
	'use strict';


	$.extend($.fn.bootstrapTable.defaults, {
		queryParamsFilter: function (params) {
			if($("#toolbar").exists()) {
				var filter = {};
				$('#toolbar').find('input[name]').each(function () {
					filter[$(this).attr('name')] = $(this).val();
				});

				$('#toolbar').find('select[name]').each(function () {
					var str = '';
					$(this).children('option:selected').each(function() {
						if ($(this).length > 0 && $(this).val().length > 0 ) {
							if (str != '') {
								str += ", ";
							}
							str += "'" + $(this).val() + "'";
						}
					});

					if (str.length > 0) {
						filter[$(this).attr('name')] = str;
					}

				});

				params.filter = filter;
			}
			return params;
		},
		showFilter: false,
		showRefresh: false,
		onClearOptions: function (options) {
			return false;
		}
	});


	$.extend($.fn.bootstrapTable.events, {
		'clear-options.bs.table': 'onClearOptions'
	});


	var BootstrapTable = $.fn.bootstrapTable.Constructor,
		_init = BootstrapTable.prototype.init,
		_initToolbar = BootstrapTable.prototype.initToolbar;



	BootstrapTable.prototype.initToolbar = function () {
		_initToolbar.apply(this, Array.prototype.slice.apply(arguments));
		var that = this;
		if (that.options.showFilter) {
			that.$toolbar
				.find(".columns")
				.append('' +
				'	<button type="button" class="btn btn-default dropdown-toggle btn-filter" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">'+
				'		<i class="fa fa-filter mr5"></i> <span class="caret"></span>'+
				'	</button>'+
				'	<ul class="dropdown-menu filter-list" role="menu"> </ul>'+
				'');
			that.$toolbar.delegate('button[name="refresh"]', 'click', function() {
				that.refresh();

				// анимация для кнопки запуска обновления
				var btn = $(this);
				btn.button('loading');
				setTimeout(function () {
					btn.button('reset')
				},1000 )

			});
		}

	};

	BootstrapTable.prototype.init = function () {
		_init.apply(this, Array.prototype.slice.apply(arguments));

		var that = this;
		this.initFilterButton();
		this.initFilters();
		this.initFilterSelector();

		this.$el.on('load-success.bs.table', function () {
			if (that.options.showFilter) {
				//console.log (that.$toolbar);
				//$(that.options.toolbar).bootstrapTableFilter({
				//	connectTo: that.$el
				//});
			}
		});
	};


	BootstrapTable.prototype.initFilterButton = function() {
		this.$button = this.$toolbar.find('.btn-filter');
		this.$buttonList = this.$button.parent().find('.filter-list');
		this.$button.dropdown();
		this.$filters = this.$toolbar.find('.form-filter').find('[name]');
	};

	BootstrapTable.prototype.initFilters = function() {
		var that = this;
		that.$buttonList.append('<li class="remove-filters"><a class="btn btn-sm btn-default btn-label" href="javascript:void(0)"><i class="fa fa-times"></i> Очистить все фильтры</a></li>');
		that.$buttonList.append('<li class="divider"></li>');

		$.each(this.$filters, function(i, filter) {
			that.addFilter(filter);
		});
		that.$toolbar.delegate('.remove-filters *', 'click', function() {
			that.clearFilterValue();

			$.each(that.$filters, function(i, filter) {
				that.disableFilter($(filter).attr("name"));
			});
		});
	};

	BootstrapTable.prototype.initFilterSelector = function() {
		var that = this;


		var applyFilter = function($chck) {
			var filterField = $chck.closest('[data-filter-field]').attr('data-filter-field');
			if ($chck.prop('checked')) {
				that.enableFilter(filterField)
			}
			else {
				that.disableFilter(filterField);
			}
		};
		this.$buttonList.delegate('li :input[type=checkbox]', 'click', function(e) {
			console.log ('$buttonList.delegate',$(this));
			applyFilter($(this));
			e.stopImmediatePropagation();
		});
		this.$buttonList.delegate('li, li a', 'click', function(e) {
			var $chck = $(':input[type=checkbox]', this);
			if ($chck.length) {
				$chck.prop('checked', !$chck.is(':checked'));
				applyFilter($chck);
				e.stopImmediatePropagation();
			}
			var $inp = $(':input[type=text]', this);
			if ($inp.length) {
				$inp.focus();
			}
		});
	};

	BootstrapTable.prototype.addFilter = function(filter) {

		this.$buttonList.append('<li data-filter-field="' + $(filter).attr("name") + '"><a href="javascript:void(0)"><input type="checkbox"> ' + $(filter).attr("placeholder") + '</a></li>');
		this.disableFilter($(filter).attr("name"));

		//this.filters[filter.field] = filter;
		//this.$buttonList.append('<li data-filter-field="' + filter.field + '"><a href="javascript:void(0)"><input type="checkbox"> ' + filter.label + '</a></li>');
		//
		//this.trigger('add-filter', filter);
		//if (typeof filter.enabled !== 'undefined' && filter.enabled) {
		//	//this.enableFilter(filter.field);
		//}
	};


	BootstrapTable.prototype.disableFilter = function(name_field) {
		var field = this.getFilter(name_field);
		$(field).parents('.form-group').hide();
		this.$buttonList.find('[data-filter-field=' + name_field + '] input[type=checkbox]').prop('checked', false);

	};

	BootstrapTable.prototype.enableFilter = function(name_field) {
		var field = this.getFilter(name_field);
		$(field).parents('.form-group').show();

	};


	BootstrapTable.prototype.getFilter = function(name_field) {
		var toReturn = false;
		$.each(this.$filters, function(i, filter) {
			if ($(filter).attr("name") == name_field) {
				toReturn = $(filter);
				return false;
			}
		});
		return toReturn;
	};




	// добавлено действие под кнопку очистки значений фильтров
	BootstrapTable.prototype.clearFilterValue = function (params) {
		var reload = false;
		// ищем инпуты и селекты у которых указаны атрибуты "name" и скидываем их данные
		this.$filters.each(function () {
			if ($(this).val() && $(this).val().length > 0) {
				reload = true;
				$(this).val(null).trigger("change");
			}
		});


		if (reload) {
			if (params && params.url) {
				this.options.url = params.url;
				this.options.pageNumber = 1;
			}
			this.initServer(params && params.silent, params && params.query);
		}

	};

}(jQuery);