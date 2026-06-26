import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, IconButton, Box, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatNumberInput, parseNumberInput } from '../utils/format';


interface SavingsDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedGoalId?: string | null;
}

const SavingsDialog = ({ open, onClose, preselectedGoalId }: SavingsDialogProps) => {
  const { goals, contributeToGoal } = useApp();
  const { symbol } = useCurrency();
  const activeGoals = goals.filter(g => g.progress < 100);
  const [goalId, setGoalId] = useState(preselectedGoalId ?? '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedGoalId) setGoalId(preselectedGoalId);
  }, [preselectedGoalId, open]);

  const selectedId = preselectedGoalId ?? goalId;

  const handleSubmit = async () => {
    const amt = parseNumberInput(amount);
    if (!selectedId || !amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await contributeToGoal(String(selectedId), amt);
      setAmount('');
      onClose();
    } catch {
      // Error toast is handled in AppContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
    >
      <DialogTitle sx={{ color: '#42A5F5', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Add Savings <Typography component="span" sx={{ fontSize: '1.5rem' }}>💰</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#42A5F5', backgroundColor: 'rgba(66, 165, 245, 0.1)', '&:hover': { backgroundColor: 'rgba(66, 165, 245, 0.2)' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {!preselectedGoalId && (
          <TextField
            select fullWidth label="Choose a dream" value={goalId}
            onChange={e => setGoalId(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          >
            {activeGoals.map(g => (
              <MenuItem key={g.id} value={String(g.id)}>{g.title} ({g.progress}%)</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          autoFocus fullWidth label={`Amount (${symbol})`} inputMode="decimal"
          value={amount} onChange={e => setAmount(formatNumberInput(e.target.value))}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: '#aaa', borderRadius: '14px', px: 2 }}>Cancel</Button>
        <Button
          onClick={handleSubmit} variant="contained" disabled={submitting || !selectedId || !amount}
          sx={{ borderRadius: '14px', background: 'linear-gradient(135deg, #42A5F5, #90CAF9)', fontWeight: 800, px: 4, py: 1, boxShadow: '0 4px 14px rgba(66,165,245,0.3)', textTransform: 'none', fontSize: '1.05rem' }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SavingsDialog;
