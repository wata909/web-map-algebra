//栽培適地評価レイヤ
L.WebglLayer	= L.GridLayer.extend({
	//**************************************************************************************
	//メソッドの上書き
	'_initContainer'	: function () {
		//----------------------------------------------------------------------------------
		//元のメソッドを呼んでおく
		L.GridLayer.prototype._initContainer.call( this );
		
		//----------------------------------------------------------------------------------
		//自分をコピー
		const that	= this;
		
		//----------------------------------------------------------------------------------
		//使用するcanvasを生成し、コンテキストを取得しておく
		//WebGL描画用
		this._webgl	= { 'element'	: L.DomUtil.create('canvas', 'webgl-layer') };
		//const gl	= this._webgl.context	= this._webgl.element.getContext( 'webgl', { 'preserveDrawingBuffer' : true }) || this._webgl.element.getContext( 'experimental-webgl' );
		const gl	= this._webgl.context	= this._webgl.element.getContext( 'webgl', { 'preserveDrawingBuffer' : true });
		
		//----------------------------------------------------------------------------------
		//領域抽出
		this._extractor	= {
			'element'	: L.DomUtil.create( 'canvas' ),
			'latlng'	: false,
			'radius'	: 0
		};

		//----------------------------------------------------------------------------------
		//クリア方法を定義
		gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
		gl.clearDepth( 1.0 );
		
		//----------------------------------------------------------------------------------
		//アルファブレンディングの有効化
		gl.enable( gl.BLEND );
		gl.blendFuncSeparate( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE );
		
		//----------------------------------------------------------------------------------
		//タイルデータ展開用：無駄だけど存在するソースの数だけcanvasを作っておく
		this._layers	= {};
		Object.keys( this.options.conditions ).forEach(function ( value_, index_ ) {
			that._layers[value_]	= { 'element' : L.DomUtil.create('canvas', 'webgl-child-layer') };
			that._layers[value_].index			= index_;
			that._layers[value_].element.width	= 1;
			that._layers[value_].element.height	= 1;
			that._layers[value_].context		= that._layers[value_].element.getContext( '2d' );
		});
		
		//----------------------------------------------------------------------------------
		//シェーダとプログラムを格納する変数を用意
		this._shaders	= { 'vertex' : false, 'fragment' : false };
		this._sources	= { 'vertex' : false, 'fragment' : false };
		
		try {
			//----------------------------------------------------------------------------------
			//シェーダの生成
			//■■■■ここは要検討■■■■
			const vShaderSource		= this._sources.vertex		= document.getElementById( 'vShader_default' ).textContent;
			this._shaders.vertex	= this.createShader( 'vertex', vShaderSource );
			const fShaderSource		= this._sources.fragment	= document.getElementById( 'fShader_default' ).textContent;
			const fEditedSource		= this.editShaderSource( fShaderSource );
			this._shaders.fragment	= this.createShader( 'fragment', fEditedSource );
			
			//----------------------------------------------------------------------------------
			//プログラムの生成
			const program	= this._webgl.program	= this.createProgram();
			//プログラム使用の宣言
			gl.useProgram( program );
			
			//----------------------------------------------------------------------------------
			//attribute変数のセット
			this.sendAttribute();
			
			//----------------------------------------------------------------------------------
			//テクスチャの初期化
			this.initTextures();
			
			//----------------------------------------------------------------------------------
			//タイルロード完了後
			//tileloadを加えるとGPUへのテクスチャ転送がロードしたタイルの数だけ発生する
			this.on( 'load', function ( event_ ) {
				L.Util.requestAnimFrame(function(){
					//WebGL描画用canvasを処理する
					that.updateCanvas();
				});//
			}, this );//on
			
			//----------------------------------------------------------------------------------
			//地図移動完了後（タイルロードがないときに備えて）
			this._map.on( 'moveend', function ( event_ ) {
				L.Util.requestAnimFrame(function(){
					//タイルロードがないときだけ処理実行
					if ( that.isLoading() === false ) {
						//WebGL描画用canvasを処理する
						that.updateCanvas();
					}//if
				});//
			}, this );//on
		} catch ( error_ ) {
			alert( error_.message );
		}//
	},//function
	
	//**************************************************************************************
	//パラメータのセット
	/*
		@param	string	: key for options
		@param	mixed	: value for key
		@return	object	: this layer
	*/
	'setOption'	: function ( name_, value_ ) {
		this.options[name_]	= value_;
		return this;
	},//function
	
	//**************************************************************************************
	//プロミス：画像ロード
	/*
		@param	string	: image url
		@return promise	: load image
	*/
	'loadImage'		: function ( url_ ) {
		return new Promise (function ( resolve_, reject_ ) {
			const img	= new Image();
			img.crossOrigin = 'anonymous';
			img.onload	= function () {
				resolve_( this );
			};
			img.onerror = function () {
				resolve_( false );
			};
			img.src	= url_;
		});//then
	},//function
	
	//**************************************************************************************
	//必須メソッド：タイルの呼び出し
	/*
		@param	object		: tile coordinates
		@param	function	: callback
		@return element		: created tile element
	*/
	'createTile'	: function ( coords_, done_ ) {
		//----------------------------------------------------------------------------------
		//自分をコピー
		const that	= this;
		
		//----------------------------------------------------------------------------------
		//タイルを生成する
		const tile	= L.DomUtil.create( 'div', 'webgl_tiles' );
		//タイルは表示しないので非表示cssを設定しておく
		tile.style.display	= 'none';
		//プロミス配列を用意する
		const promises	= [];
		Object.keys( this.options.conditions ).forEach(function ( value_ ) {
			const source	= that.options.conditions[value_];
			if ( source.valid ) {
				const promise	= (function ( key_, source_ ) {
					const url	= L.Util.template( source_.template, coords_ );
					return that.loadImage( url ).then(
								function ( data_ ) {
									if ( data_ !== false ) {
										data_.dataset.source	= key_;
										tile.appendChild( data_ );
									}//if
								}//function
							);//then
				})( value_, source );
				promises.push( promise );
			}//if
		});//forEach
		
		//----------------------------------------------------------------------------------
		//プロミス完了をleafletに通知する
		Promise.all( promises ).then(
			function ( data_ ) {
				done_( null, tile );
			}//function
		);//then
		
		//----------------------------------------------------------------------------------
		//タイルを返す
		return tile;
	},//function
	
	//**************************************************************************************
	//■■■■考え中■■■■
	//フラグメントシェーダ用
	//頂点シェーダは固定だがフラグメントシェーダは数式を変更できるようにする
	'editShaderSource'	: function ( source_ ) {
		//----------------------------------------------------------------------------------
		//自分をコピー
		const that	= this;
		
		//----------------------------------------------------------------------------------
		//各挿入箇所を示す文字列を指定
		const uniformsBreak		= '//{*--uniforms--*}//';
		const functionsBreak	= '//{*--functions--*}//';
		const texturesBreak		= '//{*--textures--*}//';
		const formulaeBreak		= '//{*--formulae--*}//';
		
		//----------------------------------------------------------------------------------
		//挿入文字列を生成するためのテンプレート
		const uniformsTemplate	= 'uniform sampler2D uTexture_{key};';
		const functionsTemplate	= 'float function_{key} ( float {key} ) { return {formula}; }';
		//const texturesTemplate	= 'float number_{key}	= function_{key}( rgb2number(texture2D(uTexture_{key}, vTextureCoords)) );';
		const texturesTemplate	= 'float number_{key}	= function_{key}( {type}(texture2D(uTexture_{key}, vTextureCoords)) ); //';
		
		const formulaTemplates	= {
			'compile'	: 'float value = ' + ( this.options.total.compile.formula === '' ? '0.0' : this.options.total.compile.formula ) + ';',
			'judge'		: 'value = ' + ( this.options.total.judge.formula === '' ? 'value' : this.options.total.judge.formula ) + ';',
		};
		
		//----------------------------------------------------------------------------------
		//生成した文字列を格納しておくための配列
		const uniforms	= [];
		const functions	= [];
		const textures	= [];
		const formulae	= [];
		
		//----------------------------------------------------------------------------------
		//レイヤーを走査して処理
		/*
		Object.keys( this._layers ).forEach(function ( value_ ) {
			//レイヤーを取得
			const layer	= that._layers[value_];
			uniforms.push( L.Util.template(uniformsTemplate, {'key' : value_}) );
			textures.push( L.Util.template(texturesTemplate, {'key' : value_}) );
		});
		*/
		Object.keys( this.options.conditions ).forEach(function ( value_ ) {
			const source	= that.options.conditions[value_];
			if ( source.valid ) {
				//uniform変数宣言
				uniforms.push( L.Util.template(uniformsTemplate, {'key' : value_}) );
				//評価材料用数値変換関数
				functions.push(
					L.Util.template( functionsTemplate, {'key' : value_, 'formula' : source.formula} )
				);
				//ピクセル座標から評価材料関数を
				textures.push( L.Util.template(texturesTemplate, {'key' : value_, 'type' : source.type}) );
				//評価基準式
				formulaTemplates.compile	= formulaTemplates.compile.replace( new RegExp(value_, 'g'), 'number_' + value_ );
			}
		});
		
		formulae.push( formulaTemplates.compile );
		formulae.push( formulaTemplates.judge );
		
		//----------------------------------------------------------------------------------
		//生成した各文字列を格納してシェーダソースを生成
		const source	= source_.replace( uniformsBreak, uniforms.join("\n") )
							.replace( functionsBreak, functions.join("\n") )
							.replace( texturesBreak, textures.join("\n") )
							.replace( formulaeBreak, formulae.join("\n") );
		
		//----------------------------------------------------------------------------------
		//シェーダソースを返す
		return source;
	},//function
	
	//**************************************************************************************
	//
	'createShader'	: function ( type_, source_ ) {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストを取得
		const gl	= this._webgl.context;
		
		//----------------------------------------------------------------------------------
		//シェーダ種別の決定
		const type	= ( type_ === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER );
		//シェーダの生成
		const shader	= gl.createShader( type );
		//シェーダのソースコードを割り当て
		gl.shaderSource( shader, source_ );
		//シェーダをコンパイル
		gl.compileShader( shader );
		//コンパイル成否の確認
		if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ){
			throw new Error( gl.getShaderInfoLog(shader) );
		}
		
		//----------------------------------------------------------------------------------
		//シェーダを返す
		return shader;
	},//function
	
	//**************************************************************************************
	//
	'createProgram'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストを取得
		const gl	= this._webgl.context;
		
		//----------------------------------------------------------------------------------
		//programを生成
		const program	= gl.createProgram();
		//programにコンパイルしたシェーダを割り当て
		gl.attachShader( program, this._shaders.vertex );
		gl.attachShader( program, this._shaders.fragment );
		//シェーダを割り当てたprogramをリンク
		gl.linkProgram( program );
		//成否の確認
		if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
			throw new Error( gl.getProgramInfoLog(program) );
		}
		
		//----------------------------------------------------------------------------------
		//生成したプログラムを返す
		return program;
	},//function
	
	//**************************************************************************************
	//
	'updateProgram'	: function ( options_ ) {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストを取得
		const gl	= this._webgl.context;
		
		//----------------------------------------------------------------------------------
		//判定条件の反映
		this.options.conditions	= options_.conditions;
		this.options.total	= options_.total;
		
		try {
			//----------------------------------------------------------------------------------
			//フラグメントシェーダを更新する
			const fShaderSource		= document.getElementById( 'fShader_default' ).textContent;
			const fEditedSource		= this.editShaderSource( fShaderSource );
			this._shaders.fragment	= this.createShader( 'fragment', fEditedSource );
			
			//----------------------------------------------------------------------------------
			//プログラムの生成
			const program	= this._webgl.program	= this.createProgram();
			//プログラム使用の宣言
			gl.useProgram( program );
			
			//----------------------------------------------------------------------------------
			//attribute変数のセット
			this.sendAttribute();
			
			//----------------------------------------------------------------------------------
			//テクスチャの初期化
			this.initTextures();
			
			//----------------------------------------------------------------------------------
			//再描画
			this.redraw();
		} catch ( error_ ) {
			alert( error_.message );
		}//
	},//function
	
	//**************************************************************************************
	//attribute変数をセット：頂点とテクスチャ座標
	'sendAttribute'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		const program	= this._webgl.program;
		
		//----------------------------------------------------------------------------------
		//頂点座標とテクスチャ座標は1度に送ることが出来るが可読性を考えてそれぞれで送る
		
		//----------------------------------------------------------------------------------
		//頂点座標を送る
		{
			//座標の用意
			var vertices = [
				-1.0, -1.0,  0.0,
				 1.0, -1.0,  0.0,
				-1.0,  1.0,  0.0,
				 1.0,  1.0,  0.0
			];
			//バッファを作ってデータを割り当てる
			const buffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
			//バッファと変数名を関連付ける
			const location	= gl.getAttribLocation( program, 'aPosition' );
			gl.vertexAttribPointer( location, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray( location );
			//バッファを開放する
			gl.bindBuffer( gl.ARRAY_BUFFER, null );
		}
		//----------------------------------------------------------------------------------
		//テクスチャ座標を送る
		{
			//座標の用意
			const coords = [
				0.0, 1.0,
				1.0, 1.0,
				0.0, 0.0,
				1.0, 0.0
			];
			//バッファを作ってデータを割り当てる
			const buffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW );
			//バッファと変数名を関連付ける
			const location	= gl.getAttribLocation( program, 'aTextureCoords' );
			gl.vertexAttribPointer( location, 2, gl.FLOAT, false, 0, 0 );
			gl.enableVertexAttribArray( location );
			//バッファを開放する
			gl.bindBuffer( gl.ARRAY_BUFFER, null );
		}
	},//function
	
	//**************************************************************************************
	//uniform変数をセット
	/*
		@param	string	: uniform type : ex) 1f, 2fv etc...
		@param	string	: uniform name
		@param	mixed	: uniform value
	*/
	'sendUniform'	: function ( type_, name_, value_ ) {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		const program	= this._webgl.program;
		
		//----------------------------------------------------------------------------------
		//uniform変数の名前を決めて値を割り当てる
		const location	= gl.getUniformLocation( program, name_ );
		gl['uniform' + type_]( location, value_ );
	},//function
	
	//**************************************************************************************
	//描画用canvasを更新する
	'updateCanvas'	: function () {
		//----------------------------------------------------------------------------------
		//使用するcanvasの位置とサイズを決める
		this.getProperties();
		//タイルデータ展開用canvasをリサイズする
		this.resizeLayers();
		//タイルデータ展開用canvasにタイルをはめ込む
		this.compileLayers();
		//描画用canvasの準備をする：リサイズ、DOM追加位置決め等
		this.prepareCanvas();
		//textureを送信する
		this.sendTextures();
		//抽出の準備をする
		this.prepareExtractor();
		//描画処理
		this.draw();
	},//function
	
	//**************************************************************************************
	//描画・展開用canvasのための属性決定
	'getProperties'	: function () {
		//----------------------------------------------------------------------------------
		//原点位置と幅・高さを決める
		const tileSize		= this.getTileSize();
		const pixelBounds	= this._map.getPixelBounds();
		const origin		= pixelBounds.min.unscaleBy( tileSize ).floor().scaleBy( tileSize ).subtract( this._level.origin );
		const dimension		= pixelBounds.max.unscaleBy( tileSize ).floor().add( new L.Point(1, 1) ).subtract( pixelBounds.min.unscaleBy( tileSize ).floor() ).scaleBy( tileSize );
		const width			= Math.pow( 2, Math.ceil(Math.log(dimension.x) / Math.log(2)) );
		const height		= Math.pow( 2, Math.ceil(Math.log(dimension.y) / Math.log(2)) );
		
		//----------------------------------------------------------------------------------
		//結果を格納して返す
		this._properties	= {
			'origin'	: origin,
			'size'		: { 'width' : width, 'height' : height }
		};
		return this._properties;
	},//function
	
	//**************************************************************************************
	//タイルデータ展開用canvasをリサイズ
	'resizeLayers'	: function () {
		//----------------------------------------------------------------------------------
		//タイルデータ展開用canvasのサイズをセットする
		for ( let key in this._layers ) {
			this._layers[key].element.width		= this._properties.size.width;
			this._layers[key].element.height	= this._properties.size.height;
		}//for
	},//function
	
	//**************************************************************************************
	//タイルデータ展開用canvasに取得済みタイルをセット
	'compileLayers'	: function () {
		//----------------------------------------------------------------------------------
		//自分をコピー
		const that	= this;
		
		//----------------------------------------------------------------------------------
		//展開先canvasを一旦クリアする
		for ( let key in this._layers ) {
			this._layers[key].context.clearRect( 0, 0, this._layers[key].element.width, this._layers[key].element.height );
		}//for
		
		//----------------------------------------------------------------------------------
		//取得済みタイルを走査して処理
		for ( let i in this._tiles ) {
			//タイルを取得する
			const tile	= this._tiles[i];
			//現行タイルのみ処理
			if ( tile.current ) {
				//canvas内でのタイルの位置を計算する
				const position	= this._getTilePos( tile.coords ).subtract( this._properties.origin );
				//タイル画像のDOM配列を処理しやすいよう通常配列に変換する
				const children	= Array.prototype.slice.call( tile.el.children );
				//タイル画像を走査して処理
				children.forEach(function ( value_ ) {
					//タイル画像のsource属性を取得する
					const source	= value_.dataset.source;
					//type属性が展開先canvas配列に含まれているか否かをチェック
					if ( typeof that._layers[source] !== void(0) ) {
						//タイル画像を適切な展開用canvasに書き込む
						that._layers[source].context.drawImage( value_, position.x, position.y );
					}//if
				});//forEach
			}//if
		}//for
	},//function
	
	//**************************************************************************************
	//描画用canvasを設定する
	'prepareCanvas'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		
		//----------------------------------------------------------------------------------
		//canvasのサイズ適用とviewport設定
		this._webgl.element.width	= this._properties.size.width;
		this._webgl.element.height	= this._properties.size.height;
		gl.viewport( 0, 0, this._properties.size.width, this._properties.size.height );
		
		//----------------------------------------------------------------------------------
		//抽出canvasも同じ大きさにする
		this._extractor.element.width	= this._properties.size.width;
		this._extractor.element.height	= this._properties.size.height;

		//----------------------------------------------------------------------------------
		//要素に追加する
		this._level.el.appendChild( this._webgl.element );
		//canvas位置を決める
		L.DomUtil.setPosition( this._webgl.element, this._properties.origin );
	},//function
	
	//**************************************************************************************
	//テクスチャを初期化する
	//テクスチャの参照を使い回すので生成したテクスチャをthis._texturesにキーで紐付けして格納
	'initTextures'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		const program	= this._webgl.program;
		
		this._textures	= {};
		for ( let _key in this._layers ) {
			//----------------------------------------------------------------------------------
			//texture名とlocationを決める
			const name		= 'uTexture_' + _key;
			const location	= gl.getUniformLocation( program, name );
			gl.uniform1i( location, this._layers[_key].index );
			
			//----------------------------------------------------------------------------------
			const texture = gl.createTexture();
			gl.activeTexture( gl.TEXTURE0 + this._layers[_key].index );
			gl.bindTexture( gl.TEXTURE_2D, texture );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
			this._textures[_key]	= texture;
			
			gl.bindTexture( gl.TEXTURE_2D, null );
		}//for
	},//function
	
	//**************************************************************************************
	//テクスチャを送る
	'sendTextures'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		
		//レイヤーを走査してテクスチャを送る
		for ( let _key in this._layers ) {
			//----------------------------------------------------------------------------------
			//textureをセットする
			gl.activeTexture( gl.TEXTURE0 + this._layers[_key].index );
			gl.bindTexture( gl.TEXTURE_2D, this._textures[_key] );
			const canvas	= this._layers[_key].element;
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas );
			
			//canvasを1x1にしておく（メモリ解放）
			canvas.width	= 1;
			canvas.height	= 1;
		}//for
	},//function
	
	//**************************************************************************************
	//描画の実行
	'draw'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストを変数に格納しておく
		const gl		= this._webgl.context;
		
		//----------------------------------------------------------------------------------
		//クリアして処理完了後に描画
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		gl.finish();
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
		//flushするとChromeで表示がおかしくなる・・・
		//gl.flush();
		
		//----------------------------------------------------------------------------------
		//バインドしたテクスチャを開放する
		gl.bindTexture( gl.TEXTURE_2D, null );
	},//function
	
	//**************************************************************************************
	//図郭を指定してWebGL画像を取得する（表示範囲のみ対応）
	/*
		@param	object	: bounds for export
	*/
	'export'	: function ( bounds_ ) {
		if ( bounds_ === void(0) ) {
			return this.loadImage( this._webgl.element.toDataURL() ).then(
				function ( data_ ) {
					const canvas	= document.createElement( 'canvas' );
					canvas.width	= data_.width;
					canvas.height	= data_.height;
					const context	= canvas.getContext( '2d' );
					context.drawImage( data_, 0, 0 );
					return canvas;
				}
			);
		} else {
			//ズームレベル
			const zoom		= this._map.getZoom();
			//図郭の北西端経緯度
			const nwLatLng	= bounds_.getNorthWest();
			//図郭の南東端経緯度
			const seLatLng	= bounds_.getSouthEast();
			//図郭の北西端ピクセル座標
			const nwPixel	= this._map.options.crs.latLngToPoint( nwLatLng, zoom ).round();
			//図郭の南東端ピクセル座標
			const sePixel	= this._map.options.crs.latLngToPoint( seLatLng, zoom ).round();
			//図郭の大きさ
			const size		= sePixel.add( new L.Point(1, 1) ).subtract( nwPixel );
			
			//タイルサイズ
			const tileSize			= this.getTileSize();
			//画面の北西端経緯度
			const nwLatLngDisplay	= this._map.getBounds().getNorthWest()
			//画面の北西端ピクセル座標
			const nwPixelDisplay	= this._map.options.crs.latLngToPoint( nwLatLngDisplay, zoom );
			//画面の北西端タイル座標
			const nwWebGLDisplay	= nwPixelDisplay.unscaleBy( tileSize ).floor().scaleBy( tileSize );
			
			//canvas範囲の北西端から図郭北西端までのオフセット
			const offset	= nwPixel.subtract( nwWebGLDisplay );
			
			//canvasを出力し、図郭範囲を切り取る
			return this.loadImage( this._webgl.element.toDataURL() ).then(
				function ( data_ ) {
					const canvas	= L.DomUtil.create( 'canvas' );
					canvas.width	= size.x;
					canvas.height	= size.y;
					const context	= canvas.getContext( '2d' );
					context.drawImage( data_, offset.x, offset.y, size.x, size.y, 0, 0, size.x, size.y );
					return canvas;
				}//function
			);//then
		}//if
	},//function

	//**************************************************************************************
	//抽出条件を保存する
	'setExtractor'	: function ( radius_, latlng_ ) {
		this._extractor.radius	= radius_;
		this._extractor.latlng	= latlng_;
		return this;
	},//function

	//**************************************************************************************
	//抽出の準備をする
	'prepareExtractor'	: function () {
		//抽出用canvasを取得して一旦描画をクリアする
		const extractor	= this._extractor;
		const canvas	= extractor.element;
		const context	= canvas.getContext( '2d' );
		context.clearRect( 0, 0, canvas.width, canvas.height );
		//抽出領域を埋める色をセット
		context.fillStyle	= 'rgba(255,255,255,1)';
		//半径の有無で分岐
		if ( !extractor.radius ) {
			//半径指定が0（抽出なし）
			//すべてを色で埋める
			context.fillRect( 0, 0, canvas.width, canvas.height );
		} else {
			//半径指定あり（抽出）
			//ズームレベルと中心のポイント座標を取得
			const zoom	= this._map.getZoom();
			const centerPoint	= app.leaflet.map.options.crs.latLngToPoint( extractor.latlng, zoom );
			//1ピクセルの距離を計算
			const pixelLength	= extractor.latlng.distanceTo(
				app.leaflet.map.options.crs.pointToLatLng( centerPoint.add(L.point(0, 1)), zoom )
			);
			//半径をピクセルサイズに変換
			const radiusPixel	= extractor.radius / pixelLength;
			//canvasの左上座標を計算
			const ltLatLng	= this._map.getBounds().getNorthWest();
			const tileSize	= this.getTileSize();
			const ltPoint	= this._map.options.crs.latLngToPoint( ltLatLng, zoom )
								.unscaleBy( tileSize )
								.floor()
								.scaleBy( tileSize );
			//円を描く
			context.beginPath();
			context.arc(
				centerPoint.x - ltPoint.x,
				centerPoint.y - ltPoint.y,
				radiusPixel,
				0,
				Math.PI * 2,
				false
			);
			context.fill();
		}
		//生成したcanvasをシェーダに送る
		this.sendExtractor();
	},//function
	'sendExtractor'	: function () {
		//----------------------------------------------------------------------------------
		//WebGLコンテキストとシェーダprogramを変数に格納しておく
		const gl		= this._webgl.context;
		const program	= this._webgl.program;

		//----------------------------------------------------------------------------------
		//texture名とlocationを決める
		const name		= 'uTextureExtractor';
		const textureNumber	= Object.keys( this._layers ).length;
		const location	= gl.getUniformLocation( program, name );
		gl.uniform1i( location, textureNumber );
		
		//----------------------------------------------------------------------------------
		//テクスチャを送る
		const texture = gl.createTexture();
		gl.activeTexture( gl.TEXTURE0 + textureNumber );
		gl.bindTexture( gl.TEXTURE_2D, texture );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._extractor.element );
	}//function
});//extend
//ショートカット
L.webglLayer	= function ( options_ ) {
	return new L.WebglLayer( options_ );
};//function