
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Categorie predefinite che non possono essere eliminate
  const defaultCategories = ['Amministrative', 'Tecniche', 'Commerciali', 'Generali'];

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
    
    setNewCategory('');
    
    toast({
      title: "Categoria aggiunta",
      description: `La categoria "${newCategory.trim()}" è stata aggiunta con successo`,
    });
  };

  const removeCategory = (categoryName: string) => {
    if (defaultCategories.includes(categoryName)) {
      toast({
        title: "Errore",
        description: "Non puoi eliminare questa categoria predefinita",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = categories.filter(c => c !== categoryName);
    onCategoriesChange(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    toast({
      title: "Categoria rimossa",
      description: `La categoria "${categoryName}" è stata rimossa`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestione Categorie</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add new category */}
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

          {/* Categories list */}
          <div>
            <h3 className="font-semibold mb-4">Categorie Esistenti</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{category}</span>
                    {defaultCategories.includes(category) && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Predefinita</span>
                    )}
                  </div>
                  <Button
                    onClick={() => removeCategory(category)}
                    variant="destructive"
                    size="sm"
                    disabled={defaultCategories.includes(category)}
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
  );
};

export default ManageCategoriesModal;
