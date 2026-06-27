import { Box, Typography, Card, Grid, Avatar, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { xpForLevel } from '../utils/xp';
import { getVibeLabel, getVibeMessage } from '../utils/vibe';

const ProfileView = () => {
  const { user, stats } = useApp();
  const { fmt } = useCurrency();
  const { isDark } = useThemeMode();

  const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user?.avatarSeed ?? 'Felix'}&backgroundColor=FFC1DA`;
  const displayName = user?.name || 'Dreamer';

  return (
    <Box sx={{ p: 3, pt: 5, position: 'relative', textAlign: 'left' }}>
      <Avatar src={avatarUrl} sx={{ width: 100, height: 100, border: '4px solid #FF5FA2', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFF' : '#333', wordBreak: 'break-word', fontFamily: '"Nunito", "Quicksand", sans-serif' }}>{displayName}</Typography>
      <Typography variant="subtitle2" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', fontWeight: 600 }}>
        Level {stats?.level ?? 1}: {stats?.levelTitle ?? 'Cloud Builder'}
      </Typography>
      <Typography variant="caption" sx={{ color: isDark ? '#FFFFFF' : '#AB47BC', fontWeight: 700 }}>
        {stats?.xp ?? 0} / {stats?.xpNeeded ?? xpForLevel(stats?.level ?? 1)} XP
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={stats?.xpProgressPercent ?? 0} 
        sx={{ 
          width: 120, 
          height: 7, 
          borderRadius: 3, 
          mt: 1,
          backgroundColor: 'rgba(255, 95, 162, 0.2)', 
          '& .MuiLinearProgress-bar': { backgroundColor: '#FF5FA2', borderRadius: 3 } 
        }} 
      />

      <Card sx={{ p: 3, mt: 4, mb: 4, textAlign: 'left', background: isDark ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.15), rgba(40,28,58,0.8))' : 'linear-gradient(135deg, #E3F2FD, #ffffff)', color: isDark ? '#FFF' : '#1a365d', boxShadow: isDark ? '0 8px 32px rgba(66, 165, 245, 0.1)' : '0 8px 32px rgba(66, 165, 245, 0.15)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Current Vibe</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              {getVibeLabel(stats?.sunshineScore ?? 0, stats?.monthlyExpenses ?? 0)}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {(() => {
                const raw = getVibeMessage(
                  stats?.monthlyExpenses ?? 0,
                  stats?.monthlySavings ?? 0,
                  stats?.budgetUsedPercent ?? 0,
                  (v) => `__${fmt(v)}__`
                );
                return raw.split('__').map((p, i) => 
                  i % 2 === 1 ? <Box key={i} component="span" sx={{ fontWeight: 800, color: isDark ? '#FFC1DA' : '#FF5FA2' }}>{p}</Box> : p
                );
              })()}
            </Typography>
          </Box>
          <Box sx={{ width: 64, height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FFC1DA' : '#FF5FA2', opacity: 0.9 }}>
            {(stats?.sunshineScore ?? 0) >= 70 ? (
              <WbSunnyRoundedIcon sx={{ fontSize: 64 }} />
            ) : (stats?.sunshineScore ?? 0) >= 40 ? (
              <CloudRoundedIcon sx={{ fontSize: 64 }} />
            ) : (
              <ThunderstormRoundedIcon sx={{ fontSize: 64 }} />
            )}
          </Box>
        </Box>
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
            <Grid container spacing={3}>
              {allBadges.map((badge) => (
                <Grid size={{ xs: 6 }} key={badge.id}>
                  <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: badge.earned ? 1 : 0.6, filter: badge.earned ? 'none' : 'grayscale(1)' }}>
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

export default ProfileView;
