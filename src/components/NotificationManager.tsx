// Componente per gestire le notifiche in tempo reale
import React, { useEffect } from 'react';
import { socketService, NotificationData } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';

interface NotificationManagerProps {
  currentUser: { username: string } | null;
  onDeadlineUpdate?: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  currentUser, 
  onDeadlineUpdate 
}) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    // Connetti al socket quando l'utente è loggato
    socketService.connect(currentUser.username);

    // Ascolta le notifiche
    socketService.onNotification((notification: NotificationData) => {
      console.log('Notifica ricevuta:', notification);
      
      // Mostra notifica del browser se possibile
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/lovable-uploads/530a2c43-8991-4588-aa2d-28b1ac2322c7.png'
        });
      }

      // Mostra toast
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    // Ascolta aggiornamenti delle scadenze
    socketService.onDeadlineUpdate((deadline) => {
      console.log('Scadenza aggiornata:', deadline);
      
      // Ricarica le scadenze se c'è un callback
      if (onDeadlineUpdate) {
        onDeadlineUpdate();
      }

      // Notifica dell'aggiornamento
      toast({
        title: "Scadenza aggiornata",
        description: "Una scadenza è stata modificata da un altro utente",
      });
    });

    // Ascolta aggiornamenti degli utenti (solo per admin)
    socketService.onUserUpdate((user) => {
      console.log('Utente aggiornato:', user);
      
      toast({
        title: "Utente aggiornato",
        description: "Un utente è stato modificato",
      });
    });

    // Cleanup quando il componente viene smontato
    return () => {
      socketService.disconnect();
    };
  }, [currentUser, onDeadlineUpdate, toast]);

  // Questo componente non renderizza nulla
  return null;
};

export default NotificationManager;