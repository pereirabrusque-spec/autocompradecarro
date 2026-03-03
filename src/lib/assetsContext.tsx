import React, { createContext, useContext, useState, useEffect } from 'react';

interface Asset {
  id: number;
  identificador_secao: string;
  url_foto: string;
  legenda: string;
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
      const res = await fetch('/api/assets');
      const data: Asset[] = await res.json();
      const assetMap: Record<string, string> = {};
      data.forEach(asset => {
        assetMap[asset.identificador_secao] = asset.url_foto;
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
