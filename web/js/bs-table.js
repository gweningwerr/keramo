// инклудим зависимые файлы
/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * version: 1.11.0
 * https://github.com/wenzhixin/bootstrap-table/
 */

(function ($) {
    'use strict';

    // TOOLS DEFINITION
    // ======================

    var cachedWidth = null;

    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    };

    var getPropertyFromOther = function (list, from, to, value) {
        var result = '';
        $.each(list, function (i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    var getFieldIndex = function (columns, field) {
        var index = -1;

        $.each(columns, function (i, column) {
            if (column.field === field) {
                index = i;
                return false;
            }
            return true;
        });
        return index;
    };

    // http://jsfiddle.net/wenyi/47nz7ez9/3/
    var setFieldIndex = function (columns) {
        var i, j, k,
            totalCol = 0,
            flag = [];

        for (i = 0; i < columns[0].length; i++) {
            totalCol += columns[0][i].colspan || 1;
        }

        for (i = 0; i < columns.length; i++) {
            flag[i] = [];
            for (j = 0; j < totalCol; j++) {
                flag[i][j] = false;
            }
        }

        for (i = 0; i < columns.length; i++) {
            for (j = 0; j < columns[i].length; j++) {
                var r = columns[i][j],
                    rowspan = r.rowspan || 1,
                    colspan = r.colspan || 1,
                    index = $.inArray(false, flag[i]);

                if (colspan === 1) {
                    r.fieldIndex = index;
                    // when field is undefined, use index instead
                    if (typeof r.field === 'undefined') {
                        r.field = index;
                    }
                }

                for (k = 0; k < rowspan; k++) {
                    flag[i + k][index] = true;
                }
                for (k = 0; k < colspan; k++) {
                    flag[i][index + k] = true;
                }
            }
        }
    };

    var getScrollBarWidth = function () {
        if (cachedWidth === null) {
            var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                w1, w2;

            outer.append(inner);
            $('body').append(outer);

            w1 = inner[0].offsetWidth;
            outer.css('overflow', 'scroll');
            w2 = inner[0].offsetWidth;

            if (w1 === w2) {
                w2 = outer[0].clientWidth;
            }

            outer.remove();
            cachedWidth = w1 - w2;
        }
        return cachedWidth;
    };

    var calculateObjectValue = function (self, name, args, defaultValue) {
        var func = name;

        if (typeof name === 'string') {
            // support obj.func1.func2
            var names = name.split('.');

            if (names.length > 1) {
                func = window;
                $.each(names, function (i, f) {
                    func = func[f];
                });
            } else {
                func = window[name];
            }
        }
        if (typeof func === 'object') {
            return func;
        }
        if (typeof func === 'function') {
            return func.apply(self, args);
        }
        if (!func && typeof name === 'string' && sprintf.apply(this, [name].concat(args))) {
            return sprintf.apply(this, [name].concat(args));
        }
        return defaultValue;
    };

    var compareObjects = function (objectA, objectB, compareLength) {
        // Create arrays of property names
        var objectAProperties = Object.getOwnPropertyNames(objectA),
            objectBProperties = Object.getOwnPropertyNames(objectB),
            propName = '';

        if (compareLength) {
            // If number of properties is different, objects are not equivalent
            if (objectAProperties.length !== objectBProperties.length) {
                return false;
            }
        }

        for (var i = 0; i < objectAProperties.length; i++) {
            propName = objectAProperties[i];

            // If the property is not in the object B properties, continue with the next property
            if ($.inArray(propName, objectBProperties) > -1) {
                // If values of same property are not equal, objects are not equivalent
                if (objectA[propName] !== objectB[propName]) {
                    return false;
                }
            }
        }

        // If we made it this far, objects are considered equivalent
        return true;
    };

    var escapeHTML = function (text) {
        if (typeof text === 'string') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/`/g, '&#x60;');
        }
        return text;
    };

    var getRealHeight = function ($el) {
        var height = 0;
        $el.children().each(function () {
            if (height < $(this).outerHeight(true)) {
                height = $(this).outerHeight(true);
            }
        });
        return height;
    };

    var getRealDataAttr = function (dataAttr) {
        for (var attr in dataAttr) {
            var auxAttr = attr.split(/(?=[A-Z])/).join('-').toLowerCase();
            if (auxAttr !== attr) {
                dataAttr[auxAttr] = dataAttr[attr];
                delete dataAttr[attr];
            }
        }

        return dataAttr;
    };

    var getItemField = function (item, field, escape) {
        var value = item;

        if (typeof field !== 'string' || item.hasOwnProperty(field)) {
            return escape ? escapeHTML(item[field]) : item[field];
        }
        var props = field.split('.');
        for (var p in props) {
            value = value && value[props[p]];
        }
        return escape ? escapeHTML(value) : value;
    };

    var isIEBrowser = function () {
        return !!(navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
    };

    var objectKeys = function () {
        // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
        if (!Object.keys) {
            Object.keys = (function() {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;

                return function(obj) {
                    if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                        throw new TypeError('Object.keys called on non-object');
                    }

                    var result = [], prop, i;

                    for (prop in obj) {
                        if (hasOwnProperty.call(obj, prop)) {
                            result.push(prop);
                        }
                    }

                    if (hasDontEnumBug) {
                        for (i = 0; i < dontEnumsLength; i++) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) {
                                result.push(dontEnums[i]);
                            }
                        }
                    }
                    return result;
                };
            }());
        }
    };

    // BOOTSTRAP TABLE CLASS DEFINITION
    // ======================

    var BootstrapTable = function (el, options) {
        this.options = options;
        this.$el = $(el);
        this.$el_ = this.$el.clone();
        this.timeoutId_ = 0;
        this.timeoutFooter_ = 0;

        this.init();
    };

    BootstrapTable.DEFAULTS = {
        classes: 'table table-hover',
        locale: undefined,
        height: undefined,
        undefinedText: '-',
        sortName: undefined,
        sortOrder: 'asc',
        sortStable: false,
        striped: false,
        columns: [[]],
        data: [],
        dataField: 'rows',
        method: 'get',
        url: undefined,
        ajax: undefined,
        cache: true,
        contentType: 'application/json',
        dataType: 'json',
        ajaxOptions: {},
        queryParams: function (params) {
            return params;
        },
        queryParamsType: 'limit', // undefined
        responseHandler: function (res) {
            return res;
        },
        pagination: false,
        onlyInfoPagination: false,
        sidePagination: 'client', // client or server
        totalRows: 0, // server side need to set
        pageNumber: 1,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        paginationHAlign: 'right', //right, left
        paginationVAlign: 'bottom', //bottom, top, both
        paginationDetailHAlign: 'left', //right, left
        paginationPreText: '&lsaquo;',
        paginationNextText: '&rsaquo;',
        search: false,
        searchOnEnterKey: false,
        strictSearch: false,
        searchAlign: 'right',
        selectItemName: 'btSelectItem',
        showHeader: true,
        showFooter: false,
        showColumns: false,
        showPaginationSwitch: false,
        showRefresh: false,
        showToggle: false,
        buttonsAlign: 'right',
        smartDisplay: true,
        escape: false,
        minimumCountColumns: 1,
        idField: undefined,
        uniqueId: undefined,
        cardView: false,
        detailView: false,
        detailFormatter: function (index, row) {
            return '';
        },
        trimOnSearch: true,
        clickToSelect: false,
        singleSelect: false,
        toolbar: undefined,
        toolbarAlign: 'left',
        checkboxHeader: true,
        sortable: true,
        silentSort: true,
        maintainSelected: false,
        searchTimeOut: 500,
        searchText: '',
        iconSize: undefined,
        buttonsClass: 'default',
        iconsPrefix: 'glyphicon', // glyphicon of fa (font awesome)
        icons: {
            paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
            paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
            refresh: 'glyphicon-refresh icon-refresh',
            toggle: 'glyphicon-list-alt icon-list-alt',
            columns: 'glyphicon-th icon-th',
            detailOpen: 'glyphicon-plus icon-plus',
            detailClose: 'glyphicon-minus icon-minus'
        },

        customSearch: $.noop,

        customSort: $.noop,

        rowStyle: function (row, index) {
            return {};
        },

        rowAttributes: function (row, index) {
            return {};
        },

        footerStyle: function (row, index) {
            return {};
        },

        onAll: function (name, args) {
            return false;
        },
        onClickCell: function (field, value, row, $element) {
            return false;
        },
        onDblClickCell: function (field, value, row, $element) {
            return false;
        },
        onClickRow: function (item, $element) {
            return false;
        },
        onDblClickRow: function (item, $element) {
            return false;
        },
        onSort: function (name, order) {
            return false;
        },
        onCheck: function (row) {
            return false;
        },
        onUncheck: function (row) {
            return false;
        },
        onCheckAll: function (rows) {
            return false;
        },
        onUncheckAll: function (rows) {
            return false;
        },
        onCheckSome: function (rows) {
            return false;
        },
        onUncheckSome: function (rows) {
            return false;
        },
        onLoadSuccess: function (data) {
            return false;
        },
        onLoadError: function (status) {
            return false;
        },
        onColumnSwitch: function (field, checked) {
            return false;
        },
        onPageChange: function (number, size) {
            return false;
        },
        onSearch: function (text) {
            return false;
        },
        onToggle: function (cardView) {
            return false;
        },
        onPreBody: function (data) {
            return false;
        },
        onPostBody: function () {
            return false;
        },
        onPostHeader: function () {
            return false;
        },
        onExpandRow: function (index, row, $detail) {
            return false;
        },
        onCollapseRow: function (index, row) {
            return false;
        },
        onRefreshOptions: function (options) {
            return false;
        },
        onRefresh: function (params) {
          return false;
        },
        onResetView: function () {
            return false;
        }
    };

    BootstrapTable.LOCALES = {};

    BootstrapTable.LOCALES['en-US'] = BootstrapTable.LOCALES.en = {
        formatLoadingMessage: function () {
            return 'Loading, please wait...';
        },
        formatRecordsPerPage: function (pageNumber) {
            return sprintf('%s rows per page', pageNumber);
        },
        formatShowingRows: function (pageFrom, pageTo, totalRows) {
            return sprintf('Showing %s to %s of %s rows', pageFrom, pageTo, totalRows);
        },
        formatDetailPagination: function (totalRows) {
            return sprintf('Showing %s rows', totalRows);
        },
        formatSearch: function () {
            return 'Search';
        },
        formatNoMatches: function () {
            return 'No matching records found';
        },
        formatPaginationSwitch: function () {
            return 'Hide/Show pagination';
        },
        formatRefresh: function () {
            return 'Refresh';
        },
        formatToggle: function () {
            return 'Toggle';
        },
        formatColumns: function () {
            return 'Columns';
        },
        formatAllRows: function () {
            return 'All';
        }
    };

    $.extend(BootstrapTable.DEFAULTS, BootstrapTable.LOCALES['en-US']);

    BootstrapTable.COLUMN_DEFAULTS = {
        radio: false,
        checkbox: false,
        checkboxEnabled: true,
        field: undefined,
        title: undefined,
        titleTooltip: undefined,
        'class': undefined,
        align: undefined, // left, right, center
        halign: undefined, // left, right, center
        falign: undefined, // left, right, center
        valign: undefined, // top, middle, bottom
        width: undefined,
        sortable: false,
        order: 'asc', // asc, desc
        visible: true,
        switchable: true,
        clickToSelect: true,
        formatter: undefined,
        footerFormatter: undefined,
        events: undefined,
        sorter: undefined,
        sortName: undefined,
        cellStyle: undefined,
        searchable: true,
        searchFormatter: true,
        cardVisible: true
    };

    BootstrapTable.EVENTS = {
        'all.bs.table': 'onAll',
        'click-cell.bs.table': 'onClickCell',
        'dbl-click-cell.bs.table': 'onDblClickCell',
        'click-row.bs.table': 'onClickRow',
        'dbl-click-row.bs.table': 'onDblClickRow',
        'sort.bs.table': 'onSort',
        'check.bs.table': 'onCheck',
        'uncheck.bs.table': 'onUncheck',
        'check-all.bs.table': 'onCheckAll',
        'uncheck-all.bs.table': 'onUncheckAll',
        'check-some.bs.table': 'onCheckSome',
        'uncheck-some.bs.table': 'onUncheckSome',
        'load-success.bs.table': 'onLoadSuccess',
        'load-error.bs.table': 'onLoadError',
        'column-switch.bs.table': 'onColumnSwitch',
        'page-change.bs.table': 'onPageChange',
        'search.bs.table': 'onSearch',
        'toggle.bs.table': 'onToggle',
        'pre-body.bs.table': 'onPreBody',
        'post-body.bs.table': 'onPostBody',
        'post-header.bs.table': 'onPostHeader',
        'expand-row.bs.table': 'onExpandRow',
        'collapse-row.bs.table': 'onCollapseRow',
        'refresh-options.bs.table': 'onRefreshOptions',
        'reset-view.bs.table': 'onResetView',
        'refresh.bs.table': 'onRefresh'
    };

    BootstrapTable.prototype.init = function () {
        this.initLocale();
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initFooter();
        this.initToolbar();
        this.initPagination();
        this.initBody();
        this.initSearchText();
        this.initServer();
    };

    BootstrapTable.prototype.initLocale = function () {
        if (this.options.locale) {
            var parts = this.options.locale.split(/-|_/);
            parts[0].toLowerCase();
            if (parts[1]) parts[1].toUpperCase();
            if ($.fn.bootstrapTable.locales[this.options.locale]) {
                // locale as requested
                $.extend(this.options, $.fn.bootstrapTable.locales[this.options.locale]);
            } else if ($.fn.bootstrapTable.locales[parts.join('-')]) {
                // locale with sep set to - (in case original was specified with _)
                $.extend(this.options, $.fn.bootstrapTable.locales[parts.join('-')]);
            } else if ($.fn.bootstrapTable.locales[parts[0]]) {
                // short locale language code (i.e. 'en')
                $.extend(this.options, $.fn.bootstrapTable.locales[parts[0]]);
            }
        }
    };

    BootstrapTable.prototype.initContainer = function () {
        this.$container = $([
            '<div class="bootstrap-table">',
            '<div class="fixed-table-toolbar"></div>',
            this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination" style="clear: both;"></div>' :
                '',
            '<div class="fixed-table-container">',
            '<div class="fixed-table-header"><table></table></div>',
            '<div class="fixed-table-body">',
            '<div class="fixed-table-loading">',
            this.options.formatLoadingMessage(),
            '</div>',
            '</div>',
            '<div class="fixed-table-footer"><table><tr></tr></table></div>',
            this.options.paginationVAlign === 'bottom' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination"></div>' :
                '',
            '</div>',
            '</div>'
        ].join(''));

        this.$container.insertAfter(this.$el);
        this.$tableContainer = this.$container.find('.fixed-table-container');
        this.$tableHeader = this.$container.find('.fixed-table-header');
        this.$tableBody = this.$container.find('.fixed-table-body');
        this.$tableLoading = this.$container.find('.fixed-table-loading');
        this.$tableFooter = this.$container.find('.fixed-table-footer');
        this.$toolbar = this.$container.find('.fixed-table-toolbar');
        this.$pagination = this.$container.find('.fixed-table-pagination');

        this.$tableBody.append(this.$el);
        this.$container.after('<div class="clearfix"></div>');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
        if ($.inArray('table-no-bordered', this.options.classes.split(' ')) !== -1) {
            this.$tableContainer.addClass('table-no-bordered');
        }
    };

    BootstrapTable.prototype.initTable = function () {
        var that = this,
            columns = [],
            data = [];

        this.$header = this.$el.find('>thead');
        if (!this.$header.length) {
            this.$header = $('<thead></thead>').appendTo(this.$el);
        }
        this.$header.find('tr').each(function () {
            var column = [];

            $(this).find('th').each(function () {
                // Fix #2014 - getFieldIndex and elsewhere assume this is string, causes issues if not
                if (typeof $(this).data('field') !== 'undefined') {
                    $(this).data('field', $(this).data('field') + '');
                }
                column.push($.extend({}, {
                    title: $(this).html(),
                    'class': $(this).attr('class'),
                    titleTooltip: $(this).attr('title'),
                    rowspan: $(this).attr('rowspan') ? +$(this).attr('rowspan') : undefined,
                    colspan: $(this).attr('colspan') ? +$(this).attr('colspan') : undefined
                }, $(this).data()));
            });
            columns.push(column);
        });
        if (!$.isArray(this.options.columns[0])) {
            this.options.columns = [this.options.columns];
        }
        this.options.columns = $.extend(true, [], columns, this.options.columns);
        this.columns = [];

        setFieldIndex(this.options.columns);
        $.each(this.options.columns, function (i, columns) {
            $.each(columns, function (j, column) {
                column = $.extend({}, BootstrapTable.COLUMN_DEFAULTS, column);

                if (typeof column.fieldIndex !== 'undefined') {
                    that.columns[column.fieldIndex] = column;
                }

                that.options.columns[i][j] = column;
            });
        });

        // if options.data is setting, do not process tbody data
        if (this.options.data.length) {
            return;
        }

        var m = [];
        this.$el.find('>tbody>tr').each(function (y) {
            var row = {};

            // save tr's id, class and data-* attributes
            row._id = $(this).attr('id');
            row._class = $(this).attr('class');
            row._data = getRealDataAttr($(this).data());

            $(this).find('>td').each(function (x) {
                var $this = $(this),
                    cspan = +$this.attr('colspan') || 1,
                    rspan = +$this.attr('rowspan') || 1,
                    tx, ty;

                for (; m[y] && m[y][x]; x++); //skip already occupied cells in current row

                for (tx = x; tx < x + cspan; tx++) { //mark matrix elements occupied by current cell with true
                    for (ty = y; ty < y + rspan; ty++) {
                        if (!m[ty]) { //fill missing rows
                            m[ty] = [];
                        }
                        m[ty][tx] = true;
                    }
                }

                var field = that.columns[x].field;

                row[field] = $(this).html();
                // save td's id, class and data-* attributes
                row['_' + field + '_id'] = $(this).attr('id');
                row['_' + field + '_class'] = $(this).attr('class');
                row['_' + field + '_rowspan'] = $(this).attr('rowspan');
                row['_' + field + '_colspan'] = $(this).attr('colspan');
                row['_' + field + '_title'] = $(this).attr('title');
                row['_' + field + '_data'] = getRealDataAttr($(this).data());
            });
            data.push(row);
        });
        this.options.data = data;
        if (data.length) this.fromHtml = true;
    };

    BootstrapTable.prototype.initHeader = function () {
        var that = this,
            visibleColumns = {},
            html = [];

        this.header = {
            fields: [],
            styles: [],
            classes: [],
            formatters: [],
            events: [],
            sorters: [],
            sortNames: [],
            cellStyles: [],
            searchables: []
        };

        $.each(this.options.columns, function (i, columns) {
            html.push('<tr>');

            if (i === 0 && !that.options.cardView && that.options.detailView) {
                html.push(sprintf('<th class="detail" rowspan="%s"><div class="fht-cell"></div></th>',
                    that.options.columns.length));
            }

            $.each(columns, function (j, column) {
                var text = '',
                    halign = '', // header align style
                    align = '', // body align style
                    style = '',
                    class_ = sprintf(' class="%s"', column['class']),
                    order = that.options.sortOrder || column.order,
                    unitWidth = 'px',
                    width = column.width;

                if (column.width !== undefined && (!that.options.cardView)) {
                    if (typeof column.width === 'string') {
                        if (column.width.indexOf('%') !== -1) {
                            unitWidth = '%';
                        }
                    }
                }
                if (column.width && typeof column.width === 'string') {
                    width = column.width.replace('%', '').replace('px', '');
                }

                halign = sprintf('text-align: %s; ', column.halign ? column.halign : column.align);
                align = sprintf('text-align: %s; ', column.align);
                style = sprintf('vertical-align: %s; ', column.valign);
                style += sprintf('width: %s; ', (column.checkbox || column.radio) && !width ?
                    '36px' : (width ? width + unitWidth : undefined));

                if (typeof column.fieldIndex !== 'undefined') {
                    that.header.fields[column.fieldIndex] = column.field;
                    that.header.styles[column.fieldIndex] = align + style;
                    that.header.classes[column.fieldIndex] = class_;
                    that.header.formatters[column.fieldIndex] = column.formatter;
                    that.header.events[column.fieldIndex] = column.events;
                    that.header.sorters[column.fieldIndex] = column.sorter;
                    that.header.sortNames[column.fieldIndex] = column.sortName;
                    that.header.cellStyles[column.fieldIndex] = column.cellStyle;
                    that.header.searchables[column.fieldIndex] = column.searchable;

                    if (!column.visible) {
                        return;
                    }

                    if (that.options.cardView && (!column.cardVisible)) {
                        return;
                    }

                    visibleColumns[column.field] = column;
                }

                html.push('<th' + sprintf(' title="%s"', column.titleTooltip),
                    column.checkbox || column.radio ?
                        sprintf(' class="bs-checkbox %s"', column['class'] || '') :
                        class_,
                    sprintf(' style="%s"', halign + style),
                    sprintf(' rowspan="%s"', column.rowspan),
                    sprintf(' colspan="%s"', column.colspan),
                    sprintf(' data-field="%s"', column.field),
                    "tabindex='0'",
                    '>');

                html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                    'sortable both' : ''));

                text = column.title;

                if (column.checkbox) {
                    if (!that.options.singleSelect && that.options.checkboxHeader) {
                        text = '<input name="btSelectAll" type="checkbox" />';
                    }
                    that.header.stateField = column.field;
                }
                if (column.radio) {
                    text = '';
                    that.header.stateField = column.field;
                    that.options.singleSelect = true;
                }

                html.push(text);
                html.push('</div>');
                html.push('<div class="fht-cell"></div>');
                html.push('</div>');
                html.push('</th>');
            });
            html.push('</tr>');
        });

        this.$header.html(html.join(''));
        this.$header.find('th[data-field]').each(function (i) {
            $(this).data(visibleColumns[$(this).data('field')]);
        });
        this.$container.off('click', '.th-inner').on('click', '.th-inner', function (event) {
            var target = $(this);

            if (that.options.detailView) {
                if (target.closest('.bootstrap-table')[0] !== that.$container[0])
                    return false;
            }

            if (that.options.sortable && target.parent().data().sortable) {
                that.onSort(event);
            }
        });

        this.$header.children().children().off('keypress').on('keypress', function (event) {
            if (that.options.sortable && $(this).data().sortable) {
                var code = event.keyCode || event.which;
                if (code == 13) { //Enter keycode
                    that.onSort(event);
                }
            }
        });

        $(window).off('resize.bootstrap-table');
        if (!this.options.showHeader || this.options.cardView) {
            this.$header.hide();
            this.$tableHeader.hide();
            this.$tableLoading.css('top', 0);
        } else {
            this.$header.show();
            this.$tableHeader.show();
            this.$tableLoading.css('top', this.$header.outerHeight() + 1);
            // Assign the correct sortable arrow
            this.getCaret();
            $(window).on('resize.bootstrap-table', $.proxy(this.resetWidth, this));
        }

        this.$selectAll = this.$header.find('[name="btSelectAll"]');
        this.$selectAll.off('click').on('click', function () {
                var checked = $(this).prop('checked');
                that[checked ? 'checkAll' : 'uncheckAll']();
                that.updateSelected();
            });
    };

    BootstrapTable.prototype.initFooter = function () {
        if (!this.options.showFooter || this.options.cardView) {
            this.$tableFooter.hide();
        } else {
            this.$tableFooter.show();
        }
    };

    /**
     * @param data
     * @param type: append / prepend
     */
    BootstrapTable.prototype.initData = function (data, type) {
        if (type === 'append') {
            this.data = this.data.concat(data);
        } else if (type === 'prepend') {
            this.data = [].concat(data).concat(this.data);
        } else {
            this.data = data || this.options.data;
        }

        // Fix #839 Records deleted when adding new row on filtered table
        if (type === 'append') {
            this.options.data = this.options.data.concat(data);
        } else if (type === 'prepend') {
            this.options.data = [].concat(data).concat(this.options.data);
        } else {
            this.options.data = this.data;
        }

        if (this.options.sidePagination === 'server') {
            return;
        }
        this.initSort();
    };

    BootstrapTable.prototype.initSort = function () {
        var that = this,
            name = this.options.sortName,
            order = this.options.sortOrder === 'desc' ? -1 : 1,
            index = $.inArray(this.options.sortName, this.header.fields);

        if (this.options.customSort !== $.noop) {
            this.options.customSort.apply(this, [this.options.sortName, this.options.sortOrder]);
            return;
        }

        if (index !== -1) {
            if (this.options.sortStable) {
                $.each(this.data, function (i, row) {
                    if (!row.hasOwnProperty('_position')) row._position = i;
                });
            }

            this.data.sort(function (a, b) {
                if (that.header.sortNames[index]) {
                    name = that.header.sortNames[index];
                }
                var aa = getItemField(a, name, that.options.escape),
                    bb = getItemField(b, name, that.options.escape),
                    value = calculateObjectValue(that.header, that.header.sorters[index], [aa, bb]);

                if (value !== undefined) {
                    return order * value;
                }

                // Fix #161: undefined or null string sort bug.
                if (aa === undefined || aa === null) {
                    aa = '';
                }
                if (bb === undefined || bb === null) {
                    bb = '';
                }

                if (that.options.sortStable && aa === bb) {
                    aa = a._position;
                    bb = b._position;
                }

                // IF both values are numeric, do a numeric comparison
                if ($.isNumeric(aa) && $.isNumeric(bb)) {
                    // Convert numerical values form string to float.
                    aa = parseFloat(aa);
                    bb = parseFloat(bb);
                    if (aa < bb) {
                        return order * -1;
                    }
                    return order;
                }

                if (aa === bb) {
                    return 0;
                }

                // If value is not a string, convert to string
                if (typeof aa !== 'string') {
                    aa = aa.toString();
                }

                if (aa.localeCompare(bb) === -1) {
                    return order * -1;
                }

                return order;
            });
        }
    };

    BootstrapTable.prototype.onSort = function (event) {
        var $this = event.type === "keypress" ? $(event.currentTarget) : $(event.currentTarget).parent(),
            $this_ = this.$header.find('th').eq($this.index());

        this.$header.add(this.$header_).find('span.order').remove();

        if (this.options.sortName === $this.data('field')) {
            this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortName = $this.data('field');
            this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
        }
        this.trigger('sort', this.options.sortName, this.options.sortOrder);

        $this.add($this_).data('order', this.options.sortOrder);

        // Assign the correct sortable arrow
        this.getCaret();

        if (this.options.sidePagination === 'server') {
            this.initServer(this.options.silentSort);
            return;
        }

        this.initSort();
        this.initBody();
    };

    BootstrapTable.prototype.initToolbar = function () {
        var that = this,
            html = [],
            timeoutId = 0,
            $keepOpen,
            $search,
            switchableCount = 0;

        if (this.$toolbar.find('.bs-bars').children().length) {
            $('body').append($(this.options.toolbar));
        }
        this.$toolbar.html('');

        if (typeof this.options.toolbar === 'string' || typeof this.options.toolbar === 'object') {
            $(sprintf('<div class="bs-bars pull-%s"></div>', this.options.toolbarAlign))
                .appendTo(this.$toolbar)
                .append($(this.options.toolbar));
        }

        // showColumns, showToggle, showRefresh
        html = [sprintf('<div class="columns columns-%s btn-group pull-%s">',
            this.options.buttonsAlign, this.options.buttonsAlign)];

        if (typeof this.options.icons === 'string') {
            this.options.icons = calculateObjectValue(null, this.options.icons);
        }

        if (this.options.showPaginationSwitch) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="paginationSwitch" title="%s">',
                    this.options.formatPaginationSwitch()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.paginationSwitchDown),
                '</button>');
        }

        if (this.options.showRefresh) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="refresh" title="%s">',
                    this.options.formatRefresh()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.refresh),
                '</button>');
        }

        if (this.options.showToggle) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="toggle" title="%s">',
                    this.options.formatToggle()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.toggle),
                '</button>');
        }

        if (this.options.showColumns) {
            html.push(sprintf('<div class="keep-open btn-group" title="%s">',
                    this.options.formatColumns()),
                '<button type="button" class="btn' +
                sprintf(' btn-%s', this.options.buttonsClass) +
                sprintf(' btn-%s', this.options.iconSize) +
                ' dropdown-toggle" data-toggle="dropdown">',
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.columns),
                ' <span class="caret"></span>',
                '</button>',
                '<ul class="dropdown-menu" role="menu">');

            $.each(this.columns, function (i, column) {
                if (column.radio || column.checkbox || column.title.length < 1) {
                    return;
                }
                if (that.options.cardView && !column.cardVisible) {
                    return;
                }

                var checked = column.visible ? ' checked="checked"' : '';

                if (column.switchable) {
                    html.push(sprintf('<li>' +
                        '<label><input type="checkbox" data-field="%s" value="%s"%s> %s</label>' +
                        '</li>', column.field, i, checked, column.title));
                    switchableCount++;
                }
            });
            html.push('</ul>',
                '</div>');
        }

        html.push('</div>');

        // Fix #188: this.showToolbar is for extensions
        if (this.showToolbar || html.length > 2) {
            this.$toolbar.append(html.join(''));
        }

        if (this.options.showPaginationSwitch) {
            this.$toolbar.find('button[name="paginationSwitch"]')
                .off('click').on('click', $.proxy(this.togglePagination, this));
        }

        if (this.options.showRefresh) {
            this.$toolbar.find('button[name="refresh"]')
                .off('click').on('click', $.proxy(this.refresh, this));
        }

        if (this.options.showToggle) {
            this.$toolbar.find('button[name="toggle"]')
                .off('click').on('click', function () {
                    that.toggleView();
                });
        }

        if (this.options.showColumns) {
            $keepOpen = this.$toolbar.find('.keep-open');

            if (switchableCount <= this.options.minimumCountColumns) {
                $keepOpen.find('input').prop('disabled', true);
            }

            $keepOpen.find('li').off('click').on('click', function (event) {
                event.stopImmediatePropagation();
            });
            $keepOpen.find('input').off('click').on('click', function () {
                var $this = $(this);

                that.toggleColumn($(this).val(), $this.prop('checked'), false);
                that.trigger('column-switch', $(this).data('field'), $this.prop('checked'));
            });
        }

        if (this.options.search) {
            html = [];
            html.push(
                '<div class="pull-' + this.options.searchAlign + ' search">',
                sprintf('<input class="form-control' +
                    sprintf(' input-%s', this.options.iconSize) +
                    '" type="text" placeholder="%s">',
                    this.options.formatSearch()),
                '</div>');

            this.$toolbar.append(html.join(''));
            $search = this.$toolbar.find('.search input');
            $search.off('keyup drop').on('keyup drop', function (event) {
                if (that.options.searchOnEnterKey && event.keyCode !== 13) {
                    return;
                }

                if ($.inArray(event.keyCode, [37, 38, 39, 40]) > -1) {
                    return;
                }

                clearTimeout(timeoutId); // doesn't matter if it's 0
                timeoutId = setTimeout(function () {
                    that.onSearch(event);
                }, that.options.searchTimeOut);
            });

            if (isIEBrowser()) {
                $search.off('mouseup').on('mouseup', function (event) {
                    clearTimeout(timeoutId); // doesn't matter if it's 0
                    timeoutId = setTimeout(function () {
                        that.onSearch(event);
                    }, that.options.searchTimeOut);
                });
            }
        }
    };

    BootstrapTable.prototype.onSearch = function (event) {
        var text = $.trim($(event.currentTarget).val());

        // trim search input
        if (this.options.trimOnSearch && $(event.currentTarget).val() !== text) {
            $(event.currentTarget).val(text);
        }

        if (text === this.searchText) {
            return;
        }
        this.searchText = text;
        this.options.searchText = text;

        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
        this.trigger('search', text);
    };

    BootstrapTable.prototype.initSearch = function () {
        var that = this;

        if (this.options.sidePagination !== 'server') {
            if (this.options.customSearch !== $.noop) {
                this.options.customSearch.apply(this, [this.searchText]);
                return;
            }

            var s = this.searchText && (this.options.escape ?
                escapeHTML(this.searchText) : this.searchText).toLowerCase();
            var f = $.isEmptyObject(this.filterColumns) ? null : this.filterColumns;

            // Check filter
            this.data = f ? $.grep(this.options.data, function (item, i) {
                for (var key in f) {
                    if ($.isArray(f[key]) && $.inArray(item[key], f[key]) === -1 ||
                            item[key] !== f[key]) {
                        return false;
                    }
                }
                return true;
            }) : this.options.data;

            this.data = s ? $.grep(this.data, function (item, i) {
                for (var j = 0; j < that.header.fields.length; j++) {

                    if (!that.header.searchables[j]) {
                        continue;
                    }

                    var key = $.isNumeric(that.header.fields[j]) ? parseInt(that.header.fields[j], 10) : that.header.fields[j];
                    var column = that.columns[getFieldIndex(that.columns, key)];
                    var value;

                    if (typeof key === 'string') {
                        value = item;
                        var props = key.split('.');
                        for (var prop_index = 0; prop_index < props.length; prop_index++) {
                            value = value[props[prop_index]];
                        }

                        // Fix #142: respect searchForamtter boolean
                        if (column && column.searchFormatter) {
                            value = calculateObjectValue(column,
                                that.header.formatters[j], [value, item, i], value);
                        }
                    } else {
                        value = item[key];
                    }

                    if (typeof value === 'string' || typeof value === 'number') {
                        if (that.options.strictSearch) {
                            if ((value + '').toLowerCase() === s) {
                                return true;
                            }
                        } else {
                            if ((value + '').toLowerCase().indexOf(s) !== -1) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }) : this.data;
        }
    };

    BootstrapTable.prototype.initPagination = function () {
        if (!this.options.pagination) {
            this.$pagination.hide();
            return;
        } else {
            this.$pagination.show();
        }

        var that = this,
            html = [],
            $allSelected = false,
            i, from, to,
            $pageList,
            $first, $pre,
            $next, $last,
            $number,
            data = this.getData(),
            pageList = this.options.pageList;

        if (this.options.sidePagination !== 'server') {
            this.options.totalRows = data.length;
        }

        this.totalPages = 0;
        if (this.options.totalRows) {
            if (this.options.pageSize === this.options.formatAllRows()) {
                this.options.pageSize = this.options.totalRows;
                $allSelected = true;
            } else if (this.options.pageSize === this.options.totalRows) {
                // Fix #667 Table with pagination,
                // multiple pages and a search that matches to one page throws exception
                var pageLst = typeof this.options.pageList === 'string' ?
                    this.options.pageList.replace('[', '').replace(']', '')
                        .replace(/ /g, '').toLowerCase().split(',') : this.options.pageList;
                if ($.inArray(this.options.formatAllRows().toLowerCase(), pageLst)  > -1) {
                    $allSelected = true;
                }
            }

            this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;

            this.options.totalPages = this.totalPages;
        }
        if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
            this.options.pageNumber = this.totalPages;
        }

        this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
        this.pageTo = this.options.pageNumber * this.options.pageSize;
        if (this.pageTo > this.options.totalRows) {
            this.pageTo = this.options.totalRows;
        }

        html.push(
            '<div class="pull-' + this.options.paginationDetailHAlign + ' pagination-detail">',
            '<span class="pagination-info">',
            this.options.onlyInfoPagination ? this.options.formatDetailPagination(this.options.totalRows) :
            this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
            '</span>');

        if (!this.options.onlyInfoPagination) {
            html.push('<span class="page-list">');

            var pageNumber = [
                    sprintf('<span class="btn-group %s">',
                        this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                            'dropdown' : 'dropup'),
                    '<button type="button" class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    ' dropdown-toggle" data-toggle="dropdown">',
                    '<span class="page-size">',
                    $allSelected ? this.options.formatAllRows() : this.options.pageSize,
                    '</span>',
                    ' <span class="caret"></span>',
                    '</button>',
                    '<ul class="dropdown-menu" role="menu">'
                ];

            if (typeof this.options.pageList === 'string') {
                var list = this.options.pageList.replace('[', '').replace(']', '')
                    .replace(/ /g, '').split(',');

                pageList = [];
                $.each(list, function (i, value) {
                    pageList.push(value.toUpperCase() === that.options.formatAllRows().toUpperCase() ?
                        that.options.formatAllRows() : +value);
                });
            }

            $.each(pageList, function (i, page) {
                if (!that.options.smartDisplay || i === 0 || pageList[i - 1] <= that.options.totalRows) {
                    var active;
                    if ($allSelected) {
                        active = page === that.options.formatAllRows() ? ' class="active"' : '';
                    } else {
                        active = page === that.options.pageSize ? ' class="active"' : '';
                    }
                    pageNumber.push(sprintf('<li%s><a href="javascript:void(0)">%s</a></li>', active, page));
                }
            });
            pageNumber.push('</ul></span>');

            html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
            html.push('</span>');

            html.push('</div>',
                '<div class="pull-' + this.options.paginationHAlign + ' pagination">',
                '<ul class="pagination' + sprintf(' pagination-%s', this.options.iconSize) + '">',
                '<li class="page-pre"><a href="javascript:void(0)">' + this.options.paginationPreText + '</a></li>');

            if (this.totalPages < 5) {
                from = 1;
                to = this.totalPages;
            } else {
                from = this.options.pageNumber - 2;
                to = from + 4;
                if (from < 1) {
                    from = 1;
                    to = 5;
                }
                if (to > this.totalPages) {
                    to = this.totalPages;
                    from = to - 4;
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber >= 3) {
                    html.push('<li class="page-first' + (1 === this.options.pageNumber ? ' active' : '') + '">',
                        '<a href="javascript:void(0)">', 1, '</a>',
                        '</li>');

                    from++;
                }

                if (this.options.pageNumber >= 4) {
                    if (this.options.pageNumber == 4 || this.totalPages == 6 || this.totalPages == 7) {
                        from--;
                    } else {
                        html.push('<li class="page-first-separator disabled">',
                            '<a href="javascript:void(0)">...</a>',
                            '</li>');
                    }

                    to--;
                }
            }

            if (this.totalPages >= 7) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    from--;
                }
            }

            if (this.totalPages == 6) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    to++;
                }
            } else if (this.totalPages >= 7) {
                if (this.totalPages == 7 || this.options.pageNumber >= (this.totalPages - 3)) {
                    to++;
                }
            }

            for (i = from; i <= to; i++) {
                html.push('<li class="page-number' + (i === this.options.pageNumber ? ' active' : '') + '">',
                    '<a href="javascript:void(0)">', i, '</a>',
                    '</li>');
            }

            if (this.totalPages >= 8) {
                if (this.options.pageNumber <= (this.totalPages - 4)) {
                    html.push('<li class="page-last-separator disabled">',
                        '<a href="javascript:void(0)">...</a>',
                        '</li>');
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber <= (this.totalPages - 3)) {
                    html.push('<li class="page-last' + (this.totalPages === this.options.pageNumber ? ' active' : '') + '">',
                        '<a href="javascript:void(0)">', this.totalPages, '</a>',
                        '</li>');
                }
            }

            html.push(
                '<li class="page-next"><a href="javascript:void(0)">' + this.options.paginationNextText + '</a></li>',
                '</ul>',
                '</div>');
        }
        this.$pagination.html(html.join(''));

        if (!this.options.onlyInfoPagination) {
            $pageList = this.$pagination.find('.page-list a');
            $first = this.$pagination.find('.page-first');
            $pre = this.$pagination.find('.page-pre');
            $next = this.$pagination.find('.page-next');
            $last = this.$pagination.find('.page-last');
            $number = this.$pagination.find('.page-number');

            if (this.options.smartDisplay) {
                if (this.totalPages <= 1) {
                    this.$pagination.find('div.pagination').hide();
                }
                if (pageList.length < 2 || this.options.totalRows <= pageList[0]) {
                    this.$pagination.find('span.page-list').hide();
                }

                // when data is empty, hide the pagination
                this.$pagination[this.getData().length ? 'show' : 'hide']();
            }
            if ($allSelected) {
                this.options.pageSize = this.options.formatAllRows();
            }
            $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
            $first.off('click').on('click', $.proxy(this.onPageFirst, this));
            $pre.off('click').on('click', $.proxy(this.onPagePre, this));
            $next.off('click').on('click', $.proxy(this.onPageNext, this));
            $last.off('click').on('click', $.proxy(this.onPageLast, this));
            $number.off('click').on('click', $.proxy(this.onPageNumber, this));
        }
    };

    BootstrapTable.prototype.updatePagination = function (event) {
        // Fix #171: IE disabled button can be clicked bug.
        if (event && $(event.currentTarget).hasClass('disabled')) {
            return;
        }

        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPagination();
        if (this.options.sidePagination === 'server') {
            this.initServer();
        } else {
            this.initBody();
        }

        this.trigger('page-change', this.options.pageNumber, this.options.pageSize);
    };

    BootstrapTable.prototype.onPageListChange = function (event) {
        var $this = $(event.currentTarget);

        $this.parent().addClass('active').siblings().removeClass('active');
        this.options.pageSize = $this.text().toUpperCase() === this.options.formatAllRows().toUpperCase() ?
            this.options.formatAllRows() : +$this.text();
        this.$toolbar.find('.page-size').text(this.options.pageSize);

        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageFirst = function (event) {
        this.options.pageNumber = 1;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPagePre = function (event) {
        if ((this.options.pageNumber - 1) === 0) {
            this.options.pageNumber = this.options.totalPages;
        } else {
            this.options.pageNumber--;
        }
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNext = function (event) {
        if ((this.options.pageNumber + 1) > this.options.totalPages) {
            this.options.pageNumber = 1;
        } else {
            this.options.pageNumber++;
        }
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageLast = function (event) {
        this.options.pageNumber = this.totalPages;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNumber = function (event) {
        if (this.options.pageNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageNumber = +$(event.currentTarget).text();
        this.updatePagination(event);
    };

    BootstrapTable.prototype.initBody = function (fixedScroll) {
        var that = this,
            html = [],
            data = this.getData();

        this.trigger('pre-body', data);

        this.$body = this.$el.find('>tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        //Fix #389 Bootstrap-table-flatJSON is not working

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var key,
                item = data[i],
                style = {},
                csses = [],
                data_ = '',
                attributes = {},
                htmlAttributes = [];

            style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);

            if (style && style.css) {
                for (key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            attributes = calculateObjectValue(this.options,
                this.options.rowAttributes, [item, i], attributes);

            if (attributes) {
                for (key in attributes) {
                    htmlAttributes.push(sprintf('%s="%s"', key, escapeHTML(attributes[key])));
                }
            }

            if (item._data && !$.isEmptyObject(item._data)) {
                $.each(item._data, function (k, v) {
                    // ignore data-index
                    if (k === 'index') {
                        return;
                    }
                    data_ += sprintf(' data-%s="%s"', k, v);
                });
            }

            html.push('<tr',
                sprintf(' %s', htmlAttributes.join(' ')),
                sprintf(' id="%s"', $.isArray(item) ? undefined : item._id),
                sprintf(' class="%s"', style.classes || ($.isArray(item) ? undefined : item._class)),
                sprintf(' data-index="%s"', i),
                sprintf(' data-uniqueid="%s"', item[this.options.uniqueId]),
                sprintf('%s', data_),
                '>'
            );

            if (this.options.cardView) {
                html.push(sprintf('<td colspan="%s"><div class="card-views">', this.header.fields.length));
            }

            if (!this.options.cardView && this.options.detailView) {
                html.push('<td>',
                    '<a class="detail-icon" href="javascript:">',
                    sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.detailOpen),
                    '</a>',
                    '</td>');
            }

            $.each(this.header.fields, function (j, field) {
                var text = '',
                    value = getItemField(item, field, that.options.escape),
                    type = '',
                    cellStyle = {},
                    id_ = '',
                    class_ = that.header.classes[j],
                    data_ = '',
                    rowspan_ = '',
                    colspan_ = '',
                    title_ = '',
                    column = that.columns[j];

                if (that.fromHtml && typeof value === 'undefined') {
                    return;
                }

                if (!column.visible) {
                    return;
                }

                if (that.options.cardView && !column.cardVisible) {
                    return;
                }

                style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

                // handle td's id and class
                if (item['_' + field + '_id']) {
                    id_ = sprintf(' id="%s"', item['_' + field + '_id']);
                }
                if (item['_' + field + '_class']) {
                    class_ = sprintf(' class="%s"', item['_' + field + '_class']);
                }
                if (item['_' + field + '_rowspan']) {
                    rowspan_ = sprintf(' rowspan="%s"', item['_' + field + '_rowspan']);
                }
                if (item['_' + field + '_colspan']) {
                    colspan_ = sprintf(' colspan="%s"', item['_' + field + '_colspan']);
                }
                if (item['_' + field + '_title']) {
                    title_ = sprintf(' title="%s"', item['_' + field + '_title']);
                }
                cellStyle = calculateObjectValue(that.header,
                    that.header.cellStyles[j], [value, item, i, field], cellStyle);
                if (cellStyle.classes) {
                    class_ = sprintf(' class="%s"', cellStyle.classes);
                }
                if (cellStyle.css) {
                    var csses_ = [];
                    for (var key in cellStyle.css) {
                        csses_.push(key + ': ' + cellStyle.css[key]);
                    }
                    style = sprintf('style="%s"', csses_.concat(that.header.styles[j]).join('; '));
                }

                value = calculateObjectValue(column,
                    that.header.formatters[j], [value, item, i], value);

                if (item['_' + field + '_data'] && !$.isEmptyObject(item['_' + field + '_data'])) {
                    $.each(item['_' + field + '_data'], function (k, v) {
                        // ignore data-index
                        if (k === 'index') {
                            return;
                        }
                        data_ += sprintf(' data-%s="%s"', k, v);
                    });
                }

                if (column.checkbox || column.radio) {
                    type = column.checkbox ? 'checkbox' : type;
                    type = column.radio ? 'radio' : type;

                    text = [sprintf(that.options.cardView ?
                        '<div class="card-view %s">' : '<td class="bs-checkbox %s">', column['class'] || ''),
                        '<input' +
                        sprintf(' data-index="%s"', i) +
                        sprintf(' name="%s"', that.options.selectItemName) +
                        sprintf(' type="%s"', type) +
                        sprintf(' value="%s"', item[that.options.idField]) +
                        sprintf(' checked="%s"', value === true ||
                        (value && value.checked) ? 'checked' : undefined) +
                        sprintf(' disabled="%s"', !column.checkboxEnabled ||
                        (value && value.disabled) ? 'disabled' : undefined) +
                        ' />',
                        that.header.formatters[j] && typeof value === 'string' ? value : '',
                        that.options.cardView ? '</div>' : '</td>'
                    ].join('');

                    item[that.header.stateField] = value === true || (value && value.checked);
                } else {
                    value = typeof value === 'undefined' || value === null ?
                        that.options.undefinedText : value;

                    text = that.options.cardView ? ['<div class="card-view">',
                        that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                            getPropertyFromOther(that.columns, 'field', 'title', field)) : '',
                        sprintf('<span class="value">%s</span>', value),
                        '</div>'
                    ].join('') : [sprintf('<td%s %s %s %s %s %s %s>',
                        id_, class_, style, data_, rowspan_, colspan_, title_),
                        value,
                        '</td>'
                    ].join('');

                    // Hide empty data on Card view when smartDisplay is set to true.
                    if (that.options.cardView && that.options.smartDisplay && value === '') {
                        // Should set a placeholder for event binding correct fieldIndex
                        text = '<div class="card-view"></div>';
                    }
                }

                html.push(text);
            });

            if (this.options.cardView) {
                html.push('</div></td>');
            }

            html.push('</tr>');
        }

        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                sprintf('<td colspan="%s">%s</td>',
                    this.$header.find('th').length, this.options.formatNoMatches()),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.scrollTo(0);
        }

        // click to select by column
        this.$body.find('> tr[data-index] > td').off('click dblclick').on('click dblclick', function (e) {
            var $td = $(this),
                $tr = $td.parent(),
                item = that.data[$tr.data('index')],
                index = $td[0].cellIndex,
                fields = that.getVisibleFields(),
                field = fields[that.options.detailView && !that.options.cardView ? index - 1 : index],
                column = that.columns[getFieldIndex(that.columns, field)],
                value = getItemField(item, field, that.options.escape);

            if ($td.find('.detail-icon').length) {
                return;
            }

            that.trigger(e.type === 'click' ? 'click-cell' : 'dbl-click-cell', field, value, item, $td);
            that.trigger(e.type === 'click' ? 'click-row' : 'dbl-click-row', item, $tr, field);

            // if click to select - then trigger the checkbox/radio click
            if (e.type === 'click' && that.options.clickToSelect && column.clickToSelect) {
                var $selectItem = $tr.find(sprintf('[name="%s"]', that.options.selectItemName));
                if ($selectItem.length) {
                    $selectItem[0].click(); // #144: .trigger('click') bug
                }
            }
        });

        this.$body.find('> tr[data-index] > td > .detail-icon').off('click').on('click', function () {
            var $this = $(this),
                $tr = $this.parent().parent(),
                index = $tr.data('index'),
                row = data[index]; // Fix #980 Detail view, when searching, returns wrong row

            // remove and update
            if ($tr.next().is('tr.detail-view')) {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailOpen));
                $tr.next().remove();
                that.trigger('collapse-row', index, row);
            } else {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailClose));
                $tr.after(sprintf('<tr class="detail-view"><td colspan="%s"></td></tr>', $tr.find('td').length));
                var $element = $tr.next().find('td');
                var content = calculateObjectValue(that.options, that.options.detailFormatter, [index, row, $element], '');
                if($element.length === 1) {
                    $element.append(content);
                }
                that.trigger('expand-row', index, row, $element);
            }
            that.resetView();
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            var $this = $(this),
                checked = $this.prop('checked'),
                row = that.data[$this.data('index')];

            if (that.options.maintainSelected && $(this).is(':radio')) {
                $.each(that.options.data, function (i, row) {
                    row[that.header.stateField] = false;
                });
            }

            row[that.header.stateField] = checked;

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
            that.trigger(checked ? 'check' : 'uncheck', row, $this);
        });

        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            // fix bug, if events is defined with namespace
            if (typeof events === 'string') {
                events = calculateObjectValue(null, events);
            }

            var field = that.header.fields[i],
                fieldIndex = $.inArray(field, that.getVisibleFields());

            if (that.options.detailView && !that.options.cardView) {
                fieldIndex += 1;
            }

            for (var key in events) {
                that.$body.find('>tr:not(.no-records-found)').each(function () {
                    var $tr = $(this),
                        $td = $tr.find(that.options.cardView ? '.card-view' : 'td').eq(fieldIndex),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[field];

                        func.apply(this, [e, value, row, index]);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();

        this.trigger('post-body', data);
    };

    BootstrapTable.prototype.initServer = function (silent, query, url) {
        var that = this,
            data = {},
            params = {
                searchText: this.searchText,
                sortName: this.options.sortName,
                sortOrder: this.options.sortOrder
            },
            request;

        if (this.options.pagination) {
            params.pageSize = this.options.pageSize === this.options.formatAllRows() ?
                this.options.totalRows : this.options.pageSize;
            params.pageNumber = this.options.pageNumber;
        }

        if (!(url || this.options.url) && !this.options.ajax) {
            return;
        }

        if (this.options.queryParamsType === 'limit') {
            params = {
                search: params.searchText,
                sort: params.sortName,
                order: params.sortOrder
            };

            if (this.options.pagination) {
                params.offset = this.options.pageSize === this.options.formatAllRows() ?
                    0 : this.options.pageSize * (this.options.pageNumber - 1);
                params.limit = this.options.pageSize === this.options.formatAllRows() ?
                    this.options.totalRows : this.options.pageSize;
            }
        }

        if (!($.isEmptyObject(this.filterColumnsPartial))) {
            params.filter = JSON.stringify(this.filterColumnsPartial, null);
        }

        data = calculateObjectValue(this.options, this.options.queryParams, [params], data);

        $.extend(data, query || {});

        // false to stop request
        if (data === false) {
            return;
        }

        if (!silent) {
            this.$tableLoading.show();
        }
        request = $.extend({}, calculateObjectValue(null, this.options.ajaxOptions), {
            type: this.options.method,
            url:  url || this.options.url,
            data: this.options.contentType === 'application/json' && this.options.method === 'post' ? JSON.stringify(data) : data,
            cache: this.options.cache,
            //contentType: this.options.contentType,
            dataType: this.options.dataType,
            success: function (res) {
				if (res.content) {
					res = res.content
				}
                res = calculateObjectValue(that.options, that.options.responseHandler, [res], res);

                that.load(res);
                that.trigger('load-success', res);
                if (!silent) that.$tableLoading.hide();
            },
            error: function (res) {
                that.trigger('load-error', res.status, res);
                if (!silent) that.$tableLoading.hide();
            }
        });

        if (this.options.ajax) {
            calculateObjectValue(this, this.options.ajax, [request], null);
        } else {
            if (this._xhr && this._xhr.readyState !== 4) {
                this._xhr.abort();
            }
            this._xhr = $.ajax(request);
        }
    };

    BootstrapTable.prototype.initSearchText = function () {
        if (this.options.search) {
            if (this.options.searchText !== '') {
                var $search = this.$toolbar.find('.search input');
                $search.val(this.options.searchText);
                this.onSearch({currentTarget: $search});
            }
        }
    };

    BootstrapTable.prototype.getCaret = function () {
        var that = this;

        $.each(this.$header.find('th'), function (i, th) {
            $(th).find('.sortable').removeClass('desc asc').addClass($(th).data('field') === that.options.sortName ? that.options.sortOrder : 'both');
        });
    };

    BootstrapTable.prototype.updateSelected = function () {
        var checkAll = this.$selectItem.filter(':enabled').length &&
            this.$selectItem.filter(':enabled').length ===
            this.$selectItem.filter(':enabled').filter(':checked').length;

        this.$selectAll.add(this.$selectAll_).prop('checked', checkAll);

        this.$selectItem.each(function () {
            $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
        });
    };

    BootstrapTable.prototype.updateRows = function () {
        var that = this;

        this.$selectItem.each(function () {
            that.data[$(this).data('index')][that.header.stateField] = $(this).prop('checked');
        });
    };

    BootstrapTable.prototype.resetRows = function () {
        var that = this;

        $.each(this.data, function (i, row) {
            that.$selectAll.prop('checked', false);
            that.$selectItem.prop('checked', false);
            if (that.header.stateField) {
                row[that.header.stateField] = false;
            }
        });
    };

    BootstrapTable.prototype.trigger = function (name) {
        var args = Array.prototype.slice.call(arguments, 1);

        name += '.bs.table';
        this.options[BootstrapTable.EVENTS[name]].apply(this.options, args);
        this.$el.trigger($.Event(name), args);

        this.options.onAll(name, args);
        this.$el.trigger($.Event('all.bs.table'), [name, args]);
    };

    BootstrapTable.prototype.resetHeader = function () {
        // fix #61: the hidden table reset header bug.
        // fix bug: get $el.css('width') error sometime (height = 500)
        clearTimeout(this.timeoutId_);
        this.timeoutId_ = setTimeout($.proxy(this.fitHeader, this), this.$el.is(':hidden') ? 100 : 0);
    };

    BootstrapTable.prototype.fitHeader = function () {
        var that = this,
            fixedBody,
            scrollWidth,
            focused,
            focusedTemp;

        if (that.$el.is(':hidden')) {
            that.timeoutId_ = setTimeout($.proxy(that.fitHeader, that), 100);
            return;
        }
        fixedBody = this.$tableBody.get(0);

        scrollWidth = fixedBody.scrollWidth > fixedBody.clientWidth &&
        fixedBody.scrollHeight > fixedBody.clientHeight + this.$header.outerHeight() ?
            getScrollBarWidth() : 0;

        this.$el.css('margin-top', -this.$header.outerHeight());

        focused = $(':focus');
        if (focused.length > 0) {
            var $th = focused.parents('th');
            if ($th.length > 0) {
                var dataField = $th.attr('data-field');
                if (dataField !== undefined) {
                    var $headerTh = this.$header.find("[data-field='" + dataField + "']");
                    if ($headerTh.length > 0) {
                        $headerTh.find(":input").addClass("focus-temp");
                    }
                }
            }
        }

        this.$header_ = this.$header.clone(true, true);
        this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');
        this.$tableHeader.css({
            'margin-right': scrollWidth
        }).find('table').css('width', this.$el.outerWidth())
            .html('').attr('class', this.$el.attr('class'))
            .append(this.$header_);


        focusedTemp = $('.focus-temp:visible:eq(0)');
        if (focusedTemp.length > 0) {
            focusedTemp.focus();
            this.$header.find('.focus-temp').removeClass('focus-temp');
        }

        // fix bug: $.data() is not working as expected after $.append()
        this.$header.find('th[data-field]').each(function (i) {
            that.$header_.find(sprintf('th[data-field="%s"]', $(this).data('field'))).data($(this).data());
        });

        var visibleFields = this.getVisibleFields(),
            $ths = this.$header_.find('th');

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this),
                index = i;

            if (that.options.detailView && !that.options.cardView) {
                if (i === 0) {
                    that.$header_.find('th.detail').find('.fht-cell').width($this.innerWidth());
                }
                index = i - 1;
            }

            var $th = that.$header_.find(sprintf('th[data-field="%s"]', visibleFields[index]));
            if ($th.length > 1) {
                $th = $($ths[$this[0].cellIndex]);
            }

            $th.find('.fht-cell').width($this.innerWidth());
        });
        // horizontal scroll event
        // TODO: it's probably better improving the layout than binding to scroll event
        this.$tableBody.off('scroll').on('scroll', function () {
            that.$tableHeader.scrollLeft($(this).scrollLeft());

            if (that.options.showFooter && !that.options.cardView) {
                that.$tableFooter.scrollLeft($(this).scrollLeft());
            }
        });
        that.trigger('post-header');
    };

    BootstrapTable.prototype.resetFooter = function () {
        var that = this,
            data = that.getData(),
            html = [];

        if (!this.options.showFooter || this.options.cardView) { //do nothing
            return;
        }

        if (!this.options.cardView && this.options.detailView) {
            html.push('<td><div class="th-inner">&nbsp;</div><div class="fht-cell"></div></td>');
        }

        $.each(this.columns, function (i, column) {
            var key,
                falign = '', // footer align style
                valign = '',
                csses = [],
                style = {},
                class_ = sprintf(' class="%s"', column['class']);

            if (!column.visible) {
                return;
            }

            if (that.options.cardView && (!column.cardVisible)) {
                return;
            }

            falign = sprintf('text-align: %s; ', column.falign ? column.falign : column.align);
            valign = sprintf('vertical-align: %s; ', column.valign);

            style = calculateObjectValue(null, that.options.footerStyle);

            if (style && style.css) {
                for (key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            html.push('<td', class_, sprintf(' style="%s"', falign + valign + csses.concat().join('; ')), '>');
            html.push('<div class="th-inner">');

            html.push(calculateObjectValue(column, column.footerFormatter, [data], '&nbsp;') || '&nbsp;');

            html.push('</div>');
            html.push('<div class="fht-cell"></div>');
            html.push('</div>');
            html.push('</td>');
        });

        this.$tableFooter.find('tr').html(html.join(''));
        this.$tableFooter.show();
        clearTimeout(this.timeoutFooter_);
        this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this),
            this.$el.is(':hidden') ? 100 : 0);
    };

    BootstrapTable.prototype.fitFooter = function () {
        var that = this,
            $footerTd,
            elWidth,
            scrollWidth;

        clearTimeout(this.timeoutFooter_);
        if (this.$el.is(':hidden')) {
            this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this), 100);
            return;
        }

        elWidth = this.$el.css('width');
        scrollWidth = elWidth > this.$tableBody.width() ? getScrollBarWidth() : 0;

        this.$tableFooter.css({
            'margin-right': scrollWidth
        }).find('table').css('width', elWidth)
            .attr('class', this.$el.attr('class'));

        $footerTd = this.$tableFooter.find('td');

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this);

            $footerTd.eq(i).find('.fht-cell').width($this.innerWidth());
        });
    };

    BootstrapTable.prototype.toggleColumn = function (index, checked, needUpdate) {
        if (index === -1) {
            return;
        }
        this.columns[index].visible = checked;
        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();

        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if (needUpdate) {
                $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
            }

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    BootstrapTable.prototype.toggleRow = function (index, uniqueId, visible) {
        if (index === -1) {
            return;
        }

        this.$body.find(typeof index !== 'undefined' ?
            sprintf('tr[data-index="%s"]', index) :
            sprintf('tr[data-uniqueid="%s"]', uniqueId))
            [visible ? 'show' : 'hide']();
    };

    BootstrapTable.prototype.getVisibleFields = function () {
        var that = this,
            visibleFields = [];

        $.each(this.header.fields, function (j, field) {
            var column = that.columns[getFieldIndex(that.columns, field)];

            if (!column.visible) {
                return;
            }
            visibleFields.push(field);
        });
        return visibleFields;
    };

    // PUBLIC FUNCTION DEFINITION
    // =======================

    BootstrapTable.prototype.resetView = function (params) {
        var padding = 0;

        if (params && params.height) {
            this.options.height = params.height;
        }

        this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
            this.$selectItem.length === this.$selectItem.filter(':checked').length);

        if (this.options.height) {
            var toolbarHeight = getRealHeight(this.$toolbar),
                paginationHeight = getRealHeight(this.$pagination),
                height = this.options.height - toolbarHeight - paginationHeight;

            this.$tableContainer.css('height', height + 'px');
        }

        if (this.options.cardView) {
            // remove the element css
            this.$el.css('margin-top', '0');
            this.$tableContainer.css('padding-bottom', '0');
            this.$tableFooter.hide();
            return;
        }

        if (this.options.showHeader && this.options.height) {
            this.$tableHeader.show();
            this.resetHeader();
            padding += this.$header.outerHeight();
        } else {
            this.$tableHeader.hide();
            this.trigger('post-header');
        }

        if (this.options.showFooter) {
            this.resetFooter();
            if (this.options.height) {
                padding += this.$tableFooter.outerHeight() + 1;
            }
        }

        // Assign the correct sortable arrow
        this.getCaret();
        this.$tableContainer.css('padding-bottom', padding + 'px');
        this.trigger('reset-view');
    };

    BootstrapTable.prototype.getData = function (useCurrentPage) {
        return (this.searchText || !$.isEmptyObject(this.filterColumns) || !$.isEmptyObject(this.filterColumnsPartial)) ?
            (useCurrentPage ? this.data.slice(this.pageFrom - 1, this.pageTo) : this.data) :
            (useCurrentPage ? this.options.data.slice(this.pageFrom - 1, this.pageTo) : this.options.data);
    };

    BootstrapTable.prototype.load = function (data) {
        var fixedScroll = false;

        // #431: support pagination
        if (this.options.sidePagination === 'server') {
            this.options.totalRows = data.total;
            fixedScroll = data.fixedScroll;
            data = data[this.options.dataField];
        } else if (!$.isArray(data)) { // support fixedScroll
            fixedScroll = data.fixedScroll;
            data = data.data;
        }

        this.initData(data);
        this.initSearch();
        this.initPagination();
        this.initBody(fixedScroll);
    };

    BootstrapTable.prototype.append = function (data) {
        this.initData(data, 'append');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.prepend = function (data) {
        this.initData(data, 'prepend');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.remove = function (params) {
        var len = this.options.data.length,
            i, row;

        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
            return;
        }

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (!row.hasOwnProperty(params.field)) {
                continue;
            }
            if ($.inArray(row[params.field], params.values) !== -1) {
                this.options.data.splice(i, 1);
            }
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.removeAll = function () {
        if (this.options.data.length > 0) {
            this.options.data.splice(0, this.options.data.length);
            this.initSearch();
            this.initPagination();
            this.initBody(true);
        }
    };

    BootstrapTable.prototype.getRowByUniqueId = function (id) {
        var uniqueId = this.options.uniqueId,
            len = this.options.data.length,
            dataRow = null,
            i, row, rowUniqueId;

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (row.hasOwnProperty(uniqueId)) { // uniqueId is a column
                rowUniqueId = row[uniqueId];
            } else if(row._data.hasOwnProperty(uniqueId)) { // uniqueId is a row data property
                rowUniqueId = row._data[uniqueId];
            } else {
                continue;
            }

            if (typeof rowUniqueId === 'string') {
                id = id.toString();
            } else if (typeof rowUniqueId === 'number') {
                if ((Number(rowUniqueId) === rowUniqueId) && (rowUniqueId % 1 === 0)) {
                    id = parseInt(id);
                } else if ((rowUniqueId === Number(rowUniqueId)) && (rowUniqueId !== 0)) {
                    id = parseFloat(id);
                }
            }

            if (rowUniqueId === id) {
                dataRow = row;
                break;
            }
        }

        return dataRow;
    };

    BootstrapTable.prototype.removeByUniqueId = function (id) {
        var len = this.options.data.length,
            row = this.getRowByUniqueId(id);

        if (row) {
            this.options.data.splice(this.options.data.indexOf(row), 1);
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateByUniqueId = function (params) {
        var that = this;
        var allParams = $.isArray(params) ? params : [ params ];

        $.each(allParams, function(i, params) {
            var rowId;

            if (!params.hasOwnProperty('id') || !params.hasOwnProperty('row')) {
                return;
            }

            rowId = $.inArray(that.getRowByUniqueId(params.id), that.options.data);

            if (rowId === -1) {
                return;
            }
            $.extend(that.options.data[rowId], params.row);
        });

        this.initSearch();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.insertRow = function (params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        this.data.splice(params.index, 0, params.row);
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateRow = function (params) {
        var that = this;
        var allParams = $.isArray(params) ? params : [ params ];

        $.each(allParams, function(i, params) {
            if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
                return;
            }
            $.extend(that.options.data[params.index], params.row);
        });

        this.initSearch();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.showRow = function (params) {
        if (!params.hasOwnProperty('index') && !params.hasOwnProperty('uniqueId')) {
            return;
        }
        this.toggleRow(params.index, params.uniqueId, true);
    };

    BootstrapTable.prototype.hideRow = function (params) {
        if (!params.hasOwnProperty('index') && !params.hasOwnProperty('uniqueId')) {
            return;
        }
        this.toggleRow(params.index, params.uniqueId, false);
    };

    BootstrapTable.prototype.getRowsHidden = function (show) {
        var rows = $(this.$body[0]).children().filter(':hidden'),
            i = 0;
        if (show) {
            for (; i < rows.length; i++) {
                $(rows[i]).show();
            }
        }
        return rows;
    };

    BootstrapTable.prototype.mergeCells = function (options) {
        var row = options.index,
            col = $.inArray(options.field, this.getVisibleFields()),
            rowspan = options.rowspan || 1,
            colspan = options.colspan || 1,
            i, j,
            $tr = this.$body.find('>tr'),
            $td;

        if (this.options.detailView && !this.options.cardView) {
            col += 1;
        }

        $td = $tr.eq(row).find('>td').eq(col);

        if (row < 0 || col < 0 || row >= this.data.length) {
            return;
        }

        for (i = row; i < row + rowspan; i++) {
            for (j = col; j < col + colspan; j++) {
                $tr.eq(i).find('>td').eq(j).hide();
            }
        }

        $td.attr('rowspan', rowspan).attr('colspan', colspan).show();
    };

    BootstrapTable.prototype.updateCell = function (params) {
        if (!params.hasOwnProperty('index') ||
            !params.hasOwnProperty('field') ||
            !params.hasOwnProperty('value')) {
            return;
        }
        this.data[params.index][params.field] = params.value;

        if (params.reinit === false) {
            return;
        }
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.getOptions = function () {
        return this.options;
    };

    BootstrapTable.prototype.getSelections = function () {
        var that = this;

        return $.grep(this.options.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.getAllSelections = function () {
        var that = this;

        return $.grep(this.options.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.checkAll = function () {
        this.checkAll_(true);
    };

    BootstrapTable.prototype.uncheckAll = function () {
        this.checkAll_(false);
    };

    BootstrapTable.prototype.checkInvert = function () {
        var that = this;
        var rows = that.$selectItem.filter(':enabled');
        var checked = rows.filter(':checked');
        rows.each(function() {
            $(this).prop('checked', !$(this).prop('checked'));
        });
        that.updateRows();
        that.updateSelected();
        that.trigger('uncheck-some', checked);
        checked = that.getSelections();
        that.trigger('check-some', checked);
    };

    BootstrapTable.prototype.checkAll_ = function (checked) {
        var rows;
        if (!checked) {
            rows = this.getSelections();
        }
        this.$selectAll.add(this.$selectAll_).prop('checked', checked);
        this.$selectItem.filter(':enabled').prop('checked', checked);
        this.updateRows();
        if (checked) {
            rows = this.getSelections();
        }
        this.trigger(checked ? 'check-all' : 'uncheck-all', rows);
    };

    BootstrapTable.prototype.check = function (index) {
        this.check_(true, index);
    };

    BootstrapTable.prototype.uncheck = function (index) {
        this.check_(false, index);
    };

    BootstrapTable.prototype.check_ = function (checked, index) {
        var $el = this.$selectItem.filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
        this.data[index][this.header.stateField] = checked;
        this.updateSelected();
        this.trigger(checked ? 'check' : 'uncheck', this.data[index], $el);
    };

    BootstrapTable.prototype.checkBy = function (obj) {
        this.checkBy_(true, obj);
    };

    BootstrapTable.prototype.uncheckBy = function (obj) {
        this.checkBy_(false, obj);
    };

    BootstrapTable.prototype.checkBy_ = function (checked, obj) {
        if (!obj.hasOwnProperty('field') || !obj.hasOwnProperty('values')) {
            return;
        }

        var that = this,
            rows = [];
        $.each(this.options.data, function (index, row) {
            if (!row.hasOwnProperty(obj.field)) {
                return false;
            }
            if ($.inArray(row[obj.field], obj.values) !== -1) {
                var $el = that.$selectItem.filter(':enabled')
                    .filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
                row[that.header.stateField] = checked;
                rows.push(row);
                that.trigger(checked ? 'check' : 'uncheck', row, $el);
            }
        });
        this.updateSelected();
        this.trigger(checked ? 'check-some' : 'uncheck-some', rows);
    };

    BootstrapTable.prototype.destroy = function () {
        this.$el.insertBefore(this.$container);
        $(this.options.toolbar).insertBefore(this.$el);
        this.$container.next().remove();
        this.$container.remove();
        this.$el.html(this.$el_.html())
            .css('margin-top', '0')
            .attr('class', this.$el_.attr('class') || ''); // reset the class
    };

    BootstrapTable.prototype.showLoading = function () {
        this.$tableLoading.show();
    };

    BootstrapTable.prototype.hideLoading = function () {
        this.$tableLoading.hide();
    };

    BootstrapTable.prototype.togglePagination = function () {
        this.options.pagination = !this.options.pagination;
        var button = this.$toolbar.find('button[name="paginationSwitch"] i');
        if (this.options.pagination) {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchDown);
        } else {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchUp);
        }
        this.updatePagination();
    };

    BootstrapTable.prototype.refresh = function (params) {
        if (params && params.url) {
            this.options.pageNumber = 1;
        }
        this.initServer(params && params.silent,
            params && params.query, params && params.url);
        this.trigger('refresh', params);
    };

    BootstrapTable.prototype.resetWidth = function () {
        if (this.options.showHeader && this.options.height) {
            this.fitHeader();
        }
        if (this.options.showFooter) {
            this.fitFooter();
        }
    };

    BootstrapTable.prototype.showColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.columns, field), true, true);
    };

    BootstrapTable.prototype.hideColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.columns, field), false, true);
    };

    BootstrapTable.prototype.getHiddenColumns = function () {
        return $.grep(this.columns, function (column) {
            return !column.visible;
        });
    };

    BootstrapTable.prototype.getVisibleColumns = function () {
        return $.grep(this.columns, function (column) {
            return column.visible;
        });
    };

    BootstrapTable.prototype.toggleAllColumns = function (visible) {
        $.each(this.columns, function (i, column) {
            this.columns[i].visible = visible;
        });

        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();
        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    BootstrapTable.prototype.showAllColumns = function () {
        this.toggleAllColumns(true);
    };

    BootstrapTable.prototype.hideAllColumns = function () {
        this.toggleAllColumns(false);
    };

    BootstrapTable.prototype.filterBy = function (columns) {
        this.filterColumns = $.isEmptyObject(columns) ? {} : columns;
        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
    };

    BootstrapTable.prototype.scrollTo = function (value) {
        if (typeof value === 'string') {
            value = value === 'bottom' ? this.$tableBody[0].scrollHeight : 0;
        }
        if (typeof value === 'number') {
            this.$tableBody.scrollTop(value);
        }
        if (typeof value === 'undefined') {
            return this.$tableBody.scrollTop();
        }
    };

    BootstrapTable.prototype.getScrollPosition = function () {
        return this.scrollTo();
    };

    BootstrapTable.prototype.selectPage = function (page) {
        if (page > 0 && page <= this.options.totalPages) {
            this.options.pageNumber = page;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.prevPage = function () {
        if (this.options.pageNumber > 1) {
            this.options.pageNumber--;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.nextPage = function () {
        if (this.options.pageNumber < this.options.totalPages) {
            this.options.pageNumber++;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.toggleView = function () {
        this.options.cardView = !this.options.cardView;
        this.initHeader();
        // Fixed remove toolbar when click cardView button.
        //that.initToolbar();
        this.initBody();
        this.trigger('toggle', this.options.cardView);
    };

    BootstrapTable.prototype.refreshOptions = function (options) {
        //If the objects are equivalent then avoid the call of destroy / init methods
        if (compareObjects(this.options, options, true)) {
            return;
        }
        this.options = $.extend(this.options, options);
        this.trigger('refresh-options', this.options);
        this.destroy();
        this.init();
    };

    BootstrapTable.prototype.resetSearch = function (text) {
        var $search = this.$toolbar.find('.search input');
        $search.val(text || '');
        this.onSearch({currentTarget: $search});
    };

    BootstrapTable.prototype.expandRow_ = function (expand, index) {
        var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', index));
        if ($tr.next().is('tr.detail-view') === (expand ? false : true)) {
            $tr.find('> td > .detail-icon').click();
        }
    };

    BootstrapTable.prototype.expandRow = function (index) {
        this.expandRow_(true, index);
    };

    BootstrapTable.prototype.collapseRow = function (index) {
        this.expandRow_(false, index);
    };

    BootstrapTable.prototype.expandAllRows = function (isSubTable) {
        if (isSubTable) {
            var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', 0)),
                that = this,
                detailIcon = null,
                executeInterval = false,
                idInterval = -1;

            if (!$tr.next().is('tr.detail-view')) {
                $tr.find('> td > .detail-icon').click();
                executeInterval = true;
            } else if (!$tr.next().next().is('tr.detail-view')) {
                $tr.next().find(".detail-icon").click();
                executeInterval = true;
            }

            if (executeInterval) {
                try {
                    idInterval = setInterval(function () {
                        detailIcon = that.$body.find("tr.detail-view").last().find(".detail-icon");
                        if (detailIcon.length > 0) {
                            detailIcon.click();
                        } else {
                            clearInterval(idInterval);
                        }
                    }, 1);
                } catch (ex) {
                    clearInterval(idInterval);
                }
            }
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(true, $(trs[i]).data("index"));
            }
        }
    };

    BootstrapTable.prototype.collapseAllRows = function (isSubTable) {
        if (isSubTable) {
            this.expandRow_(false, 0);
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(false, $(trs[i]).data("index"));
            }
        }
    };

    BootstrapTable.prototype.updateFormatText = function (name, text) {
        if (this.options[sprintf('format%s', name)]) {
            if (typeof text === 'string') {
                this.options[sprintf('format%s', name)] = function () {
                    return text;
                };
            } else if (typeof text === 'function') {
                this.options[sprintf('format%s', name)] = text;
            }
        }
        this.initToolbar();
        this.initPagination();
        this.initBody();
    };

    // BOOTSTRAP TABLE PLUGIN DEFINITION
    // =======================

    var allowedMethods = [
        'getOptions',
        'getSelections', 'getAllSelections', 'getData',
        'load', 'append', 'prepend', 'remove', 'removeAll',
        'insertRow', 'updateRow', 'updateCell', 'updateByUniqueId', 'removeByUniqueId',
        'getRowByUniqueId', 'showRow', 'hideRow', 'getRowsHidden',
        'mergeCells',
        'checkAll', 'uncheckAll', 'checkInvert',
        'check', 'uncheck',
        'checkBy', 'uncheckBy',
        'refresh',
        'resetView',
        'resetWidth',
        'destroy',
        'showLoading', 'hideLoading',
        'showColumn', 'hideColumn', 'getHiddenColumns', 'getVisibleColumns',
        'showAllColumns', 'hideAllColumns',
        'filterBy',
        'scrollTo',
        'getScrollPosition',
        'selectPage', 'prevPage', 'nextPage',
        'togglePagination',
        'toggleView',
        'refreshOptions',
        'resetSearch',
        'expandRow', 'collapseRow', 'expandAllRows', 'collapseAllRows',
        'updateFormatText'
    ];

    $.fn.bootstrapTable = function (option) {
        var value,
            args = Array.prototype.slice.call(arguments, 1);

        this.each(function () {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw new Error("Unknown method: " + option);
                }

                if (!data) {
                    return;
                }

                value = data[option].apply(data, args);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.bootstrapTable.Constructor = BootstrapTable;
    $.fn.bootstrapTable.defaults = BootstrapTable.DEFAULTS;
    $.fn.bootstrapTable.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
    $.fn.bootstrapTable.locales = BootstrapTable.LOCALES;
    $.fn.bootstrapTable.methods = allowedMethods;
    $.fn.bootstrapTable.utils = {
        sprintf: sprintf,
        getFieldIndex: getFieldIndex,
        compareObjects: compareObjects,
        calculateObjectValue: calculateObjectValue,
        getItemField: getItemField,
        objectKeys: objectKeys,
        isIEBrowser: isIEBrowser
    };

    // BOOTSTRAP TABLE INIT
    // =======================

    $(function () {
        $('[data-toggle="table"]').bootstrapTable();
    });
})(jQuery);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJicy10YWJsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyDQuNC90LrQu9GD0LTQuNC8INC30LDQstC40YHQuNC80YvQtSDRhNCw0LnQu9GLXHJcbi8qKlxyXG4gKiBAYXV0aG9yIHpoaXhpbiB3ZW4gPHdlbnpoaXhpbjIwMTBAZ21haWwuY29tPlxyXG4gKiB2ZXJzaW9uOiAxLjExLjBcclxuICogaHR0cHM6Ly9naXRodWIuY29tL3dlbnpoaXhpbi9ib290c3RyYXAtdGFibGUvXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uICgkKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gVE9PTFMgREVGSU5JVElPTlxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIHZhciBjYWNoZWRXaWR0aCA9IG51bGw7XHJcblxyXG4gICAgLy8gaXQgb25seSBkb2VzICclcycsIGFuZCByZXR1cm4gJycgd2hlbiBhcmd1bWVudHMgYXJlIHVuZGVmaW5lZFxyXG4gICAgdmFyIHNwcmludGYgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIGZsYWcgPSB0cnVlLFxyXG4gICAgICAgICAgICBpID0gMTtcclxuXHJcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaSsrXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcmc7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZsYWcgPyBzdHIgOiAnJztcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdldFByb3BlcnR5RnJvbU90aGVyID0gZnVuY3Rpb24gKGxpc3QsIGZyb20sIHRvLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcclxuICAgICAgICAkLmVhY2gobGlzdCwgZnVuY3Rpb24gKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW1bZnJvbV0gPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpdGVtW3RvXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0RmllbGRJbmRleCA9IGZ1bmN0aW9uIChjb2x1bW5zLCBmaWVsZCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xyXG5cclxuICAgICAgICAkLmVhY2goY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSBmaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gaHR0cDovL2pzZmlkZGxlLm5ldC93ZW55aS80N256N2V6OS8zL1xyXG4gICAgdmFyIHNldEZpZWxkSW5kZXggPSBmdW5jdGlvbiAoY29sdW1ucykge1xyXG4gICAgICAgIHZhciBpLCBqLCBrLFxyXG4gICAgICAgICAgICB0b3RhbENvbCA9IDAsXHJcbiAgICAgICAgICAgIGZsYWcgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbHVtbnNbMF0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWxDb2wgKz0gY29sdW1uc1swXVtpXS5jb2xzcGFuIHx8IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBmbGFnW2ldID0gW107XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB0b3RhbENvbDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFnW2ldW2pdID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjb2x1bW5zW2ldLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IGNvbHVtbnNbaV1bal0sXHJcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbiA9IHIucm93c3BhbiB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gPSByLmNvbHNwYW4gfHwgMSxcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9ICQuaW5BcnJheShmYWxzZSwgZmxhZ1tpXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHNwYW4gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICByLmZpZWxkSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIGZpZWxkIGlzIHVuZGVmaW5lZCwgdXNlIGluZGV4IGluc3RlYWRcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIuZmllbGQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIuZmllbGQgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHJvd3NwYW47IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZsYWdbaSArIGtdW2luZGV4XSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgY29sc3BhbjsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ1tpXVtpbmRleCArIGtdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdldFNjcm9sbEJhcldpZHRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmIChjYWNoZWRXaWR0aCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgaW5uZXIgPSAkKCc8cC8+JykuYWRkQ2xhc3MoJ2ZpeGVkLXRhYmxlLXNjcm9sbC1pbm5lcicpLFxyXG4gICAgICAgICAgICAgICAgb3V0ZXIgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnZml4ZWQtdGFibGUtc2Nyb2xsLW91dGVyJyksXHJcbiAgICAgICAgICAgICAgICB3MSwgdzI7XHJcblxyXG4gICAgICAgICAgICBvdXRlci5hcHBlbmQoaW5uZXIpO1xyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKG91dGVyKTtcclxuXHJcbiAgICAgICAgICAgIHcxID0gaW5uZXJbMF0ub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIG91dGVyLmNzcygnb3ZlcmZsb3cnLCAnc2Nyb2xsJyk7XHJcbiAgICAgICAgICAgIHcyID0gaW5uZXJbMF0ub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgICAgICAgICBpZiAodzEgPT09IHcyKSB7XHJcbiAgICAgICAgICAgICAgICB3MiA9IG91dGVyWzBdLmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBvdXRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgY2FjaGVkV2lkdGggPSB3MSAtIHcyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2FjaGVkV2lkdGg7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjYWxjdWxhdGVPYmplY3RWYWx1ZSA9IGZ1bmN0aW9uIChzZWxmLCBuYW1lLCBhcmdzLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICB2YXIgZnVuYyA9IG5hbWU7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgLy8gc3VwcG9ydCBvYmouZnVuYzEuZnVuYzJcclxuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdCgnLicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5hbWVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSB3aW5kb3c7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2gobmFtZXMsIGZ1bmN0aW9uIChpLCBmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuYyA9IGZ1bmNbZl07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSB3aW5kb3dbbmFtZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWZ1bmMgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnICYmIHNwcmludGYuYXBwbHkodGhpcywgW25hbWVdLmNvbmNhdChhcmdzKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNwcmludGYuYXBwbHkodGhpcywgW25hbWVdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjb21wYXJlT2JqZWN0cyA9IGZ1bmN0aW9uIChvYmplY3RBLCBvYmplY3RCLCBjb21wYXJlTGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGFycmF5cyBvZiBwcm9wZXJ0eSBuYW1lc1xyXG4gICAgICAgIHZhciBvYmplY3RBUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdEEpLFxyXG4gICAgICAgICAgICBvYmplY3RCUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdEIpLFxyXG4gICAgICAgICAgICBwcm9wTmFtZSA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoY29tcGFyZUxlbmd0aCkge1xyXG4gICAgICAgICAgICAvLyBJZiBudW1iZXIgb2YgcHJvcGVydGllcyBpcyBkaWZmZXJlbnQsIG9iamVjdHMgYXJlIG5vdCBlcXVpdmFsZW50XHJcbiAgICAgICAgICAgIGlmIChvYmplY3RBUHJvcGVydGllcy5sZW5ndGggIT09IG9iamVjdEJQcm9wZXJ0aWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdEFQcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb3BOYW1lID0gb2JqZWN0QVByb3BlcnRpZXNbaV07XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgcHJvcGVydHkgaXMgbm90IGluIHRoZSBvYmplY3QgQiBwcm9wZXJ0aWVzLCBjb250aW51ZSB3aXRoIHRoZSBuZXh0IHByb3BlcnR5XHJcbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkocHJvcE5hbWUsIG9iamVjdEJQcm9wZXJ0aWVzKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB2YWx1ZXMgb2Ygc2FtZSBwcm9wZXJ0eSBhcmUgbm90IGVxdWFsLCBvYmplY3RzIGFyZSBub3QgZXF1aXZhbGVudFxyXG4gICAgICAgICAgICAgICAgaWYgKG9iamVjdEFbcHJvcE5hbWVdICE9PSBvYmplY3RCW3Byb3BOYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UgbWFkZSBpdCB0aGlzIGZhciwgb2JqZWN0cyBhcmUgY29uc2lkZXJlZCBlcXVpdmFsZW50XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBlc2NhcGVIVE1MID0gZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRleHQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0XHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMDM5OycpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvYC9nLCAnJiN4NjA7Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0UmVhbEhlaWdodCA9IGZ1bmN0aW9uICgkZWwpIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gMDtcclxuICAgICAgICAkZWwuY2hpbGRyZW4oKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA8ICQodGhpcykub3V0ZXJIZWlnaHQodHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICQodGhpcykub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0UmVhbERhdGFBdHRyID0gZnVuY3Rpb24gKGRhdGFBdHRyKSB7XHJcbiAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBkYXRhQXR0cikge1xyXG4gICAgICAgICAgICB2YXIgYXV4QXR0ciA9IGF0dHIuc3BsaXQoLyg/PVtBLVpdKS8pLmpvaW4oJy0nKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAoYXV4QXR0ciAhPT0gYXR0cikge1xyXG4gICAgICAgICAgICAgICAgZGF0YUF0dHJbYXV4QXR0cl0gPSBkYXRhQXR0clthdHRyXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhQXR0clthdHRyXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRhdGFBdHRyO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0SXRlbUZpZWxkID0gZnVuY3Rpb24gKGl0ZW0sIGZpZWxkLCBlc2NhcGUpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkICE9PSAnc3RyaW5nJyB8fCBpdGVtLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlID8gZXNjYXBlSFRNTChpdGVtW2ZpZWxkXSkgOiBpdGVtW2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHByb3BzID0gZmllbGQuc3BsaXQoJy4nKTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIHByb3BzKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWVbcHJvcHNbcF1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXNjYXBlID8gZXNjYXBlSFRNTCh2YWx1ZSkgOiB2YWx1ZTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGlzSUVCcm93c2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIShuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIFwiKSA+IDAgfHwgISFuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLykpO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgb2JqZWN0S2V5cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBGcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9rZXlzXHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cykge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXHJcbiAgICAgICAgICAgICAgICAgICAgaGFzRG9udEVudW1CdWcgPSAhKHsgdG9TdHJpbmc6IG51bGwgfSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyksXHJcbiAgICAgICAgICAgICAgICAgICAgZG9udEVudW1zID0gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9TdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9Mb2NhbGVTdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndmFsdWVPZicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdoYXNPd25Qcm9wZXJ0eScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdpc1Byb3RvdHlwZU9mJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbnN0cnVjdG9yJ1xyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgZG9udEVudW1zTGVuZ3RoID0gZG9udEVudW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnICYmICh0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nIHx8IG9iaiA9PT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmtleXMgY2FsbGVkIG9uIG5vbi1vYmplY3QnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgcHJvcCwgaTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChwcm9wIGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcm9wKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0RvbnRFbnVtQnVnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkb250RW51bXNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqLCBkb250RW51bXNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZG9udEVudW1zW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEJPT1RTVFJBUCBUQUJMRSBDTEFTUyBERUZJTklUSU9OXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgdmFyIEJvb3RzdHJhcFRhYmxlID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICB0aGlzLiRlbCA9ICQoZWwpO1xyXG4gICAgICAgIHRoaXMuJGVsXyA9IHRoaXMuJGVsLmNsb25lKCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0SWRfID0gMDtcclxuICAgICAgICB0aGlzLnRpbWVvdXRGb290ZXJfID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTID0ge1xyXG4gICAgICAgIGNsYXNzZXM6ICd0YWJsZSB0YWJsZS1ob3ZlcicsXHJcbiAgICAgICAgbG9jYWxlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgaGVpZ2h0OiB1bmRlZmluZWQsXHJcbiAgICAgICAgdW5kZWZpbmVkVGV4dDogJy0nLFxyXG4gICAgICAgIHNvcnROYW1lOiB1bmRlZmluZWQsXHJcbiAgICAgICAgc29ydE9yZGVyOiAnYXNjJyxcclxuICAgICAgICBzb3J0U3RhYmxlOiBmYWxzZSxcclxuICAgICAgICBzdHJpcGVkOiBmYWxzZSxcclxuICAgICAgICBjb2x1bW5zOiBbW11dLFxyXG4gICAgICAgIGRhdGE6IFtdLFxyXG4gICAgICAgIGRhdGFGaWVsZDogJ3Jvd3MnLFxyXG4gICAgICAgIG1ldGhvZDogJ2dldCcsXHJcbiAgICAgICAgdXJsOiB1bmRlZmluZWQsXHJcbiAgICAgICAgYWpheDogdW5kZWZpbmVkLFxyXG4gICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBhamF4T3B0aW9uczoge30sXHJcbiAgICAgICAgcXVlcnlQYXJhbXM6IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHF1ZXJ5UGFyYW1zVHlwZTogJ2xpbWl0JywgLy8gdW5kZWZpbmVkXHJcbiAgICAgICAgcmVzcG9uc2VIYW5kbGVyOiBmdW5jdGlvbiAocmVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYWdpbmF0aW9uOiBmYWxzZSxcclxuICAgICAgICBvbmx5SW5mb1BhZ2luYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNpZGVQYWdpbmF0aW9uOiAnY2xpZW50JywgLy8gY2xpZW50IG9yIHNlcnZlclxyXG4gICAgICAgIHRvdGFsUm93czogMCwgLy8gc2VydmVyIHNpZGUgbmVlZCB0byBzZXRcclxuICAgICAgICBwYWdlTnVtYmVyOiAxLFxyXG4gICAgICAgIHBhZ2VTaXplOiAxMCxcclxuICAgICAgICBwYWdlTGlzdDogWzEwLCAyNSwgNTAsIDEwMF0sXHJcbiAgICAgICAgcGFnaW5hdGlvbkhBbGlnbjogJ3JpZ2h0JywgLy9yaWdodCwgbGVmdFxyXG4gICAgICAgIHBhZ2luYXRpb25WQWxpZ246ICdib3R0b20nLCAvL2JvdHRvbSwgdG9wLCBib3RoXHJcbiAgICAgICAgcGFnaW5hdGlvbkRldGFpbEhBbGlnbjogJ2xlZnQnLCAvL3JpZ2h0LCBsZWZ0XHJcbiAgICAgICAgcGFnaW5hdGlvblByZVRleHQ6ICcmbHNhcXVvOycsXHJcbiAgICAgICAgcGFnaW5hdGlvbk5leHRUZXh0OiAnJnJzYXF1bzsnLFxyXG4gICAgICAgIHNlYXJjaDogZmFsc2UsXHJcbiAgICAgICAgc2VhcmNoT25FbnRlcktleTogZmFsc2UsXHJcbiAgICAgICAgc3RyaWN0U2VhcmNoOiBmYWxzZSxcclxuICAgICAgICBzZWFyY2hBbGlnbjogJ3JpZ2h0JyxcclxuICAgICAgICBzZWxlY3RJdGVtTmFtZTogJ2J0U2VsZWN0SXRlbScsXHJcbiAgICAgICAgc2hvd0hlYWRlcjogdHJ1ZSxcclxuICAgICAgICBzaG93Rm9vdGVyOiBmYWxzZSxcclxuICAgICAgICBzaG93Q29sdW1uczogZmFsc2UsXHJcbiAgICAgICAgc2hvd1BhZ2luYXRpb25Td2l0Y2g6IGZhbHNlLFxyXG4gICAgICAgIHNob3dSZWZyZXNoOiBmYWxzZSxcclxuICAgICAgICBzaG93VG9nZ2xlOiBmYWxzZSxcclxuICAgICAgICBidXR0b25zQWxpZ246ICdyaWdodCcsXHJcbiAgICAgICAgc21hcnREaXNwbGF5OiB0cnVlLFxyXG4gICAgICAgIGVzY2FwZTogZmFsc2UsXHJcbiAgICAgICAgbWluaW11bUNvdW50Q29sdW1uczogMSxcclxuICAgICAgICBpZEZpZWxkOiB1bmRlZmluZWQsXHJcbiAgICAgICAgdW5pcXVlSWQ6IHVuZGVmaW5lZCxcclxuICAgICAgICBjYXJkVmlldzogZmFsc2UsXHJcbiAgICAgICAgZGV0YWlsVmlldzogZmFsc2UsXHJcbiAgICAgICAgZGV0YWlsRm9ybWF0dGVyOiBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmltT25TZWFyY2g6IHRydWUsXHJcbiAgICAgICAgY2xpY2tUb1NlbGVjdDogZmFsc2UsXHJcbiAgICAgICAgc2luZ2xlU2VsZWN0OiBmYWxzZSxcclxuICAgICAgICB0b29sYmFyOiB1bmRlZmluZWQsXHJcbiAgICAgICAgdG9vbGJhckFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgY2hlY2tib3hIZWFkZXI6IHRydWUsXHJcbiAgICAgICAgc29ydGFibGU6IHRydWUsXHJcbiAgICAgICAgc2lsZW50U29ydDogdHJ1ZSxcclxuICAgICAgICBtYWludGFpblNlbGVjdGVkOiBmYWxzZSxcclxuICAgICAgICBzZWFyY2hUaW1lT3V0OiA1MDAsXHJcbiAgICAgICAgc2VhcmNoVGV4dDogJycsXHJcbiAgICAgICAgaWNvblNpemU6IHVuZGVmaW5lZCxcclxuICAgICAgICBidXR0b25zQ2xhc3M6ICdkZWZhdWx0JyxcclxuICAgICAgICBpY29uc1ByZWZpeDogJ2dseXBoaWNvbicsIC8vIGdseXBoaWNvbiBvZiBmYSAoZm9udCBhd2Vzb21lKVxyXG4gICAgICAgIGljb25zOiB7XHJcbiAgICAgICAgICAgIHBhZ2luYXRpb25Td2l0Y2hEb3duOiAnZ2x5cGhpY29uLWNvbGxhcHNlLWRvd24gaWNvbi1jaGV2cm9uLWRvd24nLFxyXG4gICAgICAgICAgICBwYWdpbmF0aW9uU3dpdGNoVXA6ICdnbHlwaGljb24tY29sbGFwc2UtdXAgaWNvbi1jaGV2cm9uLXVwJyxcclxuICAgICAgICAgICAgcmVmcmVzaDogJ2dseXBoaWNvbi1yZWZyZXNoIGljb24tcmVmcmVzaCcsXHJcbiAgICAgICAgICAgIHRvZ2dsZTogJ2dseXBoaWNvbi1saXN0LWFsdCBpY29uLWxpc3QtYWx0JyxcclxuICAgICAgICAgICAgY29sdW1uczogJ2dseXBoaWNvbi10aCBpY29uLXRoJyxcclxuICAgICAgICAgICAgZGV0YWlsT3BlbjogJ2dseXBoaWNvbi1wbHVzIGljb24tcGx1cycsXHJcbiAgICAgICAgICAgIGRldGFpbENsb3NlOiAnZ2x5cGhpY29uLW1pbnVzIGljb24tbWludXMnXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY3VzdG9tU2VhcmNoOiAkLm5vb3AsXHJcblxyXG4gICAgICAgIGN1c3RvbVNvcnQ6ICQubm9vcCxcclxuXHJcbiAgICAgICAgcm93U3R5bGU6IGZ1bmN0aW9uIChyb3csIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByb3dBdHRyaWJ1dGVzOiBmdW5jdGlvbiAocm93LCBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZm9vdGVyU3R5bGU6IGZ1bmN0aW9uIChyb3csIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvbkFsbDogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGlja0NlbGw6IGZ1bmN0aW9uIChmaWVsZCwgdmFsdWUsIHJvdywgJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25EYmxDbGlja0NlbGw6IGZ1bmN0aW9uIChmaWVsZCwgdmFsdWUsIHJvdywgJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGlja1JvdzogZnVuY3Rpb24gKGl0ZW0sICRlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRGJsQ2xpY2tSb3c6IGZ1bmN0aW9uIChpdGVtLCAkZWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblNvcnQ6IGZ1bmN0aW9uIChuYW1lLCBvcmRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNoZWNrOiBmdW5jdGlvbiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uVW5jaGVjazogZnVuY3Rpb24gKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNoZWNrQWxsOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblVuY2hlY2tBbGw6IGZ1bmN0aW9uIChyb3dzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQ2hlY2tTb21lOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblVuY2hlY2tTb21lOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkxvYWRTdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkxvYWRFcnJvcjogZnVuY3Rpb24gKHN0YXR1cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNvbHVtblN3aXRjaDogZnVuY3Rpb24gKGZpZWxkLCBjaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUGFnZUNoYW5nZTogZnVuY3Rpb24gKG51bWJlciwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblNlYXJjaDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25Ub2dnbGU6IGZ1bmN0aW9uIChjYXJkVmlldykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblByZUJvZHk6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUG9zdEJvZHk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25Qb3N0SGVhZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRXhwYW5kUm93OiBmdW5jdGlvbiAoaW5kZXgsIHJvdywgJGRldGFpbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNvbGxhcHNlUm93OiBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblJlZnJlc2hPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblJlZnJlc2g6IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUmVzZXRWaWV3OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkxPQ0FMRVMgPSB7fTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5MT0NBTEVTWydlbi1VUyddID0gQm9vdHN0cmFwVGFibGUuTE9DQUxFUy5lbiA9IHtcclxuICAgICAgICBmb3JtYXRMb2FkaW5nTWVzc2FnZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFJlY29yZHNQZXJQYWdlOiBmdW5jdGlvbiAocGFnZU51bWJlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc3ByaW50ZignJXMgcm93cyBwZXIgcGFnZScsIHBhZ2VOdW1iZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0U2hvd2luZ1Jvd3M6IGZ1bmN0aW9uIChwYWdlRnJvbSwgcGFnZVRvLCB0b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNwcmludGYoJ1Nob3dpbmcgJXMgdG8gJXMgb2YgJXMgcm93cycsIHBhZ2VGcm9tLCBwYWdlVG8sIHRvdGFsUm93cyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXREZXRhaWxQYWdpbmF0aW9uOiBmdW5jdGlvbiAodG90YWxSb3dzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzcHJpbnRmKCdTaG93aW5nICVzIHJvd3MnLCB0b3RhbFJvd3MpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0U2VhcmNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnU2VhcmNoJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdE5vTWF0Y2hlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ05vIG1hdGNoaW5nIHJlY29yZHMgZm91bmQnO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0UGFnaW5hdGlvblN3aXRjaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ0hpZGUvU2hvdyBwYWdpbmF0aW9uJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdSZWZyZXNoJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFRvZ2dsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ1RvZ2dsZSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXRDb2x1bW5zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnQ29sdW1ucyc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXRBbGxSb3dzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnQWxsJztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgICQuZXh0ZW5kKEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTLCBCb290c3RyYXBUYWJsZS5MT0NBTEVTWydlbi1VUyddKTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5DT0xVTU5fREVGQVVMVFMgPSB7XHJcbiAgICAgICAgcmFkaW86IGZhbHNlLFxyXG4gICAgICAgIGNoZWNrYm94OiBmYWxzZSxcclxuICAgICAgICBjaGVja2JveEVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgZmllbGQ6IHVuZGVmaW5lZCxcclxuICAgICAgICB0aXRsZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIHRpdGxlVG9vbHRpcDogdW5kZWZpbmVkLFxyXG4gICAgICAgICdjbGFzcyc6IHVuZGVmaW5lZCxcclxuICAgICAgICBhbGlnbjogdW5kZWZpbmVkLCAvLyBsZWZ0LCByaWdodCwgY2VudGVyXHJcbiAgICAgICAgaGFsaWduOiB1bmRlZmluZWQsIC8vIGxlZnQsIHJpZ2h0LCBjZW50ZXJcclxuICAgICAgICBmYWxpZ246IHVuZGVmaW5lZCwgLy8gbGVmdCwgcmlnaHQsIGNlbnRlclxyXG4gICAgICAgIHZhbGlnbjogdW5kZWZpbmVkLCAvLyB0b3AsIG1pZGRsZSwgYm90dG9tXHJcbiAgICAgICAgd2lkdGg6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgb3JkZXI6ICdhc2MnLCAvLyBhc2MsIGRlc2NcclxuICAgICAgICB2aXNpYmxlOiB0cnVlLFxyXG4gICAgICAgIHN3aXRjaGFibGU6IHRydWUsXHJcbiAgICAgICAgY2xpY2tUb1NlbGVjdDogdHJ1ZSxcclxuICAgICAgICBmb3JtYXR0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBmb290ZXJGb3JtYXR0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBldmVudHM6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0TmFtZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGNlbGxTdHlsZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIHNlYXJjaGFibGU6IHRydWUsXHJcbiAgICAgICAgc2VhcmNoRm9ybWF0dGVyOiB0cnVlLFxyXG4gICAgICAgIGNhcmRWaXNpYmxlOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkVWRU5UUyA9IHtcclxuICAgICAgICAnYWxsLmJzLnRhYmxlJzogJ29uQWxsJyxcclxuICAgICAgICAnY2xpY2stY2VsbC5icy50YWJsZSc6ICdvbkNsaWNrQ2VsbCcsXHJcbiAgICAgICAgJ2RibC1jbGljay1jZWxsLmJzLnRhYmxlJzogJ29uRGJsQ2xpY2tDZWxsJyxcclxuICAgICAgICAnY2xpY2stcm93LmJzLnRhYmxlJzogJ29uQ2xpY2tSb3cnLFxyXG4gICAgICAgICdkYmwtY2xpY2stcm93LmJzLnRhYmxlJzogJ29uRGJsQ2xpY2tSb3cnLFxyXG4gICAgICAgICdzb3J0LmJzLnRhYmxlJzogJ29uU29ydCcsXHJcbiAgICAgICAgJ2NoZWNrLmJzLnRhYmxlJzogJ29uQ2hlY2snLFxyXG4gICAgICAgICd1bmNoZWNrLmJzLnRhYmxlJzogJ29uVW5jaGVjaycsXHJcbiAgICAgICAgJ2NoZWNrLWFsbC5icy50YWJsZSc6ICdvbkNoZWNrQWxsJyxcclxuICAgICAgICAndW5jaGVjay1hbGwuYnMudGFibGUnOiAnb25VbmNoZWNrQWxsJyxcclxuICAgICAgICAnY2hlY2stc29tZS5icy50YWJsZSc6ICdvbkNoZWNrU29tZScsXHJcbiAgICAgICAgJ3VuY2hlY2stc29tZS5icy50YWJsZSc6ICdvblVuY2hlY2tTb21lJyxcclxuICAgICAgICAnbG9hZC1zdWNjZXNzLmJzLnRhYmxlJzogJ29uTG9hZFN1Y2Nlc3MnLFxyXG4gICAgICAgICdsb2FkLWVycm9yLmJzLnRhYmxlJzogJ29uTG9hZEVycm9yJyxcclxuICAgICAgICAnY29sdW1uLXN3aXRjaC5icy50YWJsZSc6ICdvbkNvbHVtblN3aXRjaCcsXHJcbiAgICAgICAgJ3BhZ2UtY2hhbmdlLmJzLnRhYmxlJzogJ29uUGFnZUNoYW5nZScsXHJcbiAgICAgICAgJ3NlYXJjaC5icy50YWJsZSc6ICdvblNlYXJjaCcsXHJcbiAgICAgICAgJ3RvZ2dsZS5icy50YWJsZSc6ICdvblRvZ2dsZScsXHJcbiAgICAgICAgJ3ByZS1ib2R5LmJzLnRhYmxlJzogJ29uUHJlQm9keScsXHJcbiAgICAgICAgJ3Bvc3QtYm9keS5icy50YWJsZSc6ICdvblBvc3RCb2R5JyxcclxuICAgICAgICAncG9zdC1oZWFkZXIuYnMudGFibGUnOiAnb25Qb3N0SGVhZGVyJyxcclxuICAgICAgICAnZXhwYW5kLXJvdy5icy50YWJsZSc6ICdvbkV4cGFuZFJvdycsXHJcbiAgICAgICAgJ2NvbGxhcHNlLXJvdy5icy50YWJsZSc6ICdvbkNvbGxhcHNlUm93JyxcclxuICAgICAgICAncmVmcmVzaC1vcHRpb25zLmJzLnRhYmxlJzogJ29uUmVmcmVzaE9wdGlvbnMnLFxyXG4gICAgICAgICdyZXNldC12aWV3LmJzLnRhYmxlJzogJ29uUmVzZXRWaWV3JyxcclxuICAgICAgICAncmVmcmVzaC5icy50YWJsZSc6ICdvblJlZnJlc2gnXHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdExvY2FsZSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdENvbnRhaW5lcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFRhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5pbml0SGVhZGVyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0RGF0YSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEZvb3RlcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFRvb2xiYXIoKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaFRleHQoKTtcclxuICAgICAgICB0aGlzLmluaXRTZXJ2ZXIoKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRMb2NhbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhbGUpIHtcclxuICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5vcHRpb25zLmxvY2FsZS5zcGxpdCgvLXxfLyk7XHJcbiAgICAgICAgICAgIHBhcnRzWzBdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0c1sxXSkgcGFydHNbMV0udG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKCQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1t0aGlzLm9wdGlvbnMubG9jYWxlXSkge1xyXG4gICAgICAgICAgICAgICAgLy8gbG9jYWxlIGFzIHJlcXVlc3RlZFxyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCAkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbdGhpcy5vcHRpb25zLmxvY2FsZV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1twYXJ0cy5qb2luKCctJyldKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBsb2NhbGUgd2l0aCBzZXAgc2V0IHRvIC0gKGluIGNhc2Ugb3JpZ2luYWwgd2FzIHNwZWNpZmllZCB3aXRoIF8pXHJcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsICQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1twYXJ0cy5qb2luKCctJyldKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbcGFydHNbMF1dKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzaG9ydCBsb2NhbGUgbGFuZ3VhZ2UgY29kZSAoaS5lLiAnZW4nKVxyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCAkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbcGFydHNbMF1dKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRDb250YWluZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyID0gJChbXHJcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYm9vdHN0cmFwLXRhYmxlXCI+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS10b29sYmFyXCI+PC9kaXY+JyxcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25WQWxpZ24gPT09ICd0b3AnIHx8IHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uVkFsaWduID09PSAnYm90aCcgP1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1wYWdpbmF0aW9uXCIgc3R5bGU9XCJjbGVhcjogYm90aDtcIj48L2Rpdj4nIDpcclxuICAgICAgICAgICAgICAgICcnLFxyXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZpeGVkLXRhYmxlLWNvbnRhaW5lclwiPicsXHJcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZml4ZWQtdGFibGUtaGVhZGVyXCI+PHRhYmxlPjwvdGFibGU+PC9kaXY+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1ib2R5XCI+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1sb2FkaW5nXCI+JyxcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZvcm1hdExvYWRpbmdNZXNzYWdlKCksXHJcbiAgICAgICAgICAgICc8L2Rpdj4nLFxyXG4gICAgICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1mb290ZXJcIj48dGFibGU+PHRyPjwvdHI+PC90YWJsZT48L2Rpdj4nLFxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnaW5hdGlvblZBbGlnbiA9PT0gJ2JvdHRvbScgfHwgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25WQWxpZ24gPT09ICdib3RoJyA/XHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZpeGVkLXRhYmxlLXBhZ2luYXRpb25cIj48L2Rpdj4nIDpcclxuICAgICAgICAgICAgICAgICcnLFxyXG4gICAgICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICBdLmpvaW4oJycpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmluc2VydEFmdGVyKHRoaXMuJGVsKTtcclxuICAgICAgICB0aGlzLiR0YWJsZUNvbnRhaW5lciA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtY29udGFpbmVyJyk7XHJcbiAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIgPSB0aGlzLiRjb250YWluZXIuZmluZCgnLmZpeGVkLXRhYmxlLWhlYWRlcicpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlQm9keSA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtYm9keScpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZyA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtbG9hZGluZycpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlRm9vdGVyID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJy5maXhlZC10YWJsZS1mb290ZXInKTtcclxuICAgICAgICB0aGlzLiR0b29sYmFyID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJy5maXhlZC10YWJsZS10b29sYmFyJyk7XHJcbiAgICAgICAgdGhpcy4kcGFnaW5hdGlvbiA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtcGFnaW5hdGlvbicpO1xyXG5cclxuICAgICAgICB0aGlzLiR0YWJsZUJvZHkuYXBwZW5kKHRoaXMuJGVsKTtcclxuICAgICAgICB0aGlzLiRjb250YWluZXIuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJjbGVhcmZpeFwiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY2xhc3Nlcyk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpcGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKCd0YWJsZS1zdHJpcGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgkLmluQXJyYXkoJ3RhYmxlLW5vLWJvcmRlcmVkJywgdGhpcy5vcHRpb25zLmNsYXNzZXMuc3BsaXQoJyAnKSkgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlQ29udGFpbmVyLmFkZENsYXNzKCd0YWJsZS1uby1ib3JkZXJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUYWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGNvbHVtbnMgPSBbXSxcclxuICAgICAgICAgICAgZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLiRoZWFkZXIgPSB0aGlzLiRlbC5maW5kKCc+dGhlYWQnKTtcclxuICAgICAgICBpZiAoIXRoaXMuJGhlYWRlci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy4kaGVhZGVyID0gJCgnPHRoZWFkPjwvdGhlYWQ+JykuYXBwZW5kVG8odGhpcy4kZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbHVtbiA9IFtdO1xyXG5cclxuICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0aCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRml4ICMyMDE0IC0gZ2V0RmllbGRJbmRleCBhbmQgZWxzZXdoZXJlIGFzc3VtZSB0aGlzIGlzIHN0cmluZywgY2F1c2VzIGlzc3VlcyBpZiBub3RcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgJCh0aGlzKS5kYXRhKCdmaWVsZCcpICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuZGF0YSgnZmllbGQnLCAkKHRoaXMpLmRhdGEoJ2ZpZWxkJykgKyAnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb2x1bW4ucHVzaCgkLmV4dGVuZCh7fSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAkKHRoaXMpLmh0bWwoKSxcclxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiAkKHRoaXMpLmF0dHIoJ2NsYXNzJyksXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVUb29sdGlwOiAkKHRoaXMpLmF0dHIoJ3RpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbjogJCh0aGlzKS5hdHRyKCdyb3dzcGFuJykgPyArJCh0aGlzKS5hdHRyKCdyb3dzcGFuJykgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sc3BhbjogJCh0aGlzKS5hdHRyKCdjb2xzcGFuJykgPyArJCh0aGlzKS5hdHRyKCdjb2xzcGFuJykgOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sICQodGhpcykuZGF0YSgpKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoISQuaXNBcnJheSh0aGlzLm9wdGlvbnMuY29sdW1uc1swXSkpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvbHVtbnMgPSBbdGhpcy5vcHRpb25zLmNvbHVtbnNdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdGlvbnMuY29sdW1ucyA9ICQuZXh0ZW5kKHRydWUsIFtdLCBjb2x1bW5zLCB0aGlzLm9wdGlvbnMuY29sdW1ucyk7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XHJcblxyXG4gICAgICAgIHNldEZpZWxkSW5kZXgodGhpcy5vcHRpb25zLmNvbHVtbnMpO1xyXG4gICAgICAgICQuZWFjaCh0aGlzLm9wdGlvbnMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbnMpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGNvbHVtbnMsIGZ1bmN0aW9uIChqLCBjb2x1bW4pIHtcclxuICAgICAgICAgICAgICAgIGNvbHVtbiA9ICQuZXh0ZW5kKHt9LCBCb290c3RyYXBUYWJsZS5DT0xVTU5fREVGQVVMVFMsIGNvbHVtbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmllbGRJbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNvbHVtbnNbY29sdW1uLmZpZWxkSW5kZXhdID0gY29sdW1uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQub3B0aW9ucy5jb2x1bW5zW2ldW2pdID0gY29sdW1uO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gaWYgb3B0aW9ucy5kYXRhIGlzIHNldHRpbmcsIGRvIG5vdCBwcm9jZXNzIHRib2R5IGRhdGFcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBtID0gW107XHJcbiAgICAgICAgdGhpcy4kZWwuZmluZCgnPnRib2R5PnRyJykuZWFjaChmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgICAgICB2YXIgcm93ID0ge307XHJcblxyXG4gICAgICAgICAgICAvLyBzYXZlIHRyJ3MgaWQsIGNsYXNzIGFuZCBkYXRhLSogYXR0cmlidXRlc1xyXG4gICAgICAgICAgICByb3cuX2lkID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICByb3cuX2NsYXNzID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xyXG4gICAgICAgICAgICByb3cuX2RhdGEgPSBnZXRSZWFsRGF0YUF0dHIoJCh0aGlzKS5kYXRhKCkpO1xyXG5cclxuICAgICAgICAgICAgJCh0aGlzKS5maW5kKCc+dGQnKS5lYWNoKGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNzcGFuID0gKyR0aGlzLmF0dHIoJ2NvbHNwYW4nKSB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHJzcGFuID0gKyR0aGlzLmF0dHIoJ3Jvd3NwYW4nKSB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHR4LCB0eTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgbVt5XSAmJiBtW3ldW3hdOyB4KyspOyAvL3NraXAgYWxyZWFkeSBvY2N1cGllZCBjZWxscyBpbiBjdXJyZW50IHJvd1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodHggPSB4OyB0eCA8IHggKyBjc3BhbjsgdHgrKykgeyAvL21hcmsgbWF0cml4IGVsZW1lbnRzIG9jY3VwaWVkIGJ5IGN1cnJlbnQgY2VsbCB3aXRoIHRydWVcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHR5ID0geTsgdHkgPCB5ICsgcnNwYW47IHR5KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtW3R5XSkgeyAvL2ZpbGwgbWlzc2luZyByb3dzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtW3R5XSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1bdHldW3R4XSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9IHRoYXQuY29sdW1uc1t4XS5maWVsZDtcclxuXHJcbiAgICAgICAgICAgICAgICByb3dbZmllbGRdID0gJCh0aGlzKS5odG1sKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBzYXZlIHRkJ3MgaWQsIGNsYXNzIGFuZCBkYXRhLSogYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19pZCddID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19jbGFzcyddID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19yb3dzcGFuJ10gPSAkKHRoaXMpLmF0dHIoJ3Jvd3NwYW4nKTtcclxuICAgICAgICAgICAgICAgIHJvd1snXycgKyBmaWVsZCArICdfY29sc3BhbiddID0gJCh0aGlzKS5hdHRyKCdjb2xzcGFuJyk7XHJcbiAgICAgICAgICAgICAgICByb3dbJ18nICsgZmllbGQgKyAnX3RpdGxlJ10gPSAkKHRoaXMpLmF0dHIoJ3RpdGxlJyk7XHJcbiAgICAgICAgICAgICAgICByb3dbJ18nICsgZmllbGQgKyAnX2RhdGEnXSA9IGdldFJlYWxEYXRhQXR0cigkKHRoaXMpLmRhdGEoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkYXRhLnB1c2gocm93KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoKSB0aGlzLmZyb21IdG1sID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICB2aXNpYmxlQ29sdW1ucyA9IHt9LFxyXG4gICAgICAgICAgICBodG1sID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuaGVhZGVyID0ge1xyXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxyXG4gICAgICAgICAgICBzdHlsZXM6IFtdLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbXSxcclxuICAgICAgICAgICAgZm9ybWF0dGVyczogW10sXHJcbiAgICAgICAgICAgIGV2ZW50czogW10sXHJcbiAgICAgICAgICAgIHNvcnRlcnM6IFtdLFxyXG4gICAgICAgICAgICBzb3J0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBjZWxsU3R5bGVzOiBbXSxcclxuICAgICAgICAgICAgc2VhcmNoYWJsZXM6IFtdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMub3B0aW9ucy5jb2x1bW5zLCBmdW5jdGlvbiAoaSwgY29sdW1ucykge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSAwICYmICF0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgdGhhdC5vcHRpb25zLmRldGFpbFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8dGggY2xhc3M9XCJkZXRhaWxcIiByb3dzcGFuPVwiJXNcIj48ZGl2IGNsYXNzPVwiZmh0LWNlbGxcIj48L2Rpdj48L3RoPicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLmNvbHVtbnMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQuZWFjaChjb2x1bW5zLCBmdW5jdGlvbiAoaiwgY29sdW1uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhhbGlnbiA9ICcnLCAvLyBoZWFkZXIgYWxpZ24gc3R5bGVcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbiA9ICcnLCAvLyBib2R5IGFsaWduIHN0eWxlXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc18gPSBzcHJpbnRmKCcgY2xhc3M9XCIlc1wiJywgY29sdW1uWydjbGFzcyddKSxcclxuICAgICAgICAgICAgICAgICAgICBvcmRlciA9IHRoYXQub3B0aW9ucy5zb3J0T3JkZXIgfHwgY29sdW1uLm9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRXaWR0aCA9ICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBjb2x1bW4ud2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi53aWR0aCAhPT0gdW5kZWZpbmVkICYmICghdGhhdC5vcHRpb25zLmNhcmRWaWV3KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLndpZHRoID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sdW1uLndpZHRoLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRXaWR0aCA9ICclJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChjb2x1bW4ud2lkdGggJiYgdHlwZW9mIGNvbHVtbi53aWR0aCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IGNvbHVtbi53aWR0aC5yZXBsYWNlKCclJywgJycpLnJlcGxhY2UoJ3B4JywgJycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGhhbGlnbiA9IHNwcmludGYoJ3RleHQtYWxpZ246ICVzOyAnLCBjb2x1bW4uaGFsaWduID8gY29sdW1uLmhhbGlnbiA6IGNvbHVtbi5hbGlnbik7XHJcbiAgICAgICAgICAgICAgICBhbGlnbiA9IHNwcmludGYoJ3RleHQtYWxpZ246ICVzOyAnLCBjb2x1bW4uYWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUgPSBzcHJpbnRmKCd2ZXJ0aWNhbC1hbGlnbjogJXM7ICcsIGNvbHVtbi52YWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUgKz0gc3ByaW50Zignd2lkdGg6ICVzOyAnLCAoY29sdW1uLmNoZWNrYm94IHx8IGNvbHVtbi5yYWRpbykgJiYgIXdpZHRoID9cclxuICAgICAgICAgICAgICAgICAgICAnMzZweCcgOiAod2lkdGggPyB3aWR0aCArIHVuaXRXaWR0aCA6IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZpZWxkSW5kZXggIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuZmllbGRzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5maWVsZDtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5zdHlsZXNbY29sdW1uLmZpZWxkSW5kZXhdID0gYWxpZ24gKyBzdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5jbGFzc2VzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNsYXNzXztcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5mb3JtYXR0ZXJzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5mb3JtYXR0ZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuZXZlbnRzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5ldmVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuc29ydGVyc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uc29ydGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnNvcnROYW1lc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uc29ydE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuY2VsbFN0eWxlc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uY2VsbFN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnNlYXJjaGFibGVzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5zZWFyY2hhYmxlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbHVtbi52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgKCFjb2x1bW4uY2FyZFZpc2libGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGVDb2x1bW5zW2NvbHVtbi5maWVsZF0gPSBjb2x1bW47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGgnICsgc3ByaW50ZignIHRpdGxlPVwiJXNcIicsIGNvbHVtbi50aXRsZVRvb2x0aXApLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbi5jaGVja2JveCB8fCBjb2x1bW4ucmFkaW8gP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY2xhc3M9XCJicy1jaGVja2JveCAlc1wiJywgY29sdW1uWydjbGFzcyddIHx8ICcnKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzXyxcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgc3R5bGU9XCIlc1wiJywgaGFsaWduICsgc3R5bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyByb3dzcGFuPVwiJXNcIicsIGNvbHVtbi5yb3dzcGFuKSxcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY29sc3Bhbj1cIiVzXCInLCBjb2x1bW4uY29sc3BhbiksXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGRhdGEtZmllbGQ9XCIlc1wiJywgY29sdW1uLmZpZWxkKSxcclxuICAgICAgICAgICAgICAgICAgICBcInRhYmluZGV4PScwJ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICc+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHNwcmludGYoJzxkaXYgY2xhc3M9XCJ0aC1pbm5lciAlc1wiPicsIHRoYXQub3B0aW9ucy5zb3J0YWJsZSAmJiBjb2x1bW4uc29ydGFibGUgP1xyXG4gICAgICAgICAgICAgICAgICAgICdzb3J0YWJsZSBib3RoJyA6ICcnKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IGNvbHVtbi50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLmNoZWNrYm94KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0Lm9wdGlvbnMuc2luZ2xlU2VsZWN0ICYmIHRoYXQub3B0aW9ucy5jaGVja2JveEhlYWRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJzxpbnB1dCBuYW1lPVwiYnRTZWxlY3RBbGxcIiB0eXBlPVwiY2hlY2tib3hcIiAvPic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnN0YXRlRmllbGQgPSBjb2x1bW4uZmllbGQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLnJhZGlvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnN0YXRlRmllbGQgPSBjb2x1bW4uZmllbGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLnNpbmdsZVNlbGVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGRpdiBjbGFzcz1cImZodC1jZWxsXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RoPicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRoZWFkZXIuaHRtbChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndGhbZGF0YS1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuZGF0YSh2aXNpYmxlQ29sdW1uc1skKHRoaXMpLmRhdGEoJ2ZpZWxkJyldKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLiRjb250YWluZXIub2ZmKCdjbGljaycsICcudGgtaW5uZXInKS5vbignY2xpY2snLCAnLnRoLWlubmVyJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5kZXRhaWxWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoJy5ib290c3RyYXAtdGFibGUnKVswXSAhPT0gdGhhdC4kY29udGFpbmVyWzBdKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zb3J0YWJsZSAmJiB0YXJnZXQucGFyZW50KCkuZGF0YSgpLnNvcnRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm9uU29ydChldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaGVhZGVyLmNoaWxkcmVuKCkuY2hpbGRyZW4oKS5vZmYoJ2tleXByZXNzJykub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuc29ydGFibGUgJiYgJCh0aGlzKS5kYXRhKCkuc29ydGFibGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlID09IDEzKSB7IC8vRW50ZXIga2V5Y29kZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQub25Tb3J0KGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuYm9vdHN0cmFwLXRhYmxlJyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hvd0hlYWRlciB8fCB0aGlzLm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy4kaGVhZGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUxvYWRpbmcuY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRoZWFkZXIuc2hvdygpO1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUhlYWRlci5zaG93KCk7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZy5jc3MoJ3RvcCcsIHRoaXMuJGhlYWRlci5vdXRlckhlaWdodCgpICsgMSk7XHJcbiAgICAgICAgICAgIC8vIEFzc2lnbiB0aGUgY29ycmVjdCBzb3J0YWJsZSBhcnJvd1xyXG4gICAgICAgICAgICB0aGlzLmdldENhcmV0KCk7XHJcbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplLmJvb3RzdHJhcC10YWJsZScsICQucHJveHkodGhpcy5yZXNldFdpZHRoLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RBbGwgPSB0aGlzLiRoZWFkZXIuZmluZCgnW25hbWU9XCJidFNlbGVjdEFsbFwiXScpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdEFsbC5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgICAgIHRoYXRbY2hlY2tlZCA/ICdjaGVja0FsbCcgOiAndW5jaGVja0FsbCddKCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdEZvb3RlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5zaG93Rm9vdGVyIHx8IHRoaXMub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUZvb3Rlci5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVGb290ZXIuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gZGF0YVxyXG4gICAgICogQHBhcmFtIHR5cGU6IGFwcGVuZCAvIHByZXBlbmRcclxuICAgICAqL1xyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXREYXRhID0gZnVuY3Rpb24gKGRhdGEsIHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PT0gJ2FwcGVuZCcpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhLmNvbmNhdChkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdwcmVwZW5kJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXS5jb25jYXQoZGF0YSkuY29uY2F0KHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YSB8fCB0aGlzLm9wdGlvbnMuZGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpeCAjODM5IFJlY29yZHMgZGVsZXRlZCB3aGVuIGFkZGluZyBuZXcgcm93IG9uIGZpbHRlcmVkIHRhYmxlXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdhcHBlbmQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhID0gdGhpcy5vcHRpb25zLmRhdGEuY29uY2F0KGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3ByZXBlbmQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhID0gW10uY29uY2F0KGRhdGEpLmNvbmNhdCh0aGlzLm9wdGlvbnMuZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRhdGEgPSB0aGlzLmRhdGE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpZGVQYWdpbmF0aW9uID09PSAnc2VydmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRTb3J0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgbmFtZSA9IHRoaXMub3B0aW9ucy5zb3J0TmFtZSxcclxuICAgICAgICAgICAgb3JkZXIgPSB0aGlzLm9wdGlvbnMuc29ydE9yZGVyID09PSAnZGVzYycgPyAtMSA6IDEsXHJcbiAgICAgICAgICAgIGluZGV4ID0gJC5pbkFycmF5KHRoaXMub3B0aW9ucy5zb3J0TmFtZSwgdGhpcy5oZWFkZXIuZmllbGRzKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jdXN0b21Tb3J0ICE9PSAkLm5vb3ApIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmN1c3RvbVNvcnQuYXBwbHkodGhpcywgW3RoaXMub3B0aW9ucy5zb3J0TmFtZSwgdGhpcy5vcHRpb25zLnNvcnRPcmRlcl0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc29ydFN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHRoaXMuZGF0YSwgZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcm93Lmhhc093blByb3BlcnR5KCdfcG9zaXRpb24nKSkgcm93Ll9wb3NpdGlvbiA9IGk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmhlYWRlci5zb3J0TmFtZXNbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IHRoYXQuaGVhZGVyLnNvcnROYW1lc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYWEgPSBnZXRJdGVtRmllbGQoYSwgbmFtZSwgdGhhdC5vcHRpb25zLmVzY2FwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBnZXRJdGVtRmllbGQoYiwgbmFtZSwgdGhhdC5vcHRpb25zLmVzY2FwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGF0LmhlYWRlciwgdGhhdC5oZWFkZXIuc29ydGVyc1tpbmRleF0sIFthYSwgYmJdKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmRlciAqIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZpeCAjMTYxOiB1bmRlZmluZWQgb3IgbnVsbCBzdHJpbmcgc29ydCBidWcuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWEgPT09IHVuZGVmaW5lZCB8fCBhYSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gJyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYmIgPT09IHVuZGVmaW5lZCB8fCBiYiA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJiID0gJyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zb3J0U3RhYmxlICYmIGFhID09PSBiYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gYS5fcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBiLl9wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJRiBib3RoIHZhbHVlcyBhcmUgbnVtZXJpYywgZG8gYSBudW1lcmljIGNvbXBhcmlzb25cclxuICAgICAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyhhYSkgJiYgJC5pc051bWVyaWMoYmIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCBudW1lcmljYWwgdmFsdWVzIGZvcm0gc3RyaW5nIHRvIGZsb2F0LlxyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gcGFyc2VGbG9hdChhYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBwYXJzZUZsb2F0KGJiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWEgPCBiYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JkZXIgKiAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhYSA9PT0gYmIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB2YWx1ZSBpcyBub3QgYSBzdHJpbmcsIGNvbnZlcnQgdG8gc3RyaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFhICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gYWEudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWEubG9jYWxlQ29tcGFyZShiYikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyICogLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblNvcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSBldmVudC50eXBlID09PSBcImtleXByZXNzXCIgPyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpIDogJChldmVudC5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKSxcclxuICAgICAgICAgICAgJHRoaXNfID0gdGhpcy4kaGVhZGVyLmZpbmQoJ3RoJykuZXEoJHRoaXMuaW5kZXgoKSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhlYWRlci5hZGQodGhpcy4kaGVhZGVyXykuZmluZCgnc3Bhbi5vcmRlcicpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNvcnROYW1lID09PSAkdGhpcy5kYXRhKCdmaWVsZCcpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIgPSB0aGlzLm9wdGlvbnMuc29ydE9yZGVyID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0TmFtZSA9ICR0aGlzLmRhdGEoJ2ZpZWxkJyk7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIgPSAkdGhpcy5kYXRhKCdvcmRlcicpID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NvcnQnLCB0aGlzLm9wdGlvbnMuc29ydE5hbWUsIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIpO1xyXG5cclxuICAgICAgICAkdGhpcy5hZGQoJHRoaXNfKS5kYXRhKCdvcmRlcicsIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIpO1xyXG5cclxuICAgICAgICAvLyBBc3NpZ24gdGhlIGNvcnJlY3Qgc29ydGFibGUgYXJyb3dcclxuICAgICAgICB0aGlzLmdldENhcmV0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lkZVBhZ2luYXRpb24gPT09ICdzZXJ2ZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdFNlcnZlcih0aGlzLm9wdGlvbnMuc2lsZW50U29ydCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0VG9vbGJhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGh0bWwgPSBbXSxcclxuICAgICAgICAgICAgdGltZW91dElkID0gMCxcclxuICAgICAgICAgICAgJGtlZXBPcGVuLFxyXG4gICAgICAgICAgICAkc2VhcmNoLFxyXG4gICAgICAgICAgICBzd2l0Y2hhYmxlQ291bnQgPSAwO1xyXG5cclxuICAgICAgICBpZiAodGhpcy4kdG9vbGJhci5maW5kKCcuYnMtYmFycycpLmNoaWxkcmVuKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoJCh0aGlzLm9wdGlvbnMudG9vbGJhcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiR0b29sYmFyLmh0bWwoJycpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50b29sYmFyID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLnRvb2xiYXIgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICQoc3ByaW50ZignPGRpdiBjbGFzcz1cImJzLWJhcnMgcHVsbC0lc1wiPjwvZGl2PicsIHRoaXMub3B0aW9ucy50b29sYmFyQWxpZ24pKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuJHRvb2xiYXIpXHJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCQodGhpcy5vcHRpb25zLnRvb2xiYXIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNob3dDb2x1bW5zLCBzaG93VG9nZ2xlLCBzaG93UmVmcmVzaFxyXG4gICAgICAgIGh0bWwgPSBbc3ByaW50ZignPGRpdiBjbGFzcz1cImNvbHVtbnMgY29sdW1ucy0lcyBidG4tZ3JvdXAgcHVsbC0lc1wiPicsXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5idXR0b25zQWxpZ24sIHRoaXMub3B0aW9ucy5idXR0b25zQWxpZ24pXTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuaWNvbnMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pY29ucyA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKG51bGwsIHRoaXMub3B0aW9ucy5pY29ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dQYWdpbmF0aW9uU3dpdGNoKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8YnV0dG9uIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5idXR0b25zQ2xhc3MpICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1wiIHR5cGU9XCJidXR0b25cIiBuYW1lPVwicGFnaW5hdGlvblN3aXRjaFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRQYWdpbmF0aW9uU3dpdGNoKCkpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignPGkgY2xhc3M9XCIlcyAlc1wiPjwvaT4nLCB0aGlzLm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoaXMub3B0aW9ucy5pY29ucy5wYWdpbmF0aW9uU3dpdGNoRG93biksXHJcbiAgICAgICAgICAgICAgICAnPC9idXR0b24+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dSZWZyZXNoKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8YnV0dG9uIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5idXR0b25zQ2xhc3MpICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1wiIHR5cGU9XCJidXR0b25cIiBuYW1lPVwicmVmcmVzaFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRSZWZyZXNoKCkpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignPGkgY2xhc3M9XCIlcyAlc1wiPjwvaT4nLCB0aGlzLm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoaXMub3B0aW9ucy5pY29ucy5yZWZyZXNoKSxcclxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1RvZ2dsZSkge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goc3ByaW50ZignPGJ1dHRvbiBjbGFzcz1cImJ0bicgK1xyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBidG4tJXMnLCB0aGlzLm9wdGlvbnMuYnV0dG9uc0NsYXNzKSArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICdcIiB0eXBlPVwiYnV0dG9uXCIgbmFtZT1cInRvZ2dsZVwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRUb2dnbGUoKSksXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCc8aSBjbGFzcz1cIiVzICVzXCI+PC9pPicsIHRoaXMub3B0aW9ucy5pY29uc1ByZWZpeCwgdGhpcy5vcHRpb25zLmljb25zLnRvZ2dsZSksXHJcbiAgICAgICAgICAgICAgICAnPC9idXR0b24+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dDb2x1bW5zKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8ZGl2IGNsYXNzPVwia2VlcC1vcGVuIGJ0bi1ncm91cFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRDb2x1bW5zKCkpLFxyXG4gICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmJ1dHRvbnNDbGFzcykgK1xyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgJyBkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCI+JyxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJzxpIGNsYXNzPVwiJXMgJXNcIj48L2k+JywgdGhpcy5vcHRpb25zLmljb25zUHJlZml4LCB0aGlzLm9wdGlvbnMuaWNvbnMuY29sdW1ucyksXHJcbiAgICAgICAgICAgICAgICAnIDxzcGFuIGNsYXNzPVwiY2FyZXRcIj48L3NwYW4+JyxcclxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nLFxyXG4gICAgICAgICAgICAgICAgJzx1bCBjbGFzcz1cImRyb3Bkb3duLW1lbnVcIiByb2xlPVwibWVudVwiPicpO1xyXG5cclxuICAgICAgICAgICAgJC5lYWNoKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi5yYWRpbyB8fCBjb2x1bW4uY2hlY2tib3ggfHwgY29sdW1uLnRpdGxlLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLmNhcmRWaWV3ICYmICFjb2x1bW4uY2FyZFZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSBjb2x1bW4udmlzaWJsZSA/ICcgY2hlY2tlZD1cImNoZWNrZWRcIicgOiAnJztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLnN3aXRjaGFibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goc3ByaW50ZignPGxpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBkYXRhLWZpZWxkPVwiJXNcIiB2YWx1ZT1cIiVzXCIlcz4gJXM8L2xhYmVsPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9saT4nLCBjb2x1bW4uZmllbGQsIGksIGNoZWNrZWQsIGNvbHVtbi50aXRsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaGFibGVDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3VsPicsXHJcbiAgICAgICAgICAgICAgICAnPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBodG1sLnB1c2goJzwvZGl2PicpO1xyXG5cclxuICAgICAgICAvLyBGaXggIzE4ODogdGhpcy5zaG93VG9vbGJhciBpcyBmb3IgZXh0ZW5zaW9uc1xyXG4gICAgICAgIGlmICh0aGlzLnNob3dUb29sYmFyIHx8IGh0bWwubGVuZ3RoID4gMikge1xyXG4gICAgICAgICAgICB0aGlzLiR0b29sYmFyLmFwcGVuZChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1BhZ2luYXRpb25Td2l0Y2gpIHtcclxuICAgICAgICAgICAgdGhpcy4kdG9vbGJhci5maW5kKCdidXR0b25bbmFtZT1cInBhZ2luYXRpb25Td2l0Y2hcIl0nKVxyXG4gICAgICAgICAgICAgICAgLm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMudG9nZ2xlUGFnaW5hdGlvbiwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93UmVmcmVzaCkge1xyXG4gICAgICAgICAgICB0aGlzLiR0b29sYmFyLmZpbmQoJ2J1dHRvbltuYW1lPVwicmVmcmVzaFwiXScpXHJcbiAgICAgICAgICAgICAgICAub2ZmKCdjbGljaycpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5yZWZyZXNoLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dUb2dnbGUpIHtcclxuICAgICAgICAgICAgdGhpcy4kdG9vbGJhci5maW5kKCdidXR0b25bbmFtZT1cInRvZ2dsZVwiXScpXHJcbiAgICAgICAgICAgICAgICAub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnRvZ2dsZVZpZXcoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Q29sdW1ucykge1xyXG4gICAgICAgICAgICAka2VlcE9wZW4gPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5rZWVwLW9wZW4nKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzd2l0Y2hhYmxlQ291bnQgPD0gdGhpcy5vcHRpb25zLm1pbmltdW1Db3VudENvbHVtbnMpIHtcclxuICAgICAgICAgICAgICAgICRrZWVwT3Blbi5maW5kKCdpbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICRrZWVwT3Blbi5maW5kKCdsaScpLm9mZignY2xpY2snKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJGtlZXBPcGVuLmZpbmQoJ2lucHV0Jykub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC50b2dnbGVDb2x1bW4oJCh0aGlzKS52YWwoKSwgJHRoaXMucHJvcCgnY2hlY2tlZCcpLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2NvbHVtbi1zd2l0Y2gnLCAkKHRoaXMpLmRhdGEoJ2ZpZWxkJyksICR0aGlzLnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZWFyY2gpIHtcclxuICAgICAgICAgICAgaHRtbCA9IFtdO1xyXG4gICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInB1bGwtJyArIHRoaXMub3B0aW9ucy5zZWFyY2hBbGlnbiArICcgc2VhcmNoXCI+JyxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJzxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbCcgK1xyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBpbnB1dC0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICdcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRTZWFyY2goKSksXHJcbiAgICAgICAgICAgICAgICAnPC9kaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiR0b29sYmFyLmFwcGVuZChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICAgICAgJHNlYXJjaCA9IHRoaXMuJHRvb2xiYXIuZmluZCgnLnNlYXJjaCBpbnB1dCcpO1xyXG4gICAgICAgICAgICAkc2VhcmNoLm9mZigna2V5dXAgZHJvcCcpLm9uKCdrZXl1cCBkcm9wJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLnNlYXJjaE9uRW50ZXJLZXkgJiYgZXZlbnQua2V5Q29kZSAhPT0gMTMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheShldmVudC5rZXlDb2RlLCBbMzcsIDM4LCAzOSwgNDBdKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpOyAvLyBkb2Vzbid0IG1hdHRlciBpZiBpdCdzIDBcclxuICAgICAgICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQub25TZWFyY2goZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhhdC5vcHRpb25zLnNlYXJjaFRpbWVPdXQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0lFQnJvd3NlcigpKSB7XHJcbiAgICAgICAgICAgICAgICAkc2VhcmNoLm9mZignbW91c2V1cCcpLm9uKCdtb3VzZXVwJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7IC8vIGRvZXNuJ3QgbWF0dGVyIGlmIGl0J3MgMFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm9uU2VhcmNoKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGF0Lm9wdGlvbnMuc2VhcmNoVGltZU91dCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm9uU2VhcmNoID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIHRleHQgPSAkLnRyaW0oJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKSk7XHJcblxyXG4gICAgICAgIC8vIHRyaW0gc2VhcmNoIGlucHV0XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmltT25TZWFyY2ggJiYgJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKSAhPT0gdGV4dCkge1xyXG4gICAgICAgICAgICAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnZhbCh0ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0ZXh0ID09PSB0aGlzLnNlYXJjaFRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlYXJjaFRleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5zZWFyY2hUZXh0ID0gdGV4dDtcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSAxO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VhcmNoJywgdGV4dCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0U2VhcmNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWRlUGFnaW5hdGlvbiAhPT0gJ3NlcnZlcicpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jdXN0b21TZWFyY2ggIT09ICQubm9vcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmN1c3RvbVNlYXJjaC5hcHBseSh0aGlzLCBbdGhpcy5zZWFyY2hUZXh0XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzID0gdGhpcy5zZWFyY2hUZXh0ICYmICh0aGlzLm9wdGlvbnMuZXNjYXBlID9cclxuICAgICAgICAgICAgICAgIGVzY2FwZUhUTUwodGhpcy5zZWFyY2hUZXh0KSA6IHRoaXMuc2VhcmNoVGV4dCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgdmFyIGYgPSAkLmlzRW1wdHlPYmplY3QodGhpcy5maWx0ZXJDb2x1bW5zKSA/IG51bGwgOiB0aGlzLmZpbHRlckNvbHVtbnM7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBmaWx0ZXJcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZiA/ICQuZ3JlcCh0aGlzLm9wdGlvbnMuZGF0YSwgZnVuY3Rpb24gKGl0ZW0sIGkpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNBcnJheShmW2tleV0pICYmICQuaW5BcnJheShpdGVtW2tleV0sIGZba2V5XSkgPT09IC0xIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtW2tleV0gIT09IGZba2V5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0pIDogdGhpcy5vcHRpb25zLmRhdGE7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBzID8gJC5ncmVwKHRoaXMuZGF0YSwgZnVuY3Rpb24gKGl0ZW0sIGkpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhhdC5oZWFkZXIuZmllbGRzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5oZWFkZXIuc2VhcmNoYWJsZXNbal0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gJC5pc051bWVyaWModGhhdC5oZWFkZXIuZmllbGRzW2pdKSA/IHBhcnNlSW50KHRoYXQuaGVhZGVyLmZpZWxkc1tqXSwgMTApIDogdGhhdC5oZWFkZXIuZmllbGRzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2x1bW4gPSB0aGF0LmNvbHVtbnNbZ2V0RmllbGRJbmRleCh0aGF0LmNvbHVtbnMsIGtleSldO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzID0ga2V5LnNwbGl0KCcuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BfaW5kZXggPSAwOyBwcm9wX2luZGV4IDwgcHJvcHMubGVuZ3RoOyBwcm9wX2luZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVbcHJvcHNbcHJvcF9pbmRleF1dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggIzE0MjogcmVzcGVjdCBzZWFyY2hGb3JhbXR0ZXIgYm9vbGVhblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sdW1uICYmIGNvbHVtbi5zZWFyY2hGb3JtYXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUoY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLmZvcm1hdHRlcnNbal0sIFt2YWx1ZSwgaXRlbSwgaV0sIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gaXRlbVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLnN0cmljdFNlYXJjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh2YWx1ZSArICcnKS50b0xvd2VyQ2FzZSgpID09PSBzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHZhbHVlICsgJycpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSkgOiB0aGlzLmRhdGE7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFBhZ2luYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucGFnaW5hdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLiRwYWdpbmF0aW9uLmhpZGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHBhZ2luYXRpb24uc2hvdygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBodG1sID0gW10sXHJcbiAgICAgICAgICAgICRhbGxTZWxlY3RlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICBpLCBmcm9tLCB0byxcclxuICAgICAgICAgICAgJHBhZ2VMaXN0LFxyXG4gICAgICAgICAgICAkZmlyc3QsICRwcmUsXHJcbiAgICAgICAgICAgICRuZXh0LCAkbGFzdCxcclxuICAgICAgICAgICAgJG51bWJlcixcclxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuZ2V0RGF0YSgpLFxyXG4gICAgICAgICAgICBwYWdlTGlzdCA9IHRoaXMub3B0aW9ucy5wYWdlTGlzdDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWRlUGFnaW5hdGlvbiAhPT0gJ3NlcnZlcicpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRvdGFsUm93cyA9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50b3RhbFBhZ2VzID0gMDtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRvdGFsUm93cykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VTaXplID09PSB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZVNpemUgPSB0aGlzLm9wdGlvbnMudG90YWxSb3dzO1xyXG4gICAgICAgICAgICAgICAgJGFsbFNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMucGFnZVNpemUgPT09IHRoaXMub3B0aW9ucy50b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZpeCAjNjY3IFRhYmxlIHdpdGggcGFnaW5hdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIG11bHRpcGxlIHBhZ2VzIGFuZCBhIHNlYXJjaCB0aGF0IG1hdGNoZXMgdG8gb25lIHBhZ2UgdGhyb3dzIGV4Y2VwdGlvblxyXG4gICAgICAgICAgICAgICAgdmFyIHBhZ2VMc3QgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnBhZ2VMaXN0ID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VMaXN0LnJlcGxhY2UoJ1snLCAnJykucmVwbGFjZSgnXScsICcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvIC9nLCAnJykudG9Mb3dlckNhc2UoKS5zcGxpdCgnLCcpIDogdGhpcy5vcHRpb25zLnBhZ2VMaXN0O1xyXG4gICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheSh0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpLnRvTG93ZXJDYXNlKCksIHBhZ2VMc3QpICA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGFsbFNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50b3RhbFBhZ2VzID0gfn4oKHRoaXMub3B0aW9ucy50b3RhbFJvd3MgLSAxKSAvIHRoaXMub3B0aW9ucy5wYWdlU2l6ZSkgKyAxO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRvdGFsUGFnZXMgPSB0aGlzLnRvdGFsUGFnZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPiAwICYmIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID4gdGhpcy50b3RhbFBhZ2VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gdGhpcy50b3RhbFBhZ2VzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wYWdlRnJvbSA9ICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciAtIDEpICogdGhpcy5vcHRpb25zLnBhZ2VTaXplICsgMTtcclxuICAgICAgICB0aGlzLnBhZ2VUbyA9IHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyICogdGhpcy5vcHRpb25zLnBhZ2VTaXplO1xyXG4gICAgICAgIGlmICh0aGlzLnBhZ2VUbyA+IHRoaXMub3B0aW9ucy50b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgdGhpcy5wYWdlVG8gPSB0aGlzLm9wdGlvbnMudG90YWxSb3dzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInB1bGwtJyArIHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRGV0YWlsSEFsaWduICsgJyBwYWdpbmF0aW9uLWRldGFpbFwiPicsXHJcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInBhZ2luYXRpb24taW5mb1wiPicsXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vbmx5SW5mb1BhZ2luYXRpb24gPyB0aGlzLm9wdGlvbnMuZm9ybWF0RGV0YWlsUGFnaW5hdGlvbih0aGlzLm9wdGlvbnMudG90YWxSb3dzKSA6XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRTaG93aW5nUm93cyh0aGlzLnBhZ2VGcm9tLCB0aGlzLnBhZ2VUbywgdGhpcy5vcHRpb25zLnRvdGFsUm93cyksXHJcbiAgICAgICAgICAgICc8L3NwYW4+Jyk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLm9ubHlJbmZvUGFnaW5hdGlvbikge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzxzcGFuIGNsYXNzPVwicGFnZS1saXN0XCI+Jyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFnZU51bWJlciA9IFtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cCAlc1wiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uVkFsaWduID09PSAndG9wJyB8fCB0aGlzLm9wdGlvbnMucGFnaW5hdGlvblZBbGlnbiA9PT0gJ2JvdGgnID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkcm9wZG93bicgOiAnZHJvcHVwJyksXHJcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5idXR0b25zQ2xhc3MpICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJyBkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCI+JyxcclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJwYWdlLXNpemVcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICRhbGxTZWxlY3RlZCA/IHRoaXMub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCkgOiB0aGlzLm9wdGlvbnMucGFnZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvc3Bhbj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICcgPHNwYW4gY2xhc3M9XCJjYXJldFwiPjwvc3Bhbj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj4nXHJcbiAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucGFnZUxpc3QgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IHRoaXMub3B0aW9ucy5wYWdlTGlzdC5yZXBsYWNlKCdbJywgJycpLnJlcGxhY2UoJ10nLCAnJylcclxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvIC9nLCAnJykuc3BsaXQoJywnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBwYWdlTGlzdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGxpc3QsIGZ1bmN0aW9uIChpLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VMaXN0LnB1c2godmFsdWUudG9VcHBlckNhc2UoKSA9PT0gdGhhdC5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKS50b1VwcGVyQ2FzZSgpID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSA6ICt2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJC5lYWNoKHBhZ2VMaXN0LCBmdW5jdGlvbiAoaSwgcGFnZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGF0Lm9wdGlvbnMuc21hcnREaXNwbGF5IHx8IGkgPT09IDAgfHwgcGFnZUxpc3RbaSAtIDFdIDw9IHRoYXQub3B0aW9ucy50b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkYWxsU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gcGFnZSA9PT0gdGhhdC5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSA/ICcgY2xhc3M9XCJhY3RpdmVcIicgOiAnJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBwYWdlID09PSB0aGF0Lm9wdGlvbnMucGFnZVNpemUgPyAnIGNsYXNzPVwiYWN0aXZlXCInIDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VOdW1iZXIucHVzaChzcHJpbnRmKCc8bGklcz48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+JXM8L2E+PC9saT4nLCBhY3RpdmUsIHBhZ2UpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHBhZ2VOdW1iZXIucHVzaCgnPC91bD48L3NwYW4+Jyk7XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2godGhpcy5vcHRpb25zLmZvcm1hdFJlY29yZHNQZXJQYWdlKHBhZ2VOdW1iZXIuam9pbignJykpKTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3NwYW4+Jyk7XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PicsXHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInB1bGwtJyArIHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uSEFsaWduICsgJyBwYWdpbmF0aW9uXCI+JyxcclxuICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJwYWdpbmF0aW9uJyArIHNwcmludGYoJyBwYWdpbmF0aW9uLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArICdcIj4nLFxyXG4gICAgICAgICAgICAgICAgJzxsaSBjbGFzcz1cInBhZ2UtcHJlXCI+PGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPicgKyB0aGlzLm9wdGlvbnMucGFnaW5hdGlvblByZVRleHQgKyAnPC9hPjwvbGk+Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzIDwgNSkge1xyXG4gICAgICAgICAgICAgICAgZnJvbSA9IDE7XHJcbiAgICAgICAgICAgICAgICB0byA9IHRoaXMudG90YWxQYWdlcztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZyb20gPSB0aGlzLm9wdGlvbnMucGFnZU51bWJlciAtIDI7XHJcbiAgICAgICAgICAgICAgICB0byA9IGZyb20gKyA0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyb20gPCAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSA1O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRvID4gdGhpcy50b3RhbFBhZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSB0aGlzLnRvdGFsUGFnZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IHRvIC0gNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcyA+PSA2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPj0gMykge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwicGFnZS1maXJzdCcgKyAoMSA9PT0gdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPyAnIGFjdGl2ZScgOiAnJykgKyAnXCI+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4nLCAxLCAnPC9hPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xpPicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmcm9tKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID49IDQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPT0gNCB8fCB0aGlzLnRvdGFsUGFnZXMgPT0gNiB8fCB0aGlzLnRvdGFsUGFnZXMgPT0gNykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tLS07XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJwYWdlLWZpcnN0LXNlcGFyYXRvciBkaXNhYmxlZFwiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPi4uLjwvYT4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0by0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID49IDcpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA+PSAodGhpcy50b3RhbFBhZ2VzIC0gMikpIHtcclxuICAgICAgICAgICAgICAgICAgICBmcm9tLS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPT0gNikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID49ICh0aGlzLnRvdGFsUGFnZXMgLSAyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRvKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy50b3RhbFBhZ2VzID49IDcpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPT0gNyB8fCB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA+PSAodGhpcy50b3RhbFBhZ2VzIC0gMykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0bysrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSBmcm9tOyBpIDw9IHRvOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwicGFnZS1udW1iZXInICsgKGkgPT09IHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID8gJyBhY3RpdmUnIDogJycpICsgJ1wiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4nLCBpLCAnPC9hPicsXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPj0gOCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyIDw9ICh0aGlzLnRvdGFsUGFnZXMgLSA0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwicGFnZS1sYXN0LXNlcGFyYXRvciBkaXNhYmxlZFwiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+Li4uPC9hPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID49IDYpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA8PSAodGhpcy50b3RhbFBhZ2VzIC0gMykpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cInBhZ2UtbGFzdCcgKyAodGhpcy50b3RhbFBhZ2VzID09PSB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA/ICcgYWN0aXZlJyA6ICcnKSArICdcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPicsIHRoaXMudG90YWxQYWdlcywgJzwvYT4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9saT4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgJzxsaSBjbGFzcz1cInBhZ2UtbmV4dFwiPjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4nICsgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25OZXh0VGV4dCArICc8L2E+PC9saT4nLFxyXG4gICAgICAgICAgICAgICAgJzwvdWw+JyxcclxuICAgICAgICAgICAgICAgICc8L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy4kcGFnaW5hdGlvbi5odG1sKGh0bWwuam9pbignJykpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5vbmx5SW5mb1BhZ2luYXRpb24pIHtcclxuICAgICAgICAgICAgJHBhZ2VMaXN0ID0gdGhpcy4kcGFnaW5hdGlvbi5maW5kKCcucGFnZS1saXN0IGEnKTtcclxuICAgICAgICAgICAgJGZpcnN0ID0gdGhpcy4kcGFnaW5hdGlvbi5maW5kKCcucGFnZS1maXJzdCcpO1xyXG4gICAgICAgICAgICAkcHJlID0gdGhpcy4kcGFnaW5hdGlvbi5maW5kKCcucGFnZS1wcmUnKTtcclxuICAgICAgICAgICAgJG5leHQgPSB0aGlzLiRwYWdpbmF0aW9uLmZpbmQoJy5wYWdlLW5leHQnKTtcclxuICAgICAgICAgICAgJGxhc3QgPSB0aGlzLiRwYWdpbmF0aW9uLmZpbmQoJy5wYWdlLWxhc3QnKTtcclxuICAgICAgICAgICAgJG51bWJlciA9IHRoaXMuJHBhZ2luYXRpb24uZmluZCgnLnBhZ2UtbnVtYmVyJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNtYXJ0RGlzcGxheSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcyA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcGFnaW5hdGlvbi5maW5kKCdkaXYucGFnaW5hdGlvbicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwYWdlTGlzdC5sZW5ndGggPCAyIHx8IHRoaXMub3B0aW9ucy50b3RhbFJvd3MgPD0gcGFnZUxpc3RbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRwYWdpbmF0aW9uLmZpbmQoJ3NwYW4ucGFnZS1saXN0JykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHdoZW4gZGF0YSBpcyBlbXB0eSwgaGlkZSB0aGUgcGFnaW5hdGlvblxyXG4gICAgICAgICAgICAgICAgdGhpcy4kcGFnaW5hdGlvblt0aGlzLmdldERhdGEoKS5sZW5ndGggPyAnc2hvdycgOiAnaGlkZSddKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCRhbGxTZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VTaXplID0gdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkcGFnZUxpc3Qub2ZmKCdjbGljaycpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2VMaXN0Q2hhbmdlLCB0aGlzKSk7XHJcbiAgICAgICAgICAgICRmaXJzdC5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnZUZpcnN0LCB0aGlzKSk7XHJcbiAgICAgICAgICAgICRwcmUub2ZmKCdjbGljaycpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2VQcmUsIHRoaXMpKTtcclxuICAgICAgICAgICAgJG5leHQub2ZmKCdjbGljaycpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2VOZXh0LCB0aGlzKSk7XHJcbiAgICAgICAgICAgICRsYXN0Lm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdlTGFzdCwgdGhpcykpO1xyXG4gICAgICAgICAgICAkbnVtYmVyLm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdlTnVtYmVyLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudXBkYXRlUGFnaW5hdGlvbiA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIC8vIEZpeCAjMTcxOiBJRSBkaXNhYmxlZCBidXR0b24gY2FuIGJlIGNsaWNrZWQgYnVnLlxyXG4gICAgICAgIGlmIChldmVudCAmJiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCdkaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLm1haW50YWluU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNldFJvd3MoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpZGVQYWdpbmF0aW9uID09PSAnc2VydmVyJykge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRTZXJ2ZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3BhZ2UtY2hhbmdlJywgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIsIHRoaXMub3B0aW9ucy5wYWdlU2l6ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblBhZ2VMaXN0Q2hhbmdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gJChldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgJHRoaXMucGFyZW50KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5wYWdlU2l6ZSA9ICR0aGlzLnRleHQoKS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpLnRvVXBwZXJDYXNlKCkgP1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpIDogKyR0aGlzLnRleHQoKTtcclxuICAgICAgICB0aGlzLiR0b29sYmFyLmZpbmQoJy5wYWdlLXNpemUnKS50ZXh0KHRoaXMub3B0aW9ucy5wYWdlU2l6ZSk7XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbihldmVudCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblBhZ2VGaXJzdCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gMTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oZXZlbnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUub25QYWdlUHJlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCh0aGlzLm9wdGlvbnMucGFnZU51bWJlciAtIDEpID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gdGhpcy5vcHRpb25zLnRvdGFsUGFnZXM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXItLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKGV2ZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm9uUGFnZU5leHQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyICsgMSkgPiB0aGlzLm9wdGlvbnMudG90YWxQYWdlcykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IDE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKGV2ZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm9uUGFnZUxhc3QgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IHRoaXMudG90YWxQYWdlcztcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oZXZlbnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUub25QYWdlTnVtYmVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID09PSArJChldmVudC5jdXJyZW50VGFyZ2V0KS50ZXh0KCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9ICskKGV2ZW50LmN1cnJlbnRUYXJnZXQpLnRleHQoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oZXZlbnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdEJvZHkgPSBmdW5jdGlvbiAoZml4ZWRTY3JvbGwpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGh0bWwgPSBbXSxcclxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuZ2V0RGF0YSgpO1xyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3ByZS1ib2R5JywgZGF0YSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJvZHkgPSB0aGlzLiRlbC5maW5kKCc+dGJvZHknKTtcclxuICAgICAgICBpZiAoIXRoaXMuJGJvZHkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGJvZHkgPSAkKCc8dGJvZHk+PC90Ym9keT4nKS5hcHBlbmRUbyh0aGlzLiRlbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0ZpeCAjMzg5IEJvb3RzdHJhcC10YWJsZS1mbGF0SlNPTiBpcyBub3Qgd29ya2luZ1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5wYWdpbmF0aW9uIHx8IHRoaXMub3B0aW9ucy5zaWRlUGFnaW5hdGlvbiA9PT0gJ3NlcnZlcicpIHtcclxuICAgICAgICAgICAgdGhpcy5wYWdlRnJvbSA9IDE7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZVRvID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5wYWdlRnJvbSAtIDE7IGkgPCB0aGlzLnBhZ2VUbzsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXksXHJcbiAgICAgICAgICAgICAgICBpdGVtID0gZGF0YVtpXSxcclxuICAgICAgICAgICAgICAgIHN0eWxlID0ge30sXHJcbiAgICAgICAgICAgICAgICBjc3NlcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgZGF0YV8gPSAnJyxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcclxuICAgICAgICAgICAgICAgIGh0bWxBdHRyaWJ1dGVzID0gW107XHJcblxyXG4gICAgICAgICAgICBzdHlsZSA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLnJvd1N0eWxlLCBbaXRlbSwgaV0sIHN0eWxlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdHlsZSAmJiBzdHlsZS5jc3MpIHtcclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHN0eWxlLmNzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzc2VzLnB1c2goa2V5ICsgJzogJyArIHN0eWxlLmNzc1trZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYXR0cmlidXRlcyA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKHRoaXMub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yb3dBdHRyaWJ1dGVzLCBbaXRlbSwgaV0sIGF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sQXR0cmlidXRlcy5wdXNoKHNwcmludGYoJyVzPVwiJXNcIicsIGtleSwgZXNjYXBlSFRNTChhdHRyaWJ1dGVzW2tleV0pKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpdGVtLl9kYXRhICYmICEkLmlzRW1wdHlPYmplY3QoaXRlbS5fZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICQuZWFjaChpdGVtLl9kYXRhLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBkYXRhLWluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgPT09ICdpbmRleCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkYXRhXyArPSBzcHJpbnRmKCcgZGF0YS0lcz1cIiVzXCInLCBrLCB2KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx0cicsXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCcgJXMnLCBodG1sQXR0cmlidXRlcy5qb2luKCcgJykpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignIGlkPVwiJXNcIicsICQuaXNBcnJheShpdGVtKSA/IHVuZGVmaW5lZCA6IGl0ZW0uX2lkKSxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJyBjbGFzcz1cIiVzXCInLCBzdHlsZS5jbGFzc2VzIHx8ICgkLmlzQXJyYXkoaXRlbSkgPyB1bmRlZmluZWQgOiBpdGVtLl9jbGFzcykpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignIGRhdGEtaW5kZXg9XCIlc1wiJywgaSksXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCcgZGF0YS11bmlxdWVpZD1cIiVzXCInLCBpdGVtW3RoaXMub3B0aW9ucy51bmlxdWVJZF0pLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignJXMnLCBkYXRhXyksXHJcbiAgICAgICAgICAgICAgICAnPidcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8dGQgY29sc3Bhbj1cIiVzXCI+PGRpdiBjbGFzcz1cImNhcmQtdmlld3NcIj4nLCB0aGlzLmhlYWRlci5maWVsZHMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNhcmRWaWV3ICYmIHRoaXMub3B0aW9ucy5kZXRhaWxWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0ZD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICc8YSBjbGFzcz1cImRldGFpbC1pY29uXCIgaHJlZj1cImphdmFzY3JpcHQ6XCI+JyxcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCc8aSBjbGFzcz1cIiVzICVzXCI+PC9pPicsIHRoaXMub3B0aW9ucy5pY29uc1ByZWZpeCwgdGhpcy5vcHRpb25zLmljb25zLmRldGFpbE9wZW4pLFxyXG4gICAgICAgICAgICAgICAgICAgICc8L2E+JyxcclxuICAgICAgICAgICAgICAgICAgICAnPC90ZD4nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJC5lYWNoKHRoaXMuaGVhZGVyLmZpZWxkcywgZnVuY3Rpb24gKGosIGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZ2V0SXRlbUZpZWxkKGl0ZW0sIGZpZWxkLCB0aGF0Lm9wdGlvbnMuZXNjYXBlKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbFN0eWxlID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWRfID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NfID0gdGhhdC5oZWFkZXIuY2xhc3Nlc1tqXSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhXyA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvd3NwYW5fID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sc3Bhbl8gPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZV8gPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICBjb2x1bW4gPSB0aGF0LmNvbHVtbnNbal07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuZnJvbUh0bWwgJiYgdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbHVtbi52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgIWNvbHVtbi5jYXJkVmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzdHlsZSA9IHNwcmludGYoJ3N0eWxlPVwiJXNcIicsIGNzc2VzLmNvbmNhdCh0aGF0LmhlYWRlci5zdHlsZXNbal0pLmpvaW4oJzsgJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0ZCdzIGlkIGFuZCBjbGFzc1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1bJ18nICsgZmllbGQgKyAnX2lkJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZF8gPSBzcHJpbnRmKCcgaWQ9XCIlc1wiJywgaXRlbVsnXycgKyBmaWVsZCArICdfaWQnXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVsnXycgKyBmaWVsZCArICdfY2xhc3MnXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzXyA9IHNwcmludGYoJyBjbGFzcz1cIiVzXCInLCBpdGVtWydfJyArIGZpZWxkICsgJ19jbGFzcyddKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpdGVtWydfJyArIGZpZWxkICsgJ19yb3dzcGFuJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dzcGFuXyA9IHNwcmludGYoJyByb3dzcGFuPVwiJXNcIicsIGl0ZW1bJ18nICsgZmllbGQgKyAnX3Jvd3NwYW4nXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVsnXycgKyBmaWVsZCArICdfY29sc3BhbiddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sc3Bhbl8gPSBzcHJpbnRmKCcgY29sc3Bhbj1cIiVzXCInLCBpdGVtWydfJyArIGZpZWxkICsgJ19jb2xzcGFuJ10pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1bJ18nICsgZmllbGQgKyAnX3RpdGxlJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZV8gPSBzcHJpbnRmKCcgdGl0bGU9XCIlc1wiJywgaXRlbVsnXycgKyBmaWVsZCArICdfdGl0bGUnXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjZWxsU3R5bGUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGF0LmhlYWRlcixcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5jZWxsU3R5bGVzW2pdLCBbdmFsdWUsIGl0ZW0sIGksIGZpZWxkXSwgY2VsbFN0eWxlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsU3R5bGUuY2xhc3Nlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzXyA9IHNwcmludGYoJyBjbGFzcz1cIiVzXCInLCBjZWxsU3R5bGUuY2xhc3Nlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFN0eWxlLmNzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjc3Nlc18gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2VsbFN0eWxlLmNzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc3Nlc18ucHVzaChrZXkgKyAnOiAnICsgY2VsbFN0eWxlLmNzc1trZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUgPSBzcHJpbnRmKCdzdHlsZT1cIiVzXCInLCBjc3Nlc18uY29uY2F0KHRoYXQuaGVhZGVyLnN0eWxlc1tqXSkuam9pbignOyAnKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZShjb2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuZm9ybWF0dGVyc1tqXSwgW3ZhbHVlLCBpdGVtLCBpXSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpdGVtWydfJyArIGZpZWxkICsgJ19kYXRhJ10gJiYgISQuaXNFbXB0eU9iamVjdChpdGVtWydfJyArIGZpZWxkICsgJ19kYXRhJ10pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGl0ZW1bJ18nICsgZmllbGQgKyAnX2RhdGEnXSwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlIGRhdGEtaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGsgPT09ICdpbmRleCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhXyArPSBzcHJpbnRmKCcgZGF0YS0lcz1cIiVzXCInLCBrLCB2KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLmNoZWNrYm94IHx8IGNvbHVtbi5yYWRpbykge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBjb2x1bW4uY2hlY2tib3ggPyAnY2hlY2tib3gnIDogdHlwZTtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gY29sdW1uLnJhZGlvID8gJ3JhZGlvJyA6IHR5cGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBbc3ByaW50Zih0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNhcmQtdmlldyAlc1wiPicgOiAnPHRkIGNsYXNzPVwiYnMtY2hlY2tib3ggJXNcIj4nLCBjb2x1bW5bJ2NsYXNzJ10gfHwgJycpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBkYXRhLWluZGV4PVwiJXNcIicsIGkpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIG5hbWU9XCIlc1wiJywgdGhhdC5vcHRpb25zLnNlbGVjdEl0ZW1OYW1lKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyB0eXBlPVwiJXNcIicsIHR5cGUpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIHZhbHVlPVwiJXNcIicsIGl0ZW1bdGhhdC5vcHRpb25zLmlkRmllbGRdKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBjaGVja2VkPVwiJXNcIicsIHZhbHVlID09PSB0cnVlIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh2YWx1ZSAmJiB2YWx1ZS5jaGVja2VkKSA/ICdjaGVja2VkJyA6IHVuZGVmaW5lZCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgZGlzYWJsZWQ9XCIlc1wiJywgIWNvbHVtbi5jaGVja2JveEVuYWJsZWQgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlICYmIHZhbHVlLmRpc2FibGVkKSA/ICdkaXNhYmxlZCcgOiB1bmRlZmluZWQpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJyAvPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLmZvcm1hdHRlcnNbal0gJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQub3B0aW9ucy5jYXJkVmlldyA/ICc8L2Rpdj4nIDogJzwvdGQ+J1xyXG4gICAgICAgICAgICAgICAgICAgIF0uam9pbignJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1bdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF0gPSB2YWx1ZSA9PT0gdHJ1ZSB8fCAodmFsdWUgJiYgdmFsdWUuY2hlY2tlZCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyB8fCB2YWx1ZSA9PT0gbnVsbCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQub3B0aW9ucy51bmRlZmluZWRUZXh0IDogdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSB0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgPyBbJzxkaXYgY2xhc3M9XCJjYXJkLXZpZXdcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm9wdGlvbnMuc2hvd0hlYWRlciA/IHNwcmludGYoJzxzcGFuIGNsYXNzPVwidGl0bGVcIiAlcz4lczwvc3Bhbj4nLCBzdHlsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFByb3BlcnR5RnJvbU90aGVyKHRoYXQuY29sdW1ucywgJ2ZpZWxkJywgJ3RpdGxlJywgZmllbGQpKSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCc8c3BhbiBjbGFzcz1cInZhbHVlXCI+JXM8L3NwYW4+JywgdmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgIF0uam9pbignJykgOiBbc3ByaW50ZignPHRkJXMgJXMgJXMgJXMgJXMgJXMgJXM+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRfLCBjbGFzc18sIHN0eWxlLCBkYXRhXywgcm93c3Bhbl8sIGNvbHNwYW5fLCB0aXRsZV8pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGQ+J1xyXG4gICAgICAgICAgICAgICAgICAgIF0uam9pbignJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEhpZGUgZW1wdHkgZGF0YSBvbiBDYXJkIHZpZXcgd2hlbiBzbWFydERpc3BsYXkgaXMgc2V0IHRvIHRydWUuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5jYXJkVmlldyAmJiB0aGF0Lm9wdGlvbnMuc21hcnREaXNwbGF5ICYmIHZhbHVlID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG91bGQgc2V0IGEgcGxhY2Vob2xkZXIgZm9yIGV2ZW50IGJpbmRpbmcgY29ycmVjdCBmaWVsZEluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSAnPGRpdiBjbGFzcz1cImNhcmQtdmlld1wiPjwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0ZXh0KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PjwvdGQ+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPC90cj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNob3cgbm8gcmVjb3Jkc1xyXG4gICAgICAgIGlmICghaHRtbC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHIgY2xhc3M9XCJuby1yZWNvcmRzLWZvdW5kXCI+JyxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJzx0ZCBjb2xzcGFuPVwiJXNcIj4lczwvdGQ+JyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndGgnKS5sZW5ndGgsIHRoaXMub3B0aW9ucy5mb3JtYXROb01hdGNoZXMoKSksXHJcbiAgICAgICAgICAgICAgICAnPC90cj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGJvZHkuaHRtbChodG1sLmpvaW4oJycpKTtcclxuXHJcbiAgICAgICAgaWYgKCFmaXhlZFNjcm9sbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvKDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY2xpY2sgdG8gc2VsZWN0IGJ5IGNvbHVtblxyXG4gICAgICAgIHRoaXMuJGJvZHkuZmluZCgnPiB0cltkYXRhLWluZGV4XSA+IHRkJykub2ZmKCdjbGljayBkYmxjbGljaycpLm9uKCdjbGljayBkYmxjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgJHRyID0gJHRkLnBhcmVudCgpLFxyXG4gICAgICAgICAgICAgICAgaXRlbSA9IHRoYXQuZGF0YVskdHIuZGF0YSgnaW5kZXgnKV0sXHJcbiAgICAgICAgICAgICAgICBpbmRleCA9ICR0ZFswXS5jZWxsSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBmaWVsZHMgPSB0aGF0LmdldFZpc2libGVGaWVsZHMoKSxcclxuICAgICAgICAgICAgICAgIGZpZWxkID0gZmllbGRzW3RoYXQub3B0aW9ucy5kZXRhaWxWaWV3ICYmICF0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgPyBpbmRleCAtIDEgOiBpbmRleF0sXHJcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSB0aGF0LmNvbHVtbnNbZ2V0RmllbGRJbmRleCh0aGF0LmNvbHVtbnMsIGZpZWxkKV0sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGdldEl0ZW1GaWVsZChpdGVtLCBmaWVsZCwgdGhhdC5vcHRpb25zLmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoJHRkLmZpbmQoJy5kZXRhaWwtaWNvbicpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoZS50eXBlID09PSAnY2xpY2snID8gJ2NsaWNrLWNlbGwnIDogJ2RibC1jbGljay1jZWxsJywgZmllbGQsIHZhbHVlLCBpdGVtLCAkdGQpO1xyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoZS50eXBlID09PSAnY2xpY2snID8gJ2NsaWNrLXJvdycgOiAnZGJsLWNsaWNrLXJvdycsIGl0ZW0sICR0ciwgZmllbGQpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgY2xpY2sgdG8gc2VsZWN0IC0gdGhlbiB0cmlnZ2VyIHRoZSBjaGVja2JveC9yYWRpbyBjbGlja1xyXG4gICAgICAgICAgICBpZiAoZS50eXBlID09PSAnY2xpY2snICYmIHRoYXQub3B0aW9ucy5jbGlja1RvU2VsZWN0ICYmIGNvbHVtbi5jbGlja1RvU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHNlbGVjdEl0ZW0gPSAkdHIuZmluZChzcHJpbnRmKCdbbmFtZT1cIiVzXCJdJywgdGhhdC5vcHRpb25zLnNlbGVjdEl0ZW1OYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNlbGVjdEl0ZW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNlbGVjdEl0ZW1bMF0uY2xpY2soKTsgLy8gIzE0NDogLnRyaWdnZXIoJ2NsaWNrJykgYnVnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kYm9keS5maW5kKCc+IHRyW2RhdGEtaW5kZXhdID4gdGQgPiAuZGV0YWlsLWljb24nKS5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgJHRyID0gJHRoaXMucGFyZW50KCkucGFyZW50KCksXHJcbiAgICAgICAgICAgICAgICBpbmRleCA9ICR0ci5kYXRhKCdpbmRleCcpLFxyXG4gICAgICAgICAgICAgICAgcm93ID0gZGF0YVtpbmRleF07IC8vIEZpeCAjOTgwIERldGFpbCB2aWV3LCB3aGVuIHNlYXJjaGluZywgcmV0dXJucyB3cm9uZyByb3dcclxuXHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBhbmQgdXBkYXRlXHJcbiAgICAgICAgICAgIGlmICgkdHIubmV4dCgpLmlzKCd0ci5kZXRhaWwtdmlldycpKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5maW5kKCdpJykuYXR0cignY2xhc3MnLCBzcHJpbnRmKCclcyAlcycsIHRoYXQub3B0aW9ucy5pY29uc1ByZWZpeCwgdGhhdC5vcHRpb25zLmljb25zLmRldGFpbE9wZW4pKTtcclxuICAgICAgICAgICAgICAgICR0ci5uZXh0KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2NvbGxhcHNlLXJvdycsIGluZGV4LCByb3cpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHRoaXMuZmluZCgnaScpLmF0dHIoJ2NsYXNzJywgc3ByaW50ZignJXMgJXMnLCB0aGF0Lm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoYXQub3B0aW9ucy5pY29ucy5kZXRhaWxDbG9zZSkpO1xyXG4gICAgICAgICAgICAgICAgJHRyLmFmdGVyKHNwcmludGYoJzx0ciBjbGFzcz1cImRldGFpbC12aWV3XCI+PHRkIGNvbHNwYW49XCIlc1wiPjwvdGQ+PC90cj4nLCAkdHIuZmluZCgndGQnKS5sZW5ndGgpKTtcclxuICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICR0ci5uZXh0KCkuZmluZCgndGQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUodGhhdC5vcHRpb25zLCB0aGF0Lm9wdGlvbnMuZGV0YWlsRm9ybWF0dGVyLCBbaW5kZXgsIHJvdywgJGVsZW1lbnRdLCAnJyk7XHJcbiAgICAgICAgICAgICAgICBpZigkZWxlbWVudC5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkZWxlbWVudC5hcHBlbmQoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2V4cGFuZC1yb3cnLCBpbmRleCwgcm93LCAkZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC5yZXNldFZpZXcoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kc2VsZWN0SXRlbSA9IHRoaXMuJGJvZHkuZmluZChzcHJpbnRmKCdbbmFtZT1cIiVzXCJdJywgdGhpcy5vcHRpb25zLnNlbGVjdEl0ZW1OYW1lKSk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0SXRlbS5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkdGhpcy5wcm9wKCdjaGVja2VkJyksXHJcbiAgICAgICAgICAgICAgICByb3cgPSB0aGF0LmRhdGFbJHRoaXMuZGF0YSgnaW5kZXgnKV07XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLm1haW50YWluU2VsZWN0ZWQgJiYgJCh0aGlzKS5pcygnOnJhZGlvJykpIHtcclxuICAgICAgICAgICAgICAgICQuZWFjaCh0aGF0Lm9wdGlvbnMuZGF0YSwgZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvd1t0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJvd1t0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXSA9IGNoZWNrZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLnNpbmdsZVNlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC4kc2VsZWN0SXRlbS5ub3QodGhpcykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhWyQodGhpcykuZGF0YSgnaW5kZXgnKV1bdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhhdC4kc2VsZWN0SXRlbS5maWx0ZXIoJzpjaGVja2VkJykubm90KHRoaXMpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoYXQudXBkYXRlU2VsZWN0ZWQoKTtcclxuICAgICAgICAgICAgdGhhdC50cmlnZ2VyKGNoZWNrZWQgPyAnY2hlY2snIDogJ3VuY2hlY2snLCByb3csICR0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMuaGVhZGVyLmV2ZW50cywgZnVuY3Rpb24gKGksIGV2ZW50cykge1xyXG4gICAgICAgICAgICBpZiAoIWV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGZpeCBidWcsIGlmIGV2ZW50cyBpcyBkZWZpbmVkIHdpdGggbmFtZXNwYWNlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXZlbnRzID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRzID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUobnVsbCwgZXZlbnRzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpZWxkID0gdGhhdC5oZWFkZXIuZmllbGRzW2ldLFxyXG4gICAgICAgICAgICAgICAgZmllbGRJbmRleCA9ICQuaW5BcnJheShmaWVsZCwgdGhhdC5nZXRWaXNpYmxlRmllbGRzKCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5kZXRhaWxWaWV3ICYmICF0aGF0Lm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkSW5kZXggKz0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgdGhhdC4kYm9keS5maW5kKCc+dHI6bm90KC5uby1yZWNvcmRzLWZvdW5kKScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdHIgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGQgPSAkdHIuZmluZCh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgPyAnLmNhcmQtdmlldycgOiAndGQnKS5lcShmaWVsZEluZGV4KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBrZXkuaW5kZXhPZignICcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0ga2V5LnN1YnN0cmluZygwLCBpbmRleCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsID0ga2V5LnN1YnN0cmluZyhpbmRleCArIDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jID0gZXZlbnRzW2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICR0ZC5maW5kKGVsKS5vZmYobmFtZSkub24obmFtZSwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gJHRyLmRhdGEoJ2luZGV4JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cgPSB0aGF0LmRhdGFbaW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByb3dbZmllbGRdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseSh0aGlzLCBbZSwgdmFsdWUsIHJvdywgaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWQoKTtcclxuICAgICAgICB0aGlzLnJlc2V0VmlldygpO1xyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3Bvc3QtYm9keScsIGRhdGEpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFNlcnZlciA9IGZ1bmN0aW9uIChzaWxlbnQsIHF1ZXJ5LCB1cmwpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7fSxcclxuICAgICAgICAgICAgcGFyYW1zID0ge1xyXG4gICAgICAgICAgICAgICAgc2VhcmNoVGV4dDogdGhpcy5zZWFyY2hUZXh0LFxyXG4gICAgICAgICAgICAgICAgc29ydE5hbWU6IHRoaXMub3B0aW9ucy5zb3J0TmFtZSxcclxuICAgICAgICAgICAgICAgIHNvcnRPcmRlcjogdGhpcy5vcHRpb25zLnNvcnRPcmRlclxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1ZXN0O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2luYXRpb24pIHtcclxuICAgICAgICAgICAgcGFyYW1zLnBhZ2VTaXplID0gdGhpcy5vcHRpb25zLnBhZ2VTaXplID09PSB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpID9cclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50b3RhbFJvd3MgOiB0aGlzLm9wdGlvbnMucGFnZVNpemU7XHJcbiAgICAgICAgICAgIHBhcmFtcy5wYWdlTnVtYmVyID0gdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISh1cmwgfHwgdGhpcy5vcHRpb25zLnVybCkgJiYgIXRoaXMub3B0aW9ucy5hamF4KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucXVlcnlQYXJhbXNUeXBlID09PSAnbGltaXQnKSB7XHJcbiAgICAgICAgICAgIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgIHNlYXJjaDogcGFyYW1zLnNlYXJjaFRleHQsXHJcbiAgICAgICAgICAgICAgICBzb3J0OiBwYXJhbXMuc29ydE5hbWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogcGFyYW1zLnNvcnRPcmRlclxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbXMub2Zmc2V0ID0gdGhpcy5vcHRpb25zLnBhZ2VTaXplID09PSB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpID9cclxuICAgICAgICAgICAgICAgICAgICAwIDogdGhpcy5vcHRpb25zLnBhZ2VTaXplICogKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyIC0gMSk7XHJcbiAgICAgICAgICAgICAgICBwYXJhbXMubGltaXQgPSB0aGlzLm9wdGlvbnMucGFnZVNpemUgPT09IHRoaXMub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCkgP1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50b3RhbFJvd3MgOiB0aGlzLm9wdGlvbnMucGFnZVNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghKCQuaXNFbXB0eU9iamVjdCh0aGlzLmZpbHRlckNvbHVtbnNQYXJ0aWFsKSkpIHtcclxuICAgICAgICAgICAgcGFyYW1zLmZpbHRlciA9IEpTT04uc3RyaW5naWZ5KHRoaXMuZmlsdGVyQ29sdW1uc1BhcnRpYWwsIG51bGwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF0YSA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLnF1ZXJ5UGFyYW1zLCBbcGFyYW1zXSwgZGF0YSk7XHJcblxyXG4gICAgICAgICQuZXh0ZW5kKGRhdGEsIHF1ZXJ5IHx8IHt9KTtcclxuXHJcbiAgICAgICAgLy8gZmFsc2UgdG8gc3RvcCByZXF1ZXN0XHJcbiAgICAgICAgaWYgKGRhdGEgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZy5zaG93KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlcXVlc3QgPSAkLmV4dGVuZCh7fSwgY2FsY3VsYXRlT2JqZWN0VmFsdWUobnVsbCwgdGhpcy5vcHRpb25zLmFqYXhPcHRpb25zKSwge1xyXG4gICAgICAgICAgICB0eXBlOiB0aGlzLm9wdGlvbnMubWV0aG9kLFxyXG4gICAgICAgICAgICB1cmw6ICB1cmwgfHwgdGhpcy5vcHRpb25zLnVybCxcclxuICAgICAgICAgICAgZGF0YTogdGhpcy5vcHRpb25zLmNvbnRlbnRUeXBlID09PSAnYXBwbGljYXRpb24vanNvbicgJiYgdGhpcy5vcHRpb25zLm1ldGhvZCA9PT0gJ3Bvc3QnID8gSlNPTi5zdHJpbmdpZnkoZGF0YSkgOiBkYXRhLFxyXG4gICAgICAgICAgICBjYWNoZTogdGhpcy5vcHRpb25zLmNhY2hlLFxyXG4gICAgICAgICAgICAvL2NvbnRlbnRUeXBlOiB0aGlzLm9wdGlvbnMuY29udGVudFR5cGUsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiB0aGlzLm9wdGlvbnMuZGF0YVR5cGUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXMpIHtcclxuXHRcdFx0XHRpZiAocmVzLmNvbnRlbnQpIHtcclxuXHRcdFx0XHRcdHJlcyA9IHJlcy5jb250ZW50XHJcblx0XHRcdFx0fVxyXG4gICAgICAgICAgICAgICAgcmVzID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUodGhhdC5vcHRpb25zLCB0aGF0Lm9wdGlvbnMucmVzcG9uc2VIYW5kbGVyLCBbcmVzXSwgcmVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmxvYWQocmVzKTtcclxuICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcignbG9hZC1zdWNjZXNzJywgcmVzKTtcclxuICAgICAgICAgICAgICAgIGlmICghc2lsZW50KSB0aGF0LiR0YWJsZUxvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKCdsb2FkLWVycm9yJywgcmVzLnN0YXR1cywgcmVzKTtcclxuICAgICAgICAgICAgICAgIGlmICghc2lsZW50KSB0aGF0LiR0YWJsZUxvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWpheCkge1xyXG4gICAgICAgICAgICBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGlzLCB0aGlzLm9wdGlvbnMuYWpheCwgW3JlcXVlc3RdLCBudWxsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5feGhyICYmIHRoaXMuX3hoci5yZWFkeVN0YXRlICE9PSA0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl94aHIuYWJvcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl94aHIgPSAkLmFqYXgocmVxdWVzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFNlYXJjaFRleHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZWFyY2gpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZWFyY2hUZXh0ICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgdmFyICRzZWFyY2ggPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5zZWFyY2ggaW5wdXQnKTtcclxuICAgICAgICAgICAgICAgICRzZWFyY2gudmFsKHRoaXMub3B0aW9ucy5zZWFyY2hUZXh0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25TZWFyY2goe2N1cnJlbnRUYXJnZXQ6ICRzZWFyY2h9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmdldENhcmV0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMuJGhlYWRlci5maW5kKCd0aCcpLCBmdW5jdGlvbiAoaSwgdGgpIHtcclxuICAgICAgICAgICAgJCh0aCkuZmluZCgnLnNvcnRhYmxlJykucmVtb3ZlQ2xhc3MoJ2Rlc2MgYXNjJykuYWRkQ2xhc3MoJCh0aCkuZGF0YSgnZmllbGQnKSA9PT0gdGhhdC5vcHRpb25zLnNvcnROYW1lID8gdGhhdC5vcHRpb25zLnNvcnRPcmRlciA6ICdib3RoJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51cGRhdGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY2hlY2tBbGwgPSB0aGlzLiRzZWxlY3RJdGVtLmZpbHRlcignOmVuYWJsZWQnKS5sZW5ndGggJiZcclxuICAgICAgICAgICAgdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoJzplbmFibGVkJykubGVuZ3RoID09PVxyXG4gICAgICAgICAgICB0aGlzLiRzZWxlY3RJdGVtLmZpbHRlcignOmVuYWJsZWQnKS5maWx0ZXIoJzpjaGVja2VkJykubGVuZ3RoO1xyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RBbGwuYWRkKHRoaXMuJHNlbGVjdEFsbF8pLnByb3AoJ2NoZWNrZWQnLCBjaGVja0FsbCk7XHJcblxyXG4gICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0uZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuY2xvc2VzdCgndHInKVskKHRoaXMpLnByb3AoJ2NoZWNrZWQnKSA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnXSgnc2VsZWN0ZWQnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnVwZGF0ZVJvd3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RJdGVtLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGF0LmRhdGFbJCh0aGlzKS5kYXRhKCdpbmRleCcpXVt0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXSA9ICQodGhpcykucHJvcCgnY2hlY2tlZCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVzZXRSb3dzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMuZGF0YSwgZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICB0aGF0LiRzZWxlY3RBbGwucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICAgICAgdGhhdC4kc2VsZWN0SXRlbS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgICAgICBpZiAodGhhdC5oZWFkZXIuc3RhdGVGaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgcm93W3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuXHJcbiAgICAgICAgbmFtZSArPSAnLmJzLnRhYmxlJztcclxuICAgICAgICB0aGlzLm9wdGlvbnNbQm9vdHN0cmFwVGFibGUuRVZFTlRTW25hbWVdXS5hcHBseSh0aGlzLm9wdGlvbnMsIGFyZ3MpO1xyXG4gICAgICAgIHRoaXMuJGVsLnRyaWdnZXIoJC5FdmVudChuYW1lKSwgYXJncyk7XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5vbkFsbChuYW1lLCBhcmdzKTtcclxuICAgICAgICB0aGlzLiRlbC50cmlnZ2VyKCQuRXZlbnQoJ2FsbC5icy50YWJsZScpLCBbbmFtZSwgYXJnc10pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVzZXRIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gZml4ICM2MTogdGhlIGhpZGRlbiB0YWJsZSByZXNldCBoZWFkZXIgYnVnLlxyXG4gICAgICAgIC8vIGZpeCBidWc6IGdldCAkZWwuY3NzKCd3aWR0aCcpIGVycm9yIHNvbWV0aW1lIChoZWlnaHQgPSA1MDApXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkXyk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0SWRfID0gc2V0VGltZW91dCgkLnByb3h5KHRoaXMuZml0SGVhZGVyLCB0aGlzKSwgdGhpcy4kZWwuaXMoJzpoaWRkZW4nKSA/IDEwMCA6IDApO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZml0SGVhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgZml4ZWRCb2R5LFxyXG4gICAgICAgICAgICBzY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgZm9jdXNlZCxcclxuICAgICAgICAgICAgZm9jdXNlZFRlbXA7XHJcblxyXG4gICAgICAgIGlmICh0aGF0LiRlbC5pcygnOmhpZGRlbicpKSB7XHJcbiAgICAgICAgICAgIHRoYXQudGltZW91dElkXyA9IHNldFRpbWVvdXQoJC5wcm94eSh0aGF0LmZpdEhlYWRlciwgdGhhdCksIDEwMCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZml4ZWRCb2R5ID0gdGhpcy4kdGFibGVCb2R5LmdldCgwKTtcclxuXHJcbiAgICAgICAgc2Nyb2xsV2lkdGggPSBmaXhlZEJvZHkuc2Nyb2xsV2lkdGggPiBmaXhlZEJvZHkuY2xpZW50V2lkdGggJiZcclxuICAgICAgICBmaXhlZEJvZHkuc2Nyb2xsSGVpZ2h0ID4gZml4ZWRCb2R5LmNsaWVudEhlaWdodCArIHRoaXMuJGhlYWRlci5vdXRlckhlaWdodCgpID9cclxuICAgICAgICAgICAgZ2V0U2Nyb2xsQmFyV2lkdGgoKSA6IDA7XHJcblxyXG4gICAgICAgIHRoaXMuJGVsLmNzcygnbWFyZ2luLXRvcCcsIC10aGlzLiRoZWFkZXIub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgICAgIGZvY3VzZWQgPSAkKCc6Zm9jdXMnKTtcclxuICAgICAgICBpZiAoZm9jdXNlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGggPSBmb2N1c2VkLnBhcmVudHMoJ3RoJyk7XHJcbiAgICAgICAgICAgIGlmICgkdGgubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGFGaWVsZCA9ICR0aC5hdHRyKCdkYXRhLWZpZWxkJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YUZpZWxkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGhlYWRlclRoID0gdGhpcy4kaGVhZGVyLmZpbmQoXCJbZGF0YS1maWVsZD0nXCIgKyBkYXRhRmllbGQgKyBcIiddXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkaGVhZGVyVGgubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaGVhZGVyVGguZmluZChcIjppbnB1dFwiKS5hZGRDbGFzcyhcImZvY3VzLXRlbXBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRoZWFkZXJfID0gdGhpcy4kaGVhZGVyLmNsb25lKHRydWUsIHRydWUpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdEFsbF8gPSB0aGlzLiRoZWFkZXJfLmZpbmQoJ1tuYW1lPVwiYnRTZWxlY3RBbGxcIl0nKTtcclxuICAgICAgICB0aGlzLiR0YWJsZUhlYWRlci5jc3Moe1xyXG4gICAgICAgICAgICAnbWFyZ2luLXJpZ2h0Jzogc2Nyb2xsV2lkdGhcclxuICAgICAgICB9KS5maW5kKCd0YWJsZScpLmNzcygnd2lkdGgnLCB0aGlzLiRlbC5vdXRlcldpZHRoKCkpXHJcbiAgICAgICAgICAgIC5odG1sKCcnKS5hdHRyKCdjbGFzcycsIHRoaXMuJGVsLmF0dHIoJ2NsYXNzJykpXHJcbiAgICAgICAgICAgIC5hcHBlbmQodGhpcy4kaGVhZGVyXyk7XHJcblxyXG5cclxuICAgICAgICBmb2N1c2VkVGVtcCA9ICQoJy5mb2N1cy10ZW1wOnZpc2libGU6ZXEoMCknKTtcclxuICAgICAgICBpZiAoZm9jdXNlZFRlbXAubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb2N1c2VkVGVtcC5mb2N1cygpO1xyXG4gICAgICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgnLmZvY3VzLXRlbXAnKS5yZW1vdmVDbGFzcygnZm9jdXMtdGVtcCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZml4IGJ1ZzogJC5kYXRhKCkgaXMgbm90IHdvcmtpbmcgYXMgZXhwZWN0ZWQgYWZ0ZXIgJC5hcHBlbmQoKVxyXG4gICAgICAgIHRoaXMuJGhlYWRlci5maW5kKCd0aFtkYXRhLWZpZWxkXScpLmVhY2goZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgdGhhdC4kaGVhZGVyXy5maW5kKHNwcmludGYoJ3RoW2RhdGEtZmllbGQ9XCIlc1wiXScsICQodGhpcykuZGF0YSgnZmllbGQnKSkpLmRhdGEoJCh0aGlzKS5kYXRhKCkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgdmlzaWJsZUZpZWxkcyA9IHRoaXMuZ2V0VmlzaWJsZUZpZWxkcygpLFxyXG4gICAgICAgICAgICAkdGhzID0gdGhpcy4kaGVhZGVyXy5maW5kKCd0aCcpO1xyXG5cclxuICAgICAgICB0aGlzLiRib2R5LmZpbmQoJz50cjpmaXJzdC1jaGlsZDpub3QoLm5vLXJlY29yZHMtZm91bmQpID4gKicpLmVhY2goZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuZGV0YWlsVmlldyAmJiAhdGhhdC5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuJGhlYWRlcl8uZmluZCgndGguZGV0YWlsJykuZmluZCgnLmZodC1jZWxsJykud2lkdGgoJHRoaXMuaW5uZXJXaWR0aCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGluZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciAkdGggPSB0aGF0LiRoZWFkZXJfLmZpbmQoc3ByaW50ZigndGhbZGF0YS1maWVsZD1cIiVzXCJdJywgdmlzaWJsZUZpZWxkc1tpbmRleF0pKTtcclxuICAgICAgICAgICAgaWYgKCR0aC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAkdGggPSAkKCR0aHNbJHRoaXNbMF0uY2VsbEluZGV4XSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICR0aC5maW5kKCcuZmh0LWNlbGwnKS53aWR0aCgkdGhpcy5pbm5lcldpZHRoKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGhvcml6b250YWwgc2Nyb2xsIGV2ZW50XHJcbiAgICAgICAgLy8gVE9ETzogaXQncyBwcm9iYWJseSBiZXR0ZXIgaW1wcm92aW5nIHRoZSBsYXlvdXQgdGhhbiBiaW5kaW5nIHRvIHNjcm9sbCBldmVudFxyXG4gICAgICAgIHRoaXMuJHRhYmxlQm9keS5vZmYoJ3Njcm9sbCcpLm9uKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQuJHRhYmxlSGVhZGVyLnNjcm9sbExlZnQoJCh0aGlzKS5zY3JvbGxMZWZ0KCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zaG93Rm9vdGVyICYmICF0aGF0Lm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuJHRhYmxlRm9vdGVyLnNjcm9sbExlZnQoJCh0aGlzKS5zY3JvbGxMZWZ0KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhhdC50cmlnZ2VyKCdwb3N0LWhlYWRlcicpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVzZXRGb290ZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0gdGhhdC5nZXREYXRhKCksXHJcbiAgICAgICAgICAgIGh0bWwgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hvd0Zvb3RlciB8fCB0aGlzLm9wdGlvbnMuY2FyZFZpZXcpIHsgLy9kbyBub3RoaW5nXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNhcmRWaWV3ICYmIHRoaXMub3B0aW9ucy5kZXRhaWxWaWV3KSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPHRkPjxkaXYgY2xhc3M9XCJ0aC1pbm5lclwiPiZuYnNwOzwvZGl2PjxkaXYgY2xhc3M9XCJmaHQtY2VsbFwiPjwvZGl2PjwvdGQ+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkLmVhY2godGhpcy5jb2x1bW5zLCBmdW5jdGlvbiAoaSwgY29sdW1uKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXksXHJcbiAgICAgICAgICAgICAgICBmYWxpZ24gPSAnJywgLy8gZm9vdGVyIGFsaWduIHN0eWxlXHJcbiAgICAgICAgICAgICAgICB2YWxpZ24gPSAnJyxcclxuICAgICAgICAgICAgICAgIGNzc2VzID0gW10sXHJcbiAgICAgICAgICAgICAgICBzdHlsZSA9IHt9LFxyXG4gICAgICAgICAgICAgICAgY2xhc3NfID0gc3ByaW50ZignIGNsYXNzPVwiJXNcIicsIGNvbHVtblsnY2xhc3MnXSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbHVtbi52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgKCFjb2x1bW4uY2FyZFZpc2libGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZhbGlnbiA9IHNwcmludGYoJ3RleHQtYWxpZ246ICVzOyAnLCBjb2x1bW4uZmFsaWduID8gY29sdW1uLmZhbGlnbiA6IGNvbHVtbi5hbGlnbik7XHJcbiAgICAgICAgICAgIHZhbGlnbiA9IHNwcmludGYoJ3ZlcnRpY2FsLWFsaWduOiAlczsgJywgY29sdW1uLnZhbGlnbik7XHJcblxyXG4gICAgICAgICAgICBzdHlsZSA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKG51bGwsIHRoYXQub3B0aW9ucy5mb290ZXJTdHlsZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3R5bGUgJiYgc3R5bGUuY3NzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBzdHlsZS5jc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBjc3Nlcy5wdXNoKGtleSArICc6ICcgKyBzdHlsZS5jc3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPHRkJywgY2xhc3NfLCBzcHJpbnRmKCcgc3R5bGU9XCIlc1wiJywgZmFsaWduICsgdmFsaWduICsgY3NzZXMuY29uY2F0KCkuam9pbignOyAnKSksICc+Jyk7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGRpdiBjbGFzcz1cInRoLWlubmVyXCI+Jyk7XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goY2FsY3VsYXRlT2JqZWN0VmFsdWUoY29sdW1uLCBjb2x1bW4uZm9vdGVyRm9ybWF0dGVyLCBbZGF0YV0sICcmbmJzcDsnKSB8fCAnJm5ic3A7Jyk7XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzxkaXYgY2xhc3M9XCJmaHQtY2VsbFwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzwvdGQ+Jyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYmxlRm9vdGVyLmZpbmQoJ3RyJykuaHRtbChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICB0aGlzLiR0YWJsZUZvb3Rlci5zaG93KCk7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dEZvb3Rlcl8pO1xyXG4gICAgICAgIHRoaXMudGltZW91dEZvb3Rlcl8gPSBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5maXRGb290ZXIsIHRoaXMpLFxyXG4gICAgICAgICAgICB0aGlzLiRlbC5pcygnOmhpZGRlbicpID8gMTAwIDogMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5maXRGb290ZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAkZm9vdGVyVGQsXHJcbiAgICAgICAgICAgIGVsV2lkdGgsXHJcbiAgICAgICAgICAgIHNjcm9sbFdpZHRoO1xyXG5cclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0Rm9vdGVyXyk7XHJcbiAgICAgICAgaWYgKHRoaXMuJGVsLmlzKCc6aGlkZGVuJykpIHtcclxuICAgICAgICAgICAgdGhpcy50aW1lb3V0Rm9vdGVyXyA9IHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmZpdEZvb3RlciwgdGhpcyksIDEwMCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsV2lkdGggPSB0aGlzLiRlbC5jc3MoJ3dpZHRoJyk7XHJcbiAgICAgICAgc2Nyb2xsV2lkdGggPSBlbFdpZHRoID4gdGhpcy4kdGFibGVCb2R5LndpZHRoKCkgPyBnZXRTY3JvbGxCYXJXaWR0aCgpIDogMDtcclxuXHJcbiAgICAgICAgdGhpcy4kdGFibGVGb290ZXIuY3NzKHtcclxuICAgICAgICAgICAgJ21hcmdpbi1yaWdodCc6IHNjcm9sbFdpZHRoXHJcbiAgICAgICAgfSkuZmluZCgndGFibGUnKS5jc3MoJ3dpZHRoJywgZWxXaWR0aClcclxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgdGhpcy4kZWwuYXR0cignY2xhc3MnKSk7XHJcblxyXG4gICAgICAgICRmb290ZXJUZCA9IHRoaXMuJHRhYmxlRm9vdGVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJvZHkuZmluZCgnPnRyOmZpcnN0LWNoaWxkOm5vdCgubm8tcmVjb3Jkcy1mb3VuZCkgPiAqJykuZWFjaChmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgJGZvb3RlclRkLmVxKGkpLmZpbmQoJy5maHQtY2VsbCcpLndpZHRoKCR0aGlzLmlubmVyV2lkdGgoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS50b2dnbGVDb2x1bW4gPSBmdW5jdGlvbiAoaW5kZXgsIGNoZWNrZWQsIG5lZWRVcGRhdGUpIHtcclxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zW2luZGV4XS52aXNpYmxlID0gY2hlY2tlZDtcclxuICAgICAgICB0aGlzLmluaXRIZWFkZXIoKTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dDb2x1bW5zKSB7XHJcbiAgICAgICAgICAgIHZhciAkaXRlbXMgPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5rZWVwLW9wZW4gaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZWVkVXBkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAkaXRlbXMuZmlsdGVyKHNwcmludGYoJ1t2YWx1ZT1cIiVzXCJdJywgaW5kZXgpKS5wcm9wKCdjaGVja2VkJywgY2hlY2tlZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICgkaXRlbXMuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aCA8PSB0aGlzLm9wdGlvbnMubWluaW11bUNvdW50Q29sdW1ucykge1xyXG4gICAgICAgICAgICAgICAgJGl0ZW1zLmZpbHRlcignOmNoZWNrZWQnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudG9nZ2xlUm93ID0gZnVuY3Rpb24gKGluZGV4LCB1bmlxdWVJZCwgdmlzaWJsZSkge1xyXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy4kYm9keS5maW5kKHR5cGVvZiBpbmRleCAhPT0gJ3VuZGVmaW5lZCcgP1xyXG4gICAgICAgICAgICBzcHJpbnRmKCd0cltkYXRhLWluZGV4PVwiJXNcIl0nLCBpbmRleCkgOlxyXG4gICAgICAgICAgICBzcHJpbnRmKCd0cltkYXRhLXVuaXF1ZWlkPVwiJXNcIl0nLCB1bmlxdWVJZCkpXHJcbiAgICAgICAgICAgIFt2aXNpYmxlID8gJ3Nob3cnIDogJ2hpZGUnXSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0VmlzaWJsZUZpZWxkcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIHZpc2libGVGaWVsZHMgPSBbXTtcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMuaGVhZGVyLmZpZWxkcywgZnVuY3Rpb24gKGosIGZpZWxkKSB7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW4gPSB0aGF0LmNvbHVtbnNbZ2V0RmllbGRJbmRleCh0aGF0LmNvbHVtbnMsIGZpZWxkKV07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbHVtbi52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmlzaWJsZUZpZWxkcy5wdXNoKGZpZWxkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdmlzaWJsZUZpZWxkcztcclxuICAgIH07XHJcblxyXG4gICAgLy8gUFVCTElDIEZVTkNUSU9OIERFRklOSVRJT05cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlc2V0VmlldyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICB2YXIgcGFkZGluZyA9IDA7XHJcblxyXG4gICAgICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gcGFyYW1zLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJHNlbGVjdEFsbC5wcm9wKCdjaGVja2VkJywgdGhpcy4kc2VsZWN0SXRlbS5sZW5ndGggPiAwICYmXHJcbiAgICAgICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0ubGVuZ3RoID09PSB0aGlzLiRzZWxlY3RJdGVtLmZpbHRlcignOmNoZWNrZWQnKS5sZW5ndGgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhlaWdodCkge1xyXG4gICAgICAgICAgICB2YXIgdG9vbGJhckhlaWdodCA9IGdldFJlYWxIZWlnaHQodGhpcy4kdG9vbGJhciksXHJcbiAgICAgICAgICAgICAgICBwYWdpbmF0aW9uSGVpZ2h0ID0gZ2V0UmVhbEhlaWdodCh0aGlzLiRwYWdpbmF0aW9uKSxcclxuICAgICAgICAgICAgICAgIGhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHQgLSB0b29sYmFySGVpZ2h0IC0gcGFnaW5hdGlvbkhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlQ29udGFpbmVyLmNzcygnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgZWxlbWVudCBjc3NcclxuICAgICAgICAgICAgdGhpcy4kZWwuY3NzKCdtYXJnaW4tdG9wJywgJzAnKTtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVDb250YWluZXIuY3NzKCdwYWRkaW5nLWJvdHRvbScsICcwJyk7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlRm9vdGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93SGVhZGVyICYmIHRoaXMub3B0aW9ucy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIuc2hvdygpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0SGVhZGVyKCk7XHJcbiAgICAgICAgICAgIHBhZGRpbmcgKz0gdGhpcy4kaGVhZGVyLm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ3Bvc3QtaGVhZGVyJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dGb290ZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNldEZvb3RlcigpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcGFkZGluZyArPSB0aGlzLiR0YWJsZUZvb3Rlci5vdXRlckhlaWdodCgpICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXNzaWduIHRoZSBjb3JyZWN0IHNvcnRhYmxlIGFycm93XHJcbiAgICAgICAgdGhpcy5nZXRDYXJldCgpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlQ29udGFpbmVyLmNzcygncGFkZGluZy1ib3R0b20nLCBwYWRkaW5nICsgJ3B4Jyk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdyZXNldC12aWV3Jyk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKHVzZUN1cnJlbnRQYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnNlYXJjaFRleHQgfHwgISQuaXNFbXB0eU9iamVjdCh0aGlzLmZpbHRlckNvbHVtbnMpIHx8ICEkLmlzRW1wdHlPYmplY3QodGhpcy5maWx0ZXJDb2x1bW5zUGFydGlhbCkpID9cclxuICAgICAgICAgICAgKHVzZUN1cnJlbnRQYWdlID8gdGhpcy5kYXRhLnNsaWNlKHRoaXMucGFnZUZyb20gLSAxLCB0aGlzLnBhZ2VUbykgOiB0aGlzLmRhdGEpIDpcclxuICAgICAgICAgICAgKHVzZUN1cnJlbnRQYWdlID8gdGhpcy5vcHRpb25zLmRhdGEuc2xpY2UodGhpcy5wYWdlRnJvbSAtIDEsIHRoaXMucGFnZVRvKSA6IHRoaXMub3B0aW9ucy5kYXRhKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHZhciBmaXhlZFNjcm9sbCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyAjNDMxOiBzdXBwb3J0IHBhZ2luYXRpb25cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpZGVQYWdpbmF0aW9uID09PSAnc2VydmVyJykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudG90YWxSb3dzID0gZGF0YS50b3RhbDtcclxuICAgICAgICAgICAgZml4ZWRTY3JvbGwgPSBkYXRhLmZpeGVkU2Nyb2xsO1xyXG4gICAgICAgICAgICBkYXRhID0gZGF0YVt0aGlzLm9wdGlvbnMuZGF0YUZpZWxkXTtcclxuICAgICAgICB9IGVsc2UgaWYgKCEkLmlzQXJyYXkoZGF0YSkpIHsgLy8gc3VwcG9ydCBmaXhlZFNjcm9sbFxyXG4gICAgICAgICAgICBmaXhlZFNjcm9sbCA9IGRhdGEuZml4ZWRTY3JvbGw7XHJcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLmRhdGE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmluaXREYXRhKGRhdGEpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KGZpeGVkU2Nyb2xsKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5pbml0RGF0YShkYXRhLCAnYXBwZW5kJyk7XHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucHJlcGVuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5pbml0RGF0YShkYXRhLCAncHJlcGVuZCcpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRTb3J0KCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICB2YXIgbGVuID0gdGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBpLCByb3c7XHJcblxyXG4gICAgICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KCdmaWVsZCcpIHx8ICFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ3ZhbHVlcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHJvdyA9IHRoaXMub3B0aW9ucy5kYXRhW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFyb3cuaGFzT3duUHJvcGVydHkocGFyYW1zLmZpZWxkKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShyb3dbcGFyYW1zLmZpZWxkXSwgcGFyYW1zLnZhbHVlcykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGF0YS5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsZW4gPT09IHRoaXMub3B0aW9ucy5kYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kYXRhLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRhdGEuc3BsaWNlKDAsIHRoaXMub3B0aW9ucy5kYXRhLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0Um93QnlVbmlxdWVJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciB1bmlxdWVJZCA9IHRoaXMub3B0aW9ucy51bmlxdWVJZCxcclxuICAgICAgICAgICAgbGVuID0gdGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBkYXRhUm93ID0gbnVsbCxcclxuICAgICAgICAgICAgaSwgcm93LCByb3dVbmlxdWVJZDtcclxuXHJcbiAgICAgICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgcm93ID0gdGhpcy5vcHRpb25zLmRhdGFbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAocm93Lmhhc093blByb3BlcnR5KHVuaXF1ZUlkKSkgeyAvLyB1bmlxdWVJZCBpcyBhIGNvbHVtblxyXG4gICAgICAgICAgICAgICAgcm93VW5pcXVlSWQgPSByb3dbdW5pcXVlSWRdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYocm93Ll9kYXRhLmhhc093blByb3BlcnR5KHVuaXF1ZUlkKSkgeyAvLyB1bmlxdWVJZCBpcyBhIHJvdyBkYXRhIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICByb3dVbmlxdWVJZCA9IHJvdy5fZGF0YVt1bmlxdWVJZF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByb3dVbmlxdWVJZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGlkID0gaWQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygcm93VW5pcXVlSWQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKE51bWJlcihyb3dVbmlxdWVJZCkgPT09IHJvd1VuaXF1ZUlkKSAmJiAocm93VW5pcXVlSWQgJSAxID09PSAwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gcGFyc2VJbnQoaWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocm93VW5pcXVlSWQgPT09IE51bWJlcihyb3dVbmlxdWVJZCkpICYmIChyb3dVbmlxdWVJZCAhPT0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZCA9IHBhcnNlRmxvYXQoaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocm93VW5pcXVlSWQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhUm93ID0gcm93O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkYXRhUm93O1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVtb3ZlQnlVbmlxdWVJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBsZW4gPSB0aGlzLm9wdGlvbnMuZGF0YS5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJvdyA9IHRoaXMuZ2V0Um93QnlVbmlxdWVJZChpZCk7XHJcblxyXG4gICAgICAgIGlmIChyb3cpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRhdGEuc3BsaWNlKHRoaXMub3B0aW9ucy5kYXRhLmluZGV4T2Yocm93KSwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGVuID09PSB0aGlzLm9wdGlvbnMuZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51cGRhdGVCeVVuaXF1ZUlkID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgYWxsUGFyYW1zID0gJC5pc0FycmF5KHBhcmFtcykgPyBwYXJhbXMgOiBbIHBhcmFtcyBdO1xyXG5cclxuICAgICAgICAkLmVhY2goYWxsUGFyYW1zLCBmdW5jdGlvbihpLCBwYXJhbXMpIHtcclxuICAgICAgICAgICAgdmFyIHJvd0lkO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2lkJykgfHwgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgncm93JykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcm93SWQgPSAkLmluQXJyYXkodGhhdC5nZXRSb3dCeVVuaXF1ZUlkKHBhcmFtcy5pZCksIHRoYXQub3B0aW9ucy5kYXRhKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3dJZCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmV4dGVuZCh0aGF0Lm9wdGlvbnMuZGF0YVtyb3dJZF0sIHBhcmFtcy5yb3cpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRTb3J0KCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluc2VydFJvdyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICBpZiAoIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnaW5kZXgnKSB8fCAhcGFyYW1zLmhhc093blByb3BlcnR5KCdyb3cnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5zcGxpY2UocGFyYW1zLmluZGV4LCAwLCBwYXJhbXMucm93KTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51cGRhdGVSb3cgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBhbGxQYXJhbXMgPSAkLmlzQXJyYXkocGFyYW1zKSA/IHBhcmFtcyA6IFsgcGFyYW1zIF07XHJcblxyXG4gICAgICAgICQuZWFjaChhbGxQYXJhbXMsIGZ1bmN0aW9uKGksIHBhcmFtcykge1xyXG4gICAgICAgICAgICBpZiAoIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnaW5kZXgnKSB8fCAhcGFyYW1zLmhhc093blByb3BlcnR5KCdyb3cnKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRoYXQub3B0aW9ucy5kYXRhW3BhcmFtcy5pbmRleF0sIHBhcmFtcy5yb3cpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRTb3J0KCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNob3dSb3cgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2luZGV4JykgJiYgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgndW5pcXVlSWQnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudG9nZ2xlUm93KHBhcmFtcy5pbmRleCwgcGFyYW1zLnVuaXF1ZUlkLCB0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmhpZGVSb3cgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2luZGV4JykgJiYgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgndW5pcXVlSWQnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudG9nZ2xlUm93KHBhcmFtcy5pbmRleCwgcGFyYW1zLnVuaXF1ZUlkLCBmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRSb3dzSGlkZGVuID0gZnVuY3Rpb24gKHNob3cpIHtcclxuICAgICAgICB2YXIgcm93cyA9ICQodGhpcy4kYm9keVswXSkuY2hpbGRyZW4oKS5maWx0ZXIoJzpoaWRkZW4nKSxcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgaWYgKHNob3cpIHtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCByb3dzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAkKHJvd3NbaV0pLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcm93cztcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm1lcmdlQ2VsbHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIHZhciByb3cgPSBvcHRpb25zLmluZGV4LFxyXG4gICAgICAgICAgICBjb2wgPSAkLmluQXJyYXkob3B0aW9ucy5maWVsZCwgdGhpcy5nZXRWaXNpYmxlRmllbGRzKCkpLFxyXG4gICAgICAgICAgICByb3dzcGFuID0gb3B0aW9ucy5yb3dzcGFuIHx8IDEsXHJcbiAgICAgICAgICAgIGNvbHNwYW4gPSBvcHRpb25zLmNvbHNwYW4gfHwgMSxcclxuICAgICAgICAgICAgaSwgaixcclxuICAgICAgICAgICAgJHRyID0gdGhpcy4kYm9keS5maW5kKCc+dHInKSxcclxuICAgICAgICAgICAgJHRkO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRldGFpbFZpZXcgJiYgIXRoaXMub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICBjb2wgKz0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICR0ZCA9ICR0ci5lcShyb3cpLmZpbmQoJz50ZCcpLmVxKGNvbCk7XHJcblxyXG4gICAgICAgIGlmIChyb3cgPCAwIHx8IGNvbCA8IDAgfHwgcm93ID49IHRoaXMuZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpID0gcm93OyBpIDwgcm93ICsgcm93c3BhbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IGNvbDsgaiA8IGNvbCArIGNvbHNwYW47IGorKykge1xyXG4gICAgICAgICAgICAgICAgJHRyLmVxKGkpLmZpbmQoJz50ZCcpLmVxKGopLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHRkLmF0dHIoJ3Jvd3NwYW4nLCByb3dzcGFuKS5hdHRyKCdjb2xzcGFuJywgY29sc3Bhbikuc2hvdygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudXBkYXRlQ2VsbCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICBpZiAoIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnaW5kZXgnKSB8fFxyXG4gICAgICAgICAgICAhcGFyYW1zLmhhc093blByb3BlcnR5KCdmaWVsZCcpIHx8XHJcbiAgICAgICAgICAgICFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ3ZhbHVlJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRhdGFbcGFyYW1zLmluZGV4XVtwYXJhbXMuZmllbGRdID0gcGFyYW1zLnZhbHVlO1xyXG5cclxuICAgICAgICBpZiAocGFyYW1zLnJlaW5pdCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmluaXRTb3J0KCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucztcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmdldFNlbGVjdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gJC5ncmVwKHRoaXMub3B0aW9ucy5kYXRhLCBmdW5jdGlvbiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3dbdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRBbGxTZWxlY3Rpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ3JlcCh0aGlzLm9wdGlvbnMuZGF0YSwgZnVuY3Rpb24gKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gcm93W3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuY2hlY2tBbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5jaGVja0FsbF8odHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51bmNoZWNrQWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY2hlY2tBbGxfKGZhbHNlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrSW52ZXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgcm93cyA9IHRoYXQuJHNlbGVjdEl0ZW0uZmlsdGVyKCc6ZW5hYmxlZCcpO1xyXG4gICAgICAgIHZhciBjaGVja2VkID0gcm93cy5maWx0ZXIoJzpjaGVja2VkJyk7XHJcbiAgICAgICAgcm93cy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCAhJCh0aGlzKS5wcm9wKCdjaGVja2VkJykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQudXBkYXRlUm93cygpO1xyXG4gICAgICAgIHRoYXQudXBkYXRlU2VsZWN0ZWQoKTtcclxuICAgICAgICB0aGF0LnRyaWdnZXIoJ3VuY2hlY2stc29tZScsIGNoZWNrZWQpO1xyXG4gICAgICAgIGNoZWNrZWQgPSB0aGF0LmdldFNlbGVjdGlvbnMoKTtcclxuICAgICAgICB0aGF0LnRyaWdnZXIoJ2NoZWNrLXNvbWUnLCBjaGVja2VkKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrQWxsXyA9IGZ1bmN0aW9uIChjaGVja2VkKSB7XHJcbiAgICAgICAgdmFyIHJvd3M7XHJcbiAgICAgICAgaWYgKCFjaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHJvd3MgPSB0aGlzLmdldFNlbGVjdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0QWxsLmFkZCh0aGlzLiRzZWxlY3RBbGxfKS5wcm9wKCdjaGVja2VkJywgY2hlY2tlZCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoJzplbmFibGVkJykucHJvcCgnY2hlY2tlZCcsIGNoZWNrZWQpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUm93cygpO1xyXG4gICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHJvd3MgPSB0aGlzLmdldFNlbGVjdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKGNoZWNrZWQgPyAnY2hlY2stYWxsJyA6ICd1bmNoZWNrLWFsbCcsIHJvd3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICB0aGlzLmNoZWNrXyh0cnVlLCBpbmRleCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51bmNoZWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5jaGVja18oZmFsc2UsIGluZGV4KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrXyA9IGZ1bmN0aW9uIChjaGVja2VkLCBpbmRleCkge1xyXG4gICAgICAgIHZhciAkZWwgPSB0aGlzLiRzZWxlY3RJdGVtLmZpbHRlcihzcHJpbnRmKCdbZGF0YS1pbmRleD1cIiVzXCJdJywgaW5kZXgpKS5wcm9wKCdjaGVja2VkJywgY2hlY2tlZCk7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4XVt0aGlzLmhlYWRlci5zdGF0ZUZpZWxkXSA9IGNoZWNrZWQ7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZCgpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihjaGVja2VkID8gJ2NoZWNrJyA6ICd1bmNoZWNrJywgdGhpcy5kYXRhW2luZGV4XSwgJGVsKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrQnkgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgdGhpcy5jaGVja0J5Xyh0cnVlLCBvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudW5jaGVja0J5ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHRoaXMuY2hlY2tCeV8oZmFsc2UsIG9iaik7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jaGVja0J5XyA9IGZ1bmN0aW9uIChjaGVja2VkLCBvYmopIHtcclxuICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eSgnZmllbGQnKSB8fCAhb2JqLmhhc093blByb3BlcnR5KCd2YWx1ZXMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIHJvd3MgPSBbXTtcclxuICAgICAgICAkLmVhY2godGhpcy5vcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpbmRleCwgcm93KSB7XHJcbiAgICAgICAgICAgIGlmICghcm93Lmhhc093blByb3BlcnR5KG9iai5maWVsZCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoJC5pbkFycmF5KHJvd1tvYmouZmllbGRdLCBvYmoudmFsdWVzKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkZWwgPSB0aGF0LiRzZWxlY3RJdGVtLmZpbHRlcignOmVuYWJsZWQnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoc3ByaW50ZignW2RhdGEtaW5kZXg9XCIlc1wiXScsIGluZGV4KSkucHJvcCgnY2hlY2tlZCcsIGNoZWNrZWQpO1xyXG4gICAgICAgICAgICAgICAgcm93W3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdID0gY2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIHJvd3MucHVzaChyb3cpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKGNoZWNrZWQgPyAnY2hlY2snIDogJ3VuY2hlY2snLCByb3csICRlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKGNoZWNrZWQgPyAnY2hlY2stc29tZScgOiAndW5jaGVjay1zb21lJywgcm93cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJGVsLmluc2VydEJlZm9yZSh0aGlzLiRjb250YWluZXIpO1xyXG4gICAgICAgICQodGhpcy5vcHRpb25zLnRvb2xiYXIpLmluc2VydEJlZm9yZSh0aGlzLiRlbCk7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLm5leHQoKS5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLiRjb250YWluZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLiRlbF8uaHRtbCgpKVxyXG4gICAgICAgICAgICAuY3NzKCdtYXJnaW4tdG9wJywgJzAnKVxyXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCB0aGlzLiRlbF8uYXR0cignY2xhc3MnKSB8fCAnJyk7IC8vIHJlc2V0IHRoZSBjbGFzc1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuc2hvd0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy4kdGFibGVMb2FkaW5nLnNob3coKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmhpZGVMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZy5oaWRlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS50b2dnbGVQYWdpbmF0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uID0gIXRoaXMub3B0aW9ucy5wYWdpbmF0aW9uO1xyXG4gICAgICAgIHZhciBidXR0b24gPSB0aGlzLiR0b29sYmFyLmZpbmQoJ2J1dHRvbltuYW1lPVwicGFnaW5hdGlvblN3aXRjaFwiXSBpJyk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5hdHRyKFwiY2xhc3NcIiwgdGhpcy5vcHRpb25zLmljb25zUHJlZml4ICsgXCIgXCIgKyB0aGlzLm9wdGlvbnMuaWNvbnMucGFnaW5hdGlvblN3aXRjaERvd24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5hdHRyKFwiY2xhc3NcIiwgdGhpcy5vcHRpb25zLmljb25zUHJlZml4ICsgXCIgXCIgKyB0aGlzLm9wdGlvbnMuaWNvbnMucGFnaW5hdGlvblN3aXRjaFVwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zLnVybCkge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW5pdFNlcnZlcihwYXJhbXMgJiYgcGFyYW1zLnNpbGVudCxcclxuICAgICAgICAgICAgcGFyYW1zICYmIHBhcmFtcy5xdWVyeSwgcGFyYW1zICYmIHBhcmFtcy51cmwpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcigncmVmcmVzaCcsIHBhcmFtcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZXNldFdpZHRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd0hlYWRlciAmJiB0aGlzLm9wdGlvbnMuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZml0SGVhZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd0Zvb3Rlcikge1xyXG4gICAgICAgICAgICB0aGlzLmZpdEZvb3RlcigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNob3dDb2x1bW4gPSBmdW5jdGlvbiAoZmllbGQpIHtcclxuICAgICAgICB0aGlzLnRvZ2dsZUNvbHVtbihnZXRGaWVsZEluZGV4KHRoaXMuY29sdW1ucywgZmllbGQpLCB0cnVlLCB0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmhpZGVDb2x1bW4gPSBmdW5jdGlvbiAoZmllbGQpIHtcclxuICAgICAgICB0aGlzLnRvZ2dsZUNvbHVtbihnZXRGaWVsZEluZGV4KHRoaXMuY29sdW1ucywgZmllbGQpLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRIaWRkZW5Db2x1bW5zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkLmdyZXAodGhpcy5jb2x1bW5zLCBmdW5jdGlvbiAoY29sdW1uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhY29sdW1uLnZpc2libGU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRWaXNpYmxlQ29sdW1ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJC5ncmVwKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGNvbHVtbikge1xyXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uLnZpc2libGU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS50b2dnbGVBbGxDb2x1bW5zID0gZnVuY3Rpb24gKHZpc2libGUpIHtcclxuICAgICAgICAkLmVhY2godGhpcy5jb2x1bW5zLCBmdW5jdGlvbiAoaSwgY29sdW1uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29sdW1uc1tpXS52aXNpYmxlID0gdmlzaWJsZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0SGVhZGVyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkoKTtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dDb2x1bW5zKSB7XHJcbiAgICAgICAgICAgIHZhciAkaXRlbXMgPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5rZWVwLW9wZW4gaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICgkaXRlbXMuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aCA8PSB0aGlzLm9wdGlvbnMubWluaW11bUNvdW50Q29sdW1ucykge1xyXG4gICAgICAgICAgICAgICAgJGl0ZW1zLmZpbHRlcignOmNoZWNrZWQnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuc2hvd0FsbENvbHVtbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVBbGxDb2x1bW5zKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaGlkZUFsbENvbHVtbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVBbGxDb2x1bW5zKGZhbHNlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmZpbHRlckJ5ID0gZnVuY3Rpb24gKGNvbHVtbnMpIHtcclxuICAgICAgICB0aGlzLmZpbHRlckNvbHVtbnMgPSAkLmlzRW1wdHlPYmplY3QoY29sdW1ucykgPyB7fSA6IGNvbHVtbnM7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSAxO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbigpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuc2Nyb2xsVG8gPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlID09PSAnYm90dG9tJyA/IHRoaXMuJHRhYmxlQm9keVswXS5zY3JvbGxIZWlnaHQgOiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUJvZHkuc2Nyb2xsVG9wKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJHRhYmxlQm9keS5zY3JvbGxUb3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRTY3JvbGxQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxUbygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuc2VsZWN0UGFnZSA9IGZ1bmN0aW9uIChwYWdlKSB7XHJcbiAgICAgICAgaWYgKHBhZ2UgPiAwICYmIHBhZ2UgPD0gdGhpcy5vcHRpb25zLnRvdGFsUGFnZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSBwYWdlO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5wcmV2UGFnZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyLS07XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm5leHRQYWdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA8IHRoaXMub3B0aW9ucy50b3RhbFBhZ2VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyKys7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnRvZ2dsZVZpZXcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLmNhcmRWaWV3ID0gIXRoaXMub3B0aW9ucy5jYXJkVmlldztcclxuICAgICAgICB0aGlzLmluaXRIZWFkZXIoKTtcclxuICAgICAgICAvLyBGaXhlZCByZW1vdmUgdG9vbGJhciB3aGVuIGNsaWNrIGNhcmRWaWV3IGJ1dHRvbi5cclxuICAgICAgICAvL3RoYXQuaW5pdFRvb2xiYXIoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd0b2dnbGUnLCB0aGlzLm9wdGlvbnMuY2FyZFZpZXcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVmcmVzaE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vSWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQgdGhlbiBhdm9pZCB0aGUgY2FsbCBvZiBkZXN0cm95IC8gaW5pdCBtZXRob2RzXHJcbiAgICAgICAgaWYgKGNvbXBhcmVPYmplY3RzKHRoaXMub3B0aW9ucywgb3B0aW9ucywgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcigncmVmcmVzaC1vcHRpb25zJywgdGhpcy5vcHRpb25zKTtcclxuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlc2V0U2VhcmNoID0gZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICB2YXIgJHNlYXJjaCA9IHRoaXMuJHRvb2xiYXIuZmluZCgnLnNlYXJjaCBpbnB1dCcpO1xyXG4gICAgICAgICRzZWFyY2gudmFsKHRleHQgfHwgJycpO1xyXG4gICAgICAgIHRoaXMub25TZWFyY2goe2N1cnJlbnRUYXJnZXQ6ICRzZWFyY2h9KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmV4cGFuZFJvd18gPSBmdW5jdGlvbiAoZXhwYW5kLCBpbmRleCkge1xyXG4gICAgICAgIHZhciAkdHIgPSB0aGlzLiRib2R5LmZpbmQoc3ByaW50ZignPiB0cltkYXRhLWluZGV4PVwiJXNcIl0nLCBpbmRleCkpO1xyXG4gICAgICAgIGlmICgkdHIubmV4dCgpLmlzKCd0ci5kZXRhaWwtdmlldycpID09PSAoZXhwYW5kID8gZmFsc2UgOiB0cnVlKSkge1xyXG4gICAgICAgICAgICAkdHIuZmluZCgnPiB0ZCA+IC5kZXRhaWwtaWNvbicpLmNsaWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZXhwYW5kUm93ID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5leHBhbmRSb3dfKHRydWUsIGluZGV4KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNvbGxhcHNlUm93ID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5leHBhbmRSb3dfKGZhbHNlLCBpbmRleCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5leHBhbmRBbGxSb3dzID0gZnVuY3Rpb24gKGlzU3ViVGFibGUpIHtcclxuICAgICAgICBpZiAoaXNTdWJUYWJsZSkge1xyXG4gICAgICAgICAgICB2YXIgJHRyID0gdGhpcy4kYm9keS5maW5kKHNwcmludGYoJz4gdHJbZGF0YS1pbmRleD1cIiVzXCJdJywgMCkpLFxyXG4gICAgICAgICAgICAgICAgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBkZXRhaWxJY29uID0gbnVsbCxcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGVJbnRlcnZhbCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaWRJbnRlcnZhbCA9IC0xO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEkdHIubmV4dCgpLmlzKCd0ci5kZXRhaWwtdmlldycpKSB7XHJcbiAgICAgICAgICAgICAgICAkdHIuZmluZCgnPiB0ZCA+IC5kZXRhaWwtaWNvbicpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICBleGVjdXRlSW50ZXJ2YWwgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEkdHIubmV4dCgpLm5leHQoKS5pcygndHIuZGV0YWlsLXZpZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgJHRyLm5leHQoKS5maW5kKFwiLmRldGFpbC1pY29uXCIpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICBleGVjdXRlSW50ZXJ2YWwgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZXhlY3V0ZUludGVydmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbEljb24gPSB0aGF0LiRib2R5LmZpbmQoXCJ0ci5kZXRhaWwtdmlld1wiKS5sYXN0KCkuZmluZChcIi5kZXRhaWwtaWNvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRldGFpbEljb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsSWNvbi5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpZEludGVydmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGlkSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHRycyA9IHRoaXMuJGJvZHkuY2hpbGRyZW4oKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kUm93Xyh0cnVlLCAkKHRyc1tpXSkuZGF0YShcImluZGV4XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNvbGxhcHNlQWxsUm93cyA9IGZ1bmN0aW9uIChpc1N1YlRhYmxlKSB7XHJcbiAgICAgICAgaWYgKGlzU3ViVGFibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRSb3dfKGZhbHNlLCAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdHJzID0gdGhpcy4kYm9keS5jaGlsZHJlbigpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRSb3dfKGZhbHNlLCAkKHRyc1tpXSkuZGF0YShcImluZGV4XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnVwZGF0ZUZvcm1hdFRleHQgPSBmdW5jdGlvbiAobmFtZSwgdGV4dCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnNbc3ByaW50ZignZm9ybWF0JXMnLCBuYW1lKV0pIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW3NwcmludGYoJ2Zvcm1hdCVzJywgbmFtZSldID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW3NwcmludGYoJ2Zvcm1hdCVzJywgbmFtZSldID0gdGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmluaXRUb29sYmFyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gQk9PVFNUUkFQIFRBQkxFIFBMVUdJTiBERUZJTklUSU9OXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIHZhciBhbGxvd2VkTWV0aG9kcyA9IFtcclxuICAgICAgICAnZ2V0T3B0aW9ucycsXHJcbiAgICAgICAgJ2dldFNlbGVjdGlvbnMnLCAnZ2V0QWxsU2VsZWN0aW9ucycsICdnZXREYXRhJyxcclxuICAgICAgICAnbG9hZCcsICdhcHBlbmQnLCAncHJlcGVuZCcsICdyZW1vdmUnLCAncmVtb3ZlQWxsJyxcclxuICAgICAgICAnaW5zZXJ0Um93JywgJ3VwZGF0ZVJvdycsICd1cGRhdGVDZWxsJywgJ3VwZGF0ZUJ5VW5pcXVlSWQnLCAncmVtb3ZlQnlVbmlxdWVJZCcsXHJcbiAgICAgICAgJ2dldFJvd0J5VW5pcXVlSWQnLCAnc2hvd1JvdycsICdoaWRlUm93JywgJ2dldFJvd3NIaWRkZW4nLFxyXG4gICAgICAgICdtZXJnZUNlbGxzJyxcclxuICAgICAgICAnY2hlY2tBbGwnLCAndW5jaGVja0FsbCcsICdjaGVja0ludmVydCcsXHJcbiAgICAgICAgJ2NoZWNrJywgJ3VuY2hlY2snLFxyXG4gICAgICAgICdjaGVja0J5JywgJ3VuY2hlY2tCeScsXHJcbiAgICAgICAgJ3JlZnJlc2gnLFxyXG4gICAgICAgICdyZXNldFZpZXcnLFxyXG4gICAgICAgICdyZXNldFdpZHRoJyxcclxuICAgICAgICAnZGVzdHJveScsXHJcbiAgICAgICAgJ3Nob3dMb2FkaW5nJywgJ2hpZGVMb2FkaW5nJyxcclxuICAgICAgICAnc2hvd0NvbHVtbicsICdoaWRlQ29sdW1uJywgJ2dldEhpZGRlbkNvbHVtbnMnLCAnZ2V0VmlzaWJsZUNvbHVtbnMnLFxyXG4gICAgICAgICdzaG93QWxsQ29sdW1ucycsICdoaWRlQWxsQ29sdW1ucycsXHJcbiAgICAgICAgJ2ZpbHRlckJ5JyxcclxuICAgICAgICAnc2Nyb2xsVG8nLFxyXG4gICAgICAgICdnZXRTY3JvbGxQb3NpdGlvbicsXHJcbiAgICAgICAgJ3NlbGVjdFBhZ2UnLCAncHJldlBhZ2UnLCAnbmV4dFBhZ2UnLFxyXG4gICAgICAgICd0b2dnbGVQYWdpbmF0aW9uJyxcclxuICAgICAgICAndG9nZ2xlVmlldycsXHJcbiAgICAgICAgJ3JlZnJlc2hPcHRpb25zJyxcclxuICAgICAgICAncmVzZXRTZWFyY2gnLFxyXG4gICAgICAgICdleHBhbmRSb3cnLCAnY29sbGFwc2VSb3cnLCAnZXhwYW5kQWxsUm93cycsICdjb2xsYXBzZUFsbFJvd3MnLFxyXG4gICAgICAgICd1cGRhdGVGb3JtYXRUZXh0J1xyXG4gICAgXTtcclxuXHJcbiAgICAkLmZuLmJvb3RzdHJhcFRhYmxlID0gZnVuY3Rpb24gKG9wdGlvbikge1xyXG4gICAgICAgIHZhciB2YWx1ZSxcclxuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gJHRoaXMuZGF0YSgnYm9vdHN0cmFwLnRhYmxlJyksXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgJiYgb3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheShvcHRpb24sIGFsbG93ZWRNZXRob2RzKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIG1ldGhvZDogXCIgKyBvcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCBhcmdzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uID09PSAnZGVzdHJveScpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5yZW1vdmVEYXRhKCdib290c3RyYXAudGFibGUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5kYXRhKCdib290c3RyYXAudGFibGUnLCAoZGF0YSA9IG5ldyBCb290c3RyYXBUYWJsZSh0aGlzLCBvcHRpb25zKSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnID8gdGhpcyA6IHZhbHVlO1xyXG4gICAgfTtcclxuXHJcbiAgICAkLmZuLmJvb3RzdHJhcFRhYmxlLkNvbnN0cnVjdG9yID0gQm9vdHN0cmFwVGFibGU7XHJcbiAgICAkLmZuLmJvb3RzdHJhcFRhYmxlLmRlZmF1bHRzID0gQm9vdHN0cmFwVGFibGUuREVGQVVMVFM7XHJcbiAgICAkLmZuLmJvb3RzdHJhcFRhYmxlLmNvbHVtbkRlZmF1bHRzID0gQm9vdHN0cmFwVGFibGUuQ09MVU1OX0RFRkFVTFRTO1xyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZS5sb2NhbGVzID0gQm9vdHN0cmFwVGFibGUuTE9DQUxFUztcclxuICAgICQuZm4uYm9vdHN0cmFwVGFibGUubWV0aG9kcyA9IGFsbG93ZWRNZXRob2RzO1xyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZS51dGlscyA9IHtcclxuICAgICAgICBzcHJpbnRmOiBzcHJpbnRmLFxyXG4gICAgICAgIGdldEZpZWxkSW5kZXg6IGdldEZpZWxkSW5kZXgsXHJcbiAgICAgICAgY29tcGFyZU9iamVjdHM6IGNvbXBhcmVPYmplY3RzLFxyXG4gICAgICAgIGNhbGN1bGF0ZU9iamVjdFZhbHVlOiBjYWxjdWxhdGVPYmplY3RWYWx1ZSxcclxuICAgICAgICBnZXRJdGVtRmllbGQ6IGdldEl0ZW1GaWVsZCxcclxuICAgICAgICBvYmplY3RLZXlzOiBvYmplY3RLZXlzLFxyXG4gICAgICAgIGlzSUVCcm93c2VyOiBpc0lFQnJvd3NlclxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBCT09UU1RSQVAgVEFCTEUgSU5JVFxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0YWJsZVwiXScpLmJvb3RzdHJhcFRhYmxlKCk7XHJcbiAgICB9KTtcclxufSkoalF1ZXJ5KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcblx0Ly8g0YHRgtCw0LLQuNC8INC00LXRhNC+0LvRgtC90YvQtSDQvdCw0YHRgtGA0L7QudC60Lgg0LTQu9GPINCw0Y/QutGB0L7QstGL0YUg0YLQsNCx0LvQuNGGINGBINGB0L7RgNGC0LjRgNC+0LLQutC+0Lkg0Lgg0L/RgC5cclxuXHQkLmV4dGVuZCggdHJ1ZSwgJC5mbi5ib290c3RyYXBUYWJsZS5kZWZhdWx0cywge1xyXG5cdFx0aWNvbnNQcmVmaXg6ICdmYScsXHJcblx0XHRpY29uczoge1xyXG5cdFx0XHRwYWdpbmF0aW9uU3dpdGNoRG93bjogJ2ZhLXNvcnQtZGVzYycsXHJcblx0XHRcdHBhZ2luYXRpb25Td2l0Y2hVcDogJ2ZhLXNvcnQtYXNjJyxcclxuXHRcdFx0cmVmcmVzaDogJ2ZhLXJlZnJlc2gnLFxyXG5cdFx0XHR0b2dnbGU6ICdmYS1saXN0LWFsdCcsXHJcblx0XHRcdGNvbHVtbnM6ICdmYS1leWUgbXI1JyxcclxuXHRcdFx0ZGV0YWlsT3BlbjogJ2ZhLXBsdXMtc3F1YXJlLW8nLFxyXG5cdFx0XHRkZXRhaWxDbG9zZTogJ2ZhLW1pbnVzLXNxdWFyZS1vJ1xyXG5cdFx0fSxcclxuXHRcdHBhZ2VTaXplOiAyNSxcclxuXHRcdHBhZ2VMaXN0OiBbMTAsIDI1LCA1MCwgMTAwLCA1MDAsIDEwMDBdLFxyXG5cdFx0c2hvd1JlZnJlc2g6IHRydWUsXHRcdC8vINC+0LHQvdC+0LLQu9C10L3QuNC1XHJcblx0XHRjYWNoZTogZmFsc2UsXHRcdFx0Ly8g0LrQtdGI0LjRgNC+0LLQsNC90LjQtVxyXG5cdFx0c2VhcmNoOiB0cnVlLFx0XHRcdC8vINC/0L7QuNGB0LpcclxuXHRcdHBhZ2luYXRpb246IHRydWUsXHRcdC8vINC/0LDQs9C40L3QsNGG0LjRj1xyXG5cdFx0c2hvd0NvbHVtbnM6IHRydWUsXHRcdC8vINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0YHQutGA0YvQstCw0YLRjCDRgdGC0L7Qu9Cx0YbRi1xyXG5cdFx0bWV0aG9kOiAnUE9TVCcsXHJcblx0XHRxdWVyeVBhcmFtczogZnVuY3Rpb24gKHBhcmFtcykge1xyXG5cdFx0XHR2YXIgcGFyYW0gPSB7fTtcclxuXHRcdFx0XHJcblx0XHRcdHBhcmFtLmJzdGFibGUgPSBwYXJhbXM7XHJcblx0XHRcdC8vcGFyYW0uYnN0YWJsZS5maWx0ZXIgPSBmdW5jX2dldF9mb3JtX3ZhbHMoYnNUb29sYmFyRmlsdGVyKTtcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBwYXJhbTtcclxuXHRcdH1cclxuXHR9ICk7XHJcblx0XHRcclxuXHQvLyBpZiAoYnNUb29sYmFyRmlsdGVyKSB7XHJcblx0Ly8gXHQkLmV4dGVuZCgkLmZuLmJvb3RzdHJhcFRhYmxlLmRlZmF1bHRzLCB7XHJcblx0Ly8gXHRcdHNob3dGaWx0ZXI6IHRydWUsXHJcblx0Ly8gXHRcdHRvb2xiYXI6IHZhcnMuYnNUb29sYmFyLmNsYXNzLFxyXG5cdC8vIFx0XHRzaG93UmVmcmVzaDogZmFsc2VcdFx0Ly8g0L7QsdC90L7QstC70LXQvdC40LVcclxuXHQvLyBcdH0pO1xyXG5cdC8vIH0gZWxzZSB7XHJcblx0Ly8gXHQkLmV4dGVuZCgkLmZuLmJvb3RzdHJhcFRhYmxlLmRlZmF1bHRzLCB7XHJcblx0Ly8gXHRcdHNob3dGaWx0ZXI6IGZhbHNlLFxyXG5cdC8vIFx0XHR0b29sYmFyOiAnJyxcclxuXHQvLyBcdFx0c2hvd1JlZnJlc2g6IHRydWVcdFx0Ly8g0L7QsdC90L7QstC70LXQvdC40LVcclxuXHQvLyBcdH0pO1xyXG5cdC8vIH1cclxufSk7XHJcblxyXG5cclxuXHJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcblx0aWYgKGFkbS4kYnN0YWJsZSgpLmxlbmd0aCA+IDApIHtcclxuXHRcdGFkbS4kYnN0YWJsZSgpLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR2YXIgJGJzdCA9ICQodGhpcyk7XHJcblx0XHRcdGlmICgkYnN0Lmhhc0NsYXNzKCd1c2VyLWxpc3QnKSkge1xyXG5cdFx0XHRcdCRic3QuYm9vdHN0cmFwVGFibGUoe1xyXG5cdFx0XHRcdFx0c2lkZVBhZ2luYXRpb246ICdzZXJ2ZXInLFxyXG5cdFx0XHRcdFx0c29ydE5hbWU6ICdpZCcsXHJcblx0XHRcdFx0XHRzb3J0T3JkZXI6ICdkZXNjJyxcclxuXHRcdFx0XHRcdHNob3dEZWxsOiB0cnVlLFxyXG5cdFx0XHRcdFx0Ly91cmw6IHVybFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0dmFyICR0b29sYmFyID0gJCgnLmZpeGVkLXRhYmxlLXRvb2xiYXInKTtcclxuXHRcdCQoJy5wYWdlLWhlYWRpbmcnKS5hcHBlbmQoJHRvb2xiYXIpO1xyXG5cdFx0XHJcblx0XHRhZG0uJGJzdGFibGUoKS5vbignbG9hZC1zdWNjZXNzLmJzLnRhYmxlJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuXHRcdFx0JCgnW3JlbD1cInRvb2x0aXBcIl0nKS50b29sdGlwKHtcclxuXHRcdFx0XHRjb250YWluZXI6ICdib2R5J1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vXHTRhNGD0L3QutGG0LjQuCDQtNC70Y8gYm9vdHN0cmFwVGFibGVcclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuZnVuY3Rpb24gZm9ybWF0dGVySWQodmFsdWUsIHJvdywgaW5kZXgpIHtcclxuXHRpZiAocm93LmxpbmtzICYmIHJvdy5saW5rcy5lZGl0KSB7XHJcblx0XHR2YWx1ZSA9ICc8YSBocmVmPVwiJyArIHJvdy5saW5rcy5lZGl0ICsgJ1wiPicgKyB2YWx1ZSArICc8L2E+JztcclxuXHR9XHJcblx0cmV0dXJuIHZhbHVlO1xyXG59XHJcbi8qKlxyXG4gKiDRhNC+0YDQvNC40YDRg9C10Lwg0YHQv9C40YHQvtC6INC+0L/QtdGA0LDRhtC40LlcclxuICogQHBhcmFtIHZhbHVlXHJcbiAqIEBwYXJhbSByb3dcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5mdW5jdGlvbiBmb3JtYXR0ZXJBY3Rpb25zKHZhbHVlLCByb3cpIHtcclxuXHRpZiAocm93LmFjdGlvbnMgJiYgcm93LmxpbmtzKSB7XHJcblx0XHR2YWx1ZSA9ICc8ZGl2IGNsYXNzPVwiYnRuLWdyb3VwIGJ0bi1ncm91cC14c1wiPic7XHJcblx0XHQkLmVhY2gocm93LmFjdGlvbnMsIGZ1bmN0aW9uKCBuYW1lLCBsaW5rICkge1xyXG5cdFx0XHRzd2l0Y2ggKG5hbWUpIHtcclxuXHRcdFx0XHRjYXNlICdkZWxldGUnOlxyXG5cdFx0XHRcdFx0dmFsdWUgKz0gJzxhIGhyZWY9XCInICsgbGluayArICdcIiB0aXRsZT1cIicgKyBuYW1lICsgJ1wiIGNsYXNzPVwiYnRuIGJ0bi1kYW5nZXJcIj48aSBjbGFzcz1cImZhIGZhLXRpbWVzXCI+PC9pPjwvYT4nO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnZWRpdCc6XHJcblx0XHRcdFx0XHR2YWx1ZSArPSAnPGEgaHJlZj1cIicgKyBsaW5rICsgJ1wiIHRpdGxlPVwiJyArIG5hbWUgKyAnXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIj48aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiPjwvaT48L2E+JztcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHZhbHVlICs9ICc8L2Rpdj4nXHJcblx0fVxyXG5cdHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuLy8gZnVuY3Rpb24gZnVuY0JTZ2V0SWRTZWxlY3Rpb25zKCkge1xyXG4vLyBcdHJldHVybiAkLm1hcChhZG0uJGJzdGFibGUoKS5ib290c3RyYXBUYWJsZSgnZ2V0U2VsZWN0aW9ucycpLCBmdW5jdGlvbiAocm93KSB7XHJcbi8vIFx0XHRyZXR1cm4gcm93LmlkXHJcbi8vIFx0fSk7XHJcbi8vIH1cclxuXHJcblxyXG4vL3dpbmRvdy5vcGVyYXRlRXZlbnRzID0ge1xyXG4vL1x0J2NsaWNrIC5mdWxsX2luZm9fbG9nc19hZG1pbic6IGZ1bmN0aW9uIChlLCB2YWx1ZSwgcm93LCBpbmRleCkge1xyXG4vL1x0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcbi8vXHRcdHZhciBwYXJhbSA9IFwiJmFjdGlvbj1nZXRfZnVsbF9sb2cmaWQ9XCIrcm93WydpZCddO1xyXG4vL1x0XHRmdW5jX3NlbmRfYWpheChwYXJhbSwgZmFsc2UsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4vL1x0XHRcdHZhciByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNhbGxiYWNrLmJvZHkpKTtcclxuLy9cdFx0XHRmdW5jX25ld19tb2RhbF9zaG93KCdpbmZvJywgcm93Wyd0aXRsZSddLCByZXN1bHQpO1xyXG4vL1x0XHR9KTtcclxuLy9cdH0sXHJcbi8vXHJcbi8vXHJcbi8vXHQnY2xpY2sgLmxpa2UnOiBmdW5jdGlvbiAoZSwgdmFsdWUsIHJvdywgaW5kZXgpIHtcclxuLy9cclxuLy9cdFx0YWxlcnQoJ1lvdSBjbGljayBsaWtlIGljb24sIHJvdzogJyArIEpTT04uc3RyaW5naWZ5KHJvdykpO1xyXG4vL1x0XHRjb25zb2xlLmxvZyh2YWx1ZSwgcm93LCBpbmRleCk7XHJcbi8vXHR9LFxyXG4vL1x0J2NsaWNrIC5lZGl0JzogZnVuY3Rpb24gKGUsIHZhbHVlLCByb3csIGluZGV4KSB7XHJcbi8vXHRcdGFsZXJ0KCdZb3UgY2xpY2sgZWRpdCBpY29uLCByb3c6ICcgKyBKU09OLnN0cmluZ2lmeShyb3cpKTtcclxuLy9cdFx0Y29uc29sZS5sb2codmFsdWUsIHJvdywgaW5kZXgpO1xyXG4vL1x0fSxcclxuLy9cdCdjbGljayAucmVtb3ZlJzogZnVuY3Rpb24gKGUsIHZhbHVlLCByb3csIGluZGV4KSB7XHJcbi8vXHRcdGFsZXJ0KCdZb3UgY2xpY2sgcmVtb3ZlIGljb24sIHJvdzogJyArIEpTT04uc3RyaW5naWZ5KHJvdykpO1xyXG4vL1x0XHRjb25zb2xlLmxvZyh2YWx1ZSwgcm93LCBpbmRleCk7XHJcbi8vXHR9XHJcbi8vfTtcclxuXHJcblxyXG4vKipcclxuICog0KDQtdCw0LTQuNC30LDRhtC40Y8g0YTQuNC70YzRgtGA0L7QsiDQtNC70Y8gYm9vdHN0cmFwVGFibGVcclxuICovXHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cdCd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG5cdCQuZXh0ZW5kKCQuZm4uYm9vdHN0cmFwVGFibGUuZGVmYXVsdHMsIHtcclxuXHRcdHF1ZXJ5UGFyYW1zRmlsdGVyOiBmdW5jdGlvbiAocGFyYW1zKSB7XHJcblx0XHRcdGlmKCQoXCIjdG9vbGJhclwiKS5leGlzdHMoKSkge1xyXG5cdFx0XHRcdHZhciBmaWx0ZXIgPSB7fTtcclxuXHRcdFx0XHQkKCcjdG9vbGJhcicpLmZpbmQoJ2lucHV0W25hbWVdJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRmaWx0ZXJbJCh0aGlzKS5hdHRyKCduYW1lJyldID0gJCh0aGlzKS52YWwoKTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0JCgnI3Rvb2xiYXInKS5maW5kKCdzZWxlY3RbbmFtZV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdHZhciBzdHIgPSAnJztcclxuXHRcdFx0XHRcdCQodGhpcykuY2hpbGRyZW4oJ29wdGlvbjpzZWxlY3RlZCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGlmICgkKHRoaXMpLmxlbmd0aCA+IDAgJiYgJCh0aGlzKS52YWwoKS5sZW5ndGggPiAwICkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChzdHIgIT0gJycpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHN0ciArPSBcIiwgXCI7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdHN0ciArPSBcIidcIiArICQodGhpcykudmFsKCkgKyBcIidcIjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHN0ci5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0XHRcdGZpbHRlclskKHRoaXMpLmF0dHIoJ25hbWUnKV0gPSBzdHI7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRwYXJhbXMuZmlsdGVyID0gZmlsdGVyO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBwYXJhbXM7XHJcblx0XHR9LFxyXG5cdFx0c2hvd0ZpbHRlcjogZmFsc2UsXHJcblx0XHRzaG93UmVmcmVzaDogZmFsc2UsXHJcblx0XHRvbkNsZWFyT3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHJcblx0JC5leHRlbmQoJC5mbi5ib290c3RyYXBUYWJsZS5ldmVudHMsIHtcclxuXHRcdCdjbGVhci1vcHRpb25zLmJzLnRhYmxlJzogJ29uQ2xlYXJPcHRpb25zJ1xyXG5cdH0pO1xyXG5cclxuXHJcblx0dmFyIEJvb3RzdHJhcFRhYmxlID0gJC5mbi5ib290c3RyYXBUYWJsZS5Db25zdHJ1Y3RvcixcclxuXHRcdF9pbml0ID0gQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXQsXHJcblx0XHRfaW5pdFRvb2xiYXIgPSBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFRvb2xiYXI7XHJcblxyXG5cclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUb29sYmFyID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0X2luaXRUb29sYmFyLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpKTtcclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHRcdGlmICh0aGF0Lm9wdGlvbnMuc2hvd0ZpbHRlcikge1xyXG5cdFx0XHR0aGF0LiR0b29sYmFyXHJcblx0XHRcdFx0LmZpbmQoXCIuY29sdW1uc1wiKVxyXG5cdFx0XHRcdC5hcHBlbmQoJycgK1xyXG5cdFx0XHRcdCdcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0IGRyb3Bkb3duLXRvZ2dsZSBidG4tZmlsdGVyXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIGFyaWEtaGFzcG9wdXA9XCJ0cnVlXCIgYXJpYS1leHBhbmRlZD1cInRydWVcIj4nK1xyXG5cdFx0XHRcdCdcdFx0PGkgY2xhc3M9XCJmYSBmYS1maWx0ZXIgbXI1XCI+PC9pPiA8c3BhbiBjbGFzcz1cImNhcmV0XCI+PC9zcGFuPicrXHJcblx0XHRcdFx0J1x0PC9idXR0b24+JytcclxuXHRcdFx0XHQnXHQ8dWwgY2xhc3M9XCJkcm9wZG93bi1tZW51IGZpbHRlci1saXN0XCIgcm9sZT1cIm1lbnVcIj4gPC91bD4nK1xyXG5cdFx0XHRcdCcnKTtcclxuXHRcdFx0dGhhdC4kdG9vbGJhci5kZWxlZ2F0ZSgnYnV0dG9uW25hbWU9XCJyZWZyZXNoXCJdJywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dGhhdC5yZWZyZXNoKCk7XHJcblxyXG5cdFx0XHRcdC8vINCw0L3QuNC80LDRhtC40Y8g0LTQu9GPINC60L3QvtC/0LrQuCDQt9Cw0L/Rg9GB0LrQsCDQvtCx0L3QvtCy0LvQtdC90LjRj1xyXG5cdFx0XHRcdHZhciBidG4gPSAkKHRoaXMpO1xyXG5cdFx0XHRcdGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdGJ0bi5idXR0b24oJ3Jlc2V0JylcclxuXHRcdFx0XHR9LDEwMDAgKVxyXG5cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdH07XHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0X2luaXQuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xyXG5cclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHRcdHRoaXMuaW5pdEZpbHRlckJ1dHRvbigpO1xyXG5cdFx0dGhpcy5pbml0RmlsdGVycygpO1xyXG5cdFx0dGhpcy5pbml0RmlsdGVyU2VsZWN0b3IoKTtcclxuXHJcblx0XHR0aGlzLiRlbC5vbignbG9hZC1zdWNjZXNzLmJzLnRhYmxlJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAodGhhdC5vcHRpb25zLnNob3dGaWx0ZXIpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nICh0aGF0LiR0b29sYmFyKTtcclxuXHRcdFx0XHQvLyQodGhhdC5vcHRpb25zLnRvb2xiYXIpLmJvb3RzdHJhcFRhYmxlRmlsdGVyKHtcclxuXHRcdFx0XHQvL1x0Y29ubmVjdFRvOiB0aGF0LiRlbFxyXG5cdFx0XHRcdC8vfSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdEZpbHRlckJ1dHRvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dGhpcy4kYnV0dG9uID0gdGhpcy4kdG9vbGJhci5maW5kKCcuYnRuLWZpbHRlcicpO1xyXG5cdFx0dGhpcy4kYnV0dG9uTGlzdCA9IHRoaXMuJGJ1dHRvbi5wYXJlbnQoKS5maW5kKCcuZmlsdGVyLWxpc3QnKTtcclxuXHRcdHRoaXMuJGJ1dHRvbi5kcm9wZG93bigpO1xyXG5cdFx0dGhpcy4kZmlsdGVycyA9IHRoaXMuJHRvb2xiYXIuZmluZCgnLmZvcm0tZmlsdGVyJykuZmluZCgnW25hbWVdJyk7XHJcblx0fTtcclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRGaWx0ZXJzID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblx0XHR0aGF0LiRidXR0b25MaXN0LmFwcGVuZCgnPGxpIGNsYXNzPVwicmVtb3ZlLWZpbHRlcnNcIj48YSBjbGFzcz1cImJ0biBidG4tc20gYnRuLWRlZmF1bHQgYnRuLWxhYmVsXCIgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtdGltZXNcIj48L2k+INCe0YfQuNGB0YLQuNGC0Ywg0LLRgdC1INGE0LjQu9GM0YLRgNGLPC9hPjwvbGk+Jyk7XHJcblx0XHR0aGF0LiRidXR0b25MaXN0LmFwcGVuZCgnPGxpIGNsYXNzPVwiZGl2aWRlclwiPjwvbGk+Jyk7XHJcblxyXG5cdFx0JC5lYWNoKHRoaXMuJGZpbHRlcnMsIGZ1bmN0aW9uKGksIGZpbHRlcikge1xyXG5cdFx0XHR0aGF0LmFkZEZpbHRlcihmaWx0ZXIpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGF0LiR0b29sYmFyLmRlbGVnYXRlKCcucmVtb3ZlLWZpbHRlcnMgKicsICdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGF0LmNsZWFyRmlsdGVyVmFsdWUoKTtcclxuXHJcblx0XHRcdCQuZWFjaCh0aGF0LiRmaWx0ZXJzLCBmdW5jdGlvbihpLCBmaWx0ZXIpIHtcclxuXHRcdFx0XHR0aGF0LmRpc2FibGVGaWx0ZXIoJChmaWx0ZXIpLmF0dHIoXCJuYW1lXCIpKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdEZpbHRlclNlbGVjdG9yID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG5cclxuXHRcdHZhciBhcHBseUZpbHRlciA9IGZ1bmN0aW9uKCRjaGNrKSB7XHJcblx0XHRcdHZhciBmaWx0ZXJGaWVsZCA9ICRjaGNrLmNsb3Nlc3QoJ1tkYXRhLWZpbHRlci1maWVsZF0nKS5hdHRyKCdkYXRhLWZpbHRlci1maWVsZCcpO1xyXG5cdFx0XHRpZiAoJGNoY2sucHJvcCgnY2hlY2tlZCcpKSB7XHJcblx0XHRcdFx0dGhhdC5lbmFibGVGaWx0ZXIoZmlsdGVyRmllbGQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dGhhdC5kaXNhYmxlRmlsdGVyKGZpbHRlckZpZWxkKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHRoaXMuJGJ1dHRvbkxpc3QuZGVsZWdhdGUoJ2xpIDppbnB1dFt0eXBlPWNoZWNrYm94XScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0Y29uc29sZS5sb2cgKCckYnV0dG9uTGlzdC5kZWxlZ2F0ZScsJCh0aGlzKSk7XHJcblx0XHRcdGFwcGx5RmlsdGVyKCQodGhpcykpO1xyXG5cdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLiRidXR0b25MaXN0LmRlbGVnYXRlKCdsaSwgbGkgYScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0dmFyICRjaGNrID0gJCgnOmlucHV0W3R5cGU9Y2hlY2tib3hdJywgdGhpcyk7XHJcblx0XHRcdGlmICgkY2hjay5sZW5ndGgpIHtcclxuXHRcdFx0XHQkY2hjay5wcm9wKCdjaGVja2VkJywgISRjaGNrLmlzKCc6Y2hlY2tlZCcpKTtcclxuXHRcdFx0XHRhcHBseUZpbHRlcigkY2hjayk7XHJcblx0XHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgJGlucCA9ICQoJzppbnB1dFt0eXBlPXRleHRdJywgdGhpcyk7XHJcblx0XHRcdGlmICgkaW5wLmxlbmd0aCkge1xyXG5cdFx0XHRcdCRpbnAuZm9jdXMoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmFkZEZpbHRlciA9IGZ1bmN0aW9uKGZpbHRlcikge1xyXG5cclxuXHRcdHRoaXMuJGJ1dHRvbkxpc3QuYXBwZW5kKCc8bGkgZGF0YS1maWx0ZXItZmllbGQ9XCInICsgJChmaWx0ZXIpLmF0dHIoXCJuYW1lXCIpICsgJ1wiPjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+ICcgKyAkKGZpbHRlcikuYXR0cihcInBsYWNlaG9sZGVyXCIpICsgJzwvYT48L2xpPicpO1xyXG5cdFx0dGhpcy5kaXNhYmxlRmlsdGVyKCQoZmlsdGVyKS5hdHRyKFwibmFtZVwiKSk7XHJcblxyXG5cdFx0Ly90aGlzLmZpbHRlcnNbZmlsdGVyLmZpZWxkXSA9IGZpbHRlcjtcclxuXHRcdC8vdGhpcy4kYnV0dG9uTGlzdC5hcHBlbmQoJzxsaSBkYXRhLWZpbHRlci1maWVsZD1cIicgKyBmaWx0ZXIuZmllbGQgKyAnXCI+PGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4gJyArIGZpbHRlci5sYWJlbCArICc8L2E+PC9saT4nKTtcclxuXHRcdC8vXHJcblx0XHQvL3RoaXMudHJpZ2dlcignYWRkLWZpbHRlcicsIGZpbHRlcik7XHJcblx0XHQvL2lmICh0eXBlb2YgZmlsdGVyLmVuYWJsZWQgIT09ICd1bmRlZmluZWQnICYmIGZpbHRlci5lbmFibGVkKSB7XHJcblx0XHQvL1x0Ly90aGlzLmVuYWJsZUZpbHRlcihmaWx0ZXIuZmllbGQpO1xyXG5cdFx0Ly99XHJcblx0fTtcclxuXHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5kaXNhYmxlRmlsdGVyID0gZnVuY3Rpb24obmFtZV9maWVsZCkge1xyXG5cdFx0dmFyIGZpZWxkID0gdGhpcy5nZXRGaWx0ZXIobmFtZV9maWVsZCk7XHJcblx0XHQkKGZpZWxkKS5wYXJlbnRzKCcuZm9ybS1ncm91cCcpLmhpZGUoKTtcclxuXHRcdHRoaXMuJGJ1dHRvbkxpc3QuZmluZCgnW2RhdGEtZmlsdGVyLWZpZWxkPScgKyBuYW1lX2ZpZWxkICsgJ10gaW5wdXRbdHlwZT1jaGVja2JveF0nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG5cclxuXHR9O1xyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZW5hYmxlRmlsdGVyID0gZnVuY3Rpb24obmFtZV9maWVsZCkge1xyXG5cdFx0dmFyIGZpZWxkID0gdGhpcy5nZXRGaWx0ZXIobmFtZV9maWVsZCk7XHJcblx0XHQkKGZpZWxkKS5wYXJlbnRzKCcuZm9ybS1ncm91cCcpLnNob3coKTtcclxuXHJcblx0fTtcclxuXHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRGaWx0ZXIgPSBmdW5jdGlvbihuYW1lX2ZpZWxkKSB7XHJcblx0XHR2YXIgdG9SZXR1cm4gPSBmYWxzZTtcclxuXHRcdCQuZWFjaCh0aGlzLiRmaWx0ZXJzLCBmdW5jdGlvbihpLCBmaWx0ZXIpIHtcclxuXHRcdFx0aWYgKCQoZmlsdGVyKS5hdHRyKFwibmFtZVwiKSA9PSBuYW1lX2ZpZWxkKSB7XHJcblx0XHRcdFx0dG9SZXR1cm4gPSAkKGZpbHRlcik7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiB0b1JldHVybjtcclxuXHR9O1xyXG5cclxuXHJcblxyXG5cclxuXHQvLyDQtNC+0LHQsNCy0LvQtdC90L4g0LTQtdC50YHRgtCy0LjQtSDQv9C+0LQg0LrQvdC+0L/QutGDINC+0YfQuNGB0YLQutC4INC30L3QsNGH0LXQvdC40Lkg0YTQuNC70YzRgtGA0L7QslxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jbGVhckZpbHRlclZhbHVlID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG5cdFx0dmFyIHJlbG9hZCA9IGZhbHNlO1xyXG5cdFx0Ly8g0LjRidC10Lwg0LjQvdC/0YPRgtGLINC4INGB0LXQu9C10LrRgtGLINGDINC60L7RgtC+0YDRi9GFINGD0LrQsNC30LDQvdGLINCw0YLRgNC40LHRg9GC0YsgXCJuYW1lXCIg0Lgg0YHQutC40LTRi9Cy0LDQtdC8INC40YUg0LTQsNC90L3Ri9C1XHJcblx0XHR0aGlzLiRmaWx0ZXJzLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoJCh0aGlzKS52YWwoKSAmJiAkKHRoaXMpLnZhbCgpLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRyZWxvYWQgPSB0cnVlO1xyXG5cdFx0XHRcdCQodGhpcykudmFsKG51bGwpLnRyaWdnZXIoXCJjaGFuZ2VcIik7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHRpZiAocmVsb2FkKSB7XHJcblx0XHRcdGlmIChwYXJhbXMgJiYgcGFyYW1zLnVybCkge1xyXG5cdFx0XHRcdHRoaXMub3B0aW9ucy51cmwgPSBwYXJhbXMudXJsO1xyXG5cdFx0XHRcdHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gMTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmluaXRTZXJ2ZXIocGFyYW1zICYmIHBhcmFtcy5zaWxlbnQsIHBhcmFtcyAmJiBwYXJhbXMucXVlcnkpO1xyXG5cdFx0fVxyXG5cclxuXHR9O1xyXG5cclxufShqUXVlcnkpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiDQoNC10LDQtNC40LfQsNGG0LjRjyDRhNC40LvRjNGC0YDQvtCyINC00LvRjyBib290c3RyYXBUYWJsZVxyXG4gKi9cclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblx0J3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcblx0JC5leHRlbmQoJC5mbi5ib290c3RyYXBUYWJsZS5kZWZhdWx0cywge1xyXG5cdFx0c2hvd0RlbGw6IHRydWUsXHJcblx0XHRidG5EZWxsSWQ6IFwicmVtb3ZlXCJcdC8vIGlkINC60L3QvtC/0LrQuCDRg9C00LDQu9C10L3QuNGPXHJcblx0fSk7XHJcblxyXG5cclxuXHQkLmV4dGVuZCgkLmZuLmJvb3RzdHJhcFRhYmxlLmV2ZW50cywge1xyXG5cdFx0J2RlbGwtb3B0aW9ucy5icy50YWJsZSc6ICdvbkRlbGxPcHRpb25zJ1xyXG5cdH0pO1xyXG5cclxuXHJcblx0dmFyIEJvb3RzdHJhcFRhYmxlID0gJC5mbi5ib290c3RyYXBUYWJsZS5Db25zdHJ1Y3RvcixcclxuXHRcdF9pbml0ID0gQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXQsXHJcblx0XHRfaW5pdFRvb2xiYXIgPSBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFRvb2xiYXI7XHJcblxyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFRvb2xiYXIgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRfaW5pdFRvb2xiYXIuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xyXG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xyXG5cdFx0aWYgKHRoYXQub3B0aW9ucy5zaG93RGVsbCkge1xyXG5cdFx0XHR0aGF0LiR0b29sYmFyXHJcblx0XHRcdFx0LmZpbmQoXCIuY29sdW1uc1wiKVxyXG5cdFx0XHRcdC5wcmVwZW5kKCcnICtcclxuXHRcdFx0XHQvLyc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicgK1xyXG5cdFx0XHRcdCdcdDxidXR0b24gZGlzYWJsZWQ9XCJcIiBpZD1cIicgKyB0aGF0Lm9wdGlvbnMuYnRuRGVsbElkICsgJ1wiIGNsYXNzPVwiYnRuIGJ0bi1kYW5nZXJcIiB0aXRsZT1cItGD0LTQsNC70LjRgtGMXCIgZGF0YS1sb2FkaW5nLXRleHQ9XCLRg9C00LDQu9C10L3QuNC1IC4uLlwiPicgK1xyXG5cdFx0XHRcdCdcdFx0PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT4nICtcclxuXHRcdFx0XHQnXHQ8L2J1dHRvbj4nICtcclxuXHRcdFx0XHQvLyc8L2Rpdj4nK1xyXG5cdFx0XHRcdCcnKTtcclxuXHJcblx0XHRcdHRoYXQuJGRlbEJ0biA9ICQoJyMnK3RoYXQub3B0aW9ucy5idG5EZWxsSWQpO1xyXG5cclxuXHRcdFx0dGhhdC4kdG9vbGJhci5kZWxlZ2F0ZSgnIycrdGhhdC5vcHRpb25zLmJ0bkRlbGxJZCwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdFx0dmFyIGlkcyA9IGZ1bmNCU2dldElkU2VsZWN0aW9ucygpO1xyXG5cdFx0XHRcdHZhciBjbnRSb3cgPSBpZHMubGVuZ3RoO1xyXG5cclxuXHJcblxyXG5cdFx0XHRcdHZhciBtc2cgPSAnJztcclxuXHRcdFx0XHR2YXIgbmFtZUxvZyA9IGNudFJvdyA+IDEgPyAn0LvQvtCz0L7QsiAnIDogJ9C70L7Qs9CwICc7XHJcblx0XHRcdFx0bXNnICs9ICc8Yj7QktC90LjQvNCw0L3QuNC1PC9iPjog0KLRgNC10LHRg9C10YLRgdGPINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNC1LiDQktC10YDQvdGD0YLRjCDQsdGD0LTQtdGCINC90LXQu9GM0LfRjyEgJztcclxuXHRcdFx0XHRtc2cgKz0gJzxicj48Yj7QntC/0LXRgNCw0YbQuNGPPC9iPjog0KPQtNCw0LvQtdC90LjQtSAnICsgbmFtZUxvZztcclxuXHRcdFx0XHRtc2cgKz0gJzxicj48Yj7QmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0YDQvtC6PC9iPjogJyArIGNudFJvdyArICc8cHJlPicgKyBpZHMgKyAnPC9wcmU+JztcclxuXHJcblx0XHRcdFx0Qm9vdHN0cmFwRGlhbG9nLmNvbmZpcm0obXNnLCBmdW5jdGlvbihyZXN1bHQpe1xyXG5cdFx0XHRcdFx0aWYocmVzdWx0KSB7XHJcblx0XHRcdFx0XHRcdHRoYXQuZGVsbChpZHMpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHJcblxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblxyXG5cdH07XHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0X2luaXQuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xyXG5cclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHJcblx0XHQvLyDRgdGC0LDQstC40Lwg0YHQu9C10LbQtdC90LjQtSDQt9CwINCy0YvQsdGA0LDQvdC90YvQvNC4INGH0LXQutCx0L7QutGB0LDQvNC4XHJcblx0XHQvLyDQuCDQsiDQt9Cw0LLQuNGB0LjQvNC+0YHRgtC4INC+0YIg0LjRhSDRgdGC0LDRgtGD0YHQsCDQvNC10L3Rj9C10Lwg0YHRgtGD0YLRg9GBINC60L3QvtC/0LrQuCDQvdCwINCw0LrRgtC40LLQvdGD0Y4g0LjQu9C4INC90LDQvtCx0L7RgNC+0YJcclxuXHRcdGlmICh0aGF0Lm9wdGlvbnMuc2hvd0RlbGwpIHtcclxuXHRcdFx0dGhhdC4kZWwub24oJ2NoZWNrLmJzLnRhYmxlIHVuY2hlY2suYnMudGFibGUgY2hlY2stYWxsLmJzLnRhYmxlIHVuY2hlY2stYWxsLmJzLnRhYmxlJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHRoYXQuJGRlbEJ0bi5wcm9wKCdkaXNhYmxlZCcsICEkYnN0YWJsZS5ib290c3RyYXBUYWJsZSgnZ2V0U2VsZWN0aW9ucycpLmxlbmd0aCk7XHJcblxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblxyXG5cdH07XHJcblxyXG5cdC8vINGE0YPQvdC60YbQuNGPINGD0LTQsNC70LXQvdC40Y8g0LrQsNC60LjRhSDQu9C40LHQviDQt9C90LDRh9C10L3QuNC5ICjRgdGC0YDQvtC6KSDRh9C10YDQtdC3IEJvb3RzdHJhcFRhYmxlXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmRlbGwgPSBmdW5jdGlvbihpZHMpIHtcclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHJcblx0XHR2YXIgcGFyYW0gPSB7fTtcclxuXHRcdHBhcmFtLmNvbnRcdD0gdmFycy5zZW5kVG8uY29udDtcclxuXHRcdHBhcmFtLm1vZFx0PSB2YXJzLnNlbmRUby5tb2Q7XHJcblx0XHRwYXJhbS5mdW5jXHQ9IHZhcnMuc2VuZFRvLmZ1bmM7XHJcblx0XHRwYXJhbS5kb1x0PSAnZGVsZXRlJztcclxuXHRcdHBhcmFtLmlkXHQ9IGlkcztcclxuXHJcblxyXG5cdFx0Ly8g0LDQvdC40LzQsNGG0LjRjyDQtNC70Y8g0LrQvdC+0L/QutC4INC30LDQv9GD0YHQutCwINC+0LHQvdC+0LLQu9C10L3QuNGPXHJcblx0XHR0aGF0LiRkZWxCdG4uYnV0dG9uKCdsb2FkaW5nJyk7XHJcblxyXG5cdFx0ZnVuY19zZW5kX2FqYXgocGFyYW0sIGZhbHNlLCBmdW5jdGlvbiAocmVzKSB7XHJcblx0XHRcdHZhciBkZWxheSA9IDA7XHJcblx0XHRcdHZhciBjbnQgPSAwO1xyXG5cdFx0XHR2YXIgY250Um93ID0gcmVzLmxlbmd0aDtcclxuXHRcdFx0JC5lYWNoKHJlcywgZnVuY3Rpb24gKGksIHZhbCkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdGZ1bmNfbXNnX25vdGlmeSh2YWwuc3RhdHVzLCB2YWwubXNnLCAn0KPQtNCw0LvQtdC90LjQtSDQu9C+0LPQsCcpO1xyXG5cdFx0XHRcdFx0aWYgKHZhbC5zdGF0dXMgPT0gJ3N1Y2Nlc3MnKSB7XHJcblx0XHRcdFx0XHRcdCRic3RhYmxlLmJvb3RzdHJhcFRhYmxlKCdyZW1vdmUnLCB7XHJcblx0XHRcdFx0XHRcdFx0ZmllbGQ6ICdpZCcsXHJcblx0XHRcdFx0XHRcdFx0dmFsdWVzOiBbdmFsLmlkXVxyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRjbnQgKys7XHJcblx0XHRcdFx0XHRpZiAoY250Um93ID09IGNudCkge1xyXG5cdFx0XHRcdFx0XHQvLyDRgdC60LjQtNGL0LLQsNC10Lwg0LDQvdC40LzQsNGG0Y4g0LrQvdC+0L/QutC4XHJcblx0XHRcdFx0XHRcdHRoYXQuJGRlbEJ0bi5idXR0b24oJ3Jlc2V0Jyk7XHJcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHQvLyDQtNC10LDQutGC0LjQstC40YDRg9C10Lwg0LrQvdC+0L/QutGDXHJcblx0XHRcdFx0XHRcdFx0dGhhdC4kZGVsQnRuLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcblx0XHRcdFx0XHRcdH0sIDEpO1xyXG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0dGhhdC5yZWZyZXNoKCk7XHJcblx0XHRcdFx0XHRcdFx0ZnVuY19tc2dfbm90aWZ5KCdzdWNjZXNzJywgJ9Cj0LTQsNC70LXQvdC+INGB0YLRgNC+0Lo6ICcgK2NudFJvdyk7XHJcblx0XHRcdFx0XHRcdH0sIDEwMDApO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9LCBkZWxheSArPSAxMDAwKTtcclxuXHJcblx0XHRcdH0pO1xyXG5cclxuXHJcblx0XHR9KTtcclxuXHJcblx0fTtcclxuXHJcblxyXG59KGpRdWVyeSk7Il0sImZpbGUiOiJicy10YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
