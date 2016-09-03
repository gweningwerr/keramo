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
                if (column.radio || column.checkbox) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJicy10YWJsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyDQuNC90LrQu9GD0LTQuNC8INC30LDQstC40YHQuNC80YvQtSDRhNCw0LnQu9GLXHJcbi8qKlxyXG4gKiBAYXV0aG9yIHpoaXhpbiB3ZW4gPHdlbnpoaXhpbjIwMTBAZ21haWwuY29tPlxyXG4gKiB2ZXJzaW9uOiAxLjExLjBcclxuICogaHR0cHM6Ly9naXRodWIuY29tL3dlbnpoaXhpbi9ib290c3RyYXAtdGFibGUvXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uICgkKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gVE9PTFMgREVGSU5JVElPTlxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIHZhciBjYWNoZWRXaWR0aCA9IG51bGw7XHJcblxyXG4gICAgLy8gaXQgb25seSBkb2VzICclcycsIGFuZCByZXR1cm4gJycgd2hlbiBhcmd1bWVudHMgYXJlIHVuZGVmaW5lZFxyXG4gICAgdmFyIHNwcmludGYgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIGZsYWcgPSB0cnVlLFxyXG4gICAgICAgICAgICBpID0gMTtcclxuXHJcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaSsrXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcmc7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZsYWcgPyBzdHIgOiAnJztcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdldFByb3BlcnR5RnJvbU90aGVyID0gZnVuY3Rpb24gKGxpc3QsIGZyb20sIHRvLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcclxuICAgICAgICAkLmVhY2gobGlzdCwgZnVuY3Rpb24gKGksIGl0ZW0pIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW1bZnJvbV0gPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpdGVtW3RvXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0RmllbGRJbmRleCA9IGZ1bmN0aW9uIChjb2x1bW5zLCBmaWVsZCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xyXG5cclxuICAgICAgICAkLmVhY2goY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSBmaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gaHR0cDovL2pzZmlkZGxlLm5ldC93ZW55aS80N256N2V6OS8zL1xyXG4gICAgdmFyIHNldEZpZWxkSW5kZXggPSBmdW5jdGlvbiAoY29sdW1ucykge1xyXG4gICAgICAgIHZhciBpLCBqLCBrLFxyXG4gICAgICAgICAgICB0b3RhbENvbCA9IDAsXHJcbiAgICAgICAgICAgIGZsYWcgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbHVtbnNbMF0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWxDb2wgKz0gY29sdW1uc1swXVtpXS5jb2xzcGFuIHx8IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBmbGFnW2ldID0gW107XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB0b3RhbENvbDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFnW2ldW2pdID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjb2x1bW5zW2ldLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IGNvbHVtbnNbaV1bal0sXHJcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbiA9IHIucm93c3BhbiB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gPSByLmNvbHNwYW4gfHwgMSxcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9ICQuaW5BcnJheShmYWxzZSwgZmxhZ1tpXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHNwYW4gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICByLmZpZWxkSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIGZpZWxkIGlzIHVuZGVmaW5lZCwgdXNlIGluZGV4IGluc3RlYWRcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIuZmllbGQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIuZmllbGQgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHJvd3NwYW47IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZsYWdbaSArIGtdW2luZGV4XSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgY29sc3BhbjsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ1tpXVtpbmRleCArIGtdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdldFNjcm9sbEJhcldpZHRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmIChjYWNoZWRXaWR0aCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgaW5uZXIgPSAkKCc8cC8+JykuYWRkQ2xhc3MoJ2ZpeGVkLXRhYmxlLXNjcm9sbC1pbm5lcicpLFxyXG4gICAgICAgICAgICAgICAgb3V0ZXIgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnZml4ZWQtdGFibGUtc2Nyb2xsLW91dGVyJyksXHJcbiAgICAgICAgICAgICAgICB3MSwgdzI7XHJcblxyXG4gICAgICAgICAgICBvdXRlci5hcHBlbmQoaW5uZXIpO1xyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKG91dGVyKTtcclxuXHJcbiAgICAgICAgICAgIHcxID0gaW5uZXJbMF0ub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIG91dGVyLmNzcygnb3ZlcmZsb3cnLCAnc2Nyb2xsJyk7XHJcbiAgICAgICAgICAgIHcyID0gaW5uZXJbMF0ub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgICAgICAgICBpZiAodzEgPT09IHcyKSB7XHJcbiAgICAgICAgICAgICAgICB3MiA9IG91dGVyWzBdLmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBvdXRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgY2FjaGVkV2lkdGggPSB3MSAtIHcyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2FjaGVkV2lkdGg7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjYWxjdWxhdGVPYmplY3RWYWx1ZSA9IGZ1bmN0aW9uIChzZWxmLCBuYW1lLCBhcmdzLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICB2YXIgZnVuYyA9IG5hbWU7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgLy8gc3VwcG9ydCBvYmouZnVuYzEuZnVuYzJcclxuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdCgnLicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5hbWVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSB3aW5kb3c7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2gobmFtZXMsIGZ1bmN0aW9uIChpLCBmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuYyA9IGZ1bmNbZl07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSB3aW5kb3dbbmFtZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWZ1bmMgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnICYmIHNwcmludGYuYXBwbHkodGhpcywgW25hbWVdLmNvbmNhdChhcmdzKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNwcmludGYuYXBwbHkodGhpcywgW25hbWVdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjb21wYXJlT2JqZWN0cyA9IGZ1bmN0aW9uIChvYmplY3RBLCBvYmplY3RCLCBjb21wYXJlTGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGFycmF5cyBvZiBwcm9wZXJ0eSBuYW1lc1xyXG4gICAgICAgIHZhciBvYmplY3RBUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdEEpLFxyXG4gICAgICAgICAgICBvYmplY3RCUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdEIpLFxyXG4gICAgICAgICAgICBwcm9wTmFtZSA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoY29tcGFyZUxlbmd0aCkge1xyXG4gICAgICAgICAgICAvLyBJZiBudW1iZXIgb2YgcHJvcGVydGllcyBpcyBkaWZmZXJlbnQsIG9iamVjdHMgYXJlIG5vdCBlcXVpdmFsZW50XHJcbiAgICAgICAgICAgIGlmIChvYmplY3RBUHJvcGVydGllcy5sZW5ndGggIT09IG9iamVjdEJQcm9wZXJ0aWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdEFQcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb3BOYW1lID0gb2JqZWN0QVByb3BlcnRpZXNbaV07XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgcHJvcGVydHkgaXMgbm90IGluIHRoZSBvYmplY3QgQiBwcm9wZXJ0aWVzLCBjb250aW51ZSB3aXRoIHRoZSBuZXh0IHByb3BlcnR5XHJcbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkocHJvcE5hbWUsIG9iamVjdEJQcm9wZXJ0aWVzKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB2YWx1ZXMgb2Ygc2FtZSBwcm9wZXJ0eSBhcmUgbm90IGVxdWFsLCBvYmplY3RzIGFyZSBub3QgZXF1aXZhbGVudFxyXG4gICAgICAgICAgICAgICAgaWYgKG9iamVjdEFbcHJvcE5hbWVdICE9PSBvYmplY3RCW3Byb3BOYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UgbWFkZSBpdCB0aGlzIGZhciwgb2JqZWN0cyBhcmUgY29uc2lkZXJlZCBlcXVpdmFsZW50XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBlc2NhcGVIVE1MID0gZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRleHQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0XHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMDM5OycpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvYC9nLCAnJiN4NjA7Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0UmVhbEhlaWdodCA9IGZ1bmN0aW9uICgkZWwpIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gMDtcclxuICAgICAgICAkZWwuY2hpbGRyZW4oKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA8ICQodGhpcykub3V0ZXJIZWlnaHQodHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICQodGhpcykub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gaGVpZ2h0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0UmVhbERhdGFBdHRyID0gZnVuY3Rpb24gKGRhdGFBdHRyKSB7XHJcbiAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBkYXRhQXR0cikge1xyXG4gICAgICAgICAgICB2YXIgYXV4QXR0ciA9IGF0dHIuc3BsaXQoLyg/PVtBLVpdKS8pLmpvaW4oJy0nKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAoYXV4QXR0ciAhPT0gYXR0cikge1xyXG4gICAgICAgICAgICAgICAgZGF0YUF0dHJbYXV4QXR0cl0gPSBkYXRhQXR0clthdHRyXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhQXR0clthdHRyXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRhdGFBdHRyO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ2V0SXRlbUZpZWxkID0gZnVuY3Rpb24gKGl0ZW0sIGZpZWxkLCBlc2NhcGUpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkICE9PSAnc3RyaW5nJyB8fCBpdGVtLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlID8gZXNjYXBlSFRNTChpdGVtW2ZpZWxkXSkgOiBpdGVtW2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHByb3BzID0gZmllbGQuc3BsaXQoJy4nKTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIHByb3BzKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWVbcHJvcHNbcF1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXNjYXBlID8gZXNjYXBlSFRNTCh2YWx1ZSkgOiB2YWx1ZTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGlzSUVCcm93c2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIShuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIFwiKSA+IDAgfHwgISFuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLykpO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgb2JqZWN0S2V5cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBGcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9rZXlzXHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cykge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXHJcbiAgICAgICAgICAgICAgICAgICAgaGFzRG9udEVudW1CdWcgPSAhKHsgdG9TdHJpbmc6IG51bGwgfSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyksXHJcbiAgICAgICAgICAgICAgICAgICAgZG9udEVudW1zID0gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9TdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9Mb2NhbGVTdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndmFsdWVPZicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdoYXNPd25Qcm9wZXJ0eScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdpc1Byb3RvdHlwZU9mJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbnN0cnVjdG9yJ1xyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgZG9udEVudW1zTGVuZ3RoID0gZG9udEVudW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnICYmICh0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nIHx8IG9iaiA9PT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmtleXMgY2FsbGVkIG9uIG5vbi1vYmplY3QnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgcHJvcCwgaTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChwcm9wIGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcm9wKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0RvbnRFbnVtQnVnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkb250RW51bXNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqLCBkb250RW51bXNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZG9udEVudW1zW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEJPT1RTVFJBUCBUQUJMRSBDTEFTUyBERUZJTklUSU9OXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgdmFyIEJvb3RzdHJhcFRhYmxlID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICB0aGlzLiRlbCA9ICQoZWwpO1xyXG4gICAgICAgIHRoaXMuJGVsXyA9IHRoaXMuJGVsLmNsb25lKCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0SWRfID0gMDtcclxuICAgICAgICB0aGlzLnRpbWVvdXRGb290ZXJfID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTID0ge1xyXG4gICAgICAgIGNsYXNzZXM6ICd0YWJsZSB0YWJsZS1ob3ZlcicsXHJcbiAgICAgICAgbG9jYWxlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgaGVpZ2h0OiB1bmRlZmluZWQsXHJcbiAgICAgICAgdW5kZWZpbmVkVGV4dDogJy0nLFxyXG4gICAgICAgIHNvcnROYW1lOiB1bmRlZmluZWQsXHJcbiAgICAgICAgc29ydE9yZGVyOiAnYXNjJyxcclxuICAgICAgICBzb3J0U3RhYmxlOiBmYWxzZSxcclxuICAgICAgICBzdHJpcGVkOiBmYWxzZSxcclxuICAgICAgICBjb2x1bW5zOiBbW11dLFxyXG4gICAgICAgIGRhdGE6IFtdLFxyXG4gICAgICAgIGRhdGFGaWVsZDogJ3Jvd3MnLFxyXG4gICAgICAgIG1ldGhvZDogJ2dldCcsXHJcbiAgICAgICAgdXJsOiB1bmRlZmluZWQsXHJcbiAgICAgICAgYWpheDogdW5kZWZpbmVkLFxyXG4gICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBhamF4T3B0aW9uczoge30sXHJcbiAgICAgICAgcXVlcnlQYXJhbXM6IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHF1ZXJ5UGFyYW1zVHlwZTogJ2xpbWl0JywgLy8gdW5kZWZpbmVkXHJcbiAgICAgICAgcmVzcG9uc2VIYW5kbGVyOiBmdW5jdGlvbiAocmVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYWdpbmF0aW9uOiBmYWxzZSxcclxuICAgICAgICBvbmx5SW5mb1BhZ2luYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNpZGVQYWdpbmF0aW9uOiAnY2xpZW50JywgLy8gY2xpZW50IG9yIHNlcnZlclxyXG4gICAgICAgIHRvdGFsUm93czogMCwgLy8gc2VydmVyIHNpZGUgbmVlZCB0byBzZXRcclxuICAgICAgICBwYWdlTnVtYmVyOiAxLFxyXG4gICAgICAgIHBhZ2VTaXplOiAxMCxcclxuICAgICAgICBwYWdlTGlzdDogWzEwLCAyNSwgNTAsIDEwMF0sXHJcbiAgICAgICAgcGFnaW5hdGlvbkhBbGlnbjogJ3JpZ2h0JywgLy9yaWdodCwgbGVmdFxyXG4gICAgICAgIHBhZ2luYXRpb25WQWxpZ246ICdib3R0b20nLCAvL2JvdHRvbSwgdG9wLCBib3RoXHJcbiAgICAgICAgcGFnaW5hdGlvbkRldGFpbEhBbGlnbjogJ2xlZnQnLCAvL3JpZ2h0LCBsZWZ0XHJcbiAgICAgICAgcGFnaW5hdGlvblByZVRleHQ6ICcmbHNhcXVvOycsXHJcbiAgICAgICAgcGFnaW5hdGlvbk5leHRUZXh0OiAnJnJzYXF1bzsnLFxyXG4gICAgICAgIHNlYXJjaDogZmFsc2UsXHJcbiAgICAgICAgc2VhcmNoT25FbnRlcktleTogZmFsc2UsXHJcbiAgICAgICAgc3RyaWN0U2VhcmNoOiBmYWxzZSxcclxuICAgICAgICBzZWFyY2hBbGlnbjogJ3JpZ2h0JyxcclxuICAgICAgICBzZWxlY3RJdGVtTmFtZTogJ2J0U2VsZWN0SXRlbScsXHJcbiAgICAgICAgc2hvd0hlYWRlcjogdHJ1ZSxcclxuICAgICAgICBzaG93Rm9vdGVyOiBmYWxzZSxcclxuICAgICAgICBzaG93Q29sdW1uczogZmFsc2UsXHJcbiAgICAgICAgc2hvd1BhZ2luYXRpb25Td2l0Y2g6IGZhbHNlLFxyXG4gICAgICAgIHNob3dSZWZyZXNoOiBmYWxzZSxcclxuICAgICAgICBzaG93VG9nZ2xlOiBmYWxzZSxcclxuICAgICAgICBidXR0b25zQWxpZ246ICdyaWdodCcsXHJcbiAgICAgICAgc21hcnREaXNwbGF5OiB0cnVlLFxyXG4gICAgICAgIGVzY2FwZTogZmFsc2UsXHJcbiAgICAgICAgbWluaW11bUNvdW50Q29sdW1uczogMSxcclxuICAgICAgICBpZEZpZWxkOiB1bmRlZmluZWQsXHJcbiAgICAgICAgdW5pcXVlSWQ6IHVuZGVmaW5lZCxcclxuICAgICAgICBjYXJkVmlldzogZmFsc2UsXHJcbiAgICAgICAgZGV0YWlsVmlldzogZmFsc2UsXHJcbiAgICAgICAgZGV0YWlsRm9ybWF0dGVyOiBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmltT25TZWFyY2g6IHRydWUsXHJcbiAgICAgICAgY2xpY2tUb1NlbGVjdDogZmFsc2UsXHJcbiAgICAgICAgc2luZ2xlU2VsZWN0OiBmYWxzZSxcclxuICAgICAgICB0b29sYmFyOiB1bmRlZmluZWQsXHJcbiAgICAgICAgdG9vbGJhckFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgY2hlY2tib3hIZWFkZXI6IHRydWUsXHJcbiAgICAgICAgc29ydGFibGU6IHRydWUsXHJcbiAgICAgICAgc2lsZW50U29ydDogdHJ1ZSxcclxuICAgICAgICBtYWludGFpblNlbGVjdGVkOiBmYWxzZSxcclxuICAgICAgICBzZWFyY2hUaW1lT3V0OiA1MDAsXHJcbiAgICAgICAgc2VhcmNoVGV4dDogJycsXHJcbiAgICAgICAgaWNvblNpemU6IHVuZGVmaW5lZCxcclxuICAgICAgICBidXR0b25zQ2xhc3M6ICdkZWZhdWx0JyxcclxuICAgICAgICBpY29uc1ByZWZpeDogJ2dseXBoaWNvbicsIC8vIGdseXBoaWNvbiBvZiBmYSAoZm9udCBhd2Vzb21lKVxyXG4gICAgICAgIGljb25zOiB7XHJcbiAgICAgICAgICAgIHBhZ2luYXRpb25Td2l0Y2hEb3duOiAnZ2x5cGhpY29uLWNvbGxhcHNlLWRvd24gaWNvbi1jaGV2cm9uLWRvd24nLFxyXG4gICAgICAgICAgICBwYWdpbmF0aW9uU3dpdGNoVXA6ICdnbHlwaGljb24tY29sbGFwc2UtdXAgaWNvbi1jaGV2cm9uLXVwJyxcclxuICAgICAgICAgICAgcmVmcmVzaDogJ2dseXBoaWNvbi1yZWZyZXNoIGljb24tcmVmcmVzaCcsXHJcbiAgICAgICAgICAgIHRvZ2dsZTogJ2dseXBoaWNvbi1saXN0LWFsdCBpY29uLWxpc3QtYWx0JyxcclxuICAgICAgICAgICAgY29sdW1uczogJ2dseXBoaWNvbi10aCBpY29uLXRoJyxcclxuICAgICAgICAgICAgZGV0YWlsT3BlbjogJ2dseXBoaWNvbi1wbHVzIGljb24tcGx1cycsXHJcbiAgICAgICAgICAgIGRldGFpbENsb3NlOiAnZ2x5cGhpY29uLW1pbnVzIGljb24tbWludXMnXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY3VzdG9tU2VhcmNoOiAkLm5vb3AsXHJcblxyXG4gICAgICAgIGN1c3RvbVNvcnQ6ICQubm9vcCxcclxuXHJcbiAgICAgICAgcm93U3R5bGU6IGZ1bmN0aW9uIChyb3csIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByb3dBdHRyaWJ1dGVzOiBmdW5jdGlvbiAocm93LCBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZm9vdGVyU3R5bGU6IGZ1bmN0aW9uIChyb3csIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvbkFsbDogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGlja0NlbGw6IGZ1bmN0aW9uIChmaWVsZCwgdmFsdWUsIHJvdywgJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25EYmxDbGlja0NlbGw6IGZ1bmN0aW9uIChmaWVsZCwgdmFsdWUsIHJvdywgJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGlja1JvdzogZnVuY3Rpb24gKGl0ZW0sICRlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRGJsQ2xpY2tSb3c6IGZ1bmN0aW9uIChpdGVtLCAkZWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblNvcnQ6IGZ1bmN0aW9uIChuYW1lLCBvcmRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNoZWNrOiBmdW5jdGlvbiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uVW5jaGVjazogZnVuY3Rpb24gKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNoZWNrQWxsOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblVuY2hlY2tBbGw6IGZ1bmN0aW9uIChyb3dzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQ2hlY2tTb21lOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblVuY2hlY2tTb21lOiBmdW5jdGlvbiAocm93cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkxvYWRTdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkxvYWRFcnJvcjogZnVuY3Rpb24gKHN0YXR1cykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNvbHVtblN3aXRjaDogZnVuY3Rpb24gKGZpZWxkLCBjaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUGFnZUNoYW5nZTogZnVuY3Rpb24gKG51bWJlciwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblNlYXJjaDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25Ub2dnbGU6IGZ1bmN0aW9uIChjYXJkVmlldykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblByZUJvZHk6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUG9zdEJvZHk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25Qb3N0SGVhZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRXhwYW5kUm93OiBmdW5jdGlvbiAoaW5kZXgsIHJvdywgJGRldGFpbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNvbGxhcHNlUm93OiBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblJlZnJlc2hPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblJlZnJlc2g6IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUmVzZXRWaWV3OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkxPQ0FMRVMgPSB7fTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5MT0NBTEVTWydlbi1VUyddID0gQm9vdHN0cmFwVGFibGUuTE9DQUxFUy5lbiA9IHtcclxuICAgICAgICBmb3JtYXRMb2FkaW5nTWVzc2FnZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFJlY29yZHNQZXJQYWdlOiBmdW5jdGlvbiAocGFnZU51bWJlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc3ByaW50ZignJXMgcm93cyBwZXIgcGFnZScsIHBhZ2VOdW1iZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0U2hvd2luZ1Jvd3M6IGZ1bmN0aW9uIChwYWdlRnJvbSwgcGFnZVRvLCB0b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNwcmludGYoJ1Nob3dpbmcgJXMgdG8gJXMgb2YgJXMgcm93cycsIHBhZ2VGcm9tLCBwYWdlVG8sIHRvdGFsUm93cyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXREZXRhaWxQYWdpbmF0aW9uOiBmdW5jdGlvbiAodG90YWxSb3dzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzcHJpbnRmKCdTaG93aW5nICVzIHJvd3MnLCB0b3RhbFJvd3MpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0U2VhcmNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnU2VhcmNoJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdE5vTWF0Y2hlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ05vIG1hdGNoaW5nIHJlY29yZHMgZm91bmQnO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9ybWF0UGFnaW5hdGlvblN3aXRjaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ0hpZGUvU2hvdyBwYWdpbmF0aW9uJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdSZWZyZXNoJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFRvZ2dsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ1RvZ2dsZSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXRDb2x1bW5zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnQ29sdW1ucyc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb3JtYXRBbGxSb3dzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnQWxsJztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgICQuZXh0ZW5kKEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTLCBCb290c3RyYXBUYWJsZS5MT0NBTEVTWydlbi1VUyddKTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5DT0xVTU5fREVGQVVMVFMgPSB7XHJcbiAgICAgICAgcmFkaW86IGZhbHNlLFxyXG4gICAgICAgIGNoZWNrYm94OiBmYWxzZSxcclxuICAgICAgICBjaGVja2JveEVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgZmllbGQ6IHVuZGVmaW5lZCxcclxuICAgICAgICB0aXRsZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIHRpdGxlVG9vbHRpcDogdW5kZWZpbmVkLFxyXG4gICAgICAgICdjbGFzcyc6IHVuZGVmaW5lZCxcclxuICAgICAgICBhbGlnbjogdW5kZWZpbmVkLCAvLyBsZWZ0LCByaWdodCwgY2VudGVyXHJcbiAgICAgICAgaGFsaWduOiB1bmRlZmluZWQsIC8vIGxlZnQsIHJpZ2h0LCBjZW50ZXJcclxuICAgICAgICBmYWxpZ246IHVuZGVmaW5lZCwgLy8gbGVmdCwgcmlnaHQsIGNlbnRlclxyXG4gICAgICAgIHZhbGlnbjogdW5kZWZpbmVkLCAvLyB0b3AsIG1pZGRsZSwgYm90dG9tXHJcbiAgICAgICAgd2lkdGg6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgb3JkZXI6ICdhc2MnLCAvLyBhc2MsIGRlc2NcclxuICAgICAgICB2aXNpYmxlOiB0cnVlLFxyXG4gICAgICAgIHN3aXRjaGFibGU6IHRydWUsXHJcbiAgICAgICAgY2xpY2tUb1NlbGVjdDogdHJ1ZSxcclxuICAgICAgICBmb3JtYXR0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBmb290ZXJGb3JtYXR0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBldmVudHM6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0ZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICBzb3J0TmFtZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGNlbGxTdHlsZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIHNlYXJjaGFibGU6IHRydWUsXHJcbiAgICAgICAgc2VhcmNoRm9ybWF0dGVyOiB0cnVlLFxyXG4gICAgICAgIGNhcmRWaXNpYmxlOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLkVWRU5UUyA9IHtcclxuICAgICAgICAnYWxsLmJzLnRhYmxlJzogJ29uQWxsJyxcclxuICAgICAgICAnY2xpY2stY2VsbC5icy50YWJsZSc6ICdvbkNsaWNrQ2VsbCcsXHJcbiAgICAgICAgJ2RibC1jbGljay1jZWxsLmJzLnRhYmxlJzogJ29uRGJsQ2xpY2tDZWxsJyxcclxuICAgICAgICAnY2xpY2stcm93LmJzLnRhYmxlJzogJ29uQ2xpY2tSb3cnLFxyXG4gICAgICAgICdkYmwtY2xpY2stcm93LmJzLnRhYmxlJzogJ29uRGJsQ2xpY2tSb3cnLFxyXG4gICAgICAgICdzb3J0LmJzLnRhYmxlJzogJ29uU29ydCcsXHJcbiAgICAgICAgJ2NoZWNrLmJzLnRhYmxlJzogJ29uQ2hlY2snLFxyXG4gICAgICAgICd1bmNoZWNrLmJzLnRhYmxlJzogJ29uVW5jaGVjaycsXHJcbiAgICAgICAgJ2NoZWNrLWFsbC5icy50YWJsZSc6ICdvbkNoZWNrQWxsJyxcclxuICAgICAgICAndW5jaGVjay1hbGwuYnMudGFibGUnOiAnb25VbmNoZWNrQWxsJyxcclxuICAgICAgICAnY2hlY2stc29tZS5icy50YWJsZSc6ICdvbkNoZWNrU29tZScsXHJcbiAgICAgICAgJ3VuY2hlY2stc29tZS5icy50YWJsZSc6ICdvblVuY2hlY2tTb21lJyxcclxuICAgICAgICAnbG9hZC1zdWNjZXNzLmJzLnRhYmxlJzogJ29uTG9hZFN1Y2Nlc3MnLFxyXG4gICAgICAgICdsb2FkLWVycm9yLmJzLnRhYmxlJzogJ29uTG9hZEVycm9yJyxcclxuICAgICAgICAnY29sdW1uLXN3aXRjaC5icy50YWJsZSc6ICdvbkNvbHVtblN3aXRjaCcsXHJcbiAgICAgICAgJ3BhZ2UtY2hhbmdlLmJzLnRhYmxlJzogJ29uUGFnZUNoYW5nZScsXHJcbiAgICAgICAgJ3NlYXJjaC5icy50YWJsZSc6ICdvblNlYXJjaCcsXHJcbiAgICAgICAgJ3RvZ2dsZS5icy50YWJsZSc6ICdvblRvZ2dsZScsXHJcbiAgICAgICAgJ3ByZS1ib2R5LmJzLnRhYmxlJzogJ29uUHJlQm9keScsXHJcbiAgICAgICAgJ3Bvc3QtYm9keS5icy50YWJsZSc6ICdvblBvc3RCb2R5JyxcclxuICAgICAgICAncG9zdC1oZWFkZXIuYnMudGFibGUnOiAnb25Qb3N0SGVhZGVyJyxcclxuICAgICAgICAnZXhwYW5kLXJvdy5icy50YWJsZSc6ICdvbkV4cGFuZFJvdycsXHJcbiAgICAgICAgJ2NvbGxhcHNlLXJvdy5icy50YWJsZSc6ICdvbkNvbGxhcHNlUm93JyxcclxuICAgICAgICAncmVmcmVzaC1vcHRpb25zLmJzLnRhYmxlJzogJ29uUmVmcmVzaE9wdGlvbnMnLFxyXG4gICAgICAgICdyZXNldC12aWV3LmJzLnRhYmxlJzogJ29uUmVzZXRWaWV3JyxcclxuICAgICAgICAncmVmcmVzaC5icy50YWJsZSc6ICdvblJlZnJlc2gnXHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdExvY2FsZSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdENvbnRhaW5lcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFRhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5pbml0SGVhZGVyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0RGF0YSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEZvb3RlcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFRvb2xiYXIoKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaFRleHQoKTtcclxuICAgICAgICB0aGlzLmluaXRTZXJ2ZXIoKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRMb2NhbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhbGUpIHtcclxuICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5vcHRpb25zLmxvY2FsZS5zcGxpdCgvLXxfLyk7XHJcbiAgICAgICAgICAgIHBhcnRzWzBdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0c1sxXSkgcGFydHNbMV0udG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKCQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1t0aGlzLm9wdGlvbnMubG9jYWxlXSkge1xyXG4gICAgICAgICAgICAgICAgLy8gbG9jYWxlIGFzIHJlcXVlc3RlZFxyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCAkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbdGhpcy5vcHRpb25zLmxvY2FsZV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1twYXJ0cy5qb2luKCctJyldKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBsb2NhbGUgd2l0aCBzZXAgc2V0IHRvIC0gKGluIGNhc2Ugb3JpZ2luYWwgd2FzIHNwZWNpZmllZCB3aXRoIF8pXHJcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsICQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlc1twYXJ0cy5qb2luKCctJyldKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbcGFydHNbMF1dKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzaG9ydCBsb2NhbGUgbGFuZ3VhZ2UgY29kZSAoaS5lLiAnZW4nKVxyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCAkLmZuLmJvb3RzdHJhcFRhYmxlLmxvY2FsZXNbcGFydHNbMF1dKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRDb250YWluZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyID0gJChbXHJcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYm9vdHN0cmFwLXRhYmxlXCI+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS10b29sYmFyXCI+PC9kaXY+JyxcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25WQWxpZ24gPT09ICd0b3AnIHx8IHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uVkFsaWduID09PSAnYm90aCcgP1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1wYWdpbmF0aW9uXCIgc3R5bGU9XCJjbGVhcjogYm90aDtcIj48L2Rpdj4nIDpcclxuICAgICAgICAgICAgICAgICcnLFxyXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZpeGVkLXRhYmxlLWNvbnRhaW5lclwiPicsXHJcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZml4ZWQtdGFibGUtaGVhZGVyXCI+PHRhYmxlPjwvdGFibGU+PC9kaXY+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1ib2R5XCI+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1sb2FkaW5nXCI+JyxcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZvcm1hdExvYWRpbmdNZXNzYWdlKCksXHJcbiAgICAgICAgICAgICc8L2Rpdj4nLFxyXG4gICAgICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmaXhlZC10YWJsZS1mb290ZXJcIj48dGFibGU+PHRyPjwvdHI+PC90YWJsZT48L2Rpdj4nLFxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnaW5hdGlvblZBbGlnbiA9PT0gJ2JvdHRvbScgfHwgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25WQWxpZ24gPT09ICdib3RoJyA/XHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZpeGVkLXRhYmxlLXBhZ2luYXRpb25cIj48L2Rpdj4nIDpcclxuICAgICAgICAgICAgICAgICcnLFxyXG4gICAgICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICBdLmpvaW4oJycpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmluc2VydEFmdGVyKHRoaXMuJGVsKTtcclxuICAgICAgICB0aGlzLiR0YWJsZUNvbnRhaW5lciA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtY29udGFpbmVyJyk7XHJcbiAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIgPSB0aGlzLiRjb250YWluZXIuZmluZCgnLmZpeGVkLXRhYmxlLWhlYWRlcicpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlQm9keSA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtYm9keScpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZyA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtbG9hZGluZycpO1xyXG4gICAgICAgIHRoaXMuJHRhYmxlRm9vdGVyID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJy5maXhlZC10YWJsZS1mb290ZXInKTtcclxuICAgICAgICB0aGlzLiR0b29sYmFyID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJy5maXhlZC10YWJsZS10b29sYmFyJyk7XHJcbiAgICAgICAgdGhpcy4kcGFnaW5hdGlvbiA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCcuZml4ZWQtdGFibGUtcGFnaW5hdGlvbicpO1xyXG5cclxuICAgICAgICB0aGlzLiR0YWJsZUJvZHkuYXBwZW5kKHRoaXMuJGVsKTtcclxuICAgICAgICB0aGlzLiRjb250YWluZXIuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJjbGVhcmZpeFwiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY2xhc3Nlcyk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpcGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKCd0YWJsZS1zdHJpcGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgkLmluQXJyYXkoJ3RhYmxlLW5vLWJvcmRlcmVkJywgdGhpcy5vcHRpb25zLmNsYXNzZXMuc3BsaXQoJyAnKSkgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlQ29udGFpbmVyLmFkZENsYXNzKCd0YWJsZS1uby1ib3JkZXJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUYWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGNvbHVtbnMgPSBbXSxcclxuICAgICAgICAgICAgZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLiRoZWFkZXIgPSB0aGlzLiRlbC5maW5kKCc+dGhlYWQnKTtcclxuICAgICAgICBpZiAoIXRoaXMuJGhlYWRlci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy4kaGVhZGVyID0gJCgnPHRoZWFkPjwvdGhlYWQ+JykuYXBwZW5kVG8odGhpcy4kZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbHVtbiA9IFtdO1xyXG5cclxuICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0aCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRml4ICMyMDE0IC0gZ2V0RmllbGRJbmRleCBhbmQgZWxzZXdoZXJlIGFzc3VtZSB0aGlzIGlzIHN0cmluZywgY2F1c2VzIGlzc3VlcyBpZiBub3RcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgJCh0aGlzKS5kYXRhKCdmaWVsZCcpICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuZGF0YSgnZmllbGQnLCAkKHRoaXMpLmRhdGEoJ2ZpZWxkJykgKyAnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb2x1bW4ucHVzaCgkLmV4dGVuZCh7fSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAkKHRoaXMpLmh0bWwoKSxcclxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiAkKHRoaXMpLmF0dHIoJ2NsYXNzJyksXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVUb29sdGlwOiAkKHRoaXMpLmF0dHIoJ3RpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbjogJCh0aGlzKS5hdHRyKCdyb3dzcGFuJykgPyArJCh0aGlzKS5hdHRyKCdyb3dzcGFuJykgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sc3BhbjogJCh0aGlzKS5hdHRyKCdjb2xzcGFuJykgPyArJCh0aGlzKS5hdHRyKCdjb2xzcGFuJykgOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sICQodGhpcykuZGF0YSgpKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoISQuaXNBcnJheSh0aGlzLm9wdGlvbnMuY29sdW1uc1swXSkpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvbHVtbnMgPSBbdGhpcy5vcHRpb25zLmNvbHVtbnNdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdGlvbnMuY29sdW1ucyA9ICQuZXh0ZW5kKHRydWUsIFtdLCBjb2x1bW5zLCB0aGlzLm9wdGlvbnMuY29sdW1ucyk7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XHJcblxyXG4gICAgICAgIHNldEZpZWxkSW5kZXgodGhpcy5vcHRpb25zLmNvbHVtbnMpO1xyXG4gICAgICAgICQuZWFjaCh0aGlzLm9wdGlvbnMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbnMpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGNvbHVtbnMsIGZ1bmN0aW9uIChqLCBjb2x1bW4pIHtcclxuICAgICAgICAgICAgICAgIGNvbHVtbiA9ICQuZXh0ZW5kKHt9LCBCb290c3RyYXBUYWJsZS5DT0xVTU5fREVGQVVMVFMsIGNvbHVtbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmllbGRJbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNvbHVtbnNbY29sdW1uLmZpZWxkSW5kZXhdID0gY29sdW1uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQub3B0aW9ucy5jb2x1bW5zW2ldW2pdID0gY29sdW1uO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gaWYgb3B0aW9ucy5kYXRhIGlzIHNldHRpbmcsIGRvIG5vdCBwcm9jZXNzIHRib2R5IGRhdGFcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBtID0gW107XHJcbiAgICAgICAgdGhpcy4kZWwuZmluZCgnPnRib2R5PnRyJykuZWFjaChmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgICAgICB2YXIgcm93ID0ge307XHJcblxyXG4gICAgICAgICAgICAvLyBzYXZlIHRyJ3MgaWQsIGNsYXNzIGFuZCBkYXRhLSogYXR0cmlidXRlc1xyXG4gICAgICAgICAgICByb3cuX2lkID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICByb3cuX2NsYXNzID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xyXG4gICAgICAgICAgICByb3cuX2RhdGEgPSBnZXRSZWFsRGF0YUF0dHIoJCh0aGlzKS5kYXRhKCkpO1xyXG5cclxuICAgICAgICAgICAgJCh0aGlzKS5maW5kKCc+dGQnKS5lYWNoKGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNzcGFuID0gKyR0aGlzLmF0dHIoJ2NvbHNwYW4nKSB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHJzcGFuID0gKyR0aGlzLmF0dHIoJ3Jvd3NwYW4nKSB8fCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHR4LCB0eTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgbVt5XSAmJiBtW3ldW3hdOyB4KyspOyAvL3NraXAgYWxyZWFkeSBvY2N1cGllZCBjZWxscyBpbiBjdXJyZW50IHJvd1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodHggPSB4OyB0eCA8IHggKyBjc3BhbjsgdHgrKykgeyAvL21hcmsgbWF0cml4IGVsZW1lbnRzIG9jY3VwaWVkIGJ5IGN1cnJlbnQgY2VsbCB3aXRoIHRydWVcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHR5ID0geTsgdHkgPCB5ICsgcnNwYW47IHR5KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtW3R5XSkgeyAvL2ZpbGwgbWlzc2luZyByb3dzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtW3R5XSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1bdHldW3R4XSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9IHRoYXQuY29sdW1uc1t4XS5maWVsZDtcclxuXHJcbiAgICAgICAgICAgICAgICByb3dbZmllbGRdID0gJCh0aGlzKS5odG1sKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBzYXZlIHRkJ3MgaWQsIGNsYXNzIGFuZCBkYXRhLSogYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19pZCddID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19jbGFzcyddID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xyXG4gICAgICAgICAgICAgICAgcm93WydfJyArIGZpZWxkICsgJ19yb3dzcGFuJ10gPSAkKHRoaXMpLmF0dHIoJ3Jvd3NwYW4nKTtcclxuICAgICAgICAgICAgICAgIHJvd1snXycgKyBmaWVsZCArICdfY29sc3BhbiddID0gJCh0aGlzKS5hdHRyKCdjb2xzcGFuJyk7XHJcbiAgICAgICAgICAgICAgICByb3dbJ18nICsgZmllbGQgKyAnX3RpdGxlJ10gPSAkKHRoaXMpLmF0dHIoJ3RpdGxlJyk7XHJcbiAgICAgICAgICAgICAgICByb3dbJ18nICsgZmllbGQgKyAnX2RhdGEnXSA9IGdldFJlYWxEYXRhQXR0cigkKHRoaXMpLmRhdGEoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkYXRhLnB1c2gocm93KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoKSB0aGlzLmZyb21IdG1sID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICB2aXNpYmxlQ29sdW1ucyA9IHt9LFxyXG4gICAgICAgICAgICBodG1sID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuaGVhZGVyID0ge1xyXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxyXG4gICAgICAgICAgICBzdHlsZXM6IFtdLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbXSxcclxuICAgICAgICAgICAgZm9ybWF0dGVyczogW10sXHJcbiAgICAgICAgICAgIGV2ZW50czogW10sXHJcbiAgICAgICAgICAgIHNvcnRlcnM6IFtdLFxyXG4gICAgICAgICAgICBzb3J0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBjZWxsU3R5bGVzOiBbXSxcclxuICAgICAgICAgICAgc2VhcmNoYWJsZXM6IFtdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMub3B0aW9ucy5jb2x1bW5zLCBmdW5jdGlvbiAoaSwgY29sdW1ucykge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSAwICYmICF0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgdGhhdC5vcHRpb25zLmRldGFpbFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8dGggY2xhc3M9XCJkZXRhaWxcIiByb3dzcGFuPVwiJXNcIj48ZGl2IGNsYXNzPVwiZmh0LWNlbGxcIj48L2Rpdj48L3RoPicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLmNvbHVtbnMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQuZWFjaChjb2x1bW5zLCBmdW5jdGlvbiAoaiwgY29sdW1uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhhbGlnbiA9ICcnLCAvLyBoZWFkZXIgYWxpZ24gc3R5bGVcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbiA9ICcnLCAvLyBib2R5IGFsaWduIHN0eWxlXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc18gPSBzcHJpbnRmKCcgY2xhc3M9XCIlc1wiJywgY29sdW1uWydjbGFzcyddKSxcclxuICAgICAgICAgICAgICAgICAgICBvcmRlciA9IHRoYXQub3B0aW9ucy5zb3J0T3JkZXIgfHwgY29sdW1uLm9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRXaWR0aCA9ICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBjb2x1bW4ud2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi53aWR0aCAhPT0gdW5kZWZpbmVkICYmICghdGhhdC5vcHRpb25zLmNhcmRWaWV3KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLndpZHRoID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sdW1uLndpZHRoLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRXaWR0aCA9ICclJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChjb2x1bW4ud2lkdGggJiYgdHlwZW9mIGNvbHVtbi53aWR0aCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IGNvbHVtbi53aWR0aC5yZXBsYWNlKCclJywgJycpLnJlcGxhY2UoJ3B4JywgJycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGhhbGlnbiA9IHNwcmludGYoJ3RleHQtYWxpZ246ICVzOyAnLCBjb2x1bW4uaGFsaWduID8gY29sdW1uLmhhbGlnbiA6IGNvbHVtbi5hbGlnbik7XHJcbiAgICAgICAgICAgICAgICBhbGlnbiA9IHNwcmludGYoJ3RleHQtYWxpZ246ICVzOyAnLCBjb2x1bW4uYWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUgPSBzcHJpbnRmKCd2ZXJ0aWNhbC1hbGlnbjogJXM7ICcsIGNvbHVtbi52YWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUgKz0gc3ByaW50Zignd2lkdGg6ICVzOyAnLCAoY29sdW1uLmNoZWNrYm94IHx8IGNvbHVtbi5yYWRpbykgJiYgIXdpZHRoID9cclxuICAgICAgICAgICAgICAgICAgICAnMzZweCcgOiAod2lkdGggPyB3aWR0aCArIHVuaXRXaWR0aCA6IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZpZWxkSW5kZXggIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuZmllbGRzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5maWVsZDtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5zdHlsZXNbY29sdW1uLmZpZWxkSW5kZXhdID0gYWxpZ24gKyBzdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5jbGFzc2VzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNsYXNzXztcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5mb3JtYXR0ZXJzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5mb3JtYXR0ZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuZXZlbnRzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5ldmVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuc29ydGVyc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uc29ydGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnNvcnROYW1lc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uc29ydE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuY2VsbFN0eWxlc1tjb2x1bW4uZmllbGRJbmRleF0gPSBjb2x1bW4uY2VsbFN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnNlYXJjaGFibGVzW2NvbHVtbi5maWVsZEluZGV4XSA9IGNvbHVtbi5zZWFyY2hhYmxlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbHVtbi52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgKCFjb2x1bW4uY2FyZFZpc2libGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGVDb2x1bW5zW2NvbHVtbi5maWVsZF0gPSBjb2x1bW47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGgnICsgc3ByaW50ZignIHRpdGxlPVwiJXNcIicsIGNvbHVtbi50aXRsZVRvb2x0aXApLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbi5jaGVja2JveCB8fCBjb2x1bW4ucmFkaW8gP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY2xhc3M9XCJicy1jaGVja2JveCAlc1wiJywgY29sdW1uWydjbGFzcyddIHx8ICcnKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzXyxcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgc3R5bGU9XCIlc1wiJywgaGFsaWduICsgc3R5bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyByb3dzcGFuPVwiJXNcIicsIGNvbHVtbi5yb3dzcGFuKSxcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY29sc3Bhbj1cIiVzXCInLCBjb2x1bW4uY29sc3BhbiksXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGRhdGEtZmllbGQ9XCIlc1wiJywgY29sdW1uLmZpZWxkKSxcclxuICAgICAgICAgICAgICAgICAgICBcInRhYmluZGV4PScwJ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICc+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHNwcmludGYoJzxkaXYgY2xhc3M9XCJ0aC1pbm5lciAlc1wiPicsIHRoYXQub3B0aW9ucy5zb3J0YWJsZSAmJiBjb2x1bW4uc29ydGFibGUgP1xyXG4gICAgICAgICAgICAgICAgICAgICdzb3J0YWJsZSBib3RoJyA6ICcnKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IGNvbHVtbi50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLmNoZWNrYm94KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0Lm9wdGlvbnMuc2luZ2xlU2VsZWN0ICYmIHRoYXQub3B0aW9ucy5jaGVja2JveEhlYWRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJzxpbnB1dCBuYW1lPVwiYnRTZWxlY3RBbGxcIiB0eXBlPVwiY2hlY2tib3hcIiAvPic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnN0YXRlRmllbGQgPSBjb2x1bW4uZmllbGQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uLnJhZGlvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLnN0YXRlRmllbGQgPSBjb2x1bW4uZmllbGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLnNpbmdsZVNlbGVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGRpdiBjbGFzcz1cImZodC1jZWxsXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RoPicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRoZWFkZXIuaHRtbChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndGhbZGF0YS1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuZGF0YSh2aXNpYmxlQ29sdW1uc1skKHRoaXMpLmRhdGEoJ2ZpZWxkJyldKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLiRjb250YWluZXIub2ZmKCdjbGljaycsICcudGgtaW5uZXInKS5vbignY2xpY2snLCAnLnRoLWlubmVyJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5kZXRhaWxWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoJy5ib290c3RyYXAtdGFibGUnKVswXSAhPT0gdGhhdC4kY29udGFpbmVyWzBdKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zb3J0YWJsZSAmJiB0YXJnZXQucGFyZW50KCkuZGF0YSgpLnNvcnRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm9uU29ydChldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaGVhZGVyLmNoaWxkcmVuKCkuY2hpbGRyZW4oKS5vZmYoJ2tleXByZXNzJykub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuc29ydGFibGUgJiYgJCh0aGlzKS5kYXRhKCkuc29ydGFibGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlID09IDEzKSB7IC8vRW50ZXIga2V5Y29kZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQub25Tb3J0KGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuYm9vdHN0cmFwLXRhYmxlJyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hvd0hlYWRlciB8fCB0aGlzLm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy4kaGVhZGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUxvYWRpbmcuY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRoZWFkZXIuc2hvdygpO1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUhlYWRlci5zaG93KCk7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZy5jc3MoJ3RvcCcsIHRoaXMuJGhlYWRlci5vdXRlckhlaWdodCgpICsgMSk7XHJcbiAgICAgICAgICAgIC8vIEFzc2lnbiB0aGUgY29ycmVjdCBzb3J0YWJsZSBhcnJvd1xyXG4gICAgICAgICAgICB0aGlzLmdldENhcmV0KCk7XHJcbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplLmJvb3RzdHJhcC10YWJsZScsICQucHJveHkodGhpcy5yZXNldFdpZHRoLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RBbGwgPSB0aGlzLiRoZWFkZXIuZmluZCgnW25hbWU9XCJidFNlbGVjdEFsbFwiXScpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdEFsbC5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgICAgIHRoYXRbY2hlY2tlZCA/ICdjaGVja0FsbCcgOiAndW5jaGVja0FsbCddKCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdEZvb3RlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5zaG93Rm9vdGVyIHx8IHRoaXMub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUZvb3Rlci5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVGb290ZXIuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gZGF0YVxyXG4gICAgICogQHBhcmFtIHR5cGU6IGFwcGVuZCAvIHByZXBlbmRcclxuICAgICAqL1xyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXREYXRhID0gZnVuY3Rpb24gKGRhdGEsIHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PT0gJ2FwcGVuZCcpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhLmNvbmNhdChkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdwcmVwZW5kJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXS5jb25jYXQoZGF0YSkuY29uY2F0KHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YSB8fCB0aGlzLm9wdGlvbnMuZGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpeCAjODM5IFJlY29yZHMgZGVsZXRlZCB3aGVuIGFkZGluZyBuZXcgcm93IG9uIGZpbHRlcmVkIHRhYmxlXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdhcHBlbmQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhID0gdGhpcy5vcHRpb25zLmRhdGEuY29uY2F0KGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3ByZXBlbmQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhID0gW10uY29uY2F0KGRhdGEpLmNvbmNhdCh0aGlzLm9wdGlvbnMuZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRhdGEgPSB0aGlzLmRhdGE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpZGVQYWdpbmF0aW9uID09PSAnc2VydmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRTb3J0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgbmFtZSA9IHRoaXMub3B0aW9ucy5zb3J0TmFtZSxcclxuICAgICAgICAgICAgb3JkZXIgPSB0aGlzLm9wdGlvbnMuc29ydE9yZGVyID09PSAnZGVzYycgPyAtMSA6IDEsXHJcbiAgICAgICAgICAgIGluZGV4ID0gJC5pbkFycmF5KHRoaXMub3B0aW9ucy5zb3J0TmFtZSwgdGhpcy5oZWFkZXIuZmllbGRzKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jdXN0b21Tb3J0ICE9PSAkLm5vb3ApIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmN1c3RvbVNvcnQuYXBwbHkodGhpcywgW3RoaXMub3B0aW9ucy5zb3J0TmFtZSwgdGhpcy5vcHRpb25zLnNvcnRPcmRlcl0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc29ydFN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHRoaXMuZGF0YSwgZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcm93Lmhhc093blByb3BlcnR5KCdfcG9zaXRpb24nKSkgcm93Ll9wb3NpdGlvbiA9IGk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmhlYWRlci5zb3J0TmFtZXNbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IHRoYXQuaGVhZGVyLnNvcnROYW1lc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYWEgPSBnZXRJdGVtRmllbGQoYSwgbmFtZSwgdGhhdC5vcHRpb25zLmVzY2FwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBnZXRJdGVtRmllbGQoYiwgbmFtZSwgdGhhdC5vcHRpb25zLmVzY2FwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGF0LmhlYWRlciwgdGhhdC5oZWFkZXIuc29ydGVyc1tpbmRleF0sIFthYSwgYmJdKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmRlciAqIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZpeCAjMTYxOiB1bmRlZmluZWQgb3IgbnVsbCBzdHJpbmcgc29ydCBidWcuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWEgPT09IHVuZGVmaW5lZCB8fCBhYSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gJyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYmIgPT09IHVuZGVmaW5lZCB8fCBiYiA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJiID0gJyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zb3J0U3RhYmxlICYmIGFhID09PSBiYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gYS5fcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBiLl9wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJRiBib3RoIHZhbHVlcyBhcmUgbnVtZXJpYywgZG8gYSBudW1lcmljIGNvbXBhcmlzb25cclxuICAgICAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyhhYSkgJiYgJC5pc051bWVyaWMoYmIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCBudW1lcmljYWwgdmFsdWVzIGZvcm0gc3RyaW5nIHRvIGZsb2F0LlxyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gcGFyc2VGbG9hdChhYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBwYXJzZUZsb2F0KGJiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWEgPCBiYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JkZXIgKiAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhYSA9PT0gYmIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB2YWx1ZSBpcyBub3QgYSBzdHJpbmcsIGNvbnZlcnQgdG8gc3RyaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFhICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFhID0gYWEudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWEubG9jYWxlQ29tcGFyZShiYikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyICogLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yZGVyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblNvcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSBldmVudC50eXBlID09PSBcImtleXByZXNzXCIgPyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpIDogJChldmVudC5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKSxcclxuICAgICAgICAgICAgJHRoaXNfID0gdGhpcy4kaGVhZGVyLmZpbmQoJ3RoJykuZXEoJHRoaXMuaW5kZXgoKSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhlYWRlci5hZGQodGhpcy4kaGVhZGVyXykuZmluZCgnc3Bhbi5vcmRlcicpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNvcnROYW1lID09PSAkdGhpcy5kYXRhKCdmaWVsZCcpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIgPSB0aGlzLm9wdGlvbnMuc29ydE9yZGVyID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0TmFtZSA9ICR0aGlzLmRhdGEoJ2ZpZWxkJyk7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIgPSAkdGhpcy5kYXRhKCdvcmRlcicpID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NvcnQnLCB0aGlzLm9wdGlvbnMuc29ydE5hbWUsIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIpO1xyXG5cclxuICAgICAgICAkdGhpcy5hZGQoJHRoaXNfKS5kYXRhKCdvcmRlcicsIHRoaXMub3B0aW9ucy5zb3J0T3JkZXIpO1xyXG5cclxuICAgICAgICAvLyBBc3NpZ24gdGhlIGNvcnJlY3Qgc29ydGFibGUgYXJyb3dcclxuICAgICAgICB0aGlzLmdldENhcmV0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lkZVBhZ2luYXRpb24gPT09ICdzZXJ2ZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdFNlcnZlcih0aGlzLm9wdGlvbnMuc2lsZW50U29ydCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0VG9vbGJhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGh0bWwgPSBbXSxcclxuICAgICAgICAgICAgdGltZW91dElkID0gMCxcclxuICAgICAgICAgICAgJGtlZXBPcGVuLFxyXG4gICAgICAgICAgICAkc2VhcmNoLFxyXG4gICAgICAgICAgICBzd2l0Y2hhYmxlQ291bnQgPSAwO1xyXG5cclxuICAgICAgICBpZiAodGhpcy4kdG9vbGJhci5maW5kKCcuYnMtYmFycycpLmNoaWxkcmVuKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoJCh0aGlzLm9wdGlvbnMudG9vbGJhcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiR0b29sYmFyLmh0bWwoJycpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50b29sYmFyID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLnRvb2xiYXIgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICQoc3ByaW50ZignPGRpdiBjbGFzcz1cImJzLWJhcnMgcHVsbC0lc1wiPjwvZGl2PicsIHRoaXMub3B0aW9ucy50b29sYmFyQWxpZ24pKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuJHRvb2xiYXIpXHJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCQodGhpcy5vcHRpb25zLnRvb2xiYXIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNob3dDb2x1bW5zLCBzaG93VG9nZ2xlLCBzaG93UmVmcmVzaFxyXG4gICAgICAgIGh0bWwgPSBbc3ByaW50ZignPGRpdiBjbGFzcz1cImNvbHVtbnMgY29sdW1ucy0lcyBidG4tZ3JvdXAgcHVsbC0lc1wiPicsXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5idXR0b25zQWxpZ24sIHRoaXMub3B0aW9ucy5idXR0b25zQWxpZ24pXTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuaWNvbnMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pY29ucyA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKG51bGwsIHRoaXMub3B0aW9ucy5pY29ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dQYWdpbmF0aW9uU3dpdGNoKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8YnV0dG9uIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5idXR0b25zQ2xhc3MpICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1wiIHR5cGU9XCJidXR0b25cIiBuYW1lPVwicGFnaW5hdGlvblN3aXRjaFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRQYWdpbmF0aW9uU3dpdGNoKCkpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignPGkgY2xhc3M9XCIlcyAlc1wiPjwvaT4nLCB0aGlzLm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoaXMub3B0aW9ucy5pY29ucy5wYWdpbmF0aW9uU3dpdGNoRG93biksXHJcbiAgICAgICAgICAgICAgICAnPC9idXR0b24+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dSZWZyZXNoKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8YnV0dG9uIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5idXR0b25zQ2xhc3MpICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmljb25TaXplKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1wiIHR5cGU9XCJidXR0b25cIiBuYW1lPVwicmVmcmVzaFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRSZWZyZXNoKCkpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignPGkgY2xhc3M9XCIlcyAlc1wiPjwvaT4nLCB0aGlzLm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoaXMub3B0aW9ucy5pY29ucy5yZWZyZXNoKSxcclxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1RvZ2dsZSkge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goc3ByaW50ZignPGJ1dHRvbiBjbGFzcz1cImJ0bicgK1xyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBidG4tJXMnLCB0aGlzLm9wdGlvbnMuYnV0dG9uc0NsYXNzKSArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICdcIiB0eXBlPVwiYnV0dG9uXCIgbmFtZT1cInRvZ2dsZVwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRUb2dnbGUoKSksXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCc8aSBjbGFzcz1cIiVzICVzXCI+PC9pPicsIHRoaXMub3B0aW9ucy5pY29uc1ByZWZpeCwgdGhpcy5vcHRpb25zLmljb25zLnRvZ2dsZSksXHJcbiAgICAgICAgICAgICAgICAnPC9idXR0b24+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dDb2x1bW5zKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaChzcHJpbnRmKCc8ZGl2IGNsYXNzPVwia2VlcC1vcGVuIGJ0bi1ncm91cFwiIHRpdGxlPVwiJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mb3JtYXRDb2x1bW5zKCkpLFxyXG4gICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuJyArXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCcgYnRuLSVzJywgdGhpcy5vcHRpb25zLmJ1dHRvbnNDbGFzcykgK1xyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgJyBkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCI+JyxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJzxpIGNsYXNzPVwiJXMgJXNcIj48L2k+JywgdGhpcy5vcHRpb25zLmljb25zUHJlZml4LCB0aGlzLm9wdGlvbnMuaWNvbnMuY29sdW1ucyksXHJcbiAgICAgICAgICAgICAgICAnIDxzcGFuIGNsYXNzPVwiY2FyZXRcIj48L3NwYW4+JyxcclxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nLFxyXG4gICAgICAgICAgICAgICAgJzx1bCBjbGFzcz1cImRyb3Bkb3duLW1lbnVcIiByb2xlPVwibWVudVwiPicpO1xyXG5cclxuICAgICAgICAgICAgJC5lYWNoKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi5yYWRpbyB8fCBjb2x1bW4uY2hlY2tib3gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5jYXJkVmlldyAmJiAhY29sdW1uLmNhcmRWaXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjaGVja2VkID0gY29sdW1uLnZpc2libGUgPyAnIGNoZWNrZWQ9XCJjaGVja2VkXCInIDogJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi5zd2l0Y2hhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKHNwcmludGYoJzxsaT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbD48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgZGF0YS1maWVsZD1cIiVzXCIgdmFsdWU9XCIlc1wiJXM+ICVzPC9sYWJlbD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGk+JywgY29sdW1uLmZpZWxkLCBpLCBjaGVja2VkLCBjb2x1bW4udGl0bGUpKTtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2hhYmxlQ291bnQrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPC91bD4nLFxyXG4gICAgICAgICAgICAgICAgJzwvZGl2PicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgLy8gRml4ICMxODg6IHRoaXMuc2hvd1Rvb2xiYXIgaXMgZm9yIGV4dGVuc2lvbnNcclxuICAgICAgICBpZiAodGhpcy5zaG93VG9vbGJhciB8fCBodG1sLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgICAgdGhpcy4kdG9vbGJhci5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dQYWdpbmF0aW9uU3dpdGNoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRvb2xiYXIuZmluZCgnYnV0dG9uW25hbWU9XCJwYWdpbmF0aW9uU3dpdGNoXCJdJylcclxuICAgICAgICAgICAgICAgIC5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLnRvZ2dsZVBhZ2luYXRpb24sIHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1JlZnJlc2gpIHtcclxuICAgICAgICAgICAgdGhpcy4kdG9vbGJhci5maW5kKCdidXR0b25bbmFtZT1cInJlZnJlc2hcIl0nKVxyXG4gICAgICAgICAgICAgICAgLm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMucmVmcmVzaCwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93VG9nZ2xlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRvb2xiYXIuZmluZCgnYnV0dG9uW25hbWU9XCJ0b2dnbGVcIl0nKVxyXG4gICAgICAgICAgICAgICAgLm9mZignY2xpY2snKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC50b2dnbGVWaWV3KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd0NvbHVtbnMpIHtcclxuICAgICAgICAgICAgJGtlZXBPcGVuID0gdGhpcy4kdG9vbGJhci5maW5kKCcua2VlcC1vcGVuJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3dpdGNoYWJsZUNvdW50IDw9IHRoaXMub3B0aW9ucy5taW5pbXVtQ291bnRDb2x1bW5zKSB7XHJcbiAgICAgICAgICAgICAgICAka2VlcE9wZW4uZmluZCgnaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAka2VlcE9wZW4uZmluZCgnbGknKS5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICRrZWVwT3Blbi5maW5kKCdpbnB1dCcpLm9mZignY2xpY2snKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQudG9nZ2xlQ29sdW1uKCQodGhpcykudmFsKCksICR0aGlzLnByb3AoJ2NoZWNrZWQnKSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKCdjb2x1bW4tc3dpdGNoJywgJCh0aGlzKS5kYXRhKCdmaWVsZCcpLCAkdGhpcy5wcm9wKCdjaGVja2VkJykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VhcmNoKSB7XHJcbiAgICAgICAgICAgIGh0bWwgPSBbXTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwdWxsLScgKyB0aGlzLm9wdGlvbnMuc2VhcmNoQWxpZ24gKyAnIHNlYXJjaFwiPicsXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2wnICtcclxuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgaW5wdXQtJXMnLCB0aGlzLm9wdGlvbnMuaWNvblNpemUpICtcclxuICAgICAgICAgICAgICAgICAgICAnXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIiVzXCI+JyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZm9ybWF0U2VhcmNoKCkpLFxyXG4gICAgICAgICAgICAgICAgJzwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kdG9vbGJhci5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgICRzZWFyY2ggPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5zZWFyY2ggaW5wdXQnKTtcclxuICAgICAgICAgICAgJHNlYXJjaC5vZmYoJ2tleXVwIGRyb3AnKS5vbigna2V5dXAgZHJvcCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zZWFyY2hPbkVudGVyS2V5ICYmIGV2ZW50LmtleUNvZGUgIT09IDEzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkoZXZlbnQua2V5Q29kZSwgWzM3LCAzOCwgMzksIDQwXSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTsgLy8gZG9lc24ndCBtYXR0ZXIgaWYgaXQncyAwXHJcbiAgICAgICAgICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm9uU2VhcmNoKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH0sIHRoYXQub3B0aW9ucy5zZWFyY2hUaW1lT3V0KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNJRUJyb3dzZXIoKSkge1xyXG4gICAgICAgICAgICAgICAgJHNlYXJjaC5vZmYoJ21vdXNldXAnKS5vbignbW91c2V1cCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpOyAvLyBkb2Vzbid0IG1hdHRlciBpZiBpdCdzIDBcclxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5vblNlYXJjaChldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhhdC5vcHRpb25zLnNlYXJjaFRpbWVPdXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblNlYXJjaCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gJC50cmltKCQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCkpO1xyXG5cclxuICAgICAgICAvLyB0cmltIHNlYXJjaCBpbnB1dFxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJpbU9uU2VhcmNoICYmICQoZXZlbnQuY3VycmVudFRhcmdldCkudmFsKCkgIT09IHRleHQpIHtcclxuICAgICAgICAgICAgJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwodGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGV4dCA9PT0gdGhpcy5zZWFyY2hUZXh0KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWFyY2hUZXh0ID0gdGV4dDtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuc2VhcmNoVGV4dCA9IHRleHQ7XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gMTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlYXJjaCcsIHRleHQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdFNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lkZVBhZ2luYXRpb24gIT09ICdzZXJ2ZXInKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY3VzdG9tU2VhcmNoICE9PSAkLm5vb3ApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jdXN0b21TZWFyY2guYXBwbHkodGhpcywgW3RoaXMuc2VhcmNoVGV4dF0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMuc2VhcmNoVGV4dCAmJiAodGhpcy5vcHRpb25zLmVzY2FwZSA/XHJcbiAgICAgICAgICAgICAgICBlc2NhcGVIVE1MKHRoaXMuc2VhcmNoVGV4dCkgOiB0aGlzLnNlYXJjaFRleHQpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHZhciBmID0gJC5pc0VtcHR5T2JqZWN0KHRoaXMuZmlsdGVyQ29sdW1ucykgPyBudWxsIDogdGhpcy5maWx0ZXJDb2x1bW5zO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZmlsdGVyXHJcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGYgPyAkLmdyZXAodGhpcy5vcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpdGVtLCBpKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkoZltrZXldKSAmJiAkLmluQXJyYXkoaXRlbVtrZXldLCBmW2tleV0pID09PSAtMSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVtrZXldICE9PSBmW2tleV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9KSA6IHRoaXMub3B0aW9ucy5kYXRhO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gcyA/ICQuZ3JlcCh0aGlzLmRhdGEsIGZ1bmN0aW9uIChpdGVtLCBpKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoYXQuaGVhZGVyLmZpZWxkcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuaGVhZGVyLnNlYXJjaGFibGVzW2pdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9ICQuaXNOdW1lcmljKHRoYXQuaGVhZGVyLmZpZWxkc1tqXSkgPyBwYXJzZUludCh0aGF0LmhlYWRlci5maWVsZHNbal0sIDEwKSA6IHRoYXQuaGVhZGVyLmZpZWxkc1tqXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sdW1uID0gdGhhdC5jb2x1bW5zW2dldEZpZWxkSW5kZXgodGhhdC5jb2x1bW5zLCBrZXkpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IGtleS5zcGxpdCgnLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wX2luZGV4ID0gMDsgcHJvcF9pbmRleCA8IHByb3BzLmxlbmd0aDsgcHJvcF9pbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlW3Byb3BzW3Byb3BfaW5kZXhdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4ICMxNDI6IHJlc3BlY3Qgc2VhcmNoRm9yYW10dGVyIGJvb2xlYW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbHVtbiAmJiBjb2x1bW4uc2VhcmNoRm9ybWF0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKGNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5mb3JtYXR0ZXJzW2pdLCBbdmFsdWUsIGl0ZW0sIGldLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGl0ZW1ba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zdHJpY3RTZWFyY2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodmFsdWUgKyAnJykudG9Mb3dlckNhc2UoKSA9PT0gcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh2YWx1ZSArICcnKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pIDogdGhpcy5kYXRhO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRQYWdpbmF0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnBhZ2luYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy4kcGFnaW5hdGlvbi5oaWRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRwYWdpbmF0aW9uLnNob3coKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgaHRtbCA9IFtdLFxyXG4gICAgICAgICAgICAkYWxsU2VsZWN0ZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgaSwgZnJvbSwgdG8sXHJcbiAgICAgICAgICAgICRwYWdlTGlzdCxcclxuICAgICAgICAgICAgJGZpcnN0LCAkcHJlLFxyXG4gICAgICAgICAgICAkbmV4dCwgJGxhc3QsXHJcbiAgICAgICAgICAgICRudW1iZXIsXHJcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLmdldERhdGEoKSxcclxuICAgICAgICAgICAgcGFnZUxpc3QgPSB0aGlzLm9wdGlvbnMucGFnZUxpc3Q7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lkZVBhZ2luYXRpb24gIT09ICdzZXJ2ZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50b3RhbFJvd3MgPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudG90YWxQYWdlcyA9IDA7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50b3RhbFJvd3MpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlU2l6ZSA9PT0gdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VTaXplID0gdGhpcy5vcHRpb25zLnRvdGFsUm93cztcclxuICAgICAgICAgICAgICAgICRhbGxTZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnBhZ2VTaXplID09PSB0aGlzLm9wdGlvbnMudG90YWxSb3dzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGaXggIzY2NyBUYWJsZSB3aXRoIHBhZ2luYXRpb24sXHJcbiAgICAgICAgICAgICAgICAvLyBtdWx0aXBsZSBwYWdlcyBhbmQgYSBzZWFyY2ggdGhhdCBtYXRjaGVzIHRvIG9uZSBwYWdlIHRocm93cyBleGNlcHRpb25cclxuICAgICAgICAgICAgICAgIHZhciBwYWdlTHN0ID0gdHlwZW9mIHRoaXMub3B0aW9ucy5wYWdlTGlzdCA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTGlzdC5yZXBsYWNlKCdbJywgJycpLnJlcGxhY2UoJ10nLCAnJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyAvZywgJycpLnRvTG93ZXJDYXNlKCkuc3BsaXQoJywnKSA6IHRoaXMub3B0aW9ucy5wYWdlTGlzdDtcclxuICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkodGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKS50b0xvd2VyQ2FzZSgpLCBwYWdlTHN0KSAgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRhbGxTZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudG90YWxQYWdlcyA9IH5+KCh0aGlzLm9wdGlvbnMudG90YWxSb3dzIC0gMSkgLyB0aGlzLm9wdGlvbnMucGFnZVNpemUpICsgMTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50b3RhbFBhZ2VzID0gdGhpcy50b3RhbFBhZ2VzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID4gMCAmJiB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA+IHRoaXMudG90YWxQYWdlcykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IHRoaXMudG90YWxQYWdlcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucGFnZUZyb20gPSAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgLSAxKSAqIHRoaXMub3B0aW9ucy5wYWdlU2l6ZSArIDE7XHJcbiAgICAgICAgdGhpcy5wYWdlVG8gPSB0aGlzLm9wdGlvbnMucGFnZU51bWJlciAqIHRoaXMub3B0aW9ucy5wYWdlU2l6ZTtcclxuICAgICAgICBpZiAodGhpcy5wYWdlVG8gPiB0aGlzLm9wdGlvbnMudG90YWxSb3dzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZVRvID0gdGhpcy5vcHRpb25zLnRvdGFsUm93cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGh0bWwucHVzaChcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwdWxsLScgKyB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkRldGFpbEhBbGlnbiArICcgcGFnaW5hdGlvbi1kZXRhaWxcIj4nLFxyXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJwYWdpbmF0aW9uLWluZm9cIj4nLFxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMub25seUluZm9QYWdpbmF0aW9uID8gdGhpcy5vcHRpb25zLmZvcm1hdERldGFpbFBhZ2luYXRpb24odGhpcy5vcHRpb25zLnRvdGFsUm93cykgOlxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZm9ybWF0U2hvd2luZ1Jvd3ModGhpcy5wYWdlRnJvbSwgdGhpcy5wYWdlVG8sIHRoaXMub3B0aW9ucy50b3RhbFJvd3MpLFxyXG4gICAgICAgICAgICAnPC9zcGFuPicpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5vbmx5SW5mb1BhZ2luYXRpb24pIHtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8c3BhbiBjbGFzcz1cInBhZ2UtbGlzdFwiPicpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhZ2VOdW1iZXIgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignPHNwYW4gY2xhc3M9XCJidG4tZ3JvdXAgJXNcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnaW5hdGlvblZBbGlnbiA9PT0gJ3RvcCcgfHwgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25WQWxpZ24gPT09ICdib3RoJyA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZHJvcGRvd24nIDogJ2Ryb3B1cCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0bicgK1xyXG4gICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBidG4tJXMnLCB0aGlzLm9wdGlvbnMuYnV0dG9uc0NsYXNzKSArXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGJ0bi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICcgZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwicGFnZS1zaXplXCI+JyxcclxuICAgICAgICAgICAgICAgICAgICAkYWxsU2VsZWN0ZWQgPyB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpIDogdGhpcy5vcHRpb25zLnBhZ2VTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICc8L3NwYW4+JyxcclxuICAgICAgICAgICAgICAgICAgICAnIDxzcGFuIGNsYXNzPVwiY2FyZXRcIj48L3NwYW4+JyxcclxuICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JyxcclxuICAgICAgICAgICAgICAgICAgICAnPHVsIGNsYXNzPVwiZHJvcGRvd24tbWVudVwiIHJvbGU9XCJtZW51XCI+J1xyXG4gICAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnBhZ2VMaXN0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSB0aGlzLm9wdGlvbnMucGFnZUxpc3QucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyAvZywgJycpLnNwbGl0KCcsJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcGFnZUxpc3QgPSBbXTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChsaXN0LCBmdW5jdGlvbiAoaSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYWdlTGlzdC5wdXNoKHZhbHVlLnRvVXBwZXJDYXNlKCkgPT09IHRoYXQub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCkudG9VcHBlckNhc2UoKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCkgOiArdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQuZWFjaChwYWdlTGlzdCwgZnVuY3Rpb24gKGksIHBhZ2UpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhhdC5vcHRpb25zLnNtYXJ0RGlzcGxheSB8fCBpID09PSAwIHx8IHBhZ2VMaXN0W2kgLSAxXSA8PSB0aGF0Lm9wdGlvbnMudG90YWxSb3dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJGFsbFNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IHBhZ2UgPT09IHRoYXQub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCkgPyAnIGNsYXNzPVwiYWN0aXZlXCInIDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gcGFnZSA9PT0gdGhhdC5vcHRpb25zLnBhZ2VTaXplID8gJyBjbGFzcz1cImFjdGl2ZVwiJyA6ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwYWdlTnVtYmVyLnB1c2goc3ByaW50ZignPGxpJXM+PGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPiVzPC9hPjwvbGk+JywgYWN0aXZlLCBwYWdlKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyLnB1c2goJzwvdWw+PC9zcGFuPicpO1xyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKHRoaXMub3B0aW9ucy5mb3JtYXRSZWNvcmRzUGVyUGFnZShwYWdlTnVtYmVyLmpvaW4oJycpKSk7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPC9zcGFuPicpO1xyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nLFxyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwdWxsLScgKyB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkhBbGlnbiArICcgcGFnaW5hdGlvblwiPicsXHJcbiAgICAgICAgICAgICAgICAnPHVsIGNsYXNzPVwicGFnaW5hdGlvbicgKyBzcHJpbnRmKCcgcGFnaW5hdGlvbi0lcycsIHRoaXMub3B0aW9ucy5pY29uU2l6ZSkgKyAnXCI+JyxcclxuICAgICAgICAgICAgICAgICc8bGkgY2xhc3M9XCJwYWdlLXByZVwiPjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4nICsgdGhpcy5vcHRpb25zLnBhZ2luYXRpb25QcmVUZXh0ICsgJzwvYT48L2xpPicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcyA8IDUpIHtcclxuICAgICAgICAgICAgICAgIGZyb20gPSAxO1xyXG4gICAgICAgICAgICAgICAgdG8gPSB0aGlzLnRvdGFsUGFnZXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmcm9tID0gdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgLSAyO1xyXG4gICAgICAgICAgICAgICAgdG8gPSBmcm9tICsgNDtcclxuICAgICAgICAgICAgICAgIGlmIChmcm9tIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvID0gNTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0byA+IHRoaXMudG90YWxQYWdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRvID0gdGhpcy50b3RhbFBhZ2VzO1xyXG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSB0byAtIDQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPj0gNikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID49IDMpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cInBhZ2UtZmlyc3QnICsgKDEgPT09IHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID8gJyBhY3RpdmUnIDogJycpICsgJ1wiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+JywgMSwgJzwvYT4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9saT4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA+PSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID09IDQgfHwgdGhpcy50b3RhbFBhZ2VzID09IDYgfHwgdGhpcy50b3RhbFBhZ2VzID09IDcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS0tO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwicGFnZS1maXJzdC1zZXBhcmF0b3IgZGlzYWJsZWRcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4uLi48L2E+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdG8tLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcyA+PSA3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPj0gKHRoaXMudG90YWxQYWdlcyAtIDIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbS0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID09IDYpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA+PSAodGhpcy50b3RhbFBhZ2VzIC0gMikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0bysrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMudG90YWxQYWdlcyA+PSA3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID09IDcgfHwgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPj0gKHRoaXMudG90YWxQYWdlcyAtIDMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG8rKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gZnJvbTsgaSA8PSB0bzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cInBhZ2UtbnVtYmVyJyArIChpID09PSB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA/ICcgYWN0aXZlJyA6ICcnKSArICdcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+JywgaSwgJzwvYT4nLFxyXG4gICAgICAgICAgICAgICAgICAgICc8L2xpPicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzID49IDgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA8PSAodGhpcy50b3RhbFBhZ2VzIC0gNCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cInBhZ2UtbGFzdC1zZXBhcmF0b3IgZGlzYWJsZWRcIj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPi4uLjwvYT4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9saT4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcyA+PSA2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPD0gKHRoaXMudG90YWxQYWdlcyAtIDMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJwYWdlLWxhc3QnICsgKHRoaXMudG90YWxQYWdlcyA9PT0gdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPyAnIGFjdGl2ZScgOiAnJykgKyAnXCI+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj4nLCB0aGlzLnRvdGFsUGFnZXMsICc8L2E+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGh0bWwucHVzaChcclxuICAgICAgICAgICAgICAgICc8bGkgY2xhc3M9XCJwYWdlLW5leHRcIj48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+JyArIHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uTmV4dFRleHQgKyAnPC9hPjwvbGk+JyxcclxuICAgICAgICAgICAgICAgICc8L3VsPicsXHJcbiAgICAgICAgICAgICAgICAnPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJHBhZ2luYXRpb24uaHRtbChodG1sLmpvaW4oJycpKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMub25seUluZm9QYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgICRwYWdlTGlzdCA9IHRoaXMuJHBhZ2luYXRpb24uZmluZCgnLnBhZ2UtbGlzdCBhJyk7XHJcbiAgICAgICAgICAgICRmaXJzdCA9IHRoaXMuJHBhZ2luYXRpb24uZmluZCgnLnBhZ2UtZmlyc3QnKTtcclxuICAgICAgICAgICAgJHByZSA9IHRoaXMuJHBhZ2luYXRpb24uZmluZCgnLnBhZ2UtcHJlJyk7XHJcbiAgICAgICAgICAgICRuZXh0ID0gdGhpcy4kcGFnaW5hdGlvbi5maW5kKCcucGFnZS1uZXh0Jyk7XHJcbiAgICAgICAgICAgICRsYXN0ID0gdGhpcy4kcGFnaW5hdGlvbi5maW5kKCcucGFnZS1sYXN0Jyk7XHJcbiAgICAgICAgICAgICRudW1iZXIgPSB0aGlzLiRwYWdpbmF0aW9uLmZpbmQoJy5wYWdlLW51bWJlcicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zbWFydERpc3BsYXkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHBhZ2luYXRpb24uZmluZCgnZGl2LnBhZ2luYXRpb24nKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocGFnZUxpc3QubGVuZ3RoIDwgMiB8fCB0aGlzLm9wdGlvbnMudG90YWxSb3dzIDw9IHBhZ2VMaXN0WzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcGFnaW5hdGlvbi5maW5kKCdzcGFuLnBhZ2UtbGlzdCcpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyB3aGVuIGRhdGEgaXMgZW1wdHksIGhpZGUgdGhlIHBhZ2luYXRpb25cclxuICAgICAgICAgICAgICAgIHRoaXMuJHBhZ2luYXRpb25bdGhpcy5nZXREYXRhKCkubGVuZ3RoID8gJ3Nob3cnIDogJ2hpZGUnXSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkYWxsU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlU2l6ZSA9IHRoaXMub3B0aW9ucy5mb3JtYXRBbGxSb3dzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHBhZ2VMaXN0Lm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdlTGlzdENoYW5nZSwgdGhpcykpO1xyXG4gICAgICAgICAgICAkZmlyc3Qub2ZmKCdjbGljaycpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2VGaXJzdCwgdGhpcykpO1xyXG4gICAgICAgICAgICAkcHJlLm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdlUHJlLCB0aGlzKSk7XHJcbiAgICAgICAgICAgICRuZXh0Lm9mZignY2xpY2snKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdlTmV4dCwgdGhpcykpO1xyXG4gICAgICAgICAgICAkbGFzdC5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnZUxhc3QsIHRoaXMpKTtcclxuICAgICAgICAgICAgJG51bWJlci5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnZU51bWJlciwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnVwZGF0ZVBhZ2luYXRpb24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAvLyBGaXggIzE3MTogSUUgZGlzYWJsZWQgYnV0dG9uIGNhbiBiZSBjbGlja2VkIGJ1Zy5cclxuICAgICAgICBpZiAoZXZlbnQgJiYgJChldmVudC5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5tYWludGFpblNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRSb3dzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWRlUGFnaW5hdGlvbiA9PT0gJ3NlcnZlcicpIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0U2VydmVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdwYWdlLWNoYW5nZScsIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyLCB0aGlzLm9wdGlvbnMucGFnZVNpemUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUub25QYWdlTGlzdENoYW5nZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQoZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblxyXG4gICAgICAgICR0aGlzLnBhcmVudCgpLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMucGFnZVNpemUgPSAkdGhpcy50ZXh0KCkudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKS50b1VwcGVyQ2FzZSgpID9cclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSA6ICskdGhpcy50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy4kdG9vbGJhci5maW5kKCcucGFnZS1zaXplJykudGV4dCh0aGlzLm9wdGlvbnMucGFnZVNpemUpO1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oZXZlbnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUub25QYWdlRmlyc3QgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IDE7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKGV2ZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm9uUGFnZVByZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmICgodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgLSAxKSA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IHRoaXMub3B0aW9ucy50b3RhbFBhZ2VzO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbihldmVudCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblBhZ2VOZXh0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCh0aGlzLm9wdGlvbnMucGFnZU51bWJlciArIDEpID4gdGhpcy5vcHRpb25zLnRvdGFsUGFnZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbihldmVudCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5vblBhZ2VMYXN0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSB0aGlzLnRvdGFsUGFnZXM7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKGV2ZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLm9uUGFnZU51bWJlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9PT0gKyQoZXZlbnQuY3VycmVudFRhcmdldCkudGV4dCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSArJChldmVudC5jdXJyZW50VGFyZ2V0KS50ZXh0KCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKGV2ZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRCb2R5ID0gZnVuY3Rpb24gKGZpeGVkU2Nyb2xsKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBodG1sID0gW10sXHJcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLmdldERhdGEoKTtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdwcmUtYm9keScsIGRhdGEpO1xyXG5cclxuICAgICAgICB0aGlzLiRib2R5ID0gdGhpcy4kZWwuZmluZCgnPnRib2R5Jyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLiRib2R5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLiRib2R5ID0gJCgnPHRib2R5PjwvdGJvZHk+JykuYXBwZW5kVG8odGhpcy4kZWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9GaXggIzM4OSBCb290c3RyYXAtdGFibGUtZmxhdEpTT04gaXMgbm90IHdvcmtpbmdcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucGFnaW5hdGlvbiB8fCB0aGlzLm9wdGlvbnMuc2lkZVBhZ2luYXRpb24gPT09ICdzZXJ2ZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZUZyb20gPSAxO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VUbyA9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMucGFnZUZyb20gLSAxOyBpIDwgdGhpcy5wYWdlVG87IGkrKykge1xyXG4gICAgICAgICAgICB2YXIga2V5LFxyXG4gICAgICAgICAgICAgICAgaXRlbSA9IGRhdGFbaV0sXHJcbiAgICAgICAgICAgICAgICBzdHlsZSA9IHt9LFxyXG4gICAgICAgICAgICAgICAgY3NzZXMgPSBbXSxcclxuICAgICAgICAgICAgICAgIGRhdGFfID0gJycsXHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzID0ge30sXHJcbiAgICAgICAgICAgICAgICBodG1sQXR0cmlidXRlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgc3R5bGUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGlzLm9wdGlvbnMsIHRoaXMub3B0aW9ucy5yb3dTdHlsZSwgW2l0ZW0sIGldLCBzdHlsZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3R5bGUgJiYgc3R5bGUuY3NzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBzdHlsZS5jc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBjc3Nlcy5wdXNoKGtleSArICc6ICcgKyBzdHlsZS5jc3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucm93QXR0cmlidXRlcywgW2l0ZW0sIGldLCBhdHRyaWJ1dGVzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBhdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbEF0dHJpYnV0ZXMucHVzaChzcHJpbnRmKCclcz1cIiVzXCInLCBrZXksIGVzY2FwZUhUTUwoYXR0cmlidXRlc1trZXldKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXRlbS5fZGF0YSAmJiAhJC5pc0VtcHR5T2JqZWN0KGl0ZW0uX2RhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goaXRlbS5fZGF0YSwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmUgZGF0YS1pbmRleFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrID09PSAnaW5kZXgnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YV8gKz0gc3ByaW50ZignIGRhdGEtJXM9XCIlc1wiJywgaywgdik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHInLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignICVzJywgaHRtbEF0dHJpYnV0ZXMuam9pbignICcpKSxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJyBpZD1cIiVzXCInLCAkLmlzQXJyYXkoaXRlbSkgPyB1bmRlZmluZWQgOiBpdGVtLl9pZCksXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY2xhc3M9XCIlc1wiJywgc3R5bGUuY2xhc3NlcyB8fCAoJC5pc0FycmF5KGl0ZW0pID8gdW5kZWZpbmVkIDogaXRlbS5fY2xhc3MpKSxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJyBkYXRhLWluZGV4PVwiJXNcIicsIGkpLFxyXG4gICAgICAgICAgICAgICAgc3ByaW50ZignIGRhdGEtdW5pcXVlaWQ9XCIlc1wiJywgaXRlbVt0aGlzLm9wdGlvbnMudW5pcXVlSWRdKSxcclxuICAgICAgICAgICAgICAgIHNwcmludGYoJyVzJywgZGF0YV8pLFxyXG4gICAgICAgICAgICAgICAgJz4nXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goc3ByaW50ZignPHRkIGNvbHNwYW49XCIlc1wiPjxkaXYgY2xhc3M9XCJjYXJkLXZpZXdzXCI+JywgdGhpcy5oZWFkZXIuZmllbGRzLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jYXJkVmlldyAmJiB0aGlzLm9wdGlvbnMuZGV0YWlsVmlldykge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQ+JyxcclxuICAgICAgICAgICAgICAgICAgICAnPGEgY2xhc3M9XCJkZXRhaWwtaWNvblwiIGhyZWY9XCJqYXZhc2NyaXB0OlwiPicsXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignPGkgY2xhc3M9XCIlcyAlc1wiPjwvaT4nLCB0aGlzLm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoaXMub3B0aW9ucy5pY29ucy5kZXRhaWxPcGVuKSxcclxuICAgICAgICAgICAgICAgICAgICAnPC9hPicsXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvdGQ+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQuZWFjaCh0aGlzLmhlYWRlci5maWVsZHMsIGZ1bmN0aW9uIChqLCBmaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGdldEl0ZW1GaWVsZChpdGVtLCBmaWVsZCwgdGhhdC5vcHRpb25zLmVzY2FwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxTdHlsZSA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkXyA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzXyA9IHRoYXQuaGVhZGVyLmNsYXNzZXNbal0sXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YV8gPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICByb3dzcGFuXyA9ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW5fID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVfID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uID0gdGhhdC5jb2x1bW5zW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmZyb21IdG1sICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFjb2x1bW4udmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLmNhcmRWaWV3ICYmICFjb2x1bW4uY2FyZFZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc3R5bGUgPSBzcHJpbnRmKCdzdHlsZT1cIiVzXCInLCBjc3Nlcy5jb25jYXQodGhhdC5oZWFkZXIuc3R5bGVzW2pdKS5qb2luKCc7ICcpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdGQncyBpZCBhbmQgY2xhc3NcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtWydfJyArIGZpZWxkICsgJ19pZCddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRfID0gc3ByaW50ZignIGlkPVwiJXNcIicsIGl0ZW1bJ18nICsgZmllbGQgKyAnX2lkJ10pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1bJ18nICsgZmllbGQgKyAnX2NsYXNzJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc18gPSBzcHJpbnRmKCcgY2xhc3M9XCIlc1wiJywgaXRlbVsnXycgKyBmaWVsZCArICdfY2xhc3MnXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVsnXycgKyBmaWVsZCArICdfcm93c3BhbiddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93c3Bhbl8gPSBzcHJpbnRmKCcgcm93c3Bhbj1cIiVzXCInLCBpdGVtWydfJyArIGZpZWxkICsgJ19yb3dzcGFuJ10pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1bJ18nICsgZmllbGQgKyAnX2NvbHNwYW4nXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW5fID0gc3ByaW50ZignIGNvbHNwYW49XCIlc1wiJywgaXRlbVsnXycgKyBmaWVsZCArICdfY29sc3BhbiddKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpdGVtWydfJyArIGZpZWxkICsgJ190aXRsZSddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVfID0gc3ByaW50ZignIHRpdGxlPVwiJXNcIicsIGl0ZW1bJ18nICsgZmllbGQgKyAnX3RpdGxlJ10pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2VsbFN0eWxlID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUodGhhdC5oZWFkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oZWFkZXIuY2VsbFN0eWxlc1tqXSwgW3ZhbHVlLCBpdGVtLCBpLCBmaWVsZF0sIGNlbGxTdHlsZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFN0eWxlLmNsYXNzZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc18gPSBzcHJpbnRmKCcgY2xhc3M9XCIlc1wiJywgY2VsbFN0eWxlLmNsYXNzZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxTdHlsZS5jc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3NzZXNfID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNlbGxTdHlsZS5jc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NzZXNfLnB1c2goa2V5ICsgJzogJyArIGNlbGxTdHlsZS5jc3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlID0gc3ByaW50Zignc3R5bGU9XCIlc1wiJywgY3NzZXNfLmNvbmNhdCh0aGF0LmhlYWRlci5zdHlsZXNbal0pLmpvaW4oJzsgJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsY3VsYXRlT2JqZWN0VmFsdWUoY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGVhZGVyLmZvcm1hdHRlcnNbal0sIFt2YWx1ZSwgaXRlbSwgaV0sIHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVsnXycgKyBmaWVsZCArICdfZGF0YSddICYmICEkLmlzRW1wdHlPYmplY3QoaXRlbVsnXycgKyBmaWVsZCArICdfZGF0YSddKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChpdGVtWydfJyArIGZpZWxkICsgJ19kYXRhJ10sIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBkYXRhLWluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrID09PSAnaW5kZXgnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YV8gKz0gc3ByaW50ZignIGRhdGEtJXM9XCIlc1wiJywgaywgdik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbi5jaGVja2JveCB8fCBjb2x1bW4ucmFkaW8pIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gY29sdW1uLmNoZWNrYm94ID8gJ2NoZWNrYm94JyA6IHR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGNvbHVtbi5yYWRpbyA/ICdyYWRpbycgOiB0eXBlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gW3NwcmludGYodGhhdC5vcHRpb25zLmNhcmRWaWV3ID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjYXJkLXZpZXcgJXNcIj4nIDogJzx0ZCBjbGFzcz1cImJzLWNoZWNrYm94ICVzXCI+JywgY29sdW1uWydjbGFzcyddIHx8ICcnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgZGF0YS1pbmRleD1cIiVzXCInLCBpKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyBuYW1lPVwiJXNcIicsIHRoYXQub3B0aW9ucy5zZWxlY3RJdGVtTmFtZSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgdHlwZT1cIiVzXCInLCB0eXBlKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcmludGYoJyB2YWx1ZT1cIiVzXCInLCBpdGVtW3RoYXQub3B0aW9ucy5pZEZpZWxkXSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpbnRmKCcgY2hlY2tlZD1cIiVzXCInLCB2YWx1ZSA9PT0gdHJ1ZSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAodmFsdWUgJiYgdmFsdWUuY2hlY2tlZCkgPyAnY2hlY2tlZCcgOiB1bmRlZmluZWQpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignIGRpc2FibGVkPVwiJXNcIicsICFjb2x1bW4uY2hlY2tib3hFbmFibGVkIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh2YWx1ZSAmJiB2YWx1ZS5kaXNhYmxlZCkgPyAnZGlzYWJsZWQnIDogdW5kZWZpbmVkKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICcgLz4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmhlYWRlci5mb3JtYXR0ZXJzW2pdICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgPyAnPC9kaXY+JyA6ICc8L3RkPidcclxuICAgICAgICAgICAgICAgICAgICBdLmpvaW4oJycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpdGVtW3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdID0gdmFsdWUgPT09IHRydWUgfHwgKHZhbHVlICYmIHZhbHVlLmNoZWNrZWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgfHwgdmFsdWUgPT09IG51bGwgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm9wdGlvbnMudW5kZWZpbmVkVGV4dCA6IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gdGhhdC5vcHRpb25zLmNhcmRWaWV3ID8gWyc8ZGl2IGNsYXNzPVwiY2FyZC12aWV3XCI+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5vcHRpb25zLnNob3dIZWFkZXIgPyBzcHJpbnRmKCc8c3BhbiBjbGFzcz1cInRpdGxlXCIgJXM+JXM8L3NwYW4+Jywgc3R5bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9wZXJ0eUZyb21PdGhlcih0aGF0LmNvbHVtbnMsICdmaWVsZCcsICd0aXRsZScsIGZpZWxkKSkgOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaW50ZignPHNwYW4gY2xhc3M9XCJ2YWx1ZVwiPiVzPC9zcGFuPicsIHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICBdLmpvaW4oJycpIDogW3NwcmludGYoJzx0ZCVzICVzICVzICVzICVzICVzICVzPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkXywgY2xhc3NfLCBzdHlsZSwgZGF0YV8sIHJvd3NwYW5fLCBjb2xzcGFuXywgdGl0bGVfKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L3RkPidcclxuICAgICAgICAgICAgICAgICAgICBdLmpvaW4oJycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBIaWRlIGVtcHR5IGRhdGEgb24gQ2FyZCB2aWV3IHdoZW4gc21hcnREaXNwbGF5IGlzIHNldCB0byB0cnVlLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuY2FyZFZpZXcgJiYgdGhhdC5vcHRpb25zLnNtYXJ0RGlzcGxheSAmJiB2YWx1ZSA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIHNldCBhIHBsYWNlaG9sZGVyIGZvciBldmVudCBiaW5kaW5nIGNvcnJlY3QgZmllbGRJbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJzxkaXYgY2xhc3M9XCJjYXJkLXZpZXdcIj48L2Rpdj4nO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2godGV4dCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj48L3RkPicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzwvdHI+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzaG93IG5vIHJlY29yZHNcclxuICAgICAgICBpZiAoIWh0bWwubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPHRyIGNsYXNzPVwibm8tcmVjb3Jkcy1mb3VuZFwiPicsXHJcbiAgICAgICAgICAgICAgICBzcHJpbnRmKCc8dGQgY29sc3Bhbj1cIiVzXCI+JXM8L3RkPicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kaGVhZGVyLmZpbmQoJ3RoJykubGVuZ3RoLCB0aGlzLm9wdGlvbnMuZm9ybWF0Tm9NYXRjaGVzKCkpLFxyXG4gICAgICAgICAgICAgICAgJzwvdHI+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRib2R5Lmh0bWwoaHRtbC5qb2luKCcnKSk7XHJcblxyXG4gICAgICAgIGlmICghZml4ZWRTY3JvbGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUbygwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNsaWNrIHRvIHNlbGVjdCBieSBjb2x1bW5cclxuICAgICAgICB0aGlzLiRib2R5LmZpbmQoJz4gdHJbZGF0YS1pbmRleF0gPiB0ZCcpLm9mZignY2xpY2sgZGJsY2xpY2snKS5vbignY2xpY2sgZGJsY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB2YXIgJHRkID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICR0ciA9ICR0ZC5wYXJlbnQoKSxcclxuICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGF0LmRhdGFbJHRyLmRhdGEoJ2luZGV4JyldLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAkdGRbMF0uY2VsbEluZGV4LFxyXG4gICAgICAgICAgICAgICAgZmllbGRzID0gdGhhdC5nZXRWaXNpYmxlRmllbGRzKCksXHJcbiAgICAgICAgICAgICAgICBmaWVsZCA9IGZpZWxkc1t0aGF0Lm9wdGlvbnMuZGV0YWlsVmlldyAmJiAhdGhhdC5vcHRpb25zLmNhcmRWaWV3ID8gaW5kZXggLSAxIDogaW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgY29sdW1uID0gdGhhdC5jb2x1bW5zW2dldEZpZWxkSW5kZXgodGhhdC5jb2x1bW5zLCBmaWVsZCldLFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBnZXRJdGVtRmllbGQoaXRlbSwgZmllbGQsIHRoYXQub3B0aW9ucy5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCR0ZC5maW5kKCcuZGV0YWlsLWljb24nKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhhdC50cmlnZ2VyKGUudHlwZSA9PT0gJ2NsaWNrJyA/ICdjbGljay1jZWxsJyA6ICdkYmwtY2xpY2stY2VsbCcsIGZpZWxkLCB2YWx1ZSwgaXRlbSwgJHRkKTtcclxuICAgICAgICAgICAgdGhhdC50cmlnZ2VyKGUudHlwZSA9PT0gJ2NsaWNrJyA/ICdjbGljay1yb3cnIDogJ2RibC1jbGljay1yb3cnLCBpdGVtLCAkdHIsIGZpZWxkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIGNsaWNrIHRvIHNlbGVjdCAtIHRoZW4gdHJpZ2dlciB0aGUgY2hlY2tib3gvcmFkaW8gY2xpY2tcclxuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gJ2NsaWNrJyAmJiB0aGF0Lm9wdGlvbnMuY2xpY2tUb1NlbGVjdCAmJiBjb2x1bW4uY2xpY2tUb1NlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRzZWxlY3RJdGVtID0gJHRyLmZpbmQoc3ByaW50ZignW25hbWU9XCIlc1wiXScsIHRoYXQub3B0aW9ucy5zZWxlY3RJdGVtTmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRzZWxlY3RJdGVtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICRzZWxlY3RJdGVtWzBdLmNsaWNrKCk7IC8vICMxNDQ6IC50cmlnZ2VyKCdjbGljaycpIGJ1Z1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJvZHkuZmluZCgnPiB0cltkYXRhLWluZGV4XSA+IHRkID4gLmRldGFpbC1pY29uJykub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICR0ciA9ICR0aGlzLnBhcmVudCgpLnBhcmVudCgpLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAkdHIuZGF0YSgnaW5kZXgnKSxcclxuICAgICAgICAgICAgICAgIHJvdyA9IGRhdGFbaW5kZXhdOyAvLyBGaXggIzk4MCBEZXRhaWwgdmlldywgd2hlbiBzZWFyY2hpbmcsIHJldHVybnMgd3Jvbmcgcm93XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmUgYW5kIHVwZGF0ZVxyXG4gICAgICAgICAgICBpZiAoJHRyLm5leHQoKS5pcygndHIuZGV0YWlsLXZpZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgJHRoaXMuZmluZCgnaScpLmF0dHIoJ2NsYXNzJywgc3ByaW50ZignJXMgJXMnLCB0aGF0Lm9wdGlvbnMuaWNvbnNQcmVmaXgsIHRoYXQub3B0aW9ucy5pY29ucy5kZXRhaWxPcGVuKSk7XHJcbiAgICAgICAgICAgICAgICAkdHIubmV4dCgpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKCdjb2xsYXBzZS1yb3cnLCBpbmRleCwgcm93KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmZpbmQoJ2knKS5hdHRyKCdjbGFzcycsIHNwcmludGYoJyVzICVzJywgdGhhdC5vcHRpb25zLmljb25zUHJlZml4LCB0aGF0Lm9wdGlvbnMuaWNvbnMuZGV0YWlsQ2xvc2UpKTtcclxuICAgICAgICAgICAgICAgICR0ci5hZnRlcihzcHJpbnRmKCc8dHIgY2xhc3M9XCJkZXRhaWwtdmlld1wiPjx0ZCBjb2xzcGFuPVwiJXNcIj48L3RkPjwvdHI+JywgJHRyLmZpbmQoJ3RkJykubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkdHIubmV4dCgpLmZpbmQoJ3RkJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKHRoYXQub3B0aW9ucywgdGhhdC5vcHRpb25zLmRldGFpbEZvcm1hdHRlciwgW2luZGV4LCByb3csICRlbGVtZW50XSwgJycpO1xyXG4gICAgICAgICAgICAgICAgaWYoJGVsZW1lbnQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuYXBwZW5kKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKCdleHBhbmQtcm93JywgaW5kZXgsIHJvdywgJGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQucmVzZXRWaWV3KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0gPSB0aGlzLiRib2R5LmZpbmQoc3ByaW50ZignW25hbWU9XCIlc1wiXScsIHRoaXMub3B0aW9ucy5zZWxlY3RJdGVtTmFtZSkpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0ub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gJHRoaXMucHJvcCgnY2hlY2tlZCcpLFxyXG4gICAgICAgICAgICAgICAgcm93ID0gdGhhdC5kYXRhWyR0aGlzLmRhdGEoJ2luZGV4JyldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5tYWludGFpblNlbGVjdGVkICYmICQodGhpcykuaXMoJzpyYWRpbycpKSB7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2godGhhdC5vcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dbdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByb3dbdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF0gPSBjaGVja2VkO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQub3B0aW9ucy5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuJHNlbGVjdEl0ZW0ubm90KHRoaXMpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVskKHRoaXMpLmRhdGEoJ2luZGV4JyldW3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoYXQuJHNlbGVjdEl0ZW0uZmlsdGVyKCc6Y2hlY2tlZCcpLm5vdCh0aGlzKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgICAgIHRoYXQudHJpZ2dlcihjaGVja2VkID8gJ2NoZWNrJyA6ICd1bmNoZWNrJywgcm93LCAkdGhpcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQuZWFjaCh0aGlzLmhlYWRlci5ldmVudHMsIGZ1bmN0aW9uIChpLCBldmVudHMpIHtcclxuICAgICAgICAgICAgaWYgKCFldmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBmaXggYnVnLCBpZiBldmVudHMgaXMgZGVmaW5lZCB3aXRoIG5hbWVzcGFjZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV2ZW50cyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50cyA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKG51bGwsIGV2ZW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmaWVsZCA9IHRoYXQuaGVhZGVyLmZpZWxkc1tpXSxcclxuICAgICAgICAgICAgICAgIGZpZWxkSW5kZXggPSAkLmluQXJyYXkoZmllbGQsIHRoYXQuZ2V0VmlzaWJsZUZpZWxkcygpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuZGV0YWlsVmlldyAmJiAhdGhhdC5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZEluZGV4ICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBldmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuJGJvZHkuZmluZCgnPnRyOm5vdCgubm8tcmVjb3Jkcy1mb3VuZCknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHRyID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRkID0gJHRyLmZpbmQodGhhdC5vcHRpb25zLmNhcmRWaWV3ID8gJy5jYXJkLXZpZXcnIDogJ3RkJykuZXEoZmllbGRJbmRleCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0ga2V5LmluZGV4T2YoJyAnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGtleS5zdWJzdHJpbmcoMCwgaW5kZXgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbCA9IGtleS5zdWJzdHJpbmcoaW5kZXggKyAxKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYyA9IGV2ZW50c1trZXldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdGQuZmluZChlbCkub2ZmKG5hbWUpLm9uKG5hbWUsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICR0ci5kYXRhKCdpbmRleCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93ID0gdGhhdC5kYXRhW2luZGV4XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcm93W2ZpZWxkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkodGhpcywgW2UsIHZhbHVlLCByb3csIGluZGV4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldFZpZXcoKTtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdwb3N0LWJvZHknLCBkYXRhKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRTZXJ2ZXIgPSBmdW5jdGlvbiAoc2lsZW50LCBxdWVyeSwgdXJsKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge30sXHJcbiAgICAgICAgICAgIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgIHNlYXJjaFRleHQ6IHRoaXMuc2VhcmNoVGV4dCxcclxuICAgICAgICAgICAgICAgIHNvcnROYW1lOiB0aGlzLm9wdGlvbnMuc29ydE5hbWUsXHJcbiAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IHRoaXMub3B0aW9ucy5zb3J0T3JkZXJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWVzdDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHBhcmFtcy5wYWdlU2l6ZSA9IHRoaXMub3B0aW9ucy5wYWdlU2l6ZSA9PT0gdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSA/XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudG90YWxSb3dzIDogdGhpcy5vcHRpb25zLnBhZ2VTaXplO1xyXG4gICAgICAgICAgICBwYXJhbXMucGFnZU51bWJlciA9IHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEodXJsIHx8IHRoaXMub3B0aW9ucy51cmwpICYmICF0aGlzLm9wdGlvbnMuYWpheCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnF1ZXJ5UGFyYW1zVHlwZSA9PT0gJ2xpbWl0Jykge1xyXG4gICAgICAgICAgICBwYXJhbXMgPSB7XHJcbiAgICAgICAgICAgICAgICBzZWFyY2g6IHBhcmFtcy5zZWFyY2hUZXh0LFxyXG4gICAgICAgICAgICAgICAgc29ydDogcGFyYW1zLnNvcnROYW1lLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IHBhcmFtcy5zb3J0T3JkZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnaW5hdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcGFyYW1zLm9mZnNldCA9IHRoaXMub3B0aW9ucy5wYWdlU2l6ZSA9PT0gdGhpcy5vcHRpb25zLmZvcm1hdEFsbFJvd3MoKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgMCA6IHRoaXMub3B0aW9ucy5wYWdlU2l6ZSAqICh0aGlzLm9wdGlvbnMucGFnZU51bWJlciAtIDEpO1xyXG4gICAgICAgICAgICAgICAgcGFyYW1zLmxpbWl0ID0gdGhpcy5vcHRpb25zLnBhZ2VTaXplID09PSB0aGlzLm9wdGlvbnMuZm9ybWF0QWxsUm93cygpID9cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudG90YWxSb3dzIDogdGhpcy5vcHRpb25zLnBhZ2VTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISgkLmlzRW1wdHlPYmplY3QodGhpcy5maWx0ZXJDb2x1bW5zUGFydGlhbCkpKSB7XHJcbiAgICAgICAgICAgIHBhcmFtcy5maWx0ZXIgPSBKU09OLnN0cmluZ2lmeSh0aGlzLmZpbHRlckNvbHVtbnNQYXJ0aWFsLCBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRhdGEgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZSh0aGlzLm9wdGlvbnMsIHRoaXMub3B0aW9ucy5xdWVyeVBhcmFtcywgW3BhcmFtc10sIGRhdGEpO1xyXG5cclxuICAgICAgICAkLmV4dGVuZChkYXRhLCBxdWVyeSB8fCB7fSk7XHJcblxyXG4gICAgICAgIC8vIGZhbHNlIHRvIHN0b3AgcmVxdWVzdFxyXG4gICAgICAgIGlmIChkYXRhID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXNpbGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUxvYWRpbmcuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXF1ZXN0ID0gJC5leHRlbmQoe30sIGNhbGN1bGF0ZU9iamVjdFZhbHVlKG51bGwsIHRoaXMub3B0aW9ucy5hamF4T3B0aW9ucyksIHtcclxuICAgICAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLm1ldGhvZCxcclxuICAgICAgICAgICAgdXJsOiAgdXJsIHx8IHRoaXMub3B0aW9ucy51cmwsXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXMub3B0aW9ucy5jb250ZW50VHlwZSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24nICYmIHRoaXMub3B0aW9ucy5tZXRob2QgPT09ICdwb3N0JyA/IEpTT04uc3RyaW5naWZ5KGRhdGEpIDogZGF0YSxcclxuICAgICAgICAgICAgY2FjaGU6IHRoaXMub3B0aW9ucy5jYWNoZSxcclxuICAgICAgICAgICAgLy9jb250ZW50VHlwZTogdGhpcy5vcHRpb25zLmNvbnRlbnRUeXBlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogdGhpcy5vcHRpb25zLmRhdGFUeXBlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzKSB7XHJcblx0XHRcdFx0aWYgKHJlcy5jb250ZW50KSB7XHJcblx0XHRcdFx0XHRyZXMgPSByZXMuY29udGVudFxyXG5cdFx0XHRcdH1cclxuICAgICAgICAgICAgICAgIHJlcyA9IGNhbGN1bGF0ZU9iamVjdFZhbHVlKHRoYXQub3B0aW9ucywgdGhhdC5vcHRpb25zLnJlc3BvbnNlSGFuZGxlciwgW3Jlc10sIHJlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5sb2FkKHJlcyk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2xvYWQtc3VjY2VzcycsIHJlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNpbGVudCkgdGhhdC4kdGFibGVMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcignbG9hZC1lcnJvcicsIHJlcy5zdGF0dXMsIHJlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNpbGVudCkgdGhhdC4kdGFibGVMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFqYXgpIHtcclxuICAgICAgICAgICAgY2FsY3VsYXRlT2JqZWN0VmFsdWUodGhpcywgdGhpcy5vcHRpb25zLmFqYXgsIFtyZXF1ZXN0XSwgbnVsbCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3hociAmJiB0aGlzLl94aHIucmVhZHlTdGF0ZSAhPT0gNCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLmFib3J0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5feGhyID0gJC5hamF4KHJlcXVlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VhcmNoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VhcmNoVGV4dCAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkc2VhcmNoID0gdGhpcy4kdG9vbGJhci5maW5kKCcuc2VhcmNoIGlucHV0Jyk7XHJcbiAgICAgICAgICAgICAgICAkc2VhcmNoLnZhbCh0aGlzLm9wdGlvbnMuc2VhcmNoVGV4dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2VhcmNoKHtjdXJyZW50VGFyZ2V0OiAkc2VhcmNofSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRDYXJldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICQuZWFjaCh0aGlzLiRoZWFkZXIuZmluZCgndGgnKSwgZnVuY3Rpb24gKGksIHRoKSB7XHJcbiAgICAgICAgICAgICQodGgpLmZpbmQoJy5zb3J0YWJsZScpLnJlbW92ZUNsYXNzKCdkZXNjIGFzYycpLmFkZENsYXNzKCQodGgpLmRhdGEoJ2ZpZWxkJykgPT09IHRoYXQub3B0aW9ucy5zb3J0TmFtZSA/IHRoYXQub3B0aW9ucy5zb3J0T3JkZXIgOiAnYm90aCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudXBkYXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNoZWNrQWxsID0gdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoJzplbmFibGVkJykubGVuZ3RoICYmXHJcbiAgICAgICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0uZmlsdGVyKCc6ZW5hYmxlZCcpLmxlbmd0aCA9PT1cclxuICAgICAgICAgICAgdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoJzplbmFibGVkJykuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aDtcclxuXHJcbiAgICAgICAgdGhpcy4kc2VsZWN0QWxsLmFkZCh0aGlzLiRzZWxlY3RBbGxfKS5wcm9wKCdjaGVja2VkJywgY2hlY2tBbGwpO1xyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RJdGVtLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoJ3RyJylbJCh0aGlzKS5wcm9wKCdjaGVja2VkJykgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3NlbGVjdGVkJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51cGRhdGVSb3dzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy4kc2VsZWN0SXRlbS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhhdC5kYXRhWyQodGhpcykuZGF0YSgnaW5kZXgnKV1bdGhhdC5oZWFkZXIuc3RhdGVGaWVsZF0gPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlc2V0Um93cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICQuZWFjaCh0aGlzLmRhdGEsIGZ1bmN0aW9uIChpLCByb3cpIHtcclxuICAgICAgICAgICAgdGhhdC4kc2VsZWN0QWxsLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoYXQuJHNlbGVjdEl0ZW0ucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICAgICAgaWYgKHRoYXQuaGVhZGVyLnN0YXRlRmllbGQpIHtcclxuICAgICAgICAgICAgICAgIHJvd1t0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcblxyXG4gICAgICAgIG5hbWUgKz0gJy5icy50YWJsZSc7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zW0Jvb3RzdHJhcFRhYmxlLkVWRU5UU1tuYW1lXV0uYXBwbHkodGhpcy5vcHRpb25zLCBhcmdzKTtcclxuICAgICAgICB0aGlzLiRlbC50cmlnZ2VyKCQuRXZlbnQobmFtZSksIGFyZ3MpO1xyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMub25BbGwobmFtZSwgYXJncyk7XHJcbiAgICAgICAgdGhpcy4kZWwudHJpZ2dlcigkLkV2ZW50KCdhbGwuYnMudGFibGUnKSwgW25hbWUsIGFyZ3NdKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlc2V0SGVhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGZpeCAjNjE6IHRoZSBoaWRkZW4gdGFibGUgcmVzZXQgaGVhZGVyIGJ1Zy5cclxuICAgICAgICAvLyBmaXggYnVnOiBnZXQgJGVsLmNzcygnd2lkdGgnKSBlcnJvciBzb21ldGltZSAoaGVpZ2h0ID0gNTAwKVxyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZF8pO1xyXG4gICAgICAgIHRoaXMudGltZW91dElkXyA9IHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmZpdEhlYWRlciwgdGhpcyksIHRoaXMuJGVsLmlzKCc6aGlkZGVuJykgPyAxMDAgOiAwKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmZpdEhlYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZpeGVkQm9keSxcclxuICAgICAgICAgICAgc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgIGZvY3VzZWQsXHJcbiAgICAgICAgICAgIGZvY3VzZWRUZW1wO1xyXG5cclxuICAgICAgICBpZiAodGhhdC4kZWwuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICAgICAgICB0aGF0LnRpbWVvdXRJZF8gPSBzZXRUaW1lb3V0KCQucHJveHkodGhhdC5maXRIZWFkZXIsIHRoYXQpLCAxMDApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpeGVkQm9keSA9IHRoaXMuJHRhYmxlQm9keS5nZXQoMCk7XHJcblxyXG4gICAgICAgIHNjcm9sbFdpZHRoID0gZml4ZWRCb2R5LnNjcm9sbFdpZHRoID4gZml4ZWRCb2R5LmNsaWVudFdpZHRoICYmXHJcbiAgICAgICAgZml4ZWRCb2R5LnNjcm9sbEhlaWdodCA+IGZpeGVkQm9keS5jbGllbnRIZWlnaHQgKyB0aGlzLiRoZWFkZXIub3V0ZXJIZWlnaHQoKSA/XHJcbiAgICAgICAgICAgIGdldFNjcm9sbEJhcldpZHRoKCkgOiAwO1xyXG5cclxuICAgICAgICB0aGlzLiRlbC5jc3MoJ21hcmdpbi10b3AnLCAtdGhpcy4kaGVhZGVyLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgICAgICBmb2N1c2VkID0gJCgnOmZvY3VzJyk7XHJcbiAgICAgICAgaWYgKGZvY3VzZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoID0gZm9jdXNlZC5wYXJlbnRzKCd0aCcpO1xyXG4gICAgICAgICAgICBpZiAoJHRoLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhRmllbGQgPSAkdGguYXR0cignZGF0YS1maWVsZCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGFGaWVsZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoZWFkZXJUaCA9IHRoaXMuJGhlYWRlci5maW5kKFwiW2RhdGEtZmllbGQ9J1wiICsgZGF0YUZpZWxkICsgXCInXVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJGhlYWRlclRoLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGhlYWRlclRoLmZpbmQoXCI6aW5wdXRcIikuYWRkQ2xhc3MoXCJmb2N1cy10ZW1wXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy4kaGVhZGVyXyA9IHRoaXMuJGhlYWRlci5jbG9uZSh0cnVlLCB0cnVlKTtcclxuICAgICAgICB0aGlzLiRzZWxlY3RBbGxfID0gdGhpcy4kaGVhZGVyXy5maW5kKCdbbmFtZT1cImJ0U2VsZWN0QWxsXCJdJyk7XHJcbiAgICAgICAgdGhpcy4kdGFibGVIZWFkZXIuY3NzKHtcclxuICAgICAgICAgICAgJ21hcmdpbi1yaWdodCc6IHNjcm9sbFdpZHRoXHJcbiAgICAgICAgfSkuZmluZCgndGFibGUnKS5jc3MoJ3dpZHRoJywgdGhpcy4kZWwub3V0ZXJXaWR0aCgpKVxyXG4gICAgICAgICAgICAuaHRtbCgnJykuYXR0cignY2xhc3MnLCB0aGlzLiRlbC5hdHRyKCdjbGFzcycpKVxyXG4gICAgICAgICAgICAuYXBwZW5kKHRoaXMuJGhlYWRlcl8pO1xyXG5cclxuXHJcbiAgICAgICAgZm9jdXNlZFRlbXAgPSAkKCcuZm9jdXMtdGVtcDp2aXNpYmxlOmVxKDApJyk7XHJcbiAgICAgICAgaWYgKGZvY3VzZWRUZW1wLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm9jdXNlZFRlbXAuZm9jdXMoKTtcclxuICAgICAgICAgICAgdGhpcy4kaGVhZGVyLmZpbmQoJy5mb2N1cy10ZW1wJykucmVtb3ZlQ2xhc3MoJ2ZvY3VzLXRlbXAnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZpeCBidWc6ICQuZGF0YSgpIGlzIG5vdCB3b3JraW5nIGFzIGV4cGVjdGVkIGFmdGVyICQuYXBwZW5kKClcclxuICAgICAgICB0aGlzLiRoZWFkZXIuZmluZCgndGhbZGF0YS1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgIHRoYXQuJGhlYWRlcl8uZmluZChzcHJpbnRmKCd0aFtkYXRhLWZpZWxkPVwiJXNcIl0nLCAkKHRoaXMpLmRhdGEoJ2ZpZWxkJykpKS5kYXRhKCQodGhpcykuZGF0YSgpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHZpc2libGVGaWVsZHMgPSB0aGlzLmdldFZpc2libGVGaWVsZHMoKSxcclxuICAgICAgICAgICAgJHRocyA9IHRoaXMuJGhlYWRlcl8uZmluZCgndGgnKTtcclxuXHJcbiAgICAgICAgdGhpcy4kYm9keS5maW5kKCc+dHI6Zmlyc3QtY2hpbGQ6bm90KC5uby1yZWNvcmRzLWZvdW5kKSA+IConKS5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLmRldGFpbFZpZXcgJiYgIXRoYXQub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LiRoZWFkZXJfLmZpbmQoJ3RoLmRldGFpbCcpLmZpbmQoJy5maHQtY2VsbCcpLndpZHRoKCR0aGlzLmlubmVyV2lkdGgoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IGkgLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgJHRoID0gdGhhdC4kaGVhZGVyXy5maW5kKHNwcmludGYoJ3RoW2RhdGEtZmllbGQ9XCIlc1wiXScsIHZpc2libGVGaWVsZHNbaW5kZXhdKSk7XHJcbiAgICAgICAgICAgIGlmICgkdGgubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgJHRoID0gJCgkdGhzWyR0aGlzWzBdLmNlbGxJbmRleF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkdGguZmluZCgnLmZodC1jZWxsJykud2lkdGgoJHRoaXMuaW5uZXJXaWR0aCgpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBob3Jpem9udGFsIHNjcm9sbCBldmVudFxyXG4gICAgICAgIC8vIFRPRE86IGl0J3MgcHJvYmFibHkgYmV0dGVyIGltcHJvdmluZyB0aGUgbGF5b3V0IHRoYW4gYmluZGluZyB0byBzY3JvbGwgZXZlbnRcclxuICAgICAgICB0aGlzLiR0YWJsZUJvZHkub2ZmKCdzY3JvbGwnKS5vbignc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGF0LiR0YWJsZUhlYWRlci5zY3JvbGxMZWZ0KCQodGhpcykuc2Nyb2xsTGVmdCgpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm9wdGlvbnMuc2hvd0Zvb3RlciAmJiAhdGhhdC5vcHRpb25zLmNhcmRWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LiR0YWJsZUZvb3Rlci5zY3JvbGxMZWZ0KCQodGhpcykuc2Nyb2xsTGVmdCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQudHJpZ2dlcigncG9zdC1oZWFkZXInKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlc2V0Rm9vdGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHRoYXQuZ2V0RGF0YSgpLFxyXG4gICAgICAgICAgICBodG1sID0gW107XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnNob3dGb290ZXIgfHwgdGhpcy5vcHRpb25zLmNhcmRWaWV3KSB7IC8vZG8gbm90aGluZ1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jYXJkVmlldyAmJiB0aGlzLm9wdGlvbnMuZGV0YWlsVmlldykge1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx0ZD48ZGl2IGNsYXNzPVwidGgtaW5uZXJcIj4mbmJzcDs8L2Rpdj48ZGl2IGNsYXNzPVwiZmh0LWNlbGxcIj48L2Rpdj48L3RkPicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJC5lYWNoKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICB2YXIga2V5LFxyXG4gICAgICAgICAgICAgICAgZmFsaWduID0gJycsIC8vIGZvb3RlciBhbGlnbiBzdHlsZVxyXG4gICAgICAgICAgICAgICAgdmFsaWduID0gJycsXHJcbiAgICAgICAgICAgICAgICBjc3NlcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgc3R5bGUgPSB7fSxcclxuICAgICAgICAgICAgICAgIGNsYXNzXyA9IHNwcmludGYoJyBjbGFzcz1cIiVzXCInLCBjb2x1bW5bJ2NsYXNzJ10pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFjb2x1bW4udmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5vcHRpb25zLmNhcmRWaWV3ICYmICghY29sdW1uLmNhcmRWaXNpYmxlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmYWxpZ24gPSBzcHJpbnRmKCd0ZXh0LWFsaWduOiAlczsgJywgY29sdW1uLmZhbGlnbiA/IGNvbHVtbi5mYWxpZ24gOiBjb2x1bW4uYWxpZ24pO1xyXG4gICAgICAgICAgICB2YWxpZ24gPSBzcHJpbnRmKCd2ZXJ0aWNhbC1hbGlnbjogJXM7ICcsIGNvbHVtbi52YWxpZ24pO1xyXG5cclxuICAgICAgICAgICAgc3R5bGUgPSBjYWxjdWxhdGVPYmplY3RWYWx1ZShudWxsLCB0aGF0Lm9wdGlvbnMuZm9vdGVyU3R5bGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0eWxlICYmIHN0eWxlLmNzcykge1xyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gc3R5bGUuY3NzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NzZXMucHVzaChrZXkgKyAnOiAnICsgc3R5bGUuY3NzW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx0ZCcsIGNsYXNzXywgc3ByaW50ZignIHN0eWxlPVwiJXNcIicsIGZhbGlnbiArIHZhbGlnbiArIGNzc2VzLmNvbmNhdCgpLmpvaW4oJzsgJykpLCAnPicpO1xyXG4gICAgICAgICAgICBodG1sLnB1c2goJzxkaXYgY2xhc3M9XCJ0aC1pbm5lclwiPicpO1xyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKGNhbGN1bGF0ZU9iamVjdFZhbHVlKGNvbHVtbiwgY29sdW1uLmZvb3RlckZvcm1hdHRlciwgW2RhdGFdLCAnJm5ic3A7JykgfHwgJyZuYnNwOycpO1xyXG5cclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8ZGl2IGNsYXNzPVwiZmh0LWNlbGxcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RkPicpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiR0YWJsZUZvb3Rlci5maW5kKCd0cicpLmh0bWwoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgdGhpcy4kdGFibGVGb290ZXIuc2hvdygpO1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRGb290ZXJfKTtcclxuICAgICAgICB0aGlzLnRpbWVvdXRGb290ZXJfID0gc2V0VGltZW91dCgkLnByb3h5KHRoaXMuZml0Rm9vdGVyLCB0aGlzKSxcclxuICAgICAgICAgICAgdGhpcy4kZWwuaXMoJzpoaWRkZW4nKSA/IDEwMCA6IDApO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZml0Rm9vdGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgJGZvb3RlclRkLFxyXG4gICAgICAgICAgICBlbFdpZHRoLFxyXG4gICAgICAgICAgICBzY3JvbGxXaWR0aDtcclxuXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dEZvb3Rlcl8pO1xyXG4gICAgICAgIGlmICh0aGlzLiRlbC5pcygnOmhpZGRlbicpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGltZW91dEZvb3Rlcl8gPSBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5maXRGb290ZXIsIHRoaXMpLCAxMDApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbFdpZHRoID0gdGhpcy4kZWwuY3NzKCd3aWR0aCcpO1xyXG4gICAgICAgIHNjcm9sbFdpZHRoID0gZWxXaWR0aCA+IHRoaXMuJHRhYmxlQm9keS53aWR0aCgpID8gZ2V0U2Nyb2xsQmFyV2lkdGgoKSA6IDA7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYmxlRm9vdGVyLmNzcyh7XHJcbiAgICAgICAgICAgICdtYXJnaW4tcmlnaHQnOiBzY3JvbGxXaWR0aFxyXG4gICAgICAgIH0pLmZpbmQoJ3RhYmxlJykuY3NzKCd3aWR0aCcsIGVsV2lkdGgpXHJcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIHRoaXMuJGVsLmF0dHIoJ2NsYXNzJykpO1xyXG5cclxuICAgICAgICAkZm9vdGVyVGQgPSB0aGlzLiR0YWJsZUZvb3Rlci5maW5kKCd0ZCcpO1xyXG5cclxuICAgICAgICB0aGlzLiRib2R5LmZpbmQoJz50cjpmaXJzdC1jaGlsZDpub3QoLm5vLXJlY29yZHMtZm91bmQpID4gKicpLmVhY2goZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICRmb290ZXJUZC5lcShpKS5maW5kKCcuZmh0LWNlbGwnKS53aWR0aCgkdGhpcy5pbm5lcldpZHRoKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudG9nZ2xlQ29sdW1uID0gZnVuY3Rpb24gKGluZGV4LCBjaGVja2VkLCBuZWVkVXBkYXRlKSB7XHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29sdW1uc1tpbmRleF0udmlzaWJsZSA9IGNoZWNrZWQ7XHJcbiAgICAgICAgdGhpcy5pbml0SGVhZGVyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Q29sdW1ucykge1xyXG4gICAgICAgICAgICB2YXIgJGl0ZW1zID0gdGhpcy4kdG9vbGJhci5maW5kKCcua2VlcC1vcGVuIGlucHV0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobmVlZFVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgJGl0ZW1zLmZpbHRlcihzcHJpbnRmKCdbdmFsdWU9XCIlc1wiXScsIGluZGV4KSkucHJvcCgnY2hlY2tlZCcsIGNoZWNrZWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoJGl0ZW1zLmZpbHRlcignOmNoZWNrZWQnKS5sZW5ndGggPD0gdGhpcy5vcHRpb25zLm1pbmltdW1Db3VudENvbHVtbnMpIHtcclxuICAgICAgICAgICAgICAgICRpdGVtcy5maWx0ZXIoJzpjaGVja2VkJykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnRvZ2dsZVJvdyA9IGZ1bmN0aW9uIChpbmRleCwgdW5pcXVlSWQsIHZpc2libGUpIHtcclxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGJvZHkuZmluZCh0eXBlb2YgaW5kZXggIT09ICd1bmRlZmluZWQnID9cclxuICAgICAgICAgICAgc3ByaW50ZigndHJbZGF0YS1pbmRleD1cIiVzXCJdJywgaW5kZXgpIDpcclxuICAgICAgICAgICAgc3ByaW50ZigndHJbZGF0YS11bmlxdWVpZD1cIiVzXCJdJywgdW5pcXVlSWQpKVxyXG4gICAgICAgICAgICBbdmlzaWJsZSA/ICdzaG93JyA6ICdoaWRlJ10oKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmdldFZpc2libGVGaWVsZHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICB2aXNpYmxlRmllbGRzID0gW107XHJcblxyXG4gICAgICAgICQuZWFjaCh0aGlzLmhlYWRlci5maWVsZHMsIGZ1bmN0aW9uIChqLCBmaWVsZCkge1xyXG4gICAgICAgICAgICB2YXIgY29sdW1uID0gdGhhdC5jb2x1bW5zW2dldEZpZWxkSW5kZXgodGhhdC5jb2x1bW5zLCBmaWVsZCldO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFjb2x1bW4udmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZpc2libGVGaWVsZHMucHVzaChmaWVsZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHZpc2libGVGaWVsZHM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFBVQkxJQyBGVU5DVElPTiBERUZJTklUSU9OXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZXNldFZpZXcgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgdmFyIHBhZGRpbmcgPSAwO1xyXG5cclxuICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRzZWxlY3RBbGwucHJvcCgnY2hlY2tlZCcsIHRoaXMuJHNlbGVjdEl0ZW0ubGVuZ3RoID4gMCAmJlxyXG4gICAgICAgICAgICB0aGlzLiRzZWxlY3RJdGVtLmxlbmd0aCA9PT0gdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoJzpjaGVja2VkJykubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdmFyIHRvb2xiYXJIZWlnaHQgPSBnZXRSZWFsSGVpZ2h0KHRoaXMuJHRvb2xiYXIpLFxyXG4gICAgICAgICAgICAgICAgcGFnaW5hdGlvbkhlaWdodCA9IGdldFJlYWxIZWlnaHQodGhpcy4kcGFnaW5hdGlvbiksXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0IC0gdG9vbGJhckhlaWdodCAtIHBhZ2luYXRpb25IZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUNvbnRhaW5lci5jc3MoJ2hlaWdodCcsIGhlaWdodCArICdweCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jYXJkVmlldykge1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIGVsZW1lbnQgY3NzXHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmNzcygnbWFyZ2luLXRvcCcsICcwJyk7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlQ29udGFpbmVyLmNzcygncGFkZGluZy1ib3R0b20nLCAnMCcpO1xyXG4gICAgICAgICAgICB0aGlzLiR0YWJsZUZvb3Rlci5oaWRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd0hlYWRlciAmJiB0aGlzLm9wdGlvbnMuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlSGVhZGVyLnNob3coKTtcclxuICAgICAgICAgICAgdGhpcy5yZXNldEhlYWRlcigpO1xyXG4gICAgICAgICAgICBwYWRkaW5nICs9IHRoaXMuJGhlYWRlci5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRhYmxlSGVhZGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdwb3N0LWhlYWRlcicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Rm9vdGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRGb290ZXIoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmcgKz0gdGhpcy4kdGFibGVGb290ZXIub3V0ZXJIZWlnaHQoKSArIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFzc2lnbiB0aGUgY29ycmVjdCBzb3J0YWJsZSBhcnJvd1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FyZXQoKTtcclxuICAgICAgICB0aGlzLiR0YWJsZUNvbnRhaW5lci5jc3MoJ3BhZGRpbmctYm90dG9tJywgcGFkZGluZyArICdweCcpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcigncmVzZXQtdmlldycpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uICh1c2VDdXJyZW50UGFnZSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zZWFyY2hUZXh0IHx8ICEkLmlzRW1wdHlPYmplY3QodGhpcy5maWx0ZXJDb2x1bW5zKSB8fCAhJC5pc0VtcHR5T2JqZWN0KHRoaXMuZmlsdGVyQ29sdW1uc1BhcnRpYWwpKSA/XHJcbiAgICAgICAgICAgICh1c2VDdXJyZW50UGFnZSA/IHRoaXMuZGF0YS5zbGljZSh0aGlzLnBhZ2VGcm9tIC0gMSwgdGhpcy5wYWdlVG8pIDogdGhpcy5kYXRhKSA6XHJcbiAgICAgICAgICAgICh1c2VDdXJyZW50UGFnZSA/IHRoaXMub3B0aW9ucy5kYXRhLnNsaWNlKHRoaXMucGFnZUZyb20gLSAxLCB0aGlzLnBhZ2VUbykgOiB0aGlzLm9wdGlvbnMuZGF0YSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICB2YXIgZml4ZWRTY3JvbGwgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gIzQzMTogc3VwcG9ydCBwYWdpbmF0aW9uXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWRlUGFnaW5hdGlvbiA9PT0gJ3NlcnZlcicpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRvdGFsUm93cyA9IGRhdGEudG90YWw7XHJcbiAgICAgICAgICAgIGZpeGVkU2Nyb2xsID0gZGF0YS5maXhlZFNjcm9sbDtcclxuICAgICAgICAgICAgZGF0YSA9IGRhdGFbdGhpcy5vcHRpb25zLmRhdGFGaWVsZF07XHJcbiAgICAgICAgfSBlbHNlIGlmICghJC5pc0FycmF5KGRhdGEpKSB7IC8vIHN1cHBvcnQgZml4ZWRTY3JvbGxcclxuICAgICAgICAgICAgZml4ZWRTY3JvbGwgPSBkYXRhLmZpeGVkU2Nyb2xsO1xyXG4gICAgICAgICAgICBkYXRhID0gZGF0YS5kYXRhO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pbml0RGF0YShkYXRhKTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keShmaXhlZFNjcm9sbCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMuaW5pdERhdGEoZGF0YSwgJ2FwcGVuZCcpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRTb3J0KCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMuaW5pdERhdGEoZGF0YSwgJ3ByZXBlbmQnKTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLmluaXRQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMub3B0aW9ucy5kYXRhLmxlbmd0aCxcclxuICAgICAgICAgICAgaSwgcm93O1xyXG5cclxuICAgICAgICBpZiAoIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnZmllbGQnKSB8fCAhcGFyYW1zLmhhc093blByb3BlcnR5KCd2YWx1ZXMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICByb3cgPSB0aGlzLm9wdGlvbnMuZGF0YVtpXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcm93Lmhhc093blByb3BlcnR5KHBhcmFtcy5maWVsZCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkocm93W3BhcmFtcy5maWVsZF0sIHBhcmFtcy52YWx1ZXMpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRhdGEuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGVuID09PSB0aGlzLm9wdGlvbnMuZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGF0YS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhLnNwbGljZSgwLCB0aGlzLm9wdGlvbnMuZGF0YS5sZW5ndGgpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRCb2R5KHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmdldFJvd0J5VW5pcXVlSWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgdW5pcXVlSWQgPSB0aGlzLm9wdGlvbnMudW5pcXVlSWQsXHJcbiAgICAgICAgICAgIGxlbiA9IHRoaXMub3B0aW9ucy5kYXRhLmxlbmd0aCxcclxuICAgICAgICAgICAgZGF0YVJvdyA9IG51bGwsXHJcbiAgICAgICAgICAgIGksIHJvdywgcm93VW5pcXVlSWQ7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHJvdyA9IHRoaXMub3B0aW9ucy5kYXRhW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJvdy5oYXNPd25Qcm9wZXJ0eSh1bmlxdWVJZCkpIHsgLy8gdW5pcXVlSWQgaXMgYSBjb2x1bW5cclxuICAgICAgICAgICAgICAgIHJvd1VuaXF1ZUlkID0gcm93W3VuaXF1ZUlkXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKHJvdy5fZGF0YS5oYXNPd25Qcm9wZXJ0eSh1bmlxdWVJZCkpIHsgLy8gdW5pcXVlSWQgaXMgYSByb3cgZGF0YSBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAgICAgcm93VW5pcXVlSWQgPSByb3cuX2RhdGFbdW5pcXVlSWRdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygcm93VW5pcXVlSWQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IGlkLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJvd1VuaXF1ZUlkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKChOdW1iZXIocm93VW5pcXVlSWQpID09PSByb3dVbmlxdWVJZCkgJiYgKHJvd1VuaXF1ZUlkICUgMSA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZCA9IHBhcnNlSW50KGlkKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHJvd1VuaXF1ZUlkID09PSBOdW1iZXIocm93VW5pcXVlSWQpKSAmJiAocm93VW5pcXVlSWQgIT09IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBwYXJzZUZsb2F0KGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJvd1VuaXF1ZUlkID09PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgZGF0YVJvdyA9IHJvdztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGF0YVJvdztcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlbW92ZUJ5VW5pcXVlSWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbGVuID0gdGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoLFxyXG4gICAgICAgICAgICByb3cgPSB0aGlzLmdldFJvd0J5VW5pcXVlSWQoaWQpO1xyXG5cclxuICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kYXRhLnNwbGljZSh0aGlzLm9wdGlvbnMuZGF0YS5pbmRleE9mKHJvdyksIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxlbiA9PT0gdGhpcy5vcHRpb25zLmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudXBkYXRlQnlVbmlxdWVJZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGFsbFBhcmFtcyA9ICQuaXNBcnJheShwYXJhbXMpID8gcGFyYW1zIDogWyBwYXJhbXMgXTtcclxuXHJcbiAgICAgICAgJC5lYWNoKGFsbFBhcmFtcywgZnVuY3Rpb24oaSwgcGFyYW1zKSB7XHJcbiAgICAgICAgICAgIHZhciByb3dJZDtcclxuXHJcbiAgICAgICAgICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KCdpZCcpIHx8ICFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ3JvdycpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJvd0lkID0gJC5pbkFycmF5KHRoYXQuZ2V0Um93QnlVbmlxdWVJZChwYXJhbXMuaWQpLCB0aGF0Lm9wdGlvbnMuZGF0YSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocm93SWQgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJC5leHRlbmQodGhhdC5vcHRpb25zLmRhdGFbcm93SWRdLCBwYXJhbXMucm93KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbnNlcnRSb3cgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2luZGV4JykgfHwgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgncm93JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRhdGEuc3BsaWNlKHBhcmFtcy5pbmRleCwgMCwgcGFyYW1zLnJvdyk7XHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0UGFnaW5hdGlvbigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNvcnQoKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudXBkYXRlUm93ID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgYWxsUGFyYW1zID0gJC5pc0FycmF5KHBhcmFtcykgPyBwYXJhbXMgOiBbIHBhcmFtcyBdO1xyXG5cclxuICAgICAgICAkLmVhY2goYWxsUGFyYW1zLCBmdW5jdGlvbihpLCBwYXJhbXMpIHtcclxuICAgICAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2luZGV4JykgfHwgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgncm93JykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmV4dGVuZCh0aGF0Lm9wdGlvbnMuZGF0YVtwYXJhbXMuaW5kZXhdLCBwYXJhbXMucm93KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0U2VhcmNoKCk7XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5zaG93Um93ID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KCdpbmRleCcpICYmICFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ3VuaXF1ZUlkJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRvZ2dsZVJvdyhwYXJhbXMuaW5kZXgsIHBhcmFtcy51bmlxdWVJZCwgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5oaWRlUm93ID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgIGlmICghcGFyYW1zLmhhc093blByb3BlcnR5KCdpbmRleCcpICYmICFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ3VuaXF1ZUlkJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRvZ2dsZVJvdyhwYXJhbXMuaW5kZXgsIHBhcmFtcy51bmlxdWVJZCwgZmFsc2UpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0Um93c0hpZGRlbiA9IGZ1bmN0aW9uIChzaG93KSB7XHJcbiAgICAgICAgdmFyIHJvd3MgPSAkKHRoaXMuJGJvZHlbMF0pLmNoaWxkcmVuKCkuZmlsdGVyKCc6aGlkZGVuJyksXHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgIGlmIChzaG93KSB7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgJChyb3dzW2ldKS5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJvd3M7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5tZXJnZUNlbGxzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgcm93ID0gb3B0aW9ucy5pbmRleCxcclxuICAgICAgICAgICAgY29sID0gJC5pbkFycmF5KG9wdGlvbnMuZmllbGQsIHRoaXMuZ2V0VmlzaWJsZUZpZWxkcygpKSxcclxuICAgICAgICAgICAgcm93c3BhbiA9IG9wdGlvbnMucm93c3BhbiB8fCAxLFxyXG4gICAgICAgICAgICBjb2xzcGFuID0gb3B0aW9ucy5jb2xzcGFuIHx8IDEsXHJcbiAgICAgICAgICAgIGksIGosXHJcbiAgICAgICAgICAgICR0ciA9IHRoaXMuJGJvZHkuZmluZCgnPnRyJyksXHJcbiAgICAgICAgICAgICR0ZDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZXRhaWxWaWV3ICYmICF0aGlzLm9wdGlvbnMuY2FyZFZpZXcpIHtcclxuICAgICAgICAgICAgY29sICs9IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkdGQgPSAkdHIuZXEocm93KS5maW5kKCc+dGQnKS5lcShjb2wpO1xyXG5cclxuICAgICAgICBpZiAocm93IDwgMCB8fCBjb2wgPCAwIHx8IHJvdyA+PSB0aGlzLmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IHJvdzsgaSA8IHJvdyArIHJvd3NwYW47IGkrKykge1xyXG4gICAgICAgICAgICBmb3IgKGogPSBjb2w7IGogPCBjb2wgKyBjb2xzcGFuOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICR0ci5lcShpKS5maW5kKCc+dGQnKS5lcShqKS5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICR0ZC5hdHRyKCdyb3dzcGFuJywgcm93c3BhbikuYXR0cignY29sc3BhbicsIGNvbHNwYW4pLnNob3coKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnVwZGF0ZUNlbGwgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKCFwYXJhbXMuaGFzT3duUHJvcGVydHkoJ2luZGV4JykgfHxcclxuICAgICAgICAgICAgIXBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnZmllbGQnKSB8fFxyXG4gICAgICAgICAgICAhcGFyYW1zLmhhc093blByb3BlcnR5KCd2YWx1ZScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhW3BhcmFtcy5pbmRleF1bcGFyYW1zLmZpZWxkXSA9IHBhcmFtcy52YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmFtcy5yZWluaXQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbml0U29ydCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEJvZHkodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5nZXRTZWxlY3Rpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ3JlcCh0aGlzLm9wdGlvbnMuZGF0YSwgZnVuY3Rpb24gKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gcm93W3RoYXQuaGVhZGVyLnN0YXRlRmllbGRdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0QWxsU2VsZWN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiAkLmdyZXAodGhpcy5vcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChyb3cpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvd1t0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrQWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY2hlY2tBbGxfKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudW5jaGVja0FsbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNoZWNrQWxsXyhmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jaGVja0ludmVydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHJvd3MgPSB0aGF0LiRzZWxlY3RJdGVtLmZpbHRlcignOmVuYWJsZWQnKTtcclxuICAgICAgICB2YXIgY2hlY2tlZCA9IHJvd3MuZmlsdGVyKCc6Y2hlY2tlZCcpO1xyXG4gICAgICAgIHJvd3MuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5wcm9wKCdjaGVja2VkJywgISQodGhpcykucHJvcCgnY2hlY2tlZCcpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGF0LnVwZGF0ZVJvd3MoKTtcclxuICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdGVkKCk7XHJcbiAgICAgICAgdGhhdC50cmlnZ2VyKCd1bmNoZWNrLXNvbWUnLCBjaGVja2VkKTtcclxuICAgICAgICBjaGVja2VkID0gdGhhdC5nZXRTZWxlY3Rpb25zKCk7XHJcbiAgICAgICAgdGhhdC50cmlnZ2VyKCdjaGVjay1zb21lJywgY2hlY2tlZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jaGVja0FsbF8gPSBmdW5jdGlvbiAoY2hlY2tlZCkge1xyXG4gICAgICAgIHZhciByb3dzO1xyXG4gICAgICAgIGlmICghY2hlY2tlZCkge1xyXG4gICAgICAgICAgICByb3dzID0gdGhpcy5nZXRTZWxlY3Rpb25zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJHNlbGVjdEFsbC5hZGQodGhpcy4kc2VsZWN0QWxsXykucHJvcCgnY2hlY2tlZCcsIGNoZWNrZWQpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdEl0ZW0uZmlsdGVyKCc6ZW5hYmxlZCcpLnByb3AoJ2NoZWNrZWQnLCBjaGVja2VkKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVJvd3MoKTtcclxuICAgICAgICBpZiAoY2hlY2tlZCkge1xyXG4gICAgICAgICAgICByb3dzID0gdGhpcy5nZXRTZWxlY3Rpb25zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJpZ2dlcihjaGVja2VkID8gJ2NoZWNrLWFsbCcgOiAndW5jaGVjay1hbGwnLCByb3dzKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5jaGVja18odHJ1ZSwgaW5kZXgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudW5jaGVjayA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgIHRoaXMuY2hlY2tfKGZhbHNlLCBpbmRleCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jaGVja18gPSBmdW5jdGlvbiAoY2hlY2tlZCwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgJGVsID0gdGhpcy4kc2VsZWN0SXRlbS5maWx0ZXIoc3ByaW50ZignW2RhdGEtaW5kZXg9XCIlc1wiXScsIGluZGV4KSkucHJvcCgnY2hlY2tlZCcsIGNoZWNrZWQpO1xyXG4gICAgICAgIHRoaXMuZGF0YVtpbmRleF1bdGhpcy5oZWFkZXIuc3RhdGVGaWVsZF0gPSBjaGVja2VkO1xyXG4gICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWQoKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoY2hlY2tlZCA/ICdjaGVjaycgOiAndW5jaGVjaycsIHRoaXMuZGF0YVtpbmRleF0sICRlbCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jaGVja0J5ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHRoaXMuY2hlY2tCeV8odHJ1ZSwgb2JqKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnVuY2hlY2tCeSA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICB0aGlzLmNoZWNrQnlfKGZhbHNlLCBvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuY2hlY2tCeV8gPSBmdW5jdGlvbiAoY2hlY2tlZCwgb2JqKSB7XHJcbiAgICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ2ZpZWxkJykgfHwgIW9iai5oYXNPd25Qcm9wZXJ0eSgndmFsdWVzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICByb3dzID0gW107XHJcbiAgICAgICAgJC5lYWNoKHRoaXMub3B0aW9ucy5kYXRhLCBmdW5jdGlvbiAoaW5kZXgsIHJvdykge1xyXG4gICAgICAgICAgICBpZiAoIXJvdy5oYXNPd25Qcm9wZXJ0eShvYmouZmllbGQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShyb3dbb2JqLmZpZWxkXSwgb2JqLnZhbHVlcykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGVsID0gdGhhdC4kc2VsZWN0SXRlbS5maWx0ZXIoJzplbmFibGVkJylcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHNwcmludGYoJ1tkYXRhLWluZGV4PVwiJXNcIl0nLCBpbmRleCkpLnByb3AoJ2NoZWNrZWQnLCBjaGVja2VkKTtcclxuICAgICAgICAgICAgICAgIHJvd1t0aGF0LmhlYWRlci5zdGF0ZUZpZWxkXSA9IGNoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICByb3dzLnB1c2gocm93KTtcclxuICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcihjaGVja2VkID8gJ2NoZWNrJyA6ICd1bmNoZWNrJywgcm93LCAkZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZCgpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihjaGVja2VkID8gJ2NoZWNrLXNvbWUnIDogJ3VuY2hlY2stc29tZScsIHJvd3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC5pbnNlcnRCZWZvcmUodGhpcy4kY29udGFpbmVyKTtcclxuICAgICAgICAkKHRoaXMub3B0aW9ucy50b29sYmFyKS5pbnNlcnRCZWZvcmUodGhpcy4kZWwpO1xyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5uZXh0KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy4kZWxfLmh0bWwoKSlcclxuICAgICAgICAgICAgLmNzcygnbWFyZ2luLXRvcCcsICcwJylcclxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgdGhpcy4kZWxfLmF0dHIoJ2NsYXNzJykgfHwgJycpOyAvLyByZXNldCB0aGUgY2xhc3NcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNob3dMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJHRhYmxlTG9hZGluZy5zaG93KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5oaWRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiR0YWJsZUxvYWRpbmcuaGlkZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudG9nZ2xlUGFnaW5hdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbiA9ICF0aGlzLm9wdGlvbnMucGFnaW5hdGlvbjtcclxuICAgICAgICB2YXIgYnV0dG9uID0gdGhpcy4kdG9vbGJhci5maW5kKCdidXR0b25bbmFtZT1cInBhZ2luYXRpb25Td2l0Y2hcIl0gaScpO1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFnaW5hdGlvbikge1xyXG4gICAgICAgICAgICBidXR0b24uYXR0cihcImNsYXNzXCIsIHRoaXMub3B0aW9ucy5pY29uc1ByZWZpeCArIFwiIFwiICsgdGhpcy5vcHRpb25zLmljb25zLnBhZ2luYXRpb25Td2l0Y2hEb3duKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBidXR0b24uYXR0cihcImNsYXNzXCIsIHRoaXMub3B0aW9ucy5pY29uc1ByZWZpeCArIFwiIFwiICsgdGhpcy5vcHRpb25zLmljb25zLnBhZ2luYXRpb25Td2l0Y2hVcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlUGFnaW5hdGlvbigpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy51cmwpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmluaXRTZXJ2ZXIocGFyYW1zICYmIHBhcmFtcy5zaWxlbnQsXHJcbiAgICAgICAgICAgIHBhcmFtcyAmJiBwYXJhbXMucXVlcnksIHBhcmFtcyAmJiBwYXJhbXMudXJsKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3JlZnJlc2gnLCBwYXJhbXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucmVzZXRXaWR0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dIZWFkZXIgJiYgdGhpcy5vcHRpb25zLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpdEhlYWRlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dGb290ZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5maXRGb290ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5zaG93Q29sdW1uID0gZnVuY3Rpb24gKGZpZWxkKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVDb2x1bW4oZ2V0RmllbGRJbmRleCh0aGlzLmNvbHVtbnMsIGZpZWxkKSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5oaWRlQ29sdW1uID0gZnVuY3Rpb24gKGZpZWxkKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVDb2x1bW4oZ2V0RmllbGRJbmRleCh0aGlzLmNvbHVtbnMsIGZpZWxkKSwgZmFsc2UsIHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0SGlkZGVuQ29sdW1ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJC5ncmVwKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGNvbHVtbikge1xyXG4gICAgICAgICAgICByZXR1cm4gIWNvbHVtbi52aXNpYmxlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0VmlzaWJsZUNvbHVtbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICQuZ3JlcCh0aGlzLmNvbHVtbnMsIGZ1bmN0aW9uIChjb2x1bW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbHVtbi52aXNpYmxlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUudG9nZ2xlQWxsQ29sdW1ucyA9IGZ1bmN0aW9uICh2aXNpYmxlKSB7XHJcbiAgICAgICAgJC5lYWNoKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGksIGNvbHVtbikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbHVtbnNbaV0udmlzaWJsZSA9IHZpc2libGU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEhlYWRlcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Q29sdW1ucykge1xyXG4gICAgICAgICAgICB2YXIgJGl0ZW1zID0gdGhpcy4kdG9vbGJhci5maW5kKCcua2VlcC1vcGVuIGlucHV0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoJGl0ZW1zLmZpbHRlcignOmNoZWNrZWQnKS5sZW5ndGggPD0gdGhpcy5vcHRpb25zLm1pbmltdW1Db3VudENvbHVtbnMpIHtcclxuICAgICAgICAgICAgICAgICRpdGVtcy5maWx0ZXIoJzpjaGVja2VkJykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNob3dBbGxDb2x1bW5zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlQWxsQ29sdW1ucyh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmhpZGVBbGxDb2x1bW5zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlQWxsQ29sdW1ucyhmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5maWx0ZXJCeSA9IGZ1bmN0aW9uIChjb2x1bW5zKSB7XHJcbiAgICAgICAgdGhpcy5maWx0ZXJDb2x1bW5zID0gJC5pc0VtcHR5T2JqZWN0KGNvbHVtbnMpID8ge30gOiBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gMTtcclxuICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSA9PT0gJ2JvdHRvbScgPyB0aGlzLiR0YWJsZUJvZHlbMF0uc2Nyb2xsSGVpZ2h0IDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhpcy4kdGFibGVCb2R5LnNjcm9sbFRvcCh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiR0YWJsZUJvZHkuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0U2Nyb2xsUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsVG8oKTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnNlbGVjdFBhZ2UgPSBmdW5jdGlvbiAocGFnZSkge1xyXG4gICAgICAgIGlmIChwYWdlID4gMCAmJiBwYWdlIDw9IHRoaXMub3B0aW9ucy50b3RhbFBhZ2VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID0gcGFnZTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUucHJldlBhZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYWdlTnVtYmVyID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlci0tO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5uZXh0UGFnZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhZ2VOdW1iZXIgPCB0aGlzLm9wdGlvbnMudG90YWxQYWdlcykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFnZU51bWJlcisrO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2luYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS50b2dnbGVWaWV3ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5jYXJkVmlldyA9ICF0aGlzLm9wdGlvbnMuY2FyZFZpZXc7XHJcbiAgICAgICAgdGhpcy5pbml0SGVhZGVyKCk7XHJcbiAgICAgICAgLy8gRml4ZWQgcmVtb3ZlIHRvb2xiYXIgd2hlbiBjbGljayBjYXJkVmlldyBidXR0b24uXHJcbiAgICAgICAgLy90aGF0LmluaXRUb29sYmFyKCk7XHJcbiAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcigndG9nZ2xlJywgdGhpcy5vcHRpb25zLmNhcmRWaWV3KTtcclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLnJlZnJlc2hPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvL0lmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50IHRoZW4gYXZvaWQgdGhlIGNhbGwgb2YgZGVzdHJveSAvIGluaXQgbWV0aG9kc1xyXG4gICAgICAgIGlmIChjb21wYXJlT2JqZWN0cyh0aGlzLm9wdGlvbnMsIG9wdGlvbnMsIHRydWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodGhpcy5vcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3JlZnJlc2gtb3B0aW9ucycsIHRoaXMub3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5yZXNldFNlYXJjaCA9IGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgdmFyICRzZWFyY2ggPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5zZWFyY2ggaW5wdXQnKTtcclxuICAgICAgICAkc2VhcmNoLnZhbCh0ZXh0IHx8ICcnKTtcclxuICAgICAgICB0aGlzLm9uU2VhcmNoKHtjdXJyZW50VGFyZ2V0OiAkc2VhcmNofSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5leHBhbmRSb3dfID0gZnVuY3Rpb24gKGV4cGFuZCwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgJHRyID0gdGhpcy4kYm9keS5maW5kKHNwcmludGYoJz4gdHJbZGF0YS1pbmRleD1cIiVzXCJdJywgaW5kZXgpKTtcclxuICAgICAgICBpZiAoJHRyLm5leHQoKS5pcygndHIuZGV0YWlsLXZpZXcnKSA9PT0gKGV4cGFuZCA/IGZhbHNlIDogdHJ1ZSkpIHtcclxuICAgICAgICAgICAgJHRyLmZpbmQoJz4gdGQgPiAuZGV0YWlsLWljb24nKS5jbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmV4cGFuZFJvdyA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgIHRoaXMuZXhwYW5kUm93Xyh0cnVlLCBpbmRleCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jb2xsYXBzZVJvdyA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgIHRoaXMuZXhwYW5kUm93XyhmYWxzZSwgaW5kZXgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZXhwYW5kQWxsUm93cyA9IGZ1bmN0aW9uIChpc1N1YlRhYmxlKSB7XHJcbiAgICAgICAgaWYgKGlzU3ViVGFibGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ciA9IHRoaXMuJGJvZHkuZmluZChzcHJpbnRmKCc+IHRyW2RhdGEtaW5kZXg9XCIlc1wiXScsIDApKSxcclxuICAgICAgICAgICAgICAgIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgZGV0YWlsSWNvbiA9IG51bGwsXHJcbiAgICAgICAgICAgICAgICBleGVjdXRlSW50ZXJ2YWwgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlkSW50ZXJ2YWwgPSAtMTtcclxuXHJcbiAgICAgICAgICAgIGlmICghJHRyLm5leHQoKS5pcygndHIuZGV0YWlsLXZpZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgJHRyLmZpbmQoJz4gdGQgPiAuZGV0YWlsLWljb24nKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZUludGVydmFsID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghJHRyLm5leHQoKS5uZXh0KCkuaXMoJ3RyLmRldGFpbC12aWV3JykpIHtcclxuICAgICAgICAgICAgICAgICR0ci5uZXh0KCkuZmluZChcIi5kZXRhaWwtaWNvblwiKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZUludGVydmFsID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGV4ZWN1dGVJbnRlcnZhbCkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBpZEludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxJY29uID0gdGhhdC4kYm9keS5maW5kKFwidHIuZGV0YWlsLXZpZXdcIikubGFzdCgpLmZpbmQoXCIuZGV0YWlsLWljb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWxJY29uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbEljb24uY2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaWRJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpZEludGVydmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciB0cnMgPSB0aGlzLiRib2R5LmNoaWxkcmVuKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZFJvd18odHJ1ZSwgJCh0cnNbaV0pLmRhdGEoXCJpbmRleFwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5jb2xsYXBzZUFsbFJvd3MgPSBmdW5jdGlvbiAoaXNTdWJUYWJsZSkge1xyXG4gICAgICAgIGlmIChpc1N1YlRhYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kUm93XyhmYWxzZSwgMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHRycyA9IHRoaXMuJGJvZHkuY2hpbGRyZW4oKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kUm93XyhmYWxzZSwgJCh0cnNbaV0pLmRhdGEoXCJpbmRleFwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS51cGRhdGVGb3JtYXRUZXh0ID0gZnVuY3Rpb24gKG5hbWUsIHRleHQpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zW3NwcmludGYoJ2Zvcm1hdCVzJywgbmFtZSldKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzcHJpbnRmKCdmb3JtYXQlcycsIG5hbWUpXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRleHQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzcHJpbnRmKCdmb3JtYXQlcycsIG5hbWUpXSA9IHRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbml0VG9vbGJhcigpO1xyXG4gICAgICAgIHRoaXMuaW5pdFBhZ2luYXRpb24oKTtcclxuICAgICAgICB0aGlzLmluaXRCb2R5KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEJPT1RTVFJBUCBUQUJMRSBQTFVHSU4gREVGSU5JVElPTlxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICB2YXIgYWxsb3dlZE1ldGhvZHMgPSBbXHJcbiAgICAgICAgJ2dldE9wdGlvbnMnLFxyXG4gICAgICAgICdnZXRTZWxlY3Rpb25zJywgJ2dldEFsbFNlbGVjdGlvbnMnLCAnZ2V0RGF0YScsXHJcbiAgICAgICAgJ2xvYWQnLCAnYXBwZW5kJywgJ3ByZXBlbmQnLCAncmVtb3ZlJywgJ3JlbW92ZUFsbCcsXHJcbiAgICAgICAgJ2luc2VydFJvdycsICd1cGRhdGVSb3cnLCAndXBkYXRlQ2VsbCcsICd1cGRhdGVCeVVuaXF1ZUlkJywgJ3JlbW92ZUJ5VW5pcXVlSWQnLFxyXG4gICAgICAgICdnZXRSb3dCeVVuaXF1ZUlkJywgJ3Nob3dSb3cnLCAnaGlkZVJvdycsICdnZXRSb3dzSGlkZGVuJyxcclxuICAgICAgICAnbWVyZ2VDZWxscycsXHJcbiAgICAgICAgJ2NoZWNrQWxsJywgJ3VuY2hlY2tBbGwnLCAnY2hlY2tJbnZlcnQnLFxyXG4gICAgICAgICdjaGVjaycsICd1bmNoZWNrJyxcclxuICAgICAgICAnY2hlY2tCeScsICd1bmNoZWNrQnknLFxyXG4gICAgICAgICdyZWZyZXNoJyxcclxuICAgICAgICAncmVzZXRWaWV3JyxcclxuICAgICAgICAncmVzZXRXaWR0aCcsXHJcbiAgICAgICAgJ2Rlc3Ryb3knLFxyXG4gICAgICAgICdzaG93TG9hZGluZycsICdoaWRlTG9hZGluZycsXHJcbiAgICAgICAgJ3Nob3dDb2x1bW4nLCAnaGlkZUNvbHVtbicsICdnZXRIaWRkZW5Db2x1bW5zJywgJ2dldFZpc2libGVDb2x1bW5zJyxcclxuICAgICAgICAnc2hvd0FsbENvbHVtbnMnLCAnaGlkZUFsbENvbHVtbnMnLFxyXG4gICAgICAgICdmaWx0ZXJCeScsXHJcbiAgICAgICAgJ3Njcm9sbFRvJyxcclxuICAgICAgICAnZ2V0U2Nyb2xsUG9zaXRpb24nLFxyXG4gICAgICAgICdzZWxlY3RQYWdlJywgJ3ByZXZQYWdlJywgJ25leHRQYWdlJyxcclxuICAgICAgICAndG9nZ2xlUGFnaW5hdGlvbicsXHJcbiAgICAgICAgJ3RvZ2dsZVZpZXcnLFxyXG4gICAgICAgICdyZWZyZXNoT3B0aW9ucycsXHJcbiAgICAgICAgJ3Jlc2V0U2VhcmNoJyxcclxuICAgICAgICAnZXhwYW5kUm93JywgJ2NvbGxhcHNlUm93JywgJ2V4cGFuZEFsbFJvd3MnLCAnY29sbGFwc2VBbGxSb3dzJyxcclxuICAgICAgICAndXBkYXRlRm9ybWF0VGV4dCdcclxuICAgIF07XHJcblxyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZSA9IGZ1bmN0aW9uIChvcHRpb24pIHtcclxuICAgICAgICB2YXIgdmFsdWUsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG5cclxuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ2Jvb3RzdHJhcC50YWJsZScpLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBCb290c3RyYXBUYWJsZS5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBvcHRpb24gPT09ICdvYmplY3QnICYmIG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkob3B0aW9uLCBhbGxvd2VkTWV0aG9kcykgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtZXRob2Q6IFwiICsgb3B0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbiA9PT0gJ2Rlc3Ryb3knKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMucmVtb3ZlRGF0YSgnYm9vdHN0cmFwLnRhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgJHRoaXMuZGF0YSgnYm9vdHN0cmFwLnRhYmxlJywgKGRhdGEgPSBuZXcgQm9vdHN0cmFwVGFibGUodGhpcywgb3B0aW9ucykpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyA/IHRoaXMgOiB2YWx1ZTtcclxuICAgIH07XHJcblxyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZS5Db25zdHJ1Y3RvciA9IEJvb3RzdHJhcFRhYmxlO1xyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZS5kZWZhdWx0cyA9IEJvb3RzdHJhcFRhYmxlLkRFRkFVTFRTO1xyXG4gICAgJC5mbi5ib290c3RyYXBUYWJsZS5jb2x1bW5EZWZhdWx0cyA9IEJvb3RzdHJhcFRhYmxlLkNPTFVNTl9ERUZBVUxUUztcclxuICAgICQuZm4uYm9vdHN0cmFwVGFibGUubG9jYWxlcyA9IEJvb3RzdHJhcFRhYmxlLkxPQ0FMRVM7XHJcbiAgICAkLmZuLmJvb3RzdHJhcFRhYmxlLm1ldGhvZHMgPSBhbGxvd2VkTWV0aG9kcztcclxuICAgICQuZm4uYm9vdHN0cmFwVGFibGUudXRpbHMgPSB7XHJcbiAgICAgICAgc3ByaW50Zjogc3ByaW50ZixcclxuICAgICAgICBnZXRGaWVsZEluZGV4OiBnZXRGaWVsZEluZGV4LFxyXG4gICAgICAgIGNvbXBhcmVPYmplY3RzOiBjb21wYXJlT2JqZWN0cyxcclxuICAgICAgICBjYWxjdWxhdGVPYmplY3RWYWx1ZTogY2FsY3VsYXRlT2JqZWN0VmFsdWUsXHJcbiAgICAgICAgZ2V0SXRlbUZpZWxkOiBnZXRJdGVtRmllbGQsXHJcbiAgICAgICAgb2JqZWN0S2V5czogb2JqZWN0S2V5cyxcclxuICAgICAgICBpc0lFQnJvd3NlcjogaXNJRUJyb3dzZXJcclxuICAgIH07XHJcblxyXG4gICAgLy8gQk9PVFNUUkFQIFRBQkxFIElOSVRcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidGFibGVcIl0nKS5ib290c3RyYXBUYWJsZSgpO1xyXG4gICAgfSk7XHJcbn0pKGpRdWVyeSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG5cdC8vINGB0YLQsNCy0LjQvCDQtNC10YTQvtC70YLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4INC00LvRjyDQsNGP0LrRgdC+0LLRi9GFINGC0LDQsdC70LjRhiDRgSDRgdC+0YDRgtC40YDQvtCy0LrQvtC5INC4INC/0YAuXHJcblx0JC5leHRlbmQoIHRydWUsICQuZm4uYm9vdHN0cmFwVGFibGUuZGVmYXVsdHMsIHtcclxuXHRcdGljb25zUHJlZml4OiAnZmEnLFxyXG5cdFx0aWNvbnM6IHtcclxuXHRcdFx0cGFnaW5hdGlvblN3aXRjaERvd246ICdmYS1zb3J0LWRlc2MnLFxyXG5cdFx0XHRwYWdpbmF0aW9uU3dpdGNoVXA6ICdmYS1zb3J0LWFzYycsXHJcblx0XHRcdHJlZnJlc2g6ICdmYS1yZWZyZXNoJyxcclxuXHRcdFx0dG9nZ2xlOiAnZmEtbGlzdC1hbHQnLFxyXG5cdFx0XHRjb2x1bW5zOiAnZmEtZXllIG1yNScsXHJcblx0XHRcdGRldGFpbE9wZW46ICdmYS1wbHVzLXNxdWFyZS1vJyxcclxuXHRcdFx0ZGV0YWlsQ2xvc2U6ICdmYS1taW51cy1zcXVhcmUtbydcclxuXHRcdH0sXHJcblx0XHRwYWdlU2l6ZTogMjUsXHJcblx0XHRwYWdlTGlzdDogWzEwLCAyNSwgNTAsIDEwMCwgNTAwLCAxMDAwXSxcclxuXHRcdHNob3dSZWZyZXNoOiB0cnVlLFx0XHQvLyDQvtCx0L3QvtCy0LvQtdC90LjQtVxyXG5cdFx0Y2FjaGU6IGZhbHNlLFx0XHRcdC8vINC60LXRiNC40YDQvtCy0LDQvdC40LVcclxuXHRcdHNlYXJjaDogdHJ1ZSxcdFx0XHQvLyDQv9C+0LjRgdC6XHJcblx0XHRwYWdpbmF0aW9uOiB0cnVlLFx0XHQvLyDQv9Cw0LPQuNC90LDRhtC40Y9cclxuXHRcdHNob3dDb2x1bW5zOiB0cnVlLFx0XHQvLyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINGB0LrRgNGL0LLQsNGC0Ywg0YHRgtC+0LvQsdGG0YtcclxuXHRcdG1ldGhvZDogJ1BPU1QnLFxyXG5cdFx0cXVlcnlQYXJhbXM6IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuXHRcdFx0dmFyIHBhcmFtID0ge307XHJcblx0XHRcdFxyXG5cdFx0XHRwYXJhbS5ic3RhYmxlID0gcGFyYW1zO1xyXG5cdFx0XHQvL3BhcmFtLmJzdGFibGUuZmlsdGVyID0gZnVuY19nZXRfZm9ybV92YWxzKGJzVG9vbGJhckZpbHRlcik7XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gcGFyYW07XHJcblx0XHR9XHJcblx0fSApO1xyXG5cdFx0XHJcblx0Ly8gaWYgKGJzVG9vbGJhckZpbHRlcikge1xyXG5cdC8vIFx0JC5leHRlbmQoJC5mbi5ib290c3RyYXBUYWJsZS5kZWZhdWx0cywge1xyXG5cdC8vIFx0XHRzaG93RmlsdGVyOiB0cnVlLFxyXG5cdC8vIFx0XHR0b29sYmFyOiB2YXJzLmJzVG9vbGJhci5jbGFzcyxcclxuXHQvLyBcdFx0c2hvd1JlZnJlc2g6IGZhbHNlXHRcdC8vINC+0LHQvdC+0LLQu9C10L3QuNC1XHJcblx0Ly8gXHR9KTtcclxuXHQvLyB9IGVsc2Uge1xyXG5cdC8vIFx0JC5leHRlbmQoJC5mbi5ib290c3RyYXBUYWJsZS5kZWZhdWx0cywge1xyXG5cdC8vIFx0XHRzaG93RmlsdGVyOiBmYWxzZSxcclxuXHQvLyBcdFx0dG9vbGJhcjogJycsXHJcblx0Ly8gXHRcdHNob3dSZWZyZXNoOiB0cnVlXHRcdC8vINC+0LHQvdC+0LLQu9C10L3QuNC1XHJcblx0Ly8gXHR9KTtcclxuXHQvLyB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcblxyXG5cdGlmIChhZG0uJGJzdGFibGUoKS5sZW5ndGggPiAwKSB7XHJcblx0XHRhZG0uJGJzdGFibGUoKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0dmFyICRic3QgPSAkKHRoaXMpO1xyXG5cdFx0XHRpZiAoJGJzdC5oYXNDbGFzcygndXNlci1saXN0JykpIHtcclxuXHRcdFx0XHQkYnN0LmJvb3RzdHJhcFRhYmxlKHtcclxuXHRcdFx0XHRcdHNpZGVQYWdpbmF0aW9uOiAnc2VydmVyJyxcclxuXHRcdFx0XHRcdHNvcnROYW1lOiAnaWQnLFxyXG5cdFx0XHRcdFx0c29ydE9yZGVyOiAnZGVzYycsXHJcblx0XHRcdFx0XHRzaG93RGVsbDogdHJ1ZSxcclxuXHRcdFx0XHRcdC8vdXJsOiB1cmxcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHZhciAkdG9vbGJhciA9ICQoJy5maXhlZC10YWJsZS10b29sYmFyJyk7XHJcblx0XHQkKCcucGFnZS1oZWFkaW5nJykuYXBwZW5kKCR0b29sYmFyKTtcclxuXHRcdFxyXG5cdFx0YWRtLiRic3RhYmxlKCkub24oJ2xvYWQtc3VjY2Vzcy5icy50YWJsZScsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcblx0XHRcdCQoJ1tyZWw9XCJ0b29sdGlwXCJdJykudG9vbHRpcCh7XHJcblx0XHRcdFx0Y29udGFpbmVyOiAnYm9keSdcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vL1x00YTRg9C90LrRhtC40Lgg0LTQu9GPIGJvb3RzdHJhcFRhYmxlXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vIGZ1bmN0aW9uIGZ1bmNCU2dldElkU2VsZWN0aW9ucygpIHtcclxuLy8gXHRyZXR1cm4gJC5tYXAoYWRtLiRic3RhYmxlKCkuYm9vdHN0cmFwVGFibGUoJ2dldFNlbGVjdGlvbnMnKSwgZnVuY3Rpb24gKHJvdykge1xyXG4vLyBcdFx0cmV0dXJuIHJvdy5pZFxyXG4vLyBcdH0pO1xyXG4vLyB9XHJcblxyXG5cclxuLy93aW5kb3cub3BlcmF0ZUV2ZW50cyA9IHtcclxuLy9cdCdjbGljayAuZnVsbF9pbmZvX2xvZ3NfYWRtaW4nOiBmdW5jdGlvbiAoZSwgdmFsdWUsIHJvdywgaW5kZXgpIHtcclxuLy9cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4vL1x0XHR2YXIgcGFyYW0gPSBcIiZhY3Rpb249Z2V0X2Z1bGxfbG9nJmlkPVwiK3Jvd1snaWQnXTtcclxuLy9cdFx0ZnVuY19zZW5kX2FqYXgocGFyYW0sIGZhbHNlLCBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuLy9cdFx0XHR2YXIgcmVzdWx0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjYWxsYmFjay5ib2R5KSk7XHJcbi8vXHRcdFx0ZnVuY19uZXdfbW9kYWxfc2hvdygnaW5mbycsIHJvd1sndGl0bGUnXSwgcmVzdWx0KTtcclxuLy9cdFx0fSk7XHJcbi8vXHR9LFxyXG4vL1xyXG4vL1xyXG4vL1x0J2NsaWNrIC5saWtlJzogZnVuY3Rpb24gKGUsIHZhbHVlLCByb3csIGluZGV4KSB7XHJcbi8vXHJcbi8vXHRcdGFsZXJ0KCdZb3UgY2xpY2sgbGlrZSBpY29uLCByb3c6ICcgKyBKU09OLnN0cmluZ2lmeShyb3cpKTtcclxuLy9cdFx0Y29uc29sZS5sb2codmFsdWUsIHJvdywgaW5kZXgpO1xyXG4vL1x0fSxcclxuLy9cdCdjbGljayAuZWRpdCc6IGZ1bmN0aW9uIChlLCB2YWx1ZSwgcm93LCBpbmRleCkge1xyXG4vL1x0XHRhbGVydCgnWW91IGNsaWNrIGVkaXQgaWNvbiwgcm93OiAnICsgSlNPTi5zdHJpbmdpZnkocm93KSk7XHJcbi8vXHRcdGNvbnNvbGUubG9nKHZhbHVlLCByb3csIGluZGV4KTtcclxuLy9cdH0sXHJcbi8vXHQnY2xpY2sgLnJlbW92ZSc6IGZ1bmN0aW9uIChlLCB2YWx1ZSwgcm93LCBpbmRleCkge1xyXG4vL1x0XHRhbGVydCgnWW91IGNsaWNrIHJlbW92ZSBpY29uLCByb3c6ICcgKyBKU09OLnN0cmluZ2lmeShyb3cpKTtcclxuLy9cdFx0Y29uc29sZS5sb2codmFsdWUsIHJvdywgaW5kZXgpO1xyXG4vL1x0fVxyXG4vL307XHJcblxyXG5cclxuLyoqXHJcbiAqINCg0LXQsNC00LjQt9Cw0YbQuNGPINGE0LjQu9GM0YLRgNC+0LIg0LTQu9GPIGJvb3RzdHJhcFRhYmxlXHJcbiAqL1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHQndXNlIHN0cmljdCc7XHJcblxyXG5cclxuXHQkLmV4dGVuZCgkLmZuLmJvb3RzdHJhcFRhYmxlLmRlZmF1bHRzLCB7XHJcblx0XHRxdWVyeVBhcmFtc0ZpbHRlcjogZnVuY3Rpb24gKHBhcmFtcykge1xyXG5cdFx0XHRpZigkKFwiI3Rvb2xiYXJcIikuZXhpc3RzKCkpIHtcclxuXHRcdFx0XHR2YXIgZmlsdGVyID0ge307XHJcblx0XHRcdFx0JCgnI3Rvb2xiYXInKS5maW5kKCdpbnB1dFtuYW1lXScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0ZmlsdGVyWyQodGhpcykuYXR0cignbmFtZScpXSA9ICQodGhpcykudmFsKCk7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdCQoJyN0b29sYmFyJykuZmluZCgnc2VsZWN0W25hbWVdJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHR2YXIgc3RyID0gJyc7XHJcblx0XHRcdFx0XHQkKHRoaXMpLmNoaWxkcmVuKCdvcHRpb246c2VsZWN0ZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoJCh0aGlzKS5sZW5ndGggPiAwICYmICQodGhpcykudmFsKCkubGVuZ3RoID4gMCApIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoc3RyICE9ICcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRzdHIgKz0gXCIsIFwiO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRzdHIgKz0gXCInXCIgKyAkKHRoaXMpLnZhbCgpICsgXCInXCI7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdGlmIChzdHIubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXJbJCh0aGlzKS5hdHRyKCduYW1lJyldID0gc3RyO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0cGFyYW1zLmZpbHRlciA9IGZpbHRlcjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1zO1xyXG5cdFx0fSxcclxuXHRcdHNob3dGaWx0ZXI6IGZhbHNlLFxyXG5cdFx0c2hvd1JlZnJlc2g6IGZhbHNlLFxyXG5cdFx0b25DbGVhck9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblxyXG5cdCQuZXh0ZW5kKCQuZm4uYm9vdHN0cmFwVGFibGUuZXZlbnRzLCB7XHJcblx0XHQnY2xlYXItb3B0aW9ucy5icy50YWJsZSc6ICdvbkNsZWFyT3B0aW9ucydcclxuXHR9KTtcclxuXHJcblxyXG5cdHZhciBCb290c3RyYXBUYWJsZSA9ICQuZm4uYm9vdHN0cmFwVGFibGUuQ29uc3RydWN0b3IsXHJcblx0XHRfaW5pdCA9IEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0LFxyXG5cdFx0X2luaXRUb29sYmFyID0gQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUb29sYmFyO1xyXG5cclxuXHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0VG9vbGJhciA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdF9pbml0VG9vbGJhci5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoYXJndW1lbnRzKSk7XHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblx0XHRpZiAodGhhdC5vcHRpb25zLnNob3dGaWx0ZXIpIHtcclxuXHRcdFx0dGhhdC4kdG9vbGJhclxyXG5cdFx0XHRcdC5maW5kKFwiLmNvbHVtbnNcIilcclxuXHRcdFx0XHQuYXBwZW5kKCcnICtcclxuXHRcdFx0XHQnXHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdCBkcm9wZG93bi10b2dnbGUgYnRuLWZpbHRlclwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiIGFyaWEtZXhwYW5kZWQ9XCJ0cnVlXCI+JytcclxuXHRcdFx0XHQnXHRcdDxpIGNsYXNzPVwiZmEgZmEtZmlsdGVyIG1yNVwiPjwvaT4gPHNwYW4gY2xhc3M9XCJjYXJldFwiPjwvc3Bhbj4nK1xyXG5cdFx0XHRcdCdcdDwvYnV0dG9uPicrXHJcblx0XHRcdFx0J1x0PHVsIGNsYXNzPVwiZHJvcGRvd24tbWVudSBmaWx0ZXItbGlzdFwiIHJvbGU9XCJtZW51XCI+IDwvdWw+JytcclxuXHRcdFx0XHQnJyk7XHJcblx0XHRcdHRoYXQuJHRvb2xiYXIuZGVsZWdhdGUoJ2J1dHRvbltuYW1lPVwicmVmcmVzaFwiXScsICdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHRoYXQucmVmcmVzaCgpO1xyXG5cclxuXHRcdFx0XHQvLyDQsNC90LjQvNCw0YbQuNGPINC00LvRjyDQutC90L7Qv9C60Lgg0LfQsNC/0YPRgdC60LAg0L7QsdC90L7QstC70LXQvdC40Y9cclxuXHRcdFx0XHR2YXIgYnRuID0gJCh0aGlzKTtcclxuXHRcdFx0XHRidG4uYnV0dG9uKCdsb2FkaW5nJyk7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRidG4uYnV0dG9uKCdyZXNldCcpXHJcblx0XHRcdFx0fSwxMDAwIClcclxuXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHR9O1xyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdF9pbml0LmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpKTtcclxuXHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblx0XHR0aGlzLmluaXRGaWx0ZXJCdXR0b24oKTtcclxuXHRcdHRoaXMuaW5pdEZpbHRlcnMoKTtcclxuXHRcdHRoaXMuaW5pdEZpbHRlclNlbGVjdG9yKCk7XHJcblxyXG5cdFx0dGhpcy4kZWwub24oJ2xvYWQtc3VjY2Vzcy5icy50YWJsZScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKHRoYXQub3B0aW9ucy5zaG93RmlsdGVyKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyAodGhhdC4kdG9vbGJhcik7XHJcblx0XHRcdFx0Ly8kKHRoYXQub3B0aW9ucy50b29sYmFyKS5ib290c3RyYXBUYWJsZUZpbHRlcih7XHJcblx0XHRcdFx0Ly9cdGNvbm5lY3RUbzogdGhhdC4kZWxcclxuXHRcdFx0XHQvL30pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRGaWx0ZXJCdXR0b24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHRoaXMuJGJ1dHRvbiA9IHRoaXMuJHRvb2xiYXIuZmluZCgnLmJ0bi1maWx0ZXInKTtcclxuXHRcdHRoaXMuJGJ1dHRvbkxpc3QgPSB0aGlzLiRidXR0b24ucGFyZW50KCkuZmluZCgnLmZpbHRlci1saXN0Jyk7XHJcblx0XHR0aGlzLiRidXR0b24uZHJvcGRvd24oKTtcclxuXHRcdHRoaXMuJGZpbHRlcnMgPSB0aGlzLiR0b29sYmFyLmZpbmQoJy5mb3JtLWZpbHRlcicpLmZpbmQoJ1tuYW1lXScpO1xyXG5cdH07XHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0RmlsdGVycyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xyXG5cdFx0dGhhdC4kYnV0dG9uTGlzdC5hcHBlbmQoJzxsaSBjbGFzcz1cInJlbW92ZS1maWx0ZXJzXCI+PGEgY2xhc3M9XCJidG4gYnRuLXNtIGJ0bi1kZWZhdWx0IGJ0bi1sYWJlbFwiIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLXRpbWVzXCI+PC9pPiDQntGH0LjRgdGC0LjRgtGMINCy0YHQtSDRhNC40LvRjNGC0YDRizwvYT48L2xpPicpO1xyXG5cdFx0dGhhdC4kYnV0dG9uTGlzdC5hcHBlbmQoJzxsaSBjbGFzcz1cImRpdmlkZXJcIj48L2xpPicpO1xyXG5cclxuXHRcdCQuZWFjaCh0aGlzLiRmaWx0ZXJzLCBmdW5jdGlvbihpLCBmaWx0ZXIpIHtcclxuXHRcdFx0dGhhdC5hZGRGaWx0ZXIoZmlsdGVyKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhhdC4kdG9vbGJhci5kZWxlZ2F0ZSgnLnJlbW92ZS1maWx0ZXJzIConLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0dGhhdC5jbGVhckZpbHRlclZhbHVlKCk7XHJcblxyXG5cdFx0XHQkLmVhY2godGhhdC4kZmlsdGVycywgZnVuY3Rpb24oaSwgZmlsdGVyKSB7XHJcblx0XHRcdFx0dGhhdC5kaXNhYmxlRmlsdGVyKCQoZmlsdGVyKS5hdHRyKFwibmFtZVwiKSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRGaWx0ZXJTZWxlY3RvciA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuXHJcblx0XHR2YXIgYXBwbHlGaWx0ZXIgPSBmdW5jdGlvbigkY2hjaykge1xyXG5cdFx0XHR2YXIgZmlsdGVyRmllbGQgPSAkY2hjay5jbG9zZXN0KCdbZGF0YS1maWx0ZXItZmllbGRdJykuYXR0cignZGF0YS1maWx0ZXItZmllbGQnKTtcclxuXHRcdFx0aWYgKCRjaGNrLnByb3AoJ2NoZWNrZWQnKSkge1xyXG5cdFx0XHRcdHRoYXQuZW5hYmxlRmlsdGVyKGZpbHRlckZpZWxkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHRoYXQuZGlzYWJsZUZpbHRlcihmaWx0ZXJGaWVsZCk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0XHR0aGlzLiRidXR0b25MaXN0LmRlbGVnYXRlKCdsaSA6aW5wdXRbdHlwZT1jaGVja2JveF0nLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nICgnJGJ1dHRvbkxpc3QuZGVsZWdhdGUnLCQodGhpcykpO1xyXG5cdFx0XHRhcHBseUZpbHRlcigkKHRoaXMpKTtcclxuXHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy4kYnV0dG9uTGlzdC5kZWxlZ2F0ZSgnbGksIGxpIGEnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcblx0XHRcdHZhciAkY2hjayA9ICQoJzppbnB1dFt0eXBlPWNoZWNrYm94XScsIHRoaXMpO1xyXG5cdFx0XHRpZiAoJGNoY2subGVuZ3RoKSB7XHJcblx0XHRcdFx0JGNoY2sucHJvcCgnY2hlY2tlZCcsICEkY2hjay5pcygnOmNoZWNrZWQnKSk7XHJcblx0XHRcdFx0YXBwbHlGaWx0ZXIoJGNoY2spO1xyXG5cdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyICRpbnAgPSAkKCc6aW5wdXRbdHlwZT10ZXh0XScsIHRoaXMpO1xyXG5cdFx0XHRpZiAoJGlucC5sZW5ndGgpIHtcclxuXHRcdFx0XHQkaW5wLmZvY3VzKCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5hZGRGaWx0ZXIgPSBmdW5jdGlvbihmaWx0ZXIpIHtcclxuXHJcblx0XHR0aGlzLiRidXR0b25MaXN0LmFwcGVuZCgnPGxpIGRhdGEtZmlsdGVyLWZpZWxkPVwiJyArICQoZmlsdGVyKS5hdHRyKFwibmFtZVwiKSArICdcIj48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiPiAnICsgJChmaWx0ZXIpLmF0dHIoXCJwbGFjZWhvbGRlclwiKSArICc8L2E+PC9saT4nKTtcclxuXHRcdHRoaXMuZGlzYWJsZUZpbHRlcigkKGZpbHRlcikuYXR0cihcIm5hbWVcIikpO1xyXG5cclxuXHRcdC8vdGhpcy5maWx0ZXJzW2ZpbHRlci5maWVsZF0gPSBmaWx0ZXI7XHJcblx0XHQvL3RoaXMuJGJ1dHRvbkxpc3QuYXBwZW5kKCc8bGkgZGF0YS1maWx0ZXItZmllbGQ9XCInICsgZmlsdGVyLmZpZWxkICsgJ1wiPjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+ICcgKyBmaWx0ZXIubGFiZWwgKyAnPC9hPjwvbGk+Jyk7XHJcblx0XHQvL1xyXG5cdFx0Ly90aGlzLnRyaWdnZXIoJ2FkZC1maWx0ZXInLCBmaWx0ZXIpO1xyXG5cdFx0Ly9pZiAodHlwZW9mIGZpbHRlci5lbmFibGVkICE9PSAndW5kZWZpbmVkJyAmJiBmaWx0ZXIuZW5hYmxlZCkge1xyXG5cdFx0Ly9cdC8vdGhpcy5lbmFibGVGaWx0ZXIoZmlsdGVyLmZpZWxkKTtcclxuXHRcdC8vfVxyXG5cdH07XHJcblxyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZGlzYWJsZUZpbHRlciA9IGZ1bmN0aW9uKG5hbWVfZmllbGQpIHtcclxuXHRcdHZhciBmaWVsZCA9IHRoaXMuZ2V0RmlsdGVyKG5hbWVfZmllbGQpO1xyXG5cdFx0JChmaWVsZCkucGFyZW50cygnLmZvcm0tZ3JvdXAnKS5oaWRlKCk7XHJcblx0XHR0aGlzLiRidXR0b25MaXN0LmZpbmQoJ1tkYXRhLWZpbHRlci1maWVsZD0nICsgbmFtZV9maWVsZCArICddIGlucHV0W3R5cGU9Y2hlY2tib3hdJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuXHJcblx0fTtcclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmVuYWJsZUZpbHRlciA9IGZ1bmN0aW9uKG5hbWVfZmllbGQpIHtcclxuXHRcdHZhciBmaWVsZCA9IHRoaXMuZ2V0RmlsdGVyKG5hbWVfZmllbGQpO1xyXG5cdFx0JChmaWVsZCkucGFyZW50cygnLmZvcm0tZ3JvdXAnKS5zaG93KCk7XHJcblxyXG5cdH07XHJcblxyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuZ2V0RmlsdGVyID0gZnVuY3Rpb24obmFtZV9maWVsZCkge1xyXG5cdFx0dmFyIHRvUmV0dXJuID0gZmFsc2U7XHJcblx0XHQkLmVhY2godGhpcy4kZmlsdGVycywgZnVuY3Rpb24oaSwgZmlsdGVyKSB7XHJcblx0XHRcdGlmICgkKGZpbHRlcikuYXR0cihcIm5hbWVcIikgPT0gbmFtZV9maWVsZCkge1xyXG5cdFx0XHRcdHRvUmV0dXJuID0gJChmaWx0ZXIpO1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gdG9SZXR1cm47XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHJcblx0Ly8g0LTQvtCx0LDQstC70LXQvdC+INC00LXQudGB0YLQstC40LUg0L/QvtC0INC60L3QvtC/0LrRgyDQvtGH0LjRgdGC0LrQuCDQt9C90LDRh9C10L3QuNC5INGE0LjQu9GM0YLRgNC+0LJcclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuY2xlYXJGaWx0ZXJWYWx1ZSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuXHRcdHZhciByZWxvYWQgPSBmYWxzZTtcclxuXHRcdC8vINC40YnQtdC8INC40L3Qv9GD0YLRiyDQuCDRgdC10LvQtdC60YLRiyDRgyDQutC+0YLQvtGA0YvRhSDRg9C60LDQt9Cw0L3RiyDQsNGC0YDQuNCx0YPRgtGLIFwibmFtZVwiINC4INGB0LrQuNC00YvQstCw0LXQvCDQuNGFINC00LDQvdC90YvQtVxyXG5cdFx0dGhpcy4kZmlsdGVycy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCQodGhpcykudmFsKCkgJiYgJCh0aGlzKS52YWwoKS5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0cmVsb2FkID0gdHJ1ZTtcclxuXHRcdFx0XHQkKHRoaXMpLnZhbChudWxsKS50cmlnZ2VyKFwiY2hhbmdlXCIpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHJcblxyXG5cdFx0aWYgKHJlbG9hZCkge1xyXG5cdFx0XHRpZiAocGFyYW1zICYmIHBhcmFtcy51cmwpIHtcclxuXHRcdFx0XHR0aGlzLm9wdGlvbnMudXJsID0gcGFyYW1zLnVybDtcclxuXHRcdFx0XHR0aGlzLm9wdGlvbnMucGFnZU51bWJlciA9IDE7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5pbml0U2VydmVyKHBhcmFtcyAmJiBwYXJhbXMuc2lsZW50LCBwYXJhbXMgJiYgcGFyYW1zLnF1ZXJ5KTtcclxuXHRcdH1cclxuXHJcblx0fTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuXHJcblxyXG4vKipcclxuICog0KDQtdCw0LTQuNC30LDRhtC40Y8g0YTQuNC70YzRgtGA0L7QsiDQtNC70Y8gYm9vdHN0cmFwVGFibGVcclxuICovXHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cdCd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG5cdCQuZXh0ZW5kKCQuZm4uYm9vdHN0cmFwVGFibGUuZGVmYXVsdHMsIHtcclxuXHRcdHNob3dEZWxsOiB0cnVlLFxyXG5cdFx0YnRuRGVsbElkOiBcInJlbW92ZVwiXHQvLyBpZCDQutC90L7Qv9C60Lgg0YPQtNCw0LvQtdC90LjRj1xyXG5cdH0pO1xyXG5cclxuXHJcblx0JC5leHRlbmQoJC5mbi5ib290c3RyYXBUYWJsZS5ldmVudHMsIHtcclxuXHRcdCdkZWxsLW9wdGlvbnMuYnMudGFibGUnOiAnb25EZWxsT3B0aW9ucydcclxuXHR9KTtcclxuXHJcblxyXG5cdHZhciBCb290c3RyYXBUYWJsZSA9ICQuZm4uYm9vdHN0cmFwVGFibGUuQ29uc3RydWN0b3IsXHJcblx0XHRfaW5pdCA9IEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5pbml0LFxyXG5cdFx0X2luaXRUb29sYmFyID0gQm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUb29sYmFyO1xyXG5cclxuXHJcblx0Qm9vdHN0cmFwVGFibGUucHJvdG90eXBlLmluaXRUb29sYmFyID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0X2luaXRUb29sYmFyLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpKTtcclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHRcdGlmICh0aGF0Lm9wdGlvbnMuc2hvd0RlbGwpIHtcclxuXHRcdFx0dGhhdC4kdG9vbGJhclxyXG5cdFx0XHRcdC5maW5kKFwiLmNvbHVtbnNcIilcclxuXHRcdFx0XHQucHJlcGVuZCgnJyArXHJcblx0XHRcdFx0Ly8nPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj4nICtcclxuXHRcdFx0XHQnXHQ8YnV0dG9uIGRpc2FibGVkPVwiXCIgaWQ9XCInICsgdGhhdC5vcHRpb25zLmJ0bkRlbGxJZCArICdcIiBjbGFzcz1cImJ0biBidG4tZGFuZ2VyXCIgdGl0bGU9XCLRg9C00LDQu9C40YLRjFwiIGRhdGEtbG9hZGluZy10ZXh0PVwi0YPQtNCw0LvQtdC90LjQtSAuLi5cIj4nICtcclxuXHRcdFx0XHQnXHRcdDxpIGNsYXNzPVwiZmEgZmEtdHJhc2hcIj48L2k+JyArXHJcblx0XHRcdFx0J1x0PC9idXR0b24+JyArXHJcblx0XHRcdFx0Ly8nPC9kaXY+JytcclxuXHRcdFx0XHQnJyk7XHJcblxyXG5cdFx0XHR0aGF0LiRkZWxCdG4gPSAkKCcjJyt0aGF0Lm9wdGlvbnMuYnRuRGVsbElkKTtcclxuXHJcblx0XHRcdHRoYXQuJHRvb2xiYXIuZGVsZWdhdGUoJyMnK3RoYXQub3B0aW9ucy5idG5EZWxsSWQsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRcdHZhciBpZHMgPSBmdW5jQlNnZXRJZFNlbGVjdGlvbnMoKTtcclxuXHRcdFx0XHR2YXIgY250Um93ID0gaWRzLmxlbmd0aDtcclxuXHJcblxyXG5cclxuXHRcdFx0XHR2YXIgbXNnID0gJyc7XHJcblx0XHRcdFx0dmFyIG5hbWVMb2cgPSBjbnRSb3cgPiAxID8gJ9C70L7Qs9C+0LIgJyA6ICfQu9C+0LPQsCAnO1xyXG5cdFx0XHRcdG1zZyArPSAnPGI+0JLQvdC40LzQsNC90LjQtTwvYj46INCi0YDQtdCx0YPQtdGC0YHRjyDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjQtS4g0JLQtdGA0L3Rg9GC0Ywg0LHRg9C00LXRgiDQvdC10LvRjNC30Y8hICc7XHJcblx0XHRcdFx0bXNnICs9ICc8YnI+PGI+0J7Qv9C10YDQsNGG0LjRjzwvYj46INCj0LTQsNC70LXQvdC40LUgJyArIG5hbWVMb2c7XHJcblx0XHRcdFx0bXNnICs9ICc8YnI+PGI+0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtGA0L7QujwvYj46ICcgKyBjbnRSb3cgKyAnPHByZT4nICsgaWRzICsgJzwvcHJlPic7XHJcblxyXG5cdFx0XHRcdEJvb3RzdHJhcERpYWxvZy5jb25maXJtKG1zZywgZnVuY3Rpb24ocmVzdWx0KXtcclxuXHRcdFx0XHRcdGlmKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0XHR0aGF0LmRlbGwoaWRzKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHJcblxyXG5cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cclxuXHR9O1xyXG5cclxuXHRCb290c3RyYXBUYWJsZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdF9pbml0LmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpKTtcclxuXHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG5cdFx0Ly8g0YHRgtCw0LLQuNC8INGB0LvQtdC20LXQvdC40LUg0LfQsCDQstGL0LHRgNCw0L3QvdGL0LzQuCDRh9C10LrQsdC+0LrRgdCw0LzQuFxyXG5cdFx0Ly8g0Lgg0LIg0LfQsNCy0LjRgdC40LzQvtGB0YLQuCDQvtGCINC40YUg0YHRgtCw0YLRg9GB0LAg0LzQtdC90Y/QtdC8INGB0YLRg9GC0YPRgSDQutC90L7Qv9C60Lgg0L3QsCDQsNC60YLQuNCy0L3Rg9GOINC40LvQuCDQvdCw0L7QsdC+0YDQvtGCXHJcblx0XHRpZiAodGhhdC5vcHRpb25zLnNob3dEZWxsKSB7XHJcblx0XHRcdHRoYXQuJGVsLm9uKCdjaGVjay5icy50YWJsZSB1bmNoZWNrLmJzLnRhYmxlIGNoZWNrLWFsbC5icy50YWJsZSB1bmNoZWNrLWFsbC5icy50YWJsZScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR0aGF0LiRkZWxCdG4ucHJvcCgnZGlzYWJsZWQnLCAhJGJzdGFibGUuYm9vdHN0cmFwVGFibGUoJ2dldFNlbGVjdGlvbnMnKS5sZW5ndGgpO1xyXG5cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cclxuXHR9O1xyXG5cclxuXHQvLyDRhNGD0L3QutGG0LjRjyDRg9C00LDQu9C10L3QuNGPINC60LDQutC40YUg0LvQuNCx0L4g0LfQvdCw0YfQtdC90LjQuSAo0YHRgtGA0L7Quikg0YfQtdGA0LXQtyBCb290c3RyYXBUYWJsZVxyXG5cdEJvb3RzdHJhcFRhYmxlLnByb3RvdHlwZS5kZWxsID0gZnVuY3Rpb24oaWRzKSB7XHJcblx0XHR2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG5cdFx0dmFyIHBhcmFtID0ge307XHJcblx0XHRwYXJhbS5jb250XHQ9IHZhcnMuc2VuZFRvLmNvbnQ7XHJcblx0XHRwYXJhbS5tb2RcdD0gdmFycy5zZW5kVG8ubW9kO1xyXG5cdFx0cGFyYW0uZnVuY1x0PSB2YXJzLnNlbmRUby5mdW5jO1xyXG5cdFx0cGFyYW0uZG9cdD0gJ2RlbGV0ZSc7XHJcblx0XHRwYXJhbS5pZFx0PSBpZHM7XHJcblxyXG5cclxuXHRcdC8vINCw0L3QuNC80LDRhtC40Y8g0LTQu9GPINC60L3QvtC/0LrQuCDQt9Cw0L/Rg9GB0LrQsCDQvtCx0L3QvtCy0LvQtdC90LjRj1xyXG5cdFx0dGhhdC4kZGVsQnRuLmJ1dHRvbignbG9hZGluZycpO1xyXG5cclxuXHRcdGZ1bmNfc2VuZF9hamF4KHBhcmFtLCBmYWxzZSwgZnVuY3Rpb24gKHJlcykge1xyXG5cdFx0XHR2YXIgZGVsYXkgPSAwO1xyXG5cdFx0XHR2YXIgY250ID0gMDtcclxuXHRcdFx0dmFyIGNudFJvdyA9IHJlcy5sZW5ndGg7XHJcblx0XHRcdCQuZWFjaChyZXMsIGZ1bmN0aW9uIChpLCB2YWwpIHtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRmdW5jX21zZ19ub3RpZnkodmFsLnN0YXR1cywgdmFsLm1zZywgJ9Cj0LTQsNC70LXQvdC40LUg0LvQvtCz0LAnKTtcclxuXHRcdFx0XHRcdGlmICh2YWwuc3RhdHVzID09ICdzdWNjZXNzJykge1xyXG5cdFx0XHRcdFx0XHQkYnN0YWJsZS5ib290c3RyYXBUYWJsZSgncmVtb3ZlJywge1xyXG5cdFx0XHRcdFx0XHRcdGZpZWxkOiAnaWQnLFxyXG5cdFx0XHRcdFx0XHRcdHZhbHVlczogW3ZhbC5pZF1cclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y250ICsrO1xyXG5cdFx0XHRcdFx0aWYgKGNudFJvdyA9PSBjbnQpIHtcclxuXHRcdFx0XHRcdFx0Ly8g0YHQutC40LTRi9Cy0LDQtdC8INCw0L3QuNC80LDRhtGOINC60L3QvtC/0LrQuFxyXG5cdFx0XHRcdFx0XHR0aGF0LiRkZWxCdG4uYnV0dG9uKCdyZXNldCcpO1xyXG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0Ly8g0LTQtdCw0LrRgtC40LLQuNGA0YPQtdC8INC60L3QvtC/0LrRg1xyXG5cdFx0XHRcdFx0XHRcdHRoYXQuJGRlbEJ0bi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG5cdFx0XHRcdFx0XHR9LCAxKTtcclxuXHRcdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0XHRcdHRoYXQucmVmcmVzaCgpO1xyXG5cdFx0XHRcdFx0XHRcdGZ1bmNfbXNnX25vdGlmeSgnc3VjY2VzcycsICfQo9C00LDQu9C10L3QviDRgdGC0YDQvtC6OiAnICtjbnRSb3cpO1xyXG5cdFx0XHRcdFx0XHR9LCAxMDAwKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fSwgZGVsYXkgKz0gMTAwMCk7XHJcblxyXG5cdFx0XHR9KTtcclxuXHJcblxyXG5cdFx0fSk7XHJcblxyXG5cdH07XHJcblxyXG5cclxufShqUXVlcnkpOyJdLCJmaWxlIjoiYnMtdGFibGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
