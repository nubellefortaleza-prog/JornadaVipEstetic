
import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, PatientProfile, AnamnesisData, RewardPoints, PatientRecord, AdminUser } from './types';
import LoginView from './components/LoginView';
import TermsView from './components/TermsView';
import ProfileSetupView from './components/ProfileSetupView';
import AnamnesisView from './components/AnamnesisView';
import DashboardView from './components/DashboardView';
import GeminiChat from './components/GeminiChat';
import AdminView from './components/AdminView';
import AdminLoginView from './components/AdminLoginView';
import RewardsView from './components/RewardsView';
import PreProcedureView from './components/PreProcedureView';
import PostProcedureView from './components/PostProcedureView';
import EvolutionView from './components/EvolutionView';
import ErrorBoundary from './components/ErrorBoundary';
import { registerServiceWorker } from './services/notificationService';
import { trackScreen, trackSessionStart } from './services/analyticsService';
import { clearAdminSession } from './services/adminAuthService';
import * as api from './services/apiService';

// Tipagem para o Smartlook no window
declare global {
  interface Window {
    smartlook: any;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LOGIN);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [anamnesis, setAnamnesis] = useState<AnamnesisData | null>(null);
  const [rewards, setRewards] = useState<RewardPoints>({
    total: 150,
    referralsCount: 2,
    registeredCount: 1,
    level: 'Iniciante'
  });
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Registra o Service Worker na inicialização do app
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Escuta evento de sessão expirada
  useEffect(() => {
    const handleAuthExpired = () => {
      setProfile(null);
      setCurrentAdmin(null);
      setStep(AppStep.LOGIN);
      showToast('Sua sessão expirou. Faça login novamente.');
    };
    window.addEventListener('jvip:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('jvip:auth-expired', handleAuthExpired);
  }, []);

  // Rastreia mudança de tela
  useEffect(() => {
    if (profile) trackScreen(profile.id, AppStep[step].toLowerCase());
  }, [step, profile]);

  // Inicia sessão quando paciente chega ao dashboard
  useEffect(() => {
    if (profile && step === AppStep.DASHBOARD) {
      trackSessionStart(profile.id);
    }
  }, [profile?.id, step]);

  // Smartlook identify
  useEffect(() => {
    if (profile && window.smartlook) {
      window.smartlook('identify', profile.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        objective: profile.objective,
      });
    }
  }, [profile]);

  // ── Toast notification ──────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // ── Navegação ───────────────────────────────────────────────────────────

  const handleNextStep = useCallback((next: AppStep) => {
    setStep(next);
  }, []);

  // ── Salvar registro do paciente ─────────────────────────────────────────

  const savePatientRecord = useCallback(async (finalAnamnesis: AnamnesisData) => {
    if (!profile) return;
    setIsLoading(true);

    try {
      const success = await api.saveAnamnesis(profile.id, finalAnamnesis);
      if (success) {
        setAnamnesis(finalAnamnesis);
        handleNextStep(AppStep.DASHBOARD);

        if (window.smartlook) {
          window.smartlook('track', 'anamnesis_completed', {
            objective: profile.objective,
            expectations: finalAnamnesis.expectedResult,
          });
        }
      } else {
        showToast('Erro ao salvar anamnese. Tente novamente.');
      }
    } catch (err) {
      console.error('[JornadaVip] Erro ao salvar anamnese:', err);
      showToast('Erro ao salvar anamnese. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, handleNextStep, showToast]);

  // ── Mood Check-in ───────────────────────────────────────────────────────

  const handleMoodCheckin = useCallback(async (mood: string) => {
    if (!profile) return;

    try {
      await api.updatePatient(profile.id, { moodCheckin: mood });
      setProfile(prev => prev ? { ...prev, moodCheckin: mood } : null);

      if (window.smartlook) {
        window.smartlook('track', 'mood_checkin', { mood });
      }
      showToast('Obrigado por compartilhar como se sente!');
    } catch (err) {
      console.error('[JornadaVip] Erro no mood checkin:', err);
    }
  }, [profile, showToast]);

  // ── Criar perfil de paciente ────────────────────────────────────────────

  const handleProfileComplete = useCallback(async (data: Omit<PatientProfile, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const record = await api.createPatient(data);
      setProfile(record.profile);
      handleNextStep(AppStep.DASHBOARD);
    } catch (err) {
      console.error('[JornadaVip] Erro ao criar perfil:', err);
      showToast('Erro ao criar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [handleNextStep, showToast]);

  // ── Render ──────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case AppStep.LOGIN:
        return (
          <LoginView
            onLogin={() => handleNextStep(AppStep.PROFILE_SETUP)}
            onAdminLogin={() => handleNextStep(AppStep.ADMIN_LOGIN)}
          />
        );
      case AppStep.ADMIN_LOGIN:
        return (
          <AdminLoginView
            onSuccess={(user) => { setCurrentAdmin(user); handleNextStep(AppStep.ADMIN); }}
            onBack={() => setStep(AppStep.LOGIN)}
          />
        );
      case AppStep.TERMS:
        return <TermsView onAccept={() => handleNextStep(AppStep.PROFILE_SETUP)} />;
      case AppStep.PROFILE_SETUP:
        return (
          <ProfileSetupView onComplete={handleProfileComplete} />
        );
      case AppStep.ANAMNESIS:
        return <AnamnesisView onComplete={savePatientRecord} />;
      case AppStep.DASHBOARD:
        return (
          <DashboardView
            profile={profile!}
            rewards={rewards}
            onOpenChat={() => setShowChat(true)}
            onNavigate={(s) => setStep(s)}
            onMoodCheckin={handleMoodCheckin}
          />
        );
      case AppStep.REWARDS:
        return (
          <RewardsView
            rewards={rewards}
            patientId={profile?.id || ''}
            patientName={profile?.name || ''}
            onBack={() => setStep(AppStep.DASHBOARD)}
          />
        );
      case AppStep.PRE_PROCEDURE:
        return <PreProcedureView onBack={() => setStep(AppStep.DASHBOARD)} />;
      case AppStep.POST_PROCEDURE:
        return <PostProcedureView onBack={() => setStep(AppStep.DASHBOARD)} />;
      case AppStep.EVOLUTION:
        return <EvolutionView onBack={() => setStep(AppStep.DASHBOARD)} />;
      case AppStep.ADMIN:
        return (
          <AdminView
            currentAdmin={currentAdmin!}
            onBack={() => { clearAdminSession(); setCurrentAdmin(null); setStep(AppStep.LOGIN); }}
          />
        );
      default:
        return (
          <DashboardView
            profile={profile!}
            rewards={rewards}
            onOpenChat={() => setShowChat(true)}
            onNavigate={(s) => setStep(s)}
            onMoodCheckin={handleMoodCheckin}
          />
        );
    }
  };

  const showFloatingChat = [AppStep.DASHBOARD, AppStep.PRE_PROCEDURE, AppStep.POST_PROCEDURE, AppStep.EVOLUTION].includes(step);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-premium-noir text-white selection:bg-[#AABAA4]/30">
        <div className="max-w-md mx-auto min-h-screen flex flex-col relative px-6 py-8">

          {/* Loading overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="w-10 h-10 border-2 border-[#AABAA4] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {renderStep()}

          {showFloatingChat && (
            <button
              onClick={() => setShowChat(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-sage rounded-full shadow-lg flex items-center justify-center animate-bounce hover:scale-110 transition-transform z-40"
              aria-label="Abrir chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#1A1A1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}

          {showChat && <GeminiChat onClose={() => setShowChat(false)} />}

          {/* Toast notification */}
          {toastMessage && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#AABAA4] text-[#1A1A1B] px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-fade-in max-w-[85vw] text-center">
              {toastMessage}
            </div>
          )}

          <div className="mt-auto pt-10 pb-4 flex justify-center opacity-40">
            <div className="text-[10px] tracking-[0.3em] font-serif uppercase sage-green">VIP ESTETIC</div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
