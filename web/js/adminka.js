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
	
	
	$('a.save-form').on('click', function (e) {
		e.preventDefault();
		var $form = $('form');
		var data = $form.serialize();
		sendAjax({
			url: $form.attr('action'),
			type: 'POST',
			data: data
		}, function (json) {
			if ( isOK(json) ) {
				console.log ('json.content', json.content);
				BsDialog.show({
					//title: 'Изменение пароля',
					size: BsDialog.SIZE_NORMAL,
					message: function() {
						return json.content.msg;
					},
					buttons: [ {
						label: 'Вернуться к списку',
						cssClass: 'btn-primary',
						action: function(dialog){
							window.location.href = json.content.link.list;
							dialog.close();
						}
					},{
						label: 'Продолжить редактирование',
						action: function(dialog){
							if (!isUrl( json.content.link.edit)){
								window.location.href = json.content.link.list;
							}
							dialog.close();
						}
					}]
				});
				
			} else {
				BsDialog.alert(json.content);
			}
		});
		
		
		
	});
	
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhZG1pbmthLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHRcclxuXHR3aW5kb3cuYWRtID0ge1xyXG5cdFx0Y2hhY2hlOiB7XHJcblx0XHRcdGVsczoge31cclxuXHRcdH0sXHJcblx0XHQvKiogRE9NINGN0LvQtdC80LXQvdGCIC53cmFwcGVyICovXHJcblx0XHQkd3JhcHBlcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoIXRoaXMuY2hhY2hlLmVscy53cmFwcGVyKSB7XHJcblx0XHRcdFx0dGhpcy5jaGFjaGUuZWxzLndyYXBwZXIgPSAkKCcud3JhcHBlcicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzLmNoYWNoZS5lbHMud3JhcHBlcjtcclxuXHRcdH0sXHJcblx0XHQvKiogRE9NINGN0LvQtdC80LXQvdGCIC5zaWRlYmFyLXNob3cgKi9cclxuXHRcdCRhU2lkZWJhclNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCF0aGlzLmNoYWNoZS5lbHMuYVNpZGViYXJTaG93KSB7XHJcblx0XHRcdFx0dGhpcy5jaGFjaGUuZWxzLmFTaWRlYmFyU2hvdyA9ICQoJy5zaWRlYmFyLXNob3cnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5jaGFjaGUuZWxzLmFTaWRlYmFyU2hvdztcclxuXHRcdH0sXHJcblx0XHQvKiogRE9NINGN0LvQtdC80LXQvdGCIC5ic3RhYmxlICovXHJcblx0XHQkYnN0YWJsZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoIXRoaXMuY2hhY2hlLmVscy5ic3RhYmxlKSB7XHJcblx0XHRcdFx0dGhpcy5jaGFjaGUuZWxzLmJzdGFibGUgPSAkKCcuYnN0YWJsZScpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzLmNoYWNoZS5lbHMuYnN0YWJsZTtcclxuXHRcdH1cclxuXHR9O1xyXG5cdFxyXG5cdC8qKlxyXG5cdCAqINC70LjQvdC6INC90LAg0YHQutGA0YvRgtC40LUg0Lgg0L/QvtC60LDQtyDRgdCw0LnQtNCx0LDRgNCwXHJcblx0ICovXHJcblx0YWRtLiRhU2lkZWJhclNob3coKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0YWRtLiR3cmFwcGVyKCkudG9nZ2xlQ2xhc3MoJ3NpZGViYXItaGlkZScpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdFxyXG5cdCQoJ2Euc2F2ZS1mb3JtJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHZhciAkZm9ybSA9ICQoJ2Zvcm0nKTtcclxuXHRcdHZhciBkYXRhID0gJGZvcm0uc2VyaWFsaXplKCk7XHJcblx0XHRzZW5kQWpheCh7XHJcblx0XHRcdHVybDogJGZvcm0uYXR0cignYWN0aW9uJyksXHJcblx0XHRcdHR5cGU6ICdQT1NUJyxcclxuXHRcdFx0ZGF0YTogZGF0YVxyXG5cdFx0fSwgZnVuY3Rpb24gKGpzb24pIHtcclxuXHRcdFx0aWYgKCBpc09LKGpzb24pICkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nICgnanNvbi5jb250ZW50JywganNvbi5jb250ZW50KTtcclxuXHRcdFx0XHRCc0RpYWxvZy5zaG93KHtcclxuXHRcdFx0XHRcdC8vdGl0bGU6ICfQmNC30LzQtdC90LXQvdC40LUg0L/QsNGA0L7Qu9GPJyxcclxuXHRcdFx0XHRcdHNpemU6IEJzRGlhbG9nLlNJWkVfTk9STUFMLFxyXG5cdFx0XHRcdFx0bWVzc2FnZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBqc29uLmNvbnRlbnQubXNnO1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGJ1dHRvbnM6IFsge1xyXG5cdFx0XHRcdFx0XHRsYWJlbDogJ9CS0LXRgNC90YPRgtGM0YHRjyDQuiDRgdC/0LjRgdC60YMnLFxyXG5cdFx0XHRcdFx0XHRjc3NDbGFzczogJ2J0bi1wcmltYXJ5JyxcclxuXHRcdFx0XHRcdFx0YWN0aW9uOiBmdW5jdGlvbihkaWFsb2cpe1xyXG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0ganNvbi5jb250ZW50LmxpbmsubGlzdDtcclxuXHRcdFx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSx7XHJcblx0XHRcdFx0XHRcdGxhYmVsOiAn0J/RgNC+0LTQvtC70LbQuNGC0Ywg0YDQtdC00LDQutGC0LjRgNC+0LLQsNC90LjQtScsXHJcblx0XHRcdFx0XHRcdGFjdGlvbjogZnVuY3Rpb24oZGlhbG9nKXtcclxuXHRcdFx0XHRcdFx0XHRpZiAoIWlzVXJsKCBqc29uLmNvbnRlbnQubGluay5lZGl0KSl7XHJcblx0XHRcdFx0XHRcdFx0XHR3aW5kb3cubG9jYXRpb24uaHJlZiA9IGpzb24uY29udGVudC5saW5rLmxpc3Q7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGRpYWxvZy5jbG9zZSgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdEJzRGlhbG9nLmFsZXJ0KGpzb24uY29udGVudCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcclxuXHRcdFxyXG5cdH0pO1xyXG5cdFxyXG59KTsiXSwiZmlsZSI6ImFkbWlua2EuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
