import { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Switch, MenuItem, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Accordion, AccordionSummary, AccordionDetails, Drawer } from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';
import BatterySaverIcon from '@mui/icons-material/BatterySaverRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import { useApp } from '../context/AppContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';
import { requestNotificationPermission, sendNotification, setNotificationsEnabled, areNotificationsEnabled, NOTIFICATIONS_ENABLED_KEY } from '../utils/notifications';
import { registerPushSubscription, unregisterPushSubscription, pingActivity } from '../utils/pushSubscription';
import { submitSupportQuestion, submitAccountDeletionRequest } from '../utils/netlifyForms';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { usePwaUpdateContext } from '../context/PwaUpdateContext';
import { APP_VERSION, APP_BUILD_TIME, formatBuildDate } from '../utils/version';

const FAQS = [
  { q: 'How do I add a new expense?', a: 'Tap the + button in the center of the bottom nav to log an expense.' },
  { q: 'How do I edit my budget?', a: 'On the home screen, tap the "Remaining Budget" card to edit your monthly budget.' },
  { q: 'How do I save toward a goal?', a: 'Tap + then "Add Savings" and choose a dream to contribute to.' },
  { q: 'How does the Sunshine Score work?', a: 'It reflects your saving habits and spending — save more, spend wisely, score higher!' },
  { q: 'How do I join a shared dream?', a: 'Tap + then "Join Dream" and enter your friend\'s 6-character dream code.' },
  { q: 'How do I change my currency?', a: 'Open Settings from the top right menu, then pick your currency from the dropdown.' },
  { q: 'What does Lite Mode do?', a: 'Lite Mode disables animations to save battery and make the app run faster on older devices.' },
];

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user, logout, showToast } = useApp();
  const { currency, setCurrency } = useCurrency();
  const { isDark, toggleTheme, isLiteMode, toggleLiteMode } = useThemeMode();
  
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
  
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const { canInstall, isInstalled, install, showIosHint } = usePwaInstall();
  const { needRefresh, applyUpdate } = usePwaUpdateContext();
  const [isInstalling, setIsInstalling] = useState(false);

  const installSecondary = isInstalled
    ? 'Already installed'
    : showIosHint
      ? 'Tap Share, then "Add to Home Screen"'
      : canInstall
        ? 'Add PinkCloud to your home screen'
        : '';

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

  const handleClose = () => {
    onClose();
    // Reset view when closing
    setTimeout(() => setActiveSubView(null), 300);
  };

  const renderDrawerContent = () => {
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
                slotProps={{ htmlInput: { maxLength: 500 } }}
                sx={{ mb: 0.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mb: 2, color: supportQuestion.length >= 500 ? 'error.main' : 'text.secondary' }}>
                {supportQuestion.length} / 500
              </Typography>
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
          <IconButton onClick={handleClose} aria-label="Close"><ArrowBackRoundedIcon /></IconButton>
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
                
                let granted = false;
                if (checked) {
                  granted = await requestNotificationPermission();
                  if (!granted) {
                    setNotificationsEnabledState(false);
                    setNotificationsEnabled(false);
                    return;
                  }
                }

                setIsPushLoading(true);
                try {
                  if (checked) {
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
                } catch (err: any) {
                  setNotificationsEnabledState(false);
                  setNotificationsEnabled(false);
                  console.error(err);
                  showToast(err.message || 'Failed to register push subscription', 'error');
                } finally {
                  setIsPushLoading(false);
                }
              }} />
            )
          }>
            <ListItemButton sx={{ py: 2.5 }}>
              <ListItemIcon><NotificationsRoundedIcon sx={{ color: '#FF5FA2' }} /></ListItemIcon>
              <ListItemText
                primary="Notifications"
                secondary={notificationsEnabled && areNotificationsEnabled() ? 'On' : 'Off'}
              />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
          <ListItem disablePadding secondaryAction={<Switch checked={isDark} onChange={toggleTheme} />}>
            <ListItemButton sx={{ py: 2.5 }}>
              <ListItemIcon><SettingsRoundedIcon sx={{ color: '#7C4DFF' }} /></ListItemIcon>
              <ListItemText primary="Dark Mode" secondary={isDark ? 'On' : 'Off'} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
          <ListItem disablePadding secondaryAction={<Switch checked={isLiteMode} onChange={toggleLiteMode} />}>
            <ListItemButton sx={{ py: 2.5 }}>
              <ListItemIcon><BatterySaverIcon sx={{ color: '#4CAF50' }} /></ListItemIcon>
              <ListItemText primary="Lite Mode" secondary={isLiteMode ? 'On (Animations disabled)' : 'Off (Full experience)'} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
          <ListItem disablePadding>
            <ListItemButton sx={{ py: 2.5 }}>
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
                sx={{ width: 150, ml: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                {CURRENCIES.map(c => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </MenuItem>
                ))}
              </TextField>
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
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
              sx={{ py: 2.5 }}
            >
              <ListItemIcon><InstallMobileRoundedIcon sx={{ color: '#FF5FA2' }} /></ListItemIcon>
              <ListItemText primary="Install App" secondary={installSecondary} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
          <ListItem disablePadding secondaryAction={<ChevronRightRoundedIcon />}>
            <ListItemButton onClick={() => setActiveSubView('Help & Support')} sx={{ py: 2.5 }}>
              <ListItemIcon><HelpOutlineRoundedIcon sx={{ color: '#FFD54F' }} /></ListItemIcon>
              <ListItemText primary="Help & Support" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />
          
          <ListItem disablePadding>
            <ListItemButton onClick={() => setDeleteAccountDialogOpen(true)} sx={{ py: 2.5 }}>
              <ListItemIcon><DeleteOutlineRoundedIcon sx={{ color: '#E53935' }} /></ListItemIcon>
              <ListItemText primary="Request Account Deletion" slotProps={{ primary: { sx: { color: '#E53935', fontWeight: 600 } } }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ opacity: 0.5 }} />

          <ListItem disablePadding>
            <ListItemButton onClick={() => setLogoutDialogOpen(true)} sx={{ py: 2.5 }}>
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
          slotProps={{ paper: { sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } } }}
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

        <Dialog 
          open={deleteAccountDialogOpen}
          onClose={() => setDeleteAccountDialogOpen(false)}
          slotProps={{ paper: { sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', pb: 1, color: '#E53935' }}>
            Leaving so soon? 🥺
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem', color: 'text.secondary', fontWeight: 500, mb: 2 }}>
              Wait! Are you sure you want to leave PinkCloud? We'll be super sad to see you go! 🌧️<br /><br />
              If you delete your account, all your saved dreams, budget history, and your Sunshine Score will vanish into thin air forever. Please reconsider! <br /><br />
              But if you really must go, let us know how we can improve.
            </DialogContentText>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Please tell us why you're leaving... (Optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 300 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: deleteReason.length >= 300 ? 'error.main' : 'text.secondary' }}>
              {deleteReason.length} / 300
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteAccountDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, px: 2 }}>
              Cancel
            </Button>
            <Button 
              disabled={submittingDelete}
              onClick={async () => {
                setSubmittingDelete(true);
                try {
                  await submitAccountDeletionRequest({
                    name: user?.name || 'PinkCloud user',
                    email: user?.email || '',
                    reason: deleteReason
                  });
                  showToast('Deletion request submitted. We will process it shortly.', 'success');
                  setDeleteAccountDialogOpen(false);
                  setDeleteReason('');
                } catch {
                  showToast('Could not submit request. Please try again.', 'error');
                } finally {
                  setSubmittingDelete(false);
                }
              }} 
              color="error" 
              variant="contained"
              disableElevation
              sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
            >
              {submittingDelete ? 'Sending...' : 'Request Deletion'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 400 },
            background: isDark ? '#121212' : '#ffffff',
            backgroundImage: 'none'
          }
        }
      }}
    >
      {renderDrawerContent()}
    </Drawer>
  );
}
