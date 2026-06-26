import { useState, useRef, lazy, Suspense } from 'react';
import { Box, Button, TextField, Typography, Card, Alert, IconButton, InputAdornment } from '@mui/material';
import { motion } from 'framer-motion';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';
import { isCaptchaEnabled } from '../utils/captcha';
import type { AuthCaptchaHandle } from './AuthCaptcha.types';

const AuthCaptcha = lazy(() => import('./AuthCaptcha'));

const AuthScreen = () => {
  const { isDark } = useThemeMode();
  const { login, verifyEmailCode, resendConfirmationCode } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState(false);
  const [isSignupVerification, setIsSignupVerification] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<AuthCaptchaHandle>(null);

  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const resetCaptcha = () => {
    captchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleLogin = async () => {
    if (isCaptchaEnabled && !captchaToken) {
      setError('Please complete the captcha challenge.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await login({
        provider: 'email',
        email: email || undefined,
        password: password || undefined,
        mode: isLogin ? 'login' : 'signup',
        captchaToken: captchaToken ?? undefined,
      });
      if (res && res.needsConfirmation) {
        setConfirmationMode(true);
        setIsSignupVerification(!isLogin);
      }
      resetCaptcha();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await verifyEmailCode(email, otpCode);
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendConfirmationCode(email);
      setSuccessMsg('A new code has been sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, px: 3, pt: 3, pb: 2, zIndex: 10, display: 'flex', alignItems: 'center', pointerEvents: 'none', background: isDark ? 'rgba(40,28,58,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid rgba(255, 95, 162, ${isDark ? '0.2' : '0.1'})` }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#FF5FA2', display: 'flex', alignItems: 'center', gap: 1, textShadow: '0 2px 10px rgba(255, 95, 162, 0.2)' }}>
          PinkCloud
        </Typography>
      </Box>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '90%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <Card sx={{ padding: 4, textAlign: 'center' }}>
          <Typography variant="h3" color="primary" gutterBottom>PinkCloud</Typography>
          <Typography variant="body1" sx={{ mb: 4, color: isDark ? '#B8A5C8' : '#5C4A52' }}>Build your dream cloud today.</Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left', borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left', borderRadius: 2 }} onClose={() => setSuccessMsg('')}>
              {successMsg}
            </Alert>
          )}

          {!confirmationMode ? (
            <Box>
            <TextField fullWidth placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#FF5FA2' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
            <TextField fullWidth type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#FF5FA2' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#FF5FA2' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Suspense fallback={null}>
              <AuthCaptcha
                ref={captchaRef}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
              />
            </Suspense>
            <Button
              fullWidth
              variant="contained"
              disabled={loading || !email || !password || (isCaptchaEnabled && !captchaToken)}
              onClick={() => handleLogin('email')}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
            
            <Typography variant="body2" sx={{ mt: 1, color: isDark ? '#B8A5C8' : '#5C4A52' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); setSuccessMsg(''); resetCaptcha(); }} style={{ color: '#FF5FA2', textDecoration: 'none', fontWeight: 'bold' }}>
                {isLogin ? "Sign up" : "Log in"}
              </a>
            </Typography>
          </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <MarkEmailReadIcon sx={{ fontSize: 48, color: '#FF5FA2' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#E8E2E4' : '#5C4A52' }}>
                {isSignupVerification ? 'Verify your account' : 'Confirm your email'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: isDark ? '#B8A5C8' : '#5C4A52' }}>
                Enter the code sent to <strong>{email}</strong>.
              </Typography>
              <TextField 
                fullWidth 
                placeholder="000000"
                value={otpCode} 
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                slotProps={{
                  htmlInput: {
                    maxLength: 6,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.35rem', fontWeight: 'bold' },
                  },
                }}
              />
              <Button fullWidth variant="contained" disabled={loading || otpCode.length < 6} onClick={handleVerify} sx={{ py: 1.5, mb: 2 }}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              <Typography variant="body2" sx={{ mt: 1, color: isDark ? '#B8A5C8' : '#5C4A52' }}>
                Didn't get the code? <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }} style={{ color: '#FF5FA2', textDecoration: 'none', fontWeight: 'bold' }}>Resend code</a>
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setConfirmationMode(false); setIsSignupVerification(false); setOtpCode(''); setError(''); setSuccessMsg(''); resetCaptcha(); }} style={{ color: '#6A5A62', textDecoration: 'none' }}>
                  ← {isSignupVerification ? 'Back to sign up' : 'Back to login'}
                </a>
              </Typography>
            </Box>
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 4, color: '#6A5A62' }}>
            By continuing, you agree to PinkCloud's <a href="#" onClick={(e) => { e.preventDefault(); setModalType('terms'); }} style={{ color: '#FF5FA2', textDecoration: 'none', fontWeight: 'bold' }}>Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setModalType('privacy'); }} style={{ color: '#FF5FA2', textDecoration: 'none', fontWeight: 'bold' }}>Privacy Policy</a>
          </Typography>
        </Card>
      </motion.div>

      {/* Modals for Terms and Privacy */}
      {modalType && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }} onClick={() => setModalType(null)}>
          <Card sx={{ p: 4, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#FF5FA2' }}>
              {modalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#E8E2E4' : '#5C4A52', mb: 3 }}>
              {modalType === 'terms' 
                ? 'Welcome to PinkCloud. By using our service, you agree to build your dream clouds responsibly. Do not use PinkCloud for any illegal activities. All your data belongs to you.'
                : 'At PinkCloud, we take your privacy seriously. We only store information necessary to provide you with the best budgeting experience. We do not sell your personal data to third parties.'}
            </Typography>
            <Button variant="contained" onClick={() => setModalType(null)} sx={{ borderRadius: 3, fontWeight: 800 }}>
              Got it
            </Button>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AuthScreen;
