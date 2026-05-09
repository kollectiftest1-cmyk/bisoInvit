// Design tokens centralisés pour l'app Contrôleur
export const theme = {
  colors: {
    bg: '#F5F6FA',
    surface: '#FFFFFF',
    primary: '#F06292',
    primaryDark: '#C2185B',
    primarySoft: '#FCE4EC',
    accent: '#FCB426',
    success: '#22C55E',
    successSoft: '#DCFCE7',
    danger: '#EF4444',
    dangerSoft: '#FEE2E2',
    info: '#0A5D7A',
    text: '#1F2937',
    textMuted: '#6B7280',
    textLight: '#9CA3AF',
    border: '#E5E7EB',
    overlay: 'rgba(0,0,0,0.04)',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  spacing: (n) => n * 4,
  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  },
  font: {
    regular: 'Comfortaa_400Regular',
    light: 'Comfortaa_300Light',
    bold: 'Comfortaa_700Bold',
  },
};

export default theme;
