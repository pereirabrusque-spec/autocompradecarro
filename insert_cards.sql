-- Insert Default Cards into Banners table
INSERT INTO public.banners (tipo, url, badge_text, button_text, button_link, legenda, ordem) VALUES
('card_carro_1', 'https://images.unsplash.com/photo-1597328290883-50c5787b7c7e?auto=format&fit=crop&q=80&w=800', 'CARRO', 'TRANSFORME SEU PREJUÍZO EM DINHEIRO VIVO AGORA.', '/vender', 'Carro 1', 10),
('card_carro_2', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800', 'CARRO', 'MOTOR ESTOURADO? NÓS COMPRAMOS E ASSUMIMOS O CONSERTO.', '/vender', 'Carro 2', 11),
('card_carro_3', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800', 'CARRO', 'FINANCIADO E ATRASADO? SAIA DA DÍVIDA AGORA.', '/vender', 'Carro 3', 12),
('card_carro_4', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800', 'CARRO', 'CARRO BLOQUEADO? LIBERTE SEU NOME E RECEBA POR ELE.', '/vender', 'Carro 4', 13),
('card_carro_5', 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&q=80&w=800', 'CARRO', 'SEU CARRO PARADO ESTÁ PERDENDO VALOR. VENDA HOJE!', '/vender', 'Carro 5', 14),

('card_moto_1', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', 'MOTO', 'MOTO BATIDA NÃO PRECISA SER SUCATA. FAÇA UM ORÇAMENTO.', '/vender', 'Moto 1', 20),
('card_moto_2', 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80&w=800', 'MOTO', 'PAGAMOS PREÇO JUSTO MESMO COM MOTOR QUEBRADO.', '/vender', 'Moto 2', 21),
('card_moto_3', 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800', 'MOTO', 'TROQUE SUA MOTO COM PROBLEMA POR DINHEIRO NO BOLSO.', '/vender', 'Moto 3', 22),
('card_moto_4', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800', 'MOTO', 'RECUPERAMOS SEU INVESTIMENTO EM MOTOS SINISTRADAS.', '/vender', 'Moto 4', 23),
('card_moto_5', 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800', 'MOTO', 'EVITE A BUSCA E APREENSÃO. NÓS QUITAMOS PARA VOCÊ.', '/vender', 'Moto 5', 24),

('card_truck_1', 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800', 'CAMINHÃO', 'CAMINHÃO BATIDO? RESOLVEMOS A BUROCRACIA E COMPRAMOS.', '/vender', 'Caminhão 1', 30),
('card_truck_2', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800', 'CAMINHÃO', 'CAMINHÃO PARADO É PREJUÍZO. NÓS ASSUMIMOS A REFORMA.', '/vender', 'Caminhão 2', 31),
('card_truck_3', 'https://images.unsplash.com/photo-1591768793355-74d74b262bb4?auto=format&fit=crop&q=80&w=800', 'CAMINHÃO', 'PROBLEMAS COM COOPERATIVA? SAIBA COMO LIMPAR SEU NOME.', '/vender', 'Caminhão 3', 32),
('card_truck_4', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800', 'CAMINHÃO', 'LOGÍSTICA PRÓPRIA PARA RETIRAR SEU VEÍCULO ONDE ESTIVER.', '/vender', 'Caminhão 4', 33),
('card_truck_5', 'https://images.unsplash.com/photo-1501700493717-9ae98220b74b?auto=format&fit=crop&q=80&w=800', 'CAMINHÃO', 'ANTECIPE O VALOR DO SEU CAMINHÃO ANTES DO LEILÃO.', '/vender', 'Caminhão 5', 34),

('card_mix_1', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800', 'MIX', 'COMPRAMOS FROTAS COM DÍVIDAS OU PROBLEMAS MECÂNICOS.', '/vender', 'Mix 1', 40),
('card_mix_2', 'https://images.unsplash.com/photo-1530046339160-ce3e5b0c7a2f?auto=format&fit=crop&q=80&w=800', 'MIX', 'ANÁLISE TÉCNICA JUSTA. PAGAMOS O QUE SEU CARRO VALE.', '/vender', 'Mix 2', 41),
('card_mix_3', 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800', 'MIX', 'CONSULTE A TABELA FIPE E RECEBA NOSSA OFERTA.', '/vender', 'Mix 3', 42),
('card_mix_4', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800', 'MIX', 'ASSUMIMOS SUA DÍVIDA NO BANCO. NOME LIMPO JÁ.', '/vender', 'Mix 4', 43),
('card_mix_5', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800', 'MIX', 'MAIS DE 1.000 NEGOCIAÇÕES FEITAS. VEJA A PROPOSTA.', '/vender', 'Mix 5', 44)
ON CONFLICT (tipo) DO UPDATE SET
    badge_text = EXCLUDED.badge_text,
    button_text = EXCLUDED.button_text,
    button_link = EXCLUDED.button_link,
    url = EXCLUDED.url;

-- Insert Settings for Specialist Button
INSERT INTO public.settings (key, value) VALUES
('SPECIALIST_BUTTON_ENABLED', 'false'),
('SPECIALIST_BUTTON_TEXT', 'Falar com Especialista'),
('SPECIALIST_BUTTON_LINK', 'https://wa.me/5511999999999')
ON CONFLICT (key) DO NOTHING;
