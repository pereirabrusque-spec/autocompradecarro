import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAiMode = () => {
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ai_crm_mode');
    return saved === 'true';
  });

  useEffect(() => {
    let isMounted = true;
    const loadMode = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'AI_CRM_MODE')
          .maybeSingle();
        
        if (isMounted && data) {
          const mode = data.value === 'true';
          setIsAiMode(mode);
          localStorage.setItem('ai_crm_mode', mode.toString());
        }
      } catch (err) {
        console.error('Erro ao carregar modo IA:', err);
      }
    };
    loadMode();
    return () => { isMounted = false; };
  }, []);

  const toggleAiMode = async (newMode: boolean) => {
    setIsAiMode(newMode);
    localStorage.setItem('ai_crm_mode', newMode.toString());
    try {
      await supabase.from('settings').upsert({ 
        key: 'AI_CRM_MODE', 
        value: newMode.toString()
      }, { onConflict: 'key' });
    } catch (err) {
      console.error('Erro ao salvar modo IA:', err);
    }
  };

  return { isAiMode, toggleAiMode };
};
