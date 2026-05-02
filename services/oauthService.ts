// ─────────────────────────────────────────────────────────────────────────────
// oauthService.ts — Login social com Google e Apple
//
// Gerencia o fluxo OAuth2 no frontend:
//   1. Inicializa SDKs do Google/Apple
//   2. Abre popup de login
//   3. Retorna token + dados básicos do usuário
//
// O token é enviado ao CRM que valida e retorna JWT próprio.
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from './config';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface OAuthResult {
  provider: 'google' | 'apple';
  token: string;       // ID token do provider (validado pelo backend)
  email: string;
  name: string;
  photoUrl?: string;
}

// ── Google Sign-In (Google Identity Services) ───────────────────────────────

let googleInitialized = false;

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gsi-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google Sign-In'));
    document.head.appendChild(script);
  });
};

/** Decodifica payload do JWT do Google (sem validar — validação é no backend) */
const decodeGoogleJwt = (token: string): { email: string; name: string; picture?: string } => {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return {
    email: decoded.email || '',
    name: decoded.name || '',
    picture: decoded.picture,
  };
};

export const loginWithGoogle = (): Promise<OAuthResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleScript();

      const google = (window as any).google;
      if (!google?.accounts?.id) {
        throw new Error('Google Identity Services não disponível');
      }

      if (!googleInitialized) {
        google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: () => {}, // será sobrescrito abaixo
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleInitialized = true;
      }

      // Usa prompt (One Tap / popup) para login
      google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          if (!response.credential) {
            reject(new Error('Login cancelado'));
            return;
          }
          const decoded = decodeGoogleJwt(response.credential);
          resolve({
            provider: 'google',
            token: response.credential,
            email: decoded.email,
            name: decoded.name,
            photoUrl: decoded.picture,
          });
        },
        auto_select: false,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: abre popup manual se One Tap não funcionar
          renderGooglePopup(resolve, reject);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

/** Fallback: renderiza botão Google invisível e clica nele */
const renderGooglePopup = (
  resolve: (result: OAuthResult) => void,
  reject: (err: Error) => void,
) => {
  const google = (window as any).google;

  // Cria container temporário
  const container = document.createElement('div');
  container.id = 'google-signin-temp';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: (response: { credential: string }) => {
      container.remove();
      if (!response.credential) {
        reject(new Error('Login cancelado'));
        return;
      }
      const decoded = decodeGoogleJwt(response.credential);
      resolve({
        provider: 'google',
        token: response.credential,
        email: decoded.email,
        name: decoded.name,
        photoUrl: decoded.picture,
      });
    },
  });

  google.accounts.id.renderButton(container, {
    type: 'standard',
    size: 'large',
  });

  // Clica no botão renderizado
  setTimeout(() => {
    const btn = container.querySelector('[role="button"]') as HTMLElement;
    if (btn) btn.click();
    else {
      container.remove();
      reject(new Error('Não foi possível abrir login Google'));
    }
  }, 100);
};

// ── Apple Sign-In ───────────────────────────────────────────────────────────

const loadAppleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('apple-signin-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'apple-signin-script';
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Apple Sign-In'));
    document.head.appendChild(script);
  });
};

export const loginWithApple = async (): Promise<OAuthResult> => {
  await loadAppleScript();

  const AppleID = (window as any).AppleID;
  if (!AppleID?.auth) {
    throw new Error('Apple Sign-In não disponível');
  }

  AppleID.auth.init({
    clientId: CONFIG.APPLE_CLIENT_ID,
    scope: 'name email',
    redirectURI: CONFIG.APPLE_REDIRECT_URI,
    usePopup: true,
  });

  const response = await AppleID.auth.signIn();

  // Apple só retorna nome/email no PRIMEIRO login do usuário
  const idToken = response.authorization?.id_token || '';
  const userData = response.user || {};

  let email = '';
  let name = '';

  // Tenta extrair do token
  if (idToken) {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      email = payload.email || '';
    } catch {
      // ignora
    }
  }

  // Dados do user (só vem no primeiro login)
  if (userData.name) {
    name = [userData.name.firstName, userData.name.lastName].filter(Boolean).join(' ');
  }
  if (userData.email) {
    email = userData.email;
  }

  return {
    provider: 'apple',
    token: idToken,
    email,
    name,
  };
};
