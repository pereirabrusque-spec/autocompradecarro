import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, DollarSign, ShieldCheck, 
  CheckCircle2, ArrowRight, Loader2, FileText, Bookmark
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LimpaNome() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    whatsapp: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    valorDivida: ''
  });

  const handleCEPChange = async (cep: string) => {
    const numericCEP = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: numericCEP.replace(/(\d{5})(\d{3})/, '$1-$2') }));
    
    if (numericCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numericCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ''}`,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      return v.replace(/(\d{2})(\d{0,8})/, '($1) $2');
    }
    return v;
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    if (isNaN(amount)) return '';
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'cpf') formattedValue = formatCPF(value);
    if (field === 'whatsapp') formattedValue = formatPhone(value);
    if (field === 'valorDivida') formattedValue = formatCurrency(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        cliente_nome: formData.nome,
        email: formData.email,
        telefone: formData.whatsapp,
        cpf: formData.cpf,
        cep: formData.cep,
        cidade: formData.cidade,
        estado: formData.estado,
        observacoes: `ENDEREÇO: ${formData.endereco}. CIDADE: ${formData.cidade}-${formData.estado}. VALOR DÍVIDA: R$ ${formData.valorDivida}`,
        valor_divida: formData.valorDivida,
        status: 'limpa_nome',
        classificacao: 'fria',
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('leads_veiculos').insert([payload]);

      if (error) throw error;

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao enviar cadastro Limpa Nome:', error);
      alert('Ocorreu um erro ao enviar seu cadastro. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">SOLICITAÇÃO RECEBIDA!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Sua solicitação para limpeza de nome foi recebida com sucesso. 
            Nossa equipe técnica entrará em contato via WhatsApp em instantes.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          {/* Header */}
          <div className="bg-slate-900 p-10 md:p-14 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-1 bg-accent/20 border border-accent/30 rounded-full">
                  <span className="text-[10px] font-black tracking-widest uppercase text-accent">Programa Limpa Nome</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-none uppercase">
                REALIZE O SONHO DO <br />
                <span className="text-accent">NOME LIMPO AGORA</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                Preencha o formulário abaixo para iniciarmos o processo de remoção de restrições e recuperação do seu crédito.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-14 space-y-10">
            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-accent" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informações Pessoais</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="Seu nome completo"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF *</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Contato e Localização */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-accent" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contato e Localização</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail *</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP *</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Bairro *</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="Rua, Número, Bairro"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade *</label>
                  <div className="relative group">
                    <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all"
                      placeholder="Sua cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado (UF) *</label>
                  <div className="relative group">
                    <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-accent transition-colors" />
                    <input 
                      required
                      maxLength={2}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-slate-700 transition-all uppercase"
                      placeholder="UF"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Financeiro */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-accent" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Situação Financeira</h2>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Aproximado da Dívida *</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-accent transition-colors">R$</span>
                  <input 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-bold text-2xl text-slate-900 transition-all"
                    placeholder="0,00"
                    value={formData.valorDivida}
                    onChange={(e) => handleInputChange('valorDivida', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-accent text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50 uppercase tracking-tighter"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Solicitar Limpeza de Nome
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
                Sua privacidade é nossa prioridade. Dados 100% protegidos pela LGPD.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
