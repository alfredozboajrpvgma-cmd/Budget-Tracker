import { useState, lazy, Suspense, useEffect } from 'react';
import { Box, SwipeableDrawer, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';
import ViewContainer from './ViewContainer';
import LazyFallback from './LazyFallback';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';
import ReleaseNotesModal from './ReleaseNotesModal';
import { markReleaseSeen, shouldShowReleaseNotes } from '../utils/releaseNotes';

const Onboarding = lazy(() => import('./Onboarding'));
const CloudPet = lazy(() => import('./CloudPet'));
const SkyBackground = lazy(() => import('./SkyBackground'));
const SavingsDialog = lazy(() => import('./SavingsDialog'));
const GoalDetailDialog = lazy(() => import('./GoalDetailDialog'));
const PublicProfileDialog = lazy(() => import('./PublicProfileDialog'));

interface MainLayoutProps {
  needsOnboarding: boolean;
}

const MainLayout = ({ needsOnboarding }: MainLayoutProps) => {
  const [currentView, setCurrentView] = useState('home');
  const [addGoalTrigger, setAddGoalTrigger] = useState(0);
  const [addExpenseTrigger, setAddExpenseTrigger] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const {
    savingsDialogOpen,
    setSavingsDialogOpen,
    savingsGoalId,
    setSavingsGoalId,
    selectedGoal,
    setSelectedGoal,
    completeOnboarding,
    goals,
    joinGoal,
    showToast,
  } = useApp();
  const { isDark } = useThemeMode();

  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);

  useEffect(() => {
    if (!needsOnboarding && shouldShowReleaseNotes()) {
      setReleaseNotesOpen(true);
    }
  }, [needsOnboarding]);

  const handleReleaseNotesClose = () => {
    markReleaseSeen();
    setReleaseNotesOpen(false);
  };

  const hasActiveGoals = goals.some(g => g.progress < 100);

  const handleNavChange = (view: string) => {
    if (view === 'add') {
      setActionMenuOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleAction = (type: 'expense' | 'savings' | 'dream' | 'join') => {
    if ((type === 'expense' || type === 'savings') && !hasActiveGoals) return;
    
    setActionMenuOpen(false);
    if (type === 'dream') {
      setCurrentView('goals');
      setAddGoalTrigger(prev => prev + 1);
    } else if (type === 'expense') {
      setAddExpenseTrigger(prev => prev + 1);
    } else if (type === 'savings') {
      setSavingsGoalId(null);
      setSavingsDialogOpen(true);
    } else if (type === 'join') {
      setJoinDialogOpen(true);
    }
  };

  const handleJoinSubmit = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await joinGoal(joinCode.trim().toUpperCase());
      setJoinDialogOpen(false);
      setJoinCode('');
      setCurrentView('goals');
    } catch (e: any) {
      showToast(e.message || 'Failed to join dream', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (needsOnboarding) {
    return (
      <Suspense fallback={<LazyFallback minHeight="100dvh" />}>
        <Onboarding onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Suspense fallback={null}>
        <SkyBackground />
      </Suspense>
      <Box sx={{ flexShrink: 0, px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', background: isDark ? 'rgba(40,28,58,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: `1px solid rgba(255, 95, 162, ${isDark ? '0.2' : '0.1'})` }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#FF5FA2', display: 'flex', alignItems: 'center', gap: 1, textShadow: '0 2px 10px rgba(255, 95, 162, 0.2)' }}>
          PinkCloud
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', pb: '90px' }}>
        <ViewContainer
          currentView={currentView}
          addGoalTrigger={addGoalTrigger}
          addExpenseTrigger={addExpenseTrigger}
        />
      </Box>
      <BottomNav currentView={currentView} onChange={handleNavChange} actionMenuOpen={actionMenuOpen} />
      <Suspense fallback={null}>
        <CloudPet />
      </Suspense>

      <Suspense fallback={null}>
        <SavingsDialog
          open={savingsDialogOpen}
          onClose={() => { setSavingsDialogOpen(false); setSavingsGoalId(null); }}
          preselectedGoalId={savingsGoalId}
        />
      </Suspense>
      <Suspense fallback={null}>
        <GoalDetailDialog goal={selectedGoal} onClose={() => setSelectedGoal(null)} />
      </Suspense>
      <Suspense fallback={null}>
        <PublicProfileDialog />
      </Suspense>

      <SwipeableDrawer
        anchor="bottom"
        open={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        onOpen={() => setActionMenuOpen(true)}
        allowSwipeInChildren={true}
        disableSwipeToOpen={true}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              p: 3,
              pt: 1.5,
              pb: 5,
              backgroundColor: isDark ? '#2E1F42' : '#ffffff',
            }
          }
        }}
      >
        <Box sx={{ width: 40, height: 5, background: 'rgba(255, 95, 162, 0.2)', borderRadius: 4, mx: 'auto', mb: 4 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 2, pb: 2 }}>
          {([
            { type: 'expense' as const, emoji: '💸', title: 'Log Expense', sub: !hasActiveGoals ? 'Create a dream first' : 'Track your daily spending', grad: isDark ? 'linear-gradient(135deg, rgba(50,30,60,0.5), rgba(40,25,50,0.8))' : 'linear-gradient(135deg, #ffffff, #FFF0F7)', border: isDark ? 'rgba(244,143,177,0.2)' : 'rgba(255, 95, 162, 0.2)', iconBg: isDark ? 'linear-gradient(135deg, #F48FB1, #C2185B)' : 'linear-gradient(135deg, #FFC1DA, #FF5FA2)', subColor: isDark ? '#F8BBD0' : '#D81B60', disabled: !hasActiveGoals },
            { type: 'savings' as const, emoji: '💰', title: 'Add Savings', sub: !hasActiveGoals ? 'Create a dream first' : 'Contribute to a dream', grad: isDark ? 'linear-gradient(135deg, rgba(30,40,60,0.5), rgba(20,30,50,0.8))' : 'linear-gradient(135deg, #ffffff, #F0FBFF)', border: isDark ? 'rgba(144,202,249,0.2)' : 'rgba(66, 165, 245, 0.2)', iconBg: isDark ? 'linear-gradient(135deg, #90CAF9, #1976D2)' : 'linear-gradient(135deg, #90CAF9, #42A5F5)', subColor: isDark ? '#90CAF9' : '#1976D2', disabled: !hasActiveGoals },
            { type: 'dream' as const, emoji: '☁️', title: 'New Dream', sub: 'Start saving for something new', grad: isDark ? 'linear-gradient(135deg, rgba(60,30,70,0.5), rgba(50,20,60,0.8))' : 'linear-gradient(135deg, #ffffff, #F3E5F5)', border: isDark ? 'rgba(206,147,216,0.2)' : 'rgba(171, 71, 188, 0.2)', iconBg: isDark ? 'linear-gradient(135deg, #CE93D8, #7B1FA2)' : 'linear-gradient(135deg, #CE93D8, #AB47BC)', subColor: isDark ? '#CE93D8' : '#7B1FA2', disabled: false },
            { type: 'join' as const, emoji: '🤝', title: 'Join Dream', sub: 'Join a friend using a code', grad: isDark ? 'linear-gradient(135deg, rgba(20,60,50,0.5), rgba(10,40,30,0.8))' : 'linear-gradient(135deg, #ffffff, #E0F2F1)', border: isDark ? 'rgba(128,203,196,0.2)' : 'rgba(38, 166, 154, 0.2)', iconBg: isDark ? 'linear-gradient(135deg, #80CBC4, #00695C)' : 'linear-gradient(135deg, #80CBC4, #26A69A)', subColor: isDark ? '#80CBC4' : '#00695C', disabled: false },
          ]).map((action, i) => (
            <motion.div key={action.type} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * (i + 1) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Box
                onClick={() => handleAction(action.type)}
                role="button"
                tabIndex={0}
                aria-label={action.title}
                onKeyDown={e => e.key === 'Enter' && handleAction(action.type)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 3, p: 2.5,
                  background: action.disabled ? (isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5') : action.grad,
                  borderRadius: '24px',
                  boxShadow: action.disabled ? 'none' : '0 10px 30px rgba(255, 95, 162, 0.12)',
                  border: `2px solid ${action.disabled ? 'transparent' : action.border}`,
                  cursor: action.disabled ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden',
                  opacity: action.disabled ? 0.6 : 1
                }}
              >
                <Box sx={{ width: 48, height: 48, borderRadius: '16px', background: action.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', zIndex: 1 }}>{action.emoji}</Box>
                <Box sx={{ zIndex: 1, textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ color: isDark ? '#F0E6F6' : '#5C4A52', fontWeight: 800 }}>{action.title}</Typography>
                  <Typography variant="body2" sx={{ color: action.subColor, opacity: 0.8, fontWeight: 600 }}>{action.sub}</Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </SwipeableDrawer>

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ color: '#26A69A', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Join Dream <Typography component="span" sx={{ fontSize: '1.5rem' }}>🤝</Typography>
          </Box>
          <IconButton onClick={() => setJoinDialogOpen(false)} size="small" sx={{ color: '#26A69A', backgroundColor: 'rgba(38, 166, 154, 0.1)', '&:hover': { backgroundColor: 'rgba(38, 166, 154, 0.2)' } }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the 6-character dream code to join and save together.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Dream Code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setJoinDialogOpen(false)} sx={{ color: '#aaa', borderRadius: '14px', px: 2 }}>Cancel</Button>
          <Button onClick={handleJoinSubmit} variant="contained" disabled={joining || joinCode.length < 6}
            sx={{ borderRadius: '14px', background: 'linear-gradient(135deg, #26A69A, #80CBC4)', fontWeight: 800, px: 4, py: 1, boxShadow: '0 4px 14px rgba(38,166,154,0.3)', textTransform: 'none', fontSize: '1.05rem' }}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>

      <ReleaseNotesModal open={releaseNotesOpen} onClose={handleReleaseNotesClose} />
    </Box>
  );
};

export default MainLayout;
