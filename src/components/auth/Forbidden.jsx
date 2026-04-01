import React from 'react';
import { useRouter } from 'next/router';
import useAuthError from '@/hooks/useAuthError';

const Forbidden = () => {
  const router = useRouter();
  const { clearAuthError } = useAuthError();

  const handleGoBack = () => {
    clearAuthError();
    router.back();
  };

  const handleRetry = () => {
    clearAuthError();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-yellow-500">403</h1>
        <h2 className="text-2xl font-semibold text-white">Доступ запрещён</h2>
        <p className="text-lg text-gray-400 max-w-md">
          У вас нет прав доступа к этому ресурсу. Свяжитесь с администратором, если считаете это ошибкой.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Повторить
          </button>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
