# ワイン用ブドウ栽培適地評価システム

## システム概要

本システムは，データタイルマップとして公開されている地形，地質，土壌，気象データを元に，WebGL による地図間演算機能を用いてブドウのワイン専用品種の栽培適地を評価するためのプログラムです。  
現在のシステムは，クライアント側で動作する WebGIS としての機能開発を目的として構築，公開されたものであるため，現時点では，有効な適地推定ができないことに留意下さい。  
本システムの概要については，以下にて公表しました。

- 岩崎亘典，林 和則，田中聡久，鹿取みゆき，小口 高(2021)WebGL を用いたワイン用ブドウ栽培適地評価システムの開発．地理情報システム学会第 30 回学術研究発表大会
- Iwasaki Nobusuke, Hayashi Kazunori, Tanaka Toshihisa, Katori Miyuki, Oguchi Takashi (2022) [Prototype of an assessment system for vineyard suitability](https://tokyo-metro-u.repo.nii.ac.jp/?action=pages_view_main&active_action=repository_view_main_item_detail&item_id=9443&item_no=1&page_id=30&block_id=164). Geographical reports of Tokyo Metropolitan University,57,79-85.
- Iwasaki Nobusuke, Hayashi Kazunori, Tanaka Toshihisa, Katori Miyuki, Onohara Ayaka, Oguchi Takashi (2022) [Client-side Web Mapping system for vineyard suitability assessment](https://talks.osgeo.org/foss4g-2022-academic-track/talk/review/KZSRRV8ZS7PJZUZRDWMBY39XHALYP8M9). FOSS4G 2022 academic track (Accepted).

## 利用方法

本システムに接続すると，以下の画面が表示されます。  
![image](https://user-images.githubusercontent.com/3130494/140027552-624d1a06-5a26-4445-b09c-09403f9d5279.png)

基本的な操作は左上に配置した操作パネルから実行します。本件システムでは予め設定された評価条件から任意の条件を適用して栽培適地評価を実行します。現在利用可能な条件は「地質」「土壌分類」「傾斜量」「傾斜方位」「平均気温」「最低気温」「最高気温」の 7 つです。

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

上記の式は，「地質が汽水成層ないし海成・非海成混合層（16777170）の場合，評価値が１とする」 ということを意味します。この式を入力したあと，右下の「適用」をクリックします。  
![image](https://user-images.githubusercontent.com/3130494/140029047-2eda568d-6b3b-4df5-863c-562c8e70f96a.png)

すると，下の図の通り，当該条件の背景色は赤のままで，「評価式」ボタンの文字色は黒になります．  
![image](https://user-images.githubusercontent.com/3130494/140029165-ccf37e4f-f044-400c-a000-b47b0b79177b.png)

以上の処理を，傾斜量，最低気温，最高気温についても，行います。評価式は，以下の通りです。なお，今回使用した条件式は，評価式入力ウィンドの「サンプルを入力」をクリックすると，サンプルとして入力されます  
![image](https://user-images.githubusercontent.com/3130494/140268439-4d8577e8-507c-4df8-aedc-5349e111027e.png)

傾斜量

```
if ( grad < 5 ) 1
if ( grad < 10 ) 0.7
if ( grad < 20 ) 0.5
if ( grad < 30 ) 0.3
0
```

平均最低気温

```
if ( tMin < 5 ) 0
1
```

平均最高気温

```
if ( tMax > 15 ) 0
if ( tMax > 10 ) 1
if ( tMax > 5 ) 0.5
0
```

すべての条件を入力すると，地質，傾斜量，最低気温，最高気温の背景が赤になります。  
![image](https://user-images.githubusercontent.com/3130494/140268653-0da82d01-235a-4e17-98a6-7164ffa0f84a.png)

次に，評価基準式を入力します。評価基準式ボタンをクリックし，入力ウィンドに以下の通り入力します。

```
geol * grad * tMin * tMax
```

![image](https://user-images.githubusercontent.com/3130494/140269126-5a123c96-da96-47d9-b7a1-216eae5551a2.png)

この式は，地質，傾斜量，平均最低気温，平均最高気温で，それぞれ好適な条件の１，不適な条件を０とし，その積をワイン専用ブドウ品種の栽培適地の好適度の評価値とすることを意味します。

最後に結果判定式を入力します。今回は，上記の計算式値を，そのまま結果判定式の値として使うので，`value`とだけ入力します。

```
value
```

![image](https://user-images.githubusercontent.com/3130494/140030030-67f4ea7e-58cb-4225-bcb7-69d912b93d1f.png)

すべての条件の入力を終えると，以下の通りとなります．  
![image](https://user-images.githubusercontent.com/3130494/140269324-425cdcef-af4a-4fc9-bf4e-932e45259a1c.png)

最後に「反映」ボタンをクリックすると，評価結果が表示されます。この式の場合，生産適地としての好適度は，１～０の数値で示され，ピンク色が濃いほど好適度が高いことを意味します。  
![image](https://user-images.githubusercontent.com/3130494/140269495-105963c7-dc0c-48f9-b672-85f98c70cd0e.png)

なお，例えば結果判定式に下記のような条件を与えると，計算結果を 1，0.5，0 の三つの区分に変えることもできます。

```
if ( value > 0.75 ) 1
if ( value > 0.25 ) 0.5
0
```

また，「画像として保存」をクリックし，範囲を指定した後に，右上の「取得する」をクリック，評価結果を画像として保存することができます。  
![image](https://user-images.githubusercontent.com/3130494/140030726-161b12be-8b38-4f33-a2b1-34603d21dfe6.png)

## デモサイト

https://wata909.github.io/web-map-algebra/
