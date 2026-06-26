import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Card, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudGoal from './CloudGoal';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';
import { formatNumberInput, parseNumberInput } from '../utils/format';

const buildingTypes = ['Emergency Fund', 'Education', 'Travel', 'Business', 'Other'];

interface GoalsViewProps {
  addTrigger?: number;
}

const IslandView = ({ addTrigger = 0 }: GoalsViewProps) => {
  const { user, goals, stats, addGoal, setSelectedGoal } = useApp();
  const { fmt, symbol } = useCurrency();
  const { isDark } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inProgressConstraintsRef = useRef(null);
  const completedConstraintsRef = useRef(null);
  useEffect(() => {
    if (addTrigger > 0) setOpen(true);
  }, [addTrigger]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const finalType = type === 'Other' ? (customType.trim() || 'Other') : type;
      await addGoal({ title: title.trim(), type: finalType, targetAmount: parseNumberInput(targetStr) || 10000, currencySymbol: symbol });
      setOpen(false);
      setTitle('');
      setTargetStr('');
      setCustomType('');
    } catch {
      // Error toast is handled in AppContext
    } finally {
      setSubmitting(false);
    }
  };

  const activeGoals = goals.filter(g => g.progress < 100);
  const completedGoals = goals.filter(g => g.progress >= 100);

  return (
    <Box sx={{ pt: 5, pb: 15, overflowX: 'hidden', position: 'relative', minHeight: '100%', textAlign: 'left' }}>
      <Box sx={{ position: 'relative', zIndex: 1, px: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#FF5FA2', mb: 1 }}>Dream Vault</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Track your savings goals and watch your dreams grow</Typography>

        <Card sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Saved</Typography>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 800 }}>{fmt(stats?.totalSaved ?? 0)}</Typography>
        </Card>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Card sx={{ p: 2, flex: 1, borderRadius: '24px', background: isDark ? 'linear-gradient(135deg, rgba(244, 143, 177, 0.25), rgba(248, 187, 208, 0.1))' : 'linear-gradient(135deg, #FF9A9E, #FECFEF)', color: isDark ? '#F8BBD0' : 'white', border: isDark ? '1px solid rgba(244, 143, 177, 0.2)' : 'none' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Saving Streak</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats?.savingStreak ?? 0} Days</Typography>
          </Card>
          <Card sx={{ p: 2, flex: 1, borderRadius: '24px', background: isDark ? 'linear-gradient(135deg, rgba(179, 157, 219, 0.25), rgba(209, 196, 233, 0.1))' : 'linear-gradient(135deg, #a18cd1, #fbc2eb)', color: isDark ? '#D1C4E9' : 'white', border: isDark ? '1px solid rgba(179, 157, 219, 0.2)' : 'none' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Active Dreams</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{activeGoals.length}</Typography>
          </Card>
        </Box>

        <Typography variant="subtitle2" sx={{ color: isDark ? '#F0E6F6' : '#5C4A52', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, opacity: 0.6, textAlign: 'center' }}>
          In Progress
        </Typography>
        {activeGoals.length === 0 ? (
          <Box sx={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)', borderRadius: 4, p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No active dreams yet. Tap <strong>+</strong> to start saving!</Typography>
          </Box>
        ) : (
          <Box ref={inProgressConstraintsRef} sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mb: 4, minHeight: 150 }}>
            {activeGoals.map((goal, i) => (
              <CloudGoal key={goal.id} title={goal.title} progress={goal.progress} size="medium" delay={i * 0.1}
                onClick={() => setSelectedGoal(goal)} dragConstraints={inProgressConstraintsRef}
                ownerName={goal.ownerName}
                ownerId={goal.userId}
                amount={goal.currentAmount}
                currencySymbol={goal.currencySymbol || symbol} />
            ))}
          </Box>
        )}

        {completedGoals.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" sx={{ color: isDark ? '#F0E6F6' : '#5C4A52', fontWeight: 800, textTransform: 'uppercase', mb: 2, opacity: 0.6, textAlign: 'center' }}>
              Completed Dreams
            </Typography>
            <Box ref={completedConstraintsRef} sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', minHeight: 150 }}>
              {completedGoals.map((goal, i) => (
                <CloudGoal key={goal.id} title={goal.title} progress={goal.progress} size="medium" delay={i * 0.1}
                  onClick={() => setSelectedGoal(goal)} dragConstraints={completedConstraintsRef}
                  ownerName={goal.ownerName}
                  ownerId={goal.userId}
                  amount={goal.currentAmount}
                  currencySymbol={goal.currencySymbol || symbol} />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ color: '#FF5FA2', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            New Dream <Typography component="span" sx={{ fontSize: '1.5rem' }}>☁️</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#FF5FA2', backgroundColor: 'rgba(255, 95, 162, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 95, 162, 0.2)' } }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField autoFocus margin="dense" label="Name your dream" fullWidth value={title}
            onChange={e => setTitle(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField margin="dense" label={`Target Amount (${symbol})`} fullWidth inputMode="decimal" value={targetStr}
            onChange={e => setTargetStr(formatNumberInput(e.target.value))} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField select margin="dense" label="Category" fullWidth value={type}
            onChange={e => { setType(e.target.value); if (e.target.value !== 'Other') setCustomType(''); }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          >
            <MenuItem value="" disabled>Select a category</MenuItem>
            {buildingTypes.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
          {type === 'Other' && (
            <TextField margin="dense" label="Enter custom category" fullWidth value={customType}
              onChange={e => setCustomType(e.target.value)}
              sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#aaa', borderRadius: '14px', px: 2 }}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={submitting || !title.trim() || !type}
            sx={{ borderRadius: '14px', background: 'linear-gradient(135deg, #FF5FA2, #FF8CC6)', fontWeight: 800, px: 4, py: 1, boxShadow: '0 4px 14px rgba(255,95,162,0.3)', textTransform: 'none', fontSize: '1.05rem' }}
          >
            Create Dream
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IslandView;
