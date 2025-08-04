import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id?: number;
  username: string;
  password: string;
  isAdmin: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isServerMode = () => localStorage.getItem('serverMode') === 'true';

  // Carica utenti
  const loadUsers = async () => {
    setLoading(true);
    try {
      if (isServerMode()) {
        // Modalità server - usa API
        const serverUsers = await apiService.getUsers();
        setUsers(serverUsers);
      } else {
        // Modalità locale - usa localStorage
        const saved = localStorage.getItem('users');
        if (saved) {
          setUsers(JSON.parse(saved));
        } else {
          // Utenti di default
          const defaultUsers = [
            { username: 'admin', password: 'SERISRL25%', isAdmin: true }
          ];
          setUsers(defaultUsers);
          localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento utenti:', error);
      // Fallback a localStorage
      const saved = localStorage.getItem('users');
      if (saved) {
        setUsers(JSON.parse(saved));
      }
      toast({
        title: "Avviso",
        description: "Caricamento utenti da server fallito, usando dati locali",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salva utenti localmente
  const saveUsersLocally = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  // Crea utente
  const createUser = async (user: Omit<User, 'id'>) => {
    try {
      if (isServerMode()) {
        // Modalità server
        const created = await apiService.createUser(user);
        setUsers(prev => [...prev, created]);
        return created;
      } else {
        // Modalità locale
        const newUser = { ...user, id: Date.now() };
        const updatedUsers = [...users, newUser];
        saveUsersLocally(updatedUsers);
        return newUser;
      }
    } catch (error) {
      console.error('Errore nella creazione utente:', error);
      throw error;
    }
  };

  // Aggiorna utente
  const updateUser = async (id: number, updates: Partial<User>) => {
    try {
      if (isServerMode()) {
        // Modalità server
        const updated = await apiService.updateUser(id, updates);
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        return updated;
      } else {
        // Modalità locale
        const updatedUsers = users.map(u => 
          u.id === id ? { ...u, ...updates } : u
        );
        saveUsersLocally(updatedUsers);
        return updatedUsers.find(u => u.id === id);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento utente:', error);
      throw error;
    }
  };

  // Elimina utente
  const deleteUser = async (id: number) => {
    try {
      if (isServerMode()) {
        // Modalità server
        await apiService.deleteUser(id);
      }
      
      // Aggiorna stato locale (in entrambe le modalità)
      const updatedUsers = users.filter(u => u.id !== id);
      saveUsersLocally(updatedUsers);
    } catch (error) {
      console.error('Errore nell\'eliminazione utente:', error);
      throw error;
    }
  };

  // Carica utenti all'avvio
  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    isServerMode: isServerMode()
  };
};