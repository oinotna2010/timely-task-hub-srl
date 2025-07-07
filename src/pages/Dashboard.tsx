
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LogOut, Bell, Download, Settings, Calendar, Clock, User, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddDeadlineModal from '@/components/AddDeadlineModal';
import ManageUsersModal from '@/components/ManageUsersModal';
import ManageCategoriesModal from '@/components/ManageCategoriesModal';
import SettingsModal from '@/components/SettingsModal';
import ActivityLogsModal from '@/components/ActivityLogsModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { exportToPDF } from '@/utils/pdfExport';
import { format, isAfter, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';

interface User {
  username: string;
  password: string;
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
  prealert: string[];
  createdBy: string;
  createdAt: string;
  completed?: boolean;
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [deadlineToDelete, setDeadlineToDelete] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/');
      return;
    }
    setCurrentUser(JSON.parse(userData));

    const savedDeadlines = localStorage.getItem('deadlines');
    if (savedDeadlines) {
      setDeadlines(JSON.parse(savedDeadlines));
    }

    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const notificationInterval = setInterval(checkNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, [navigate]);

  const checkNotifications = () => {
    const now = new Date();
    deadlines.forEach(deadline => {
      if (deadline.completed) return;
      
      const deadlineDate = new Date(`${deadline.date}T${deadline.time}`);
      const hoursUntil = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      deadline.prealert.forEach(alert => {
        let alertMinutes = 0;
        if (alert === '3mesi') alertMinutes = 24 * 60 * 90;
        else if (alert === '1mese') alertMinutes = 24 * 60 * 30;
        else if (alert === '20giorni') alertMinutes = 24 * 60 * 20;
        else if (alert === '15giorni') alertMinutes = 24 * 60 * 15;
        else if (alert === '7giorni') alertMinutes = 24 * 60 * 7;
        else if (alert === '30min') alertMinutes = 30;
        else if (alert === '10min') alertMinutes = 10;
        else if (alert === '5min') alertMinutes = 5;
        else if (alert === '1min') alertMinutes = 1;
        
        const minutesUntil = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60));
        
        if (minutesUntil === alertMinutes) {
          showNotification(deadline);
        }
      });
    });
  };

  const showNotification = (deadline: Deadline) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Scadenza: ${deadline.title}`, {
        body: `${deadline.description}\nScadenza: ${format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}`,
        icon: '/lovable-uploads/530a2c43-8991-4588-aa2d-28b1ac2322c7.png'
      });

      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIYBzuS2e/MeSsFJHXU6t+OSAoTa7zn669VFApCqOH3xWEcBj2A3O3QhxoGMWzA7wAA');
      audio.play().catch(() => {});

      setTimeout(() => notification.close(), 5000);
    }
  };

  const handleLogout = () => {
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Logout',
      user: currentUser?.username || '',
      timestamp: new Date().toISOString(),
      details: `L'utente ${currentUser?.username} ha effettuato il logout`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));

    localStorage.removeItem('currentUser');
    // Non rimuovere i dati se "ricordami" è attivo, altrimenti rimuovi solo currentUser
    if (localStorage.getItem('rememberMe') !== 'true') {
      // Mantieni i dati essenziali
      const users = localStorage.getItem('users');
      const deadlines = localStorage.getItem('deadlines');
      const categories = localStorage.getItem('categories');
      const activityLogs = localStorage.getItem('activityLogs');
      
      localStorage.clear();
      
      // Ripristina i dati essenziali
      if (users) localStorage.setItem('users', users);
      if (deadlines) localStorage.setItem('deadlines', deadlines);
      if (categories) localStorage.setItem('categories', categories);
      if (activityLogs) localStorage.setItem('activityLogs', activityLogs);
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
    
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Aggiunta scadenza',
      user: currentUser?.username || '',
      timestamp: new Date().toISOString(),
      details: `Aggiunta scadenza: ${deadline.title}`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
    
    toast({
      title: "Scadenza aggiunta",
      description: `"${deadline.title}" è stata aggiunta con successo`,
    });
  };

  const deleteDeadline = (id: string) => {
    const deadline = deadlines.find(d => d.id === id);
    const updatedDeadlines = deadlines.filter(d => d.id !== id);
    setDeadlines(updatedDeadlines);
    localStorage.setItem('deadlines', JSON.stringify(updatedDeadlines));
    
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Eliminazione scadenza',
      user: currentUser?.username || '',
      timestamp: new Date().toISOString(),
      details: `Eliminata scadenza: ${deadline?.title}`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
    
    setDeadlineToDelete(null);
    
    toast({
      title: "Scadenza eliminata",
      description: "La scadenza è stata rimossa",
    });
  };

  const toggleDeadlineCompleted = (id: string) => {
    const updatedDeadlines = deadlines.map(d => 
      d.id === id ? { ...d, completed: !d.completed } : d
    );
    setDeadlines(updatedDeadlines);
    localStorage.setItem('deadlines', JSON.stringify(updatedDeadlines));
    
    const deadline = deadlines.find(d => d.id === id);
    const action = deadline?.completed ? 'Riattivata' : 'Completata';
    
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: `${action} scadenza`,
      user: currentUser?.username || '',
      timestamp: new Date().toISOString(),
      details: `${action} scadenza: ${deadline?.title}`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
    
    toast({
      title: `Scadenza ${action.toLowerCase()}`,
      description: `"${deadline?.title}" è stata ${action.toLowerCase()}`,
    });
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(deadlines, categories);
      
      // Log dell'azione
      const log = {
        id: Date.now().toString(),
        action: 'Esportazione PDF',
        user: currentUser?.username || '',
        timestamp: new Date().toISOString(),
        details: 'Esportato report PDF delle scadenze'
      };
      const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
      
      toast({
        title: "PDF Esportato",
        description: "Il report è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore nell'esportazione",
        description: "Si è verificato un errore durante l'esportazione del PDF",
        variant: "destructive",
      });
    }
  };

  const getActiveDeadlines = () => {
    const now = new Date();
    return deadlines.filter(d => !d.completed && isAfter(new Date(`${d.date}T${d.time}`), now));
  };

  const getPastDeadlines = () => {
    const now = new Date();
    return deadlines.filter(d => !d.completed && isBefore(new Date(`${d.date}T${d.time}`), now));
  };

  const getCompletedDeadlines = () => {
    return deadlines.filter(d => d.completed);
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
              <Button onClick={() => setShowSettingsModal(true)} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Impostazioni
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {!currentUser.isAdmin && (
            <Button onClick={() => setShowAddModal(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Scadenza
            </Button>
          )}
          
          <Button onClick={handleExportPDF} variant="outline">
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
              <Button onClick={() => setShowLogsModal(true)} variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Log Attività
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Completate</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCompletedDeadlines().length}</div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Scadenze Attive</TabsTrigger>
            <TabsTrigger value="past">Scadenze Passate</TabsTrigger>
            <TabsTrigger value="completed">Completate</TabsTrigger>
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
                                {deadline.prealert.length > 0 && (
                                  <span>🔔 {deadline.prealert.join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => toggleDeadlineCompleted(deadline.id)} 
                                variant="outline"
                                size="sm"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Completa
                              </Button>
                              <Button 
                                onClick={() => setDeadlineToDelete(deadline.id)} 
                                variant="destructive" 
                                size="sm"
                              >
                                Elimina
                              </Button>
                            </div>
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
                        <div key={deadline.id} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-red-800">{deadline.title}</h3>
                              <p className="text-red-600 mt-1">{deadline.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-red-500">
                                <span>📅 {format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                                <span>👤 {deadline.createdBy}</span>
                                <Badge variant="destructive">Scaduta</Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => toggleDeadlineCompleted(deadline.id)} 
                                variant="outline"
                                size="sm"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Completa
                              </Button>
                              <Button 
                                onClick={() => setDeadlineToDelete(deadline.id)} 
                                variant="destructive" 
                                size="sm"
                              >
                                Elimina
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {Object.entries(getDeadlinesByCategory(getCompletedDeadlines())).map(([category, categoryDeadlines]) => (
              categoryDeadlines.length > 0 && (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryDeadlines.map(deadline => (
                        <div key={deadline.id} className="border rounded-lg p-4 bg-green-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-green-800">{deadline.title}</h3>
                              <p className="text-green-600 mt-1">{deadline.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-green-500">
                                <span>📅 {format(new Date(`${deadline.date}T${deadline.time}`), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                                <span>👤 {deadline.createdBy}</span>
                                <Badge className="bg-green-500">Completata</Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => toggleDeadlineCompleted(deadline.id)} 
                                variant="outline"
                                size="sm"
                              >
                                Riattiva
                              </Button>
                              <Button 
                                onClick={() => setDeadlineToDelete(deadline.id)} 
                                variant="destructive" 
                                size="sm"
                              >
                                Elimina
                              </Button>
                            </div>
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
      {!currentUser.isAdmin && (
        <AddDeadlineModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addDeadline}
          categories={categories}
        />
      )}
      
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
          <ActivityLogsModal 
            isOpen={showLogsModal}
            onClose={() => setShowLogsModal(false)}
          />
        </>
      )}
      
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={currentUser}
      />

      <ConfirmDialog
        isOpen={!!deadlineToDelete}
        onClose={() => setDeadlineToDelete(null)}
        onConfirm={() => deadlineToDelete && deleteDeadline(deadlineToDelete)}
        title="Conferma eliminazione"
        description="Sei sicuro di voler eliminare questa scadenza? Questa azione non può essere annullata."
      />
    </div>
  );
};

export default Dashboard;
