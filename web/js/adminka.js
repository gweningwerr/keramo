angular
	.module('app', ['ngAnimate', 'ngSanitize', 'ui.bootstrap'])
	.config(function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	});


function LayoutCtrl () {
	var vm = this;
	vm.isHideSidebar= false;
	vm.removeFromStock = function (item, index) {
		vm.items.splice(index, 1);
	};

}

function SidebarLeftCtrl () {
	var vm = this;
	vm.isHide = false;
	
}

angular
	.module('app')
	.controller('LayoutCtrl', LayoutCtrl)
	.controller('SidebarLeftCtrl', SidebarLeftCtrl);

angular
	.module('app')
	.controller('SidebarLeftCtrl1111111', function ($scope) {
		$scope.someValue = 'фууу ';
		
		$scope.singleModel = 1;
		
		$scope.radioModel = 'Middle';
		
		$scope.checkModel = {
			left: false,
			middle: true,
			right: false
		};
		
		$scope.checkResults = [];
		
		$scope.$watchCollection('checkModel', function () {
			$scope.checkResults = [];
			angular.forEach($scope.checkModel, function (value, key) {
				if (value) {
					$scope.checkResults.push(key);
				}
			});
		});
		
});

function MainCtrl ($scope) {
	$scope.items = [{
		name: 'Набор ныряльщика',
		id: 7297510
	},{
		name: 'Шноркель',
		id: 8278916
	},{
		name: 'Гидрокостюм',
		id: 2389017
	},{
		name: 'Полотенце',
		id: 1000983
	}];
}

angular
	.module('app')
	.controller('MainCtrl', MainCtrl);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhZG1pbmthLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXJcclxuXHQubW9kdWxlKCdhcHAnLCBbJ25nQW5pbWF0ZScsICduZ1Nhbml0aXplJywgJ3VpLmJvb3RzdHJhcCddKVxyXG5cdC5jb25maWcoZnVuY3Rpb24oJGludGVycG9sYXRlUHJvdmlkZXIpIHtcclxuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCdbWycpO1xyXG5cdFx0JGludGVycG9sYXRlUHJvdmlkZXIuZW5kU3ltYm9sKCddXScpO1xyXG5cdH0pO1xyXG5cclxuXHJcbmZ1bmN0aW9uIExheW91dEN0cmwgKCkge1xyXG5cdHZhciB2bSA9IHRoaXM7XHJcblx0dm0uaXNIaWRlU2lkZWJhcj0gZmFsc2U7XHJcblx0dm0ucmVtb3ZlRnJvbVN0b2NrID0gZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XHJcblx0XHR2bS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cdH07XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBTaWRlYmFyTGVmdEN0cmwgKCkge1xyXG5cdHZhciB2bSA9IHRoaXM7XHJcblx0dm0uaXNIaWRlID0gZmFsc2U7XHJcblx0XHJcbn1cclxuXHJcbmFuZ3VsYXJcclxuXHQubW9kdWxlKCdhcHAnKVxyXG5cdC5jb250cm9sbGVyKCdMYXlvdXRDdHJsJywgTGF5b3V0Q3RybClcclxuXHQuY29udHJvbGxlcignU2lkZWJhckxlZnRDdHJsJywgU2lkZWJhckxlZnRDdHJsKTtcclxuXHJcbmFuZ3VsYXJcclxuXHQubW9kdWxlKCdhcHAnKVxyXG5cdC5jb250cm9sbGVyKCdTaWRlYmFyTGVmdEN0cmwxMTExMTExJywgZnVuY3Rpb24gKCRzY29wZSkge1xyXG5cdFx0JHNjb3BlLnNvbWVWYWx1ZSA9ICfRhNGD0YPRgyAnO1xyXG5cdFx0XHJcblx0XHQkc2NvcGUuc2luZ2xlTW9kZWwgPSAxO1xyXG5cdFx0XHJcblx0XHQkc2NvcGUucmFkaW9Nb2RlbCA9ICdNaWRkbGUnO1xyXG5cdFx0XHJcblx0XHQkc2NvcGUuY2hlY2tNb2RlbCA9IHtcclxuXHRcdFx0bGVmdDogZmFsc2UsXHJcblx0XHRcdG1pZGRsZTogdHJ1ZSxcclxuXHRcdFx0cmlnaHQ6IGZhbHNlXHJcblx0XHR9O1xyXG5cdFx0XHJcblx0XHQkc2NvcGUuY2hlY2tSZXN1bHRzID0gW107XHJcblx0XHRcclxuXHRcdCRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdjaGVja01vZGVsJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuY2hlY2tSZXN1bHRzID0gW107XHJcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuY2hlY2tNb2RlbCwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcclxuXHRcdFx0XHRpZiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdCRzY29wZS5jaGVja1Jlc3VsdHMucHVzaChrZXkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcdFxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIE1haW5DdHJsICgkc2NvcGUpIHtcclxuXHQkc2NvcGUuaXRlbXMgPSBbe1xyXG5cdFx0bmFtZTogJ9Cd0LDQsdC+0YAg0L3Ri9GA0Y/Qu9GM0YnQuNC60LAnLFxyXG5cdFx0aWQ6IDcyOTc1MTBcclxuXHR9LHtcclxuXHRcdG5hbWU6ICfQqNC90L7RgNC60LXQu9GMJyxcclxuXHRcdGlkOiA4Mjc4OTE2XHJcblx0fSx7XHJcblx0XHRuYW1lOiAn0JPQuNC00YDQvtC60L7RgdGC0Y7QvCcsXHJcblx0XHRpZDogMjM4OTAxN1xyXG5cdH0se1xyXG5cdFx0bmFtZTogJ9Cf0L7Qu9C+0YLQtdC90YbQtScsXHJcblx0XHRpZDogMTAwMDk4M1xyXG5cdH1dO1xyXG59XHJcblxyXG5hbmd1bGFyXHJcblx0Lm1vZHVsZSgnYXBwJylcclxuXHQuY29udHJvbGxlcignTWFpbkN0cmwnLCBNYWluQ3RybCk7Il0sImZpbGUiOiJhZG1pbmthLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
