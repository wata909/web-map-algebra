//**************************************************************************************************************************
//ユーティリティ関数
//**************************************************************************************************************************

var utilities	= {};

//**************************************************************
//画像をロードするプロミスを返す関数
/*
	@param	string	: url to load
	@return	promise	: 
*/
utilities.loadImage = function ( url_ ) {
	return new Promise (function ( resolve, reject ) {
		//画像オブジェクトの準備
		var img = new Image();
		//CORS設定
		img.crossOrigin = 'anonymous';
		//取得成功時の実行関数
		img.onload = function () {
			//画像要素を返す
			resolve( this );
		};//function
		//取得失敗時の実行関数
		img.onerror = function () {
			resolve( false );
		};//function
		//画像取得の実際
		img.src = url_;
	});
};//function

//**************************************************************
//テキストをロードするプロミスを返す関数
/*
	@param	string	: url to load
	@param	function	: callback function to aply to result
	@return	promise	: 
*/
utilities.loadText = function ( url_, callback_ ) {
	return new Promise(function ( resolve, reject ) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			if ( xhr.readyState !== 4 || xhr.status !== 200 ) {
				//取得失敗
				resolve( false );
			} else {
				//取得成功
				resolve( xhr.response );
			}//if
		};//function
		xhr.onerror = function () {
			resolve( false );
		};//function
		if ( callback_ !== void(0) ) {
			xhr.onprogress	= function ( event_ ) {
				callback_.call( null, event_ );
			};
		}//function
		//text取得の実際
		xhr.open( 'GET', url_ );
		xhr.send( null );
	});
};//function
