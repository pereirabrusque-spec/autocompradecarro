import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { X, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshProfile, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Erro ao entrar com Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        if (signUpData.session) {
          await refreshProfile(signUpData.user);
          onClose();
        } else {
          alert('Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta e poder fazer login.');
          setMode('login');
        }
      } else if (mode === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await refreshProfile();
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
        translate="no"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-display mb-2">
            {mode === 'login' ? 'Bem-vindo de volta!' : mode === 'signup' ? 'Crie sua conta' : 'Recupere sua senha'}
          </h2>
          <p className="text-slate-500">
            {mode === 'login' 
              ? 'Acesse sua conta para gerenciar suas negociações.' 
              : mode === 'signup'
              ? 'Junte-se a nós para vender seu carro com segurança.'
              : 'Informe seu e-mail para receber o link de redefinição.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400">Senha</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setMode('forgot_password')}
                    className="text-[10px] font-bold text-accent hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="Sua senha segura"
                  minLength={6}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {mode === 'login' ? 'Não tem uma conta?' : mode === 'signup' ? 'Já tem uma conta?' : 'Lembrou a senha?'}
            <button 
              onClick={() => {
                if (mode === 'forgot_password') setMode('login');
                else setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="ml-2 font-bold text-accent hover:underline"
            >
              {mode === 'login' ? 'Cadastre-se' : mode === 'signup' ? 'Faça Login' : 'Voltar ao Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
