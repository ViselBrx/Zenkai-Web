import { useState } from 'react';
import { communityUsers, CommunityUser, chatMessages } from '../data/mockData';

function Avatar({ user, size = 48 }: { user: CommunityUser; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: user.isMe ? '2px solid #72ffff' : '2px solid transparent',
      boxShadow: user.aura === 'cyan' ? '0 0 0 2px rgba(114,255,255,0.4), 0 0 16px rgba(114,255,255,0.25)' : 'none',
      position: 'relative',
    }}>
      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: size * 0.38, color: '#fff' }}>
        {user.username.charAt(0).toUpperCase()}
      </span>
      {user.isOnline && (
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#34d399', border: '2px solid var(--bg2)' }} />
      )}
    </div>
  );
}

function UserCard({ user, onChat }: { user: CommunityUser; onChat: (u: CommunityUser) => void }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
      {/* Banner area */}
      <div style={{
        height: 60, position: 'relative',
        background: user.banner === 'galaxy'
          ? 'linear-gradient(135deg, #0a0015, #200050, #050020)'
          : 'linear-gradient(135deg, var(--bg3), var(--bg2))',
      }}>
        {user.isVip && (
          <div style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: '#ffd700' }}>
            👑 VIP
          </div>
        )}
      </div>
      {/* Avatar */}
      <div style={{ padding: '0 12px', marginTop: -24, marginBottom: 10 }}>
        <Avatar user={user} size={48} />
      </div>
      {/* Info */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 2,
          ...(user.isMe ? { background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : { color: 'var(--text)' })
        }}>
          {user.username} {user.isMe && <span style={{ WebkitTextFillColor: 'var(--text-muted)', background: 'none', fontSize: 11 }}>(Você)</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{user.handle}</div>
        {user.title && (
          <div style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 8, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            {user.title}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{user.followers}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>seguidores</div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 13, color: '#72ffff' }}>
              LVL {user.level > 999 ? '∞' : user.level}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>nível</div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 13, color: '#7fffd4' }}>
              {user.xp > 999999 ? '∞' : user.xp.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>XP</div>
          </div>
        </div>
        {user.isMe ? (
          <button className="btn-outline" style={{ width: '100%', padding: '8px', fontSize: 13 }}>Editar Perfil</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFollowing(!following)}
              style={{
                flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                background: following ? 'var(--border-faint)' : 'var(--gradient)',
                color: following ? 'var(--text-muted)' : '#070f1e',
              }}
            >
              {following ? 'Seguindo ✓' : '+ Seguir'}
            </button>
            <button
              onClick={() => onChat(user)}
              style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#72ffff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatView({ user, onBack }: { user: CommunityUser; onBack: () => void }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(chatMessages);

  const send = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'Visel e Davizera', to: user.username, text: message, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), date: 'Hoje' }]);
    setMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-faint)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#72ffff', padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <Avatar user={user} size={38} />
        <div>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{user.username}</div>
          <div style={{ fontSize: 11, color: user.isOnline ? '#34d399' : 'var(--text-muted)' }}>
            {user.isOnline ? '● Online' : 'Offline'}
          </div>
        </div>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map(msg => {
          const isMine = msg.from === 'Visel e Davizera';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{
                maxWidth: '75%', padding: '9px 12px', borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isMine ? 'linear-gradient(135deg, rgba(114,255,255,0.2), rgba(127,255,212,0.15))' : 'var(--bg2)',
                border: `1px solid ${isMine ? 'var(--border)' : 'var(--border-faint)'}`,
              }}>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{msg.text}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{msg.time}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Input */}
      <div style={{ padding: '10px 16px 20px', borderTop: '1px solid var(--border-faint)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="app-input"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, fontSize: 14 }}
        />
        <button
          onClick={send}
          style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: message.trim() ? 'var(--gradient)' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={message.trim() ? '#070f1e' : 'var(--text-muted)'} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function CommunityScreen() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recentes' | 'nivel' | 'xp'>('recentes');
  const [chatWith, setChatWith] = useState<CommunityUser | null>(null);

  if (chatWith) return <ChatView user={chatWith} onBack={() => setChatWith(null)} />;

  const filtered = communityUsers.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.handle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingTop: 52 }}>
      {/* Hero */}
      <div style={{ padding: '0 16px 0', marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border-faint)', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, margin: '0 0 6px', letterSpacing: '0.04em' }}>
            <span className="gradient-text">NOSSA COMUNIDADE</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Conecte-se com maratonistas e suba no ranking
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 24, color: '#72ffff' }}>
                {communityUsers.length}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Membros</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-faint)' }} />
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 24, color: '#34d399' }}>
                {communityUsers.filter(u => u.isOnline).length}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Online Agora</div>
            </div>
          </div>
        </div>

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="app-input" placeholder="Pesquisar maratonistas..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border-faint)', borderRadius: 10, color: 'var(--text)', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 12, padding: '0 10px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="recentes">Recentes</option>
            <option value="nivel">Por Nível</option>
            <option value="xp">Por XP</option>
          </select>
        </div>
      </div>

      {/* User cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {filtered.map(user => (
          <UserCard key={user.id} user={user} onChat={setChatWith} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontSize: 16 }}>
          Nenhum usuário encontrado
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
