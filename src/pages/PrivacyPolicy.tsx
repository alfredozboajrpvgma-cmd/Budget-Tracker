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

export default function PrivacyPolicy() {
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

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, color: '#FF5FA2' }}>Privacy Policy</Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#9E8DAE' : '#B0A3A8', fontStyle: 'italic', mb: 5 }}>Last Updated: June 27, 2026</Typography>

        <Box sx={contentSx(isDark)}>
          <p>At PinkCloud, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal data when you use the PinkCloud budget tracking application.</p>

          <h5>1. Information We Collect</h5>
          <p><strong>Account Information:</strong> When you create an account, we collect your email address, a generated user ID, and an optional display name to provide you with a personalized experience.</p>
          <p><strong>Financial Data:</strong> PinkCloud stores the expenses, budgets, savings goals, and transactions that you manually input into the app. We do not link directly to your bank accounts, and we do not store credit card numbers or banking credentials.</p>
          <p><strong>Usage Data:</strong> We may collect anonymized usage data to understand how our app is used and to improve the overall user experience.</p>

          <h5>2. How We Use Your Information</h5>
          <p>We use your financial data strictly to provide the core functionality of PinkCloud—tracking your budget, visualizing your spending habits, and calculating your Sunshine Score. We do not sell your personal or financial data to third-party data brokers or advertisers.</p>

          <h5>3. Data Storage and Security</h5>
          <p>Your data is securely stored using Supabase, which implements enterprise-grade security and encryption. While we strive to use commercially acceptable means to protect your personal information, remember that no method of transmission over the internet is 100% secure.</p>

          <h5>4. Cookies and Local Storage</h5>
          <p>PinkCloud uses local storage and cookies to persist your session securely and to store local preferences (such as Dark Mode or Lite Mode settings).</p>

          <h5>5. Your Rights</h5>
          <p>You have the right to access, modify, or delete your personal data at any time. You can request full account deletion from the app settings, which will permanently remove all your financial records from our active databases.</p>

          <h5>6. Contact Us</h5>
          <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us through the Help &amp; Support section in the app.</p>

          <h5>7. California &amp; Colorado Privacy Rights (CCPA/CPA)</h5>
          <p>If you are a resident of California or Colorado, you have specific rights regarding your personal information under the California Consumer Privacy Act (CCPA) and the Colorado Privacy Act (CPA). These rights include:</p>
          <p><strong>Right to Know &amp; Access:</strong> You may request disclosure of the specific pieces of personal information we have collected about you over the past 12 months.<br/>
          <strong>Right to Deletion:</strong> You may request the deletion of your personal data, subject to certain exceptions.<br/>
          <strong>Right to Opt-Out:</strong> We do not sell your personal data. However, you have the right to opt-out of the processing of your personal data for targeted advertising.<br/>
          <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</p>
          <p>To exercise any of these rights, please contact us through the Help &amp; Support section in the app. We will verify your request and respond within 45 days as required by applicable law.</p>
        </Box>
      </Container>
    </Box>
  );
}
