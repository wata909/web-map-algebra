//定義ファイル
//格納オブジェクト
const DEFINITIONS	= {};
//地図初期表示オプション
DEFINITIONS.mapOption	= {
							'center'	: [36.2277, 138.0721],
							'zoom'		: 10,
							'minZoom'	: 8,
							'maxZoom'	: 13
						};
//背景地図
DEFINITIONS.basemap	= [
						{
							'key'		: 'std',
							'title'		: '標準地図',
							'template'	: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
						},
						{
							'key'		: 'pale',
							'title'		: '淡色地図',
							'template'	: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
						},
						{
							'key'		: 'photo',
							'title'		: '写真',
							'template'	: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
						}
					];
//栽培適地評価条件//栽培適地評価条件
DEFINITIONS.conditions	= [
						{
							'key'		: 'geol',
							'title'		: '地質',
							'type'		: 'palette',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/seamless_original/{z}/{x}/{y}.png',
							'samples'	: [
											//	"if ( geol == 13997056 ) 1\nif ( geol == 13322240 ) 0.5\n0" original
											"if ( geol == 16777170 ) 1\nif ( geol == 16775900 ) 1\nif ( geol == 14483420 ) 1\nif ( geol == 14873058 ) 1 \nif ( geol == 16775065 ) 1 \nif ( geol == 15138815 ) 0.5 \n0"
											]
						},
						{
							'key'		: 'soil',
							'title'		: '土壌分類',
							'type'		: 'palette',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/soil/{z}/{x}/{y}.png',
							'samples'	: [
												"if ( soil < 119 ) 0\nif ( soil < 183 ) 1\n0"
											]
						},
						{
							'key'		: 'grad',
							'title'		: '傾斜量',
							'type'		: 'num100',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/dem_gradation/{z}/{x}/{y}.png',
							'samples'	: [
												// "if ( grad < 5 ) 0.4\nif ( grad > 12 ) 0.7\nif ( grad < 20 ) 1\nif ( grad > 30 ) 0.5\n0" original
												"if ( grad < 5 ) 1\nif ( grad < 10 ) 0.7\nif ( grad < 20 ) 0.5\nif ( grad < 30 ) 0.3\n0"
											]
						},
						{
							'key'		: 'dire',
							'title'		: '傾斜方位',
							'type'		: 'num100',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/dem_direction/{z}/{x}/{y}.png',
							'samples'	: [
												"if ( dire < 60 ) 0.2\nif ( dire > 300 ) 0.2\nif ( dire < 120 ) 0.5\nif ( dire > 240 ) 0.5\n1"
											]
						},
						{
							'key'		: 'tAve',
							'title'		: '平均気温',
							'type'		: 'num100',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/temperature_ave/{z}/{x}/{y}.png',
							'samples'	: [
												"if ( tAve < 5 ) 0.2\nif ( tAve < 10 ) 0.6\nif ( tAve < 16 ) 1\nif ( tAve < 20 ) 0.4\n0"
											]
						},
						{
							'key'		: 'tMin',
							'title'		: '年最低気温',
							'type'		: 'num100',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/temperature_min/{z}/{x}/{y}.png',
							'samples'	: [
												// "if ( tMin < -5 ) 0\nif ( tMin < 0 ) 0.5\nif( tMin < 10 ) 1.0\nif( tMin < 15 ) 0.5\n0" original
												"if ( tMin < 5 ) 0\n1"
											]
						},
						{
							'key'		: 'tMax',
							'title'		: '年最高気温',
							'type'		: 'num100',
							'template'	: 'https://habs.rad.naro.go.jp/data_tiles/data_tiles/nagano/temperature_max/{z}/{x}/{y}.png',
							'samples'	: [
												// "if ( tMax > 35 ) 0\nif ( tMax > 25 ) 0.5\nif( tMax > 20 ) 1.0\nif( tMax > 15 ) 0.5\n0" original
												"if ( tMax > 15 ) 0\nif ( tMax > 10 ) 1\nif ( tMax > 5 ) 0.5\n0"
											]
						}
					];
//栽培適地評価レイヤの不透明度
DEFINITIONS.opacity	= 60;
Object.freeze( DEFINITIONS );
