import React from 'react';
import { User, CheckCircle, X, AlertCircle } from 'lucide-react';

interface ProposalModalProps {
  selectedLead: any;
  proposalCalculator: any;
  onClose: () => void;
  setAvarias: (avarias: any[]) => void;
  setShowAvariasModal: (show: boolean) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  selectedLead,
  proposalCalculator,
  onClose,
  setAvarias,
  setShowAvariasModal,
}) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Proposta para {selectedLead.cliente_nome}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna 1: Dados do Cliente */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Dados do Veículo
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
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
                  <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Quilometragem</p>
                  <p className="font-bold">{selectedLead.quilometragem || '0'} km</p>
                </div>
              </div>
            </div>

            {selectedLead.situacao_financeira === 'financiado' && (
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  Parcelas em Atraso
                </h4>
                <div className="space-y-2 text-xs">
                  <p>Quantidade: <span className="font-bold">{selectedLead.parcelas_atrasadas || 0}</span></p>
                  <p>Valor da Parcela: <span className="font-bold">{formatCurrency(selectedLead.valor_parcela)}</span></p>
                  <p>Juros: <span className="font-bold">{formatCurrency(selectedLead.valor_parcela * (selectedLead.parcelas_atrasadas || 0) * 0.05)}</span></p>
                  <p className="font-bold text-red-600">Total: {formatCurrency(selectedLead.valor_parcela * (selectedLead.parcelas_atrasadas || 0) * 1.05)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2: Valores e Seleção */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Valores da Proposta
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>FIPE:</span>
                <span className="font-bold">{formatCurrency(selectedLead.valor_fipe)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Desejado:</span>
                <span className="font-bold">{formatCurrency(selectedLead.valor_desejado)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Sugerido:</span>
                <span className="font-bold">{formatCurrency(proposalCalculator.suggestedValue)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold">Valor Desejado Cliente:</span>
                <span className="font-black text-lg text-accent">{formatCurrency(selectedLead.preco_cliente)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
