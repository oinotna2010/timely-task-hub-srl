
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Utenti predefiniti
  const users = [
    { username: 'carlo', password: 'serisrl2025@', isAdmin: false },
    { username: 'carmen', password: 'serisrl2025@', isAdmin: false },
    { username: 'marcello', password: 'serisrl2025@', isAdmin: false },
    { username: 'massimo', password: 'serisrl2025@', isAdmin: false },
    { username: 'admin', password: 'SERISRL25%', isAdmin: true }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simula un delay per il login
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        // Salva i dati utente
        const userData = {
          username: user.username,
          isAdmin: user.isAdmin,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${user.username}!`,
        });

        navigate('/dashboard');
      } else {
        toast({
          title: "Errore di login",
          description: "Username o password non corretti",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 1000);
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
