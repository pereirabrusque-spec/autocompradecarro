import React from 'react';

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "name": "AutoCompra Online",
  "description": "Compra e negociação de veículos financiados, veículos com dívidas, busca e apreensão, e restrições financeiras.",
  "url": "https://autocompra.online",
  "areaServed": "BR",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Serviços de Compra de Veículos",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Compra de veículo com financiamento atrasado" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Negociação de veículos financiados e dívidas bancárias" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Compra de veículo com busca e apreensão" } }
    ]
  }
};

const SEOContent = () => {
  return (
    <div className="bg-white py-12 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      
      <div className="max-w-4xl mx-auto space-y-8 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Compramos veículos com problemas</h2>
          <p className="text-sm leading-relaxed">
            Compramos carros, motos, caminhões e utilitários com financiamento atrasado,
            dívidas bancárias, busca e apreensão, Renajud, sinistro, motor fundido,
            câmbio quebrado, multas e restrições administrativas. Nosso processo é 100% seguro e transparente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Negociação de dívida veicular</h2>
          <p className="text-sm leading-relaxed">
            Realizamos negociação de financiamento com bancos e financeiras.
            Avaliamos veículos financiados, atrasados e com parcelas em aberto, proporcionando uma saída rápida para sua dívida.
          </p>
        </section>

        <section className="border-t border-slate-100 pt-8 mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Perguntas Frequentes (FAQ)</h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none">Compram carro financiado?</summary>
              <p className="text-sm mt-2 pl-4 text-slate-500">Sim, avaliamos veículos financiados e atrasados, cuidando do processo de negociação.</p>
            </details>
            <details className="group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none">Compram moto com dívida?</summary>
              <p className="text-sm mt-2 pl-4 text-slate-500">Sim, analisamos motos com parcelas em atraso e restrições financeiras variadas.</p>
            </details>
            <details className="group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none">Compram caminhão com busca e apreensão?</summary>
              <p className="text-sm mt-2 pl-4 text-slate-500">Sim, avaliamos caminhões com restrições, busca e apreensão e negociações bancárias ativas.</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SEOContent;
