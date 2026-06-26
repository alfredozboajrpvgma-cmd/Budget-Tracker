import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Link } from '@mui/material';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';

interface CloudGoalProps {
  title: string;
  progress: number; // 0 to 100
  size?: 'small' | 'medium' | 'large';
  delay?: number;
  onClick?: () => void;
  dragConstraints?: React.RefObject<Element>;
  ownerName?: string;
  ownerId?: string;
  amount?: number;
  currencySymbol?: string;
}

const CloudGoal = ({ title, progress, size = 'small', delay = 0, onClick, dragConstraints, ownerName, ownerId, amount, currencySymbol = '' }: CloudGoalProps) => {
  const { setPublicProfileId, user } = useApp();
  const { isDark } = useThemeMode();
  const isCompleted = progress >= 100;
  // Make sure the ID is valid for SVG url(#id) references by stripping special chars
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '');
  const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);
  const id = `${safeTitle}-${uniqueId}`;

  const isOtherOwner = ownerId && user && ownerId !== user.id;

  const getBaseSize = () => {
    switch(size) {
      case 'large': return { w: 180, h: 120 };
      case 'medium': return { w: 150, h: 100 };
      case 'small':
      default: return { w: 110, h: 70 };
    }
  };
  const { w, h } = getBaseSize();

  const fluffyCloudPath = "M 35 70 C 20 70 10 60 10 45 C 10 32 20 22 32 20 C 37 10 48 5 60 5 C 75 5 88 15 92 30 C 102 30 110 38 110 48 C 110 58 102 70 90 70 Z";

  let liquidColorStart = "#FF5FA2";
  let liquidColorEnd = "#FFC1DA";
  let completedColorStart = "#FF8CC6";
  let completedColorEnd = "#FFC1DA";
  let dropShadowColor = isCompleted ? "rgba(255, 95, 162, 0.5)" : "rgba(255, 95, 162, 0.15)";
  let textCompletedColorLight = "#FF5FA2";
  let textCompletedColorDark = "#FFC1DA";

  if (isOtherOwner) {
    dropShadowColor = isCompleted ? "rgba(38, 198, 218, 0.5)" : "rgba(38, 198, 218, 0.15)";
    completedColorStart = "#26C6DA";
    completedColorEnd = "#B2EBF2";
    textCompletedColorLight = "#00ACC1";
    textCompletedColorDark = "#80DEEA";

    if (progress < 40) {
      liquidColorStart = "#81D4FA"; 
      liquidColorEnd = "#E1F5FE";
    } else if (progress < 80) {
      liquidColorStart = "#4DD0E1"; 
      liquidColorEnd = "#B2EBF2";
    } else {
      liquidColorStart = "#26C6DA"; 
      liquidColorEnd = "#80DEEA";
    }
  } else {
    if (progress < 40) {
      liquidColorStart = "#42A5F5"; // Cool Blue
      liquidColorEnd = "#90CAF9";
    } else if (progress < 80) {
      liquidColorStart = "#AB47BC"; // Purple
      liquidColorEnd = "#E1BEE7";
    }
  }

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      whileDrag={{ scale: 1.05, zIndex: 10, cursor: 'grabbing' }}
      onClick={onClick}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab' }}
    >
      <motion.div
        animate={{ y: [-5, 5] }}
        transition={{ y: { duration: 3 + Math.random() * 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay } }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Box sx={{ 
          width: w, 
          height: h, 
          position: 'relative',
          filter: `drop-shadow(0px ${isCompleted ? '12px 24px' : '8px 16px'} ${dropShadowColor})`
        }}>
          <svg viewBox="0 0 120 80" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <clipPath id={`cloud-clip-${id}`}>
                <path d={fluffyCloudPath} />
              </clipPath>
              {/* Upward filling gradient */}
              <linearGradient id={`cloud-grad-${id}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={isCompleted ? completedColorStart : liquidColorStart} />
                <stop offset="100%" stopColor={isCompleted ? completedColorEnd : liquidColorEnd} />
              </linearGradient>

              {/* Inner Shadow for Hollow Glass Depth */}
              <filter id={`inner-shadow-${id}`}>
                <feOffset dx="0" dy="4"/>
                <feGaussianBlur stdDeviation="4" result="offset-blur"/>
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                <feFlood floodColor="black" floodOpacity="0.08" result="color"/>
                <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
                <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
              </filter>
            </defs>

            {/* Base Cloud (Solid pink if completed, else hollow glass with inner shadow) */}
            <path 
              d={fluffyCloudPath} 
              fill={isCompleted ? `url(#cloud-grad-${id})` : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.4)")} 
              filter={isCompleted ? "" : `url(#inner-shadow-${id})`} 
            />

            {/* Filled Cloud (Liquid Wave Progress) - only show if not completed */}
            {!isCompleted && (
              <g clipPath={`url(#cloud-clip-${id})`}>
                <motion.g
                  initial={{ y: 80 }}
                  // Ensure wave is visible even at 0% progress
                  animate={{ y: 55 - (progress / 100 * 60) }}
                  transition={{ type: "spring", stiffness: 40, damping: 15, delay: delay + 0.2 }}
                >
                  {/* Wavy path drifting horizontally */}
                  <motion.path 
                    d="M 0 10 Q 30 0 60 10 T 120 10 T 180 10 T 240 10 L 240 120 L 0 120 Z"
                    fill={`url(#cloud-grad-${id})`}
                    opacity={0.85}
                    animate={{ x: [0, -120] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 3 }}
                  />
                </motion.g>
              </g>
            )}

            {/* Glass Reflection Overlays */}
            <path d={fluffyCloudPath} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={isCompleted ? "2" : "3"} />
            <path d={fluffyCloudPath} fill="none" stroke="rgba(0, 0, 0, 0.02)" strokeWidth="1" />
          </svg>
          
          {amount !== undefined && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 5,
              mt: -0.5,
            }}>
              <Typography variant="body2" sx={{
                fontWeight: 900,
                color: isCompleted ? (isDark ? '#FFF' : '#FFF') : (isDark ? '#FFF' : '#FFF'),
                textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
                fontSize: size === 'large' ? '1.2rem' : size === 'medium' ? '1rem' : '0.85rem'
              }}>
                {currencySymbol}{Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}
              </Typography>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* Text perfectly positioned outside the cloud (no overlay) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}
      >
        <Typography variant="body1" sx={{ fontWeight: 800, color: isDark ? '#FFF' : '#333', textAlign: 'center', lineHeight: 1.2, textShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : 'none' }}>
          {title}
        </Typography>
        {isOtherOwner && ownerName && ownerId && (
          <Link
            component="button"
            onClick={(e) => {
              e.stopPropagation();
              setPublicProfileId(ownerId);
            }}
            sx={{ fontWeight: 600, color: isOtherOwner ? '#26C6DA' : '#FF8CC6', display: 'block', mt: 0.2, textDecorationColor: isOtherOwner ? 'rgba(38, 198, 218, 0.4)' : 'rgba(255, 140, 198, 0.4)', textUnderlineOffset: 2, cursor: 'pointer', '&:hover': { color: isOtherOwner ? '#00ACC1' : '#FF5FA2' } }}
          >
            By {ownerName}
          </Link>
        )}
        <Typography variant="body2" sx={{ fontWeight: 800, color: isCompleted ? (isDark ? textCompletedColorDark : textCompletedColorLight) : (isDark ? '#E8E2E4' : '#666'), mt: 0.5, textShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : 'none' }}>
          {progress}%
        </Typography>
      </motion.div>
    </motion.div>
  );
};

export default CloudGoal;
