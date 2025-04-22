
import React from 'react';
import { Loader2 } from 'lucide-react';

const AppLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 text-violet-600 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Verbo...</h2>
        <p className="text-sm text-gray-500">Preparing your chat experience</p>
      </div>
    </div>
  );
};

export default AppLoading;