import { Box, ButtonBase } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useThemeMode } from '../context/ThemeContext';

interface BottomNavProps {
  currentView: string;
  onChange: (view: string) => void;
  actionMenuOpen?: boolean;
}

const NAV_ITEMS = [
  { label: 'Home', value: 'home', icon: <HomeRoundedIcon /> },
  { label: 'Goals', value: 'goals', icon: <TerrainRoundedIcon /> },
  { label: 'Insights', value: 'analytics', icon: <InsertChartRoundedIcon /> },
  { label: 'Profile', value: 'profile', icon: <PersonRoundedIcon /> },
];

const BottomNav = ({ currentView, onChange, actionMenuOpen }: BottomNavProps) => {
  const { isDark } = useThemeMode();
  const navFill = isDark ? 'rgba(40, 28, 58, 0.95)' : 'rgba(255,255,255,0.95)';
  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
      {/* SVG Notch Background */}
      <Box sx={{ position: 'relative', height: 80 }}>
        <svg
          viewBox="0 0 390 80"
          width="100%"
          height="80"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <filter id="nav-shadow">
              <feDropShadow dx="0" dy="-4" stdDeviation="8" floodColor="rgba(255,95,162,0.12)" />
            </filter>
          </defs>
          <path
            d="M0,0 L155,0 Q175,0 178,10 A22,22 0 0,0 212,10 Q215,0 235,0 L390,0 L390,80 L0,80 Z"
            fill={navFill}
            filter="url(#nav-shadow)"
          />
        </svg>

        {/* Nav Items Row */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Left two items */}
          {NAV_ITEMS.slice(0, 2).map(item => (
            <ButtonBase
              key={item.value}
              onClick={() => onChange(item.value)}
              sx={{
                flex: 1,
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.4,
                py: 1,
                color: currentView === item.value ? '#FF5FA2' : (isDark ? '#8B6FA0' : '#F06292'),
                transition: 'color 0.2s',
                borderRadius: 2,
              }}
            >
              <Box sx={{ fontSize: 24 }}>{item.icon}</Box>
              <Box sx={{ fontSize: '10px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{item.label}</Box>
            </ButtonBase>
          ))}

          {/* Center spacer for FAB notch */}
          <Box sx={{ width: 80 }} />

          {/* Right two items */}
          {NAV_ITEMS.slice(2).map(item => (
            <ButtonBase
              key={item.value}
              onClick={() => onChange(item.value)}
              sx={{
                flex: 1,
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.4,
                py: 1,
                color: currentView === item.value ? '#FF5FA2' : (isDark ? '#8B6FA0' : '#F06292'),
                transition: 'color 0.2s',
                borderRadius: 2,
              }}
            >
              <Box sx={{ fontSize: 24 }}>{item.icon}</Box>
              <Box sx={{ fontSize: '10px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{item.label}</Box>
            </ButtonBase>
          ))}
        </Box>

        {/* Floating Center FAB — fluid with the navbar */}
        <ButtonBase
          onClick={() => onChange('add')}
          aria-label="Add expense, savings, or dream"
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: actionMenuOpen ? 'translateX(-50%) scale(1.1) rotate(45deg)' : 'translateX(-50%)',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF5FA2 0%, #FF8CC6 100%)',
            boxShadow: actionMenuOpen ? '0 8px 28px rgba(255, 95, 162, 0.6)' : '0 6px 20px rgba(255, 95, 162, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 20,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateX(-50%) scale(1.08)',
              boxShadow: '0 8px 28px rgba(255, 95, 162, 0.55)',
            },
            '&:active': {
              transform: 'translateX(-50%) scale(0.95)',
            }
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 26 }} />
        </ButtonBase>
      </Box>
    </Box>
  );
};

export default BottomNav;
