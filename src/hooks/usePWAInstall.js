import { useState, useEffect, useCallback } from 'react';

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true
  );
}

function detectIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIos && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(detectStandalone);
  const [isIos] = useState(detectIosSafari);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    const mq = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayMode = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (mq?.addEventListener) mq.addEventListener('change', handleDisplayMode);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mq?.removeEventListener) mq.removeEventListener('change', handleDisplayMode);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch {
        // ignora
      }
      setDeferredPrompt(null);
      return true;
    }

    if (isIos) {
      setShowIosGuide(true);
      return true;
    }

    return false;
  }, [deferredPrompt, isIos]);

  const canInstall = !isInstalled && (Boolean(deferredPrompt) || isIos);

  return {
    canInstall,
    isInstalled,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
  };
}
