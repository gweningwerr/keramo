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
		},
		/** DOM элемент .bstable */
		$bstable: function () {
			if (!this.chache.els.bstable) {
				this.chache.els.bstable = $('.bstable');
			}
			return this.chache.els.bstable;
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



