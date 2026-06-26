import { useState, useEffect } from 'react';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    // Method 1: Try to fetch a known ad script
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement ad-banner textads banner-ads';
    testAd.style.position = 'absolute';
    testAd.style.left = '-9999px';
    testAd.style.top = '-9999px';
    testAd.style.height = '1px';
    testAd.style.width = '1px';
    document.body.appendChild(testAd);

    // Give ad blockers time to remove/hide the element
    setTimeout(() => {
      const isBlocked =
        testAd.offsetHeight === 0 ||
        testAd.offsetParent === null ||
        testAd.clientHeight === 0 ||
        getComputedStyle(testAd).display === 'none' ||
        getComputedStyle(testAd).visibility === 'hidden';

      if (testAd.parentNode) {
        testAd.parentNode.removeChild(testAd);
      }

      if (isBlocked) {
        resolve(true);
        return;
      }

      // Method 2: Check if the Google AdSense script loaded
      const adScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      if (adScript) {
        // Script tag exists, check if it was actually blocked
        const w = window as any;
        if (!w.adsbygoogle || typeof w.adsbygoogle.loaded === 'undefined') {
          // Give it a bit more time
          setTimeout(() => {
            resolve(!w.adsbygoogle || w.adsbygoogle.length === 0);
          }, 1000);
          return;
        }
      }

      resolve(false);
    }, 300);
  });
}

const DISMISSED_KEY = 'pinkcloud_adblock_dismissed';

export default function AdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed within this session
    if (sessionStorage.getItem(DISMISSED_KEY) === 'true') {
      return;
    }

    // Wait for page to fully load before checking
    const timer = setTimeout(async () => {
      const blocked = await detectAdBlocker();
      setAdBlockDetected(blocked);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!adBlockDetected || dismissed) return null;

  return (
    <Dialog
      open={true}
      onClose={handleDismiss}
      {...({
        PaperProps: {
          sx: {
            borderRadius: '24px',
            p: 2,
            maxWidth: '420px',
            background: 'linear-gradient(145deg, #fff5f9, #ffffff)',
            boxShadow: '0 20px 60px rgba(255, 95, 162, 0.15)',
          },
        },
      } as any)}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF5FA2, #FF8A65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <BlockIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, mb: 1.5, color: '#2d2d2d' }}
        >
          Ad Blocker Detected
        </Typography>

        <Typography
          sx={{
            color: '#666',
            mb: 3,
            lineHeight: 1.7,
            fontSize: '0.95rem',
          }}
        >
          Pink Cloud is a free application supported by ads. Please consider
          disabling your ad blocker to help us keep this app free and
          continuously improved for everyone.
        </Typography>

        <Button
          onClick={handleDismiss}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF5FA2, #FF8A65)',
            fontWeight: 800,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(255, 95, 162, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #e8508f, #e07a58)',
            },
          }}
        >
          I Understand
        </Button>

        <Typography
          sx={{
            mt: 2,
            fontSize: '0.78rem',
            color: '#aaa',
          }}
        >
          You can continue using the app, but some features may be limited.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
