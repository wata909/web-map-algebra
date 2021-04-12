$( document ).ready(function(){
	//********************************************************************************
	//地図の高さ調整（メニューの高さも同時に調整）
	(function(){
		var resize = function () {
			var height = $( window ).height();
			$( '#app' ).css({ 'height' : String( height ) + 'px' });
			//$( '#nav' ).css({ 'height' : String( height ) + 'px' });
		};
		resize();
		$( window ).on( 'orientationchange resize', function(){
			resize();
		});
	})();
});





