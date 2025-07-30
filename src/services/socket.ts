// Service per gestire le notifiche in tempo reale via WebSocket
// TODO: Sostituire 'http://localhost:3001' con l'indirizzo del tuo server

import { io, Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'system' | 'user';
  timestamp: string;
  deadlineId?: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string) {
    if (this.socket) {
      this.disconnect();
    }

    // TODO: Sostituire con l'URL del tuo server
    this.socket = io('http://localhost:3001', {
      auth: {
        token: localStorage.getItem('token'),
        userId: userId
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connesso');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnesso');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Errore socket:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Ascolta le notifiche
  onNotification(callback: (notification: NotificationData) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // Ascolta aggiornamenti delle scadenze
  onDeadlineUpdate(callback: (deadline: any) => void) {
    if (this.socket) {
      this.socket.on('deadline_updated', callback);
      this.socket.on('deadline_created', callback);
      this.socket.on('deadline_deleted', callback);
      this.socket.on('deadline_completed', callback);
    }
  }

  // Ascolta aggiornamenti degli utenti
  onUserUpdate(callback: (user: any) => void) {
    if (this.socket) {
      this.socket.on('user_updated', callback);
      this.socket.on('user_created', callback);
      this.socket.on('user_deleted', callback);
    }
  }

  // Invia una notifica a tutti gli utenti connessi
  sendNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_notification', notification);
    }
  }

  // Segna una notifica come letta
  markNotificationAsRead(notificationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', notificationId);
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export type { NotificationData };