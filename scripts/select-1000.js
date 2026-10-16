// Editorial reduction requested by the user. --apply is required to change CSV.
// Existing browser-added vocabulary is stored separately and is not touched.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {readCSV,stringifyCSV}=require('./csv');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'data/vocabulary.csv');
const original=fs.readFileSync(file),rows=readCSV(file);
const originalHash=crypto.createHash('sha256').update(original).digest('hex');
const target=1000;
if(rows.length<=target)throw new Error('既に1,000件以下です。以前の選定記録は上書きしません。');
const evidence=new Map(readCSV(path.join(root,'reports/ipa-vocabulary-evidence.csv')).map(row=>[row.id,row]));
const protectedCategories=new Set(['ネットワーク','セキュリティ','データベース']);
const related=new Set(`
USB Bluetooth BLE RS-232C RFID GPS OSI基本参照モデル
Webサーバ Webシステム Webブラウザ クライアント サーバ クライアントサーバシステム
HTML CSS JavaScript Ajax XML DOM DTD SVG SGML Webコンテンツ ストリーミング
クラウドコンピューティング クラウドサービス ハイブリッドクラウド オンプレミス ASP SaaS PaaS エッジコンピューティング
SNS ブログ SEO OtoO オンラインモール CGM CtoC GtoC GtoB BtoB eマーケットプレイス 電子メール
セキュリティ要件 セキュリティ クラウド情報セキュリティ管理基準 情報セキュリティ監査 情報セキュリティ管理基準
セキュリティ意識 個人情報保護委員会 サイバーセキュリティ 電子証明書 匿名加工情報 営業秘密 不正競争防止法
管理者権限 アカウンタビリティ データの消去 ログ分析 BYOD IETF IEEE
DBMS データベース 正規化 E-R図 データストア データ管理
`.trim().split(/\s+/));
const core=new Set(`
OJT 機能要件 非機能要件
線形リスト 単方向リスト 双方向リスト 環状リスト オートマトン 有限オートマトン
標本化 量子化 符号化 A/D変換 D/A変換 字句解析 構文解析 意味解析 コード生成
ポアソン分布 ひずみゲージ サーミスタ ホール素子 モーター 油圧シリンダ 空気圧シリンダ
固定小数点数 浮動小数点数 桁落ち 情報落ち オーバーフロー アンダーフロー 丸め誤差
ド・モルガンの法則 論理積 論理和 排他的論理和 否定論理積 否定論理和
条件付き確率 ベイズの定理 正規分布 分散 標準偏差 相関係数
待ち行列モデル 平均到着率 平均サービス率 ハフマン符号 Unicode
スタック キュー 配列 LIFO プッシュ ポップ 2分木 2分探索木 2分探索法 クイックソート マージソート 再帰 ビット演算
CPU GPU RISC CISC レジスタ プログラムカウンタ 命令レジスタ クロック周波数 CPI MIPS パイプライン
内部割込み 外部割込み 入出力割込み DMA
DRAM SRAM RAM ROM 主記憶 補助記憶 キャッシュメモリ フラッシュメモリ SSD ハードディスク メモリインタリーブ
OS プロセス スレッド スケジューリング ラウンドロビン ディスパッチ
仮想記憶 ページング ページフォールト LRU LFU FIFO スワッピング スワップイン スワップアウト スプーリング ブロッキング
スラッシング フラグメンテーション コンパクション ガベージコレクション
実行可能状態 実行状態 待ち状態 コンパイラ インタプリタ リンカ ローダ
フルバックアップ 差分バックアップ 増分バックアップ OSS
RAID0 RAID1 RAID5 RAID6 ミラーリング ストライピング
MTBF MTTR 稼働率 スループット レスポンスタイム ターンアラウンドタイム
フェールセーフ フェールソフト フォールトトレラントシステム フールプルーフ
フリップフロップ 真理値表 AND回路 OR回路 NAND回路
DFD UML ユースケース クラス 継承 カプセル化 多相性
ホワイトボックステスト ブラックボックステスト 命令網羅 判定条件網羅 条件網羅 スタブ ドライバ 回帰テスト
アジャイル スクラム XP リファクタリング
WBS PERT CPM アローダイアグラム ファンクションポイント法
SLA RTO RPO サービスデスク 問題管理 システム監査
ERP SCM CRM RFP RFI SWOT分析 PPM
損益分岐点 ROI ROE ROA IRR 安全在庫 発注点
著作権 特許権 請負契約 準委任契約 労働者派遣契約
`.trim().split(/\s+/));
function fixedProtectedReason(row){
 if(row.added_in_version)return 'Ver.9.0以降の追加語を維持';
 if(protectedCategories.has(row.category))return '指定された保護分野を維持';
 if(row.category_id==='1'&&row.section==='通信に関する理論')return '通信の基礎・誤り制御・符号化を維持';
 if(/プロトコル|通信規約|通信規格|インタフェース規格|無線.*規格/.test(row.name+' '+row.description))return 'プロトコル・通信規格関連を維持';
 return '';
}
// Keep every protected row. Elsewhere, a same-name card can be represented once.
const fixedNames=new Set(rows.filter(fixedProtectedReason).map(row=>row.name));
const representatives=new Map();
const canonicalCategories={'ERP':'17','特許権':'23','請負契約':'23','準委任契約':'23','アローダイアグラム':'14','リファクタリング':'13'};
for(const row of rows){
 if(fixedNames.has(row.name)||(!core.has(row.name)&&!related.has(row.name)))continue;
 if(!representatives.has(row.name)||row.category_id===canonicalCategories[row.name])representatives.set(row.name,row.id);
}
function protectedReason(row){
 const fixed=fixedProtectedReason(row);
 if(fixed)return fixed;
 if(representatives.get(row.name)!==row.id)return '';
 if(related.has(row.name))return '他ジャンルにある通信・インターネット・セキュリティ・DB関連語を維持';
 if(core.has(row.name))return '指定済みの用語・計算・科目Aの基礎概念を維持';
 return '';
}
const generic=new Set(`否定 因数分解 階乗 サービス時間 最頻値 中央値 平均値 単方向 手続型言語 テストデータ プログラミング 代入 引数 実数型 整数型 文字列型 記憶装置 制御装置 バス フォールト サーバ クライアント 再構成 ハードウェア障害 優先順 参照情報 直接アクセス ボリューム 原始プログラム テストツール 目的プログラム ロードモジュール アクティビティ インタフェースファイル 運用要件 テスト要件 品質要件 アーキテクチャ 移植性 運用性 構造化 再利用 使用性 ソフトウェアユニット チェックリスト パッケージ アルゴリズム 欠陥 コーディング データ処理 テストケース プログラム言語 システム要件 ソフトウェア要件 カスタマイズ 標準化 構成品目 不正コピー プロジェクト プロジェクトチーム プロジェクトマネージャ スコープ ラグ リード テレビ会議 サービス可用性 サービスコンポーネント サービス提供者 サービスの要求事項 サービス品質 移行計画 回避策 顧客関係 サービス要求 展開 パフォーマンス マネジメントシステム 力量 リリース 応対マニュアル データ管理 空調設備 業務監査 管理プロセス 業務モデル 情報システム部門 利用者マニュアル ステークホルダ 基本戦略 競争優位 イノベーション 多角化 ベストプラクティス サンプリング 販売促進 製品ライン コア技術 経営資源の最適配分 在庫管理 販売管理 生産方式 自動倉庫 情報表現規約 コーチング メンタリング リテンション 最適化 モデル化 シミュレーション 財務諸表 販売費及び一般管理費 成果物の完成責任 監査役 企業倫理 文字コード`.split(' '));
const important=new Set(`BCD 回帰分析 行列 指数分布 相関分析 逆ポーランド表記法 時間計算量 機械学習 有限オートマトン ハミング符号 PCM フィルタリング バッファ フォールトトレラントシステム スケールアウト TCO バスタブ曲線 スナップショット ブロッキング LFU メモリマップ プリエンプティブ方式 ノンプリエンプティブ方式 リアルタイムOS フィードバック制御 トランジスタ ダイオード IC LSI LED JPEG PNG MPEG H.264 ZIP 圧縮率 クラス図 状態遷移図 シーケンス図 決定表 アサーション デバッガ テスト駆動開発 ペアプログラミング モジュールの独立性 バージョン管理 リスク管理 クラッシング ファストトラッキング ワークパッケージ キャパシティ管理 構成管理 事業継続計画 BCP バックアップ PDCA KPI サービスレベル管理 ITガバナンス ITIL SOA RPA BPO バリューチェーン分析 コアコンピタンス 3C分析 プロダクトライフサイクル マーケティングミックス ロングテール POS MRP CAD NC パレート図 特性要因図 管理図 クリティカルパス 線形計画法 モンテカルロ法 BI 損益計算書 貸借対照表 実用新案権 商標権 意匠権 偽装請負 CSR 内部統制`.split(' '));
function score(row){
 const source=evidence.get(row.id)||{};
 const documents=String(source.documents||'').split(' / ').filter(Boolean);
 const modern=documents.filter(doc=>/^202[3-6].*kamoku_a/.test(doc)).length;
 const recentExemption=documents.filter(doc=>/^tokurei_Mondai_202[0-6]/.test(doc)).length;
 const hits=Number(source.matched_papers)||0;
 return (important.has(row.name)?110:0)+(generic.has(row.name)?-100:0)+
  35*Math.min(modern,3)+15*Math.min(recentExemption,3)+12*Math.min(hits,5)+
  (['基礎理論','アルゴリズムとプログラミング','コンピュータ構成要素','システム構成要素','ソフトウェア','システム開発技術'].includes(row.category)?15:0);
}
const mandatory=rows.filter(row=>protectedReason(row));
if(mandatory.length>target)throw new Error(`保護条件だけで${mandatory.length}件。1,000件にできません。`);
const protectedNames=new Set(mandatory.map(row=>row.name));
const candidates=rows.filter(row=>!protectedReason(row)).map((row,index)=>({row,index,value:score(row)-(protectedNames.has(row.name)?200:0)}));
candidates.sort((a,b)=>b.value-a.value||a.index-b.index);
const selected=new Set(mandatory.map(row=>row.id));
const needed=target-selected.size;
for(const item of candidates.slice(0,needed))selected.add(item.row.id);
const kept=rows.filter(row=>selected.has(row.id)),removed=rows.filter(row=>!selected.has(row.id));
if(kept.length!==target)throw new Error('1,000件に一致しません');
const decisions=rows.map(row=>{
 const source=evidence.get(row.id)||{};
 const sameNameKept=kept.some(other=>other.name===row.name&&other.id!==row.id);
 const reason=selected.has(row.id)?protectedReason(row)||'科目Aの基礎概念・公開問題の照合実績を優先':sameNameKept?'同名の用語を別ジャンルに収録済み':generic.has(row.name)?'日常語・汎用語に近く、単独カードとしての優先度を下げた':!Number(source.matched_papers)?'公開問題での表記一致を確認できず、保護語・基礎概念を優先した':'出題表記はあるが、保護語・基礎概念・比較に必要な語を優先した';
 return {id:row.id,name:row.name,category:row.category,section:row.section,decision:selected.has(row.id)?'keep':'remove',reason,matched_papers:source.matched_papers||'0',documents:source.documents||'',added_in_version:row.added_in_version,score:score(row)};
});
const summary={date:'2026-10-15',before:rows.length,after:kept.length,removed:removed.length,protected:mandatory.length,
 backup:`backups/vocabulary-before-1000-${originalHash.slice(0,12)}.csv`,before_sha256:originalHash,
 added_since_9_0:kept.filter(row=>row.added_in_version).length,protected_categories:[...protectedCategories],
 ranking_note:'公開問題本文・選択肢の表記一致は参考指標。未出題や実際の出題頻度とは断定しない。',
 categories:[...new Set(rows.map(row=>row.category))].map(category=>({category,before:rows.filter(row=>row.category===category).length,after:kept.filter(row=>row.category===category).length}))};
fs.mkdirSync(path.join(root,'tmp/selection-1000'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/selection-1000/decisions.csv'),stringifyCSV(decisions,Object.keys(decisions[0])));
fs.writeFileSync(path.join(root,'tmp/selection-1000/removed.txt'),removed.map(row=>`${row.category}\t${row.name}`).join('\n'));
console.log(JSON.stringify(summary,null,2));
if(!process.argv.includes('--apply'))process.exit(0);
if(!original.equals(fs.readFileSync(file)))throw new Error('CSVが変更されました。再確認してください。');
fs.writeFileSync(path.join(root,summary.backup),original,{flag:'wx'});
fs.writeFileSync(file,stringifyCSV(kept,Object.keys(rows[0])));
fs.writeFileSync(path.join(root,'reports/selection-1000.csv'),stringifyCSV(decisions,Object.keys(decisions[0])));
fs.writeFileSync(path.join(root,'reports/selection-1000-summary.json'),JSON.stringify(summary,null,2)+'\n');
const proof=readCSV(path.join(root,'reports/ipa-vocabulary-evidence.csv')).filter(row=>selected.has(row.id));
fs.writeFileSync(path.join(root,'reports/ipa-vocabulary-evidence.csv'),stringifyCSV(proof,Object.keys(proof[0])));
const reviewPath=path.join(root,'reports/all-description-review.csv');
if(fs.existsSync(reviewPath)){
 const review=readCSV(reviewPath).filter(row=>selected.has(row.id));
 fs.writeFileSync(reviewPath,stringifyCSV(review,Object.keys(review[0])));
}
const csvHash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ipaPath=path.join(root,'reports/ipa-rebuild-summary.json');
const ipa=JSON.parse(fs.readFileSync(ipaPath,'utf8'));
ipa.total=kept.length;ipa.csv_sha256=csvHash;
ipa.syllabus_occurrences=proof.filter(row=>row.basis==='シラバス表記一致').length;
ipa.exam_only_occurrences=proof.filter(row=>row.basis==='公開問題の表記一致').length;
ipa.supplements=ipa.supplements.filter(term=>kept.some(row=>row.name===term.name));
ipa.selection={date:summary.date,before:summary.before,removed:summary.removed};
fs.writeFileSync(ipaPath,JSON.stringify(ipa,null,2)+'\n');
const reviewSummaryPath=path.join(root,'reports/all-description-review-summary.json');
if(fs.existsSync(reviewSummaryPath)){
 const review=JSON.parse(fs.readFileSync(reviewSummaryPath,'utf8'));
 review.total=review.reviewed=kept.length;review.unreviewed=0;review.resultHash=csvHash;
 fs.writeFileSync(reviewSummaryPath,JSON.stringify(review,null,2)+'\n');
}
