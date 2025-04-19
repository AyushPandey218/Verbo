
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, generateGroupCode } from '@/utils/messageUtils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { Users, Plus, Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface GroupManagerProps {
  user: User;
  onCreateGroup: (name: string) => void;
  onJoinGroup: (code: string) => void;
  onJoinGroupClick?: (groupId: string) => void;
  groups: any[];
}

const GroupManager: React.FC<GroupManagerProps> = ({ 
  user, 
  onCreateGroup, 
  onJoinGroup,
  onJoinGroupClick,
  groups = []
}) => {
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive"
      });
      return;
    }
    
    onCreateGroup(groupName.trim());
    setGroupName('');
    setIsCreateOpen(false);
    
    toast({
      title: "Group created",
      description: "Your new group has been created successfully!"
    });
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      toast({
        title: "Group code required",
        description: "Please enter a valid group code",
        variant: "destructive"
      });
      return;
    }
    
    onJoinGroup(joinCode.trim());
    setJoinCode('');
    setIsJoinOpen(false);
    
    toast({
      title: "Joining group",
      description: "Attempting to join the group..."
    });
  };

  const handleJoinGroupClick = (groupId: string) => {
    if (onJoinGroupClick) {
      onJoinGroupClick(groupId);
      toast({
        description: "Joining group chat...",
        duration: 3000,
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Users size={16} />
          <span>Groups</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Your Groups</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 flex-1">
                  <Plus size={14} />
                  <span>Create Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Create a New Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="w-full"
                    maxLength={30}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={!groupName.trim()}>
                      Create Group
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 flex-1">
                  <Share2 size={14} />
                  <span>Join Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Join a Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinGroup} className="space-y-4 mt-4">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter group code"
                    className="w-full"
                    maxLength={6}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={!joinCode.trim()}>
                      Join Group
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2 mt-4">
            {groups.length > 0 ? (
              groups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {group.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">{group.users?.length || 0} members</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8"
                    onClick={() => handleJoinGroupClick(group.id)}
                  >
                    Join
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No groups yet</p>
                <p className="text-xs mt-1">Create or join a group to get started</p>
              </div>
            )}
          </div>
        </div>
        
        <SheetFooter className="mt-4">
          <div className="text-xs text-center w-full text-muted-foreground">
            Group codes are case-sensitive
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default GroupManager;
