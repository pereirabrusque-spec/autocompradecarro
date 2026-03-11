import React from 'react';
import { User, CheckCircle, X } from 'lucide-react';

interface ProposalModalProps {
  selectedLead: any;
  onClose: () => void;
  setAvarias: (avarias: any[]) => void;
  setShowAvariasModal: (show: boolean) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  selectedLead,
  onClose,
  setAvarias,
  setShowAvariasModal,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Proposta para {selectedLead.nome_cliente}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna 1: Dados do Cliente */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Dados Preenchidos pelo Cliente
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Quilometragem</p>
                  <p className="font-bold">{selectedLead.quilometragem || '0'} km</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Situação</p>
                  <p className="font-bold">{selectedLead.situacao || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Preço Desejado</p>
                  <p className="font-bold text-accent text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.preco_cliente || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Financiamento</p>
                  <p className="font-bold">{selectedLead.situacao_financeira || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Ano/Modelo</p>
                  <p className="font-bold">{selectedLead.ano_modelo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Cor</p>
                  <p className="font-bold">{selectedLead.cor || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Placa</p>
                  <p className="font-bold">{selectedLead.placa || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Telefone</p>
                  <p className="font-bold">{selectedLead.telefone || 'Não informado'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Email</p>
                  <p className="font-bold">{selectedLead.email || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Selecionar Compradores */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Selecionar Compradores
            </h4>
            {/* Aqui entra a lógica de seleção de compradores que precisa de ajuste de layout */}
            <div className="space-y-4">
              {/* Exemplo de estrutura para compradores */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <input type="checkbox" className="w-4 h-4" />
                <span>Comprador Exemplo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
