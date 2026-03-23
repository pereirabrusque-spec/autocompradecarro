
export interface ProposalDeduction {
  name: string;
  value: number;
  type: 'fixed' | 'percent';
  isMax?: boolean;
}

export interface ProposalResult {
  baseValue: number;
  fipe: number; // Alias for baseValue
  deductions: ProposalDeduction[];
  finalValue: number;
  previousProposalValue: number | null;
  profitMargin: number;
  profit: number; // Alias for profitMargin
  payoffValue: number;
  payoff: number; // Alias for payoffValue
  clientPayoffValue: number;
  docDebts: number;
  repairDebts: number;
  bankNotRegistered: boolean;
  fixedCosts: number;
  fixedCostsDetail: ProposalDeduction[];
  discounts: ProposalDeduction[];
  discountValue: number;
  valorDesejado: number;
  payoffBreakdown: {
    remainingInstallments: number;
    totalRemaining: number;
    bankDiscount: number;
    atrasadas: number;
    jurosTotal: number;
    totalPayoff: number;
    valorParcela: number;
    jurosParcelas: number;
    qtdAVencer: number;
    valorAVencer: number;
    qtdAtrasadas: number;
    valorAtrasadas: number;
    jurosAtrasadas: number;
  };
  optionA: number;
  optionB: number;
}

export const calculateProposal = (
  lead: any,
  options: {
    fipeRules: any[];
    banks: any[];
    cooperativeDiscount: number;
    profitMarginPercentage: number;
    jurosAtraso: number;
    repairCosts: any[];
    overrides?: { rules: Record<string, number>, repairs: Record<string, number> };
  }
): ProposalResult => {
  const { fipeRules, banks, cooperativeDiscount, profitMarginPercentage, jurosAtraso, repairCosts, overrides } = options;
  
  const hasOverrides = overrides && (Object.keys(overrides.rules || {}).length > 0 || Object.keys(overrides.repairs || {}).length > 0);
  const currentOverrides = hasOverrides ? overrides : (lead.detalhes_proposta?.overrides || { rules: {}, repairs: {} });
  const fipe = Number(lead.valor_fipe) || 0;
  const deductions: ProposalDeduction[] = [];

  // 1. Coletar todos os descontos percentuais (Cooperativa + Regras)
  const percentDiscounts: { name: string; value: number }[] = [];

  // 1.1 Desconto de Cooperativa
  const bankName = lead.banco_financiamento || lead.banco_financiador || '';
  const findCooperativeBank = (name: string) => {
    if (!name) return null;
    const normalizedSearch = name.toLowerCase().trim();
    return banks.find(b => 
      b.is_cooperativa && 
      (normalizedSearch.includes(b.name.toLowerCase().trim()) || 
       b.name.toLowerCase().trim().includes(normalizedSearch))
    );
  };
  
  const coopBank = findCooperativeBank(bankName);
  const isBankCooperative = !!coopBank;
  const hasCooperativeFlag = lead.is_cooperativa === 'true' || 
                             lead.is_cooperativa === true || 
                             lead.is_cooperativa === 'sim';

  if (hasCooperativeFlag || isBankCooperative) {
      const discountToUse = coopBank?.discount_percentage || cooperativeDiscount;
      percentDiscounts.push({ 
        name: `Desconto Cooperativa (${discountToUse}%)`, 
        value: fipe * (discountToUse / 100)
      });
  }

  // 1.2 Descontos por Histórico/Problemas
  const problemasSelecionados = Array.isArray(lead.problemas) ? lead.problemas : (typeof lead.problemas === 'string' ? lead.problemas.split(',').map((p: string) => p.trim()) : []);
  problemasSelecionados.forEach((problem: string) => {
      const rule = fipeRules.find(r => r.condition_name.toLowerCase() === problem.toLowerCase());
      let percentage = 0;
      if (rule) {
        percentage = currentOverrides.rules[rule.id] !== undefined ? currentOverrides.rules[rule.id] : rule.discount_percentage;
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
          percentDiscounts.push({
              name: `${problem} (${percentage}%)`,
              value: fipe * (percentage / 100)
          });
      }
  });

  // 2. Encontrar o maior desconto percentual
  const maxPercentDiscount = percentDiscounts.length > 0 
      ? Math.max(...percentDiscounts.map(d => d.value)) 
      : 0;

  percentDiscounts.forEach(d => {
      deductions.push({
          name: d.name,
          value: d.value,
          type: 'percent',
          isMax: d.value === maxPercentDiscount && maxPercentDiscount > 0
      });
  });

  // 3. Avarias (Deduções por Valor Fixo)
  let repairTotal = 0;
  
  if (lead.motor_reparo) {
    const val = Number(lead.motor_reparo);
    repairTotal += val;
    deductions.push({ name: 'Motor Fundido / Batendo', value: val, type: 'fixed' });
  }
  if (lead.cambio_reparo) {
    const val = Number(lead.cambio_reparo);
    repairTotal += val;
    deductions.push({ name: 'Câmbio com Defeito', value: val, type: 'fixed' });
  }
  if (lead.batido_reparo) {
    const val = Number(lead.batido_reparo);
    repairTotal += val;
    deductions.push({ name: 'Batido / Avariado', value: val, type: 'fixed' });
  }
  
  const allText = `${lead.observacoes || ''} ${problemasSelecionados.join(' ')}`.toLowerCase();
  const avariasSelecionadas = lead.avarias || lead.detalhes_proposta?.avarias || repairCosts.filter(c => allText.includes(c.part_name.toLowerCase())).map(c => c.id) || [];
  
  const avariasManuais = lead.avarias_manuais || lead.detalhes_proposta?.avarias_manuais || [];
  avariasManuais.forEach((avaria: { description: string, value: number }) => {
    const val = Number(avaria.value);
    repairTotal += val;
    deductions.push({ 
      name: `Avaria Manual: ${avaria.description}`, 
      value: val, 
      type: 'fixed' 
    });
  });
  
  repairCosts.forEach(cost => {
    if (avariasSelecionadas.includes(cost.id)) {
      let itemMultiplier = 1;
      if (cost.conditions && cost.conditions.length > 0) {
        for (const cond of cost.conditions) {
          if (fipe >= cond.min_value && fipe <= cond.max_value) {
            itemMultiplier = cond.multiplier;
            break;
          }
        }
      }
      
      let baseCost = cost.cost;
      if (currentOverrides.repairs[cost.id] !== undefined) {
        baseCost = currentOverrides.repairs[cost.id];
      }

      const finalCost = baseCost * itemMultiplier;
      repairTotal += finalCost;
      deductions.push({ 
        name: `Avaria: ${cost.part_name} (x${itemMultiplier})`, 
        value: finalCost, 
        type: 'fixed' 
      });
    }
  });

  // 3. Situação Financeira e Quitação
  let payoffValue = 0;
  let clientPayoffValue = 0;
  let bankNotRegistered = false;
  let payoffBreakdown = {
    remainingInstallments: 0,
    totalRemaining: 0,
    bankDiscount: 0,
    atrasadas: 0,
    jurosTotal: 0,
    totalPayoff: 0,
    valorParcela: 0,
    jurosParcelas: 0,
    qtdAVencer: 0,
    valorAVencer: 0,
    qtdAtrasadas: 0,
    valorAtrasadas: 0,
    jurosAtrasadas: 0
  };
  
  if (lead.valor_parcela && lead.total_parcelas && lead.parcelas_pagas !== undefined) {
    const remainingInstallments = Number(lead.total_parcelas) - Number(lead.parcelas_pagas);
    if (remainingInstallments > 0) {
      const valorParcela = Number(lead.valor_parcela);
      const totalRemaining = remainingInstallments * valorParcela;
      const bank = banks.find(b => b.name.toLowerCase() === bankName.toLowerCase());
      let bankDiscount = 0;

      if (!bank && bankName) {
        bankNotRegistered = true;
        const isCooperativa = bankName.toLowerCase().includes('coop') || bankName.toLowerCase().includes('sicredi') || bankName.toLowerCase().includes('sicoob');
        bankDiscount = isCooperativa ? 0 : 0.35;
      } else if (bank) {
        bankDiscount = (bank.discount_percentage / 100);
      }
      
      payoffValue = totalRemaining * (1 - bankDiscount);
      const atrasadas = Number(lead.parcelas_atrasadas) || 0;
      const jurosTotal = valorParcela * atrasadas * (jurosAtraso / 100);
      clientPayoffValue = totalRemaining + jurosTotal;

      payoffBreakdown = {
        remainingInstallments,
        totalRemaining,
        bankDiscount,
        atrasadas,
        jurosTotal,
        totalPayoff: payoffValue,
        valorParcela,
        jurosParcelas: jurosAtraso,
        qtdAVencer: remainingInstallments - atrasadas,
        valorAVencer: (remainingInstallments - atrasadas) * valorParcela,
        qtdAtrasadas: atrasadas,
        valorAtrasadas: atrasadas * valorParcela,
        jurosAtrasadas: jurosTotal
      };
    }
  }
  
  let docDebts = Number(lead.multas) || Number(lead.valor_ipva_multa) || 0;
  if (currentOverrides.repairs['doc_debts'] !== undefined) {
    docDebts = currentOverrides.repairs['doc_debts'];
  }
  if (docDebts > 0) {
    deductions.push({ name: 'IPVA e Multas Atrasadas', value: docDebts, type: 'fixed' });
  }

  const fixedDeductions = deductions.filter(d => d.type === 'fixed').reduce((acc, d) => acc + d.value, 0);
  const totalDeductions = maxPercentDiscount + fixedDeductions;
  const profitMargin = fipe * (profitMarginPercentage / 100); 
  
  const propostaBase = fipe - totalDeductions - payoffValue - docDebts - profitMargin;
  const valorDesejado = Number(lead.preco_cliente) || Number(lead.desired_value) || 0;
  const limiteDesejado = valorDesejado > 0 ? valorDesejado * 0.6 : propostaBase;

  // Se proposta base < limite desejado (valor desejado - 40%), usa proposta base. Senão usa limite desejado.
  let finalValue = propostaBase;
  if (valorDesejado > 0 && propostaBase > limiteDesejado) {
    finalValue = limiteDesejado;
  }

  if (finalValue < 0) finalValue = 0;

  const novasPropostas = lead.detalhes_proposta?.novas_propostas || [];
  const latestNovaProposta = novasPropostas.length > 0 ? novasPropostas[novasPropostas.length - 1] : null;
  const previousProposalValue = novasPropostas.length > 0 
    ? (novasPropostas.length > 1 ? novasPropostas[novasPropostas.length - 2].valor : finalValue)
    : null;

  const finalProposalValue = latestNovaProposta?.valor || finalValue;
  const calculatedProfitMargin = fipe - (fipe * 0.2) - maxPercentDiscount - repairTotal - finalProposalValue;
  const optionA = propostaBase;
  const optionB = limiteDesejado;

  return {
    baseValue: fipe,
    fipe,
    deductions,
    finalValue: finalProposalValue,
    previousProposalValue,
    profitMargin: calculatedProfitMargin,
    profit: calculatedProfitMargin,
    payoffValue,
    payoff: payoffValue,
    clientPayoffValue,
    docDebts,
    repairDebts: repairTotal,
    bankNotRegistered,
    fixedCosts: fixedDeductions,
    fixedCostsDetail: deductions.filter(d => d.type === 'fixed'),
    discounts: deductions.filter(d => d.type === 'percent'),
    discountValue: maxPercentDiscount,
    valorDesejado,
    payoffBreakdown,
    optionA,
    optionB
  };
};
