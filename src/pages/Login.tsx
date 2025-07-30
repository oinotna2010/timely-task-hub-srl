
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Quando hai il server, questa chiamata funzionerà
      // Per ora usa ancora localStorage come fallback
      
      try {
        // Prova prima con l'API del server
        const response = await apiService.login(username, password);
        
        // Connetti il socket per le notifiche
        socketService.connect(response.user.username);
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${response.user.username}!`,
        });

        navigate('/dashboard');
      } catch (apiError) {
        console.log('Server non disponibile, uso localStorage locale');
        
        // Fallback al sistema locale attuale
        const savedUsers = localStorage.getItem('users');
        let users = [];
        
        if (savedUsers) {
          users = JSON.parse(savedUsers);
        } else {
          users = [
            { username: 'admin', password: 'SERISRL25%', isAdmin: true }
          ];
          localStorage.setItem('users', JSON.stringify(users));
        }

        const user = users.find((u: any) => u.username === username && u.password === password);
        
        if (user) {
          const userData = {
            username: user.username,
            password: user.password,
            isAdmin: user.isAdmin,
            loginTime: new Date().toISOString()
          };
          
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }

          // Log dell'azione
          const log = {
            id: Date.now().toString(),
            action: 'Login',
            user: user.username,
            timestamp: new Date().toISOString(),
            details: `L'utente ${user.username} ha effettuato l'accesso (modalità locale)`
          };
          const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
          localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));

          toast({
            title: "Login effettuato",
            description: `Benvenuto, ${user.username}! (Modalità locale)`,
          });

          navigate('/dashboard');
        } else {
          toast({
            title: "Errore di login",
            description: "Username o password non corretti",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'accesso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/530a2c43-8991-4588-aa2d-28b1ac2322c7.png" 
              alt="SE.RI. Logo" 
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Centro di Raccolta Ecologica SE.RI.
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Sistema Gestione Scadenze</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                placeholder="Inserisci username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Inserisci password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="rememberMe" className="text-sm">
                Ricorda questo PC
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white"
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
