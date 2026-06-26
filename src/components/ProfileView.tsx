import { useState } from 'react';
import { Box, Typography, Card, Grid, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Switch, MenuItem, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';
import { useApp } from '../context/AppContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';
import { requestNotificationPermission, sendNotification, setNotificationsEnabled, areNotificationsEnabled, NOTIFICATIONS_ENABLED_KEY } from '../utils/notifications';
import { registerPushSubscription, unregisterPushSubscription, pingActivity } from '../utils/pushSubscription';
import { xpForLevel } from '../utils/xp';
import { getVibeLabel, getVibeMessage } from '../utils/vibe';
import { submitSupportQuestion } from '../utils/netlifyForms';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { usePwaUpdateContext } from '../context/PwaUpdateContext';
import { APP_VERSION, APP_BUILD_TIME, formatBuildDate } from '../utils/version';

const FAQS = [
  { q: 'How do I add a new expense?', a: 'Tap the + button in the center of the bottom nav to log an expense.' },
  { q: 'How do I save toward a goal?', a: 'Tap + then "Add Savings" and choose a dream to contribute to.' },
  { q: 'How does the Sunshine Score work?', a: 'It reflects your saving habits and spending — save more, spend wisely, score higher!' },
  { q: 'How do I join a shared dream?', a: 'Tap + then "Join Dream" and enter your friend\'s 6-character dream code.' },
  { q: 'How do I change my currency?', a: 'Open Settings from your profile, then pick your currency from the dropdown.' },
];
const ProfileView = () => {
  const { user, stats, logout, showToast } = useApp();
  const { currency, setCurrency, fmt } = useCurrency();
  const { isDark, toggleTheme } = useThemeMode();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (stored === 'false') return false;
    return 'Notification' in window && Notification.permission === 'granted';
  });
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [supportQuestion, setSupportQuestion] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const { canInstall, isInstalled, install, showIosHint } = usePwaInstall();
  const { needRefresh, applyUpdate } = usePwaUpdateContext();
  const [isInstalling, setIsInstalling] = useState(false);

  const installSecondary = isInstalled
    ? 'Already installed'
    : showIosHint
      ? 'Tap Share, then "Add to Home Screen"'
      : canInstall
        ? 'Add PinkCloud to your home screen'
        : 'Use Install app in your browser menu';

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (canInstall) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (accepted) showToast('PinkCloud installed! ☁️', 'success');
      } catch {
        showToast('Could not install the app.', 'error');
      } finally {
        setIsInstalling(false);
      }
      return;
    }
    if (showIosHint) {
      showToast('Tap Share, then "Add to Home Screen"', 'info');
      return;
    }
    showToast('Open your browser menu and choose Install app', 'info');
  };

  const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user?.avatarSeed ?? 'Felix'}&backgroundColor=FFC1DA`;

  const displayName = user?.name || 'Dreamer';

  if (settingsOpen) {
    if (activeSubView === 'Help & Support') {
      const accordionSx = {
        mb: 1.5,
        borderRadius: '16px !important',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        boxShadow: 'none',
        border: isDark ? '1px solid rgba(244, 143, 177, 0.15)' : '1px solid rgba(255, 95, 162, 0.12)',
      };

      return (
        <Box sx={{ p: 3, pt: 5, pb: 12, textAlign: 'left' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => { setActiveSubView(null); setSupportQuestion(''); setExpandedFaq(false); }} aria-label="Back">
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>Help & Support</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#E8E2E4' : '#5C4A52' }}>
            Frequently asked questions
          </Typography>

          {FAQS.map((faq, i) => (
            <Accordion
              key={faq.q}
              expanded={expandedFaq === `faq-${i}`}
              onChange={(_, expanded) => setExpandedFaq(expanded ? `faq-${i}` : false)}
              disableGutters
              elevation={0}
              sx={accordionSx}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#FF5FA2' }} />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}

          <Accordion
            expanded={expandedFaq === 'ask'}
            onChange={(_, expanded) => setExpandedFaq(expanded ? 'ask' : false)}
            disableGutters
            elevation={0}
            sx={{ ...accordionSx, mt: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#FF5FA2' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ask a question</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Can't find what you're looking for? Send us your question below.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Type your question here..."
                value={supportQuestion}
                onChange={e => setSupportQuestion(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <Button
                variant="contained"
                disabled={!supportQuestion.trim() || submittingQuestion}
                onClick={async () => {
                  setSubmittingQuestion(true);
                  try {
                    await submitSupportQuestion({
                      name: user?.name || 'PinkCloud user',
                      email: user?.email || '',
                      question: supportQuestion.trim(),
                    });
                    showToast('Thanks! Your question has been submitted. ☁️', 'success');
                    setSupportQuestion('');
                    setExpandedFaq(false);
                  } catch {
                    showToast('Could not send your question. Please try again later.', 'error');
                  } finally {
                    setSubmittingQuestion(false);
                  }
                }}
                sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
              >
                {submittingQuestion ? 'Sending...' : 'Submit question'}
              </Button>
            </AccordionDetails>
          </Accordion>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3, pt: 5, pb: 12, textAlign: 'left' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => { setSettingsOpen(false); setActiveSubView(null); }} aria-label="Back"><ArrowBackRoundedIcon /></IconButton>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 800 }}>Settings</Typography>
        </Box>
        <List disablePadding>
          <ListItem disablePadding secondaryAction={
            isPushLoading ? (
              <Box sx={{ pr: 2, display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#FF5FA2' }} />
              </Box>
            ) : (
              <Switch checked={notificationsEnabled} onChange={async (e) => {
                const checked = e.target.checked;
                setIsPushLoading(true);
                try {
                  if (checked) {
                    const granted = await requestNotificationPermission();
                    if (!granted) {
                      setNotificationsEnabledState(false);
                      setNotificationsEnabled(false);
                      setIsPushLoading(false);
                      return;
                    }
                    await registerPushSubscription();
                    setNotificationsEnabledState(true);
                    setNotificationsEnabled(true);
                    await pingActivity('active', true);
                    sendNotification('Notifications Enabled! 🔔', {
                      body: 'PinkCloud will send browser alerts even when the tab is closed.',
                    });
                  } else {
                    setNotificationsEnabledState(false);
                    setNotificationsEnabled(false);
                    await pingActivity('active', false);
                    await unregisterPushSubscription();
                  }
                } catch (err) {
                  setNotificationsEnabledState(false);
                  setNotificationsEnabled(false);
                  console.error(err);
                } finally {
                  setIsPushLoading(false);
                }
              }} />
            )
          }>
            <ListItemButton sx={{ py: 2, borderRadius: '12px' }}>
              <ListItemIcon><NotificationsRoundedIcon sx={{ color: '#FF5FA2' }} /></ListItemIcon>
              <ListItemText
                primary="Notifications"
                secondary={notificationsEnabled && areNotificationsEnabled() ? 'On — server push (tab can be closed)' : 'Off'}
              />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding secondaryAction={<Switch checked={isDark} onChange={toggleTheme} />}>
            <ListItemButton sx={{ py: 2, borderRadius: '12px' }}>
              <ListItemIcon><SettingsRoundedIcon sx={{ color: '#7C4DFF' }} /></ListItemIcon>
              <ListItemText primary="Dark Mode" secondary={isDark ? 'On' : 'Off'} />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton sx={{ py: 2, borderRadius: '12px' }}>
              <ListItemIcon><CurrencyExchangeRoundedIcon sx={{ color: '#42A5F5' }} /></ListItemIcon>
              <ListItemText primary="Currency" />
              <TextField
                select
                size="small"
                value={currency.code}
                onChange={e => {
                  const found = CURRENCIES.find(c => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                {CURRENCIES.map(c => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </MenuItem>
                ))}
              </TextField>
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem
            disablePadding
            secondaryAction={
              canInstall && !isInstalled ? (
                isInstalling ? (
                  <CircularProgress size={24} sx={{ color: '#FF5FA2', mr: 2 }} />
                ) : (
                  <ChevronRightRoundedIcon />
                )
              ) : undefined
            }
          >
            <ListItemButton
              disabled={isInstalled || isInstalling}
              onClick={handleInstallClick}
              sx={{ py: 2, borderRadius: '12px' }}
            >
              <ListItemIcon><InstallMobileRoundedIcon sx={{ color: '#FF5FA2' }} /></ListItemIcon>
              <ListItemText primary="Install App" secondary={installSecondary} />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding secondaryAction={<ChevronRightRoundedIcon />}>
            <ListItemButton onClick={() => setActiveSubView('Help & Support')} sx={{ py: 2, borderRadius: '12px' }}>
              <ListItemIcon><HelpOutlineRoundedIcon sx={{ color: '#FFD54F' }} /></ListItemIcon>
              <ListItemText primary="Help & Support" />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton onClick={() => setLogoutDialogOpen(true)} sx={{ py: 2, borderRadius: '12px' }}>
              <ListItemIcon><ExitToAppRoundedIcon sx={{ color: '#FF8A65' }} /></ListItemIcon>
              <ListItemText primary="Log Out" slotProps={{ primary: { sx: { color: '#FF8A65', fontWeight: 600 } } }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Box sx={{ textAlign: 'center', mt: 3, px: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            PinkCloud v{APP_VERSION}
            {APP_BUILD_TIME ? ` · ${formatBuildDate(APP_BUILD_TIME)}` : ''}
          </Typography>
          {needRefresh && (
            <Button
              size="small"
              onClick={applyUpdate}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
            >
              Update available — tap to refresh
            </Button>
          )}
        </Box>
        <Dialog 
          open={logoutDialogOpen} 
          onClose={() => setLogoutDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', pb: 1 }}>
            Log Out
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1.05rem', color: 'text.primary', fontWeight: 500 }}>
              Are you sure you want to log out?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, px: 2 }}>
              Cancel
            </Button>
            <Button 
              onClick={() => { setLogoutDialogOpen(false); logout(); }} 
              color="error" 
              variant="contained"
              disableElevation
              sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
            >
              Log Out
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pt: 5, position: 'relative', textAlign: 'center' }}>
      <IconButton onClick={() => setSettingsOpen(true)} aria-label="Settings"
        sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.5)' }}
      >
        <SettingsRoundedIcon />
      </IconButton>

      <Avatar src={avatarUrl} sx={{ width: 100, height: 100, border: '4px solid #FF5FA2', mx: 'auto', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFF' : '#333', wordBreak: 'break-word', px: 1 }}>{displayName}</Typography>
      <Typography variant="subtitle2" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', fontWeight: 600 }}>
        Level {stats?.level ?? 1}: {stats?.levelTitle ?? 'Cloud Builder'}
      </Typography>
      <Typography variant="caption" sx={{ color: isDark ? '#FFFFFF' : '#AB47BC', fontWeight: 700 }}>
        {stats?.xp ?? 0} / {stats?.xpNeeded ?? xpForLevel(stats?.level ?? 1)} XP
      </Typography>
      <LinearProgressBar value={stats?.xpProgressPercent ?? 0} isDark={isDark} />

      <Card sx={{ p: 3, mt: 4, mb: 4, textAlign: 'left', background: isDark ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.15), rgba(40,28,58,0.8))' : 'linear-gradient(135deg, #E3F2FD, #ffffff)', color: isDark ? '#FFF' : '#1a365d', boxShadow: isDark ? '0 8px 32px rgba(66, 165, 245, 0.1)' : '0 8px 32px rgba(66, 165, 245, 0.15)' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Current Vibe</Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          {getVibeLabel(stats?.sunshineScore ?? 0, stats?.monthlyExpenses ?? 0)}
        </Typography>
        <Typography variant="body2">
          {getVibeMessage(
            stats?.monthlyExpenses ?? 0,
            stats?.monthlySavings ?? 0,
            stats?.budgetUsedPercent ?? 0,
            fmt,
          )}
        </Typography>
      </Card>

      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: 'left', pl: 1 }}>Trophy Cabinet</Typography>
      {(() => {
        const allBadges = [
          { id: 1, title: 'First Savings', icon: <StarRoundedIcon sx={{ fontSize: 40 }} />, earned: (stats?.monthlySavings ?? 0) > 0 },
          { id: 2, title: 'Budget Master', icon: <EmojiEventsRoundedIcon sx={{ fontSize: 40 }} />, earned: (stats?.monthlyBudget ?? 0) > 0 && (stats?.budgetUsedPercent ?? 100) <= 80 },
          { id: 3, title: 'Consistent Saver', icon: <LocalFireDepartmentRoundedIcon sx={{ fontSize: 40 }} />, earned: (stats?.savingStreak ?? 0) >= 3 },
          { id: 4, title: 'Goal Crusher', icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 40 }} />, earned: (stats?.dreamProgressPercent ?? 0) >= 50 },
        ];
        const earnedCount = allBadges.filter(b => b.earned).length;
        return (
          <>
            {earnedCount === 0 && (
              <Card sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ color: '#aaa', fontWeight: 600 }}>No trophies yet</Typography>
                <Typography variant="caption" color="text.secondary">Start saving and logging expenses to earn badges!</Typography>
              </Card>
            )}
            <Grid container spacing={2}>
              {allBadges.map((badge) => (
                <Grid size={{ xs: 6 }} key={badge.id}>
                  <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: badge.earned ? 1 : 0.35, filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                    <Box sx={{ width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, color: badge.earned ? undefined : '#ccc' }}>
                      {badge.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{badge.title}</Typography>
                    {!badge.earned && <Typography variant="caption" color="text.secondary">Locked</Typography>}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        );
      })()}
    </Box>
  );
};

function LinearProgressBar({ value, isDark }: { value: number; isDark?: boolean }) {
  return (
    <Box sx={{ width: 120, height: 6, background: isDark ? 'rgba(171, 71, 188, 0.2)' : 'rgba(171, 71, 188, 0.15)', borderRadius: 4, mx: 'auto', mt: 1, overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #AB47BC, #E1BEE7)', borderRadius: 4 }} />
    </Box>
  );
}

export default ProfileView;
