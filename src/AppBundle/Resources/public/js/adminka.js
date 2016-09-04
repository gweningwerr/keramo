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



