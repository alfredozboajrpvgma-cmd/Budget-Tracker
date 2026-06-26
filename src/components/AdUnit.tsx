import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface AdUnitProps {
  adSlot: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

const PUBLISHER_ID = 'ca-pub-2648688590727817';

export default function AdUnit({ adSlot, style, format = 'auto', responsive = true }: AdUnitProps) {
  const adLoaded = useRef(false);

  useEffect(() => {
    // Only push to adsbygoogle once per component mount (prevents strict mode crashes)
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

  return (
    <Box sx={{ width: '100%', overflow: 'hidden', textAlign: 'center', my: 2 }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </Box>
  );
}
