import { Card, Typography, Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';

import FastfoodRoundedIcon from '@mui/icons-material/FastfoodRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import TheatersRoundedIcon from '@mui/icons-material/TheatersRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

import type { ExpenseCategory } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useThemeMode } from '../context/ThemeContext';
import { toNumber } from '../utils/format';
export type { ExpenseCategory };

interface FloatingExpenseCardProps {
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  delay?: number;
  pending?: boolean;
}

const getCategoryIcon = (category: ExpenseCategory) => {
  switch(category) {
    case 'Food': return <FastfoodRoundedIcon sx={{ color: '#FFB74D', fontSize: 20 }} />;
    case 'Transportation': return <DirectionsCarRoundedIcon sx={{ color: '#4FC3F7', fontSize: 20 }} />;
    case 'School': return <SchoolRoundedIcon sx={{ color: '#BA68C8', fontSize: 20 }} />;
    case 'Bills': return <ReceiptRoundedIcon sx={{ color: '#E57373', fontSize: 20 }} />;
    case 'Shopping': return <LocalMallRoundedIcon sx={{ color: '#F06292', fontSize: 20 }} />;
    case 'Entertainment': return <TheatersRoundedIcon sx={{ color: '#9575CD', fontSize: 20 }} />;
    default: return <CategoryRoundedIcon sx={{ color: '#81C784', fontSize: 20 }} />;
  }
};

const FloatingExpenseCard = ({ amount, category, note, delay = 0, pending = false }: FloatingExpenseCardProps) => {
  const { fmt } = useCurrency();
  const { isDark } = useThemeMode();
  const safeAmount = toNumber(amount);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, delay }}
      whileHover={{ y: -5 }}
    >
      <Card
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderLeft: '4px solid #FFC1DA',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 32px 0 rgba(255, 95, 162, 0.2)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: '16px', 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 246, 250, 1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
          }}>
            {getCategoryIcon(category)}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {note}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip 
                label={category} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem', 
                  backgroundColor: isDark ? 'rgba(255, 193, 218, 0.15)' : 'rgba(255, 193, 218, 0.3)',
                  color: isDark ? '#FF8CC6' : '#E04E8E'
                }} 
              />
              {pending && (
                <Chip
                  label="Pending sync"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    backgroundColor: isDark ? 'rgba(144, 202, 249, 0.15)' : 'rgba(66, 165, 245, 0.15)',
                    color: isDark ? '#90CAF9' : '#1976D2',
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body1" sx={{ fontWeight: 800, color: isDark ? '#E8E2E4' : '#5C4A52', lineHeight: 1.2 }}>
            -{fmt(safeAmount)}
          </Typography>
        </Box>
      </Card>
    </motion.div>
  );
};

export default FloatingExpenseCard;
