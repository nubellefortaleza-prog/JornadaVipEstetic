import { describe, it, expect } from 'vitest';
import { AppStep } from '../types';
import type { PatientProfile, BehavioralData, AnamnesisData, PatientRecord, AdminUser, RewardPoints } from '../types';

describe('types', () => {
  describe('AppStep enum', () => {
    it('has all expected steps', () => {
      expect(AppStep.LOGIN).toBeDefined();
      expect(AppStep.TERMS).toBeDefined();
      expect(AppStep.PROFILE_SETUP).toBeDefined();
      expect(AppStep.ANAMNESIS).toBeDefined();
      expect(AppStep.DASHBOARD).toBeDefined();
      expect(AppStep.PRE_PROCEDURE).toBeDefined();
      expect(AppStep.POST_PROCEDURE).toBeDefined();
      expect(AppStep.REWARDS).toBeDefined();
      expect(AppStep.EVOLUTION).toBeDefined();
      expect(AppStep.ADMIN_LOGIN).toBeDefined();
      expect(AppStep.ADMIN).toBeDefined();
    });
  });

  describe('BehavioralData', () => {
    it('can be constructed with required fields', () => {
      const data: BehavioralData = {
        externalKeystrokesSummary: 'test keystrokes',
        appUsageBehavior: 'test usage',
        syncTimestamp: new Date().toISOString(),
      };
      expect(data.externalKeystrokesSummary).toBe('test keystrokes');
      expect(data.moodCheckin).toBeUndefined();
    });

    it('accepts optional moodCheckin', () => {
      const data: BehavioralData = {
        externalKeystrokesSummary: 'test',
        appUsageBehavior: 'test',
        moodCheckin: 'happy',
        syncTimestamp: new Date().toISOString(),
      };
      expect(data.moodCheckin).toBe('happy');
    });
  });

  describe('PatientProfile', () => {
    it('supports behavioralData field', () => {
      const profile: PatientProfile = {
        id: '1',
        name: 'Test',
        phone: '11999999999',
        cpf: '12345678909',
        email: 'test@test.com',
        birthDate: '1990-01-01',
        city: 'SP',
        objective: 'Harmonização',
        style: 'natural',
        commPreference: 'simples',
        createdAt: new Date().toISOString(),
        behavioralData: {
          externalKeystrokesSummary: 'data',
          appUsageBehavior: 'usage',
          syncTimestamp: new Date().toISOString(),
        },
      };
      expect(profile.behavioralData).toBeDefined();
      expect(profile.behavioralData!.externalKeystrokesSummary).toBe('data');
    });
  });

  describe('PatientRecord', () => {
    it('includes profile, anamnesis and reminders', () => {
      const record: PatientRecord = {
        profile: {
          id: '1', name: 'Test', phone: '11999999999', cpf: '12345678909',
          email: 'test@test.com', birthDate: '1990-01-01', city: 'SP',
          objective: 'Test', style: 'natural', commPreference: 'simples',
          createdAt: new Date().toISOString(),
        },
        reminders: [],
      };
      expect(record.profile.id).toBe('1');
      expect(record.reminders).toEqual([]);
    });
  });
});
