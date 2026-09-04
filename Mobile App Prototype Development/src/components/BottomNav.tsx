type Screen = 'home' | 'catalog' | 'shop' | 'community' | 'profile';

interface Props {
  active: Screen;
  onChange: (s: Screen) => void;
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      fill={active ? 'url(#ng)' : 'none'}
      stroke={active ? 'url(#ng)' : '#6a89a7'}
      strokeWidth="1.8" strokeLinejoin="round" />
    <defs><linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#72ffff"/><stop offset="100%" stopColor="#7fffd4"/>
    </linearGradient></defs>
  </svg>
);

const CatalogIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? 'url(#cg)' : 'none'} stroke={active ? 'url(#cg)' : '#6a89a7'} strokeWidth="1.8"/>
    <rect x="13" y="3" width="8" height="8" rx="2" fill={active ? 'url(#cg)' : 'none'} stroke={active ? 'url(#cg)' : '#6a89a7'} strokeWidth="1.8"/>
    <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? 'url(#cg)' : 'none'} stroke={active ? 'url(#cg)' : '#6a89a7'} strokeWidth="1.8"/>
    <rect x="13" y="13" width="8" height="8" rx="2" fill={active ? 'url(#cg)' : 'none'} stroke={active ? 'url(#cg)' : '#6a89a7'} strokeWidth="1.8"/>
    <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#72ffff"/><stop offset="100%" stopColor="#7fffd4"/>
    </linearGradient></defs>
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6V20A2 2 0 005 22H19A2 2 0 0021 20V6L18 2Z" fill={active ? 'url(#sg)' : 'none'} stroke={active ? 'url(#sg)' : '#6a89a7'} strokeWidth="1.8" strokeLinejoin="round"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#72ffff' : '#6a89a7'} strokeWidth="1.8"/>
    <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke={active ? '#7fffd4' : '#6a89a7'} strokeWidth="1.8" strokeLinecap="round"/>
    <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#72ffff"/><stop offset="100%" stopColor="#7fffd4"/>
    </linearGradient></defs>
  </svg>
);

const CommunityIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" fill={active ? 'url(#comg)' : 'none'} stroke={active ? 'url(#comg)' : '#6a89a7'} strokeWidth="1.8"/>
    <path d="M3 21V19A4 4 0 0111 19V21" stroke={active ? '#72ffff' : '#6a89a7'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 3.13A4 4 0 0116 11" stroke={active ? '#7fffd4' : '#6a89a7'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M21 21V19A4 4 0 0013 19" stroke={active ? '#7fffd4' : '#6a89a7'} strokeWidth="1.8" strokeLinecap="round"/>
    <defs><linearGradient id="comg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#72ffff"/><stop offset="100%" stopColor="#7fffd4"/>
    </linearGradient></defs>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={active ? 'url(#pg)' : 'none'} stroke={active ? 'url(#pg)' : '#6a89a7'} strokeWidth="1.8"/>
    <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={active ? '#72ffff' : '#6a89a7'} strokeWidth="1.8" strokeLinecap="round"/>
    <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#72ffff"/><stop offset="100%" stopColor="#7fffd4"/>
    </linearGradient></defs>
  </svg>
);

const tabs: { key: Screen; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { key: 'home', label: 'Início', Icon: HomeIcon },
  { key: 'catalog', label: 'Catálogo', Icon: CatalogIcon },
  { key: 'shop', label: 'Loja', Icon: ShopIcon },
  { key: 'community', label: 'Comunidade', Icon: CommunityIcon },
  { key: 'profile', label: 'Perfil', Icon: ProfileIcon },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`nav-item${active === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
          style={{ background: 'none', border: 'none', outline: 'none' }}
        >
          <Icon active={active === key} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
