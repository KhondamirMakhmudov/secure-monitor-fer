import React from 'react';
import { signOut } from 'next-auth/react';
import useAuthError from '@/hooks/useAuthError';

const Unauthorized = () => {
  const { clearAuthError } = useAuthError();

  const handleLogout = () => {
    clearAuthError();
    signOut({ callbackUrl: '/' });
  };

  const handleRetry = () => {
    clearAuthError();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-red-500">401</h1>
        <h2 className="text-2xl font-semibold text-white">Не авторизован</h2>
        <p className="text-lg text-gray-400 max-w-md">
          Ваша сессия истекла. Пожалуйста, войдите снова.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Повторить
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            Выход
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
