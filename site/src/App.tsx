/**
 * Bezart official website — Forward Sleeve design
 * A record-sleeve editorial layout with ink navy, paper ivory, and Bezart Violet as a signal color.
 */
import { useState } from "react";
import { Button, Card, Chip } from "@heroui/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  FolderOpen,
  ListTodo,
  Menu,
  Music2,
  Pin,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const workflow = [
  {
    number: "01",
    title: "活動を、ひとつの単位にする。",
    body: "曲、リリース、ライブ、企画。いま前へ進めたいことをプロジェクトとして置き、現在地を見える形にします。",
    icon: <Music2 aria-hidden="true" />,
  },
  {
    number: "02",
    title: "次の一手を、具体的に残す。",
    body: "次に開いたとき、何から始めるか。小さく実行できるアクションを残し、再開の摩擦を減らします。",
    icon: <ListTodo aria-hidden="true" />,
  },
  {
    number: "03",
    title: "必要なものへ、すぐ戻る。",
    body: "ファイル、フォルダ、共有リンク、メモをプロジェクトへ集めます。探す時間を、進める時間に変えます。",
    icon: <FolderOpen aria-hidden="true" />,
  },
];

const features = [
  ["Today", "今日進めることを、次のアクションと一緒に確認できます。"],
  ["プロジェクト", "状態、期限、概要、色、進捗を一つの画面で整理できます。"],
  ["メモ", "アイデアや決定事項を、活動の文脈とともに残せます。"],
  ["関連するもの", "素材、フォルダ、URLを、迷わず戻れる入口として登録できます。"],
  ["横断検索", "プロジェクト名だけでなく、メモやアクションからも探せます。"],
  ["バックアップ", "すべてのデータをJSONとして書き出し、必要なときに戻せます。"],
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ProductWindow() {
  return (
    <div className="product-window" aria-label="Bezart Flowのアプリ画面イメージ">
      <div className="window-topline">
        <div className="window-dots"><i /><i /><i /></div>
        <span>Bezart Flow</span>
        <div className="window-status"><span /> Local-first</div>
      </div>
      <div className="window-body">
        <aside className="window-sidebar">
          <div className="mini-logo"><span><Music2 size={14} /></span><b>Bezart<small>Flow</small></b></div>
          <div className="mini-nav-label">Workspace</div>
          <div className="mini-nav is-current"><Sparkles size={13} /> Today</div>
          <div className="mini-nav"><Music2 size={13} /> プロジェクト <em>4</em></div>
          <div className="mini-nav"><ListTodo size={13} /> クイックメモ</div>
          <div className="mini-side-note"><Pin size={12} /> 再開するときは、次のアクションから。</div>
        </aside>
        <section className="window-content">
          <div className="window-page-head"><div><span>YOUR MUSIC WORKSPACE</span><h3>今日、どの音楽を<br />前へ進めますか？</h3></div><button aria-label="新しいプロジェクト"><span>+</span> 新規</button></div>
          <div className="window-stats"><div><span>進行中</span><b>3</b></div><div><span>次の行動</span><b>7</b></div><div><span>期限あり</span><b>2</b></div></div>
          <div className="window-grid">
            <div className="action-card"><div className="mock-card-head"><div><small>次のアクション</small><strong>今の流れを止めない</strong></div><ChevronRight size={15} /></div><div className="task-line"><i /> <span>サビの歌詞を見直す</span><em>今日</em></div><div className="task-line"><i /> <span>マスター候補を比較する</span><em>金</em></div><div className="task-line"><i /> <span>会場にライダーを送る</span><em>月</em></div></div>
            <div className="project-preview"><div className="mock-card-head"><div><small>ピン留め</small><strong>Night Train</strong></div><span className="violet-dot" /></div><div className="preview-bars"><i /><i /><i /></div><p>3件のアクション</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => scrollTo(id), 0);
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); go("top"); }} aria-label="Bezart Flow トップへ">
          <img src="/assets/Bezart.png" alt="Bezart" />
          <span className="brand-divider" />
          <span className="flow-word">Flow</span>
        </a>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="ページ内ナビゲーション">
          <button onClick={() => go("concept")}>コンセプト</button>
          <button onClick={() => go("features")}>機能</button>
          <button onClick={() => go("privacy")}>ローカルファースト</button>
          <Button variant="primary" size="sm" onPress={() => go("get-flow")}><span>Flowを知る</span><ArrowDownRight size={15} /></Button>
        </nav>
        <button className="menu-trigger" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <main id="top">
        <section className="hero section-frame">
          <div className="hero-copy">
            <div className="index-label"><span>01</span><i /> MUSIC WORKSPACE</div>
            <h1>音楽を編集するのではなく、<em>音楽を前へ。</em></h1>
            <p>曲、リリース、ライブ、企画。Bezart Flowは、音楽活動を再開しやすくするローカルファーストのデスクトップ・ワークスペースです。</p>
            <div className="hero-actions">
              <Button variant="primary" size="lg" onPress={() => scrollTo("features")}><span>機能を見る</span><ArrowDownRight size={18} /></Button>
              <Button variant="ghost" size="lg" onPress={() => scrollTo("concept")}><span>Flowの考え方</span><ArrowDownRight size={18} /></Button>
            </div>
            <div className="hero-meta"><span><b>macOS</b> Apple Silicon</span><span><b>v1.0</b> Local-first</span></div>
          </div>
          <div className="hero-visual">
            <div className="printed-ribbon ribbon-one" /><div className="printed-ribbon ribbon-two" /><div className="printed-ribbon ribbon-three" />
            <ProductWindow />
            <div className="hero-notation">BEZART / FLOW / 001</div>
          </div>
        </section>

        <section className="statement-band" aria-label="Bezart Flowの宣言">
          <div className="band-index">BEZART<br />FLOW<br /><span>001</span></div>
          <p>アイデアは、つくることだけで形にならない。<br />次の一手へ戻れることが、活動を続ける力になる。</p>
          <ArrowUpRight aria-hidden="true" />
        </section>

        <section className="section-frame concept-section" id="concept">
          <div className="section-intro"><div className="index-label"><span>02</span><i /> WHY FLOW</div><h2>止まりやすいのは、<br />制作の外側にある。</h2></div>
          <div className="concept-body"><p className="lead-copy">前回の作業場所、今決まっていること、連絡すべき相手、書き出した素材。音楽を前へ進める途中には、小さくても多くの「思い出すこと」があります。</p><p>Flowは、制作環境を置き換えるものではありません。むしろ、普段使っているソフトやファイル、アイデアに、もう一度迷わず戻るための入口です。</p><div className="pull-quote">「今このプロジェクトを開いたら、<br /><em>まず何をすれば前へ進むか。</em>」</div></div>
        </section>

        <section className="workflow-section" id="features">
          <div className="section-frame workflow-heading"><div className="index-label light"><span>03</span><i /> THE FLOW</div><h2>進めるために、<br /><em>複雑にはしない。</em></h2><p>大きな活動を、再開できる小さな流れへ。</p></div>
          <div className="workflow-list section-frame">{workflow.map((step) => <article className="workflow-item" key={step.number}><div className="workflow-number">{step.number}</div><div className="workflow-icon">{step.icon}</div><div><h3>{step.title}</h3><p>{step.body}</p></div><ArrowDownRight className="workflow-arrow" /></article>)}</div>
        </section>

        <section className="feature-section section-frame">
          <div className="feature-art"><div className="art-kicker">WORKSPACE / <span>NOTES</span></div><div className="paper-stack"><div className="paper-note"><small>PROJECT NOTE</small><p>2番はAメロを半分にして、<br />コーラスを厚くする。</p><div /><div /><div /></div><div className="deadline-card"><CalendarDays size={18} /><small>NEXT DEADLINE</small><b>09<span>/</span>28</b><p>マスター候補を比較</p></div></div><div className="feature-art-ribbon" /></div>
          <div className="feature-copy"><div className="index-label"><span>04</span><i /> WHAT LIVES HERE</div><h2>活動に必要なものを、<br /><em>ひとつの流れに。</em></h2><p>細かい管理のためではなく、活動の文脈を失わないための機能だけを、静かにまとめています。</p><div className="feature-grid">{features.map(([title, description]) => <Card className="feature-card" key={title}><div><h3>{title}</h3><p>{description}</p></div></Card>)}</div></div>
        </section>

        <section className="privacy-section" id="privacy"><div className="section-frame privacy-grid"><div className="privacy-title"><div className="index-label light"><span>05</span><i /> LOCAL-FIRST</div><h2>あなたの活動は、<br /><em>あなたの端末に。</em></h2></div><div className="privacy-copy"><p>未公開音源、歌詞、企画メモ、活動の判断。大切な情報を、最初からアカウント登録やクラウド同期に預ける必要はありません。</p><p>Flowは端末内への保存を基本にします。ファイルやフォルダも、あなたが選んだ参照だけを扱います。</p><div className="privacy-points"><span><Check size={15} /> アカウント登録は必須ではありません</span><span><Check size={15} /> ファイルを自動で複製・送信しません</span><span><Check size={15} /> JSONバックアップで持ち出せます</span></div></div></div></section>

        <section className="closing-section section-frame" id="get-flow"><div className="closing-label">BEZART FLOW<br /><span>FOR THE NEXT STEP</span></div><div className="closing-copy"><Chip color="accent" variant="soft" size="sm">macOS · Apple Silicon</Chip><h2>前回の続きから、<br /><em>始めよう。</em></h2><p>Bezart Flowは、音楽活動の途中にあるあなたの「次の一手」を、いつでも手元に残します。</p><div className="closing-actions"><Button variant="primary" size="lg" onPress={() => scrollTo("features")}><span>Flowの機能を見る</span><ChevronRight size={18} /></Button><Button variant="ghost" size="lg" onPress={() => scrollTo("top")}>トップへ戻る</Button></div></div><div className="closing-mark"><img src="/assets/Bezart.png" alt="Bezart" /><span>FLOW<br />v1.0</span></div></section>
      </main>

      <footer className="site-footer"><span>© 2026 BEZART</span><span>Music activity, in motion.</span><a href="#top" onClick={(event) => { event.preventDefault(); scrollTo("top"); }}><Search size={15} /> BACK TO TOP</a></footer>
    </div>
  );
}

export default App;
