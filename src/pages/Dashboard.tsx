
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LogOut, Bell, Download, Settings, Calendar, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddDeadlineModal from '@/components/AddDeadlineModal';
import ManageUsersModal from '@/components/ManageUsersModal';
import ManageCategoriesModal from '@/components/ManageCategoriesModal';
import { format, isAfter, isBefore, differenceInHours } from 'date-fns';
import { it } from 'date-fns/locale';

interface User {
  username: string;
  isAdmin: boolean;
  loginTime: string;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: string;
  prealert: string;
  createdBy: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [categories, setCategories] = useState<string[]>(['Amministrative', 'Tecniche', 'Commerciali', 'Generali']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/');
      return;
    }
    setCurrentUser(JSON.parse(userData));

    // Carica scadenze dal localStorage
    const savedDeadlines = localStorage.getItem('deadlines');
    if (savedDeadlines) {
      setDeadlines(JSON.parse(savedDeadlines));
    }

    // Carica categorie dal localStorage
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }

    // Richiedi permessi per le notifiche
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Controlla le notifiche ogni minuto
    const notificationInterval = setInterval(checkNotifications, 60000);
    return () => clearInterval(notificationInterval);
  }, [navigate]);

  const checkNotifications = () => {
    const now = new Date();
    deadlines.forEach(deadline => {
      const deadlineDate = new Date(`${deadline.date}T${deadline.time}`);
      const hoursUntil = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (deadline.prealert !== 'nessuno') {
        const alertHours = parseInt(deadline.prealert.replace('h', ''));
        if (hoursUntil === alertHours) {
          showNotification(deadline);
        }
      }
    });
  };

  const showNotification = (deadline: Deadline) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Scadenza: ${deadline.title}`, {
        body: `${deadline.description}\nScadenza: ${format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}`,
        icon: '/lovable-uploads/530a2c43-8991-4588-aa2d-28b1ac2322c7.png'
      });

      // Suono di notifica
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIYBzuS2e/MeSsFJHXU6t+OSAoTa7zn669VFApCqOH3xWEcBj2A3O3QhxoGMWzA7wAA');
      audio.play().catch(() => {});

      setTimeout(() => notification.close(), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    if (localStorage.getItem('rememberMe') !== 'true') {
      localStorage.clear();
    }
    navigate('/');
  };

  const addDeadline = (newDeadline: Omit<Deadline, 'id' | 'createdBy' | 'createdAt'>) => {
    const deadline: Deadline = {
      ...newDeadline,
      id: Date.now().toString(),
      createdBy: currentUser?.username || '',
      createdAt: new Date().toISOString()
    };
    
    const updatedDeadlines = [...deadlines, deadline];
    setDeadlines(updatedDeadlines);
    localStorage.setItem('deadlines', JSON.stringify(updatedDeadlines));
    
    toast({
      title: "Scadenza aggiunta",
      description: `"${deadline.title}" è stata aggiunta con successo`,
    });
  };

  const deleteDeadline = (id: string) => {
    const updatedDeadlines = deadlines.filter(d => d.id !== id);
    setDeadlines(updatedDeadlines);
    localStorage.setItem('deadlines', JSON.stringify(updatedDeadlines));
    
    toast({
      title: "Scadenza eliminata",
      description: "La scadenza è stata rimossa",
    });
  };

  const exportToPDF = () => {
    // Implementazione semplificata per l'esportazione PDF
    toast({
      title: "Esportazione PDF",
      description: "Funzionalità in sviluppo - sarà disponibile presto",
    });
  };

  const getActiveDeadlines = () => {
    const now = new Date();
    return deadlines.filter(d => isAfter(new Date(`${d.date}T${d.time}`), now));
  };

  const getPastDeadlines = () => {
    const now = new Date();
    return deadlines.filter(d => isBefore(new Date(`${d.date}T${d.time}`), now));
  };

  const getDeadlinesByCategory = (deadlineList: Deadline[]) => {
    return categories.reduce((acc, category) => {
      acc[category] = deadlineList.filter(d => d.category === category);
      return acc;
    }, {} as Record<string, Deadline[]>);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/530a2c43-8991-4588-aa2d-28b1ac2322c7.png" 
                alt="SE.RI. Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Centro di Raccolta Ecologica SE.RI.</h1>
                <p className="text-sm text-gray-600">Sistema Gestione Scadenze</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <User className="inline w-4 h-4 mr-1" />
                {currentUser.username}
                {currentUser.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => setShowAddModal(true)} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuova Scadenza
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Esporta PDF
          </Button>
          {currentUser.isAdmin && (
            <>
              <Button onClick={() => setShowUsersModal(true)} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Gestisci Utenti
              </Button>
              <Button onClick={() => setShowCategoriesModal(true)} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Gestisci Categorie
              </Button>
            </>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scadenze Attive</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveDeadlines().length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scadenze Passate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPastDeadlines().length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Scadenze</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deadlines.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Scadenze Attive</TabsTrigger>
            <TabsTrigger value="past">Scadenze Passate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {Object.entries(getDeadlinesByCategory(getActiveDeadlines())).map(([category, categoryDeadlines]) => (
              categoryDeadlines.length > 0 && (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryDeadlines.map(deadline => (
                        <div key={deadline.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{deadline.title}</h3>
                              <p className="text-gray-600 mt-1">{deadline.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>📅 {format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                                <span>👤 {deadline.createdBy}</span>
                                {deadline.prealert !== 'nessuno' && <span>🔔 {deadline.prealert}</span>}
                              </div>
                            </div>
                            <Button 
                              onClick={() => deleteDeadline(deadline.id)} 
                              variant="destructive" 
                              size="sm"
                            >
                              Elimina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {Object.entries(getDeadlinesByCategory(getPastDeadlines())).map(([category, categoryDeadlines]) => (
              categoryDeadlines.length > 0 && (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryDeadlines.map(deadline => (
                        <div key={deadline.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-700">{deadline.title}</h3>
                              <p className="text-gray-600 mt-1">{deadline.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>📅 {format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                                <span>👤 {deadline.createdBy}</span>
                                <Badge variant="secondary">Scaduta</Badge>
                              </div>
                            </div>
                            <Button 
                              onClick={() => deleteDeadline(deadline.id)} 
                              variant="destructive" 
                              size="sm"
                            >
                              Elimina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <AddDeadlineModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addDeadline}
        categories={categories}
      />
      
      {currentUser.isAdmin && (
        <>
          <ManageUsersModal 
            isOpen={showUsersModal}
            onClose={() => setShowUsersModal(false)}
          />
          <ManageCategoriesModal 
            isOpen={showCategoriesModal}
            onClose={() => setShowCategoriesModal(false)}
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
