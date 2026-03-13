
export enum AppStep {
  LOGIN,
  TERMS,
  PROFILE_SETUP,
  ANAMNESIS,
  DASHBOARD,
  PRE_PROCEDURE,
  POST_PROCEDURE,
  REWARDS,
  EVOLUTION,
  COMMUNITY,
  ADMIN_LOGIN,
  ADMIN
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'master' | 'colaborador';
  createdAt: string;
}

export interface Reminder {
  id: string;
  patientId: string;
  title: string;
  message: string;
  date: string;
  type: 'consulta' | 'orientacao' | 'medicacao';
  read: boolean;
}

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  email: string;
  birthDate: string;
  city: string;
  objective: string;
  style: 'natural' | 'marcante' | 'discreto';
  commPreference: 'tecnico' | 'simples';
  photoUrl?: string;
  createdAt: string;
  moodCheckin?: string;
}

export interface AnamnesisData {
  healthGeneral: string;
  allergies: string;
  medications: string;
  pregnancy: boolean;
  pastProcedures: string;
  habits: {
    sun: string;
    sleep: string;
    smoking: boolean;
    skincare: string;
  };
  expectedResult: string;
}

export interface RewardPoints {
  total: number;
  referralsCount: number;
  registeredCount: number;
  level: 'Iniciante' | 'Avançado' | 'Premium';
}

export interface PatientRecord {
  profile: PatientProfile;
  anamnesis?: AnamnesisData;
  reminders: Reminder[];
}
