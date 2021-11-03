# ワイン用ブドウ栽培適地評価システム
## 本システムについて
本システムは，データタイルマップとして公開されている地形，地質，土壌，気象データを元に，WebGLによる地図間演算機能を用いてブドウのワイン専用品種の栽培適地を評価するためのプログラムです。  
現在のシステムは，クライアント側で動作するWebGISとしての機能開発を目的として構築，公開されたものであるため，現時点では，有効な適地推定ができないことに留意下さい。  
本システムの概要については，以下にて発表しました。  

- 岩崎亘典，・林 和則，田中聡久，鹿取みゆき，小口 高(2021)WebGLを用いたワイン用ブドウ栽培適地評価システムの開発．地理情報システム学会第30回学術研究発表大会

## 利用方法
本システムに接続すると，以下の画面が表示されます。  
![image](https://user-images.githubusercontent.com/3130494/140027552-624d1a06-5a26-4445-b09c-09403f9d5279.png)
基本的な操作は左上に配置した操作パネルから実行します。本件システムでは予め設定された評価条件から任意の条件を適用して栽培適地評価を実行します。現在利用可能な条件は「地質」「土壌分類」「傾斜量」「傾斜方位」「平均気温」「最低気温」「最高気温」の7つです。  
初期表示状態ではいずれの評価条件も選択されていない状態です。  
![image](https://user-images.githubusercontent.com/3130494/140028094-56611c37-d2d2-4008-b26a-d1980bf9e5e9.png)

評価条件を適用するには，適用したい評価条件のチェックボックスをチェックをいれます。すると，当該条件の背景色が赤になり，「評価式」ボタンの文字色が赤にります（下の図は地質にチェックを入れた場合です）。「評価式」ボタンの赤い文字は，当該条件の評価式を入力していない状態を示します。  
![image](https://user-images.githubusercontent.com/3130494/140028161-8358e905-d3d7-4149-b46e-0a7134f806b4.png)

ここでは，サンプルとして以下の式を入力します。  
```
if ( geol == 16777170 ) 1
if ( geol == 16775900 ) 1
if ( geol == 14483420 ) 1
if ( geol == 14873058 ) 1 
if ( geol == 16775065 ) 1 
if ( geol == 15138815 ) 0.5 
0
```
上記の式は，「地質が汽水成層ないし海成・非海成混合層（16777170)の場合，評価値が１とする」	

## デモサイト
https://wata909.github.io/web-map-algebra/
