import { useState } from 'react';
import { Box, Button, Typography, TextField, Card, IconButton, Fade, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';

const buildingTypes = ['Emergency Fund', 'Education', 'Travel', 'Laptop', 'Business', 'House'];

interface OnboardingProps {
  onComplete: (data: { name: string; avatarSeed: string; dreamTitle?: string; dreamType?: string; dreamTarget?: number }) => Promise<void>;
}

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '& fieldset': { borderColor: 'rgba(255, 193, 218, 0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#FF5FA2 !important', borderWidth: '2px !important' },
  },
};

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { isDark } = useThemeMode();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dream, setDream] = useState('');
  const [dreamType, setDreamType] = useState(buildingTypes[0]);
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      await onComplete({
        name: name.trim(),
        avatarSeed,
        dreamTitle: dream.trim() || undefined,
        dreamType,
        dreamTarget: 10000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, px: 3, pt: 3, pb: 2, zIndex: 10, display: 'flex', alignItems: 'center', pointerEvents: 'none', background: isDark ? 'rgba(38,34,36,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid rgba(244, 143, 177, ${isDark ? '0.2' : '0.1'})` }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#FF5FA2', display: 'flex', alignItems: 'center', gap: 1, textShadow: '0 2px 10px rgba(255, 95, 162, 0.2)' }}>
          PinkCloud
        </Typography>
      </Box>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '100%', maxWidth: 450, position: 'relative', zIndex: 1 }}>
        <Card sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
          {step > 0 && (
            <IconButton sx={{ position: 'absolute', top: 24, left: 24 }} onClick={() => setStep(step - 1)} aria-label="Go back">
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box sx={{ mt: 2, minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {step === 0 && (
              <Fade in>
                <Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>☁️</Typography>
                  <Typography variant="h4" color="primary" gutterBottom>What should we call you?</Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: isDark ? '#E8E2E4' : '#5C4A52' }}>Every great journey starts with a name.</Typography>
                  <TextField fullWidth placeholder="Your name" value={name} onChange={e => setName(e.target.value)} sx={textFieldSx} />
                </Box>
              </Fade>
            )}

            {step === 1 && (
              <Fade in>
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>Choose your Avatar</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 3 }}>
                    <Box component="img"
                      src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${avatarSeed}&backgroundColor=FFC1DA`}
                      alt="Your avatar" sx={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid white', boxShadow: '0 8px 24px rgba(255, 95, 162, 0.3)' }}
                    />
                    <Button variant="outlined" onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))} sx={{ borderRadius: 24 }}>
                      Randomize Avatar
                    </Button>
                  </Box>
                </Box>
              </Fade>
            )}

            {step === 2 && (
              <Fade in>
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>What's your biggest dream?</Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: isDark ? '#E8E2E4' : '#5C4A52' }}>We'll turn this into your first floating cloud!</Typography>
                  <TextField fullWidth placeholder="e.g. Trip to Japan, New Laptop..." value={dream} onChange={e => setDream(e.target.value)} sx={{ ...textFieldSx, mb: 2 }} />
                  <TextField select fullWidth label="Category" value={dreamType} onChange={e => setDreamType(e.target.value)} sx={textFieldSx}>
                    {buildingTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Box>
              </Fade>
            )}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={handleNext} disabled={(step === 0 && !name.trim()) || submitting}
              endIcon={step < 2 ? <ArrowForwardIcon /> : <AutoAwesomeIcon />}
              sx={{ px: 4, borderRadius: 24, fontWeight: 600 }}
            >
              {submitting ? 'Setting up...' : step === 2 ? "Let's Begin" : 'Next'}
            </Button>
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Onboarding;
