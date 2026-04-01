import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const useAuthError = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthError должен использоваться внутри AuthProvider');
  }
  return context;
};

export default useAuthError;
