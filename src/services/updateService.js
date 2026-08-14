/**
 * updateService.js - Servicio de Verificación y Notificación de Actualizaciones para Áncora
 */

export const CURRENT_VERSION = '1.0.0';
export const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/JOSFER78/ancora/main/public/version.json';

export async function checkForUpdates() {
  try {
    const response = await fetch(`${VERSION_CHECK_URL}?t=${Date.now()}`);
    if (!response.ok) return { hasUpdate: false, error: 'No se pudo consultar el servidor de versiones' };
    
    const remoteInfo = await response.json();
    const isNewer = compareVersions(remoteInfo.version, CURRENT_VERSION) > 0;
    
    return {
      hasUpdate: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: remoteInfo.version,
      releaseNotes: remoteInfo.releaseNotes,
      downloadUrls: remoteInfo.downloadUrls
    };
  } catch (err) {
    console.warn('[UpdateService] Check failed:', err);
    return { hasUpdate: false, error: err.message };
  }
}

function compareVersions(v1, v2) {
  const parts1 = (v1 || '0').split('.').map(Number);
  const parts2 = (v2 || '0').split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
