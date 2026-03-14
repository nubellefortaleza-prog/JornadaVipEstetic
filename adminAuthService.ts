
// ─────────────────────────────────────────────────────────────────────────────
// notificationService.ts
//
// Gerencia dois tipos de notificação:
//   1. Browser Notifications (via Notifications API) — aparecem no sistema
//      operacional mesmo quando o app está em segundo plano (se instalado como PWA)
//   2. Popup Campaigns — popups internos cadastrados pelo admin, exibidos no app
//
// IMPORTANTE sobre Push remoto (quando o celular está com a tela apagada):
//   Para notificações chegarem sem o app aberto você precisa de um servidor
//   com VAPID keys (ex: Firebase Cloud Messaging, OneSignal, web-push + Node.js).
//   O que implementamos aqui funciona: app aberto OU instalado como PWA em 2º plano.
// ─────────────────────────────────────────────────────────────────────────────

export const CAMPAIGNS_KEY = 'clinic_campaigns';

export interface PopupCampaign {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  // 'all' → todos os pacientes, ou array de IDs específicos
  targetPatientIds: string[] | 'all';
  createdAt: string;
  scheduledAt?: string;  // ISO string — quando deve aparecer (opcional)
  readBy: string[];       // IDs dos pacientes que já viram
}

// ── Permissão de Notificação do Browser ─────────────────────────────────────

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

// ── Exibir Notificação do Browser ───────────────────────────────────────────

export const showBrowserNotification = (title: string, body: string, url?: string) => {
  if (Notification.permission !== 'granted') return;

  // Tenta usar o Service Worker para mostrar (funciona em segundo plano)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      url: url || '/',
    });
  } else {
    // Fallback: notificação direta (só funciona com app aberto)
    new Notification(title, {
      body,
      icon: '/icon-192.png',
    });
  }
};

// ── Service Worker Registration ──────────────────────────────────────────────

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('Service Worker não registrado:', err);
  }
};

// ── Campanhas / Popups ───────────────────────────────────────────────────────

export const getCampaigns = (): PopupCampaign[] =>
  JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');

export const saveCampaigns = (campaigns: PopupCampaign[]) =>
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));

/** Retorna campanhas que este paciente ainda não viu e já estão no prazo */
export const getPendingCampaignsForPatient = (patientId: string): PopupCampaign[] => {
  const now = new Date();
  return getCampaigns().filter(c => {
    if (c.readBy.includes(patientId)) return false;
    if (c.scheduledAt && new Date(c.scheduledAt) > now) return false;
    if (c.targetPatientIds === 'all') return true;
    return (c.targetPatientIds as string[]).includes(patientId);
  });
};

/** Marca uma campanha como lida por este paciente */
export const markCampaignAsRead = (campaignId: string, patientId: string) => {
  const campaigns = getCampaigns().map(c =>
    c.id === campaignId ? { ...c, readBy: [...c.readBy, patientId] } : c
  );
  saveCampaigns(campaigns);
};
