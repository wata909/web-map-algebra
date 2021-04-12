//凡例グラデーション表示コントロール
L.Control.Legend	= L.Control.extend({
	'onAdd'		: function ( map_ ) {
					//表示要素の生成
					this.element	= document.createElement( 'div' );
					this.element.classList.add( 'custom' );
					{
						//凡例部分：不透明度に対応
						const width		= this.options.width - this.options.leader;
						const height	= this.options.height;
						const canvas	= document.createElement( 'canvas' );
						canvas.classList.add( 'legend' );
						canvas.width	= width;
						canvas.height	= height;
						const context	= canvas.getContext( '2d' );
						const pixels	= [];
						for ( let y=0; y<height; y++ ) {
							const percentage	= ( height - y ) / height;
							const lineColor		= [
														Math.round( this.options.color[0] * percentage ),
														Math.round( this.options.color[1] * percentage ),
														Math.round( this.options.color[2] * percentage ),
														Math.round( this.options.color[3] * percentage )
													];
							for ( let x=0; x<width; x++ ) {
								pixels.push( lineColor[0] );
								pixels.push( lineColor[1] );
								pixels.push( lineColor[2] );
								pixels.push( lineColor[3] );
							}
							const imageData	= new ImageData( new Uint8ClampedArray(pixels), width );
							context.putImageData( imageData, 0, 0 );
						}
						this.element.appendChild( canvas );
					}
					{
						//スケール部分
						const width		= this.options.leader;
						const height	= this.options.height;
						const canvas	= document.createElement( 'canvas' );
						canvas.width	= width;
						canvas.height	= height;
						const context	= canvas.getContext( '2d' );
						context.fillStyle	= 'rgba(230,230,230,0.8)';
						context.fillRect( 0, 0, width, height );
						context.strokeStyle	= 'rgb(0,0,0)';
						context.lineWidth	= 1;
						context.beginPath();
						context.moveTo( 0,		1 );
						context.lineTo( width,	1 );
						context.moveTo( 0,		(height - 1) / 2 );
						context.lineTo( width,	(height - 1) / 2 );
						context.moveTo( 0,		height - 1 );
						context.lineTo( width,	height - 1 );
						context.stroke();
						this.element.appendChild( canvas );
					}
					//地図クリックイベント伝播の抑制
					L.DomEvent.on( this.element, 'click dblclick', function ( event_ ) {
						L.DomEvent.stop( event_ );
					});
					return this.element;
				}//function
});//extend
L.Control.legend	= function ( parameter_ ) {
	return new L.Control.Legend( parameter_ );
};
