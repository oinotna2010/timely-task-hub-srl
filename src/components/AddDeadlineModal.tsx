
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface AddDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (deadline: {
    title: string;
    description: string;
    date: string;
    time: string;
    category: string;
    prealert: string[];
  }) => void;
  categories: string[];
}

const AddDeadlineModal: React.FC<AddDeadlineModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  categories
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [prealert, setPrealert] = useState<string[]>([]);
  const { toast } = useToast();

  const prealertOptions = [
    { value: '3mesi', label: '3 mesi prima' },
    { value: '1mese', label: '1 mese prima' },
    { value: '20giorni', label: '20 giorni prima' },
    { value: '15giorni', label: '15 giorni prima' },
    { value: '7giorni', label: '7 giorni prima' }
  ];

  const handlePrealertChange = (value: string, checked: boolean) => {
    if (checked) {
      setPrealert([...prealert, value]);
    } else {
      setPrealert(prealert.filter(p => p !== value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !date || !time || !category) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    onAdd({
      title,
      description,
      date,
      time,
      category,
      prealert
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setCategory('');
    setPrealert([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuova Scadenza</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci il titolo"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrizione *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inserisci la descrizione"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Ora *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Preavvisi</Label>
            <div className="space-y-2 mt-2">
              {prealertOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={prealert.includes(option.value)}
                    onCheckedChange={(checked) => handlePrealertChange(option.value, checked as boolean)}
                  />
                  <Label htmlFor={option.value} className="text-sm">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
              Aggiungi Scadenza
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeadlineModal;
