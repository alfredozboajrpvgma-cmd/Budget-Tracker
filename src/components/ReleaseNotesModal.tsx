import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { useThemeMode } from '../context/ThemeContext';
import { APP_VERSION } from '../utils/version';
import {
  RELEASE_FEATURES,
  type ReleaseFeatureIcon,
} from '../utils/releaseNotes';

const FEATURE_ICON_MAP: Record<ReleaseFeatureIcon, { Icon: SvgIconComponent; color: string }> = {
  dashboard: { Icon: WbSunnyRoundedIcon, color: '#FFB74D' },
  insights: { Icon: InsertChartRoundedIcon, color: '#CE93D8' },
  notifications: { Icon: NotificationsRoundedIcon, color: '#FF5FA2' },
  install: { Icon: InstallMobileRoundedIcon, color: '#FF8AB5' },
  personalization: { Icon: TuneRoundedIcon, color: '#7C4DFF' },
};

interface ReleaseNotesModalProps {
  open: boolean;
  onClose: () => void;
}

const ReleaseNotesModal = ({ open, onClose }: ReleaseNotesModalProps) => {
  const { isDark } = useThemeMode();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '28px',
            overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(180deg, #2E1F42 0%, #261A36 100%)'
              : 'linear-gradient(180deg, #FFF6FA 0%, #ffffff 100%)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pt: 3, px: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FFC1DA, #FF5FA2)',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(255, 95, 162, 0.35)',
            }}
          >
            <AutoAwesomeRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF5FA2', lineHeight: 1.2 }}>
              What's New ☁️
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Version {APP_VERSION}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
          We've been busy making PinkCloud even better! Here's what's new.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2, maxHeight: '55vh', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {RELEASE_FEATURES.map((feature) => {
            const { Icon, color } = FEATURE_ICON_MAP[feature.icon];
            return (
              <Box
                key={feature.title}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '16px',
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 95, 162, 0.06)',
                  border: isDark
                    ? '1px solid rgba(244, 143, 177, 0.12)'
                    : '1px solid rgba(255, 95, 162, 0.1)',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isDark ? `${color}22` : `${color}18`,
                    color,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.25 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          disableElevation
          sx={{
            borderRadius: '14px',
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '1.05rem',
            background: 'linear-gradient(135deg, #FF5FA2, #FF8AB5)',
            boxShadow: '0 8px 24px rgba(255, 95, 162, 0.35)',
          }}
        >
          Awesome!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReleaseNotesModal;
