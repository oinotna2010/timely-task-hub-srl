
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le nuove password non coincidono",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Errore",
        description: "La nuova password deve essere di almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    // Verifica password attuale
    const savedUsers = localStorage.getItem('users');
    let users: User[] = [];
    
    if (savedUsers) {
      users = JSON.parse(savedUsers);
    } else {
      users = [
        { username: 'admin', password: 'SERISRL25%', isAdmin: true }
      ];
    }

    const user = users.find(u => u.username === currentUser.username);
    if (!user || user.password !== currentPassword) {
      toast({
        title: "Errore",
        description: "Password attuale non corretta",
        variant: "destructive",
      });
      return;
    }

    // Aggiorna password
    const updatedUsers = users.map(u => 
      u.username === currentUser.username 
        ? { ...u, password: newPassword }
        : u
    );

    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Cambio password',
      user: currentUser.username,
      timestamp: new Date().toISOString(),
      details: `L'utente ${currentUser.username} ha cambiato la propria password`
    };

    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));

    toast({
      title: "Password cambiata",
      description: "La password è stata aggiornata con successo",
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Impostazioni Account</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle>Cambia Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Password Attuale</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci password attuale"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nuova Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci nuova password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Conferma nuova password"
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Cambia Password
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
