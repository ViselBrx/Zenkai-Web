import { useState } from 'react';
import { shopItems } from '../data/mockData';

const ME = {
  username: 'Visel e Davizera',
  handle: '@viseldavizera_',
  level: 9999,
  xp: 199999999946,
  xpToNext: 200000000000,
  followers: 4,
  following: 2,
  rank: 'Imortal',
  equippedBanner: 'galaxy',
  equippedAura: 'cyan',
  equippedTitle: 'Mestre das Listas',
  avatarColor: '#2d0a6b',
  isVip: true,
  totalAnimes: 34,
  totalEps: 3494,
  watchedEps: 0,
};

const RANK_INFO = [
  { name: 'Bronze', color: '#cd7f32', xp: 0 },
  { name: 'Prata', color: '#c0c0c0', xp: 500 },
  { name: 'Ouro', color: '#ffd700', xp: 2000 },
  { name: 'Diamante', color: '#a78bfa', xp: 10000 },
  { name: 'Lendário', color: '#fbbf24', xp: 50000 },
  { name: 'Imortal', color: '#72ffff', xp: 999999 },
];

type Tab = 'geral' | 'inventario' | 'conquistas';

const myItems = shopItems.filter(i => i.owned || i.equipped);

const conquistas = [
  { id: 1, name: 'Primeiro Login', desc: 'Bem-vindo à Zenkai!', icon: '🌟', done: true },
  { id: 2, name: 'Maratonista', desc: 'Assista 10 episódios', icon: '▶', done: false },
  { id: 3, name: 'Colecionador', desc: 'Compre 5 itens na loja', icon: '🛍', done: false },
  { id: 4, name: 'Social', desc: 'Siga 3 usuários', icon: '👥', done: false },
  { id: 5, name: 'Imortal', desc: 'Atinja nível 9999', icon: '♾', done: true },
  { id: 6, name: 'VIP', desc: 'Destaque-se na comunidade', icon: '👑', done: true },
];

export default function ProfileScreen() {
  const [tab, setTab] = useState<Tab>('geral');
  const [editing, setEditing] = useState(false);

  const xpProgress = ((ME.xp % 100) / 100) * 100;
  const rankInfo = RANK_INFO.find(r => r.name === ME.rank) || RANK_INFO[0];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Banner */}
      <div style={{ height: 130, position: 'relative', background: 'linear-gradient(135deg, #0a0015, #200050, #050020)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, var(--bg) 100%)' }} />
        {/* Galaxy stars effect */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            borderRadius: '50%',
            background: '#fff',
            opacity: Math.random() * 0.7 + 0.3,
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 23 + 7) % 80}%`,
          }} />
        ))}
        {ME.isVip && (
          <div style={{ position: 'absolute', top: 52, right: 16, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 700, color: '#ffd700' }}>
            👑 VIP
          </div>
        )}
      </div>

      {/* Avatar + info */}
      <div style={{ padding: '0 16px', marginTop: -50, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
          {/* Avatar with aura */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${ME.avatarColor}, ${ME.avatarColor}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(114,255,255,0.6)',
            boxShadow: '0 0 0 4px rgba(114,255,255,0.2), 0 0 24px rgba(114,255,255,0.25), 0 0 48px rgba(114,255,255,0.1)',
          }}>
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 32, color: '#fff' }}>V</span>
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, lineHeight: 1.2, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {ME.username}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ME.handle}</div>
            {ME.equippedTitle && (
              <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 5, padding: '2px 8px', fontFamily: 'Rajdhani', fontWeight: 600 }}>
                {ME.equippedTitle}
              </div>
            )}
          </div>
        </div>

        {/* Level + XP */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                LVL <span style={{ color: rankInfo.color }}>{ME.level.toLocaleString('pt-BR')}</span>
              </span>
              <span style={{ fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: rankInfo.color, background: `${rankInfo.color}22`, border: `1px solid ${rankInfo.color}44`, borderRadius: 5, padding: '1px 6px' }}>
                {ME.rank}
              </span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
              ★ {ME.xp.toLocaleString('pt-BR')} XP
            </span>
          </div>
          <div className="xp-bar-track" style={{ height: 8 }}>
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
            ∞ XP para o próximo nível
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Seguidores', value: ME.followers },
            { label: 'Seguindo', value: ME.following },
            { label: 'Animes', value: ME.totalAnimes },
            { label: 'Episódios', value: ME.totalEps.toLocaleString('pt-BR') },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg2)', borderRadius: 10, padding: '10px 4px', border: '1px solid var(--border-faint)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit button */}
        <button
          onClick={() => setEditing(!editing)}
          className="btn-outline"
          style={{ width: '100%', padding: '11px', fontSize: 14, marginBottom: 20 }}
        >
          ✏️ Editar Perfil
        </button>

        {/* Edit panel */}
        {editing && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>Editar Perfil</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em' }}>NOME DE EXIBIÇÃO</label>
              <input className="app-input" defaultValue={ME.username} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em' }}>USUÁRIO</label>
              <input className="app-input" defaultValue={ME.handle} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)} className="btn-outline" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Cancelar</button>
              <button onClick={() => setEditing(false)} className="btn-gradient" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Salvar</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {(['geral', 'inventario', 'conquistas'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', borderRadius: 10,
                fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', transition: 'all 0.2s',
                background: tab === t ? 'var(--gradient)' : 'transparent',
                color: tab === t ? '#070f1e' : 'var(--text-muted)',
              }}
            >
              {t === 'geral' ? 'Geral' : t === 'inventario' ? 'Inventário' : 'Conquistas'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'geral' && (
          <div>
            {/* Equipped items */}
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>Itens Equipados</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Aura', value: 'Neon Cyan', color: '#72ffff' },
                { label: 'Título', value: 'Mestre das Listas', color: '#a78bfa' },
                { label: 'Banner', value: 'Galáxia Neon', color: '#7b4fff' },
              ].map(it => (
                <div key={it.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border-faint)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{it.label}</div>
                    <div style={{ fontSize: 14, fontFamily: 'Rajdhani', fontWeight: 600, color: it.color }}>{it.value}</div>
                  </div>
                  <span style={{ fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 4, padding: '2px 7px' }}>✓ EQUIPADO</span>
                </div>
              ))}
            </div>
            {/* Rank progress */}
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>Ranking</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {RANK_INFO.map((r, i) => (
                <div key={r.name} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 6, borderRadius: 3, background: i <= RANK_INFO.indexOf(rankInfo) ? r.color : 'var(--bg3)', marginBottom: 4, transition: 'all 0.3s' }} />
                  <div style={{ fontSize: 8, color: i <= RANK_INFO.indexOf(rankInfo) ? r.color : 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inventario' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {myItems.length} item{myItems.length !== 1 ? 's' : ''} no inventário
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border-faint)', borderRadius: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.category} · {item.rarity}</div>
                  </div>
                  <button style={{
                    padding: '5px 12px', borderRadius: 8, border: item.equipped ? '1px solid rgba(52,211,153,0.4)' : '1px solid var(--border)',
                    background: item.equipped ? 'rgba(52,211,153,0.1)' : 'transparent', cursor: 'pointer',
                    fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 12,
                    color: item.equipped ? '#34d399' : '#72ffff',
                  }}>
                    {item.equipped ? '✓ Equipado' : 'Equipar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'conquistas' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {conquistas.filter(c => c.done).length}/{conquistas.length} conquistadas
            </div>
            <div className="xp-bar-track" style={{ height: 6, marginBottom: 16 }}>
              <div className="xp-bar-fill" style={{ width: `${(conquistas.filter(c => c.done).length / conquistas.length) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conquistas.map(c => (
                <div key={c.id} style={{
                  display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px',
                  background: c.done ? 'rgba(114,255,255,0.06)' : 'var(--bg2)',
                  border: `1px solid ${c.done ? 'var(--border)' : 'var(--border-faint)'}`,
                  borderRadius: 12, opacity: c.done ? 1 : 0.6,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.done ? 'rgba(114,255,255,0.12)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: c.done ? '#72ffff' : 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                  </div>
                  {c.done && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#72ffff" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
