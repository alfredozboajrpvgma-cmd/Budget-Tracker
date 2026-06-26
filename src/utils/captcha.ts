export const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY?.trim() ?? '';
export const isCaptchaEnabled = Boolean(HCAPTCHA_SITE_KEY);
