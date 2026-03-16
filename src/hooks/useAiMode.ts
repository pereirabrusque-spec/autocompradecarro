import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAiMode = () => {
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ai_crm_enabled');
    return saved === 'true';
  });

  useEffect(() => {
    let isMounted = true;
    const loadMode = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'AI_CRM_ENABLED')
          .maybeSingle();
        
        if (isMounted && data) {
          const mode = data.value === 'true';
          setIsAiMode(mode);
          localStorage.setItem('ai_crm_enabled', mode.toString());
        }
      } catch (err) {
        console.error('Erro ao carregar modo IA:', err);
      }
    };
    loadMode();

    // Real-time listener for AI mode changes
    const channel = supabase
      .channel('ai_mode_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings'
      }, (payload) => {
        if (isMounted && payload.new && (payload.new as any).key === 'AI_CRM_ENABLED') {
          const mode = (payload.new as any).value === 'true';
          console.log('[useAiMode] Modo IA atualizado via Realtime:', mode);
          setIsAiMode(mode);
          localStorage.setItem('ai_crm_enabled', mode.toString());
        }
      })
      .subscribe();

    return () => { 
      isMounted = false; 
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleAiMode = async (newMode: boolean) => {
    console.log('[useAiMode] Toggling AI mode to:', newMode);
    setIsAiMode(newMode);
    localStorage.setItem('ai_crm_enabled', newMode.toString());
    try {
      const { error } = await supabase.from('settings').upsert({ 
        key: 'AI_CRM_ENABLED', 
        value: newMode.toString()
      }, { onConflict: 'key' });
      
      if (error) throw error;
      console.log('[useAiMode] AI mode saved to DB');
    } catch (err) {
      console.error('Erro ao salvar modo IA:', err);
    }
  };

  return { isAiMode, toggleAiMode };
};
