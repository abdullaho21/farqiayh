import { useEffect, useRef, useState } from 'react';
import ceremony from 'ceremony-data';
import { CATEGORIES } from './categories.js';
import { getWinners } from './ceremony.js';
import { ICONS, Trophy, ArrowLeft, ArrowRight, Play } from './icons.jsx';

const number = value => String(value).padStart(2, '0');

function Celebration() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 2400);
    const stop = event => { if (event.matches) setActive(false); };
    preference.addEventListener('change', stop);
    return () => { window.clearTimeout(timer); preference.removeEventListener('change', stop); };
  }, []);
  if (!active) return null;
  return <div className="celebration" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--x': (i * 37) % 100 + '%', '--delay': i * 24 + 'ms', '--turn': (i % 2 ? '-' : '') + '180deg' }} />)}</div>;
}

function Nominees({ data, revealed }) {
  const maximum = data[0]?.count || 1;
  return (
    <section className="nominees-panel" aria-labelledby="nominees-title">
      <div className="panel-header"><h2 id="nominees-title">{revealed ? 'الترتيب النهائي' : 'أبرز المرشحين'}</h2><span className="small-label">الأصوات</span></div>
      {data.length ? <ol className="nominee-list">{data.map((entry, index) => (
        <li className={'nominee ' + (revealed && entry.rank === 1 ? 'nominee-winner' : '')} key={entry.name}>
          <span className="nominee-rank english"><span className="sr-only">{revealed ? 'المركز ' : 'المرشح '}</span>{number(revealed ? entry.rank : index + 1)}</span>
          <div className="nominee-detail"><h3 className="english" dir="auto">{entry.name}</h3><span className="vote-track" aria-hidden="true"><span style={{ '--votes': entry.count / maximum * 100 + '%' }} /></span></div>
          <span className="nominee-count english">{entry.count}<span className="sr-only"> أصوات</span></span>
        </li>
      ))}</ol> : <p className="empty-state">لا توجد بيانات لهذه المرحلة.</p>}
      <p className="panel-note">{revealed ? 'بحسب أصوات المرحلة النهائية.' : 'المراكز الخمسة الأولى، مع احتساب التعادل.'}</p>
    </section>
  );
}

function WinnerPanel({ entries, revealed, onReveal }) {
  const heading = useRef(null);
  const winners = getWinners(entries);
  useEffect(() => { if (revealed) heading.current?.focus({ preventScroll: true }); }, [revealed]);
  return (
    <section className={'winner-panel ' + (revealed ? 'is-revealed' : '')} aria-labelledby="winner-title">
      {revealed && winners.length > 0 && <Celebration />}
      <div className="winner-emblem"><Trophy size={56} /></div>
      {!revealed ? <>
        <span className="eyebrow">لحظة التتويج</span>
        <h2 id="winner-title">من يحصد الجائزة؟</h2>
        <p className="winner-description">المرشحون هنا.<br />والفائز ينتظر الإعلان.</p>
        <button className="button button-gold" onClick={onReveal}>كشف الفائز <ArrowLeft size={20} /></button>
        <span className="winner-footnote">نتائج تصويت المرحلة الثانية</span>
      </> : <div className="winner-result">
        <h2 id="winner-title" className="eyebrow" ref={heading} tabIndex={-1}>{winners.length > 1 ? 'تعادل في المركز الأول' : winners.length ? 'الفائز بالجائزة' : 'لم تُحسم الجائزة'}</h2>
        {winners.length ? <>
          <div className="winner-names">{winners.map((winner, index) => <div key={winner.name}>{index > 0 && <span className="tie-divider">&</span>}<h3 className="english" dir="auto">{winner.name}</h3></div>)}</div>
          <span className="winner-badge"><Trophy size={16} />المركز الأول<span className="badge-separator" /><bdi className="english">{winners[0].count}</bdi> أصوات</span>
        </> : <p>لا توجد أصوات نهائية لهذه الفئة.</p>}
      </div>}
    </section>
  );
}

function Mentions() {
  return <section className="mentions-grid" aria-label="ألعاب تستحق الذكر">{ceremony.honorable.map((item, i) => <article className="mention-card" key={item.game}>
    <span className="mention-number english">{number(i + 1)}</span><Trophy size={23} />
    <h2 className="english" dir="auto">{item.game}</h2><p>من اختيار <bdi>{item.voter}</bdi></p>
  </article>)}</section>;
}

function Summary({ onRestart }) {
  const category = CATEGORIES.find(item => item.id === 'goty');
  const winners = getWinners(ceremony.final.goty);
  return (
    <section className="summary" aria-labelledby="screen-title">
      <header className="summary-heading"><p className="eyebrow">النتائج النهائية · 2025</p><h1 id="screen-title" tabIndex={-1}>سجلّ الفائزين</h1><p>اختياراتكم، في مكان واحد.</p></header>
      <article className="summary-featured">
        <div className="featured-label"><Trophy size={40} /><h2>{category.labelAr}</h2><span className="english">GAME OF THE YEAR</span></div>
        <div className="featured-winners">{winners.length ? winners.map(winner => <h3 className="english" dir="auto" key={winner.name}>{winner.name}</h3>) : <p>لا توجد أصوات نهائية.</p>}</div>
        <span className="featured-year english" aria-hidden="true">25</span>
      </article>
      <div className="summary-grid">{CATEGORIES.filter(item => !['goty', 'honorable'].includes(item.id)).map(item => {
        const Icon = ICONS[item.icon];
        const categoryWinners = getWinners(ceremony.final[item.id]);
        return <article className="summary-card" key={item.id}><div className="summary-card-heading"><Icon size={21} /><h2>{item.labelAr}</h2></div>
          {categoryWinners.length ? categoryWinners.map(winner => <h3 className="english" dir="auto" key={winner.name}>{winner.name}</h3>) : <p>لا توجد أصوات نهائية.</p>}
          {categoryWinners.length > 1 && <span className="tie-label">تعادل في المركز الأول</span>}
        </article>;
      })}</div>
      <div className="summary-actions"><button className="button button-outline" onClick={onRestart}><Play size={18} />إعادة العرض</button></div>
    </section>
  );
}

export default function Awards({ state, dispatch }) {
  const { stage, categoryIndex, revealed } = state;
  const category = CATEGORIES[categoryIndex];
  const Icon = ICONS[category.icon];
  useEffect(() => { document.getElementById('screen-title')?.focus({ preventScroll: true }); }, [stage, categoryIndex]);
  if (stage === 'summary') return <Summary onRestart={() => dispatch({ type: 'restart' })} />;
  const honorable = category.id === 'honorable';
  const last = categoryIndex === CATEGORIES.length - 1;
  return (
    <section className="awards" aria-labelledby="screen-title">
      <div className="ceremony-progress">
        <div className="progress-label"><span>{honorable ? 'اختيارات تستحق الاحتفاء' : revealed ? 'النتائج النهائية' : 'المرحلة الأولى · المرشحون'}</span><span className="english" dir="ltr"><strong>{number(categoryIndex + 1)}</strong> / {number(CATEGORIES.length)}</span></div>
        <progress className="sr-only" aria-label="التقدم في فئات الحفل" value={categoryIndex + 1} max={CATEGORIES.length} />
        <div className="progress-segments" aria-hidden="true">{CATEGORIES.map((item, index) => <span key={item.id} className={index < categoryIndex ? 'complete' : index === categoryIndex ? 'current' : ''} />)}</div>
      </div>
      <header className="award-heading"><span className="category-icon"><Icon size={30} /></span><div><p className="eyebrow">{category.id === 'goty' ? 'الجائزة الكبرى' : honorable ? 'خارج المنافسة' : 'الجائزة ' + number(categoryIndex + 1)}</p><h1 id="screen-title" tabIndex={-1}>{category.labelAr}</h1></div></header>
      {honorable ? <Mentions /> : <div className="award-grid">
        <Nominees data={revealed ? ceremony.final[category.id] : ceremony.nominees[category.id]} revealed={revealed} />
        <WinnerPanel key={category.id} entries={ceremony.final[category.id]} revealed={revealed} onReveal={() => dispatch({ type: 'reveal' })} />
      </div>}
      <nav className="award-navigation" aria-label="التنقل بين فئات الجوائز">
        <button className="button button-outline" disabled={categoryIndex === 0} onClick={() => dispatch({ type: 'previous' })}><ArrowRight size={19} />السابق</button>
        <span className="next-category">{last ? 'جميع النتائج في مكان واحد' : <>التالي: <strong>{CATEGORIES[categoryIndex + 1].labelAr}</strong></>}</span>
        <button className={'button ' + (last ? 'button-gold' : 'button-light')} onClick={() => dispatch({ type: 'next' })}>{last ? 'عرض الملخص' : honorable ? 'لعبة السنة' : 'التالي'}<ArrowLeft size={19} /></button>
      </nav>
    </section>
  );
}
