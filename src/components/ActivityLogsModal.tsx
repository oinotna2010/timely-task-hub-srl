
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedLogs = localStorage.getItem('activityLogs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    }
  }, [isOpen]);

  const clearLogs = () => {
    localStorage.removeItem('activityLogs');
    setLogs([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Log delle Attività</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Registro delle modifiche effettuate dagli utenti
            </p>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Cancella Log
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nessuna attività registrata</p>
            ) : (
              logs.map(log => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm font-medium">{log.user}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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

export default ActivityLogsModal;
