import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, get, child, DataSnapshot, Database } from "firebase/database";
import { User, Message, generateId } from "./messageUtils";
import { 
  defaultFirebaseConfig, 
  USING_DEFAULT_FIREBASE_CONFIG, 
  MESSAGE_HISTORY_WINDOW,
  REMOVE_USER_FROM_FIREBASE_ON_LOGOUT
} from "./config";

const getFirebaseConfig = () => {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
    };
  }
  
  if (USING_DEFAULT_FIREBASE_CONFIG) {
    console.log("⚠️ Using default Firebase configuration. For better reliability, please set up your own Firebase project.");
    console.log("See README.md for instructions on how to set up your own Firebase project.");
  }
  return defaultFirebaseConfig;
};

class FirebaseService {
  private static instance: FirebaseService;
  private app;
  private db;
  private listeners: Map<string, Function> = new Map();
  private initializationAttempted = false;
  private initializationSucceeded = false;
  private activeRooms: Set<string> = new Set();
  private currentUserId: string | null = null;
  
  private constructor() {
    try {
      const firebaseConfig = getFirebaseConfig();
      console.log("Initializing Firebase with config:", { 
        ...firebaseConfig, 
        apiKey: firebaseConfig.apiKey ? "***" : undefined,
        appId: firebaseConfig.appId ? "***" : undefined,
        databaseURL: firebaseConfig.databaseURL || "NOT SET - THIS IS REQUIRED"
      });
      
      if (!firebaseConfig.databaseURL) {
        throw new Error("Firebase databaseURL is not set. This is required for the chat functionality to work.");
      }
      
      this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      this.db = getDatabase(this.app);
      this.initializationAttempted = true;
      this.initializationSucceeded = true;
      console.log("Firebase initialized successfully");
    } catch (error) {
      this.initializationAttempted = true;
      this.initializationSucceeded = false;
      console.error("Error initializing Firebase:", error);
      
      if (USING_DEFAULT_FIREBASE_CONFIG) {
        console.error("You are using the default Firebase configuration. Please set up your own Firebase project for better reliability.");
        console.error("See README.md for instructions on how to set up your own Firebase project.");
      }
      
      throw error;
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      try {
        FirebaseService.instance = new FirebaseService();
      } catch (error) {
        console.error("Failed to initialize Firebase instance:", error);
        FirebaseService.instance = new FirebaseService();
      }
    }
    return FirebaseService.instance;
  }
  
  public isInitialized(): boolean {
    return this.initializationAttempted && this.initializationSucceeded;
  }

  public getDatabase(): Database {
    if (!this.isInitialized()) {
      console.error("Firebase not initialized. Chat functionality will not work.");
    }
    return this.db;
  }

  public getDatabaseRef(path: string) {
    return ref(this.db, path);
  }

  public setDatabaseValue(reference: any, value: any) {
    return set(reference, value);
  }

  public loginUser(user: User): void {
    this.currentUserId = user.id;
    const updatedUser = {
      ...user,
      lastActive: Date.now(),
      joinedAt: Date.now(),
      online: true
    };
    
    const userRef = ref(this.db, `users/${user.id}`);
    set(userRef, updatedUser);
    console.log("User logged in", user.id);
  }

  public joinRoom(roomId: string, user: User): void {
    console.log(`User ${user.id} joining room ${roomId}`);
    
    // Track this room as active
    this.activeRooms.add(roomId);
    
    // Clear any previous users in this room that may be stale
    const roomUsersRef = ref(this.db, `rooms/${roomId}/users`);
    get(roomUsersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const now = Date.now();
        
        // Mark old users as offline
        Object.keys(users).forEach(userId => {
          const userData = users[userId];
          if (userData.lastActive && (now - userData.lastActive > 60000 * 5)) { // 5 minutes
            this.markUserOffline(userId, roomId);
          }
        });
      }
      
      // Add user to room - IMPORTANT: Explicitly set online to true
      const roomUserRef = ref(this.db, `rooms/${roomId}/users/${user.id}`);
      set(roomUserRef, {
        ...user,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        online: true
      });
      
      // Set active room for user
      const userRoomRef = ref(this.db, `users/${user.id}/activeRoom`);
      set(userRoomRef, roomId);
    });
  }

  public markUserOffline(userId: string, roomId: string): void {
    console.log(`Marking user ${userId} as offline in room ${roomId}`);
    
    // Update user in room
    const roomUserRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
    get(roomUserRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        set(roomUserRef, {
          ...userData,
          online: false,
          leftAt: Date.now()
        });
      }
    }).catch(error => {
      console.error(`Error marking user ${userId} as offline:`, error);
    });
  }

  public leaveRoom(roomId: string, user: User): void {
    console.log(`User ${user.id} leaving room ${roomId}`);
    
    // First mark user as offline - this ensures other users see the updated count
    this.markUserOffline(user.id, roomId);
    
    // Clear active room for user
    const userRoomRef = ref(this.db, `users/${user.id}/activeRoom`);
    remove(userRoomRef);
    
    // Remove from active rooms tracking
    this.activeRooms.delete(roomId);
    
    // Remove random match status if applicable
    if (roomId === 'random') {
      const randomMatchRef = ref(this.db, `randomMatches/${user.id}`);
      remove(randomMatchRef);
    }
  }

  public sendMessage(message: Message): void {
    console.log("Sending message to Firebase:", message);
    const cleanMessage = Object.fromEntries(
      Object.entries(message).filter(([_, v]) => v !== undefined)
    );
    
    const messageRef = ref(this.db, `rooms/${message.room}/messages/${message.id}`);
    set(messageRef, {
      ...cleanMessage,
      sentAt: Date.now()
    });
  }

  public addReaction(messageId: string, reaction: string, user: User, roomId: string): void {
    console.log(`Adding reaction ${reaction} from ${user.id} to message ${messageId} in room ${roomId}`);
    
    const reactionRef = ref(this.db, `rooms/${roomId}/messages/${messageId}/reactions/${user.id}`);
    
    set(reactionRef, {
      user: user,
      reaction: reaction,
      timestamp: Date.now()
    });
  }

  public sendPoll(pollData: any, roomId: string): void {
    const pollRef = ref(this.db, `rooms/${roomId}/polls/${pollData.id}`);
    set(pollRef, {
      ...pollData,
      createdAt: Date.now()
    });
  }

  public votePoll(pollId: string, optionId: string, userId: string, roomId: string): void {
    console.log(`Firebase: Voting on poll ${pollId}, option ${optionId}, user ${userId}, room ${roomId}`);
    
    const messagesRef = ref(this.db, `rooms/${roomId}/messages`);
    
    get(messagesRef).then((snapshot) => {
      if (!snapshot.exists()) {
        console.error("No messages found in room:", roomId);
        return;
      }
      
      let pollMessageId = null;
      let pollMessage = null;
      let pollData = null;
      
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if (message && message.content && message.content.startsWith('__POLL__:')) {
          try {
            const jsonString = message.content.replace('__POLL__:', '');
            const poll = JSON.parse(jsonString);
            
            if (poll && poll.id === pollId) {
              pollMessageId = childSnapshot.key;
              pollMessage = message;
              pollData = poll;
              console.log("Found matching poll:", poll.id);
            }
          } catch (e) {
            console.error("Error parsing poll message:", e);
          }
        }
      });
      
      if (!pollMessageId || !pollData) {
        console.error("Poll message not found for pollId:", pollId);
        return;
      }
      
      console.log("Found poll message:", pollMessageId, "with poll data:", pollData);
      
      const optionIndex = pollData.options.findIndex((opt: any) => opt.id === optionId);
      if (optionIndex === -1) {
        console.error("Option not found in poll:", optionId);
        return;
      }
      
      const option = pollData.options[optionIndex];
      
      if (!option.votes) {
        option.votes = [];
      }
      
      const userIndex = option.votes.indexOf(userId);
      if (userIndex === -1) {
        option.votes.push(userId);
        console.log("Added vote from", userId, "to option", optionId);
      } else {
        option.votes.splice(userIndex, 1);
        console.log("Removed vote from", userId, "to option", optionId);
      }
      
      if (!pollData.isMultipleChoice) {
        pollData.options.forEach((opt: any, index: number) => {
          if (index !== optionIndex && opt.votes && opt.votes.includes(userId)) {
            opt.votes = opt.votes.filter((id: string) => id !== userId);
            console.log("Removed vote from", userId, "in option", opt.id, "due to single choice");
          }
        });
      }
      
      const updatedContent = `__POLL__:${JSON.stringify(pollData)}`;
      console.log("Updating poll message with new content:", updatedContent.substring(0, 100) + "...");
      
      const messageRef = ref(this.db, `rooms/${roomId}/messages/${pollMessageId}`);
      
      const updatedMessage = {
        ...pollMessage,
        content: updatedContent
      };
      
      set(messageRef, updatedMessage)
        .then(() => {
          console.log("Poll vote successfully updated in Firebase");
        })
        .catch(error => {
          console.error("Error setting updated poll message:", error);
        });
    }).catch(error => {
      console.error("Error fetching messages for poll vote:", error);
    });
  }

  public findRandomMatch(user: User): void {
    const userLookingRef = ref(this.db, `randomMatchQueue/${user.id}`);
    set(userLookingRef, {
      user,
      timestamp: Date.now()
    });
  }

  public watchRoomUsers(roomId: string, callback: (users: User[]) => void): () => void {
    const usersRef = ref(this.db, `rooms/${roomId}/users`);
    const listenerId = `room-users-${roomId}`;
    
    if (this.listeners.has(listenerId)) {
      this.removeListener(listenerId);
    }
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData && userData.id) {
          users.push(userData);
        }
      });
      callback(users);
    });
    
    this.listeners.set(listenerId, unsubscribe);
    return () => this.removeListener(listenerId);
  }

  public watchRoomMessages(roomId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = ref(this.db, `rooms/${roomId}/messages`);
    const listenerId = `room-messages-${roomId}`;
    
    if (this.listeners.has(listenerId)) {
      this.removeListener(listenerId);
    }
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages: Message[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const messageData = childSnapshot.val();
          if (messageData && messageData.id && messageData.content && messageData.sender) {
            if (messageData.reactions && typeof messageData.reactions === 'object') {
              const reactionsArray = Object.values(messageData.reactions);
              messageData.reactions = reactionsArray;
            } else {
              messageData.reactions = [];
            }
            
            const messageTime = messageData.timestamp || messageData.sentAt || 0;
            const now = Date.now();
            if (now - messageTime <= MESSAGE_HISTORY_WINDOW) {
              messages.push(messageData as Message);
            }
          } else {
            console.warn("Skipping invalid message data:", messageData);
          }
        });
        messages.sort((a, b) => a.timestamp - b.timestamp);
      }
      
      console.log(`Room ${roomId} messages updated:`, messages.length);
      callback(messages);
    });
    
    this.listeners.set(listenerId, unsubscribe);
    return () => this.removeListener(listenerId);
  }

  public watchRandomMatch(userId: string, callback: (matchedUser: User | null) => void): () => void {
    const matchRef = ref(this.db, `randomMatches/${userId}`);
    const listenerId = `random-match-${userId}`;
    
    if (this.listeners.has(listenerId)) {
      this.removeListener(listenerId);
    }
    
    const unsubscribe = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val().matchedUser);
      } else {
        callback(null);
      }
    });
    
    this.listeners.set(listenerId, unsubscribe);
    return () => this.removeListener(listenerId);
  }

  public watchWhiteboardData(roomId: string, callback: (data: string | null) => void): () => void {
    const whiteboardRef = ref(this.db, `rooms/${roomId}/whiteboard`);
    const listenerId = `whiteboard-${roomId}`;
    
    if (this.listeners.has(listenerId)) {
      this.removeListener(listenerId);
    }
    
    console.log(`Setting up whiteboard listener for room ${roomId}`);
    
    const unsubscribe = onValue(whiteboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && data.drawingData) {
          console.log(`Received whiteboard data update for room ${roomId} (${data.drawingData.substring(0, 50)}...)`);
          callback(data.drawingData);
        } else {
          console.log(`Received empty whiteboard data for room ${roomId}`);
          callback(null);
        }
      } else {
        console.log(`No whiteboard data exists for room ${roomId}`);
        callback(null);
      }
    }, (error) => {
      console.error(`Error watching whiteboard data for room ${roomId}:`, error);
    });
    
    this.listeners.set(listenerId, unsubscribe);
    return () => this.removeListener(listenerId);
  }

  public updateWhiteboardData(roomId: string, userId: string, drawingData: string): void {
    if (!this.isInitialized()) {
      console.error("Firebase not initialized. Cannot update whiteboard.");
      return;
    }
    
    console.log(`Updating whiteboard data for room ${roomId}`);
    const whiteboardRef = ref(this.db, `rooms/${roomId}/whiteboard`);
    
    set(whiteboardRef, {
      drawingData,
      lastUpdatedBy: userId,
      timestamp: Date.now()
    }).then(() => {
      console.log(`Successfully updated whiteboard data for room ${roomId}`);
    }).catch(error => {
      console.error(`Error updating whiteboard data for room ${roomId}:`, error);
    });
  }

  public removeUserFromAllRooms(userId: string): void {
    if (REMOVE_USER_FROM_FIREBASE_ON_LOGOUT) {
      console.log(`Removing user ${userId} from all active rooms`);
      
      this.activeRooms.forEach(roomId => {
        const roomUserRef = ref(this.db, `rooms/${roomId}/users/${userId}`);
        remove(roomUserRef)
          .then(() => console.log(`Removed user ${userId} from room ${roomId}`))
          .catch(error => console.error(`Error removing user from room: ${error}`));
      });
      
      const userRef = ref(this.db, `users/${userId}`);
      remove(userRef)
        .then(() => console.log(`Removed user ${userId} data`))
        .catch(error => console.error(`Error removing user data: ${error}`));
      
      const randomMatchRef = ref(this.db, `randomMatches/${userId}`);
      remove(randomMatchRef);
      
      const randomQueueRef = ref(this.db, `randomMatchQueue/${userId}`);
      remove(randomQueueRef);
      
      this.activeRooms.clear();
      this.currentUserId = null;
    }
  }

  public updateUserActivity(user: User): void {
    if (!this.isInitialized() || !user || !user.id) {
      return;
    }
    
    try {
      console.log(`Updating activity for user ${user.id}`);
      
      // Update user's lastActive timestamp
      const userRef = ref(this.db, `users/${user.id}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          set(userRef, {
            ...userData,
            lastActive: Date.now(),
            online: true
          });
        } else {
          // User doesn't exist yet, create a new entry
          set(userRef, {
            ...user,
            lastActive: Date.now(),
            online: true
          });
        }
      }).catch(error => {
        console.error(`Error updating user activity: ${error}`);
      });
      
      // Also update the user in all active rooms
      this.activeRooms.forEach(roomId => {
        const roomUserRef = ref(this.db, `rooms/${roomId}/users/${user.id}`);
        get(roomUserRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            set(roomUserRef, {
              ...userData,
              lastActive: Date.now(),
              online: true
            });
          }
        }).catch(error => {
          console.error(`Error updating user in room: ${error}`);
        });
      });
      
      // Store current user in localStorage for heartbeat recovery
      localStorage.setItem('currentUser', JSON.stringify(user));
      
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  }

  private removeListener(listenerId: string): void {
    if (this.listeners.has(listenerId)) {
      const unsubscribe = this.listeners.get(listenerId);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      this.listeners.delete(listenerId);
    }
  }

  public removeAllListeners(): void {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
    
    if (this.currentUserId) {
      this.removeUserFromAllRooms(this.currentUserId);
    }
  }
}

export default FirebaseService;
