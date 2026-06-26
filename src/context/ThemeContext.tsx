import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  isLiteMode: boolean;
  toggleLiteMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

// Shared design tokens
const baseTypography = {
  fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
  h2: { fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.01em' },
  h3: { fontWeight: 600, fontSize: '1.75rem' },
  h4: { fontWeight: 600, fontSize: '1.5rem' },
  h5: { fontWeight: 500, fontSize: '1.25rem' },
  h6: { fontWeight: 500, fontSize: '1rem' },
  button: { textTransform: 'none' as const, fontWeight: 600 },
};

function makeTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  // Dark palette: soft dark plum/grey with pastel pink accents to reduce eye strain
  const bg = isDark ? '#1E1A1D' : '#FFF6FA';
  const paper = isDark ? 'rgba(38, 34, 36, 0.85)' : 'rgba(255, 255, 255, 0.8)';
  const cardBg = isDark ? 'rgba(45, 40, 43, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const cardBorder = isDark ? 'rgba(244, 143, 177, 0.15)' : 'rgba(255, 255, 255, 0.5)';
  const dialogBg = isDark ? '#252123' : '#ffffff';
  const drawerBg = isDark ? '#252123' : '#ffffff';
  const menuBg = isDark ? '#2D282A' : '#ffffff';

  return createTheme({
    palette: {
      mode,
      primary: { 
        main: isDark ? '#F48FB1' : '#FF5FA2', 
        light: isDark ? '#F8BBD0' : '#FF8CC6', 
        dark: isDark ? '#C2185B' : '#E04E8E', 
        contrastText: '#ffffff' 
      },
      secondary: { main: '#FFC1DA', light: '#FFE4F0', dark: '#E8A9C1', contrastText: isDark ? '#fff' : '#333' },
      background: { default: bg, paper },
      text: {
        primary: isDark ? '#E8E2E4' : '#333333',
        secondary: isDark ? '#A8A0A3' : '#666666',
      },
    },
    typography: baseTypography,
    shape: { borderRadius: 24 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 30,
            padding: '10px 24px',
            boxShadow: '0 4px 14px 0 rgba(255, 95, 162, 0.25)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            backdropFilter: 'blur(10px)',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              : '0 8px 32px 0 rgba(255, 95, 162, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiMenu: {
        styleOverrides: { paper: { backgroundColor: menuBg } },
      },
      MuiDialog: {
        styleOverrides: { paper: { backgroundColor: dialogBg, backgroundImage: 'none' } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: drawerBg, backgroundImage: 'none', backdropFilter: 'none' } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: isDark ? {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 95, 162, 0.25)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 95, 162, 0.5)',
            },
          } : {},
        },
      },
    },
  });
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('pinkcloud_darkmode') === 'true';
  });
  
  const [isLiteMode, setIsLiteMode] = useState(() => {
    return localStorage.getItem('pinkcloud_litemode') === 'true';
  });

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('pinkcloud_darkmode', String(next));
      return next;
    });
  }, []);

  const toggleLiteMode = useCallback(() => {
    setIsLiteMode(prev => {
      const next = !prev;
      localStorage.setItem('pinkcloud_litemode', String(next));
      return next;
    });
  }, []);

  const theme = useMemo(() => makeTheme(isDark ? 'dark' : 'light'), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isLiteMode, toggleLiteMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
