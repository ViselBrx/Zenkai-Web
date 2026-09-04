import { useState } from 'react';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import CatalogScreen from './screens/CatalogScreen';
import ShopScreen from './screens/ShopScreen';
import CommunityScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import { MediaItem } from './data/mockData';

type Screen = 'home' | 'catalog' | 'shop' | 'community' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [catalogItem, setCatalogItem] = useState<MediaItem | null>(null);

  const handleNavigate = (target: string, params?: Record<string, unknown>) => {
    if (target === 'detail' && params?.item) {
      setCatalogItem(params.item as MediaItem);
      setScreen('catalog');
    } else {
      setScreen(target as Screen);
    }
  };

  const handleScreenChange = (s: Screen) => {
    setScreen(s);
    if (s !== 'catalog') setCatalogItem(null);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'catalog':
        return <CatalogScreen />;
      case 'shop':
        return <ShopScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  };

  return (
    <div style={{ height: '100dvh', background: '#040a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="app-shell">
        <div className="screen-content">
          {renderScreen()}
        </div>
        <BottomNav active={screen} onChange={handleScreenChange} />
      </div>
    </div>
  );
}
