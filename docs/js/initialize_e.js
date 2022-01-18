//##############################################################################################################################
//アプリケーション変数
//##############################################################################################################################
const app	= {};
app.leaflet	= {
	'map'		: false,	//地図オブジェクト
	'controls'	: {},		//コントロールオブジェクト
	'layers'	: {},		//レイヤーオブジェクト
	'markers'	: {}		//範囲指定の最初のクリック位置を示すマーカー
};
app.data	= {
	//評価条件
	'conditions'	: {},
	//総合評価
	'total'			: {
							'compile'	: { 'formula' : '', 'valid' : false },
							'judge'		: { 'formula' : '', 'valid' : false }
						}
};

//##############################################################################################################################
//メイン処理
//##############################################################################################################################
$( document ).ready(function () {
	
	//######################################################################################################
	//精度？の問題かIEだけ表示が違うので対象外とする（highp指定がNGかも）
	if ( L.Browser.ie ) {
		alert( 'Internet Explorer is not supported.' );
		return;
	}
	
	//######################################################################################################
	//フォーム関連

	//------------------------------------------------------------------------------
	//不透明度スライダ（すべて）の初期設定
	$( '.opacity .slider' ).slider({
		'min'	: 0,
		'max'	: 100,
		'step'	: 1,
		'value'	: DEFINITIONS.opacity
	});
	$( 'span', $('.opacity .slider').next() ).text( String(DEFINITIONS.opacity) );
	//評価レイヤのスライダ
	$( '#wine .opacity .slider' ).slider({
		'slide'	: function ( event_, ui_ ) {
						//スライダを動かした場合の処理
						//不透明度数値を書き換える
						$( 'span', $(this).next() ).text( String(ui_.value) );
						//レイヤの不透明度を変更する
						app.leaflet.layers.wine.setOpacity( ui_.value / 100 );
						//凡例の不透明度を変更する
						$( 'div.custom canvas.legend' ).css({ 'opacity' : ui_.value / 100 });
					}//function
	});//slider
	//DDマップレイヤのスライダ
	$( '#ddmap .opacity .slider' ).slider({
		'slide'	: function ( event_, ui_ ) {
						//スライダを動かした場合の処理
						//不透明度数値を書き換える
						$( 'span', $(this).next() ).text( String(ui_.value) );
						//レイヤの不透明度を変更する
						//DDマップが存在する場合のみ処理（スライダが操作可能な場合はDDマップあるはず）
						if ( app.leaflet.layers.ddmap !== void(0) ) {
							app.leaflet.layers.ddmap.setOpacity( ui_.value / 100 );
						}//
					}//function
	});//slider
	
	//------------------------------------------------------------------------------
	//背景地図の準備
	DEFINITIONS.basemap.forEach(function ( value_ ) {
		$( document.createElement('option') )
			.text( value_.title )
			.val( value_.template )
			.appendTo( $('#basemap') );
	});//forEach
	
	//------------------------------------------------------------------------------
	//評価条件をループして処理：formの作成とデータの準備
	DEFINITIONS.conditions.forEach(function ( value_ ) {
		//評価条件の組み立て
		const $li	= $( document.createElement('li') )
						.appendTo( $('ul.conditions') )
						.data({ 'type' : value_.key });
		$( document.createElement('input') )
			.attr( 'type', 'checkbox' )
			.val( value_.key )
			.appendTo( $li );
		$( document.createTextNode(' ') ).appendTo( $li );
		$( document.createElement('input') )
			.addClass( 'formula' )
			.attr( 'type', 'button' )
			.val( 'Formula' )
			.appendTo( $li );
		$( document.createTextNode(' ' + value_.title + '（' + value_.key + '）') ).appendTo( $li );
		
		//データの組み立て
		app.data.conditions[value_.key]	= {
			'template'	: value_.template,
			'formula'	: '',
			'type'		: value_.type,
			'samples'	: value_.samples,
			'valid'		: false
		};
	});//forEach
	
	//######################################################################################################
	//地図関連設定

	//******************************************************************************************************
	//地図の生成
	app.leaflet.map	= L.map( 'app', DEFINITIONS.mapOption );
	//zoomコントロールの位置変更
	app.leaflet.map.zoomControl.setPosition( 'bottomright' );
	app.leaflet.controls	= {};
	//スケールコントロールを追加
	app.leaflet.controls.scale		= L.control.scale({ 'position' : 'bottomleft' }).addTo( app.leaflet.map );
	//ズームレベル確認コントロールの追加
	app.leaflet.controls.showZoom	= L.Control.showZoom({ 'position' : 'topright' }).addTo( app.leaflet.map );
	//保存ボタンコントロールの追加
	app.leaflet.controls.buttons	= L.Control.buttons({ 'position' : 'topright' })
										.addTo( app.leaflet.map )
										.addClass( 'custom_buttons' )
										.addLabel( 'Export', 'ok' )
										.addLabel( 'Dismiss', 'ng' )
										.hide();
	//凡例コントロールの追加
	app.leaflet.controls.legend	= L.Control.legend({
														'position'	: 'bottomright',
														'color'		: [ 255, 0, 255, 255 ],
														'width'		: 30,
														'height'	: 119,
														'leader'	: 5
													}).addTo( app.leaflet.map );
	//凡例不透明度の設定
	$( 'div.custom canvas.legend' ).css({ 'opacity' : $('#wine .opacity .slider').slider('value') / 100 });
	
	//******************************************************************************************************
	//背景地図を登録する
	app.leaflet.layers.basemap	= L.tileLayer( $('#basemap').val(), {
		'attribution'	: '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Tiles</a>'
	}).addTo( app.leaflet.map );
	//背景地図変更時の処理
	$( '#basemap' ).change(function () {
		app.leaflet.layers.basemap.setUrl( $(this).val() );
	});//change
	
	//******************************************************************************************************
	//評価条件レイヤの追加
	app.leaflet.layers.wine	= ( new L.WebglLayer(app.data) )
									.addTo( app.leaflet.map )
									.setOpacity( $('#wine .opacity .slider').slider('value') / 100 );
	
	//######################################################################################################
	//評価条件関連処理

	//******************************************************************************************************
	//評価条件レイヤチェックボックスクリック時の処理
	$( 'ul.conditions li input[type="checkbox"]' ).click(function(){
		//classの追加と削除：適用時はapplyクラスをつける（表示の変更）
		$( this ).parent().toggleClass( 'apply' );
		//データの有効・無効を登録する
		const key	= $( this ).val();
		app.data.conditions[key].valid	= $( this ).prop( 'checked' );
		//データの有効・無効で分岐処理：ボタンの文字色変更
		if ( !app.data.conditions[key].valid ) {
			$( this ).next( 'input' ).removeClass( 'notready' );
		} else if ( !app.data.conditions[key].formula.length ) {
			$( this ).next( 'input' ).addClass( 'notready' );
		}
		
		//チェックボックスを操作したら評価基準式と評価判定式のボタン操作を必ず要求する
		app.data.total.compile.valid	= false;
		app.data.total.judge.valid		= false;
		//ボタンを赤文字にする
		$( 'div.total input' ).removeClass( 'notready' ).addClass( 'notready' );
		
	});//click
	//******************************************************************************************************
	//評価条件の評価式ボタンクリック時の処理
	$( 'ul.conditions li input[type="button"].formula' ).click(function () {
		//チェックボックスを取得しておく
		const $check	= $( this ).siblings( 'input[type="checkbox"]' );
		//チェックボックスのオンオフで分岐処理
		if ( $check.prop('checked') === false ) {
			//オフの場合
			$( '#valueFormulaError' ).text( 'Befor input formula, select condition.' );
			app.modals.valueFormulaError.dialog( 'open' );
		} else {
			//オンの場合
			//見出しを取得してモーダルウインドウのタイトルを設定する
			const title		= $( this ).parent().text().trim();
			app.modals.valueFormula.dialog({
				'title'	: 'Assessment Formula（' + title + '）'
			});
			//キーを取得する
			const key		= $check.val();
			//キーを使ってモーダルのtextareaに値をセットする
			$( 'textarea', app.modals.valueFormula )
				.val( app.data.conditions[key].formula )
				.data({ 'type' : key });
			//組み込みボタン以外に値のボタンを追加する
			const $values	= $( '#valueFormula div.values' );
			$values.empty();
			$( document.createElement('input') )
				.attr({ 'type' : 'button' })
				.addClass( 'insert' )
				.val( key )
				.data( 'text', key )
				.appendTo( $values );
			//組み込みボタンはすべて表示
			$( '#valueFormula div.buttons' ).show();
			
			//サンプルボタンを表示
			$( '#valueFormula div.buttons.samples input' ).show();
			//サンプルボタンで入力する数式をセット
			$( '#valueFormula div.buttons.samples input.sample' ).data( 'formula', app.data.conditions[key].samples[0] );
			//モーダルウインドウを開く
			app.modals.valueFormula.dialog( 'open' );
		}//if
	});//click
	//******************************************************************************************************
	//評価基準式、結果判定式ボタンクリック時の処理
	$( 'div.total input[type="button"]' ).click(function () {
		//採用する評価条件を格納する変数を用意
		const useConditions	= [];
		//式が空でなく有効化されている場合はそのキーを変数に格納
		for ( let i in app.data.conditions ) {
			//validはformulaが入力されている前提でtrueになるので後者のチェックだけで良いかもしれない
			if ( app.data.conditions[i].formula.length > 0 && app.data.conditions[i].valid ) {
				useConditions.push( i );
			}//if
		}//for
		//評価条件チェックと評価式の入力有無を確認
		if ( useConditions.length === 0 ) {
			//評価条件が正しく指定されていない
			$( '#valueFormulaError' ).text( $(this).val() + 'を入力する前に適用する評価条件を選択し、各条件の評価式を入力してください。' );
			app.modals.valueFormulaError.dialog( 'open' );
		} else {
			//評価条件が正しく指定されている
			const type	= $( this ).attr( 'name' );
			//モーダルのtextareaに値をセットする（既に一度入力されている場合はその値、初めての場合は空文字列）
			$( 'textarea', app.modals.valueFormula )
				.val( app.data.total[type].formula )
				.data({ 'type' : type });
			//モーダルのタイトルを設定する
			app.modals.valueFormula.dialog({
				'title'	:  'Input ' + $( this ).val() 
			});
			//組み込みボタン以外に式で使用する各値のボタンを追加する
			const $values	= $( '#valueFormula div.values' );
			$values.empty();
			if ( type === 'compile' ) {
				//評価基準式の場合はチェックされた評価条件すべてのボタン
				useConditions.forEach(function ( value_ ) {
					$( document.createElement('input') )
						.attr({ 'type' : 'button' })
						.addClass( 'insert' )
						.val( value_ )
						.data( 'text', value_ )
						.appendTo( $values );
					$( document.createTextNode(' ') ).appendTo( $values );
				});
			} else {
				//結果判定式の場合はvalueボタン1つ
				$( document.createElement('input') )
					.attr({ 'type' : 'button' })
					.addClass( 'insert' )
					.val( 'value' )
					.data( 'text', 'value' )
					.appendTo( $values );
				//説明も加えておく
				$( document.createElement('span') ).css({ 'font-size' : '11px' }).text( ':Value of Assessment Formula' ).appendTo( $values );
			}
			//サンプルボタンは非表示
			$( '#valueFormula div.buttons.samples input' ).hide();
			//モーダルを開く
			app.modals.valueFormula.dialog( 'open' );
		}
	});//click
	//******************************************************************************************************
	//適用ボタンクリック時の処理
	$( '#wine' ).submit(function() {
		if ( app.data.total.compile.valid && app.data.total.judge.valid ) {
			const obj	= new StringToFormula();
			const options	= $.extend( true, {}, app.data );
			for ( let key_ in options ) {
				for ( let key__ in options[key_] ) {
					if ( options[key_][key__].valid === void(0) || options[key_][key__].valid === true ) {
						const formula	= options[key_][key__].formula;
						const compiled	= obj.compile( formula, key__ );
						options[key_][key__].formula	= compiled;
					}
				}
			}
			const result	= app.leaflet.layers.wine.updateProgram( options );
			if ( result === false ) {
				$( '#valueFormulaError' ).text( '数式のコンパイルに失敗しました。各数式を確認してください。' );
				app.modals.valueFormulaError.dialog( 'open' );
			} else {
				//反映ボタンの文字色を変更する
				$( 'div.total input[type="submit"]' ).removeClass( 'notready' );
			}//
		} else {
			$( '#valueFormulaError' ).text( '評価条件、評価基準式、結果判定式で確認が必要な項目があります。' );
			app.modals.valueFormulaError.dialog( 'open' );
		}
		return false;
	});
	
	//######################################################################################################
	//数式エディタ
	
	//モーダルウインドウ処理
	app.modals	= {};
	//******************************************************************************************************
	//数式入力用モーダル
	app.modals.valueFormula	= $( '#valueFormula' ).dialog({
		'width'		: 340,
		'modal'		: true,
		'dialogClass'	: 'no-close',
		'buttons'	: [
							{
								'text'	: 'Dismiss',
								'icon'	: 'ui-icon-cancel',
								'click'	: function () {
												$( this ).dialog( 'close' );
											}//function
							},
							{
								'text'	: 'Apply',
								'icon'	: 'ui-icon-pencil',
								'click'	: function () {
												//------------------------------------------
												//数式の適用先を決める
												const type		= $( 'textarea', this ).data( 'type' );
												//モーダル内のキーボタンからキーの配列を作る（バリデーション準備）
												const keys	= [];
												$( 'div.buttons.values input[type="button"]', this ).each(function ( index_, element_ ) {
													keys.push( $(element_).val() );
												});
												//数式から不要なものを取り去る（空行や行前後の空白文字）
												const formula	= $( 'textarea', this ).val().split( "\n" ).reduce(function (acc_, cur_) {
													const line	= cur_.trim();
													if ( line.length > 0 ) {
														return acc_.concat( [line] );
													} else {
														return acc_;
													}
												}, [] ).join( "\n" );
												//バリデーションのため数式内のキーを特定文字列に置換
												const _formula	= keys.reduce(function (acc_, cur_) {
													const regex	= new RegExp( cur_, 'g' );
													return acc_.replace( regex, 'value' );
												}, formula );
												
												//------------------------------------------
												//バリデーション
												const obj	= new StringToFormula();
												if ( formula.length === 0 ) {
													//評価式は必須
													alert( '評価式は必須です。' );
												} else if ( !obj.validate(_formula) ) {
													//バリデーション失敗
													alert( '評価式に誤りがあります。' );
												} else {
													//適用先に応じて分岐処理
													if ( type !== 'compile' && type !== 'judge' ) {
														//評価条件用
														app.data.conditions[type].formula	= formula;
														$( 'ul.conditions input[value="' + type + '"]' ).next( 'input' ).removeClass( 'notready' );
													} else {
														//評価基準・結果判定用
														app.data.total[type].formula	= formula;
														app.data.total[type].valid		= true;
														$( 'div.total input[name="' + type + '"]' ).removeClass( 'notready' );
														
														//評価基準と結果判定が両方とも問題ない場合は適用ボタンを有効化する
														/*
														if ( app.data.total.compile.valid && app.data.total.judge.valid ) {
															$( 'div.total input[type="submit"]' ).removeClass( 'notready' );
														}//
														*/
													}//
													$( this ).dialog( 'close' );
												}//
											}//function
							}
						],
		'autoOpen'	: false
	});//dialog
	//******************************************************************************************************
	//未チェック時注意モーダル
	app.modals.valueFormulaError	= $( '#valueFormulaError' ).dialog({
		'width'		: 340,
		'modal'		: true,
		'title'		: 'メッセージ',
		'dialogClass'	: 'no-close',
		'buttons'	: [
							{
								'text'	: 'OK',
								'icon'	: 'ui-icon-info',
								'click'	: function () {
												$( this ).dialog( 'close' );
											}
							}
						],
		'autoOpen'	: false
	});//dialog
	//******************************************************************************************************
	//文字列挿入ボタンクリック時の処理
	$( '#valueFormula' ).on( 'click', 'input.insert', function () {
		//挿入文字列
		const insertStr	= $( this ).data( 'text' );
		//カーソル位置に文字列を挿入
		const $textarea	= $( '#valueFormula textarea' );
		const position	= $textarea.get( 0 ).selectionStart;
		const text		= $textarea.val();
		$textarea.val(
			text.substr( 0, position ) + insertStr + text.substr( position )
		);
		//textareaをfocus
		$textarea.get( 0 ).focus();
		//次のカーソル位置を決めてセットする
		const nextCursor	= $( this ).data( 'insert' );
		const afterPosition	= ( nextCursor === void(0) ? insertStr.length : parseInt($(this).data('insert'), 10) ) + position;
		$textarea.get( 0 ).setSelectionRange( afterPosition, afterPosition );
	});
	//******************************************************************************************************
	//サンプルボタンクリック時の処理
	$( '#valueFormula div.buttons.samples input.sample' ).click(function () {
		//ボタンに割り当てられた式を取得
		const sample	= $( this ).data( 'formula' );
		//textareaに式挿入
		const $textarea	= $( '#valueFormula textarea' );
		//textareaが空の場合はそのまま、入力があれば上書き確認の後式挿入
		if ( $textarea.val().length === 0 || confirm('Over write formula？') ) {
			$textarea.val( sample );
		}
	});
	
	//######################################################################################################
	//画像保存
	
	app.save	= {
		'valid'		: false,	//画像保存開始フラグ
		'points'	: [],		//頂点格納配列
		'rectangle'	: false		//LafletのRectangle要素
	};
	//******************************************************************************************************
	//画像保存における地図クリック処理
	app.leaflet.map.on( 'click', function ( event_ ) {
		//画像保存が開始されているか否か
		if ( app.save.valid ) {
			//2点が保存されている場合のクリック（新たに1点目として登録するための準備）
			if ( app.save.points.length === 2 ) {
				//クリック地点を空にする
				app.save.points	= [];
				//表示中の図郭を削除する
				app.save.rectangle.remove();
				app.save.rectangle	= false;
				app.leaflet.markers.message.remove();
				
				app.leaflet.controls.buttons.hide();
			}//if
			
			//登録されている点の数で分岐
			if ( app.save.points.length === 0 ) {
				//登録された点がない場合の処理（1点目のクリック）
				app.leaflet.markers.vertex	= L.marker( event_.latlng, {
													'icon'	: L.icon({
														'iconUrl'		: 'img/vertex.png',
														'iconsize'		: L.point( 15, 15 ),
														'iconAnchor'	: L.point( 8, 8 )
													})
												}).addTo( app.leaflet.map );
			} else if ( app.save.points.length === 1 ) {
				//1点だけが登録されている場合の処理（2点目のクリック）
				app.leaflet.markers.vertex.remove();
				delete( app.leaflet.markers.vertex );
				
				const anchor	= app.save.rectangle.getCenter();
				app.leaflet.markers.message	= L.marker( anchor, {
															'icon'	: new L.divIcon({
																				'className'	: 'message',
																				'html'		: 'Click ”Export" or "Dismiss" in upper right',
																				'iconSize'	: L.point( 240, 40 ),
																			})
														}).addTo( app.leaflet.map );
				
				app.leaflet.controls.buttons.show();
			}//if

			//クリック地点を登録する
			app.save.points.push( event_ );
		}//if
	});
	//******************************************************************************************************
	//画像保存におけるマウス移動処理
	app.leaflet.map.on( 'mousemove', function ( event_ ) {
		if ( app.save.valid ) {
			//1点だけが決まっているとき、マウス移動に追随して図郭を描画する
			if ( app.save.points.length === 1 ) {
				//図郭未描画の場合は描画する
				if ( app.save.rectangle === false ) {
					var area = [
						app.save.points[0].latlng,
						[app.save.points[0].latlng.lat, event_.latlng.lng],
						[event_.latlng.lat, app.save.points[0].latlng.lng],
						event_.latlng
					];
					app.save.rectangle = L.rectangle( area, {
												'color'			: "#E92D63",
												'weight'		: 3,
												'opacity'		: 0.8,
												'fillColor'		: "#562DE9",
												'fillOpacity'	: 0.4
											}).addTo( app.leaflet.map );
				}//if
				//描画済みの図郭に対して、マウス移動で逐次座標を図郭に反映する
				app.save.rectangle.setBounds([
						app.save.points[0].latlng,
						[app.save.points[0].latlng.lat, event_.latlng.lng],
						[event_.latlng.lat, app.save.points[0].latlng.lng],
						event_.latlng
					]);
			}//if
		}//if
	});//function
	//******************************************************************************************************
	//保存開始ボタンのクリック
	$( 'input[name="start"]' ).click(function () {
		//保存実行フラグを有効にする
		app.save.valid	= true;
		//ボタンを入れ替えて、保存処理中の表示を出す
		$( '.save input' ).toggle();
		$( '#saving' ).show();
	});//click
	//******************************************************************************************************
	//保存終了ボタンのクリック
	$( 'input[name="cancel"], span.cancel' ).click(function () {
		//取得ボタン取り消しボタンを隠す
		app.leaflet.controls.buttons.hide();
		//保存実行フラグを無効にする
		app.save.valid	= false;
		//ボタンを入れ替えて、保存処理中の表示を隠す
		$( '.save input' ).toggle();
		$( '#saving' ).hide();
		
		//頂点、図郭、メッセージがあれば削除する
		if ( app.leaflet.markers.vertex ) {
			app.leaflet.markers.vertex.remove();
			delete( app.leaflet.markers.vertex );
		}
		if ( app.save.rectangle ) {
			app.save.rectangle.remove();
			app.save.rectangle	= false;
		}
		if ( app.leaflet.markers.message ) {
			app.leaflet.markers.message.remove();
		}
		//クリック地点を空にする
		app.save.points	= [];
	});//click
	//******************************************************************************************************
	//取り消すボタンのクリック：選択範囲をキャンセルしてボタンを隠す
	$( '.custom_buttons .ng' ).click(function () {
		//頂点、図郭、メッセージがあれば削除する
		if ( app.leaflet.markers.vertex ) {
			app.leaflet.markers.vertex.remove();
			delete( app.leaflet.markers.vertex );
		}
		if ( app.save.rectangle ) {
			app.save.rectangle.remove();
			app.save.rectangle	= false;
		}
		if ( app.leaflet.markers.message ) {
			app.leaflet.markers.message.remove();
		}
		//クリック地点を空にする
		app.save.points	= [];
	});//click
	//******************************************************************************************************
	//取得するボタンのクリック：画像を生成してダウンロード
	$( '.custom_buttons .ok' ).click(function () {
		//ズームレベル
		const zoom		= app.leaflet.map.getZoom();
		//保存範囲図郭を取得
		const saveBounds	= app.save.rectangle.getBounds();
		
		//背景地図のタイルサイズ
		const tileSize	= app.leaflet.layers.basemap.getTileSize();
		
		//保存範囲北西経緯度、南東経緯度
		const nwSaveBoundsLatLng	= saveBounds.getNorthWest();
		const seSaveBoundsLatLng	= saveBounds.getSouthEast();
		
		//画面表示範囲の北西と南東の経緯度を取得
		const displayBounds	= app.leaflet.map.getBounds();
		const nwDisplayBoundsLatLng	= displayBounds.getNorthWest();
		const seDisplayBoundsLatLng	= displayBounds.getSouthEast();
		
		//保存範囲全体が画面表示範囲に収まっているか確認
		if (
			nwSaveBoundsLatLng.lng < nwDisplayBoundsLatLng.lng
			|| seDisplayBoundsLatLng.lng < seSaveBoundsLatLng.lng
			|| nwDisplayBoundsLatLng.lat < nwSaveBoundsLatLng.lat
			|| seSaveBoundsLatLng.lat < seDisplayBoundsLatLng.lat
		) {
			//範囲に収まっていない場合はエラーを表示して終了
			$( '#valueFormulaError' ).text( 'Exprot area have to include map window.' );
			app.modals.valueFormulaError.dialog( 'open' );
			return false;
		}//if
		
		//保存範囲北西ピクセル座標、南東ピクセル座標
		const nwSaveBoundsPixel	= app.leaflet.map.options.crs.latLngToPoint( nwSaveBoundsLatLng, zoom ).round();
		const seSaveBoundsPixel	= app.leaflet.map.options.crs.latLngToPoint( seSaveBoundsLatLng, zoom ).round();
		
		//保存範囲における背景地図の北西タイル座標、南東タイル座標
		const nwTile	= nwSaveBoundsPixel.unscaleBy( tileSize ).floor();
		const seTile	= seSaveBoundsPixel.unscaleBy( tileSize ).floor();
		//保存範囲図郭北西端と保存範囲北西タイル左上とのピクセルのオフセット
		const offset	= nwSaveBoundsPixel.subtract( nwTile.scaleBy(tileSize) );
		
		//出力用canvas
		const canvas	= document.createElement( 'canvas' );
		canvas.width	= seSaveBoundsPixel.x - nwSaveBoundsPixel.x + 1;
		canvas.height	= seSaveBoundsPixel.y - nwSaveBoundsPixel.y + 1;
		const context	= canvas.getContext( '2d' );
		
		//背景地図のURLテンプレート
		const template	= app.leaflet.layers.basemap._url;
		//背景地図のタイル取得プロミス
		const promises	= [];
		for ( let j=nwTile.y; j<seTile.y+1; j++ ) {
			for ( let i=nwTile.x; i<seTile.x+1; i++ ) {
				const tile	= { 'x' : i, 'y' : j, 'z' : zoom };
				(function ( tile_ ) {
					const url	= L.Util.template( template, tile_ );
					promises.push(
						utilities.loadImage( url ).then(
							function ( data_ ) {
								if ( data_ !== false ) {
									context.drawImage(
														data_,
														( tile_.x - nwTile.x ) * tileSize.x - offset.x,
														( tile_.y - nwTile.y ) * tileSize.y - offset.y
													);
								}//if
							}//function
						)//then
					);//push
				})( tile );
			}//for
		}//for
		Promise.all( promises ).then(
			//data_は空
			function ( data_ ) {
				//この時点で背景canvasは完成している
				//WebGLレイヤを取得する（返り値がプロミス）
				return app.leaflet.layers.wine.export( saveBounds );
			}//function
		).then(
			function ( data_ ) {
				//不透明度を考慮してWebGLレイヤcanvasを貼り付け
				context.globalAlpha	= $( '#wine .opacity .slider').slider( 'value' ) / 100;
				context.drawImage( data_, 0, 0 );
				
				//ファイル名を決める（timestampをつける）
				const date	= new Date();
				const values	= [];
				values.push( date.getFullYear() );
				values.push( date.getMonth() + 1 );
				values.push( date.getDate() );
				values.push( date.getHours() );
				values.push( date.getMinutes() );
				values.push( date.getSeconds() );
				const timestamp	= values.reduce(function (acc_, cur_) {
					const value	= String( cur_ );
					return acc_ + ( value.length === 1 ? '0' : '' ) + value;
				}, '' );
				
				//画像をダウンロードさせる
				//safariもOK
				const a		= L.DomUtil.create( 'a' );
				a.download	= 'suitablemap_' + timestamp + '.png';
				a.href		= canvas.toDataURL();
				a.click();
			}//function
		);//then
	});//click
	
	//######################################################################################################
	//DDマップ関連処理
	//不透明度変更はスライダー生成時処理で記述、DDマップ追加処理はddmap.jsで記述
	//削除
	$( '#ddmap .opacity input.remove' ).click(function () {
		app.leaflet.layers.ddmap.remove();
		delete app.leaflet.layers.ddmap;
		$( '#ddmap .opacity .slider' ).slider({ 'value' : DEFINITIONS.opacity });
		$( '#ddmap .opacity .value span' ).text( String(DEFINITIONS.opacity) );
		$( '#ddmap' ).hide();
	});
});
