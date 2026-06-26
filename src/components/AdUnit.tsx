import { useEffect, useRef } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useThemeMode } from '../context/ThemeContext';

interface AdUnitProps {
  adSlot: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  variant?: 'inline' | 'sticky';
}

const PUBLISHER_ID = 'ca-pub-2648688590727817';

export default function AdUnit({ adSlot, style, format = 'auto', responsive = true, variant = 'inline' }: AdUnitProps) {
  const adLoaded = useRef(false);
  const { isDark } = useThemeMode();

  useEffect(() => {
    if (adLoaded.current) return;

    try {
      const w = window as any;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      adLoaded.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  const adElement = (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', minWidth: '250px', ...style }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );

  if (variant === 'sticky') {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {adElement}
      </Box>
    );
  }

  return (
    <Card
      sx={{
        width: '100%',
        my: 3,
        p: 1.5,
        borderRadius: '24px',
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120, // Prevents layout shifts
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          width: '100%',
          textAlign: 'right',
          fontSize: '0.65rem',
          color: 'text.secondary',
          opacity: 0.7,
          mb: 1,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Advertisement
      </Typography>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {adElement}
      </Box>
    </Card>
  );
}
