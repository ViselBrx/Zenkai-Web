import { useState } from 'react';
import { shopItems, ShopItem, ShopCategory, Currency } from '../data/mockData';

const BALANCE = { ouro: 1840, diamante: 3, esmeralda: 2 };

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  banners: '🖼 Banners',
  auras: '✨ Auras',
  titulos: '🏷 Títulos',
  temas: '🎨 Temas',
  cursores: '🖱 Cursores',
  exclusivos: '💎 Exclusivos',
};

const CURRENCY_ICON: Record<Currency, string> = {
  ouro: '🟡',
  diamante: '🔷',
  esmeralda: '🟢',
};

const RARITY_COLOR: Record<string, string> = {
  comum: '#9ca3af',
  raro: '#60a5fa',
  épico: '#a78bfa',
  lendário: '#fbbf24',
};

function ItemCard({ item, onBuy }: { item: ShopItem; onBuy: (item: ShopItem) => void }) {
  return (
    <div
      className="card-hover"
      style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--border-faint)', cursor: 'pointer' }}
      onClick={() => !item.owned && onBuy(item)}
    >
      {/* Cover gradient */}
      <div style={{ height: 90, background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: RARITY_COLOR[item.rarity], background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {item.rarity}
          </span>
        </div>
        {item.owned && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: '#072', background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 4, padding: '2px 6px' }}>
              ✓ Possuído
            </span>
          </div>
        )}
        {item.equipped && (
          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
            <span style={{ fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700, color: '#72ffff', background: 'rgba(114,255,255,0.15)', border: '1px solid rgba(114,255,255,0.3)', borderRadius: 4, padding: '2px 6px' }}>
              EQUIPADO
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.2, marginBottom: 6 }}>{item.name}</div>
        {item.owned ? (
          <button
            style={{ width: '100%', padding: '6px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 12, color: item.equipped ? '#34d399' : '#72ffff', letterSpacing: '0.04em' }}
          >
            {item.equipped ? '✓ Equipado' : 'Equipar'}
          </button>
        ) : (
          <button
            className="btn-gradient"
            style={{ width: '100%', padding: '6px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            {CURRENCY_ICON[item.currency]} {item.price.toLocaleString('pt-BR')}
          </button>
        )}
      </div>
    </div>
  );
}

function BottomSheet({ item, onClose, onConfirm }: { item: ShopItem; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          {/* Preview */}
          <div style={{ width: 80, height: 80, borderRadius: 12, background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: RARITY_COLOR[item.rarity], letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{item.rarity}</div>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: 'var(--text)', lineHeight: 1.2, marginBottom: 6 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</div>
          </div>
        </div>

        {/* Price info */}
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Preço</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {CURRENCY_ICON[item.currency]} {item.price.toLocaleString('pt-BR')}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter' }}>{item.currency}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Seu saldo</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 16, color: '#72ffff' }}>
              {CURRENCY_ICON[item.currency]} {BALANCE[item.currency].toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '13px', fontSize: 14 }}>Cancelar</button>
          <button onClick={onConfirm} className="btn-gradient" style={{ flex: 2, padding: '13px', fontSize: 14, fontWeight: 700 }}>
            CONFIRMAR COMPRA
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopScreen() {
  const [category, setCategory] = useState<ShopCategory>('banners');
  const [purchasing, setPurchasing] = useState<ShopItem | null>(null);
  const [purchased, setPurchased] = useState<Set<number>>(new Set(shopItems.filter(i => i.owned).map(i => i.id)));
  const [toast, setToast] = useState('');

  const categories = Object.keys(CATEGORY_LABELS) as ShopCategory[];
  const items = shopItems.filter(i => i.category === category);

  const handleConfirm = () => {
    if (!purchasing) return;
    setPurchased(prev => new Set([...prev, purchasing.id]));
    setToast(`"${purchasing.name}" adquirido! ✨`);
    setPurchasing(null);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingTop: 52 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(114,255,255,0.15)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, fontFamily: 'Rajdhani', fontWeight: 600,
          color: '#72ffff', zIndex: 300, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0 16px 16px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: 0, marginBottom: 2 }}>
          <span className="gradient-text">Loja</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Personalize seu perfil</p>
      </div>

      {/* Balance bar */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        {(Object.entries(BALANCE) as [Currency, number][]).map(([cur, val]) => (
          <div key={cur} style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-faint)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{CURRENCY_ICON[cur]}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 13, color: cur === 'ouro' ? '#ffd700' : cur === 'diamante' ? '#a78bfa' : '#34d399' }}>
              {val.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cur}</div>
          </div>
        ))}
      </div>

      {/* XP conversion */}
      <div style={{ margin: '0 16px 16px', padding: '12px 14px', background: 'rgba(114,255,255,0.05)', border: '1px solid var(--border-faint)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Converter XP</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#72ffff' }}>100 XP → 1 Ouro · 250 XP → 1 Diamante</div>
        </div>
        <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>Converter</button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
              background: category === cat ? 'var(--gradient)' : 'var(--bg2)',
              color: category === cat ? '#070f1e' : 'var(--text-muted)',
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={{ ...item, owned: purchased.has(item.id) }}
            onBuy={setPurchasing}
          />
        ))}
      </div>

      {/* Purchase sheet */}
      {purchasing && (
        <BottomSheet
          item={purchasing}
          onClose={() => setPurchasing(null)}
          onConfirm={handleConfirm}
        />
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
