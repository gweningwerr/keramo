$(document).ready(function () {
	
	window.adm = {
		chache: {
			els: {}
		},
		/** DOM элемент .wrapper */
		$wrapper: function () {
			if (!this.chache.els.wrapper) {
				this.chache.els.wrapper = $('.wrapper');
			}
			return this.chache.els.wrapper;
		},
		/** DOM элемент .sidebar-show */
		$aSidebarShow: function () {
			if (!this.chache.els.aSidebarShow) {
				this.chache.els.aSidebarShow = $('.sidebar-show');
			}
			return this.chache.els.aSidebarShow;
		}
	};
	
	/**
	 * линк на скрытие и показ сайдбара
	 */
	adm.$aSidebarShow().on('click', function (e) {
		e.preventDefault();
		adm.$wrapper().toggleClass('sidebar-hide');
	});
	
	
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhZG1pbmthLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHRcclxuXHR3aW5kb3cuYWRtID0ge1xyXG5cdFx0Y2hhY2hlOiB7XHJcblx0XHRcdGVsczoge31cclxuXHRcdH0sXHJcblx0XHQvKiogRE9NINGN0LvQtdC80LXQvdGCIC53cmFwcGVyICovXHJcblx0XHQkd3JhcHBlcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoIXRoaXMuY2hhY2hlLmVscy53cmFwcGVyKSB7XHJcblx0XHRcdFx0dGhpcy5jaGFjaGUuZWxzLndyYXBwZXIgPSAkKCcud3JhcHBlcicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzLmNoYWNoZS5lbHMud3JhcHBlcjtcclxuXHRcdH0sXHJcblx0XHQvKiogRE9NINGN0LvQtdC80LXQvdGCIC5zaWRlYmFyLXNob3cgKi9cclxuXHRcdCRhU2lkZWJhclNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCF0aGlzLmNoYWNoZS5lbHMuYVNpZGViYXJTaG93KSB7XHJcblx0XHRcdFx0dGhpcy5jaGFjaGUuZWxzLmFTaWRlYmFyU2hvdyA9ICQoJy5zaWRlYmFyLXNob3cnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5jaGFjaGUuZWxzLmFTaWRlYmFyU2hvdztcclxuXHRcdH1cclxuXHR9O1xyXG5cdFxyXG5cdC8qKlxyXG5cdCAqINC70LjQvdC6INC90LAg0YHQutGA0YvRgtC40LUg0Lgg0L/QvtC60LDQtyDRgdCw0LnQtNCx0LDRgNCwXHJcblx0ICovXHJcblx0YWRtLiRhU2lkZWJhclNob3coKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0YWRtLiR3cmFwcGVyKCkudG9nZ2xlQ2xhc3MoJ3NpZGViYXItaGlkZScpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdFxyXG59KTsiXSwiZmlsZSI6ImFkbWlua2EuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
