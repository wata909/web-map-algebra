//画像保存ボタン・キャンセルボタン
L.Control.Buttons	= L.Control.extend({
	'onAdd'		: function ( map_ ) {
					//表示要素の生成とCSS指定
					this.element	= document.createElement( 'div' );
					this.element.classList.add( 'custom_control' );
					
					this.buttons	= {};
					this.buttons.ok	= document.createElement( 'button' );
					this.buttons.ok.classList.add( 'ok' );
					this.buttons.ok.innerText	= 'OK';
					this.element.appendChild( this.buttons.ok );
					this.buttons.ng	= document.createElement( 'button' );
					this.buttons.ng.classList.add( 'ng' );
					this.buttons.ng.innerText	= 'Cancel';
					this.element.appendChild( this.buttons.ng );
					
					//地図クリックイベント伝播の抑制
					L.DomEvent.on( this.element, 'click dblclick', function ( event_ ) {
						L.DomEvent.stop( event_ );
					});
					return this.element;
				},//function
	//要素にclassを追加するためのメソッド
	'addClass'	: function ( class_, key_ ) {
					if ( key_ !== void(0) ) {
						this.buttons[key_].classList.add( class_ );
					} else {
						this.element.classList.add( class_ );
					}
					return this;
				},//function
	//要素からclassを削除するためのメソッド
	'removeClass'	: function ( class_, key_ ) {
					if ( key_ !== void(0) ) {
						this.buttons[key_].classList.remove( class_ );
					} else {
						this.element.classList.remove( class_ );
					}
					return this;
				},//function
	//要素を非表示にするメソッド
	'hide'		: function ( key_ ) {
					if ( key_ !== void(0) ) {
						this.buttons[key_].style.display	= 'none';
					} else {
						this.element.style.display			= 'none';
					}
					return this;
				},//function
	//要素を表示するメソッド
	'show'		: function ( key_ ) {
					if ( key_ !== void(0) ) {
						this.buttons[key_].style.display	= 'block';
					} else {
						this.element.style.display			= 'block';
					}
					return this;
				},//function
	//ラベルを設定するメソッド
	'addLabel'	: function ( label_, key_ ) {
					this.buttons[key_].innerText	= label_;
					return this;
				}//function
});//extend
L.Control.buttons	= function ( parameter_ ) {
	return new L.Control.Buttons( parameter_ );
};
