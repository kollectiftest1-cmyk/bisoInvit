// Configuration de l'application Contrôleur BisoInvit
// ⚠ Modifier ces valeurs AVANT le build/déploiement.

export const config = {
  // URL du serveur backend (sans / final)
  // Exemples :
  //   - LAN local Wi-Fi          : http://192.168.0.41:4000
  //   - Émulateur Android        : http://10.0.2.2:4000
  //   - Production (HTTPS)       : https://api.bisoinvit.com
  API_URL: 'http://192.168.0.41:4000',

  // Libellé envoyé au backend pour identifier la source du scan
  SCANNER_LABEL: 'mobile',
};

export default config;
