import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Typography, Box, LinearProgress, IconButton, Tooltip, Link } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import { useApp } from '../context/AppContext';
import type { Goal } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';

interface GoalDetailDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

const GoalDetailDialog = ({ goal, onClose }: GoalDetailDialogProps) => {
  const { user, setSavingsDialogOpen, setSavingsGoalId, deleteGoal, showToast, setPublicProfileId } = useApp();
  const { fmt, symbol } = useCurrency();
  const { isDark } = useThemeMode();
  const [deleting, setDeleting] = useState(false);

  if (!goal) return null;

  const handleContribute = () => {
    setSavingsGoalId(String(goal.id));
    setSavingsDialogOpen(true);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGoal(String(goal.id));
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!goal} onClose={onClose} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
    >
      <DialogTitle sx={{ color: '#FF5FA2', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {goal.title} <Typography component="span" sx={{ fontSize: '1.5rem' }}>☁️</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#FF5FA2', backgroundColor: 'rgba(255, 95, 162, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 95, 162, 0.2)' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
          {goal.type}
          {goal.userId !== user?.id && goal.ownerName && (
            <>
              <Typography component="span" sx={{ opacity: 0.5 }}>•</Typography>
              <Link component="button" onClick={() => setPublicProfileId(goal.userId!)} sx={{ color: '#FF8CC6', fontWeight: 700, textDecorationColor: 'rgba(255, 140, 198, 0.4)', textUnderlineOffset: 2, cursor: 'pointer', '&:hover': { color: '#FF5FA2' } }}>
                By {goal.ownerName}
              </Link>
            </>
          )}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F0E6F6' : '#5C4A52' }}>Progress</Typography>
            <Typography variant="body2" sx={{ fontWeight: 900, color: '#FF5FA2' }}>{goal.progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={goal.progress} sx={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(255, 95, 162, 0.15)', '& .MuiLinearProgress-bar': { borderRadius: 6, background: 'linear-gradient(90deg, #FF5FA2, #FFC1DA)' } }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#F0E6F6' : '#5C4A52' }}>
          {(goal.currencySymbol || symbol)}{goal.currentAmount.toLocaleString()} <Typography component="span" variant="h6" sx={{ color: 'text.secondary', fontWeight: 600, opacity: 0.7 }}>/ {(goal.currencySymbol || symbol)}{goal.targetAmount.toLocaleString()}</Typography>
        </Typography>

        {goal.shareCode && (
          <Box sx={{ mt: 4, p: 2, backgroundColor: isDark ? 'rgba(255, 95, 162, 0.05)' : '#FFF0F5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px dashed rgba(255, 95, 162, 0.2)' }}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#FF8CC6', display: 'block', lineHeight: 1 }}>DREAM CODE</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF5FA2', letterSpacing: '4px', mt: 0.5 }}>{goal.shareCode}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Copy code" placement="top">
                <IconButton onClick={() => {
                  navigator.clipboard.writeText(goal.shareCode!);
                  showToast('Code copied to clipboard!');
                }} sx={{ color: '#FF5FA2', backgroundColor: isDark ? '#281C3A' : '#fff', boxShadow: '0 2px 8px rgba(255,95,162,0.1)' }}>
                  <ContentCopyRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share invite" placement="top">
                <IconButton onClick={async () => {
                  const text = `Let's save up for "${goal.title}" together on PinkCloud! Use my dream code to join: ${goal.shareCode}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'Join my dream!', text });
                    } catch (e) {
                      console.log('Share failed', e);
                    }
                  } else {
                    navigator.clipboard.writeText(text);
                    showToast('Invite copied to clipboard!');
                  }
                }} sx={{ color: '#FF5FA2', backgroundColor: isDark ? '#281C3A' : '#fff', boxShadow: '0 2px 8px rgba(255,95,162,0.1)' }}>
                  <ShareRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {goal.progress < 100 && (
          <Button fullWidth variant="contained" onClick={handleContribute}
            sx={{ borderRadius: '14px', fontWeight: 800, py: 1.5, fontSize: '1.05rem', textTransform: 'none', background: 'linear-gradient(135deg, #FF5FA2, #FF8CC6)', boxShadow: '0 4px 14px rgba(255,95,162,0.3)' }}
          >
            Add Savings
          </Button>
        )}
        {goal.userId === user?.id && (
          <Button fullWidth variant="outlined" onClick={handleDelete} disabled={deleting}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              py: 1.25,
              minHeight: 48,
              color: '#FF8A65',
              borderColor: 'rgba(255, 138, 101, 0.5)',
              '&:hover': { borderColor: '#FF8A65', backgroundColor: 'rgba(255, 138, 101, 0.06)' },
            }}
          >
            Remove Dream
          </Button>
        )}
      </Box>
    </Dialog>
  );
};

export default GoalDetailDialog;
