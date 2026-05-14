import React from 'react';

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "AutoCompra Online",
  "description": "Especialistas na compra e negociação de veículos com dívidas, financiamento atrasado, restrições judiciais e busca e apreensão. Oferecemos serviços de negociação bancária e regularização de situação financeira.",
  "url": "https://autocompra.online",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Serviços de Veículos e Dívidas",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Compra de Carros, Motos e Caminhões com dívidas" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Negociação de financiamento veicular com bancos" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Regularização de restrições (Renajud, Busca e Apreensão)" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Serviços de consultoria para Limpa Nome" } }
    ]
  }
};

const SEOContent = () => {
  return (
    <div className="bg-slate-50 py-16 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      
      <div className="max-w-4xl mx-auto space-y-12 text-slate-700">
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Soluções completas para veículos com problemas financeiros e jurídicos</h2>
          <p className="text-base leading-relaxed mb-4">
            A AutoCompra Online é especialista na compra e negociação de veículos que enfrentam dificuldades financeiras ou jurídicas. 
            Compramos <strong>carros, motos, caminhões e utilitários</strong>, independentemente da situação atual.
          </p>
          <p className="text-base leading-relaxed">
            Não importa se o seu veículo possui financiamento atrasado, parcelas vencidas, dívidas bancárias, busca e apreensão, restrições Renajud, registros de sinistros, histórico de leilão, multas pesadas ou restrições administrativas. Nós analisamos caso a caso, assumimos a burocracia e oferecemos a melhor proposta para que você resolva suas pendências e recupere sua tranquilidade financeira.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Negociação de dívidas, regularização e Limpeza de Nome</h2>
          <p className="text-base leading-relaxed mb-4">
            Além da compra direta do veículo, nossa equipe atua fortemente na <strong>negociação de dívidas junto a bancos e financeiras</strong>. Nosso objetivo é reduzir o impacto do passivo veicular no seu orçamento, mediando acordos que permitam a regularização das pendências.
          </p>
          <p className="text-base leading-relaxed">
            Muitas vezes, a dívida de um veículo é o principal impedimento para o sucesso do "limpa nome". Ao resolver a pendência veicular através de negociação ou venda, ajudamos você a se reestabelecer financeiramente e limpar seu nome no mercado.
          </p>
        </section>

        <section className="border-t border-slate-200 pt-12 mt-12">
          <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Perguntas Frequentes (FAQ) sobre Dívidas Veiculares</h2>
          <div className="space-y-6">
            <details className="group border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Compram carro, moto ou caminhão com financiamento atrasado?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm mt-3 pt-3 border-t border-slate-100 text-slate-600">Sim. Compramos de forma segura todos os tipos de veículos (leves, pesados e motos) mesmo que estejam com parcelas de financiamento em atraso e dívidas acumuladas.</p>
            </details>
            <details className="group border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                O que é Busca e Apreensão e como vocês resolvem?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm mt-3 pt-3 border-t border-slate-100 text-slate-600">A busca e apreensão é uma medida judicial em casos de atraso grave. Nós realizamos a negociação diretamente com o banco autor ("portador da dívida") para tentar suspender a ação, realizar o pagamento da dívida ou viabilizar a transferência do bem, impedindo perda total.</p>
            </details>
            <details className="group border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Vocês ajudam na "Limpeza de Nome"?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm mt-3 pt-3 border-t border-slate-100 text-slate-600">Sim. Ao liquidar ou renegociar a dívida do veículo que estava em seu nome, você remove o principal causador da restrição bancária (SPC/Serasa), facilitando o processo de regularização do seu CPF.</p>
            </details>
            <details className="group border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                Compram veículos com Renajud ou restrições administrativas?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm mt-3 pt-3 border-t border-slate-100 text-slate-600">Sim. Avaliamos veículos com diversas restrições judiciais (como Renajud) e administrativas, buscando alternativas legais de negociação e quitação para resolver o problema para você.</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SEOContent;
