import { useEffect, useState } from 'react';

interface SecurityStatus {
  isSecure: boolean;
  lastCheck: string;
  issues: string[];
}

interface UseSecurityReturn {
  securityStatus: SecurityStatus;
  checkSecurity: () => Promise<void>;
}

export function useSecurity(): UseSecurityReturn {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecure: true,
    lastCheck: new Date().toISOString(),
    issues: [],
  });

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    try {
      const response = await fetch('/api/security/check');
      const data = await response.json();
      setSecurityStatus(data);
    } catch (error) {
      console.error('Error checking security:', error);
      setSecurityStatus({
        isSecure: false,
        lastCheck: new Date().toISOString(),
        issues: ['Failed to check security status'],
      });
    }
  };

  return { securityStatus, checkSecurity };
} 