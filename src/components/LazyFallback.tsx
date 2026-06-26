import { Box, CircularProgress } from '@mui/material';

interface LazyFallbackProps {
  minHeight?: number | string;
}

export default function LazyFallback({ minHeight = 200 }: LazyFallbackProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight, width: '100%' }}>
      <CircularProgress color="primary" size={32} />
    </Box>
  );
}
