import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContextStore';
import { useAlert } from './confirmContextStore';
import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  resolvePendingRedirectLogin,
} from '../services/authService';

export function AuthProvider({ children }) {
  const customAlert = useAlert();
  const [currentUser, setCurrentUser] = useState(null);
  const [welcomeUser, setWelcomeUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const unsubAuth = subscribeToAuth((user) => {
      if (!cancelled) {
        setCurrentUser(user);
      }
    });

    // Completa eventuale flusso OAuth redirect su iOS Safari PWA standalone
    resolvePendingRedirectLogin()
      .then((redirectedUser) => {
        if (!cancelled && redirectedUser?.isFirstLogin) {
          setWelcomeUser(redirectedUser);
          try {
            localStorage.setItem('burraco_welcomed_' + redirectedUser.uid, 'true');
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Avviso completamento redirect Google:', err?.message || err);
        }
      });

    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const user = await loginWithGoogle();
      if (user?.isFirstLogin) {
        setWelcomeUser(user);
        try {
          localStorage.setItem('burraco_welcomed_' + user.uid, 'true');
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Login fallito:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        const isWebkitStorageBlock =
          err?.code === 'auth/web-storage-unsupported' ||
          err?.code === 'auth/missing-initial-state';
        customAlert({
          title: 'Accesso Google',
          message: isWebkitStorageBlock
            ? 'Safari/iOS ha bloccato la sessione OAuth. Verifica che i cookie non siano bloccati nelle Impostazioni di Safari e riprova.'
            : 'Accesso con Google non completato: ' + (err?.message || err),
          variant: 'warning'
        });
      }
    }
  }, [customAlert]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout fallito:', err);
    }
  }, []);

  const value = useMemo(() => ({
    currentUser,
    welcomeUser,
    setWelcomeUser,
    handleLogin,
    handleLogout,
  }), [currentUser, welcomeUser, handleLogin, handleLogout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
