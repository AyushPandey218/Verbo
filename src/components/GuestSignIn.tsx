
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createGuestUser } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/utils/messageUtils';
import { LOGOUT_STORAGE_CLEANUP_ITEMS } from '@/utils/config';

interface GuestSignInProps {
  onGuestSignIn: (guestUser: User) => void;
}

const GuestSignIn: React.FC<GuestSignInProps> = ({ onGuestSignIn }) => {
  const [guestName, setGuestName] = useState('');
  const { toast } = useToast();

  const handleGuestSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a display name to continue as guest",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any existing guest data first
    LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
      localStorage.removeItem(item);
    });
    
    const guestUser = createGuestUser(guestName.trim());
    console.log("Creating guest user:", guestUser);
    
    // Store in localStorage for persistence
    localStorage.setItem('chatUser', JSON.stringify(guestUser));
    
    onGuestSignIn(guestUser);
    
    toast({
      title: "Welcome!",
      description: `Signed in as ${guestName}`,
      duration: 3000,
    });
  };

  return (
    <Card className="w-full max-w-md glass shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Continue as Guest</CardTitle>
      </CardHeader>
      <form onSubmit={handleGuestSignIn}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input 
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full"
              maxLength={20}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            disabled={!guestName.trim()}
          >
            Join as Guest
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GuestSignIn;
