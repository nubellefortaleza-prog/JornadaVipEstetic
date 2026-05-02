
import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, PatientProfile, AnamnesisData, RewardPoints, PatientRecord, AdminUser, BehavioralData } from './types';
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
import MasterAdminView from './components/MasterAdminView';
import ErrorBoundary from './components/ErrorBoundary';
import { registerServiceWorker } from './services/notificationService';
import { trackScreen, trackSessionStart, initSwipeTracking } from './services/analyticsService';
import { clearAdminSession } from './services/adminAuthService';
import * as api from './services/apiService';
import { OAuthResult } from './services/oauthService';
import { CONFIG, apiUrl } from './services/config';

// Tipagem para o Smartlook no window
declare global {
  interface Window {
    smartlook: any;
  }
}

// ── Rota /admin_m_m → Painel Master (independente do app paciente) ──────────
const isMasterRoute = typeof window !== 'undefined' && window.location.pathname === '/admin_m_m';

const App: React.FC = () => {
  // Se acessou /admin_m_m, renderiza painel master direto
  if (isMasterRoute) {
    return (
      <ErrorBoundary>
        <MasterAdminView />
      </ErrorBoundary>
    );
  }
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
  const [pendingOAuth, setPendingOAuth] = useState<OAuthResult | null>(null);

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

  // Inicia sessão e swipe tracking quando paciente chega ao dashboard
  useEffect(() => {
    if (profile && step === AppStep.DASHBOARD) {
      trackSessionStart(profile.id);
      initSwipeTracking(profile.id);
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

  const savePatientRecord = useCallback(async (finalAnamnesis: AnamnesisData, selfieDataUrl?: string) => {
    if (!profile) return;
    setIsLoading(true);

    try {
      // Injetar dados comportamentais simulados ao completar anamnese
      const simulatedBehavior: BehavioralData = {
        externalKeystrokesSummary: "O paciente escreveu sobre insegurança com as manchas no rosto em mensagens privadas e pesquisou por 'melhores tratamentos para melasma' no Google.",
        appUsageBehavior: "Uso intenso de apps de filtros de foto e Pinterest (pastas de estética). Humor levemente ansioso com a aparência.",
        syncTimestamp: new Date().toISOString()
      };
      const updatedProfile = { ...profile, behavioralData: simulatedBehavior };
      setProfile(updatedProfile);

      const success = await api.saveAnamnesis(profile.id, finalAnamnesis);
      if (success) {
        setAnamnesis(finalAnamnesis);

        // Salvar selfie como foto de perfil
        if (selfieDataUrl) {
          setProfile(prev => prev ? { ...prev, photoUrl: selfieDataUrl } : prev);
          // Enviar como foto de perfil ao CRM
          api.updatePatient(profile.id, { photoUrl: selfieDataUrl }).catch(() => {});
          // Enviar como arquivo ao feed do CRM
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Clinic-ID': CONFIG.CLINIC_ID,
          };
          if (CONFIG.API_KEY) headers['x-api-key'] = CONFIG.API_KEY;
          fetch(apiUrl(`/api/jornada/patients/${profile.id}/files`), {
            method: 'POST',
            headers,
            body: JSON.stringify({
              url: selfieDataUrl,
              fileName: `selfie_${new Date().toISOString().split('T')[0]}.jpg`,
              fileType: 'foto_antes',
              comment: 'Foto de perfil - Anamnese inicial',
            }),
          }).catch(() => {});
        }

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
      setProfile(prev => {
        if (!prev) return null;
        const updatedBehavior = prev.behavioralData
          ? { ...prev.behavioralData, moodCheckin: mood }
          : undefined;
        return { ...prev, moodCheckin: mood, behavioralData: updatedBehavior };
      });

      if (window.smartlook) {
        window.smartlook('track', 'mood_checkin', { mood });
      }
      showToast('Obrigado por compartilhar como se sente! Isso nos ajuda a cuidar melhor de você.');
    } catch (err) {
      console.error('[JornadaVip] Erro no mood checkin:', err);
    }
  }, [profile, showToast]);

  // ── OAuth Login ────────────────────────────────────────────────────────

  const handleOAuthLogin = useCallback(async (oauthData: OAuthResult): Promise<{ found: boolean; error?: string }> => {
    try {
      const result = await api.patientLogin(
        oauthData.provider,
        oauthData.token,
        oauthData.email,
        oauthData.name,
        oauthData.photoUrl,
      );

      if (result.success && result.found && result.patient) {
        setProfile(result.patient.profile);
        setAnamnesis(result.patient.anamnesis ?? null);
        handleNextStep(AppStep.DASHBOARD);
        showToast(`Bem-vinda de volta, ${result.patient.profile.name.split(' ')[0]}!`);
        return { found: true };
      }

      // Email não encontrado — LoginView vai mostrar opções
      setPendingOAuth(oauthData);
      return { found: false };
    } catch (err: any) {
      return { found: false, error: err.message || 'Erro ao verificar conta' };
    }
  }, [handleNextStep, showToast]);

  const handleLinkCpf = useCallback(async (cpf: string, oauthData: OAuthResult): Promise<{ found: boolean; error?: string }> => {
    try {
      const result = await api.linkPatientByCpf(
        cpf,
        oauthData.provider,
        oauthData.token,
        oauthData.email,
        oauthData.name,
        oauthData.photoUrl,
      );

      if (result.success && result.found && result.patient) {
        setProfile(result.patient.profile);
        setAnamnesis(result.patient.anamnesis ?? null);
        handleNextStep(AppStep.DASHBOARD);
        showToast(`Conta vinculada! Bem-vinda, ${result.patient.profile.name.split(' ')[0]}!`);
        return { found: true };
      }

      return { found: false, error: result.error || 'CPF não encontrado no cadastro da clínica.' };
    } catch (err: any) {
      return { found: false, error: err.message || 'Erro ao vincular conta' };
    }
  }, [handleNextStep, showToast]);

  const handleNewPatient = useCallback((oauthData: OAuthResult) => {
    setPendingOAuth(oauthData);
    handleNextStep(AppStep.PROFILE_SETUP);
  }, [handleNextStep]);

  const handleEmailLogin = useCallback((patient: any) => {
    if (patient?.profile) {
      setProfile(patient.profile);
      setAnamnesis(patient.anamnesis ?? null);
      handleNextStep(AppStep.DASHBOARD);
      showToast(`Bem-vinda, ${patient.profile.name?.split(' ')[0] || ''}!`);
    }
  }, [handleNextStep, showToast]);

  // ── Criar perfil de paciente ────────────────────────────────────────────

  const handleProfileComplete = useCallback(async (data: Omit<PatientProfile, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      // Se veio do OAuth, injeta email/nome do provider
      const profileData = pendingOAuth
        ? { ...data, email: data.email || pendingOAuth.email, photoUrl: data.photoUrl || pendingOAuth.photoUrl }
        : data;

      const record = await api.createPatient(profileData);
      setProfile(record.profile);
      setPendingOAuth(null);
      handleNextStep(AppStep.DASHBOARD);
    } catch (err) {
      console.error('[JornadaVip] Erro ao criar perfil:', err);
      showToast('Erro ao criar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [handleNextStep, showToast, pendingOAuth]);

  // ── Render ──────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case AppStep.LOGIN:
        return (
          <LoginView
            onOAuthLogin={handleOAuthLogin}
            onLinkCpf={handleLinkCpf}
            onNewPatient={handleNewPatient}
            onEmailLogin={handleEmailLogin}
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
        return <EvolutionView patientId={profile?.id || ''} onBack={() => setStep(AppStep.DASHBOARD)} />;
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

          <div className="mt-auto pt-10 pb-4 flex justify-center opacity-60">
            <div className="text-[11px] tracking-[0.3em] font-serif uppercase sage-green">VIP ESTETIC</div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
