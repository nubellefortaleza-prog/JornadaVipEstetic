
import { PatientRecord } from "../types";

export interface WebhookConfig {
  url: string;
  label: string;
  enabled: boolean;
}

const WEBHOOK_STORAGE_KEY = 'clinic_webhooks';

export const getWebhooks = (): WebhookConfig[] => {
  return JSON.parse(localStorage.getItem(WEBHOOK_STORAGE_KEY) || '[]');
};

export const saveWebhooks = (webhooks: WebhookConfig[]) => {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(webhooks));
};

export const sendPatientToWebhooks = async (record: PatientRecord): Promise<{ label: string; success: boolean }[]> => {
  const webhooks = getWebhooks().filter(w => w.enabled && w.url);
  const payload = {
    event: 'new_patient',
    timestamp: new Date().toISOString(),
    patient: {
      name: record.profile.name,
      phone: record.profile.phone,
      email: record.profile.email,
      objective: record.profile.objective,
      city: record.profile.city,
    },
    anamnesis: {
      healthGeneral: record.anamnesis.healthGeneral,
      allergies: record.anamnesis.allergies,
      expectedResult: record.anamnesis.expectedResult,
    }
  };

  const results = await Promise.allSettled(
    webhooks.map(w =>
      fetch(w.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => ({ label: w.label, success: r.ok }))
    )
  );

  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { label: webhooks[i].label, success: false }
  );
};
