//ズームレベル表示コントロール
L.Control.ShowZoom	= L.Control.extend({
	'onAdd'	: function ( map_ ) {
					//表示要素の生成とCSS指定
					const element					= document.createElement( 'div' );
					element.style.color				= 'rgba(0, 0, 0, 0.7)';
					element.style.backgroundColor	= 'rgba(255, 255, 255, 0.7)';
					element.style.display			= 'table-cell';
					element.style.padding			= '0 4px';
					element.style.border			= '1px solid #999';
					element.style.borderRadius		= '4px';
					element.classList.add( 'custom_control' );
					
					//ズームレベル表記
					element.innerHTML				= 'z=' + String( map_.getZoom() );
					//ズームレベル変更時のズームレベル表記
					map_.on( 'zoomend', function( event_ ){
						element.innerHTML			= 'z=' + String( map_.getZoom() );
					});
					//地図クリックイベント伝播の抑制
					L.DomEvent.on( element, 'click dblclick', function ( event_ ) {
						L.DomEvent.stop( event_ );
					});
					return element;
				}//function
});//extend
L.Control.showZoom	= function ( parameter_ ) {
	return new L.Control.ShowZoom( parameter_ );
};
