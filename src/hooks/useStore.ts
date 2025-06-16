import { useEffect, useState } from 'react';

interface StoreData {
  [key: string]: any;
}

interface UseStoreReturn {
  storeData: StoreData;
  performAction: (action: string, data?: any) => Promise<void>;
}

export function useStore(): UseStoreReturn {
  const [storeData, setStoreData] = useState<StoreData>({});

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const response = await fetch('/api/store');
      const data = await response.json();
      setStoreData(data);
    } catch (error) {
      console.error('Error fetching store data:', error);
    }
  };

  const performAction = async (action: string, data?: any) => {
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform store action');
      }

      // Refresh store data after action
      await fetchStoreData();
    } catch (error) {
      console.error('Error performing store action:', error);
    }
  };

  return { storeData, performAction };
} 