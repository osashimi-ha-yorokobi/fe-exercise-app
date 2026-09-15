(() => {
  "use strict";

  const SOURCE_PUBLIC = "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2026r08.html";
  const SOURCE_PSEUDO = "https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf";
  const letters = ["ア", "イ", "ウ", "エ"];

  const makeQuestion = ({ id, keyword, field, subField, difficulty, question, code, choices, answer, explanation, choiceNotes, sourceUrl = SOURCE_PUBLIC }) => ({
    id,
    keywordId: `BKW${id.slice(2)}`,
    keyword,
    subject: "B",
    version: "現行",
    field,
    subField,
    difficulty,
    changeType: difficulty,
    scope: "アルゴリズムのみ",
    question,
    code,
    choices,
    answer,
    explanation,
    wrongExplanations: choiceNotes.map((note, index) => `${letters[index]}：${note}`),
    source: sourceUrl === SOURCE_PSEUDO
      ? "IPA 擬似言語の記述形式 Ver.5.1を参照したオリジナル問題"
      : "IPA 令和8年度 科目B公開問題の傾向を参照したオリジナル問題",
    sourceUrl,
    sourcePage: null,
    sourceType: "IPA",
    verified: true
  });

  window.FE_QUESTIONS_B = [
    makeQuestion({
      id: "BQ001", keyword: "選択処理", field: "プログラムの基本要素", subField: "条件分岐", difficulty: "基礎",
      question: "次の関数 max3 を max3(12, 7, 19) として呼び出したとき、返される値はどれか。",
      code: `○整数型: max3(整数型: x, 整数型: y, 整数型: z)\n  整数型: m ← x\n  if (y ＞ m)\n    m ← y\n  endif\n  if (z ＞ m)\n    m ← z\n  endif\n  return m`,
      choices: ["7", "12", "19", "38"], answer: 2,
      explanation: "mは12で始まり、y=7では変化せず、z=19で19に更新されるので、戻り値は19です。",
      choiceNotes: ["yだけを選んだ場合の値です。", "初期値のまま追跡を止めた場合の値です。", "正しい。三つの引数の最大値です。", "三つの値を加算した場合の値です。"]
    }),
    makeQuestion({
      id: "BQ002", keyword: "配列の回転", field: "プログラムの基本要素", subField: "配列", difficulty: "基礎",
      question: "次の処理を実行した後の配列 data の内容はどれか。配列の要素番号は1から始まる。",
      code: `整数型の配列: data ← {2, 4, 6, 8}\n整数型: last ← data[4]\n整数型: i\nfor (i を 4 から 2 まで 1 ずつ減らす)\n  data[i] ← data[i － 1]\nendfor\ndata[1] ← last`,
      choices: ["{8, 2, 4, 6}", "{4, 6, 8, 2}", "{2, 8, 6, 4}", "{8, 6, 4, 2}"], answer: 0,
      explanation: "末尾の8を退避し、4番目から2番目までを一つ後ろへ移してから先頭へ8を格納するので、右へ1要素回転します。",
      choiceNotes: ["正しい。右方向への1要素回転です。", "左方向へ1要素回転した結果です。", "交換処理として誤って追跡した結果です。", "配列全体を逆順にした結果です。"]
    }),
    makeQuestion({
      id: "BQ003", keyword: "剰余演算", field: "プログラムの基本要素", subField: "繰返し", difficulty: "基礎",
      question: "次の関数 count3 を count3(5, 17) として呼び出したとき、返される値はどれか。",
      code: `○整数型: count3(整数型: low, 整数型: high)\n  整数型: count ← 0, i\n  for (i を low から high まで 1 ずつ増やす)\n    if ((i mod 3) ＝ 0)\n      count ← count ＋ 1\n    endif\n  endfor\n  return count`,
      choices: ["3", "4", "5", "6"], answer: 1,
      explanation: "5以上17以下で3の倍数は6、9、12、15の4個です。",
      choiceNotes: ["端点付近の倍数を一つ数え落としています。", "正しい。該当する値は4個です。", "18も範囲に含めた場合の数え方です。", "商だけで個数を判断した誤りです。"]
    }),
    makeQuestion({
      id: "BQ004", keyword: "基数変換", field: "プログラムの基本要素", subField: "文字列・算術", difficulty: "標準",
      question: "関数 toDecimal に文字列 \"101101\" を与えたとき、返される値はどれか。関数 digit は文字 \"0\" を0、文字 \"1\" を1へ変換する。",
      code: `○整数型: toDecimal(文字列型: bits)\n  整数型: value ← 0, i\n  for (i を 1 から bitsの文字数 まで 1 ずつ増やす)\n    value ← value × 2 ＋ digit(bitsのi文字目)\n  endfor\n  return value`,
      choices: ["41", "43", "45", "53"], answer: 2,
      explanation: "左から順に value を2倍して次のビットを加えると、1→2→5→11→22→45となります。",
      choiceNotes: ["途中のビットを一つ反映しなかった値です。", "第5ビットを誤って1とした値です。", "正しい。2進数101101は10進数45です。", "桁の重みを誤って加えた値です。"]
    }),
    makeQuestion({
      id: "BQ005", keyword: "多重ループ", field: "プログラムの基本要素", subField: "繰返し", difficulty: "標準",
      question: "次の処理を実行した後の変数 sum の値はどれか。",
      code: `整数型: sum ← 0, i, j\nfor (i を 1 から 4 まで 1 ずつ増やす)\n  for (j を 1 から i まで 1 ずつ増やす)\n    sum ← sum ＋ j\n  endfor\nendfor`,
      choices: ["10", "16", "20", "24"], answer: 2,
      explanation: "内側の合計はiごとに1、3、6、10となるので、sumは1＋3＋6＋10＝20です。",
      choiceNotes: ["1から4までを一度だけ加えた値です。", "内側の反復回数だけを4倍した値です。", "正しい。各段階の三角数を合計します。", "全反復でiを加えたものとして計算した値です。"]
    }),
    makeQuestion({
      id: "BQ006", keyword: "論理演算", field: "プログラムの基本要素", subField: "条件式", difficulty: "基礎",
      question: "aが7、bが4のとき、次の条件式の値はどれか。",
      code: `(a ＞ 5 and b ＜ 3) or (a － b ＝ 3)`,
      choices: ["true", "false", "未定義", "aの値によって変わる"], answer: 0,
      explanation: "左側はtrue and falseでfalse、右側は7－4＝3なのでtrueです。false or trueはtrueです。",
      choiceNotes: ["正しい。論理和の右側がtrueです。", "左側の論理積だけで判断した結果です。", "全ての変数に値があるので未定義ではありません。", "aとbは問題文で確定しています。"]
    }),
    makeQuestion({
      id: "BQ007", keyword: "関数呼出し", field: "プログラムの基本要素", subField: "引数と戻り値", difficulty: "基礎",
      question: "次の処理を実行したとき、outputで出力される値はどれか。引数は値として受け渡される。",
      code: `○整数型: twiceAfter3(整数型: x)\n  x ← x ＋ 3\n  return x × 2\n\n整数型: a ← 4\n整数型: b ← twiceAfter3(a)\noutput(a ＋ b)`,
      choices: ["14", "18", "21", "22"], answer: 1,
      explanation: "関数内のxは7となりbは14です。値渡しなのでaは4のままで、4＋14＝18です。",
      choiceNotes: ["関数の戻り値だけを出力した値です。", "正しい。aは4、bは14です。", "aも7に変化したと誤解した値です。", "加算と乗算の順序を誤った値です。"]
    }),
    makeQuestion({
      id: "BQ008", keyword: "境界条件", field: "プログラムの基本要素", subField: "デバッグ", difficulty: "標準",
      question: "要素数1以上の配列 values の全要素の平均を返すために、【 a 】へ入れる式はどれか。",
      code: `○実数型: average(実数型の配列: values)\n  実数型: total ← 0\n  整数型: i\n  for (i を 1 から valuesの要素数 まで 1 ずつ増やす)\n    total ← total ＋ values[i]\n  endfor\n  return total ÷ 【 a 】`,
      choices: ["valuesの要素数 － 1", "valuesの要素数", "valuesの要素数 ＋ 1", "total"], answer: 1,
      explanation: "平均は合計値をデータ数で割るので、valuesの要素数で除算します。要素番号が1始まりでも個数はそのままです。",
      choiceNotes: ["最後の要素番号と個数を混同しています。", "正しい。除数は要素数です。", "境界を一つ余分に数えています。", "合計を合計で割ると常に1になります。"]
    }),
    makeQuestion({
      id: "BQ009", keyword: "スタック", field: "データ構造・アルゴリズム", subField: "スタック", difficulty: "基礎",
      question: "空のスタックに対して次の操作を順に行ったとき、最後に出力される値はどれか。pushは格納、popは最後に格納した値の取出しを表す。",
      code: `push(3)\npush(7)\nx ← pop()\npush(5)\ny ← pop()\noutput(x ＋ y)`,
      choices: ["8", "10", "12", "15"], answer: 2,
      explanation: "スタックはLIFOです。最初のpopで7、二回目のpopで5を取り出すので、合計は12です。",
      choiceNotes: ["先頭の3と5を加えた値です。", "FIFOとして7と3を取り出した場合の値です。", "正しい。7＋5＝12です。", "格納した全値を加えた値です。"]
    }),
    makeQuestion({
      id: "BQ010", keyword: "キュー", field: "データ構造・アルゴリズム", subField: "キュー", difficulty: "基礎",
      question: "空のキューに対して次の操作を順に行ったとき、出力される値はどれか。enqueueは末尾への追加、dequeueは先頭からの取出しを表す。",
      code: `enqueue(4)\nenqueue(9)\nx ← dequeue()\nenqueue(2)\ny ← dequeue()\noutput(x ＋ y)`,
      choices: ["6", "11", "13", "15"], answer: 2,
      explanation: "キューはFIFOです。xは4、yは9となるので、出力は13です。",
      choiceNotes: ["4と2を取り出したと誤解した値です。", "9と2を取り出した値です。", "正しい。4＋9＝13です。", "全要素を加算した値です。"]
    }),
    makeQuestion({
      id: "BQ011", keyword: "単方向リスト", field: "データ構造・アルゴリズム", subField: "連結リスト", difficulty: "標準",
      question: "dataとnextで表した単方向リストを、要素番号1から末尾までたどったときの値の並びはどれか。未定義は末尾を表す。",
      code: `data ← {15, 40, 25, 30}\nnext ← {3, 未定義, 4, 2}\n先頭の要素番号 ← 1`,
      choices: ["15, 40, 25, 30", "15, 25, 30, 40", "15, 30, 40, 25", "40, 30, 25, 15"], answer: 1,
      explanation: "1→next[1]=3→next[3]=4→next[4]=2→未定義の順にたどるので、data[1], data[3], data[4], data[2]です。",
      choiceNotes: ["配列の物理的な並びをそのまま読んでいます。", "正しい。ポインタは1→3→4→2です。", "nextの値そのものをデータと混同しています。", "配列を逆順に読んだ並びです。"]
    }),
    makeQuestion({
      id: "BQ012", keyword: "リストへの挿入", field: "データ構造・アルゴリズム", subField: "連結リスト", difficulty: "標準",
      question: "単方向リストで、currが要素Aを、curr.nextが要素Cを参照している。新しい要素BをAとCの間に挿入する処理として適切なものはどれか。",
      code: `Node型: newNode ← Node("B")\n/* この後、A → B → C とする */`,
      choices: [
        "curr.next ← newNode\nnewNode.next ← curr.next",
        "newNode.next ← curr.next\ncurr.next ← newNode",
        "newNode.next ← curr\ncurr ← newNode",
        "curr.next ← newNode.next\nnewNode.next ← curr"
      ], answer: 1,
      explanation: "先にnewNode.nextへCの参照を保存し、その後curr.nextをnewNodeへ変更します。順序を逆にするとCへの参照を失います。",
      choiceNotes: ["1行目でCへの参照を失い、2行目はB自身を参照します。", "正しい。Cへの参照を保存してからAをBへつなぎます。", "BをAの前に置く処理に近く、先頭参照の更新も不足します。", "参照関係がA→B→Cになりません。"]
    }),
    makeQuestion({
      id: "BQ013", keyword: "再帰・ユークリッドの互除法", field: "データ構造・アルゴリズム", subField: "再帰", difficulty: "標準",
      question: "関数 gcd を gcd(48, 18) として呼び出したとき、返される値はどれか。",
      code: `○整数型: gcd(整数型: a, 整数型: b)\n  if (b ＝ 0)\n    return a\n  endif\n  return gcd(b, a mod b)`,
      choices: ["2", "3", "6", "12"], answer: 2,
      explanation: "gcd(48,18)→gcd(18,12)→gcd(12,6)→gcd(6,0)と進み、6を返します。",
      choiceNotes: ["最後の剰余を一段早く返した誤りです。", "18 mod 3のように追跡を誤っています。", "正しい。最大公約数は6です。", "途中の第2引数を返した値です。"]
    }),
    makeQuestion({
      id: "BQ014", keyword: "再帰と反復", field: "データ構造・アルゴリズム", subField: "漸化式", difficulty: "標準",
      question: "関数 f(5) の値はどれか。",
      code: `○整数型: f(整数型: n)\n  if (n ≦ 2)\n    return 1\n  endif\n  return f(n － 1) ＋ 2 × f(n － 2)`,
      choices: ["7", "9", "11", "13"], answer: 2,
      explanation: "f(1)=1、f(2)=1、f(3)=3、f(4)=5、f(5)=11です。",
      choiceNotes: ["係数2を一部反映していません。", "直前二項の単純な和として計算した値です。", "正しい。5＋2×3＝11です。", "f(4)の計算を誤った値です。"]
    }),
    makeQuestion({
      id: "BQ015", keyword: "二分探索", field: "データ構造・アルゴリズム", subField: "探索", difficulty: "標準",
      question: "昇順配列 data から25を二分探索する。中央要素との比較は何回行われるか。中央位置は範囲の両端の平均の小数点以下を切り捨てて求める。",
      code: `data ← {3, 7, 11, 18, 25, 31, 42}\n探索範囲 ← 1 ～ 7`,
      choices: ["1回", "2回", "3回", "4回"], answer: 2,
      explanation: "位置4の18、位置6の31、位置5の25の順に比較するので3回です。",
      choiceNotes: ["最初の中央要素は18で一致しません。", "位置6の31までではまだ見つかっていません。", "正しい。3回目で位置5を調べます。", "一致後も探索を続けた場合の回数です。"]
    }),
    makeQuestion({
      id: "BQ016", keyword: "番兵法", field: "データ構造・アルゴリズム", subField: "探索", difficulty: "標準",
      question: "関数 search を search({8, 3, 5, 9}, 5) として呼び出したとき、返される値はどれか。配列の要素番号は1から始まる。",
      code: `○整数型: search(整数型の配列: data, 整数型: key)\n  整数型: n ← dataの要素数\n  dataの末尾 に key を追加する\n  整数型: i ← 1\n  while (data[i] ≠ key)\n    i ← i ＋ 1\n  endwhile\n  if (i ≦ n)\n    return i\n  endif\n  return 0`,
      choices: ["0", "2", "3", "5"], answer: 2,
      explanation: "元の配列の3番目が5なので、番兵として追加した末尾へ到達する前にi=3で停止します。",
      choiceNotes: ["0は元の配列に見つからなかった場合です。", "要素の値3と位置を混同しています。", "正しい。5は3番目にあります。", "番兵として追加した位置まで進む場合の値です。"]
    }),
    makeQuestion({
      id: "BQ017", keyword: "バブルソート", field: "データ構造・アルゴリズム", subField: "整列", difficulty: "基礎",
      question: "配列の左端から隣接要素を比較し、左が大きければ交換する処理を1回だけ末尾まで行う。配列の状態はどれか。",
      code: `data ← {5, 2, 4, 1}\nfor (i を 1 から 3 まで 1 ずつ増やす)\n  if (data[i] ＞ data[i ＋ 1])\n    data[i] と data[i ＋ 1] を交換する\n  endif\nendfor`,
      choices: ["{1, 2, 4, 5}", "{2, 4, 1, 5}", "{2, 5, 1, 4}", "{5, 2, 1, 4}"], answer: 1,
      explanation: "5と2、5と4、5と1を順に交換し、最大値5が末尾へ移るので{2,4,1,5}です。",
      choiceNotes: ["複数回の走査が完了した最終結果です。", "正しい。1回の走査後の状態です。", "2回目の比較を交換しなかった状態です。", "最初の比較を実行していない状態です。"]
    }),
    makeQuestion({
      id: "BQ018", keyword: "選択ソート", field: "データ構造・アルゴリズム", subField: "整列", difficulty: "標準",
      question: "選択ソートで先頭から小さい値を確定する。外側の繰返しを2回実行した直後の配列はどれか。",
      code: `data ← {7, 3, 5, 1}\n/* 未整列部分の最小値を探し、先頭と交換する */`,
      choices: ["{1, 3, 5, 7}", "{1, 5, 3, 7}", "{3, 1, 5, 7}", "{3, 5, 1, 7}"], answer: 0,
      explanation: "1回目で最小値1を先頭へ移すと{1,3,5,7}です。2回目の未整列部分の最小値は既に3なので状態は変わりません。",
      choiceNotes: ["正しい。2番目も既に確定位置です。", "2回目の最小値選択を誤っています。", "最初の走査で1を先頭へ移していません。", "隣接交換として追跡した状態です。"]
    }),
    makeQuestion({
      id: "BQ019", keyword: "マージ", field: "データ構造・アルゴリズム", subField: "整列", difficulty: "標準",
      question: "昇順に整列済みの二つの配列を、一つの昇順配列へマージした結果はどれか。",
      code: `left  ← {1, 4, 8}\nright ← {2, 3, 9}`,
      choices: ["{1, 2, 3, 4, 8, 9}", "{1, 2, 4, 3, 8, 9}", "{1, 4, 8, 2, 3, 9}", "{9, 8, 4, 3, 2, 1}"], answer: 0,
      explanation: "各配列の未処理の先頭同士を比較し、小さい方を順に取り出すと1,2,3,4,8,9です。",
      choiceNotes: ["正しい。二つの列の順序を保って昇順に統合しています。", "3と4の比較結果が逆です。", "単純な連結であり、マージ後に昇順ではありません。", "降順へ整列した結果です。"]
    }),
    makeQuestion({
      id: "BQ020", keyword: "挿入ソート", field: "データ構造・アルゴリズム", subField: "整列", difficulty: "標準",
      question: "挿入ソートで左から順に処理し、先頭から4要素目までの処理が完了した時点の配列はどれか。",
      code: `data ← {6, 2, 5, 3, 1}`,
      choices: ["{2, 3, 5, 6, 1}", "{1, 2, 3, 5, 6}", "{2, 5, 3, 6, 1}", "{2, 5, 6, 3, 1}"], answer: 0,
      explanation: "先頭4要素だけが整列済み部分となり、2,3,5,6の順です。5要素目の1はまだ未処理です。",
      choiceNotes: ["正しい。処理済みの先頭4要素だけが昇順です。", "全5要素の処理完了後の状態です。", "4要素目の3を正しい位置まで移していません。", "3要素目までしか処理していない状態です。"]
    }),
    makeQuestion({
      id: "BQ021", keyword: "幅優先探索", field: "データ構造・アルゴリズム", subField: "グラフ", difficulty: "標準",
      question: "頂点1から幅優先探索を行う。隣接頂点は番号の小さい順に調べるとき、訪問順はどれか。",
      code: `1: {2, 3}\n2: {1, 4, 5}\n3: {1, 6}\n4: {2}\n5: {2}\n6: {3}`,
      choices: ["1, 2, 3, 4, 5, 6", "1, 2, 4, 5, 3, 6", "1, 3, 6, 2, 5, 4", "1, 3, 2, 6, 5, 4"], answer: 0,
      explanation: "幅優先探索はキューを用いて同じ深さの頂点を先に訪問します。1の次に2,3、その次に4,5,6です。",
      choiceNotes: ["正しい。同じ深さを番号順に訪問します。", "深さ優先探索の訪問順です。", "頂点3側を先に深くたどっています。", "隣接頂点の番号順と幅優先の両方に反します。"]
    }),
    makeQuestion({
      id: "BQ022", keyword: "深さ優先探索", field: "データ構造・アルゴリズム", subField: "グラフ", difficulty: "標準",
      question: "頂点1から再帰による深さ優先探索を行う。未訪問の隣接頂点は番号の小さい順に選ぶとき、訪問順はどれか。",
      code: `1: {2, 3}\n2: {1, 4, 5}\n3: {1, 6}\n4: {2}\n5: {2}\n6: {3}`,
      choices: ["1, 2, 3, 4, 5, 6", "1, 2, 4, 5, 3, 6", "1, 3, 6, 2, 4, 5", "1, 2, 5, 4, 3, 6"], answer: 1,
      explanation: "1→2→4と深く進み、戻って5、その後1へ戻って3→6とたどります。",
      choiceNotes: ["幅優先探索の順序です。", "正しい。小さい番号を優先して深くたどります。", "最初の隣接頂点に3を選んでいます。", "頂点2の隣接頂点を大きい順に選んでいます。"]
    }),
    makeQuestion({
      id: "BQ023", keyword: "最短経路", field: "データ構造・アルゴリズム", subField: "グラフ", difficulty: "応用",
      question: "重み付き無向グラフで、頂点AからDまでの最短距離はどれか。辺は「両端:重み」で示す。",
      code: `A-B: 2\nA-C: 5\nB-C: 1\nB-D: 4\nC-D: 1`,
      choices: ["3", "4", "5", "6"], answer: 1,
      explanation: "A→B→C→Dの距離は2＋1＋1＝4で、A→C→Dの6、A→B→Dの6より短くなります。",
      choiceNotes: ["AからDへ3で到達する経路はありません。", "正しい。A-B-C-Dが最短です。", "A-Cの重みだけを見た値です。", "A-C-DまたはA-B-Dの距離です。"]
    }),
    makeQuestion({
      id: "BQ024", keyword: "木の行きがけ順", field: "データ構造・アルゴリズム", subField: "木構造", difficulty: "標準",
      question: "次の二分木を行きがけ順（根、左部分木、右部分木）で走査した結果はどれか。",
      code: `        A\n      /   \\\n     B     C\n    / \\   /\n   D   E F`,
      choices: ["A, B, D, E, C, F", "D, B, E, A, F, C", "D, E, B, F, C, A", "A, C, F, B, E, D"], answer: 0,
      explanation: "根Aを訪問し、左部分木B-D-E、続いて右部分木C-Fを訪問します。",
      choiceNotes: ["正しい。行きがけ順です。", "通りがけ順の並びです。", "帰りがけ順の並びです。", "右部分木を先にたどった並びです。"]
    }),
    makeQuestion({
      id: "BQ025", keyword: "ハッシュ法", field: "データ構造・アルゴリズム", subField: "探索", difficulty: "標準",
      question: "要素番号0～6のハッシュ表へ10、17、24の順に格納する。ハッシュ値を key mod 7 とし、衝突時は空き位置まで1ずつ後ろへ進む。24の格納時に調べる位置の個数はどれか。",
      code: `h(key) ＝ key mod 7\n衝突解決 ＝ 線形探索法`,
      choices: ["1個", "2個", "3個", "4個"], answer: 2,
      explanation: "10、17、24はいずれもハッシュ値3です。24は位置3、4を調べて衝突し、位置5へ格納するので3個です。",
      choiceNotes: ["衝突がない場合の個数です。", "17の格納時に調べる個数です。", "正しい。位置3、4、5を調べます。", "空き位置の次まで数えています。"]
    }),
    makeQuestion({
      id: "BQ026", keyword: "文字列探索", field: "データ構造・アルゴリズム", subField: "文字列処理", difficulty: "標準",
      question: "文字列 \"ABABABA\" の中に文字列 \"ABA\" は何回現れるか。出現位置が重なる場合もそれぞれ数える。",
      code: `検索対象: ABABABA\n検索語  : ABA`,
      choices: ["1回", "2回", "3回", "4回"], answer: 2,
      explanation: "1文字目、3文字目、5文字目を先頭とする三つの部分文字列がABAと一致します。",
      choiceNotes: ["最初の一致だけで探索を終了しています。", "重なりを許さずに探索した場合の数え方です。", "正しい。開始位置は1、3、5です。", "末尾を越える開始位置も数えています。"]
    }),
    makeQuestion({
      id: "BQ027", keyword: "One-Hot表現", field: "数理・データサイエンスへの適用", subField: "前処理", difficulty: "標準",
      question: "色の種類を最初に現れた順にRed、Blue、Greenと番号付けし、One-Hot表現へ変換する。入力に対応する出力はどれか。",
      code: `入力: {"Red", "Blue", "Red", "Green"}`,
      choices: [
        "{{1,0,0}, {0,1,0}, {1,0,0}, {0,0,1}}",
        "{{1,0,0}, {0,1,0}, {0,0,1}, {1,0,0}}",
        "{{0,0,1}, {0,1,0}, {0,0,1}, {1,0,0}}",
        "{{1,0}, {0,1}, {1,0}, {0,0}}"
      ], answer: 0,
      explanation: "Redは第1成分、Blueは第2成分、Greenは第3成分を1にします。同じRedは同じベクトルになります。",
      choiceNotes: ["正しい。カテゴリの対応が一貫しています。", "2回目のRedをGreenとして符号化しています。", "最初の出現順と逆向きに割り当てています。", "カテゴリが3種類なので各ベクトルには3成分必要です。"]
    }),
    makeQuestion({
      id: "BQ028", keyword: "移動平均", field: "数理・データサイエンスへの適用", subField: "時系列", difficulty: "標準",
      question: "要素数3の単純移動平均を先頭から計算した結果はどれか。",
      code: `data ← {3, 6, 9, 12, 15}\nwindowSize ← 3`,
      choices: ["{3, 6, 9}", "{6, 9, 12}", "{6, 12}", "{9, 12, 15}"], answer: 1,
      explanation: "連続する3要素の平均は(3+6+9)/3=6、(6+9+12)/3=9、(9+12+15)/3=12です。",
      choiceNotes: ["元データの先頭3要素をそのまま並べています。", "正しい。三つの窓の平均です。", "窓を重ねずに移動した場合の誤りです。", "平均ではなく各窓の末尾を並べています。"]
    }),
    makeQuestion({
      id: "BQ029", keyword: "分類モデルの正解率", field: "数理・データサイエンスへの適用", subField: "モデル評価", difficulty: "標準",
      question: "二値分類の結果が次のとおりである。全100件に対する正解率はどれか。",
      code: `真陽性 TP ＝ 42\n真陰性 TN ＝ 50\n偽陽性 FP ＝ 5\n偽陰性 FN ＝ 3`,
      choices: ["87%", "89%", "92%", "95%"], answer: 2,
      explanation: "正しく分類した件数はTP＋TN＝42＋50＝92件なので、正解率は92÷100＝92%です。",
      choiceNotes: ["真陽性から偽陽性を引くなど、計算対象を誤っています。", "偽陰性だけを正解から除いた値ではありません。", "正しい。TPとTNを合計します。", "FPだけを誤りとして扱った値です。"]
    }),
    makeQuestion({
      id: "BQ030", keyword: "Min-Max正規化", field: "数理・データサイエンスへの適用", subField: "データ前処理", difficulty: "標準",
      question: "最小値を0、最大値を1とするMin-Max正規化を行う。データ{10, 20, 30, 40}における30の変換後の値として最も近いものはどれか。",
      code: `normalized ← (x － min) ÷ (max － min)`,
      choices: ["0.33", "0.50", "0.67", "0.75"], answer: 2,
      explanation: "(30－10)÷(40－10)＝20÷30＝約0.67です。",
      choiceNotes: ["分子を10として計算した値です。", "範囲の中央と誤認しています。", "正しい。20/30です。", "30/40として計算した値です。"]
    })
  ];
})();
