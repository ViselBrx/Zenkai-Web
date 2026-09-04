import { useState } from 'react';
import { animes, desenhos, filmes } from '../data/mockData';

interface Props {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
}

function AnimeCoverMini({ item, onClick }: { item: typeof animes[0]; onClick: () => void }) {
  const [fav, setFav] = useState(false);
  return (
    <div
      onClick={onClick}
      className="card-hover flex-shrink-0"
      style={{ width: 120, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
    >
      <div
        style={{
          width: 120,
          height: 170,
          background: `linear-gradient(160deg, ${item.colorA}, ${item.colorB})`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 8,
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setFav(!fav); }}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? '#ffd700' : 'none'} stroke={fav ? '#ffd700' : 'rgba(255,255,255,0.7)'} strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </button>
        <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '4px 6px' }}>
          <div style={{ fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }} className="line-clamp-2">
            {item.title}
          </div>
          <div style={{ fontSize: 9, color: '#72ffff', marginTop: 2, fontFamily: 'JetBrains Mono' }}>★ {item.rating}</div>
        </div>
      </div>
    </div>
  );
}

function SectionRow({ title, items, onItem }: { title: string; items: typeof animes; onItem: (item: typeof animes[0]) => void }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
        <span className="section-title">{title}</span>
        <button style={{ background: 'none', border: 'none', color: '#72ffff', fontSize: 12, fontFamily: 'Rajdhani', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' }}>
          VER TUDO →
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {items.map(item => (
          <AnimeCoverMini key={item.id} item={item} onClick={() => onItem(item)} />
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  const featured = animes.slice(0, 5);
  const hero = featured[heroIndex];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Status bar sim */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'transparent' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text)' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="#dff0ff"><rect x="0" y="4" width="3" height="8" rx="1"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/><rect x="9" y="0.5" width="3" height="11.5" rx="1"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" opacity="0.3"/></svg>
          <svg width="15" height="12" viewBox="0 0 15 12" fill="#dff0ff"><path d="M7.5 2.5A6.5 6.5 0 0114 6.5M7.5 2.5A6.5 6.5 0 001 6.5M7.5 2.5V2M5 5.5A3 3 0 0110 5.5M9 8.5A2 2 0 017.5 10a2 2 0 01-1.5-1.5" strokeWidth="1.2" stroke="#dff0ff" fill="none"/></svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="#dff0ff" strokeOpacity="0.5"/><rect x="2" y="2" width="15" height="8" rx="1.5" fill="#72ffff"/><path d="M22 4.5V7.5A1.5 1.5 0 0022 4.5Z" stroke="#dff0ff" strokeOpacity="0.5"/></svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px' }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, letterSpacing: '0.08em' }}>
            <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ZEN</span>
            <span style={{ color: 'var(--text)' }}> KAI</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>Entre. Explore. Evolua.</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2d0a6b, #004d6b)', border: '2px solid rgba(114,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: '#72ffff' }}>V</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="app-input"
            placeholder="Buscar animes, filmes, desenhos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Hero Featured */}
      <div style={{ margin: '0 16px 24px', borderRadius: 18, overflow: 'hidden', position: 'relative', height: 200 }}>
        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${hero.colorA}, ${hero.colorB})`, position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 14 }}>
          <span style={{ background: 'var(--gradient)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: '#070f1e', letterSpacing: '0.08em' }}>
            EM DESTAQUE
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 14px' }}>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>{hero.title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {hero.genre.slice(0, 2).map(g => (
              <span key={g} style={{ fontSize: 10, color: '#72ffff', background: 'rgba(114,255,255,0.12)', border: '1px solid rgba(114,255,255,0.25)', borderRadius: 4, padding: '2px 6px', fontFamily: 'Inter', fontWeight: 500 }}>{g}</span>
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>★ {hero.rating} · {hero.year}</span>
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                style={{ width: i === heroIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === heroIndex ? '#72ffff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick access cards */}
      <div style={{ padding: '0 16px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Mangás', icon: '📖', color: '#1a0a40' },
            { label: 'HQs', icon: '💬', color: '#0a1a40' },
            { label: 'YouTube', icon: '▶', color: '#1a0808' },
          ].map(cat => (
            <div
              key={cat.label}
              className="card card-hover"
              style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer', background: cat.color, border: '1px solid var(--border-faint)' }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{cat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Anime rows */}
      <SectionRow title="Animes em Alta" items={animes.slice(0, 8)} onItem={(item) => onNavigate('detail', { item })} />
      <SectionRow title="Desenhos Clássicos" items={desenhos} onItem={(item) => onNavigate('detail', { item })} />
      <SectionRow title="Filmes Inesquecíveis" items={filmes} onItem={(item) => onNavigate('detail', { item })} />

      {/* XP Banner */}
      <div style={{ margin: '0 16px 32px', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(114,255,255,0.08), rgba(127,255,212,0.08))', border: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          <span className="gradient-text">Marque episódios e ganhe XP!</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Cada temporada completa vale pontos. Suba de rank e desbloqueie itens exclusivos.
        </div>
      </div>
    </div>
  );
}
