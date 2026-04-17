import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    <p className="text-gray-500 font-medium">正在从云端获取作品，请稍候...</p>
  </div>
);
