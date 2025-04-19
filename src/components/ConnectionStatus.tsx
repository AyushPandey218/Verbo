
import React from 'react';
import { AlertCircle, CheckCircle2, WifiOff, InfoIcon, ExternalLink } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEBUG_CONNECTION_STATUS, USING_DEFAULT_FIREBASE_CONFIG } from '@/utils/config';

interface ConnectionStatusProps {
  connected: boolean;
  reconnecting?: boolean;
  error?: string | null;
  showText?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  connected, 
  reconnecting = false, 
  error = null,
  showText = false
}) => {
  const getIcon = () => {
    if (connected) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (reconnecting) return <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };
  
  const getStatusText = () => {
    if (connected) return "Connected";
    if (reconnecting) return "Reconnecting...";
    return "Offline";
  };
  
  const getStatusClass = () => {
    if (connected) return "text-green-500 bg-green-50";
    if (reconnecting) return "text-amber-500 bg-amber-50";
    return "text-red-500 bg-red-50";
  };

  const getFirebaseWarning = () => {
    if (!USING_DEFAULT_FIREBASE_CONFIG) return null;
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1.5 text-amber-600">
          <InfoIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Using demo Firebase</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          For reliable connections, set up your own Firebase project.
        </p>
        <a 
          href="https://console.firebase.google.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
        >
          Firebase Console
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  };
  
  const getDebugInfo = () => {
    if (!DEBUG_CONNECTION_STATUS) return null;
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700">Debug Info:</p>
        <p className="text-xs text-gray-500">Status: {connected ? 'Connected' : 'Disconnected'}</p>
        <p className="text-xs text-gray-500">Reconnecting: {reconnecting ? 'Yes' : 'No'}</p>
        {error && <p className="text-xs text-gray-500">Error: {error}</p>}
      </div>
    );
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${getStatusClass()}`}>
            {getIcon()}
            {showText && <span>{getStatusText()}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {connected ? (
            <>
              <p>You're connected to the chat server</p>
              {getFirebaseWarning()}
              {getDebugInfo()}
            </>
          ) : reconnecting ? (
            <>
              <p>Attempting to reconnect to the server...</p>
              {getFirebaseWarning()}
              {getDebugInfo()}
            </>
          ) : (
            <div className="max-w-[240px]">
              <p className="font-semibold mb-1">Connection issues</p>
              <p className="text-xs text-muted-foreground mb-1">
                {error || "Cannot connect to the chat server"}
              </p>
              <p className="text-xs mb-2">Using fallback mode. Some features may be limited.</p>
              {getFirebaseWarning()}
              {getDebugInfo()}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatus;
