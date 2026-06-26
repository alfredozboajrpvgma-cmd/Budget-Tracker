import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, LinearProgress, SwipeableDrawer, IconButton } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { motion } from 'framer-motion';
import CloudGoal from './CloudGoal';
import BudgetEditDialog from './BudgetEditDialog';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';
import { getGreeting } from '../utils/greeting';
import { xpForLevel } from '../utils/xp';

const Dashboard = () => {
  const { user, goals, stats, setSelectedGoal, setSavingsDialogOpen, setSavingsGoalId } = useApp();
  const { fmt, symbol } = useCurrency();
  const { isDark } = useThemeMode();
  const monthlyBudget = user?.monthlyBudget ?? stats?.monthlyBudget ?? 5000;
  const [questsOpen, setQuestsOpen] = useState(false);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [hour, setHour] = useState(new Date().getHours());
  const skyConstraintsRef = useRef<Element>(null);

  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeGoals = goals.filter(g => g.progress < 100);
  const rawName = user?.name || 'Dreamer';
  const displayName = rawName.length > 15 ? rawName.substring(0, 12) + '...' : rawName;
  const greeting = getGreeting(hour);



  const handleQuestAction = (actionType: string) => {
    setQuestsOpen(false);
    if (actionType === 'log-expense') {
      window.dispatchEvent(new CustomEvent('pinkcloud:add-expense'));
    } else if (actionType === 'save') {
      setSavingsGoalId(null);
      setSavingsDialogOpen(true);
    }
  };

  const quests = stats?.quests;
  const questsDone = stats?.questsCompleted ?? 0;

  return (
    <Box sx={{ pt: 5, pb: 4, overflowX: 'hidden', textAlign: 'left' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ px: 3, mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 4, color: isDark ? '#FFFFFF' : '#333333', fontWeight: 800 }}>
            {greeting}, {displayName}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mx: -1.5, mb: 3 }}>
            <Card
              onClick={() => setBudgetEditOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Edit monthly budget"
              onKeyDown={e => e.key === 'Enter' && setBudgetEditOpen(true)}
              sx={{
                flex: 1, p: 2.5, textAlign: 'center', borderRadius: '24px', minHeight: 150,
                cursor: 'pointer', position: 'relative',
                background: isDark ? 'linear-gradient(135deg, rgba(255,95,162,0.1), rgba(40,28,58,0.8))' : 'linear-gradient(135deg, #FFF0F7, #ffffff)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 12px 32px rgba(255, 95, 162, 0.18)' },
              }}
            >
              <IconButton
                size="small"
                aria-label="Edit budget"
                onClick={e => { e.stopPropagation(); setBudgetEditOpen(true); }}
                sx={{ position: 'absolute', top: 8, right: 8, color: '#FF5FA2', opacity: 0.7 }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
              <Box sx={{ color: '#FF5FA2', mb: 1 }}><AccountBalanceWalletRoundedIcon /></Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800, mb: 0.5 }}>Remaining Budget</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: isDark ? '#FFF' : '#333' }}>
                {fmt(stats?.totalBalance ?? 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {fmt(stats?.monthlyExpenses ?? 0)} of {fmt(monthlyBudget)} spent
              </Typography>
              <LinearProgress variant="determinate" value={stats?.budgetUsedPercent ?? 0} sx={{ width: '90%', mx: 'auto', height: 7, borderRadius: 3, backgroundColor: 'rgba(255, 95, 162, 0.2)', '& .MuiLinearProgress-bar': { backgroundColor: '#FF5FA2' } }} />
            </Card>
            <Card sx={{ 
              flex: 1, p: 2.5, textAlign: 'center', borderRadius: '24px', minHeight: 150,
              background: isDark ? 'linear-gradient(135deg, rgba(171,71,188,0.1), rgba(40,28,58,0.8))' : 'linear-gradient(135deg, #F3E5F5, #ffffff)',
            }}>
              <Box sx={{ color: '#AB47BC', mb: 1 }}><SavingsRoundedIcon /></Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800, mb: 0.5 }}>Monthly Savings</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: isDark ? '#FFF' : '#333' }}>
                +{fmt(stats?.monthlySavings ?? 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {stats?.savingStreak ? `${stats.savingStreak}-day streak!` : 'Start saving today!'}
              </Typography>
              <LinearProgress variant="determinate" value={stats?.savingsProgressPercent ?? 0} sx={{ width: '90%', mx: 'auto', height: 7, borderRadius: 3, backgroundColor: 'rgba(171, 71, 188, 0.2)', '& .MuiLinearProgress-bar': { backgroundColor: '#AB47BC' } }} />
            </Card>
          </Box>

          <Box sx={{ mb: 3, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.6)', p: 2, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#E8E2E4' : '#5C4A52' }}>
                  Level {stats?.level ?? 1}: {stats?.levelTitle ?? 'Cloud Builder'}
                </Typography>
                <Box onClick={() => setQuestsOpen(true)} role="button" tabIndex={0} aria-label="View daily quests"
                  sx={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(216, 27, 96, 0.1)', color: isDark ? '#FFFFFF' : '#D81B60', px: 1, py: 0.5, borderRadius: 2, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Quests ({questsDone}/{quests?.length || 0}) ❯
                </Box>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#AB47BC' }}>
                {stats?.xp ?? 0} / {stats?.xpNeeded ?? xpForLevel(stats?.level ?? 1)} XP
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={stats?.xpProgressPercent ?? 0} sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(171, 71, 188, 0.2)', '& .MuiLinearProgress-bar': { backgroundColor: '#AB47BC' } }} />
          </Box>

          <Typography variant="body1" color="text.secondary">
            You are <strong style={{ color: '#D81B60' }}>{stats?.dreamProgressPercent ?? 0}%</strong> closer to your dreams this month.
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ mt: 2, position: 'relative' }}>
        <Box sx={{ px: 3, display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', fontWeight: 600 }}>Your Dream Sky</Typography>

          <Box sx={{ flexGrow: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,193,218,0.5) 0%, rgba(255,255,255,0) 100%)', ml: 2 }} />
        </Box>



        <Box ref={skyConstraintsRef} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 300, pb: 4, px: 3 }}>
          {activeGoals.length === 0 ? (
            <Typography variant="body1" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', opacity: 0.6, mt: 6, textAlign: 'center' }}>
              The sky is clear.<br />Tap <strong>+</strong> below to add a new dream!
            </Typography>
          ) : (
            activeGoals.slice(0, 4).map((goal, index) => {
              const aligns = ['flex-start', 'flex-end', 'center'] as const;
              return (
                <Box key={goal.id} sx={{ alignSelf: aligns[index % 3], zIndex: 3 - index, mt: index > 0 ? -2 : 0 }}>
                  <CloudGoal
                    title={goal.title}
                    progress={goal.progress}
                    size={index % 2 === 0 ? 'medium' : 'small'}
                    delay={index * 0.2}
                    onClick={() => setSelectedGoal(goal)}
                    dragConstraints={skyConstraintsRef}
                    ownerName={goal.ownerName}
                    ownerId={goal.userId}
                    amount={goal.currentAmount}
                    currencySymbol={goal.currencySymbol || symbol}
                  />
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      <BudgetEditDialog open={budgetEditOpen} onClose={() => setBudgetEditOpen(false)} />

      <SwipeableDrawer anchor="bottom" open={questsOpen} onClose={() => setQuestsOpen(false)} onOpen={() => setQuestsOpen(true)}
        allowSwipeInChildren={true} disableSwipeToOpen={true}
        slotProps={{ paper: { sx: { borderTopLeftRadius: 32, borderTopRightRadius: 32, p: 3, pb: 6, backgroundColor: isDark ? '#281C3A' : '#ffffff' } } }}
      >
        <Box sx={{ width: 40, height: 5, background: 'rgba(255, 95, 162, 0.2)', borderRadius: 4, mx: 'auto', mb: 3 }} />
        <Typography variant="h5" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', fontWeight: 800, mb: 3, px: 1 }}>Daily Quests</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 1 }}>
          {quests?.map(quest => (
            <QuestCard
              key={quest.id}
              isDark={isDark}
              title={`${quest.title} (${fmt(quest.progress)}/${fmt(quest.target)})`}
              completed={quest.completed}
              xp={`+${quest.xpReward} XP`}
              onClick={() => handleQuestAction(quest.type)}
            />
          ))}
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

function QuestCard({ title, completed, locked, xp, onClick, isDark }: {
  title: string; completed?: boolean; locked?: boolean; xp: string; onClick?: () => void; isDark?: boolean;
}) {
  return (
    <Box onClick={locked ? undefined : onClick} role={onClick && !locked ? 'button' : undefined}
      sx={{
        p: 2.5, borderRadius: '24px', cursor: locked ? 'default' : 'pointer',
        background: completed ? (isDark ? 'rgba(46,125,50,0.15)' : 'rgba(232,245,233,0.9)') : locked ? (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') : (isDark ? 'linear-gradient(135deg, rgba(40,28,58,0.9), rgba(60,30,90,0.5))' : 'linear-gradient(135deg, #ffffff, #FFF0F7)'),
        border: completed ? '1px solid rgba(129, 199, 132, 0.3)' : `2px solid rgba(255, 95, 162, ${isDark ? '0.15' : '0.2'})`,
        opacity: locked ? 0.7 : 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 800, color: completed ? '#2E7D32' : (isDark ? '#E8E2E4' : '#5C4A52'), textDecoration: completed ? 'line-through' : 'none' }}>
          {title}
        </Typography>
        {completed && <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 700 }}>Completed!</Typography>}
        {locked && !completed && <Typography variant="caption" color="text.secondary">Spend nothing today to unlock</Typography>}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: completed ? '#388E3C' : '#FF5FA2' }}>{xp}</Typography>
    </Box>
  );
}

export default Dashboard;
