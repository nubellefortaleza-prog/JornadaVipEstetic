
import React from 'react';

interface Props {
  onLogin: () => void;
  onAdminLogin: () => void;
}

const LoginView: React.FC<Props> = ({ onLogin, onAdminLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-12">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
           <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green">VIP ESTETIC</div>
        </div>
        <h1 className="text-xl font-light tracking-wide text-white/90">Bem-vindo à sua Jornada VIP</h1>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={onLogin}
          className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
          <span className="text-sm font-medium">Continuar com Google</span>
        </button>

        <button 
          onClick={onLogin}
          className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all active:scale-95"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.67-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.67.805-3.54 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.568-1.702z" />
          </svg>
          <span className="text-sm font-medium">Continuar com Apple</span>
        </button>

        <div className="pt-8 flex justify-center">
          <button 
            onClick={onAdminLogin}
            className="text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-sage transition-colors"
          >
            Acesso Clínico
          </button>
        </div>
      </div>

      <p className="text-[11px] text-center text-white/60 max-w-[200px] leading-relaxed">
        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
};

export default LoginView;
