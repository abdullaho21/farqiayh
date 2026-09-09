import { Component, lazy, Suspense, useEffect, useReducer, useRef } from 'react';
import { CATEGORIES } from './categories.js';
import { ceremonyReducer, INITIAL_STATE } from './ceremony.js';
import { Trophy, ArrowLeft } from './icons.jsx';

const loadAwards = () => import('./Awards.jsx');
const Awards = lazy(loadAwards);
const prepareAwards = () => { loadAwards().catch(() => {}); };

class CeremonyBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <section className="load-state" role="alert">
        <Trophy size={40} />
        <h1 id="screen-title" tabIndex={-1}>تعذّر تحميل الحفل</h1>
        <p>تحقّق من اتصالك، ثم أعد تحميل الصفحة.</p>
        <a className="button button-gold" href="./">إعادة المحاولة</a>
      </section>
    );
    return this.props.children;
  }
}

function Welcome({ onStart }) {
  return (
    <section className="welcome" aria-labelledby="screen-title">
      <div className="welcome-copy">
        <p className="eyebrow"><span className="eyebrow-line" />اختيارات المجتمع · 2025</p>
        <h1 id="screen-title" tabIndex={-1}>حفل جوائز<br /><span>لعبة السنة</span></h1>
        <p className="welcome-description">من الترشيحات إلى لحظة التتويج.<br />اكتشف الألعاب التي اختارها الجميع.</p>
        <button className="button button-gold button-start" onClick={onStart} onPointerEnter={prepareAwards} onFocus={prepareAwards}>
          ابدأ العرض <ArrowLeft size={22} />
        </button>
        <dl className="welcome-stats">
          <div><dt>جائزة</dt><dd className="english">{CATEGORIES.length - 1}</dd></div>
          <div><dt>مرحلتان للتصويت</dt><dd className="english">02</dd></div>
          <div><dt>ألعاب تستحق الذكر</dt><dd><Trophy size={27} /></dd></div>
        </dl>
      </div>
      <div className="edition-art" aria-hidden="true">
        <div className="edition-topline"><span>THE COMMUNITY'S CHOICE</span><span>2025</span></div>
        <div className="edition-numerals"><span>20</span><span className="edition-gold">25</span></div>
        <div className="edition-seal"><Trophy size={40} /></div>
        <div className="edition-caption"><span>FARQIAYH</span><span>GAME AWARDS</span></div>
      </div>
    </section>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(ceremonyReducer, INITIAL_STATE);
  const previousScreen = useRef('welcome:0');
  const screenKey = state.stage + ':' + state.categoryIndex;

  useEffect(() => {
    if (previousScreen.current !== screenKey) {
      previousScreen.current = screenKey;
      window.scrollTo(0, 0);
      if (state.stage === 'welcome') document.getElementById('screen-title')?.focus({ preventScroll: true });
    }
  }, [screenKey, state.stage]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">انتقل إلى المحتوى</a>
      <header className="site-header">
        <a className="brand" href="./" aria-label="حفل جوائز لعبة السنة، الصفحة الرئيسية">
          <span className="brand-icon"><Trophy size={23} /></span>
          <span><strong>حفل الجوائز</strong><span className="brand-name english">FARQIAYH</span></span>
        </a>
        <div className="header-edition"><span>لعبة السنة</span><span className="edition-pill english">2025</span></div>
      </header>
      <main id="main" tabIndex={-1}>
        <CeremonyBoundary>
          {state.stage === 'welcome' ? <Welcome onStart={() => dispatch({ type: 'start' })} /> : (
            <Suspense fallback={<section className="load-state" role="status"><Trophy size={40} /><p>جارٍ تجهيز الحفل…</p></section>}>
              <Awards state={state} dispatch={dispatch} />
            </Suspense>
          )}
        </CeremonyBoundary>
      </main>
      <footer className="site-footer"><span>بتصويت المجتمع، لعشّاق الألعاب.</span><span className="english" dir="ltr">FARQIAYH AWARDS / 2025</span></footer>
    </div>
  );
}
