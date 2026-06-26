import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatNumberInput, parseNumberInput } from '../utils/format';
import { useThemeMode } from '../context/ThemeContext';

interface BudgetEditDialogProps {
  open: boolean;
  onClose: () => void;
}

const BudgetEditDialog = ({ open, onClose }: BudgetEditDialogProps) => {
  const { user, stats, updateMonthlyBudget } = useApp();
  const { symbol } = useCurrency();
  const { isDark } = useThemeMode();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(formatNumberInput(String(user?.monthlyBudget ?? stats?.monthlyBudget ?? 5000)));
    }
  }, [open, user?.monthlyBudget, stats?.monthlyBudget]);

  const handleSave = async () => {
    const value = parseNumberInput(amount);
    if (!value || value <= 0) return;
    setSubmitting(true);
    try {
      await updateMonthlyBudget(value);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
    >
      <DialogTitle sx={{ color: '#FF5FA2', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Monthly Budget <Typography component="span" sx={{ fontSize: '1.5rem' }}>🎯</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#FF5FA2', backgroundColor: 'rgba(255, 95, 162, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 95, 162, 0.2)' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set how much you can spend this month. Remaining budget updates as you log expenses.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label={`Budget target (${symbol})`}
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(formatNumberInput(e.target.value))}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#aaa', borderRadius: '14px', px: 2 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={submitting || !amount || parseNumberInput(amount) <= 0}
          sx={{ borderRadius: '14px', background: 'linear-gradient(135deg, #FF5FA2, #FF8CC6)', fontWeight: 800, px: 4, py: 1, boxShadow: '0 4px 14px rgba(255,95,162,0.3)', textTransform: 'none', fontSize: '1.05rem' }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BudgetEditDialog;
