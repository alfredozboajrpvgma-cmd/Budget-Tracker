import { useState, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../context/ThemeContext';

const SkyBackground = () => {
  const [hour, setHour] = useState(new Date().getHours());
  const { isDark: themeDark, isLiteMode } = useThemeMode();

  if (isLiteMode) return null;

  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isNight = hour >= 18 || hour < 6;
  const isMorning = hour >= 6 && hour < 10;
  const showStars = isNight || themeDark;

  const stars = useMemo(() => Array.from({ length: 30 }).map(() => ({
    x: Math.random() * 800,
    y: Math.random() * 350,
    r: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2
  })), []);

  const skyPalette = themeDark
    ? { bg: 'linear-gradient(to top, rgba(50,40,55,0.5) 0%, rgba(0,0,0,0) 100%)', sun: '#E8A9C1', layer1: '#4A3650', layer2: '#302235' }
    : isNight
    ? { bg: 'linear-gradient(to top, rgba(115,75,140,0.3) 0%, rgba(0,0,0,0) 100%)', sun: '#FFD1A9', layer1: '#B47AE5', layer2: '#734b8c' }
    : isMorning
    ? { bg: 'linear-gradient(to top, rgba(255,184,210,0.3) 0%, rgba(0,0,0,0) 100%)', sun: '#FFF0A8', layer1: '#FFB8D2', layer2: '#FF8CC6' }
    : { bg: 'linear-gradient(to top, rgba(255,95,162,0.1) 0%, rgba(0,0,0,0) 100%)', sun: '#FFC1DA', layer1: '#FF8CC6', layer2: '#FF5FA2' };

  return (
    <Box sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '50vh', zIndex: 0, pointerEvents: 'none', background: skyPalette.bg,
      maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0))',
      WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0))'
    }}>
      <svg viewBox="0 0 800 600" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
        {showStars && stars.map((star, i) => (
          <motion.circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#FFF"
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <motion.circle cx="400" cy={showStars ? 100 : 80} r={showStars ? 40 : 50} fill={skyPalette.sun} fillOpacity={themeDark ? 0.4 : 0.6}
          animate={{ y: [-5, 5] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }} />
        <motion.path fill={skyPalette.layer1} fillOpacity={themeDark ? '0.15' : '0.25'} d="M -100 350 Q 150 150 400 300 T 900 350 L 900 600 L -100 600 Z"
          animate={{ x: [-20, 20] }} transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }} />
      </svg>
    </Box>
  );
};

export default SkyBackground;
