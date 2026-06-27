import { Box, Typography, Container, Button } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useThemeMode } from '../context/ThemeContext';

const contentSx = (isDark: boolean) => ({
  color: isDark ? '#E8E2E4' : '#5C4A52',
  maxWidth: '65ch',
  '& p': { mb: 2.5, lineHeight: 1.8, fontSize: '0.935rem' },
  '& h5': { fontWeight: 800, mt: 5, mb: 1.5, color: isDark ? '#FFF' : '#333', fontSize: '1.1rem' },
  '& strong': { color: isDark ? '#FFC1DA' : '#333', fontWeight: 700 },
});

export default function TermsOfService() {
  const { isDark } = useThemeMode();

  return (
    <Box sx={{ 
      height: '100dvh', 
      overflowY: 'auto',
      background: isDark ? 'linear-gradient(135deg, #1A1224 0%, #281C3A 100%)' : 'linear-gradient(135deg, #FFF0F7 0%, #FFFFFF 100%)', 
      backgroundAttachment: 'fixed',
      py: 6 
    }}>
      <Container maxWidth="md">
        <Button
          onClick={() => window.location.href = '/'}
          startIcon={<ArrowBackRoundedIcon />}
          sx={{
            mb: 4,
            fontWeight: 700,
            color: '#FF5FA2',
            border: '1.5px solid rgba(255, 95, 162, 0.35)',
            borderRadius: 3,
            px: 2,
            py: 0.8,
            textTransform: 'none',
            '&:hover': { background: 'rgba(255, 95, 162, 0.08)', borderColor: '#FF5FA2' },
          }}
        >
          Back to App
        </Button>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, color: '#FF5FA2' }}>Terms of Service</Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#9E8DAE' : '#B0A3A8', fontStyle: 'italic', mb: 5 }}>Last Updated: June 27, 2026</Typography>

        <Box sx={contentSx(isDark)}>
          <p>Welcome to PinkCloud. By accessing or using our budget tracking application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

          <h5>1. Use of the Service</h5>
          <p>PinkCloud provides tools for manually tracking personal budgets and expenses. The service is provided for informational and educational purposes only and does not constitute professional financial advice. You are solely responsible for your financial decisions.</p>

          <h5>2. User Accounts</h5>
          <p>When you create an account with us, you must provide information that is accurate and current. You are responsible for safeguarding the password or authentication mechanism that you use to access the service. PinkCloud cannot be held liable for any loss or damage arising from your failure to protect your account.</p>

          <h5>3. Acceptable Use</h5>
          <p>You agree not to use the application to store illicit, illegal, or highly sensitive confidential information that falls outside the scope of personal budget tracking. You must not attempt to exploit, hack, or disrupt the services provided by PinkCloud.</p>

          <h5>4. Intellectual Property</h5>
          <p>The service and its original content, features, and functionality are and will remain the exclusive property of PinkCloud and its licensors. Our branding, logos, and specific visual design cannot be used in connection with any product or service without our prior written consent.</p>

          <h5>5. Termination</h5>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the service will immediately cease.</p>

          <h5>6. Limitation of Liability</h5>
          <p>In no event shall PinkCloud, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>

          <h5>7. Changes to Terms</h5>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.</p>
        </Box>
      </Container>
    </Box>
  );
}
