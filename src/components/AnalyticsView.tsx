import { Box, Typography, Card, Grid, LinearProgress } from '@mui/material';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import FloatingExpenseCard from './FloatingExpenseCard';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_EMOJI } from '../utils/greeting';
import { useThemeMode } from '../context/ThemeContext';
import type { ExpenseCategory } from '../types';
import AdUnit from './AdUnit';

const AnalyticsView = () => {
  const { expenses, stats } = useApp();
  const { fmt } = useCurrency();
  const { isDark } = useThemeMode();

  const grouped = expenses.reduce((acc, exp) => {
    const dateKey = new Date(exp.date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(exp);
    return acc;
  }, {} as Record<string, typeof expenses>);

  return (
    <Box sx={{ p: 3, pt: 5, pb: 12, textAlign: 'left' }}>
      <Typography variant="h3" sx={{ fontWeight: 900, color: '#FF5FA2', mb: 1 }}>Insights</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>How are your finances looking this month?</Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <Card sx={{ p: 2, borderRadius: '24px', height: '100%' }}>
            <WbSunnyRoundedIcon sx={{ fontSize: 40, color: '#FFB74D', opacity: 0.5, position: 'absolute', right: 8, top: 8 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Sunshine Score</Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 800 }}>{stats?.sunshineScore ?? 0}</Typography>
            <Typography variant="caption" color="text.secondary">Based on saving habits</Typography>
            <LinearProgress variant="determinate" value={stats?.sunshineScore ?? 0} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card sx={{ p: 2, borderRadius: '24px', height: '100%', position: 'relative' }}>
            <ThunderstormRoundedIcon sx={{ fontSize: 40, color: '#A2B5CD', opacity: 0.5, position: 'absolute', right: 8, top: 8 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Rain Meter</Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>{stats?.rainLabel ?? 'Clear'}</Typography>
            <Typography variant="caption" color="text.secondary">Spending intensity</Typography>
            <LinearProgress variant="determinate" value={stats?.spendingIntensity ?? 0} sx={{ mt: 2, height: 8, borderRadius: 4,
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #B3C5FF, #A2B5CD)' }
            }} />
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>Money Drain</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Where your money went this month</Typography>
            {(stats?.categoryBreakdown ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No expenses logged yet. Tap + to log one!</Typography>
            ) : (
              stats!.categoryBreakdown.map(c => (
                <Box key={c.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {CATEGORY_EMOJI[c.category] ?? '📦'} {c.category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF7E67' }}>{fmt(c.total)}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={c.percent} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>

      <AdUnit adSlot="2222222222" />

      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ color: isDark ? '#F0E6F6' : '#5C4A52', fontWeight: 600, mb: 3 }}>All Transactions</Typography>
        {expenses.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No transactions yet</Typography>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, dateExpenses]) => (
            <Box key={date} sx={{ mb: 2 }}>
              <Typography sx={{ color: '#a0a0a0', fontWeight: 600, mb: 1, fontSize: '1rem', textTransform: 'uppercase', textAlign: 'center' }}>{date}</Typography>
              {dateExpenses.map((expense, i) => (
                <FloatingExpenseCard key={expense.id} {...expense} category={expense.category as ExpenseCategory} delay={i * 0.05} pending={expense.pending} />
              ))}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsView;
