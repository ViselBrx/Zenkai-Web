import { useState } from 'react';
import { animes, desenhos, filmes, MediaItem } from '../data/mockData';

type Filter = 'animes' | 'desenhos' | 'filmes' | 'mangas' | 'hqs';

function CoverCard({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const [fav, setFav] = useState(false);
  return (
    <div onClick={onClick} className="card-hover" style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{
        width: '100%',
        paddingBottom: '145%',
        position: 'relative',
        background: `linear-gradient(155deg, ${item.colorA}, ${item.colorB})`,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); setFav(!fav); }}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? '#ffd700' : 'none'} stroke={fav ? '#ffd700' : 'rgba(255,255,255,0.8)'} strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
          <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '5px 7px' }}>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}
              className="line-clamp-2">{item.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#72ffff' }}>★ {item.rating}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{item.year}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailView({ item, onBack }: { item: MediaItem; onBack: () => void }) {
  const [watchedEps, setWatchedEps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'dub' | 'sub'>('dub');
  const isFilme = item.type === 'filme';

  const episodeCount = isFilme ? 1 : Math.min(item.episodes, 24);
  const eps = Array.from({ length: episodeCount }, (_, i) => i + 1);

  const markWatched = (ep: number) => {
    setWatchedEps(prev => {
      const next = new Set(prev);
      next.has(ep) ? next.delete(ep) : next.add(ep);
      return next;
    });
  };

  const xpGained = watchedEps.size * 10;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Hero Banner */}
      <div style={{ position: 'relative', height: 220 }}>
        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, rgba(7,15,30,0.3) 60%, transparent 100%)' }} />
        <button
          onClick={onBack}
          style={{ position: 'absolute', top: 52, left: 16, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#fff', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          Voltar
        </button>
        {item.type === 'anime' && (
          <div style={{ position: 'absolute', top: 52, right: 16 }}>
            <span style={{ background: 'var(--gradient)', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: '#070f1e', letterSpacing: '0.08em' }}>
              ANIME
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px', marginTop: -24 }}>
        {/* Title block */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 26, lineHeight: 1.15, color: '#fff', margin: 0, marginBottom: 8 }}>{item.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {item.genre.map(g => (
              <span key={g} style={{ fontSize: 11, color: '#72ffff', background: 'rgba(114,255,255,0.1)', border: '1px solid rgba(114,255,255,0.2)', borderRadius: 5, padding: '2px 8px' }}>{g}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffd700"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#ffd700' }}>{item.rating}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.year}</span>
            {!isFilme && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.seasons} temp. · {item.episodes} eps</span>}
            {isFilme && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filme</span>}
          </div>
        </div>

        {/* XP earned */}
        {watchedEps.size > 0 && (
          <div style={{ background: 'rgba(114,255,255,0.08)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: '#72ffff' }}>+{xpGained} XP ganhos!</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{watchedEps.size} episódio{watchedEps.size > 1 ? 's' : ''} marcado{watchedEps.size > 1 ? 's' : ''}</div>
            </div>
          </div>
        )}

        {/* Synopsis */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>SINOPSE</div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)', margin: 0, opacity: 0.9 }}>{item.synopsis}</p>
        </div>

        {/* Episodes section */}
        {!isFilme ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 12 }}>Episódios</div>
              {/* Dub/Sub tabs */}
              <div style={{ display: 'flex', gap: 0, background: 'var(--bg2)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
                {(['dub', 'sub'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 8, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, letterSpacing: '0.05em', transition: 'all 0.2s',
                      background: activeTab === tab ? 'var(--gradient)' : 'transparent',
                      color: activeTab === tab ? '#070f1e' : 'var(--text-muted)',
                    }}
                  >
                    {tab === 'dub' ? '🎙 Dublado' : '✏️ Legendado'}
                  </button>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div className="xp-bar-track" style={{ flex: 1, height: 6 }}>
                  <div className="xp-bar-fill" style={{ width: `${(watchedEps.size / episodeCount) * 100}%` }} />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {watchedEps.size}/{episodeCount} assistidos
                </span>
              </div>
              {/* Episode list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eps.map(ep => {
                  const done = watchedEps.has(ep);
                  return (
                    <div
                      key={ep}
                      onClick={() => markWatched(ep)}
                      className="card-hover"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        background: done ? 'rgba(114,255,255,0.08)' : 'var(--bg2)',
                        border: `1px solid ${done ? 'var(--border)' : 'var(--border-faint)'}`,
                        borderRadius: 10, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: done ? 'var(--gradient)' : 'var(--bg3)',
                      }}>
                        {done
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#070f1e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                          : <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>{ep}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: done ? '#72ffff' : 'var(--text)' }}>
                          Episódio {ep}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: done ? '#72ffff' : 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                        {done ? '+10 XP' : ''}
                      </div>
                    </div>
                  );
                })}
                {item.episodes > 24 && (
                  <div style={{ textAlign: 'center', padding: '8px', fontSize: 12, color: 'var(--text-muted)' }}>
                    + {item.episodes - 24} episódios no total
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div
            onClick={() => markWatched(1)}
            className="btn-gradient"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, cursor: 'pointer', marginBottom: 24 }}
          >
            {watchedEps.has(1)
              ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#070f1e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> Marcado como assistido</>
              : <><span>✔</span> Marcar como assistido (+10 XP)</>
            }
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

export default function CatalogScreen() {
  const [filter, setFilter] = useState<Filter>('animes');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);

  if (selected) {
    return <DetailView item={selected} onBack={() => setSelected(null)} />;
  }

  const allItems = filter === 'animes' ? animes : filter === 'desenhos' ? desenhos : filter === 'filmes' ? filmes : [];

  const filtered = allItems.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  const filters: { key: Filter; label: string }[] = [
    { key: 'animes', label: '⛩ Animes' },
    { key: 'desenhos', label: '📺 Desenhos' },
    { key: 'filmes', label: '🎬 Filmes' },
    { key: 'mangas', label: '📖 Mangás' },
    { key: 'hqs', label: '💬 HQs' },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingTop: 52 }}>
      {/* Title */}
      <div style={{ padding: '0 16px 16px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: 0, marginBottom: 2 }}>
          <span className="gradient-text">Catálogo</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Explore sua coleção favorita</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, letterSpacing: '0.03em', transition: 'all 0.2s',
              background: filter === f.key ? 'var(--gradient)' : 'var(--bg2)',
              color: filter === f.key ? '#070f1e' : 'var(--text-muted)',
              boxShadow: filter === f.key ? '0 0 12px rgba(114,255,255,0.25)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="app-input" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, fontSize: 13 }} />
        </div>
      </div>

      {/* Content or empty */}
      {filter === 'mangas' || filter === 'hqs' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{filter === 'mangas' ? '📖' : '💬'}</div>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>
            {filter === 'mangas' ? 'Leitor de Mangás' : 'Leitor de HQs'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Acesse o leitor completo de {filter === 'mangas' ? 'mangás' : 'HQs'} diretamente pelo app. Conteúdo sincronizado com sua conta.
          </p>
          <button className="btn-gradient" style={{ marginTop: 20, padding: '12px 28px', fontSize: 14, borderRadius: 12, fontWeight: 700 }}>
            ABRIR LEITOR →
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: '0 16px', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{filtered.length} títulos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '0 16px' }}>
            {filtered.map(item => (
              <CoverCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontFamily: 'Rajdhani', fontSize: 16, color: 'var(--text-muted)' }}>Nenhum resultado encontrado</div>
            </div>
          )}
          <div style={{ height: 16 }} />
        </>
      )}
    </div>
  );
}
