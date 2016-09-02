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