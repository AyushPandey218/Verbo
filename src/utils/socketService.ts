
import FirebaseService from './firebaseService';

class SocketService {
  private static instance: SocketService;
  
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
        console.log("Using Firebase for real-time communication");
        const firebaseService = FirebaseService.getInstance();
        
        if (!firebaseService.isInitialized()) {
          console.error("Firebase initialization failed. Chat functionality may not work properly.");
          console.error("Please check your Firebase configuration and make sure all required environment variables are set.");
          console.error("See README.md for instructions on how to set up your own Firebase project.");
        }
        
        setTimeout(() => {
          resolve(firebaseService);
        }, 500);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        reject(error);
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
