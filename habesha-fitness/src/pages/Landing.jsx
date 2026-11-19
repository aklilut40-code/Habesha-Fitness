import { useMemo } from 'react';
import PublicNav, { scrollToSection } from '../components/layout/PublicNav';
import Logo from '../components/layout/Logo';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { navigate } from '../store/router';
import { useData } from '../store/DataContext';
import { IMAGES } from '../store/images';
import { PROGRAMS } from '../store/programs';
import { money } from '../utils/format';
import { useLang } from '../i18n/LangContext';
import { OWNER, SOCIAL } from '../config/contact';

const STATS = [
  ['1,200+', 'stat1'],
  ['25+', 'stat2'],
  ['60+', 'stat3'],
  ['12', 'stat4'],
];

const TESTIMONIALS = [
  { name: 'Daniel B.', role: 'Member for 2 years', text: 'I came in to lose weight and stayed for the community. The coaches track my progress and keep me honest every single week.' },
  { name: 'Selam T.', role: 'Strength program', text: 'The strength program changed how I train. My squat is up 40 kg and I finally understand proper technique.' },
  { name: 'Marcus J.', role: 'Premium member', text: 'Premium is worth every cent — personal sessions, recovery lounge, and equipment that is always in great shape.' },
];

export default function Landing() {
  const { trainers, plans, settings } = useData();
  const { t, tr } = useLang();
  const programs = useMemo(() => PROGRAMS.slice(0, 3), []);
  const team = trainers.slice(0, 4);

  return (
    <div className="landing">
      <PublicNav onLanding />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="zap" size={14} /> {t('heroEyebrow', { gym: settings.gymName })}</span>
            <h1>{t('heroA')} <span>{t('heroB')}</span></h1>
            <p>{t('heroText')}</p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => navigate('/register')} iconRight="arrow">{t('joinNow')}</Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('programs')}>{t('explore')}</Button>
            </div>
            <ul className="hero-points">
              <li><Icon name="check" size={16} /> {t('point1')}</li>
              <li><Icon name="check" size={16} /> {t('point2')}</li>
              <li><Icon name="check" size={16} /> {t('point3')}</li>
            </ul>
          </div>
          <div className="hero-visual">
            <img src={IMAGES.hero} alt="Muscular bodybuilder posing in a dramatic gym with smoke and spotlights" />
            <div className="hero-badge">
              <Icon name="flame" size={20} />
              <div><strong>{t('badgeTitle')}</strong><span>{t('badgeSub')}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-grid">
          {STATS.map(([v, k]) => (
            <div key={k}><strong>{v}</strong><span>{t(k)}</span></div>
          ))}
        </div>
      </section>

      <section className="section" id="programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('progEyebrow')}</span>
            <h2>{t('progTitle')}</h2>
            <p>{t('progSub')}</p>
          </div>
          <div className="grid-3">
            {programs.map((p) => (
              <article key={p.id} className="program-card">
                <div className="program-img"><img src={IMAGES[p.image]} alt={tr(p.name)} style={{ objectPosition: p.pos }} /></div>
                <div className="program-body">
                  <div className="program-meta"><span>{tr(p.level)}</span><span>{t('weeksN', { n: p.weeks })}</span><span>{t('perWeek', { n: p.sessionsPerWeek })}</span></div>
                  <h3>{tr(p.name)}</h3>
                  <p>{tr(p.description)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="center">
            <Button variant="outline" onClick={() => navigate('/register')} iconRight="arrow">{t('progJoinAll')}</Button>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="trainers">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('teamEyebrow')}</span>
            <h2>{t('teamTitle')}</h2>
          </div>
          <div className="grid-4">
            {team.map((c) => (
              <article key={c.id} className="trainer-pub">
                <div className="trainer-pub-img">
                  {c.photo ? <img src={IMAGES[c.photo]} alt={c.name} style={{ objectPosition: '50% 20%' }} /> : <Avatar name={c.name} size={96} />}
                </div>
                <h3>{c.name}</h3>
                <span className="muted">{tr(c.specialization)}</span>
                <small>{t('yearsExp', { n: c.experience })}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="plans">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('plansEyebrow')}</span>
            <h2>{t('plansTitle')}</h2>
            <p>{t('plansSub')}</p>
          </div>
          <div className="grid-3 plans-grid">
            {plans.map((p) => (
              <article key={p.id} className={`plan-card ${p.popular ? 'popular' : ''}`}>
                {p.popular && <span className="plan-flag">{t('popular')}</span>}
                <h3>{tr(p.name)}</h3>
                <div className="plan-price"><strong>{money(p.price)}</strong><span>/ {p.durationMonths === 1 ? t('perMonth') : t('perMonths', { n: p.durationMonths })}</span></div>
                <ul>
                  {p.benefits.slice(0, 5).map((b) => (
                    <li key={b}><Icon name="check" size={16} /> {tr(b)}</li>
                  ))}
                </ul>
                <Button variant={p.popular ? 'primary' : 'outline'} onClick={() => navigate('/register')}>{t('getPlan', { name: tr(p.name) })}</Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="reviews">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('revEyebrow')}</span>
            <h2>{t('revTitle')}</h2>
            <p className="muted small">{t('revNote')}</p>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((q) => (
              <figure key={q.name} className="quote">
                <div className="stars">{[...Array(5)].map((_, i) => <Icon key={i} name="star" size={16} strokeWidth={1.5} />)}</div>
                <blockquote>{tr(q.text)}</blockquote>
                <figcaption><Avatar name={q.name} size={38} /><div><b>{q.name}</b><small>{tr(q.role)}</small></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-in">
          <div>
            <h2>{t('ctaTitle')}</h2>
            <p>{t('ctaText')}</p>
          </div>
          <Button size="lg" onClick={() => navigate('/register')} iconRight="arrow">{t('joinNow')}</Button>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <Logo name={settings.gymName} />
            <p className="muted footer-about">{t('footAbout')}</p>
          </div>
          <div>
            <h4>{t('footVisit')}</h4>
            <ul className="contact-list">
              <li><Icon name="pin" size={16} /> {tr(settings.address)}</li>
              <li><Icon name="clock" size={16} /> {tr(settings.hours)}</li>
            </ul>
          </div>
          <div>
            <h4>{t('footContact')}</h4>
            <ul className="contact-list">
              <li><Icon name="phone" size={16} /> <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></li>
              <li><Icon name="mail" size={16} /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>
              {SOCIAL.filter((item) => item.url && item.url.trim() !== '').map((item) => (
                <li key={item.label}>
                  <Icon name={item.label.toLowerCase()} size={16} />
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t('footExplore')}</h4>
            <ul className="footer-links">
              {[['programs', 'navPrograms'], ['trainers', 'navTrainers'], ['plans', 'navMembership'], ['reviews', 'navReviews']].map(([id, k]) => (
                <li key={id}><button type="button" onClick={() => scrollToSection(id)}>{t(k)}</button></li>
              ))}
              <li><button type="button" onClick={() => navigate('/login')}>{t('footLogin')}</button></li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">© {new Date().getFullYear()} {settings.gymName}. {t('footRights')} · {OWNER}</div>
      </footer>
    </div>
  );
}
