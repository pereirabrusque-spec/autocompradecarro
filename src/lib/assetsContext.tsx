import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

interface Asset {
  id: string;
  legenda: string;
  url: string;
  tipo: string;
}

interface AssetsContextType {
  assets: Record<string, string>;
  isLoading: boolean;
  refreshAssets: () => Promise<void>;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;

      const assetMap: Record<string, string> = {};
      data?.forEach(asset => {
        if (asset.tipo) {
          assetMap[asset.tipo] = asset.url;
        }
      });
      setAssets(assetMap);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <AssetsContext.Provider value={{ assets, isLoading, refreshAssets: fetchAssets }}>
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
}
