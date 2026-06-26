import { useState, useEffect } from 'react';
import { Dialog, DialogContent, Typography, Box, IconButton, Avatar, CircularProgress, Card } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';

interface PublicProfile {
  id: string;
  name: string;
  avatarSeed: string;
  level: number;
  levelTitle: string;
  createdAt: string;
}

export default function PublicProfileDialog() {
  const { publicProfileId, setPublicProfileId } = useApp();
  const { isDark } = useThemeMode();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicProfileId) {
      setLoading(true);
      api.getUserProfile(publicProfileId)
        .then(data => {
          setProfile(data);
        })
        .catch(err => {
          console.error('Failed to load profile', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
    }
  }, [publicProfileId]);

  const handleClose = () => setPublicProfileId(null);

  if (!publicProfileId) return null;

  return (
    <Dialog open={!!publicProfileId} onClose={handleClose} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pb: 0 }}>
        <Box />
        <IconButton onClick={handleClose} size="small" sx={{ color: '#FF5FA2', backgroundColor: 'rgba(255, 95, 162, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 95, 162, 0.2)' } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 1, pb: 4, textAlign: 'center' }}>
        {loading || !profile ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#FF5FA2' }} />
          </Box>
        ) : (
          <>
            <Avatar 
              src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile.avatarSeed || 'Felix'}&backgroundColor=FFC1DA`} 
              sx={{ width: 100, height: 100, border: '4px solid #FF5FA2', mx: 'auto', mb: 2 }} 
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFF' : '#333' }}>
              {(profile.name || 'Dreamer').length > 15 ? (profile.name || 'Dreamer').substring(0, 12) + '...' : (profile.name || 'Dreamer')}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: isDark ? '#B8A5C8' : '#5C4A52', fontWeight: 600, mb: 1 }}>
              Level {profile.level || 1}: {profile.levelTitle || 'Cloud Builder'}
            </Typography>
            
            <Card sx={{ p: 2.5, mt: 3, textAlign: 'center', background: isDark ? 'linear-gradient(135deg, rgba(171, 71, 188, 0.1), rgba(40, 28, 58, 0.8))' : 'linear-gradient(135deg, #F3E5F5, #ffffff)', borderRadius: '16px', border: '1px dashed rgba(171, 71, 188, 0.3)' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#E8E2E4' : '#5C4A52' }}>
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Typography>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
