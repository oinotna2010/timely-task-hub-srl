
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from './ConfirmDialog';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesChange
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della categoria è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (categories.includes(newCategory.trim())) {
      toast({
        title: "Errore",
        description: "Categoria già esistente",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    onCategoriesChange(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Aggiunta categoria',
      user: 'admin',
      timestamp: new Date().toISOString(),
      details: `Aggiunta nuova categoria: ${newCategory.trim()}`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
    
    setNewCategory('');
    
    toast({
      title: "Categoria aggiunta",
      description: `La categoria "${newCategory.trim()}" è stata aggiunta con successo`,
    });
  };

  const removeCategory = (categoryName: string) => {
    const updatedCategories = categories.filter(c => c !== categoryName);
    onCategoriesChange(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Log dell'azione
    const log = {
      id: Date.now().toString(),
      action: 'Rimozione categoria',
      user: 'admin',
      timestamp: new Date().toISOString(),
      details: `Rimossa categoria: ${categoryName}`
    };
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    localStorage.setItem('activityLogs', JSON.stringify([log, ...existingLogs]));
    
    setCategoryToDelete(null);
    
    toast({
      title: "Categoria rimossa",
      description: `La categoria "${categoryName}" è stata rimossa`,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gestione Categorie</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Aggiungi Nuova Categoria</h3>
                <div>
                  <Label htmlFor="newCategory">Nome Categoria</Label>
                  <Input
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Inserisci nome categoria"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                </div>
                <Button 
                  onClick={addCategory} 
                  className="mt-4 w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Categoria
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-semibold mb-4">Categorie Esistenti</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(category => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{category}</span>
                    </div>
                    <Button
                      onClick={() => setCategoryToDelete(category)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => categoryToDelete && removeCategory(categoryToDelete)}
        title="Conferma eliminazione"
        description={`Sei sicuro di voler eliminare la categoria "${categoryToDelete}"? Questa azione non può essere annullata.`}
      />
    </>
  );
};

export default ManageCategoriesModal;
