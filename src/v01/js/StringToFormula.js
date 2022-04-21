//数式クラス
const StringToFormula	= function () {
	//エラー格納変数
	this.errors		= [];
	//利用可能な文字列
	this.availables	= {
		'basic'		: [ '\\+', '\-', '\\*', '/', '\\(', '\\)', '==', '<=', '>=', '<', '>', 'if', 'value', '\\.', '\\d', ' ', '\n' ],
		'extend'	: []
	};
};//function

//**********************************************************************************
/*
	メソッド：式の妥当性チェック
*/
/*
StringToFormula.prototype.validate	= function ( formula_, extend_ ) {
	//第2引数如何で利用可能な文字列を決める
	const availables	= ( extend_ === void(0) || extend_ === true ) ? this.availables.basic.concat( this.availables.extend )
																		: this.availables.basic;
*/	
StringToFormula.prototype.validate	= function ( formula_ ) {
	//利用可能な文字列
	const availables	= this.availables.basic.concat( this.availables.extend );
	//利用可能な文字列で数式を置換していく
	const availableCheck	= availables.reduce(function ( acc_, cur_ ) {
		const regexp	= new RegExp( cur_, 'g' );
		return acc_.replace( regexp, '' );
	}, formula_ );//reduce
	//置換完了後に空文字列になっていない場合はエラー
	if ( availableCheck !== '' ) {
		this.errors.push( 'Unexpected character is included.' );
		return false;
	}//if
	
	//自分をコピー
	const that	= this;
	
	//ifチェック：最終行以外はifで始まり、最終行はifで始まらなければtrue
	//文字列をtrimして行に分割
	//const lines		= formula_.trim().split( "\n" );
	const lines		= formula_.trim().split( "\n" ).reduce(function (acc_, cur_) {
		if ( acc_ === false ) {
			return false;
		} else {
			//行をtrimする
			const line	= cur_.trim();
			//行の長さが0以上の場合に処理
			if ( line.length > 0 ) {
				//ifの出現回数を調べる
				const count	= ( line.match(new RegExp('if', 'g')) || [] ).length;
				if ( count > 1 ) {
					//2回以上出現する場合はエラー
					return false;
				} else {
					//1回以下の場合
					acc_.push( line );
				}//if
			}//if
			return acc_;
		}
	}, [] );
	if ( lines === false ) {
		return false;
	} else {
		const ifCheck	= lines.map(function ( value_, index_ ) {
			//行をtrim
			const line	= value_.trim();
			//行番号で分岐
			if (
				index_ !== lines.length - 1
				&& line.substr( 0, 2 ) !== 'if'
			) {
				//最終行以外はifで始まらなければエラー
				this.errors.push( 'Lines except for last line must start with "if".' );
				return false;
			} else if (
				index_ === lines.length - 1
				&& line.substr( 0, 2 ) === 'if'
			) {
				//最終行はifで以外で始まらなければエラー
				this.errors.push( 'Last line is prohibited including "if".' );
				return false;
			}//if
			//最終行は数字と四則演算のみ可とする記述が必要
			return true;
		}, this ).reduce(function ( acc_, cur_ ) {
			return acc_ && cur_;
		}, true );//reduce/map
		
		//エラーがあればfalseを返す
		if ( !ifCheck ) {
			return false;
		}//if
		
		//文法が正しいか否か（）
		const grammerCheck	= (function ( formula_ ) {
			try {
				//検査する値はvalue変数と仮定するので仮に数値を代入しておく
				const value	= 1;
				//式を評価して例外がスローされなかったら式として正しい
				eval( that.compile(formula_) );
				//trueを返す
				return true;
			} catch ( e ) {
				//例外がスローされたら式として正しくない
				//falseを返す
				return false;
			}//catch
		})( lines.join("\n") );
		return grammerCheck;
	}
};//function

//**********************************************************************************
/*
	メソッド：式をコンパイル
*/
StringToFormula.prototype.compile	= function ( formula_, name_ ) {
	const that	= this;
	const optimized	= formula_.split( "\n" ).map(function ( value_, index_ ) {
		//前後の空白文字を取り除く
		let line	= value_.trim();
		//連続する空白文字を1つの空白文字にする
		line	= line.replace( /[\s]+/g, ' ' );
		//先頭がifか否かで分岐処理
		if ( line.substr(0, 2) !== 'if' ) {
			//先頭がifじゃない（最終行）の場合は最後にセミコロンを付ける
			line	+= ' ;';
		} else {
			//先頭がifの場合
			//ifを取り除く：三項演算子に書き換える
			line	= line.substr( 2 ).trim();
			//ifの閉じ括弧位置を調べる
			let flag	= 0;
			for ( let i=0, j=line.length; i<j; i++ ) {
				if ( line.substr(i, 1) === '(' ) {
					flag++;
				} else if ( line.substr(i, 1) === ')' ) {
					flag--;
				}//if
				if ( flag === 0 ) {
					flag = i;
					break;
				}//if
			}//for
			//ifの閉じ括弧の後に「?」を三項演算子の挿入する
			line	= line.substr( 0, flag + 1 ) + ' ? ' + line.substr( flag + 1 ) + ' :';
		}//if
		//GLSL用：整数表記は小数表記に変換する（空白で分割して数字だけの文字列に「.0」をつける）
		//数字部分全部を取得
		const regexp	= /[0-9]+(\.[0-9]+)?/g;
		const matches	= line.matchAll( regexp );
		//変換テーブル格納用配列
		const converter	= [];
		//取得した数字部分を一つずつ処理
		for ( const match of matches ) {
			//小数点以下の数字がない場合のみ処理
			if ( match[1] === void(0) ) {
				//ユニークキー（アルファベットだけで構成）を作る
				const key	= that.uniqueKey();
				//該当する数字部分をユニークキーで置換する
				line	= line.replace( String(match[0]), key );
				//変換テーブルにユニークキーと小数点以下をつけた数字を格納
				converter.push( [key, match[0] + '.0'] );
			}//if
		}//for
		//数字部分をユニークキーに置換後、変換テーブルを使って小数文字列に置換
		for ( let i=0, j=converter.length; i<j; i++ ) {
			line	= line.replace( converter[i][0], converter[i][1] );
		}//for
		
		return line;
	});//map
	//------------------------------------------------------------------
	//コンパイル結果を返す
	return optimized.join( "\n" );
};//function

//**********************************************************************************
//compileで使う関数群（整数を小数に書き換えるために使う）

//**********************************************************************************
/*
	数字をアルファベットに変換
*/
StringToFormula.prototype.number2alphabet	= function ( value_ ) {
	const converter	= [ 'a', 'b', 'c', 'd', 'e', 'g', 'g', 'h', 'i', 'j' ];
	let value	= value_;
	for ( let i=0; i<10; i++ ) {
		value	= value.replaceAll( String(i), converter[i] );
	}
	return value;
};//function
/*
	ユニークキーを生成
*/
StringToFormula.prototype.uniqueKey	= function () {
	const millisecond	= ( new Date() ).getTime();
	const rand6digit	= Math.floor( Math.random() * (99999999 - 10000000) + 10000000 );
	return '#' + this.number2alphabet( String(millisecond) + '-' + String(rand6digit) ) + '#';
};//function
