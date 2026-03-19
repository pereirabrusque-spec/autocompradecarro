import React, { useState, useEffect } from 'react';
import { X, Save, MessageCircle, MessageSquare, Send, FileText, Edit2, ArrowLeft, ChevronLeft, ChevronRight, Upload, DollarSign, User, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";

interface LeadDetailsCardProps {
  lead: any;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
  onDelete: (leadId: string) => void;
  onRefresh: () => void;
  fipeRules: any[];
  jurosAtraso: number;
  banks: any[];
  cooperativeDiscount: number;
  forceShowWhatsAppBuyerModal?: boolean;
  userRole?: string;
}

export default function LeadDetailsCard({ 
  lead, 
  onClose, 
  onSave, 
  onDelete, 
  onRefresh, 
  fipeRules, 
  jurosAtraso, 
  banks, 
  cooperativeDiscount, 
  forceShowWhatsAppBuyerModal,
  userRole 
}: LeadDetailsCardProps) {
  console.log("LeadDetailsCard received lead:", lead);
  const [currentLead, setCurrentLead] = useState(lead || {});
  const [repairModal, setRepairModal] = useState<{ field: string | null; value: string }>({ field: null, value: '' });


  const checkboxFields = [
    'teto_solar', 'airbag', 'chave_reserva_manual', 'revisoes_dia', 
    'ar_condicionado', 'direcao_hidraulica', 'vidros_eletricos', 'travas_eletricas', 
    'alarme', 'som_multimidia', 'bancos_couro', 'rodas_liga_leve', 'sensor_re', 
    'camera_re', 'tem_sinistro', 'passagem_leilao', 'recuperado_banco', 
    'historico_furto_roubo', 'is_financiamento_atrasado', 'is_busca_apreensao', 
    'is_ipva_multas_atrasados', 'is_renajud', 'is_motor_fundido', 
    'is_cambio_defeito', 'is_batido_avariado', 'is_sinistrado_leilao'
  ];

  const dbToFormMap: Record<string, string> = {};

  React.useEffect(() => {
    if (lead) {
      const sanitizedLead = { ...lead };
      
      // Sanitiza os valores do formulário
      Object.keys(sanitizedLead).forEach(key => {
        const val = sanitizedLead[key];
        
        if (checkboxFields.includes(key)) {
          // Converte 'sim' para 'true' (ou 'true' para 'true'), e qualquer outra coisa para 'false'
          sanitizedLead[key] = (val === 'sim' || val === 'true' || val === true) ? 'true' : 'false';
        } else if (val === null || val === undefined || val === 'null' || val === 'undefined') {
          // Não converte para string vazia se for um campo que deve ser array/json ou se for nulo de verdade
          // Colunas de array/json no Supabase não aceitam "" (string vazia), devem ser null ou o tipo correto
          const complexFields = [
            'fotos', 'videos', 'problemas', 'selected_items', 'avarias', 
            'avarias_manuais', 'fotos_url', 'detalhes_proposta', 'metadata'
          ];
          const displayFields = ['marca', 'modelo', 'ano_modelo', 'ano_fabricacao', 'cor', 'placa', 'quilometragem'];
          
          if (complexFields.includes(key)) {
            sanitizedLead[key] = null;
          } else if (displayFields.includes(key)) {
            sanitizedLead[key] = val || null;
          } else {
            sanitizedLead[key] = '';
          }
        }
      });

      // Define data_negociacao com created_at se estiver vazio
      if (!sanitizedLead.data_negociacao && sanitizedLead.created_at) {
        sanitizedLead.data_negociacao = sanitizedLead.created_at;
      }
      
      console.log("Lead sanitizado no LeadDetailsCard:", sanitizedLead);
      setCurrentLead(sanitizedLead);
    } else {
      setCurrentLead({});
    }
  }, [lead]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [buyerFilter, setBuyerFilter] = useState('Todos');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);

  const mediaItems = [
    ...(currentLead.fotos || []),
    ...(currentLead.videos || [])
  ];

  const renderMedia = (item: string, index: number) => {
    const isVideo = item.match(/\.(mp4|webm|ogg)$/i);
    if (isVideo) {
      return (
        <video 
          key={index}
          src={item} 
          className="w-full h-64 object-cover rounded-2xl" 
          controls 
          autoPlay 
          muted={false}
        />
      );
    }
    return (
      <img 
        key={index}
        src={item} 
        alt={`Veículo ${index}`} 
        className="w-full h-64 object-cover rounded-2xl" 
        referrerPolicy="no-referrer"
      />
    );
  };

  const calculateFinance = () => {
    try {
      const fipe = Number(currentLead.valor_fipe) || 0;
      
      let discountValue = 0;
      const discounts: { name: string; value: number }[] = [];
      let fixedCosts = 0;
      const fixedCostsDetail: { name: string; value: number }[] = [];
      let payoff = 0;
      const payoffBreakdown: any = {};

      // 1. Desconto de Cooperativa
      const bankName = currentLead.banco_financiamento || currentLead.banco_financiador || '';
      const isCooperativeBank = (name: string) => {
        if (!name) return false;
        const normalizedSearch = name.toLowerCase().trim();
        return banks?.some(b => 
          b.is_cooperativa && 
          (normalizedSearch.includes(b.name.toLowerCase().trim()) || 
           b.name.toLowerCase().trim().includes(normalizedSearch))
        );
      };
      
      const isBankCooperative = isCooperativeBank(bankName);
      const hasCooperativeFlag = currentLead.is_cooperativa === 'true' || 
                                 currentLead.is_cooperativa === true || 
                                 currentLead.is_cooperativa === 'sim';

      if (hasCooperativeFlag || isBankCooperative) {
          const coopDiscount = fipe * ((cooperativeDiscount || 0) / 100);
          discounts.push({ 
            name: `Desconto Cooperativa (${cooperativeDiscount || 0}%)`, 
            value: coopDiscount
          });
          discountValue += coopDiscount;
      }

      // 2. Descontos por Histórico/Problemas
      const problemasSelecionados = Array.isArray(currentLead.problemas) ? currentLead.problemas : (typeof currentLead.problemas === 'string' ? currentLead.problemas.split(',').map((p: string) => p.trim()) : []);
      
      let maxProblemDiscount = 0;
      let maxProblemName = '';

      problemasSelecionados.forEach((problem: string) => {
          const rule = fipeRules?.find(r => r.condition_name.toLowerCase() === problem.toLowerCase());
          let percentage = 0;
          if (rule) {
            percentage = rule.discount_percentage;
          } else {
            // Fallback rules
            const p = problem.toLowerCase();
            if (p.includes('sinistro')) percentage = 30;
            else if (p.includes('leilao') || p.includes('leilão')) percentage = 25;
            else if (p.includes('recuperado')) percentage = 20;
            else if (p.includes('furto')) percentage = 15;
            else if (p.includes('renajud') || p.includes('bloqueio judicial')) percentage = 50;
            else if (p.includes('financiamento')) percentage = 35;
            else if (p.includes('cooperativa')) percentage = 80;
            else if (p.includes('busca') || p.includes('apreensão')) percentage = 60;
            else if (p.includes('nome jurídico')) percentage = 10;
            else if (p.includes('cobertura')) percentage = 15;
          }
          
          if (percentage > 0) {
              const val = fipe * (percentage / 100);
              if (val > maxProblemDiscount) {
                  maxProblemDiscount = val;
                  maxProblemName = `${problem} (${percentage}%)`;
              }
          }
      });

      if (maxProblemDiscount > 0) {
          discounts.push({ name: maxProblemName, value: maxProblemDiscount });
          discountValue += maxProblemDiscount;
      }

      // 3. Avarias (Deduções por Valor Fixo)
      if (currentLead.motor_reparo) {
        const val = Number(currentLead.motor_reparo) || 0;
        fixedCostsDetail.push({ name: 'Motor Fundido / Batendo', value: val });
        fixedCosts += val;
      }
      if (currentLead.cambio_reparo) {
        const val = Number(currentLead.cambio_reparo) || 0;
        fixedCostsDetail.push({ name: 'Câmbio com Defeito', value: val });
        fixedCosts += val;
      }
      if (currentLead.batido_reparo) {
        const val = Number(currentLead.batido_reparo) || 0;
        fixedCostsDetail.push({ name: 'Batido / Avariado', value: val });
        fixedCosts += val;
      }
      if (currentLead.valor_ipva_multa) {
        const val = Number(currentLead.valor_ipva_multa) || 0;
        fixedCostsDetail.push({ name: 'IPVA/Multas Atrasados', value: val });
        fixedCosts += val;
      }

      // Deduções manuais do modal de avarias
      const avariasManuais = currentLead.avarias_manuais || currentLead.detalhes_proposta?.avarias_manuais || [];
      avariasManuais.forEach((avaria: { description: string, value: number }) => {
        const val = Number(avaria.value) || 0;
        fixedCostsDetail.push({ 
          name: `Avaria Manual: ${avaria.description}`, 
          value: val
        });
        fixedCosts += val;
      });

      // 4. Situação Financeira e Quitação
      if (currentLead.valor_parcela && currentLead.total_parcelas && currentLead.parcelas_pagas !== undefined) {
        const remainingInstallments = Number(currentLead.total_parcelas) - Number(currentLead.parcelas_pagas);
        if (remainingInstallments > 0) {
          const totalRemaining = remainingInstallments * Number(currentLead.valor_parcela);
          
          // Find bank discount
          const bank = banks?.find(b => b.name.toLowerCase() === bankName.toLowerCase());
          let bankDiscount = 0;

          if (bank) {
            bankDiscount = bank.discount_percentage || 0;
          } else {
            bankDiscount = 20; // Default 20% se não encontrar
          }

          const discountAmount = totalRemaining * (bankDiscount / 100);
          const clientPayoffValue = totalRemaining - discountAmount;
          
          payoff = clientPayoffValue;
          payoffBreakdown.totalRemaining = totalRemaining;
          payoffBreakdown.discountAmount = discountAmount;
          payoffBreakdown.clientPayoffValue = clientPayoffValue;
          
          fixedCostsDetail.push({ name: `Quitação (${bankName || 'Banco'})`, value: payoff });
          fixedCosts += payoff;
        }
      }

      // Parcelas Atrasadas
      if (currentLead.parcelas_atrasadas && currentLead.valor_parcela) {
        const atrasadas = Number(currentLead.parcelas_atrasadas);
        const valParcela = Number(currentLead.valor_parcela);
        if (atrasadas > 0) {
            const totalAtraso = atrasadas * valParcela;
            const juros = totalAtraso * ((jurosAtraso || 0) / 100);
            const totalComJuros = totalAtraso + juros;
            
            fixedCostsDetail.push({ name: `Parcelas Atrasadas (${atrasadas}x) + Juros`, value: totalComJuros });
            fixedCosts += totalComJuros;
            payoff += totalComJuros;
        }
      }

      const optionA = fipe - discountValue - fixedCosts;
      const optionB = optionA * 0.9; // 10% less for cash
      const finalProposal = optionA;

      const latestNovaProposta = currentLead.detalhes_proposta?.novas_propostas?.slice(-1)[0] || null;
      const previousProposalValue = currentLead.detalhes_proposta?.novas_propostas?.length > 1 
        ? currentLead.detalhes_proposta.novas_propostas[currentLead.detalhes_proposta.novas_propostas.length - 2].valor 
        : null;

      const profit = fipe - finalProposal;

      return {
          fipe,
          discountValue,
          discounts,
          fixedCosts,
          fixedCostsDetail,
          payoff,
          payoffBreakdown,
          optionA,
          optionB,
          finalProposal,
          latestNovaProposta,
          previousProposalValue,
          profit
      };
    } catch (e) {
      console.error("Error in calculateFinance:", e);
      return {
          fipe: 0,
          discountValue: 0,
          discounts: [],
          fixedCosts: 0,
          fixedCostsDetail: [],
          payoff: 0,
          payoffBreakdown: {},
          optionA: 0,
          optionB: 0,
          finalProposal: 0,
          latestNovaProposta: null,
          previousProposalValue: null,
          profit: 0
      };
    }
  };

  const calc = calculateFinance();
  const proposalValue = calc.latestNovaProposta?.valor || calc.finalProposal;

  const getProposalClass = (value: number) => {
    if (value <= 0) return "";
    const typeLower = currentLead.tipo_veiculo?.toLowerCase() || "";
    if (typeLower.includes("caminh")) {
      if (value < 10000) return "animate-blink text-red-600";
    } else if (typeLower.includes("moto")) {
      if (value < 2000) return "animate-blink text-red-600";
    } else { // Assume carro por padrão
      if (value < 5000) return "animate-blink text-red-600";
    }
    return "";
  };

  const formatProposalValue = (value: number) => {
    if (value <= 0) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      const { data } = await supabase.from('interested_buyers').select('*');
      if (data) setBuyers(data);
    };
    fetchBuyers();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [showWhatsAppBuyerModal, setShowWhatsAppBuyerModal] = useState(forceShowWhatsAppBuyerModal || false);
  const [showBuyerConfigModal, setShowBuyerConfigModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isUploadingCRLV, setIsUploadingCRLV] = useState(false);
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [showNovaPropostaModal, setShowNovaPropostaModal] = useState(false);
  const [novaPropostaValor, setNovaPropostaValor] = useState(0);
  const [proposalMessage, setProposalMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    if (showProposalReview && currentLead.id) {
      const fetchHistory = async () => {
        const { data } = await supabase
          .from('mensagens')
          .select('*')
          .eq('lead_id', currentLead.id)
          .order('created_at', { ascending: true });
        if (data) setChatHistory(data);
      };
      fetchHistory();
    }
  }, [showProposalReview, currentLead.id]);

  const generateOwnerMessage = () => {
    const hours = new Date().getHours();
    let greeting = 'Bom dia';
    if (hours >= 12 && hours < 18) greeting = 'Boa tarde';
    if (hours >= 18 || hours < 5) greeting = 'Boa noite';

    const firstName = currentLead.cliente_nome?.split(' ')[0] || 'Cliente';
    const vehicleName = `${currentLead.marca} ${currentLead.modelo}`;
    const color = currentLead.cor || 'não informada';

    let msg = `*${greeting}, ${firstName}!* 🚀\n\n`;
    msg += `Temos uma oportunidade exclusiva para você transformar seu veículo em dinheiro rápido e sem burocracia.\n\n`;
    msg += `Referente ao seu veículo *${vehicleName}* de cor *${color}*.\n\n`;
    msg += `Analisamos os dados enviados e preparamos uma oferta especial baseada no mercado atual.\n\n`;
    msg += `Oferecemos esta proposta devido à *Tabela FIPE* do seu veículo ser de *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}*.\n\n`;

    msg += `💰 *Conseguimos pagar o valor final de:* *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalValue)}*\n\n`;
    msg += `Nossa proposta é válida por tempo limitado. Não perca a chance de fechar um excelente negócio e colocar dinheiro no bolso hoje mesmo! 🤝\n\n`;
    msg += `Para fecharmos ou se tiver alguma dúvida, entre em contato conosco:\n`;
    msg += `🌐 *Pelo site:* Chat disponível 24 horas por dia.\n`;
    msg += `📱 *Pelo WhatsApp:* Atendimento em horário comercial.\n\n`;
    msg += `Vamos fechar negócio? Aguardamos seu contato!`;
    return msg;
  };

  const handleSendProposalToChat = async () => {
    const msg = generateOwnerMessage();
    setProposalMessage(msg);
    setShowProposalReview(true);
  };

  const confirmSendProposal = async () => {
    try {
      const { error } = await supabase
        .from('mensagens')
        .insert([{
          lead_id: currentLead.id,
          remetente: 'admin',
          conteudo: proposalMessage,
          tipo: 'proposta',
          metadata: {
            proposal_data: {
              final_value: proposalValue,
              base_value: calc.fipe,
              deductions: [
                ...calc.fixedCostsDetail,
                ...calc.discounts
              ],
              payoff: calc.payoff
            },
            view_proposal: true
          }
        }]);

      if (error) throw error;

      // Atualiza o status do lead automaticamente para "Proposta Enviada"
      const updatedLead = { ...currentLead, status: 'proposta_enviada' };
      setCurrentLead(updatedLead);
      onSave(updatedLead);

      setShowProposalReview(false);
      alert('Proposta enviada com sucesso para o chat do cliente!');
    } catch (error: any) {
      console.error('Erro ao enviar proposta para o chat:', error);
      alert('Erro ao enviar proposta para o chat: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleCRLVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCRLV(true);
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    console.log("DEBUG: GEMINI_API_KEY:", apiKey ? "DEFINIDA" : "NÃO DEFINIDA");
    const ai = new GoogleGenAI({ apiKey });

    // Upload via API para contornar RLS
    let publicUrl = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `crlv/${currentLead.id}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na API de upload:", errorData);
        setIsUploadingCRLV(false);
        return;
      }

      const data = await response.json();
      publicUrl = data.publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setIsUploadingCRLV(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { inlineData: { data: base64Image, mimeType: mimeType } },
              { text: "Extraia os dados deste CRLV: placa, marca, modelo, ano_fabricacao, ano_modelo, cor, renavam, chassi. Retorne apenas JSON." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                placa: { type: Type.STRING },
                marca: { type: Type.STRING },
                modelo: { type: Type.STRING },
                ano_fabricacao: { type: Type.STRING },
                ano_modelo: { type: Type.STRING },
                cor: { type: Type.STRING },
                renavam: { type: Type.STRING },
                chassi: { type: Type.STRING }
              }
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        const updatedLead = { ...currentLead, ...data, crlv_url: publicUrl };
        setCurrentLead(updatedLead);
        onSave(updatedLead);
      } catch (error) {
        console.error("Erro no OCR:", error);
        const updatedLead = { ...currentLead, crlv_url: publicUrl };
        setCurrentLead(updatedLead);
        onSave(updatedLead);
      } finally {
        setIsUploadingCRLV(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (field: string, value: string) => {
    if (['is_ipva_multas_atrasados', 'is_motor_fundido', 'is_batido_avariado', 'is_cambio_defeito'].includes(field) && value === 'sim') {
        const fieldMap: Record<string, string> = {
            'is_ipva_multas_atrasados': 'valor_ipva_multa',
            'is_motor_fundido': 'motor_reparo',
            'is_batido_avariado': 'batido_reparo',
            'is_cambio_defeito': 'cambio_reparo'
        };
        setRepairModal({ field, value: currentLead[fieldMap[field]] || '' });
    } else {
        setCurrentLead({ ...currentLead, [field]: value });
    }
  };

  const handleSaveNovaProposta = async (valor: number) => {
    const novasPropostas = currentLead.detalhes_proposta?.novas_propostas || [];
    const novaProposta = {
      id: Date.now().toString(),
      valor: valor,
      data: new Date().toISOString()
    };
    
    const updatedDetalhes = {
      ...(currentLead.detalhes_proposta || {}),
      novas_propostas: [...novasPropostas, novaProposta]
    };
    
    const updatedLead = { 
      ...currentLead, 
      detalhes_proposta: updatedDetalhes,
      suggested_value: valor // Atualiza o valor sugerido para a nova proposta
    };
    setCurrentLead(updatedLead);
    onSave(updatedLead);
    setShowNovaPropostaModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header Fixo */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <h2 className="text-lg font-bold font-display truncate">#{currentLead.vehicle_code} - {currentLead.marca} {currentLead.modelo}</h2>
            <select
              value={currentLead.status || 'novo'}
              onChange={async (e) => {
                const newVal = e.target.value;
                const updated = { ...currentLead, status: newVal };
                setCurrentLead(updated);
                onSave(updated);
              }}
              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none outline-none cursor-pointer transition-colors ${
                currentLead.status === 'novo' ? 'bg-blue-100 text-blue-600' :
                currentLead.status === 'em_contato' ? 'bg-orange-100 text-orange-600' :
                currentLead.status === 'proposta_enviada' ? 'bg-indigo-100 text-indigo-600' :
                currentLead.status === 'fechado' ? 'bg-emerald-100 text-emerald-600' :
                currentLead.status === 'perdido' ? 'bg-slate-100 text-slate-600' :
                'bg-slate-100 text-slate-600'
              }`}
            >
              <option value="novo">NOVO</option>
              <option value="em_contato">EM CONTATO</option>
              <option value="proposta_enviada">PROPOSTA ENVIADA</option>
              <option value="fechado">FECHADO</option>
              <option value="perdido">PERDIDO</option>
            </select>
          </div>
          <button onClick={() => setShowDataModal(true)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5" /> Formulário Completo
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-pt-20">
          
          {/* Barra de Informações Rápidas (Compacta) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ano</span>
              <span className="text-xs font-bold text-slate-700">{currentLead.ano_fabricacao || currentLead.ano_modelo || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KM</span>
              <span className="text-xs font-bold text-slate-700">{currentLead.quilometragem || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cor</span>
              <span className="text-xs font-bold text-slate-700">{currentLead.cor || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Placa</span>
              <span className="text-xs font-bold text-slate-700">{currentLead.placa || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cliente</span>
              <span className="text-xs font-bold text-slate-700 truncate">
                {userRole === 'buyer_premium' ? 'Oculto' : (currentLead.cliente_nome || 'N/A')}
              </span>
            </div>
          </div>
          
          {/* Botões de Ação no Topo */}
          <div className="flex flex-wrap justify-end gap-2 pb-4 border-b border-slate-100">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {/* Ações para Admin */}
            {userRole === 'admin' && (
              <>
                <button 
                  onClick={async () => {
                    if (!confirm('Deseja reservar este veículo? Ele ficará invisível no estoque por 24 horas.')) return;
                    const { error } = await supabase
                      .from('leads_veiculos')
                      .update({ status: 'reservado', reserva_timestamp: new Date().toISOString() })
                      .eq('id', currentLead.id);
                    if (error) alert('Erro ao reservar: ' + error.message);
                    else {
                      alert('Veículo reservado com sucesso!');
                      onRefresh();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" /> Reservar
                </button>
                <button 
                  onClick={() => {
                    const phone = currentLead.telefone?.replace(/\D/g, '');
                    const formattedPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                    const rawMessage = generateOwnerMessage();
                    const encodedMessage = encodeURIComponent(rawMessage);
                    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
                  }} 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Proposta
                </button>
                <button onClick={() => setShowWhatsAppBuyerModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Comprador
                </button>
                <button 
                  onClick={handleSendProposalToChat} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" /> Chat Proposta
                </button>
                <button 
                  onClick={() => setShowNovaPropostaModal(true)} 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
                >
                  <DollarSign className="w-4 h-4" /> Nova Proposta
                </button>
              </>
            )}

            {/* Ações para Comprador Master */}
            {userRole === 'buyer_master' && (
              <button 
                onClick={async () => {
                  const phone = currentLead.telefone?.replace(/\D/g, '');
                  const formattedPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                  const rawMessage = generateOwnerMessage();
                  const encodedMessage = encodeURIComponent(rawMessage);
                  
                  // Log de uso do lead
                  try {
                    await supabase.from('internal_messages').insert({
                      sender_id: 'system',
                      content: `[LOG] Comprador Master enviou WhatsApp para Lead #${currentLead.vehicle_code}`,
                      metadata: { lead_id: currentLead.id, action: 'whatsapp_click', role: 'buyer_master', timestamp: new Date().toISOString() }
                    });
                  } catch (e) {}

                  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
                }} 
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Proposta
              </button>
            )}

            {/* Ações para Comprador Premium */}
            {userRole === 'buyer_premium' && (
              <button 
                onClick={async () => {
                  const message = `Olá Admin, tenho interesse no veículo #${currentLead.vehicle_code} (${currentLead.marca} ${currentLead.modelo}). Gostaria de negociar a proposta.`;
                  try {
                    const { error } = await supabase.from('internal_messages').insert({
                      sender_id: 'buyer_premium',
                      content: message,
                      metadata: { lead_id: currentLead.id, type: 'proposal_request', vehicle_code: currentLead.vehicle_code }
                    });
                    if (error) throw error;
                    alert('Proposta enviada para o administrador via chat interno!');
                  } catch (err) {
                    alert('Erro ao enviar proposta.');
                  }
                }} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <MessageSquare className="w-4 h-4" /> Mandar Proposta p/ Admin
              </button>
            )}

            {userRole === 'admin' && (
              <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5">
                <Edit2 className="w-4 h-4" /> {showForm ? 'Fechar Edição' : 'Editar'}
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4 mb-6">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Editar Lead</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Campos de edição podem ser adicionados aqui se necessário */}
                <div className="col-span-2 text-center text-slate-400 text-xs italic">Use o formulário completo para edições detalhadas.</div>
              </div>
              <button onClick={() => { 
                const preparedLead = { ...currentLead };
                checkboxFields.forEach(field => {
                  if (preparedLead[field] !== undefined) {
                    preparedLead[field] = (preparedLead[field] === 'true' || preparedLead[field] === 'sim' || preparedLead[field] === true) ? 'sim' : 'nao';
                  }
                });
                onSave(preparedLead); 
                setShowForm(false); 
              }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          )}

          {!showForm && (
            <div className="space-y-6">
              {/* Carrossel de Mídia e CRLV - Lado a Lado (50/50) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carrossel de Mídia */}
                <div className="bg-slate-900 p-4 rounded-[32px] aspect-video relative flex items-center justify-center overflow-hidden shadow-xl">
                  {mediaItems.length > 0 ? (
                    <>
                      {renderMedia(mediaItems[currentPhotoIndex], currentPhotoIndex)}
                      {mediaItems.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))} 
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white z-10 transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button 
                            onClick={() => setCurrentPhotoIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white z-10 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-white/40 font-bold">Sem mídia disponível</span>
                  )}
                </div>

                {/* CRLV Preview (50%) */}
                <div 
                  onClick={() => setShowDataModal(true)}
                  className="bg-slate-800 p-4 rounded-[32px] aspect-video flex items-center justify-center border border-white/10 cursor-pointer hover:bg-slate-700 transition-colors relative overflow-hidden shadow-xl group"
                >
                  {currentLead.crlv_url ? (
                    currentLead.crlv_url.toLowerCase().includes('.pdf') ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-blue-400" />
                        <span className="text-xs text-white font-bold">Ver PDF do CRLV</span>
                      </div>
                    ) : (
                      <img src={currentLead.crlv_url} alt="CRLV" className="w-full h-full object-cover rounded-xl" />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/40">
                      <FileText className="w-12 h-12" />
                      <span className="text-xs font-bold uppercase tracking-widest">CRLV não disponível</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs bg-black/50 px-3 py-1.5 rounded-full">Clique para Ver Detalhes</span>
                  </div>
                </div>
              </div>

              {/* Botão Avaliar Veículo */}
              <button onClick={() => setShowDataModal(true)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg transform hover:scale-[1.01] active:scale-[0.99]">
                <FileText className="w-5 h-5" /> Avaliar Veículo (Formulário Completo)
              </button>
              {/* Benefícios */}
              <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-accent" /> Benefícios do Veículo
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {['ar_condicionado', 'direcao_hidraulica', 'bancos_couro', 'vidros_eletricos', 'travas_eletricas', 'alarme', 'som_multimidia', 'rodas_liga_leve', 'sensor_re', 'camera_re', 'teto_solar', 'airbag', 'chave_reserva', 'revisoes_dia', 'abs', 'computador_bordo', 'piloto_automatico'].map(key => (currentLead[key] === 'sim' || currentLead[key] === true) && (
                    <span key={key} className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-md text-[9px] font-bold capitalize">{key.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>

                {/* Modais de Envio */}
                {showUserModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-4">Enviar Proposta ao Usuário</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Olá {currentLead.cliente_nome}, temos uma excelente proposta para o seu veículo {currentLead.marca} {currentLead.modelo}. 
                        O valor é de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalValue)}. 
                        Não perca essa oportunidade, vamos fechar negócio?
                      </p>
                      <button 
                        onClick={async () => { 
                          await supabase.from('internal_messages').insert({
                            sender_id: (await supabase.auth.getUser()).data.user?.id,
                            receiver_id: currentLead.user_id, // Assuming currentLead has user_id
                            content: `Olá ${currentLead.cliente_nome}, temos uma excelente proposta para o seu veículo ${currentLead.marca} ${currentLead.modelo}. O valor é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalValue)}. Não perca essa oportunidade, vamos fechar negócio?`
                          });
                          setShowUserModal(false); 
                          setShowSuccessPopup(true); 
                        }} 
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                      >
                        Enviar Mensagem
                      </button>
                    </div>
                  </div>
                )}
                {showWhatsAppBuyerModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowWhatsAppBuyerModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Selecionar Comprador (WhatsApp)</h3>
                        <button onClick={() => setShowWhatsAppBuyerModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {['Todos', 'Carro', 'Moto', 'Caminhão'].map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setBuyerFilter(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${buyerFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          > 
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                          {buyers
                            .filter(b => buyerFilter === 'Todos' || b.category === buyerFilter)
                            .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
                            .map(buyer => (
                              <button 
                                key={buyer.id} 
                                onClick={() => {
                                  const phone = buyer.phone?.replace(/\D/g, '');
                                  if (!phone) {
                                    alert('Este comprador não possui WhatsApp cadastrado.');
                                    return;
                                  }

                                  // Gerar mensagem
                                  let message = `*Oportunidade de Veículo - #${currentLead.vehicle_code}*\n\n`;
                                  message += `*Veículo:* ${currentLead.marca} ${currentLead.modelo}\n`;
                                  message += `*Ano:* ${currentLead.ano_modelo}\n`;
                                  message += `*Cor:* ${currentLead.cor}\n`;
                                  message += `*KM:* ${currentLead.quilometragem || currentLead.mileage || 'N/A'}\n`;
                                  message += `*Placa:* ${currentLead.placa || 'N/A'}\n`;
                                  
                                  if (currentLead.observacoes) {
                                    message += `\n*Descrição:* ${currentLead.observacoes}\n`;
                                  }

                                  // Detalhes técnicos
                                  message += `\n*Detalhes Técnicos:*\n`;
                                  const techDetails = [
                                    { label: 'Teto Solar', key: 'teto_solar' },
                                    { label: 'Airbag', key: 'airbag' },
                                    { label: 'Ar Condicionado', key: 'ar_condicionado' },
                                    { label: 'Direção Hidráulica', key: 'direcao_hidraulica' },
                                    { label: 'Vidros Elétricos', key: 'vidros_eletricos' },
                                    { label: 'Travas Elétricas', key: 'travas_eletricas' },
                                    { label: 'Alarme', key: 'alarme' },
                                    { label: 'Som/Multimídia', key: 'som_multimidia' },
                                    { label: 'Bancos de Couro', key: 'bancos_couro' },
                                    { label: 'Rodas de Liga Leve', key: 'rodas_liga_leve' },
                                    { label: 'Sensor de Ré', key: 'sensor_re' },
                                    { label: 'Câmera de Ré', key: 'camera_re' },
                                    { label: 'Chave Reserva/Manual', key: 'chave_reserva_manual' },
                                    { label: 'Revisões em Dia', key: 'revisoes_dia' }
                                  ];

                                  techDetails.forEach(detail => {
                                    if (currentLead[detail.key] === 'sim' || currentLead[detail.key] === 'true' || currentLead[detail.key] === true) {
                                      message += `- ${detail.label}\n`;
                                    }
                                  });

                                  // Problemas/Avarias
                                  if (currentLead.problemas && currentLead.problemas.length > 0) {
                                    message += `\n*Avarias/Observações:*\n`;
                                    currentLead.problemas.forEach((p: string) => message += `- ${p}\n`);
                                  }

                                  // Fotos e Vídeos
                                  if (mediaItems.length > 0) {
                                    message += `\n*Fotos e Vídeos:*\n`;
                                    mediaItems.slice(0, 5).forEach((url, idx) => {
                                      message += `${idx + 1}. ${url}\n`;
                                    });
                                    if (mediaItems.length > 5) {
                                      message += `... e mais ${mediaItems.length - 5} arquivos.\n`;
                                    }
                                  }

                                  const encodedMessage = encodeURIComponent(message);
                                  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
                                  setShowWhatsAppBuyerModal(false);
                                }}
                                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-emerald-500 transition-all group text-left"
                              >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                      <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">{buyer.name}</p>
                                      <p className="text-xs text-slate-500">{buyer.phone || 'Sem telefone'}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking</span>
                                    <span className="text-sm font-bold text-emerald-600">{buyer.ranking || 0}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
                {showBuyerModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBuyerModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Selecionar Compradores</h3>
                        <button onClick={() => setSelectedBuyers(buyers.map(b => b.id))} className="text-xs font-bold text-blue-600">Selecionar Todos</button>
                      </div>
                      
                      {/* Filter */}
                      <div className="flex gap-2 mb-4">
                        {['Todos', 'Carro', 'Moto', 'Caminhão'].map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setBuyerFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${buyerFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                          > 
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                          {buyers
                            .filter(b => buyerFilter === 'Todos' || b.category === buyerFilter)
                            .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
                            .map(buyer => (
                              <label key={buyer.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedBuyers.includes(buyer.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedBuyers([...selectedBuyers, buyer.id]);
                                        else setSelectedBuyers(selectedBuyers.filter(id => id !== buyer.id));
                                      }}
                                    />
                                    {buyer.name}
                                  </div>
                                  <span className="text-xs text-slate-400">Ranking: {buyer.ranking || 0}</span>
                              </label>
                          ))}
                      </div>
                      <button 
                        onClick={() => { setShowBuyerModal(false); setShowBuyerConfigModal(true); }} 
                        className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold"
                        disabled={selectedBuyers.length === 0}
                      >
                        Continuar ({selectedBuyers.length} selecionados)
                      </button>
                    </div>
                  </div>
                )}
                {showBuyerConfigModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBuyerConfigModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-4">Configurar Envio</h3>
                      <div className="space-y-4">
                          <h4 className="font-bold text-sm">Dados do Veículo</h4>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Dados do Veículo</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Avarias</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Documentos</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Fotos e Vídeos</label>
                          
                          <h4 className="font-bold text-sm pt-4 border-t">Dados do Usuário (Opcional)</h4>
                          <label className="flex items-center gap-2"><input type="checkbox" /> Nome do Cliente</label>
                          <label className="flex items-center gap-2"><input type="checkbox" /> E-mail</label>
                          <label className="flex items-center gap-2"><input type="checkbox" /> WhatsApp</label>
                          
                          <button 
                            onClick={async () => { 
                              // Send messages to all selected buyers
                              for (const buyerId of selectedBuyers) {
                                await supabase.from('internal_messages').insert({
                                  sender_id: (await supabase.auth.getUser()).data.user?.id,
                                  receiver_id: buyerId,
                                  content: `Proposta para o veículo: ${currentLead.marca} ${currentLead.modelo} - ${currentLead.vehicle_code}`
                                });
                              }
                              setShowBuyerConfigModal(false); 
                              setShowSuccessPopup(true); 
                            }} 
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                          >
                            Enviar Relatório
                          </button>
                      </div>
                    </div>
                  </div>
                )}
                {showSuccessPopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-2">Sucesso!</h3>
                      <p className="text-sm text-slate-600 mb-6">Informações enviadas com sucesso.</p>
                      <button onClick={() => setShowSuccessPopup(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Fechar</button>
                    </div>
                  </div>
                )}
                {repairModal.field && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setRepairModal({ field: null, value: '' })}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-4">Orçamento de Reparo</h3>
                      <p className="text-sm text-slate-600 mb-6">Informe o valor do conserto para: {repairModal.field.replace('is_', '').replace(/_/g, ' ')}</p>
                      <input
                        type="number"
                        value={repairModal.value}
                        onChange={(e) => setRepairModal({ ...repairModal, value: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mb-6 outline-none"
                        placeholder="Valor do conserto"
                      />
                      <div className="flex gap-4">
                        <button onClick={() => setRepairModal({ field: null, value: '' })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancelar</button>
                        <button onClick={() => {
                          const fieldMap: Record<string, string> = {
                              'is_ipva_multas_atrasados': 'valor_ipva_multa',
                              'is_motor_fundido': 'motor_reparo',
                              'is_batido_avariado': 'batido_reparo',
                              'is_cambio_defeito': 'cambio_reparo'
                          };
                          setCurrentLead({ ...currentLead, [repairModal.field!]: 'sim', [fieldMap[repairModal.field!]]: repairModal.value });
                          setRepairModal({ field: null, value: '' });
                        }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">Salvar</button>
                      </div>
                    </div>
                  </div>
                )}
                {showDataModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDataModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-6">Formulário Completo</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna Esquerda: Preview de Mídia/CRLV */}
                        <div className="space-y-4">
                          <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                            {mediaItems.length > 0 ? (
                              renderMedia(mediaItems[currentPhotoIndex], currentPhotoIndex)
                            ) : (
                              <span className="text-slate-400 font-bold">Sem mídia disponível</span>
                            )}
                          </div>
                          {/* Input de CRLV como preview */}
                          <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2">
                             {currentLead.crlv_url ? (
                               <div className="relative w-full h-48 flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
                                 {currentLead.crlv_url.toLowerCase().includes('.pdf') ? (
                                   <div className="flex flex-col items-center gap-2">
                                     <FileText className="w-12 h-12 text-blue-500" />
                                     <a href={currentLead.crlv_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-bold">
                                       Ver PDF do CRLV
                                     </a>
                                   </div>
                                 ) : (
                                   <img src={currentLead.crlv_url} alt="CRLV" className="w-full h-full object-cover" />
                                 )}
                                 <button 
                                   onClick={() => handleFieldChange('crlv_url', '')}
                                   className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full z-10 hover:bg-red-600 transition-colors"
                                   title="Remover CRLV"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               </div>
                             ) : (
                               <label className={`text-sm font-bold text-slate-600 cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center ${isUploadingCRLV ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  {isUploadingCRLV ? (
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Upload className="w-8 h-8 text-slate-400" />
                                  )}
                                  {isUploadingCRLV ? 'Enviando e Lendo CRLV...' : 'Selecionar Foto ou PDF do CRLV'}
                                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleCRLVUpload} disabled={isUploadingCRLV} />
                               </label>
                             )}
                          </div>
                        </div>

                        {/* Coluna Direita: Formulário */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                          {[
                            { label: 'Tipo de Veículo', key: 'tipo_veiculo' },
                            { label: 'Cliente', key: 'cliente_nome', hidden: userRole === 'buyer_premium' },
                            { label: 'Telefone', key: 'telefone', hidden: userRole === 'buyer_premium' },
                            { label: 'E-mail', key: 'email', hidden: userRole === 'buyer_premium' },
                            { label: 'Placa', key: 'placa' },
                            { label: 'Marca', key: 'marca' },
                            { label: 'Modelo', key: 'modelo' },
                            { label: 'Ano Fabricação', key: 'ano_fabricacao' },
                            { label: 'Ano Modelo', key: 'ano_modelo' },
                            { label: 'Cor', key: 'cor' },
                            { label: 'Quilometragem', key: 'quilometragem' },
                            { label: 'Valor FIPE', key: 'valor_fipe' },
                            { label: 'Valor Entrada', key: 'entrada' },
                            { label: 'Banco Financiamento', key: 'banco_financiamento' },
                            { label: 'Total Parcelas', key: 'total_parcelas' },
                            { label: 'Parcelas Pagas', key: 'parcelas_pagas' },
                            { label: 'Parcelas Atrasadas', key: 'parcelas_atrasadas' },
                            { label: 'Valor Parcela', key: 'valor_parcela' },
                            { label: 'IPVA/Multas Atrasadas', key: 'multas' },
                            { label: 'Reparo Motor', key: 'motor_reparo' },
                            { label: 'Reparo Câmbio', key: 'cambio_reparo' },
                            { label: 'Reparo Batido', key: 'batido_reparo' },
                            { label: 'Tem Sinistro?', key: 'tem_sinistro' },
                            { label: 'Passagem por Leilão?', key: 'passagem_leilao' },
                            { label: 'Recuperado de Banco?', key: 'recuperado_banco' },
                            { label: 'Histórico de Furto/Roubo?', key: 'historico_furto_roubo' },
                            { label: 'Tipo de Monta (Danos)', key: 'avarias_manuais' },
                            { label: 'Financiamento Atrasado', key: 'financiamento_atrasado' },
                            { label: 'Busca e Apreensão', key: 'busca_apreensao' },
                            { label: 'Renajud / Bloqueio Judicial', key: 'renajud_bloqueio' },
                            { label: 'Sinistrado / Leilão', key: 'sinistrado_leilao' },
                          ].filter(field => !field.hidden).map(field => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                              {field.key === 'tipo_veiculo' ? (
                                <input 
                                  type="text"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                  value={
                                    currentLead.tipo_veiculo === 'NLVO' || currentLead.vehicle_code === 'NLVO' ? 'Carro' :
                                    currentLead.tipo_veiculo === 'TJRM' || currentLead.vehicle_code === 'TJRM' ? 'Caminhão' :
                                    currentLead.tipo_veiculo === 'ADBV' || currentLead.vehicle_code === 'ADBV' ? 'Buggy' :
                                    currentLead.tipo_veiculo === 'Carros' ? 'Carro' :
                                    currentLead.tipo_veiculo === 'Motos' ? 'Moto' :
                                    currentLead.tipo_veiculo === 'Caminhões' ? 'Caminhão' :
                                    currentLead.tipo_veiculo || 'Não informado'
                                  }
                                  readOnly
                                />
                              ) : field.key === 'avarias_manuais' ? (
                                <input 
                                  type="text"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                  value={currentLead.avarias_manuais || (currentLead.observacoes?.match(/Danos: ([^.]+)/)?.[1] || '')}
                                  readOnly
                                />
                              ) : ['tem_sinistro', 'passagem_leilao', 'recuperado_banco', 'historico_furto_roubo', 'financiamento_atrasado', 'busca_apreensao', 'renajud_bloqueio', 'sinistrado_leilao'].includes(field.key) ? (
                                <input 
                                  type="text"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                  value={
                                    (currentLead.problemas?.includes(
                                      field.key === 'financiamento_atrasado' ? 'Financiamento Atrasado' :
                                      field.key === 'busca_apreensao' ? 'Busca e Apreensão' :
                                      field.key === 'renajud_bloqueio' ? 'Renajud / Bloqueio Judicial' :
                                      field.key === 'sinistrado_leilao' ? 'Sinistrado / Leilão' : 
                                      field.key === 'recuperado_banco' ? 'Recuperado de Banco' :
                                      field.key === 'historico_furto_roubo' ? 'Histórico de Furto/Roubo' :
                                      field.key === 'passagem_leilao' ? 'Passagem por Leilão' :
                                      field.key === 'tem_sinistro' ? 'Sinistro' : ''
                                    ) || 
                                    currentLead[field.key] === 'true' || 
                                    currentLead[field.key] === true ||
                                    currentLead[field.key] === 'sim')
                                    ? 'Sim' : 'Não'
                                  }
                                  readOnly
                                />
                              ) : (
                                <input 
                                  type="text"
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" 
                                  value={currentLead[field.key] ?? ''} 
                                  readOnly
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button onClick={() => setShowDataModal(false)} className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Fechar</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Detalhamento da Proposta */}
                  <div className="bg-slate-50 p-8 rounded-[32px] space-y-4">
                    <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Detalhamento da Proposta</h3>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold">Enviar para Usuário</button>
                      <button onClick={() => setShowBuyerModal(true)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">Enviar para Comprador</button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Tabela FIPE</span><span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span></div>
                      <div className="flex justify-between text-red-500 group cursor-pointer relative">
                        <span>Descontos Aplicados</span>
                        <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span>
                        <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                          {calc.discounts.map((d, i) => (
                            <div key={i} className="flex justify-between text-xs mb-1 text-red-500 font-bold">
                              <span>{d.name}</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-red-500 group cursor-pointer relative">
                        <span>Descontos fixo\avaria\doc</span>
                        <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span>
                        <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                          {calc.fixedCostsDetail.map((d, i) => (
                            <div key={i} className="flex justify-between text-xs mb-1 text-slate-600">
                              <span>{d.name}</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-red-500 group cursor-pointer relative">
                        <span>Quitação Estimada</span>
                        <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                        <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                            <div className="flex justify-between text-xs text-slate-600 mb-1 font-bold border-b border-slate-100 pb-1">
                                <span>Valor da Parcela</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorParcela)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-2 font-bold border-b border-slate-100 pb-1">
                                <span>Juros Mensal (Config)</span>
                                <span>{calc.payoffBreakdown.jurosParcelas}%</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Qtd a Vencer</span>
                                <span>{calc.payoffBreakdown.qtdAVencer}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Valor a Vencer</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorAVencer)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Qtd Atrasadas</span>
                                <span>{calc.payoffBreakdown.qtdAtrasadas}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Valor Atrasadas</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorAtrasadas)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Juros Atrasadas ({calc.payoffBreakdown.jurosParcelas}%)</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.jurosAtrasadas)}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-600">
                                <span>Total Quitação</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                            </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex justify-between items-center group cursor-pointer relative">
                        <span className="font-bold text-lg text-slate-900">Proposta Final</span>
                        <div className="flex flex-col items-end">
                          <span className={`font-bold text-lg ${getProposalClass(proposalValue) || 'text-slate-900'}`}>
                            {formatProposalValue(proposalValue)}
                          </span>
                          {calc.previousProposalValue && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Anterior: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.previousProposalValue)}
                            </span>
                          )}
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-72">
                          <div className="text-xs font-bold mb-2 border-b pb-1 text-slate-900">Comparativo de Propostas</div>
                          <div className={`flex justify-between text-xs mb-1 ${calc.optionA <= calc.optionB ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                            <span>FIPE - Descontos</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.optionA)}</span>
                          </div>
                          <div className={`flex justify-between text-xs mb-1 ${calc.optionB < calc.optionA ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                            <span>Valor Desejado - 40%</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.optionB)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-2 italic">* O sistema seleciona automaticamente o menor valor.</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-medium"><span>Lucro Estimado</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.profit)}</span></div>
                    </div>
                  </div>

                  {/* Análise Financeira */}
                  <div className="bg-slate-900 text-white p-8 rounded-[32px] space-y-8 shadow-2xl">
                    <h3 className="font-bold uppercase text-xs tracking-widest text-white/60 border-b border-white/10 pb-4">Análise Financeira</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between"><span className="text-white/60">FIPE</span><span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span></div>
                      <div className="flex justify-between text-red-400 group cursor-pointer relative"><span className="text-white/60">Descontos Aplicados</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span>
                        <div className="absolute right-0 top-full bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                          {calc.discounts.map((d, i) => (
                            <div key={i} className="flex justify-between text-xs mb-1 text-red-400 font-bold">
                              <span>{d.name}</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-red-400 group cursor-pointer relative"><span className="text-white/60">Descontos fixo\avaria\doc</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span>
                        <div className="absolute right-0 top-full bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                          {calc.fixedCostsDetail.map((d, i) => (
                            <div key={i} className="flex justify-between text-xs mb-1 text-white/60">
                              <span>{d.name}</span>
                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-red-400 group cursor-pointer relative"><span className="text-white/60">Quitação</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                        <div className="absolute right-0 top-full bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                            <div className="flex justify-between text-xs text-white/60 mb-1 font-bold border-b border-white/10 pb-1">
                                <span>Valor da Parcela</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorParcela)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-2 font-bold border-b border-white/10 pb-1">
                                <span>Juros Mensal (Config)</span>
                                <span>{calc.payoffBreakdown.jurosParcelas}%</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Qtd a Vencer</span>
                                <span>{calc.payoffBreakdown.qtdAVencer}</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Valor a Vencer</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorAVencer)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Qtd Atrasadas</span>
                                <span>{calc.payoffBreakdown.qtdAtrasadas}</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Valor Atrasadas</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorAtrasadas)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Juros Atrasadas ({calc.payoffBreakdown.jurosParcelas}%)</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.jurosAtrasadas)}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-xs font-bold text-white">
                                <span>Total Quitação</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                            </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex justify-between items-center group cursor-pointer relative">
                        <span className="text-accent font-bold">PROPOSTA FINAL</span>
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl font-bold font-display ${getProposalClass(proposalValue) || 'text-white'}`}>
                            {formatProposalValue(proposalValue)}
                          </span>
                          {calc.previousProposalValue && (
                            <span className="text-[10px] text-white/40 font-medium">
                              Anterior: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.previousProposalValue)}
                            </span>
                          )}
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-72">
                          <div className="text-xs font-bold mb-2 border-b border-white/10 pb-1 text-white">Comparativo de Propostas</div>
                          <div className={`flex justify-between text-xs mb-1 ${calc.optionA <= calc.optionB ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                            <span>FIPE - Descontos</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.optionA)}</span>
                          </div>
                          <div className={`flex justify-between text-xs mb-1 ${calc.optionB < calc.optionA ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                            <span>Valor Desejado - 40%</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.optionB)}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-2 italic">* O sistema seleciona automaticamente o menor valor.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Modal de Revisão de Proposta */}
        {showProposalReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[32px] w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Revisar e Enviar Proposta</h3>
                  <p className="text-xs text-slate-500">Verifique os dados e o histórico antes de confirmar o envio.</p>
                </div>
                <button onClick={() => setShowProposalReview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Lado Esquerdo: Histórico de Chat */}
                <div className="w-1/2 border-r border-slate-100 flex flex-col bg-slate-50/30">
                  <div className="p-4 border-b border-slate-100 bg-white">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico da Conversa</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center p-8">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma mensagem anterior encontrada.</p>
                      </div>
                    ) : (
                      chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.remetente === 'admin' || msg.remetente === 'bot' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                            msg.remetente === 'admin' 
                              ? 'bg-slate-900 text-white rounded-tr-none' 
                              : msg.remetente === 'bot'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                            <span className="text-[8px] mt-1 block opacity-50">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Lado Direito: Editor de Proposta */}
                <div className="w-1/2 flex flex-col bg-white">
                  <div className="p-4 border-b border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensagem da Proposta</h4>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 group relative">
                      <h5 className="text-[9px] font-bold text-blue-900 mb-1 flex items-center gap-2 uppercase tracking-widest">
                        <DollarSign className="w-3 h-3" /> Resumo Financeiro
                      </h5>
                      <div className="grid grid-cols-2 gap-y-1 text-[9px]">
                        <div className="text-blue-700">Valor FIPE:</div>
                        <div className="text-right font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</div>
                        <div className="text-blue-700 relative cursor-help">
                          Total Deduções:
                          <div className="absolute left-0 top-full bg-white p-2 rounded shadow-lg border border-slate-200 hidden group-hover:block z-10 w-64 text-[10px]">
                            {calc.fixedCostsDetail.map((d: any, i: number) => <p key={i}>{d.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</p>)}
                            {calc.discounts.map((d: any, i: number) => <p key={i}>{d.name}: -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</p>)}
                          </div>
                        </div>
                        <div className="text-right font-bold text-red-600">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue + calc.fixedCosts + calc.payoff)}</div>
                        <div className="text-blue-900 font-black pt-1 border-t border-blue-200">VALOR FINAL:</div>
                        <div className="text-right font-black text-blue-900 pt-1 border-t border-blue-200 text-xs">
                          <span className={getProposalClass(proposalValue)}>
                            {formatProposalValue(proposalValue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-[2] flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editar Saudação e Texto</label>
                      <textarea 
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none font-medium text-slate-700 min-h-[300px]"
                        placeholder="Escreva a mensagem da proposta..."
                      />
                    </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button 
                      onClick={() => setShowProposalReview(false)}
                      className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmSendProposal}
                      className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Confirmar e Enviar Proposta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showNovaPropostaModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowNovaPropostaModal(false)}>
            <div className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Nova Proposta</h3>
              <input 
                type="number" 
                placeholder="Valor da nova proposta" 
                className="w-full p-3 border border-slate-300 rounded-xl mb-4"
                onChange={(e) => setNovaPropostaValor(parseFloat(e.target.value))}
              />
              <button 
                onClick={() => handleSaveNovaProposta(novaPropostaValor)}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
