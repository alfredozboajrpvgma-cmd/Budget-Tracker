import { lazy, Suspense } from 'react';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ThemeModeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { PwaUpdateProvider } from './context/PwaUpdateContext';
import LazyFallback from './components/LazyFallback';
import AdBlockDetector from './components/AdBlockDetector';

const AuthScreen = lazy(() => import('./components/AuthScreen'));
const MainLayout = lazy(() => import('./components/MainLayout'));

function AppContent() {
  const { isAuthenticated, needsOnboarding, loading } = useApp();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LazyFallback minHeight="100dvh" />}>
        <AuthScreen />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LazyFallback minHeight="100dvh" />}>
      <MainLayout needsOnboarding={needsOnboarding} />
    </Suspense>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <CssBaseline />
      <PwaUpdateProvider>
        <CurrencyProvider>
          <AppProvider>
            <AdBlockDetector />
            <AppContent />
          </AppProvider>
        </CurrencyProvider>
      </PwaUpdateProvider>
    </ThemeModeProvider>
  );
}

export default App;
