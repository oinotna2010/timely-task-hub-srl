
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  // Utenti predefiniti che non possono essere eliminati
  const defaultUsers = ['carlo', 'carmen', 'marcello', 'massimo', 'admin'];

  useEffect(() => {
    // Carica utenti dal localStorage o usa quelli predefiniti
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultUsersList: User[] = [
        { username: 'carlo', password: 'serisrl2025@', isAdmin: false },
        { username: 'carmen', password: 'serisrl2025@', isAdmin: false },
        { username: 'marcello', password: 'serisrl2025@', isAdmin: false },
        { username: 'massimo', password: 'serisrl2025@', isAdmin: false },
        { username: 'admin', password: 'SERISRL25%', isAdmin: true }
      ];
      setUsers(defaultUsersList);
      localStorage.setItem('users', JSON.stringify(defaultUsersList));
    }
  }, [isOpen]);

  const addUser = () => {
    if (!newUsername || !newPassword) {
      toast({
        title: "Errore",
        description: "Username e password sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (users.some(u => u.username === newUsername)) {
      toast({
        title: "Errore",
        description: "Username già esistente",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      username: newUsername,
      password: newPassword,
      isAdmin: false
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    setNewUsername('');
    setNewPassword('');
    
    toast({
      title: "Utente aggiunto",
      description: `L'utente ${newUsername} è stato aggiunto con successo`,
    });
  };

  const removeUser = (username: string) => {
    if (defaultUsers.includes(username)) {
      toast({
        title: "Errore",
        description: "Non puoi eliminare questo utente predefinito",
        variant: "destructive",
      });
      return;
    }

    const updatedUsers = users.filter(u => u.username !== username);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    toast({
      title: "Utente rimosso",
      description: `L'utente ${username} è stato rimosso`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestione Utenti</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add new user */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Aggiungi Nuovo Utente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newUsername">Username</Label>
                  <Input
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Inserisci username"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Inserisci password"
                  />
                </div>
              </div>
              <Button 
                onClick={addUser} 
                className="mt-4 w-full bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Utente
              </Button>
            </CardContent>
          </Card>

          {/* Users list */}
          <div>
            <h3 className="font-semibold mb-4">Utenti Esistenti</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map(user => (
                <div key={user.username} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{user.username}</span>
                    {user.isAdmin && <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">Admin</span>}
                    {defaultUsers.includes(user.username) && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Predefinito</span>
                    )}
                  </div>
                  <Button
                    onClick={() => removeUser(user.username)}
                    variant="destructive"
                    size="sm"
                    disabled={defaultUsers.includes(user.username)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageUsersModal;
