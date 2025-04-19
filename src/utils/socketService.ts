import FirebaseService from './firebaseService';
import { DEBUG_SOCKET_EVENTS } from './config';

class SocketService {
  private static instance: SocketService;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  
  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public getSocket(): any | null {
    // We're now using Firebase instead of sockets
    return FirebaseService.getInstance();
  }

  public connect(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (DEBUG_SOCKET_EVENTS) console.log("Using Firebase for real-time communication");
        const firebaseService = FirebaseService.getInstance();
        
        if (!firebaseService.isInitialized()) {
          console.error("Firebase initialization failed. Chat functionality may not work properly.");
          console.error("Please check your Firebase configuration and make sure all required environment variables are set.");
          console.error("See README.md for instructions on how to set up your own Firebase project.");
          
          // Even though initialization failed, we'll resolve with the service
          // so the application can at least continue with limited functionality
          setTimeout(() => {
            resolve(firebaseService);
          }, 500);
          return;
        }
        
        // Reset connection attempts on successful connection
        this.connectionAttempts = 0;
        
        setTimeout(() => {
          resolve(firebaseService);
        }, 500);
      } catch (error) {
        this.connectionAttempts++;
        console.error(`Firebase connection error (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}):`, error);
        
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(`Retrying connection in ${this.connectionAttempts * 1000}ms...`);
          // Exponential backoff for retries
          setTimeout(() => {
            this.connect().then(resolve).catch(reject);
          }, this.connectionAttempts * 1000);
        } else {
          reject(error);
        }
      }
    });
  }
  
  public disconnect(): void {
    const firebaseService = FirebaseService.getInstance();
    firebaseService.removeAllListeners();
    console.log("Disconnected from Firebase");
  }

  public isConnected(): boolean {
    const firebaseService = FirebaseService.getInstance();
    return firebaseService.isInitialized();
  }
}

export default SocketService;
