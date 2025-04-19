
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createGuestUser } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/utils/messageUtils';
import { LOGOUT_STORAGE_CLEANUP_ITEMS } from '@/utils/config';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UserCircle, UserCircle2, User as UserIcon } from 'lucide-react';

interface GuestSignInProps {
  onGuestSignIn: (guestUser: User) => void;
}

const GuestSignIn: React.FC<GuestSignInProps> = ({ onGuestSignIn }) => {
  const [guestName, setGuestName] = useState('');
  const [gender, setGender] = useState('');
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

    if (!gender) {
      toast({
        title: "Gender required",
        description: "Please select a gender to continue",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any existing guest data first
    LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
      localStorage.removeItem(item);
    });
    
    // Get avatar based on gender
    const getAvatarUrl = () => {
      const seed = `${guestName}-${gender}`;
      switch(gender) {
        case 'male':
          return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male`;
        case 'female':
          return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female`;
        default:
          return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      }
    };

    const guestUser = {
      ...createGuestUser(guestName.trim()),
      photoURL: getAvatarUrl(),
      gender
    };
    
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Input 
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full h-12"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label>Select Gender</Label>
            <RadioGroup
              value={gender}
              onValueChange={setGender}
              className="grid grid-cols-3 gap-4"
            >
              <div className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                gender === 'male' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="male" id="male" className="sr-only" />
                <UserCircle className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-sm font-medium">Male</span>
              </div>
              
              <div className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                gender === 'female' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="female" id="female" className="sr-only" />
                <UserCircle2 className="h-8 w-8 mb-2 text-pink-500" />
                <span className="text-sm font-medium">Female</span>
              </div>
              
              <div className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                gender === 'other' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <RadioGroupItem value="other" id="other" className="sr-only" />
                <UserIcon className="h-8 w-8 mb-2 text-purple-500" />
                <span className="text-sm font-medium">Other</span>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            disabled={!guestName.trim() || !gender}
          >
            Join as Guest
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GuestSignIn;
