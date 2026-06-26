import { useState, useEffect } from 'react';
import { TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatNumberInput, parseNumberInput } from '../utils/format';
import type { ExpenseCategory } from '../types';

const categories: ExpenseCategory[] = ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Entertainment', 'Other'];

interface TransactionsViewProps {
  addTrigger?: number;
}

const TransactionsView = ({ addTrigger = 0 }: TransactionsViewProps) => {
  const { addExpense } = useApp();
  const { symbol } = useCurrency();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (addTrigger > 0) setOpen(true);
  }, [addTrigger]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('pinkcloud:add-expense', handler);
    return () => window.removeEventListener('pinkcloud:add-expense', handler);
  }, []);

  const handleAdd = async () => {
    const amt = parseNumberInput(amount);
    if (!amt || amt <= 0 || !note.trim()) return;
    setSubmitting(true);
    try {
      await addExpense({ amount: amt, category, note: note.trim() });
      setOpen(false);
      setAmount('');
      setNote('');
    } catch {
      // Error toast is handled in AppContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
    >
      <DialogTitle sx={{ color: '#FF5FA2', fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Add Expense <Typography component="span" sx={{ fontSize: '1.5rem' }}>💸</Typography>
        </Box>
        <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#FF5FA2', backgroundColor: 'rgba(255, 95, 162, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 95, 162, 0.2)' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField autoFocus margin="dense" label={`Amount (${symbol})`} inputMode="decimal" fullWidth value={amount}
          onChange={e => setAmount(formatNumberInput(e.target.value))} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        <TextField select margin="dense" label="Category" fullWidth value={category}
          onChange={e => setCategory(e.target.value as ExpenseCategory)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        >
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField margin="dense" label="Note" fullWidth value={note}
          onChange={e => setNote(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={() => setOpen(false)} sx={{ color: '#aaa', borderRadius: '14px', px: 2 }}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={submitting || !amount || !note.trim()}
          sx={{ borderRadius: '14px', background: 'linear-gradient(135deg, #FF5FA2, #FF8CC6)', fontWeight: 800, px: 4, py: 1, boxShadow: '0 4px 14px rgba(255,95,162,0.3)', textTransform: 'none', fontSize: '1.05rem' }}
        >
          Add Expense
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionsView;
