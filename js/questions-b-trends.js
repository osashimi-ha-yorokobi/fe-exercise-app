(() => {
  "use strict";

  const SOURCE_INDEX = "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html";
  const SOURCE_LABEL = "IPA 令和5～8年度 科目B公開問題及び科目Bサンプル問題2種の傾向を参照したオリジナル問題";
  const labels = ["ア", "イ", "ウ", "エ"];
  const CATEGORY_TAGS = {
    "線形探索・集計": "線形探索・集計系",
    "探索・二分探索": "探索・二分探索系",
    "整列（ソート）": "整列（ソート）系",
    "データ構造操作": "データ構造操作系（スタック/キュー/リスト）",
    "再帰・木構造": "再帰・木構造系"
  };

  const references = [
    {
      name: "IPA 令和8年度 基本情報技術者試験 科目B 公開問題",
      url: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_b_qs.pdf"
    },
    {
      name: "IPA 令和7年度 基本情報技術者試験 科目B 公開問題",
      url: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_b_qs.pdf"
    },
    {
      name: "IPA 令和6年度 基本情報技術者試験 科目B 公開問題",
      url: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_b_qs.pdf"
    },
    {
      name: "IPA 令和5年度 基本情報技術者試験 科目B 公開問題",
      url: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_b_qs.pdf"
    },
    {
      name: "IPA 基本情報技術者試験 科目B サンプル問題（6問）",
      url: "https://www.ipa.go.jp/shiken/syllabus/ps6vr7000000oett-att/fe_kamoku_b_sample.pdf"
    },
    {
      name: "IPA 基本情報技術者試験 科目B サンプル問題セット（20問）",
      url: "https://www.ipa.go.jp/shiken/syllabus/henkou/2022/ssf7ph000000h5tb-att/fe_kamoku_b_set_sample_qs.pdf"
    }
  ];

  const makeTrendQuestion = ({ id, pattern, keyword, subField, difficulty, question, code, choices, answer, explanation, choiceNotes }) => ({
    id,
    keywordId: `BKW${id.slice(2)}`,
    keyword,
    subject: "B",
    version: "現行",
    field: CATEGORY_TAGS[pattern],
    categoryTag: CATEGORY_TAGS[pattern],
    subField,
    difficulty,
    changeType: difficulty,
    trendPattern: CATEGORY_TAGS[pattern],
    scope: "アルゴリズムのみ",
    question,
    code,
    choices,
    answer,
    explanation,
    wrongExplanations: choiceNotes.map((note, index) => `${labels[index]}：${note}`),
    source: SOURCE_LABEL,
    sourceUrl: SOURCE_INDEX,
    sourcePage: null,
    sourceType: "IPA（傾向参照）",
    references,
    original: true,
    verified: true
  });

  const trendQuestions = [
    // パターン1：線形探索・集計系
    makeTrendQuestion({
      id: "BQ031", pattern: "線形探索・集計", keyword: "条件付き集計", subField: "線形走査", difficulty: "標準",
      question: "関数 rangeSummary を rangeSummary({4, 9, 2, 9, 6, 11}, 5, 10) として呼び出したとき，返される配列はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型の配列: rangeSummary(整数型の配列: values, 整数型: low, 整数型: high)\n  整数型: count ← 0, total ← 0, i\n  for (i を 1 から valuesの要素数 まで 1 ずつ増やす)\n    if ((values[i] ≧ low) and (values[i] ＜ high))\n      count ← count ＋ 1\n      total ← total ＋ values[i]\n    endif\n  endfor\n  return {count, total}`,
      choices: ["{2, 15}", "{3, 24}", "{4, 35}", "{3, 26}"], answer: 1,
      explanation: "5以上10未満の要素は9，9，6の3個であり，合計は24である。したがって，{3, 24}を返す。",
      choiceNotes: ["9と6だけを数え，一方の9を数え落とした結果である。", "正しい。個数は3，合計は24である。", "上限の11も含めて集計した結果である。", "値2を誤って合計へ加えた結果である。"]
    }),
    makeTrendQuestion({
      id: "BQ032", pattern: "線形探索・集計", keyword: "先頭一致探索", subField: "線形探索", difficulty: "基礎",
      question: "関数 firstAtLeast を firstAtLeast({3, 8, 5, 12, 7}, 10) として呼び出したとき，返される値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: firstAtLeast(整数型の配列: values, 整数型: target)\n  整数型: i\n  for (i を 1 から valuesの要素数 まで 1 ずつ増やす)\n    if (values[i] ≧ target)\n      return i\n    endif\n  endfor\n  return 0`,
      choices: ["0", "3", "4", "5"], answer: 2,
      explanation: "先頭から順に調べると，10以上となる最初の要素はvalues[4]の12なので，4を返す。",
      choiceNotes: ["条件を満たす要素は存在するので0ではない。", "要素番号3の値5は10未満である。", "正しい。最初に条件を満たす要素番号は4である。", "要素数を返す処理ではない。"]
    }),
    makeTrendQuestion({
      id: "BQ033", pattern: "線形探索・集計", keyword: "最長連続区間", subField: "線形走査", difficulty: "標準",
      question: "関数 longestRun を longestRun({2, 2, 5, 5, 5, 1, 1}) として呼び出したとき，返される値はどれか。ここで，引数の配列は要素数1以上であり，要素番号は1から始まる。",
      code: `○整数型: longestRun(整数型の配列: values)\n  整数型: current ← 1, best ← 1, i\n  for (i を 2 から valuesの要素数 まで 1 ずつ増やす)\n    if (values[i] ＝ values[i － 1])\n      current ← current ＋ 1\n    else\n      current ← 1\n    endif\n    if (current ＞ best)\n      best ← current\n    endif\n  endfor\n  return best`,
      choices: ["2", "3", "4", "5"], answer: 1,
      explanation: "同じ値が連続する長さは，2が2個，5が3個，1が2個である。最大は3なので3を返す。",
      choiceNotes: ["先頭又は末尾の連続区間だけを見た結果である。", "正しい。値5が3個連続している。", "値の種類数などを混同した結果である。", "値5そのものを返す処理ではない。"]
    }),
    makeTrendQuestion({
      id: "BQ034", pattern: "線形探索・集計", keyword: "正の増分集計", subField: "線形走査", difficulty: "標準",
      question: "関数 totalRise を totalRise({8, 11, 9, 15, 15, 18}) として呼び出したとき，返される値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: totalRise(整数型の配列: values)\n  整数型: total ← 0, i\n  for (i を 2 から valuesの要素数 まで 1 ずつ増やす)\n    if (values[i] ＞ values[i － 1])\n      total ← total ＋ (values[i] － values[i － 1])\n    endif\n  endfor\n  return total`,
      choices: ["9", "12", "15", "18"], answer: 1,
      explanation: "増加した区間だけを加える。8から11で3，9から15で6，15から18で3なので，合計は12である。",
      choiceNotes: ["最初と最後の差だけを求めた値である。", "正しい。3＋6＋3＝12である。", "減少分も絶対値として加えた場合などの誤りである。", "末尾の要素の値であり，増分の合計ではない。"]
    }),
    makeTrendQuestion({
      id: "BQ035", pattern: "線形探索・集計", keyword: "累積値の最大", subField: "累積集計", difficulty: "標準",
      question: "関数 maxPrefix を maxPrefix({3, -2, 4, -5, 2}) として呼び出したとき，返される値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: maxPrefix(整数型の配列: changes)\n  整数型: balance ← 0, best ← 0, i\n  for (i を 1 から changesの要素数 まで 1 ずつ増やす)\n    balance ← balance ＋ changes[i]\n    if (balance ＞ best)\n      best ← balance\n    endif\n  endfor\n  return best`,
      choices: ["2", "3", "5", "7"], answer: 2,
      explanation: "balanceは順に3，1，5，0，2となる。このうち最大は5なので，5を返す。",
      choiceNotes: ["最終的なbalanceの値である。", "最初の更新時点だけを見た値である。", "正しい。累積値の最大は5である。", "正の要素3，4だけを加え，途中の減少を無視した値である。"]
    }),

    // パターン2：探索・二分探索系
    makeTrendQuestion({
      id: "BQ036", pattern: "探索・二分探索", keyword: "二分探索の比較回数", subField: "二分探索", difficulty: "標準",
      question: "関数 binarySearch を binarySearch({4, 9, 13, 18, 21, 27, 32}, 21) として呼び出したとき，data[mid]とtargetの比較は何回行われるか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: binarySearch(整数型の配列: data, 整数型: target)\n  整数型: left ← 1, right ← dataの要素数, mid\n  while (left ≦ right)\n    mid ← (left ＋ right) ÷ 2 の商\n    if (data[mid] ＝ target)\n      return mid\n    elseif (data[mid] ＜ target)\n      left ← mid ＋ 1\n    else\n      right ← mid － 1\n    endif\n  endwhile\n  return 0`,
      choices: ["1回", "2回", "3回", "4回"], answer: 2,
      explanation: "比較する要素は18，27，21の順であり，3回目に一致する。",
      choiceNotes: ["最初の中央要素18では一致しない。", "2回目の27でも一致しない。", "正しい。18，27，21の3回である。", "一致後は直ちにreturnするので4回目はない。"]
    }),
    makeTrendQuestion({
      id: "BQ037", pattern: "探索・二分探索", keyword: "下限探索", subField: "二分探索", difficulty: "応用",
      question: "関数 lowerBound を lowerBound({3, 8, 12, 20, 20, 31}, 20) として呼び出したとき，返される値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: lowerBound(整数型の配列: data, 整数型: target)\n  整数型: left ← 1, right ← dataの要素数 ＋ 1, mid\n  while (left ＜ right)\n    mid ← (left ＋ right) ÷ 2 の商\n    if ((mid ≦ dataの要素数) and (data[mid] ＜ target))\n      left ← mid ＋ 1\n    else\n      right ← mid\n    endif\n  endwhile\n  return left`,
      choices: ["3", "4", "5", "6"], answer: 1,
      explanation: "20以上である最初の要素はdata[4]である。処理は4，2，3番目を調べた後，leftとrightが4で一致する。",
      choiceNotes: ["data[3]は12であり20未満である。", "正しい。最初の20の要素番号は4である。", "2個目の20の要素番号である。", "末尾の31の要素番号である。"]
    }),
    makeTrendQuestion({
      id: "BQ038", pattern: "探索・二分探索", keyword: "解の二分探索", subField: "二分探索", difficulty: "応用",
      question: "関数 ceilRoot を ceilRoot(30) として呼び出したとき，返される値はどれか。引数nは1以上100以下の整数である。",
      code: `○整数型: ceilRoot(整数型: n)\n  整数型: left ← 1, right ← 10, mid\n  while (left ＜ right)\n    mid ← (left ＋ right) ÷ 2 の商\n    if (mid × mid ≧ n)\n      right ← mid\n    else\n      left ← mid ＋ 1\n    endif\n  endwhile\n  return left`,
      choices: ["5", "6", "7", "8"], answer: 1,
      explanation: "平方が30以上となる最小の整数を探索する。5²は25で30未満，6²は36で30以上なので6を返す。",
      choiceNotes: ["5の平方は30未満である。", "正しい。条件を満たす最小の整数は6である。", "6も条件を満たすので7まで進まない。", "探索範囲の途中値であり，最小解ではない。"]
    }),
    makeTrendQuestion({
      id: "BQ039", pattern: "探索・二分探索", keyword: "不一致時の二分探索", subField: "二分探索", difficulty: "標準",
      question: "関数 searchLog を searchLog({2, 5, 9, 14, 20, 28}, 16) として呼び出したとき，comparedへ追加される値を先頭から並べたものはどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型の配列: searchLog(整数型の配列: data, 整数型: target)\n  整数型: left ← 1, right ← dataの要素数, mid\n  整数型の配列: compared ← {}\n  while (left ≦ right)\n    mid ← (left ＋ right) ÷ 2 の商\n    comparedの末尾 に data[mid] を追加する\n    if (data[mid] ＝ target)\n      return compared\n    elseif (data[mid] ＜ target)\n      left ← mid ＋ 1\n    else\n      right ← mid － 1\n    endif\n  endwhile\n  return compared`,
      choices: ["{9, 14, 20}", "{9, 20, 14}", "{14, 20}", "{20, 14, 9}"], answer: 1,
      explanation: "最初はmid=3で9，次は範囲4～6のmid=5で20，最後はmid=4で14を比較し，不一致で終了する。",
      choiceNotes: ["探索範囲の更新順を誤っている。", "正しい。比較順は9，20，14である。", "最初の比較9を記録していない。", "最初から右側の値20を比較するわけではない。"]
    }),
    makeTrendQuestion({
      id: "BQ040", pattern: "探索・二分探索", keyword: "末尾一致探索", subField: "二分探索", difficulty: "応用",
      question: "関数 lastPosition を lastPosition({1, 3, 3, 3, 7, 9}, 3) として呼び出したとき，返される値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `○整数型: lastPosition(整数型の配列: data, 整数型: target)\n  整数型: left ← 1, right ← dataの要素数, answer ← 0, mid\n  while (left ≦ right)\n    mid ← (left ＋ right) ÷ 2 の商\n    if (data[mid] ≦ target)\n      if (data[mid] ＝ target)\n        answer ← mid\n      endif\n      left ← mid ＋ 1\n    else\n      right ← mid － 1\n    endif\n  endwhile\n  return answer`,
      choices: ["2", "3", "4", "5"], answer: 2,
      explanation: "一致しても右側を探索し続けるので，answerは3から4へ更新される。最後の3はdata[4]である。",
      choiceNotes: ["最初の3の位置である。", "最初に比較して一致する3の位置であり，探索は続く。", "正しい。最後の3の要素番号は4である。", "data[5]は7であり，targetとは一致しない。"]
    }),

    // パターン3：整列（ソート）系
    makeTrendQuestion({
      id: "BQ041", pattern: "整列（ソート）", keyword: "挿入ソートの途中経過", subField: "挿入ソート", difficulty: "標準",
      question: "次の挿入ソートで，iが4のときの処理を終えた直後のdataはどれか。ここで，配列の要素番号は1から始まる。",
      code: `整数型の配列: data ← {7, 3, 5, 2, 6}\n整数型: i, j, key\nfor (i を 2 から dataの要素数 まで 1 ずつ増やす)\n  key ← data[i]\n  j ← i － 1\n  while ((j ≧ 1) and (data[j] ＞ key))\n    data[j ＋ 1] ← data[j]\n    j ← j － 1\n  endwhile\n  data[j ＋ 1] ← key\nendfor`,
      choices: ["{2, 3, 5, 7, 6}", "{3, 5, 7, 2, 6}", "{2, 3, 5, 6, 7}", "{7, 5, 3, 2, 6}"], answer: 0,
      explanation: "i=3までに先頭3要素は{3,5,7}となる。i=4では2を先頭へ挿入するので，{2,3,5,7,6}となる。",
      choiceNotes: ["正しい。先頭4要素が整列済みになる。", "i=4の処理を行う直前の状態である。", "全ての処理を終えた最終状態である。", "要素を単に逆向きへ動かした結果である。"]
    }),
    makeTrendQuestion({
      id: "BQ042", pattern: "整列（ソート）", keyword: "選択ソートの途中経過", subField: "選択ソート", difficulty: "標準",
      question: "次の選択ソートで，外側の繰返しを2回終えた直後のdataはどれか。ここで，配列の要素番号は1から始まる。",
      code: `整数型の配列: data ← {4, 1, 6, 3, 5}\n整数型: i, j, maxPos, temp\nfor (i を 1 から dataの要素数 － 1 まで 1 ずつ増やす)\n  maxPos ← i\n  for (j を i ＋ 1 から dataの要素数 まで 1 ずつ増やす)\n    if (data[j] ＞ data[maxPos])\n      maxPos ← j\n    endif\n  endfor\n  temp ← data[i]\n  data[i] ← data[maxPos]\n  data[maxPos] ← temp\nendfor`,
      choices: ["{6, 5, 4, 3, 1}", "{6, 4, 1, 3, 5}", "{6, 5, 1, 3, 4}", "{5, 6, 4, 3, 1}"], answer: 0,
      explanation: "1回目に最大値6を先頭へ移し{6,1,4,3,5}となる。2回目に残りの最大値5を2番目へ移すので{6,5,4,3,1}となる。",
      choiceNotes: ["正しい。2回の選択で先頭2要素が確定する。", "1回目の交換後，2回目の最大値探索を正しく反映していない。", "最大値の元の位置へ移す値を誤った結果である。", "先頭二つの確定順を逆にした結果である。"]
    }),
    makeTrendQuestion({
      id: "BQ043", pattern: "整列（ソート）", keyword: "整列済み配列のマージ", subField: "マージ", difficulty: "標準",
      question: "昇順に整列済みの配列leftとrightをマージする。resultへ4個の要素を追加した直後のresultはどれか。ここで，各配列の要素番号は1から始まる。",
      code: `整数型の配列: left ← {2, 6, 9}\n整数型の配列: right ← {1, 5, 7, 10}\n整数型の配列: result ← {}\n整数型: i ← 1, j ← 1\nwhile ((i ≦ leftの要素数) and (j ≦ rightの要素数))\n  if (left[i] ≦ right[j])\n    resultの末尾 に left[i] を追加する\n    i ← i ＋ 1\n  else\n    resultの末尾 に right[j] を追加する\n    j ← j ＋ 1\n  endif\nendwhile`,
      choices: ["{1, 2, 5, 7}", "{1, 2, 5, 6}", "{2, 6, 1, 5}", "{1, 5, 2, 6}"], answer: 1,
      explanation: "先頭要素を比較し続けると，1，2，5，6の順にresultへ追加される。",
      choiceNotes: ["4個目では7より先に6が追加される。", "正しい。最初の4要素は1，2，5，6である。", "配列ごとに二つずつコピーする処理ではない。", "比較後の追加順を誤っている。"]
    }),
    makeTrendQuestion({
      id: "BQ044", pattern: "整列（ソート）", keyword: "安定ソート", subField: "整列の安定性", difficulty: "応用",
      question: "レコードをkeyの昇順に，安定な整列アルゴリズムで並べ替えた結果はどれか。括弧内は（key，name）を表す。",
      code: `整列前: {(2, "A"), (1, "B"), (2, "C"), (1, "D")}\n比較条件: 左のkeyが右のkeyより大きいときだけ交換する`,
      choices: [
        "{(1, \"B\"), (1, \"D\"), (2, \"A\"), (2, \"C\")}",
        "{(1, \"D\"), (1, \"B\"), (2, \"C\"), (2, \"A\")}",
        "{(1, \"B\"), (1, \"D\"), (2, \"C\"), (2, \"A\")}",
        "{(2, \"A\"), (2, \"C\"), (1, \"B\"), (1, \"D\")}"
      ], answer: 0,
      explanation: "安定な整列では，同じkeyをもつレコードの相対順序を保つ。key=1ではBがDより前，key=2ではAがCより前のままである。",
      choiceNotes: ["正しい。同一key内の相対順序が保たれている。", "両方のkeyで相対順序が逆転している。", "key=2のAとCの順序が逆転している。", "keyの降順であり，指定された昇順ではない。"]
    }),
    makeTrendQuestion({
      id: "BQ045", pattern: "整列（ソート）", keyword: "バブルソートの早期終了", subField: "バブルソート", difficulty: "標準",
      question: "次のプログラムを実行したとき，compareCountの値はどれか。ここで，配列の要素番号は1から始まる。",
      code: `整数型の配列: data ← {1, 3, 5, 7, 9}\n整数型: i, j, compareCount ← 0, temp\n論理型: swapped\nfor (i を 1 から dataの要素数 － 1 まで 1 ずつ増やす)\n  swapped ← false\n  for (j を 1 から dataの要素数 － i まで 1 ずつ増やす)\n    compareCount ← compareCount ＋ 1\n    if (data[j] ＞ data[j ＋ 1])\n      temp ← data[j]\n      data[j] ← data[j ＋ 1]\n      data[j ＋ 1] ← temp\n      swapped ← true\n    endif\n  endfor\n  if (swapped ＝ false)\n    繰返し処理を終了する\n  endif\nendfor`,
      choices: ["0", "4", "10", "20"], answer: 1,
      explanation: "配列は既に昇順なので，最初の内側の繰返しで4回比較しても交換は発生しない。その直後に外側の繰返しを終了する。",
      choiceNotes: ["交換は0回だが，比較は行われる。", "正しい。最初の走査における比較は4回である。", "早期終了しない場合の全比較回数である。", "同じ組を重複して数えた値である。"]
    }),

    // パターン4：データ構造操作系
    makeTrendQuestion({
      id: "BQ046", pattern: "データ構造操作", keyword: "スタックによる逆ポーランド記法", subField: "スタック", difficulty: "標準",
      question: "次の逆ポーランド記法の式を，数値をスタックへ積み，演算子ごとに二つの値を取り出して計算する方法で評価した結果はどれか。減算では，先に取り出した値を右オペランドとする。",
      code: `5  2  3  ×  ＋  4  －`,
      choices: ["3", "7", "9", "11"], answer: 1,
      explanation: "2×3=6，5＋6=11，11－4=7の順に評価するので，結果は7である。",
      choiceNotes: ["演算順序又は減算の左右を誤った結果である。", "正しい。最終的なスタック先頭は7である。", "加算と減算の順序を誤った結果である。", "最後の減算を行う前の値である。"]
    }),
    makeTrendQuestion({
      id: "BQ047", pattern: "データ構造操作", keyword: "循環キュー", subField: "キュー", difficulty: "標準",
      question: "容量4の空の循環キューに対して，次の操作を上から順に行った。最後のdequeueの後，キューに残る要素を先頭から並べたものはどれか。enqueueは末尾への追加，dequeueは先頭要素の取出しを表す。",
      code: `enqueue(4)\nenqueue(7)\nenqueue(9)\ndequeue()\nenqueue(2)\nenqueue(5)\ndequeue()`,
      choices: ["{2, 5}", "{7, 9, 2}", "{9, 2, 5}", "{5, 2, 9}"], answer: 2,
      explanation: "最初のdequeueで4，最後のdequeueで7を取り出す。残る要素は先頭から9，2，5である。",
      choiceNotes: ["9を誤って取り出したものとしている。", "最後のdequeueで7は取り除かれる。", "正しい。FIFO順は9，2，5である。", "循環配列上の物理配置と論理的なキュー順を混同している。"]
    }),
    makeTrendQuestion({
      id: "BQ048", pattern: "データ構造操作", keyword: "単方向リストからの削除", subField: "連結リスト", difficulty: "応用",
      question: "配列dataとnextで表した単方向リストに対し，pを3として次の文を実行した。リストの先頭から値をたどった結果はどれか。ここで，リストの先頭要素の要素番号は1である。",
      code: `data ← {10, 20, 30, 40}\nnext ← {3, 4, 2, 未定義の値}\np ← 3\nnext[p] ← next[next[p]]`,
      choices: ["{10, 20, 30, 40}", "{10, 30, 20}", "{10, 30, 40}", "{30, 20, 40}"], answer: 2,
      explanation: "変更前は1→3→2→4なので，値は10→30→20→40である。next[3]をnext[2]の4へ変更すると，要素2を飛ばして1→3→4となる。",
      choiceNotes: ["配列の物理的な並びであり，nextをたどった順序ではない。", "末尾要素4まで削除する処理ではない。", "正しい。値20の要素だけがリストから外れる。", "リストの先頭は要素番号1のままである。"]
    }),
    makeTrendQuestion({
      id: "BQ049", pattern: "データ構造操作", keyword: "括弧列とスタック", subField: "スタック", difficulty: "標準",
      question: "括弧列\"(()(()))\"を左から調べる。\"(\"を読み込むたびにスタックへ積み，\")\"を読み込むたびに一つ取り出すとき，スタックに格納される要素数の最大値はどれか。",
      code: `対象の括弧列: (()(()))`,
      choices: ["2", "3", "4", "5"], answer: 1,
      explanation: "要素数は順に1，2，1，2，3，2，1，0と変化する。最大値は3である。",
      choiceNotes: ["外側付近だけを追跡した場合の値である。", "正しい。5文字目の\"(\"を積んだ直後に3となる。", "括弧の組数と最大深さを混同している。", "開き括弧の総数を数えた値である。"]
    }),
    makeTrendQuestion({
      id: "BQ050", pattern: "データ構造操作", keyword: "優先度付きキュー", subField: "ヒープ", difficulty: "標準",
      question: "最小値を先頭に保持する空の優先度付きキューに，7，3，9，1，5をこの順に追加した後，最小値の取出しを2回行う。このとき，次に取り出される値はどれか。",
      code: `insert(7)\ninsert(3)\ninsert(9)\ninsert(1)\ninsert(5)\ndeleteMin()\ndeleteMin()`,
      choices: ["1", "3", "5", "7"], answer: 2,
      explanation: "追加後の値を昇順に見ると1，3，5，7，9である。1と3を順に取り出した後の最小値は5である。",
      choiceNotes: ["1回目に既に取り出されている。", "2回目に既に取り出されている。", "正しい。残る要素の最小値は5である。", "5より大きいので次の最小値ではない。"]
    }),

    // パターン5：再帰・木構造系
    makeTrendQuestion({
      id: "BQ051", pattern: "再帰・木構造", keyword: "桁和の再帰", subField: "再帰", difficulty: "標準",
      question: "関数 digitSum を digitSum(4825) として呼び出したとき，返される値はどれか。",
      code: `○整数型: digitSum(整数型: n)\n  if (n ＜ 10)\n    return n\n  endif\n  return (n mod 10) ＋ digitSum(n ÷ 10 の商)`,
      choices: ["15", "17", "19", "21"], answer: 2,
      explanation: "再帰呼出しごとに末尾の桁を加えるので，5＋2＋8＋4＝19である。",
      choiceNotes: ["一部の桁を数え落とした結果である。", "桁の加算を誤った結果である。", "正しい。全ての桁の和は19である。", "商をそのまま加えるなどした結果である。"]
    }),
    makeTrendQuestion({
      id: "BQ052", pattern: "再帰・木構造", keyword: "再帰的漸化式", subField: "再帰", difficulty: "標準",
      question: "関数 recurrence を recurrence(4) として呼び出したとき，返される値はどれか。",
      code: `○整数型: recurrence(整数型: n)\n  if (n ≦ 1)\n    return 1\n  endif\n  return recurrence(n － 1) ＋ 2 × recurrence(n － 2)`,
      choices: ["7", "9", "11", "13"], answer: 2,
      explanation: "f(0)=1，f(1)=1から，f(2)=3，f(3)=5，f(4)=11となる。",
      choiceNotes: ["係数2を一部反映していない。", "漸化式の展開を誤った結果である。", "正しい。5＋2×3＝11である。", "基底値又は係数を誤っている。"]
    }),
    makeTrendQuestion({
      id: "BQ053", pattern: "再帰・木構造", keyword: "二分木の中間順巡回", subField: "木構造", difficulty: "標準",
      question: "次の二分木を中間順（左部分木，節，右部分木の順）で巡回したとき，節の値の出力順はどれか。値47の節が根である。",
      code: `47の左の子: 21    47の右の子: 82\n21の左の子: 63    21の右の子: 14\n82の左の子: 35    82の右の子: 未定義\n63，14，35の子: 未定義`,
      choices: ["47, 21, 63, 14, 82, 35", "63, 21, 14, 47, 35, 82", "63, 14, 21, 35, 82, 47", "47, 82, 35, 21, 14, 63"], answer: 1,
      explanation: "値21の部分木は63，21，14，次に根47，値82の部分木は35，82の順となる。したがって63，21，14，47，35，82である。",
      choiceNotes: ["節を左右の子より先に処理する先行順に近い並びである。", "正しい。左部分木，節，右部分木の順である。", "根を最後に処理する後行順に近い並びである。", "右部分木から巡回しており，指定順と異なる。"]
    }),
    makeTrendQuestion({
      id: "BQ054", pattern: "再帰・木構造", keyword: "二分木の高さ", subField: "木構造", difficulty: "標準",
      question: "関数 height に次の二分木の根Pを渡したとき，返される値はどれか。ここで，子をもたない節の高さは1とする。",
      code: `○整数型: height(Node: node)\n  if (node が 未定義)\n    return 0\n  endif\n  return 1 ＋ max(height(node.left), height(node.right))\n\nPの子: Q, R\nQの子: S, T\nRの子: 未定義, U\nSの子: V, 未定義\nT，U，Vの子: 未定義`,
      choices: ["2", "3", "4", "7"], answer: 2,
      explanation: "最長経路はP→Q→S→Vで，節を4個含む。関数はこの節数を高さとして返すので4である。",
      choiceNotes: ["根から途中までしか数えていない。", "辺の本数を高さとした場合の値であり，本問の定義とは異なる。", "正しい。最長経路上の節数は4である。", "木全体の節数であり，高さではない。"]
    }),
    makeTrendQuestion({
      id: "BQ055", pattern: "再帰・木構造", keyword: "二分探索木の後行順巡回", subField: "二分探索木", difficulty: "応用",
      question: "空の二分探索木に12，5，18，2，9，7，11をこの順に挿入した後，後行順（左部分木，右部分木，節の順）で巡回する。出力順はどれか。",
      code: `挿入規則:\n値が現在の節より小さいときは左部分木へ進み，\n大きいときは右部分木へ進む。`,
      choices: ["12, 5, 2, 9, 7, 11, 18", "2, 5, 7, 9, 11, 12, 18", "2, 7, 11, 9, 5, 18, 12", "2, 7, 9, 11, 5, 18, 12"], answer: 2,
      explanation: "根12の左部分木は根5で，その後行順は2，7，11，9，5である。右部分木は18だけなので，最後に根12を出力し，2，7，11，9，5，18，12となる。",
      choiceNotes: ["根を最初に出力する先行順である。", "値の昇順であり，中間順に近い並びである。", "正しい。左部分木，右部分木，根の順である。", "節9を子7，11より先に出力している。"]
    })
  ];

  window.FE_QUESTIONS_B = [
    ...(Array.isArray(window.FE_QUESTIONS_B) ? window.FE_QUESTIONS_B : []),
    ...trendQuestions
  ];
})();
