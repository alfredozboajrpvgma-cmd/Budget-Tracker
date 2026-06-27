import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          style={{ display: 'inline-block', width: 2, height: 12, background: '#FF5FA2', marginLeft: 1, verticalAlign: 'middle' }}
        />
      )}
    </>
  );
}

const SPARKLES = [
  { x: -6, y: 8, delay: 0 },
  { x: 78, y: 2, delay: 0.6 },
  { x: 84, y: 28, delay: 1.2 },
];

const CloudPet = () => {
  const { stats, expenses } = useApp();
  const { isDark, isLiteMode } = useThemeMode();
  const [toastMessage, setToastMessage] = useState('');
  const [hidden, setHidden] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 800);

    const messages = stats?.savingStreak
      ? [`${stats.savingStreak}-day streak! You're on fire! 🔥`, `Sunshine score: ${stats.sunshineScore}! ☀️`]
      : expenses.length === 0
      ? ['Tap + to log your first expense! 💸', 'Create a dream and start saving! ☁️']
      : ['Keep saving, you\'re doing great! 💪', 'Check Insights for spending breakdown! 📊'];
    setToastMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (hidden || isLiteMode) return null;

  const glowColor = isDark ? 'rgba(244, 143, 177, 0.5)' : 'rgba(255, 95, 162, 0.35)';

  return (
    <Box
      onClick={handleClick}
      role="button"
      aria-label="Cloud pet companion"
      sx={{
        position: 'fixed',
        bottom: { xs: 120, sm: 130 },
        right: { xs: 16, sm: 24 },
        zIndex: 50,
        cursor: 'pointer',
        transform: 'scale(0.85)',
        transformOrigin: 'bottom right',
        '&:hover .pet-body': { filter: 'drop-shadow(0 10px 28px rgba(255, 95, 162, 0.45))' },
      }}
    >
      <motion.div
        animate={{ y: [-6, 6], rotate: [-1.5, 1.5] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        {/* Soft glow halo */}
        <motion.div
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Box className="pet-body" sx={{ position: 'relative', width: 88, height: 64, filter: 'drop-shadow(0 6px 18px rgba(255, 95, 162, 0.28))' }}>
          <svg viewBox="0 0 88 64" width="88" height="64" aria-hidden>
            <defs>
              <linearGradient id="pet-cloud-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#FFF0F7" />
                <stop offset="100%" stopColor="#FFD6EA" />
              </linearGradient>
              <linearGradient id="pet-blush" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF8CC6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FF5FA2" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Fluffy cloud body */}
            <path
              d="M 18 48 C 8 48 2 40 2 30 C 2 20 10 12 20 10 C 24 4 32 0 42 0 C 54 0 64 6 68 16 C 76 16 84 24 84 34 C 84 44 76 52 66 52 L 18 52 Z"
              fill="url(#pet-cloud-light)"
              stroke="rgba(255, 143, 198, 0.5)"
              strokeWidth="1.5"
            />

            {/* Subtle highlight */}
            <ellipse cx="34" cy="18" rx="18" ry="8" fill="white" opacity={0.55} />

            {/* Blush cheeks */}
            <ellipse cx="26" cy="36" rx="7" ry="4.5" fill="url(#pet-blush)" />
            <ellipse cx="58" cy="36" rx="7" ry="4.5" fill="url(#pet-blush)" />

            {/* Eyes */}
            <motion.g
              animate={isHappy ? { scaleY: [1, 0.15, 1] } : { scaleY: [1, 0.08, 1] }}
              transition={isHappy
                ? { duration: 0.25, repeat: 2 }
                : { duration: 0.12, repeat: Infinity, repeatDelay: 3.5 }}
              style={{ transformOrigin: '42px 30px' }}
            >
              <ellipse cx="34" cy="30" rx="4.5" ry="5" fill="#3D2A35" />
              <ellipse cx="50" cy="30" rx="4.5" ry="5" fill="#3D2A35" />
              <circle cx="35.5" cy="28.5" r="1.6" fill="white" opacity="0.9" />
              <circle cx="51.5" cy="28.5" r="1.6" fill="white" opacity="0.9" />
            </motion.g>

            {/* Mouth */}
            <motion.path
              d={isHappy ? 'M 36 40 Q 42 47 48 40' : 'M 37 40 Q 42 44 47 40'}
              fill="none"
              stroke="#FF5FA2"
              strokeWidth="2"
              strokeLinecap="round"
              animate={isHappy ? { d: ['M 37 40 Q 42 44 47 40', 'M 36 40 Q 42 47 48 40', 'M 37 40 Q 42 44 47 40'] } : {}}
              transition={{ duration: 0.4 }}
            />
          </svg>

          {/* Floating sparkles */}
          {SPARKLES.map((s, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                width: 8,
                height: 8,
                pointerEvents: 'none',
              }}
            >
              <svg viewBox="0 0 10 10" width="8" height="8">
                <path
                  d="M 5 0 L 6 4 L 10 5 L 6 6 L 5 10 L 4 6 L 0 5 L 4 4 Z"
                  fill="#FF8CC6"
                />
              </svg>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 14,
              background: isDark
                ? 'linear-gradient(145deg, #2D282A 0%, #252123 100%)'
                : 'linear-gradient(145deg, #FFFFFF 0%, #FFF6FA 100%)',
              padding: '14px 18px',
              borderRadius: 20,
              boxShadow: isDark
                ? '0 8px 32px rgba(244, 143, 177, 0.2)'
                : '0 8px 30px rgba(255, 95, 162, 0.22)',
              minWidth: 180,
              maxWidth: 240,
              border: isDark
                ? '1.5px solid rgba(244, 143, 177, 0.2)'
                : '1.5px solid rgba(255, 95, 162, 0.15)',
            }}
          >
            <Box sx={{
              position: 'absolute',
              bottom: -8,
              right: 22,
              width: 16,
              height: 16,
              background: isDark ? '#252123' : '#FFF6FA',
              transform: 'rotate(45deg)',
              borderRight: isDark ? '1.5px solid rgba(244, 143, 177, 0.2)' : '1.5px solid rgba(255, 95, 162, 0.15)',
              borderBottom: isDark ? '1.5px solid rgba(244, 143, 177, 0.2)' : '1.5px solid rgba(255, 95, 162, 0.15)',
            }} />
            <Typography sx={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? '#E8E2E4' : '#5C4A52',
              lineHeight: 1.5,
              position: 'relative',
              zIndex: 1,
            }}>
              <TypingText text={toastMessage} />
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CloudPet;
