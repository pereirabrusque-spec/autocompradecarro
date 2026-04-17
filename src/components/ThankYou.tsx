import { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Home, MessageCircle } from 'lucide-react';
import { triggerAdsConversion } from './GoogleTags';

export default function ThankYou() {
  useEffect(() => {
    // Dispara a conversão do Google Ads ao chegar na página de agradecimento
    triggerAdsConversion();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[40px] p-12 shadow-2xl text-center border border-slate-100"
      >
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100/50">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="font-display text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Proposta Recebida com Sucesso!
        </h1>
        
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          Obrigado por confiar na <span className="text-accent font-bold">Auto Compra</span>. 
          Nossa equipe de especialistas já está analisando os dados do seu veículo e em até 24 horas você receberá uma mensagem pelo chat ou WhatsApp.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all group"
          >
            <Home className="w-5 h-5" />
            Voltar ao Início
          </button>
          
          <button 
            onClick={() => {
              const event = new CustomEvent('open-chat');
              window.dispatchEvent(event);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-accent/25 group"
          >
            Falar no Chat
            <MessageCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
