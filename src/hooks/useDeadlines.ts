import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: string;
  priority: 'bassa' | 'media' | 'alta';
  prealert: string[];
  assignedTo: string[];
  completed: boolean;
  createdBy: string;
  createdAt?: string;
}

export const useDeadlines = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isServerMode = () => localStorage.getItem('serverMode') === 'true';

  // Carica scadenze
  const loadDeadlines = async () => {
    setLoading(true);
    try {
      if (isServerMode()) {
        // Modalità server - usa API
        const serverDeadlines = await apiService.getDeadlines();
        const formattedDeadlines = serverDeadlines.map(d => ({
          ...d,
          id: d.id?.toString() || Date.now().toString()
        }));
        setDeadlines(formattedDeadlines);
      } else {
        // Modalità locale - usa localStorage
        const saved = localStorage.getItem('deadlines');
        if (saved) {
          setDeadlines(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento scadenze:', error);
      // Fallback a localStorage anche in modalità server se API fallisce
      const saved = localStorage.getItem('deadlines');
      if (saved) {
        setDeadlines(JSON.parse(saved));
      }
      toast({
        title: "Avviso",
        description: "Caricamento da server fallito, usando dati locali",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salva scadenze
  const saveDeadlines = (newDeadlines: Deadline[]) => {
    setDeadlines(newDeadlines);
    localStorage.setItem('deadlines', JSON.stringify(newDeadlines));
  };

  // Crea scadenza
  const createDeadline = async (deadline: Omit<Deadline, 'id' | 'createdAt'>) => {
    try {
      if (isServerMode()) {
        // Modalità server
        const created = await apiService.createDeadline(deadline);
        const formattedDeadline = {
          ...created,
          id: created.id?.toString() || Date.now().toString()
        };
        
        // Aggiorna stato locale
        const updatedDeadlines = [...deadlines, formattedDeadline];
        saveDeadlines(updatedDeadlines);
        
        return formattedDeadline;
      } else {
        // Modalità locale
        const newDeadline = {
          ...deadline,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        const updatedDeadlines = [...deadlines, newDeadline];
        saveDeadlines(updatedDeadlines);
        
        return newDeadline;
      }
    } catch (error) {
      console.error('Errore nella creazione scadenza:', error);
      throw error;
    }
  };

  // Aggiorna scadenza
  const updateDeadline = async (deadlineId: string, updates: Partial<Deadline>) => {
    try {
      if (isServerMode()) {
        // Modalità server
        const { id, ...updateData } = updates;
        const updated = await apiService.updateDeadline(parseInt(deadlineId), updateData);
        const formattedDeadline = {
          ...updated,
          id: updated.id?.toString() || deadlineId
        };
        
        // Aggiorna stato locale
        const updatedDeadlines = deadlines.map(d => 
          d.id === deadlineId ? formattedDeadline : d
        );
        saveDeadlines(updatedDeadlines);
        
        return formattedDeadline;
      } else {
        // Modalità locale
        const updatedDeadlines = deadlines.map(d => 
          d.id === deadlineId ? { ...d, ...updates } : d
        );
        saveDeadlines(updatedDeadlines);
        
        return updatedDeadlines.find(d => d.id === deadlineId);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento scadenza:', error);
      throw error;
    }
  };

  // Elimina scadenza
  const deleteDeadline = async (id: string) => {
    try {
      if (isServerMode()) {
        // Modalità server
        await apiService.deleteDeadline(parseInt(id));
      }
      
      // Aggiorna stato locale (in entrambe le modalità)
      const updatedDeadlines = deadlines.filter(d => d.id !== id);
      saveDeadlines(updatedDeadlines);
    } catch (error) {
      console.error('Errore nell\'eliminazione scadenza:', error);
      throw error;
    }
  };

  // Completa scadenza
  const completeDeadline = async (id: string) => {
    try {
      if (isServerMode()) {
        // Modalità server
        await apiService.completeDeadline(parseInt(id));
      }
      
      // Aggiorna stato locale (in entrambe le modalità)
      const updatedDeadlines = deadlines.map(d => 
        d.id === id ? { ...d, completed: true } : d
      );
      saveDeadlines(updatedDeadlines);
    } catch (error) {
      console.error('Errore nel completamento scadenza:', error);
      throw error;
    }
  };

  // Carica scadenze all'avvio
  useEffect(() => {
    loadDeadlines();
  }, []);

  return {
    deadlines,
    loading,
    loadDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    completeDeadline,
    isServerMode: isServerMode()
  };
};