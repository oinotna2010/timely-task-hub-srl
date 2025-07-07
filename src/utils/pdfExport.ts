
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export const exportToPDF = async (deadlines: Deadline[], categories: string[]) => {
  // Filtra solo scadenze attive
  const now = new Date();
  const activeDeadlines = deadlines.filter(d => !d.completed && new Date(`${d.date}T${d.time}`) > now);
  
  const pdf = new jsPDF();
  let yPosition = 20;

  // Titolo
  pdf.setFontSize(18);
  pdf.text('Centro di Raccolta Ecologica SE.RI.', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(14);
  pdf.text('Sistema Gestione Scadenze - Solo Scadenze Attive', 20, yPosition);
  yPosition += 15;

  // Data di esportazione
  pdf.setFontSize(10);
  pdf.text(`Esportato il: ${new Date().toLocaleDateString('it-IT')}`, 20, yPosition);
  yPosition += 15;

  // Statistiche
  pdf.setFontSize(12);
  pdf.text('Statistiche:', 20, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.text(`Scadenze attive esportate: ${activeDeadlines.length}`, 25, yPosition);
  yPosition += 15;

  // Scadenze per categoria
  categories.forEach(category => {
    const categoryDeadlines = activeDeadlines.filter(d => d.category === category);
    if (categoryDeadlines.length === 0) return;

    // Verifica se c'è spazio sufficiente, altrimenti nuova pagina
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.text(`Categoria: ${category}`, 20, yPosition);
    yPosition += 10;

    categoryDeadlines.forEach(deadline => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(10);
      pdf.text(`• ${deadline.title}`, 25, yPosition);
      yPosition += 5;
      
      if (deadline.description) {
        const description = deadline.description.length > 60 
          ? deadline.description.substring(0, 60) + '...' 
          : deadline.description;
        pdf.text(`  ${description}`, 25, yPosition);
        yPosition += 5;
      }
      
      const dateStr = new Date(`${deadline.date}T${deadline.time}`).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      pdf.text(`  Scadenza: ${dateStr}`, 25, yPosition);
      yPosition += 5;
      
      pdf.text(`  Creato da: ${deadline.createdBy}`, 25, yPosition);
      yPosition += 5;
      
      if (deadline.completed) {
        pdf.text(`  Stato: COMPLETATA`, 25, yPosition);
        yPosition += 5;
      }
      
      yPosition += 3;
    });

    yPosition += 5;
  });

  // Salva il PDF
  pdf.save('scadenze-seri.pdf');
};
