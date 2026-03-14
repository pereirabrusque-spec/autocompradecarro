export const logToStorage = (message: string, type: 'info' | 'error' | 'debug' = 'info', data?: any) => {
  try {
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    const newLog = {
      timestamp: new Date().toISOString(),
      message,
      type,
      data
    };
    localStorage.setItem('app_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
  } catch (e) {
    console.error('Error logging to storage:', e);
  }
};

export const getStorageLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('app_logs') || '[]');
  } catch (e) {
    return [];
  }
};

export const clearStorageLogs = () => {
  localStorage.removeItem('app_logs');
};
