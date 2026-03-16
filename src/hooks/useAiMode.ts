import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAiMode = () => {
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ai_crm_mode');
    return saved === 'true';
  });

  useEffect(() => {
    const loadMode = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'AI_CRM_MODE').single();
      if (data) {
        const mode = data.value === 'true';
        setIsAiMode(mode);
        localStorage.setItem('ai_crm_mode', mode.toString());
      }
    };
    loadMode();
  }, []);

  const toggleAiMode = async (newMode: boolean) => {
    setIsAiMode(newMode);
    localStorage.setItem('ai_crm_mode', newMode.toString());
    await supabase.from('settings').upsert({ key: 'AI_CRM_MODE', value: newMode.toString() });
  };

  return { isAiMode, toggleAiMode };
};
