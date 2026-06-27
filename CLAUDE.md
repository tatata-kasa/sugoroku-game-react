# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

`飲みすごろく` は、React + TypeScript + Vite で作られた、パーティ用の飲みゲーム（すごろく）
シングルページアプリです。UI はすべて日本語。バックエンド・永続化・ルーティングを持たない
クライアント専用アプリで、ゲーム状態はすべて React のコンポーネント state に保持されます。
デプロイ先は GitHub Pages です。

## コマンド

```bash
npm run dev       # Vite 開発サーバー（HMR）
npm run build     # 先に tsc -b で型チェック → vite build で dist/ を生成
npm run preview   # 本番ビルドをローカルで配信
npm run deploy    # 手動デプロイ: predeploy で build → gh-pages が dist/ を公開
```

デプロイは通常 **`master` への push で GitHub Actions が自動実行**されます
（`.github/workflows/deploy.yml`、公式 Pages アクションで `dist/` を配信）。
`npm run deploy` は `gh-pages` ブランチへ手動公開するフォールバックです。

**テストフレームワークは未導入**です（Jest/Vitest なし、`npm test` なし）。テストの存在を
前提にしたり、テストコマンドを創作したりしないこと。変更の確認は `npm run build`（型チェック）
と、`npm run dev` で実際にプレイして行います。

`package.json` には `lint`（`eslint .`）スクリプトがありますが、**現状そのままでは動きません**:
`eslint` が `devDependencies` に無く、`eslint.config.js` も存在しないため `npm run lint` は
エラーになります。リンティングに頼らず、型安全性は `tsc -b`（＝`npm run build`）で担保すること。

`vite.config.ts` の `base: '/sugoroku-game-react/'` は GitHub Pages のサブパスに合わせた設定
です。リポジトリ名を変えた場合は `package.json` の `homepage` と必ず揃えること。

## アーキテクチャ

### 画面遷移

`App.tsx` はルーターを使わない 2 フェーズの state マシン（`setup` → `playing`）です:
- `SetupScreen` がプレイヤー人数（2〜6）と名前を集め、`onStart` を呼ぶ。
- `GameScreen` がゲーム全体を駆動する。リセット時は `gameKey` をインクリメントして
  `GameScreen` の `key` を変え、再マウントすることで全ゲーム状態を破棄する。

`GameScreen/index.tsx` がこのアプリの心臓部（約540行）で、ゲームロジックのほぼすべてを
持ちます。他のコンポーネント（`Board` / `SidePanel` / `EventModal` / `VictoryScreen` /
`Square`）は props とコールバックで駆動される表示専用です。

### ref ベースの state パターン（最重要）

ゲーム進行は、トークンを1マスずつ動かすアニメーション・画面フラッシュ・モーダルの
コールバックなど、**`setTimeout` の非同期チェーン**で成り立っています。これらのコールバック
内では React の state クロージャが古くなるため、`GameScreen` は **毎レンダーで state を写し取り、
再代入する ref 群**を併用します:

- `posRef` / `drinksRef` / `curRef` / `cardEffectRef` / `overRef` は対応する `useState` 値を
  ミラーする（レンダー中に無条件で同期。ref への書き込みは再レンダーを起こさないので安全）。
- `gRef.current` は **すべてのゲームロジック関数**（`stepForward` / `doSquareEvent` /
  `showModal` / `nextTurn` など）を持つオブジェクトで、毎レンダー再代入され常に最新値を
  参照する。コールバックからは関数を直接呼ばず、必ず `gRef.current.foo(...)` 経由で呼ぶ。
- `modalCbRef` / `drinkCbRef` は「モーダルを閉じたとき／誰が飲んだかを選んだとき」に実行する
  継続処理（continuation）を保持する。

これら非同期チェーン内で position/drinks を更新する際は、**先に ref を更新**してから
`setState` を呼び、多くの場合アニメーションの各ステップ間で DOM を同期更新するために
`flushSync` で包みます。新しいゲーム機構を足すときも同じパターンに従い、`setTimeout`
チェーンの中で素の state に依存しないこと。

補足: `main.tsx` は `<StrictMode>` 下でレンダーするため、開発時はレンダーが二重に実行されます。
ref パターンはこれを許容する設計です。レンダーは副作用フリーに保つこと。

### 盤面モデル

`constants/boardLayout.ts` は盤面を **5×5 のスパイラル**として定義します: 25マス
（`TOTAL = 25`）、START = index 0（外周左上）、GOAL = index 24（`GOAL = 24`、中央）。
`SQUARE_POS` は各マス index を CSS グリッドのセル `{r, c}` に対応づけます。スパイラルの
並び順の正本はそのファイル内の ASCII 図です。

移動ルール（`GameScreen` / `computeReachable`）: GOAL に**ちょうど**止まらないと勝てません。
行き過ぎた場合は跳ね返ります: `finalPos = 2 * GOAL - rawPos`。`computeReachable` はロール前に
サイコロ1〜6での着地マスをプレビューしてハイライトします。

### マスのイベントと連鎖

`utils/gameUtils.ts#makeSquares()` はゲームごとに盤面をランダム生成します。固定の `pool`
からマス種別を作り（`shuffle` と、advance/retreat の隣接を避ける `noAdjacentOf`）、GOAL 手前に
`drink`/`all_drink`/`death` をシャッフルした `endZone` を置きます。

`gRef.current.doSquareEvent(pos, pi, chainDepth)` が `SquareType` を `switch` し、各マスの
モーダルと効果を駆動します。移動系マス（`advance`・`retreat`・`warp`・`death`）は新しいマスに
着地させ、そこで**さらに別のイベント**を発火し得ます。この再帰は `chainDepth < 3` で制限
されています。

注意すべき不整合: `SquareType` と `doSquareEvent` には `quiz`・`electric`・`reversal` の
ハンドラが定義されていますが、`makeSquares` が盤面に配置するのは `reversal` のみです
（`SidePanel` の凡例にも `reversal` あり）。`quiz`・`electric` は**盤面・凡例ともに未配置の
休眠状態**で、通常プレイでは到達不能です（`quiz` はそもそも `doSquareEvent` にハンドラが無く、
お題データも無いため実質未実装）。有効化したい場合は `makeSquares` の `pool` と `SidePanel`
の `LEGEND` に追加してください。

なお `death`（デス）はスタートではなく**盤の左下コーナー（index 12）**へ戻すペナルティ緩和
仕様です（デスは GOAL 手前の `endZone` で踏むため必ず後退になる）。

### カード

`constants/gameData.ts#CARDS` はプレイヤー1人1回のカードを6種定義します。2種は**即時発動**
（`party`・`nominate` ＝ 引いた瞬間に適用）。残り4種は**遅延発動**: 引くと
`cardEffectRef.current` にカード id をセットし、次のロールまたはマスイベントで消費します
（`skip` は着地マスのイベントをスキップ、`transfer` は飲みを右隣へ転嫁、`bonus` はロールに +2、
`roll2` は2回振って大きい方を採用）。`cardUsed[]` が「1人1枚」を担保します。

### サイコロ連携

サイコロはサードパーティの `react-dice-complete`（ローカル型定義は
`types/react-dice-complete.d.ts`）です。`SidePanel` がこれをラップし、`forwardRef` ＋
`useImperativeHandle` で命令的な `rollAll(values)` を公開します。流れ: `GameScreen` がロール値を
先に決定 → `sidePanelRef.current.rollAll([value])` でその出目までアニメーション →
コンポーネントの `rollDone` コールバック（`handleRollDone`）がアニメ完了時に発火し、移動
チェーンを再開します。

### 盤面の描画

`Board/index.tsx` は `SQUARE_POS` を使って CSS グリッド上にマスを並べ、さらにマス間の経路を
**命令的に構築する SVG**（線＋矢印）として `drawRoute()` で描きます。各マスの実 DOM 矩形を
`getBoundingClientRect` で読むため、`useLayoutEffect` で毎レンダー実行し、`ResizeObserver` で
リサイズ時にも再実行します。通過済み/現在/これから の区間は別スタイルです。盤面ジオメトリや
マスのサイズを変更する場合は `drawRoute` も見直すこと。

## 規約

- **コンポーネント**: 各々 `src/components/<Name>/index.tsx` に置き、`<Name>.module.css` を
  同階層に併設する。スタイリングは **CSS Modules**（`styles.foo`）で、型は `types/css.d.ts`。
  グローバルな CSS フレームワークはなく、`src/index.css` がグローバルと keyframes
  （例: `Board` から参照される `routePulse`）を保持する。
- **型**は `src/types/index.ts` に集約。**定数/コンテンツ**（飲みのお題、ミニゲームのお題、
  カード、盤面レイアウト）は `src/constants/` に集約。ゲームのコンテンツは素のデータ配列なので、
  お題の追加・編集はコンポーネントではなく `gameData.ts` を編集する。
- TypeScript は `strict` だが `noUnusedLocals` / `noUnusedParameters` は **off** のため未使用
  変数ではビルドが落ちない（`lint` も未整備なので自動では拾われない点に注意）。
- ユーザー向け文言はすべて日本語。コンテンツを追加するときは既存のトーンと絵文字多めの
  スタイルに合わせること。
