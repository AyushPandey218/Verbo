
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, WifiOff, InfoIcon, ExternalLink, RefreshCcw, Wifi } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DEBUG_CONNECTION_STATUS, USING_DEFAULT_FIREBASE_CONFIG } from '@/utils/config';
import { 
  isSocketConnected, 
  reconnectSocket, 
  forceReconnectSocket,
  setOfflineMode,
  isOffline,
  isManualOfflineMode
} from '@/utils/socket';

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
  // Double check connection status from socket directly
  const socketConnected = isSocketConnected();
  const actuallyConnected = connected || socketConnected;
  const [isReconnecting, setIsReconnecting] = useState(reconnecting);
  const [offlineMode, setOfflineModeState] = useState(isOffline());
  const [manualOffline, setManualOffline] = useState(isManualOfflineMode());
  
  // Periodically update connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      setOfflineModeState(isOffline());
      setManualOffline(isManualOfflineMode());
    };
    
    // Initial check
    checkConnectionStatus();
    
    // Set up interval for periodic checks
    const interval = setInterval(checkConnectionStatus, 5000);
    
    // Listen for online/offline events
    const handleOnlineChange = () => {
      checkConnectionStatus();
    };
    
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);
  
  const handleForceReconnect = () => {
    if (offlineMode && manualOffline) {
      // If manually offline, toggle to online mode
      toggleOfflineMode(false);
      return;
    }
    
    setIsReconnecting(true);
    
    // Try to fall back to Firebase immediately
    try {
      // Import Firebase service directly
      import('../utils/firebaseService').then(module => {
        const FirebaseService = module.default;
        const firebase = FirebaseService.getInstance();
        
        if (firebase && firebase.isInitialized()) {
          console.log("Successfully switched to Firebase fallback");
          // Notify the user that fallback is working
          setTimeout(() => {
            setIsReconnecting(false);
          }, 1500);
        } else {
          // If even Firebase fails, try socket again as last resort
          forceReconnectSocket();
          
          // Reset reconnecting state after a delay
          setTimeout(() => {
            setIsReconnecting(false);
          }, 5000);
        }
      });
    } catch (err) {
      console.error("Error falling back to Firebase:", err);
      // Try socket reconnection as last resort
      forceReconnectSocket();
      
      // Reset reconnecting state after a delay
      setTimeout(() => {
        setIsReconnecting(false);
      }, 5000);
    }
  };

  const toggleOfflineMode = (checked: boolean) => {
    setOfflineModeState(checked);
    setManualOffline(checked);
    setOfflineMode(checked);
  };
  
  const getIcon = () => {
    if (offlineMode) return <WifiOff className="h-4 w-4 text-amber-500" />;
    if (actuallyConnected) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (isReconnecting) return <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };
  
  const getStatusText = () => {
    if (offlineMode) return manualOffline ? "Manual Offline" : "Offline Mode";
    if (actuallyConnected) return "Connected";
    if (isReconnecting) return "Reconnecting...";
    return "Offline";
  };
  
  const getStatusClass = () => {
    if (offlineMode) return "text-amber-500 bg-amber-50";
    if (actuallyConnected) return "text-green-500 bg-green-50";
    if (isReconnecting) return "text-amber-500 bg-amber-50";
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
        <p className="text-xs text-gray-500">Status: {actuallyConnected ? 'Connected' : 'Disconnected'}</p>
        <p className="text-xs text-gray-500">Socket Connected: {socketConnected ? 'Yes' : 'No'}</p>
        <p className="text-xs text-gray-500">Reconnecting: {isReconnecting ? 'Yes' : 'No'}</p>
        <p className="text-xs text-gray-500">Offline Mode: {offlineMode ? 'Yes' : 'No'}</p>
        <p className="text-xs text-gray-500">Manual Offline: {manualOffline ? 'Yes' : 'No'}</p>
        <p className="text-xs text-gray-500">Navigator Online: {navigator.onLine ? 'Yes' : 'No'}</p>
        {error && <p className="text-xs text-gray-500">Error: {error}</p>}
      </div>
    );
  };
  
  const getOfflineToggle = () => {
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Offline Mode</span>
          </div>
          <Switch
            checked={offlineMode}
            onCheckedChange={toggleOfflineMode}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {offlineMode ? 
            manualOffline ? 
              "You have manually enabled offline mode. Toggle to attempt reconnecting." :
              "You are currently in offline mode due to connection issues." : 
            "Toggle to use the app in offline mode when a server connection is unavailable."
          }
        </p>
      </div>
    );
  };
  
  const getConnectionTips = () => {
    if (manualOffline) return null;
    if (offlineMode || actuallyConnected) return null;
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700">Troubleshooting:</p>
        <ul className="text-xs text-gray-500 mt-1 list-disc pl-4 space-y-1">
          <li>Check your internet connection</li>
          <li>Try refreshing the page</li>
          <li>Clear browser cache and cookies</li>
          <li>Try enabling offline mode</li>
        </ul>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 h-8 text-xs w-full flex items-center justify-center gap-1"
          onClick={handleForceReconnect}
          disabled={isReconnecting}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {isReconnecting ? 'Reconnecting...' : 'Force Reconnect'}
        </Button>
      </div>
    );
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${getStatusClass()} cursor-pointer hover:opacity-90`}
            onClick={offlineMode ? () => toggleOfflineMode(false) : actuallyConnected ? undefined : handleForceReconnect}
          >
            {getIcon()}
            {showText && <span>{getStatusText()}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px]">
          {offlineMode ? (
            <>
              <div className="flex items-center gap-2 text-amber-500">
                <WifiOff className="h-4 w-4" />
                <p className="font-medium">{manualOffline ? "Manual Offline Mode" : "Offline Mode"}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                {manualOffline 
                  ? "You have manually enabled offline mode. Some features will be limited."
                  : "You're using the app in offline mode due to connection issues. Some features will be limited."}
              </p>
              {getOfflineToggle()}
              {getFirebaseWarning()}
              {getDebugInfo()}
            </>
          ) : actuallyConnected ? (
            <>
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <p className="font-medium">Connected</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-2">You're connected to the chat server</p>
              {getOfflineToggle()}
              {getFirebaseWarning()}
              {getDebugInfo()}
            </>
          ) : isReconnecting ? (
            <>
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-4 w-4 animate-pulse" />
                <p className="font-medium">Reconnecting</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-2">Attempting to reconnect to the server...</p>
              {getOfflineToggle()}
              {getFirebaseWarning()}
              {getDebugInfo()}
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-red-500">
                <WifiOff className="h-4 w-4" />
                <p className="font-medium">Connection issues</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {error || "Cannot connect to the chat server"}
              </p>
              <p className="text-xs mb-2">Using fallback mode. Some features may be limited.</p>
              {getOfflineToggle()}
              {getConnectionTips()}
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

