import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { IsRoot } from '@capgo/capacitor-is-root';
import { Capacitor } from '@capacitor/core';

/**
 * SecurityGuard: Protege la aplicación contra entornos peligrosos (Root/Magisk/Depuradores)
 */
const SecurityGuard = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const performSecurityCheck = async () => {
      try {
        // 1. Detección de ROOT / JAILBREAK
        const rootResult = await IsRoot.isRooted();
        if (rootResult.value) {
          alert('Violación de Seguridad: Este dispositivo está rooteado. Por seguridad, la aplicación se cerrará.');
          CapApp.exitApp();
          return;
        }

        // 2. Detección de gestión de Root (Magisk/SuperSU)
        const mgmtResult = await IsRoot.isRootedWithBusyBox();
        if (mgmtResult.value) {
           alert('Entorno no seguro detectado (BusyBox). La aplicación se cerrará.');
           CapApp.exitApp();
           return;
        }

        // 3. Detección de Emuladores (Opcional - solo log o aviso)
        const emuResult = await IsRoot.isEmulator();
        if (emuResult.value) {
          console.warn("Ejecutando en emulador");
        }

      } catch (error) {
        console.error("Security check failed:", error);
      }
    };

    // 4. Anti-Debugger (Técnica básica de timing)
    const debuggerInterval = setInterval(() => {
       const start = Date.now();
       // eslint-disable-next-line
       debugger; 
       const end = Date.now();
       if (end - start > 100) {
          // Si el debugger está abierto, la ejecución se detiene en 'debugger'
          // y el tiempo medido será mucho mayor.
          // window.location.href = 'about:blank';
       }
    }, 2000);

    performSecurityCheck();
    
    return () => clearInterval(debuggerInterval);
  }, []);

  return null;
};

export default SecurityGuard;
