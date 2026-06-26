import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface IslandBuildingProps {
  id: number;
  title: string;
  progress: number;
  type: string;
  delay?: number;
}

const BuildingVariants: Record<string, string[][]> = {
  'Emergency Fund': [
    ['🛡️', '🗼', '🏯', '🏰', '👑🏰'], // Medieval
  ],
  'Education': [
    ['📚', '🏫', '🎓', '🏛️', '🎓🏛️'], // Campus
    ['📖', '📚', '🏚️', '🏛️', '📖🏛️'], // Library
  ],
  'Travel': [
    ['⛺', '🏕️', '🛖', '🏡', '🏖️'], // Beach Resort
    ['🚣', '⛵', '🚢', '⛴️', '⚓'], // Harbor
    ['🧱', '🏗️', '🗼', '💡', '🗼✨'], // Lighthouse
    ['⛺', '🏕️', '⚓', '✈️', '🎈'], // Airship Port
  ],
  'Laptop': [
    ['🔧', '🏪', '🏢', '🏙️', '🗼'], // Tech Center
  ],
  'Business': [
    ['🛒', '🏪', '🏬', '🏢', '🏙️'], // Commercial
  ],
  'House': [
    ['🪵', '🧱', '🛖', '🏡', '🏰'], // Estate
    ['⛺', '🏡', '🏛️', '🏯', '👑🏯'], // Palace
  ],
};

const getBuildingStage = (type: string, progress: number, id: number) => {
  const variants = BuildingVariants[type] || BuildingVariants['House'];
  const variantIndex = id % variants.length;
  const stages = variants[variantIndex];
  
  if (progress < 25) return stages[0];
  if (progress < 50) return stages[1];
  if (progress < 75) return stages[2];
  if (progress < 100) return stages[3];
  return stages[4];
};

const IslandBuilding = ({ id, title, progress, type, delay = 0 }: IslandBuildingProps) => {
  const isCompleted = progress >= 100;
  const icon = getBuildingStage(type, progress, id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, type: 'spring' }}
      whileHover={{ y: -5, scale: 1.05 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
    >
      {/* Celebration Effects if Completed */}
      {isCompleted && (
        <Box sx={{ position: 'absolute', top: -30, width: '100%', height: 60, pointerEvents: 'none', zIndex: 10 }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', left: '10%', top: '30%', fontSize: '1.2rem' }}
          >
            🎉
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, delay: 0.5, repeat: Infinity }}
            style={{ position: 'absolute', right: '10%', top: '40%', fontSize: '1rem' }}
          >
            ✨
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: -10, opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '-10px', fontSize: '0.85rem', color: '#FF5FA2', fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            Dream Achieved!
          </motion.div>
        </Box>
      )}

      {/* Building Container */}
      <Box sx={{ 
        position: 'relative', 
        width: 120, 
        height: 150, 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        {/* Base Island / Ground */}
        <Box sx={{
          width: 100,
          height: 35,
          background: isCompleted ? 'linear-gradient(145deg, #E8F5E9, #C8E6C9)' : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          borderRadius: '50%',
          position: 'absolute',
          bottom: 0,
          boxShadow: isCompleted 
            ? '0 10px 20px rgba(76, 175, 80, 0.3), inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.8)' 
            : '0 8px 16px rgba(255, 95, 162, 0.15), inset 0 -4px 8px rgba(255,193,218,0.3), inset 0 4px 8px #ffffff',
          border: isCompleted ? '1px solid #A5D6A7' : '1px solid #FFF',
          transition: 'all 1s'
        }} />

        {/* The Building Stage */}
        <Box sx={{
          width: 80,
          height: 120,
          position: 'relative',
          bottom: 15,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
          {/* Progress Fill Background behind the emoji */}
          {!isCompleted && (
            <Box sx={{ position: 'absolute', bottom: 0, width: 40, height: 100, background: 'rgba(255,193,218,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: delay + 0.5 }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(255,193,218,0.6), rgba(255,95,162,0.6))',
                  position: 'absolute',
                  bottom: 0
                }}
              />
            </Box>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={icon}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: isCompleted ? 1.5 : 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              style={{ fontSize: '3.5rem', zIndex: 2, position: 'relative', bottom: isCompleted ? 10 : 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
            >
              {icon}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* Title & Progress */}
      <Box sx={{ 
        textAlign: 'center', mt: 1, 
        background: isCompleted ? 'linear-gradient(145deg, #E8F5E9, #C8E6C9)' : 'linear-gradient(145deg, #ffffff, #FFF0F7)', 
        px: 2, py: 1, 
        borderRadius: 24, 
        boxShadow: isCompleted ? '0 6px 16px rgba(76, 175, 80, 0.2)' : '0 6px 16px rgba(255, 95, 162, 0.12)',
        border: '1px solid rgba(255,255,255,0.8)',
        zIndex: 2,
        width: 140
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isCompleted ? '#2E7D32' : '#5C4A52', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
        
        {/* Micro Progress Bar */}
        {!isCompleted ? (
          <Box sx={{ width: '100%', height: 6, background: 'rgba(255, 95, 162, 0.15)', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #FFC1DA, #FF5FA2)', borderRadius: 3 }}
            />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#4CAF50', display: 'block' }}>
            Completed! ✨
          </Typography>
        )}
      </Box>
    </motion.div>
  );
};

export default IslandBuilding;
