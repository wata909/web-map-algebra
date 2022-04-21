//**************************************************************************************************************************
//DDマップ関連処理
//クリック時の凡例取得に関する部分のみinitializeで記述
//**************************************************************************************************************************
$( document ).ready(function () {
	//**********************************************************************************
	//ドラッグアンドドロップに関する処理
	
	//----------------------------------------------------------------------------------
	//dragenter時の処理
	document.querySelector( 'body' ).addEventListener( 'dragenter', function ( event_ ) {
	    //デフォルト処理をキャンセル
	    event_.preventDefault();
	
	    //ドロップ領域dom要素を表示する
	    document.getElementById( 'drop' ).style.width	= '100%';
	    document.getElementById( 'drop' ).style.height	= document.getElementById( 'app' ).style.height;
	});//addEventListener
	
	//----------------------------------------------------------------------------------
	//dragleave時の処理
	document.getElementById( 'drop' ).addEventListener( 'dragleave', function ( event_ ) {
	    //デフォルト処理をキャンセル
	    event_.preventDefault();
	
	    //ドロップ領域dom要素を隠す
	    document.getElementById( 'drop' ).style.width	= 0;
	    document.getElementById( 'drop' ).style.height	= 0;
	}); //addEventListener
	
	//----------------------------------------------------------------------------------
	//dragover時の処理
	document.getElementById( 'drop' ).addEventListener( 'dragover', function ( event_ ) {
	    //デフォルト処理をキャンセル
	    event_.preventDefault();
	}); //addEventListener
	
	//----------------------------------------------------------------------------------
	//drop時の処理
	document.getElementById( 'drop' ).addEventListener( 'drop', function ( event_ ) {
		//デフォルト処理をキャンセル
		event_.preventDefault();
		
		//受け取った内容を変数に格納
		const receivedText = event_.dataTransfer.getData( 'text' );
		//URLが渡された場合とJSON文字列が渡された場合で分岐
		//URLが渡されたら該当JSONを取得
		//JSON文字列が渡されたらそのまま返す
		(
			//##記述変更
			//receivedText.substr( 0, 7 ) === 'http://' || receivedText.substr( 0, 8 ) === 'https://'
			receivedText.substring( 0, 7 ) === 'http://' || receivedText.substring( 0, 8 ) === 'https://'
			? utilities.loadText( receivedText )
			: Promise.resolve( receivedText )
		).then(
			function ( data_ ) {
				try {
					//データ取得に失敗したら例外を投げる
					if ( data_ === false ) {
						throw new Error( 'Failed to load json file.' );
					}//if
					
					//json文字列をパース
					const json	= JSON.parse( data_ );
					//urlがない、またはhttp、httpsで始まらない場合は例外を投げる
					if ( json.url === void(0) ) {
						throw new Error( '"url" is required.' );
					} else if ( json.url.indexOf('http://') !== 0 && json.url.indexOf('https://') !== 0 ) {
						throw new Error( '"url" must begins "http://" or "https://".' );
					} else if (
						json.url.indexOf( '{x}' ) === -1
						|| json.url.indexOf( '{y}' ) === -1
						|| json.url.indexOf( '{z}' ) === -1
					) {
						throw new Error( '"url" must contain "{x}", "{y}" and "{z}".' );
					}//if
					
					//パネルのDDマップ欄表示
					$( '#ddmap' ).show();
					//titleの表示
					const title	= ( json.title !== void(0) ? json.title : '(untitled layer)' );
					$( '#ddmap .title span' ).text( title );
					//DDマップ表示有無で分岐処理
					if ( app.leaflet.layers.ddmap !== false ) {
						//DDマップ表示あり
						//url更新のみ
						app.leaflet.layers.ddmap.setUrl( json.url );
					} else {
						//DDマップ表示なし
						//レイヤを生成して追加
						app.leaflet.layers.ddmap	= L.tileLayer( json.url, {
							'opacity'	: parseInt( $('#ddmap .opacity .slider').slider('value'), 10 ) / 100
						}).addTo( app.leaflet.map );
					}//if
					//評価レイヤーは常に最前面
					app.leaflet.layers.wine.bringToFront();
					
				} catch ( error_ ) {
					alert( error_.message );
				}//catch
				
				//ドロップ領域dom要素を隠す
				document.getElementById( 'drop' ).style.width	= 0;
				document.getElementById( 'drop' ).style.height	= 0;

				/* {追記} */
				//評価条件レイヤ選択のラジオボタンをすべて解除
				$( 'input.overlay' ).prop( 'checked', false );
				/* {追記} */

				/* {追記} */
				//ポップアップがある場合は表示を更新する
				if ( app.click.popup.isOpen() ) {
					const latlng	= app.click.popup.getLatLng();
					createLegendPopup( latlng );
				}
				/* {/追記} */
			}//function
		)//then
	});//addEventListener
});
