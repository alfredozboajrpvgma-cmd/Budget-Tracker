import { forwardRef, useImperativeHandle, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Box } from '@mui/material';
import { useThemeMode } from '../context/ThemeContext';
import { HCAPTCHA_SITE_KEY } from '../utils/captcha';

import type { AuthCaptchaHandle } from './AuthCaptcha.types';

interface AuthCaptchaProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

const AuthCaptcha = forwardRef<AuthCaptchaHandle, AuthCaptchaProps>(function AuthCaptcha(
  { onVerify, onExpire },
  ref,
) {
  const { isDark } = useThemeMode();
  const captchaRef = useRef<HCaptcha>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      captchaRef.current?.resetCaptcha();
    },
  }));

  if (!HCAPTCHA_SITE_KEY) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <HCaptcha
        ref={captchaRef}
        sitekey={HCAPTCHA_SITE_KEY}
        onVerify={onVerify}
        onExpire={onExpire}
        theme={isDark ? 'dark' : 'light'}
      />
    </Box>
  );
});

export default AuthCaptcha;
