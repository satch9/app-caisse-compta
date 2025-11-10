import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangePickerProps {
  onApply: (date_debut: string, date_fin: string) => void;
  defaultDateDebut?: string;
  defaultDateFin?: string;
}

export function DateRangePicker({ onApply, defaultDateDebut, defaultDateFin }: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(defaultDateDebut || firstDayOfMonth);
  const [dateFin, setDateFin] = useState(defaultDateFin || today);

  const formatDateFr = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // Force UTC interpretation
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleApply = () => {
    if (dateDebut && dateFin) {
      onApply(dateDebut, dateFin);
    }
  };

  const setPreset = (preset: 'ce_mois' | 'mois_dernier' | 'cette_annee') => {
    const now = new Date();
    let debut: Date;
    let fin: Date;

    switch (preset) {
      case 'ce_mois':
        debut = new Date(now.getFullYear(), now.getMonth(), 1);
        fin = now;
        break;
      case 'mois_dernier':
        debut = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        fin = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'cette_annee':
        debut = new Date(now.getFullYear(), 0, 1);
        fin = now;
        break;
    }

    const debutStr = debut.toISOString().split('T')[0];
    const finStr = fin.toISOString().split('T')[0];

    setDateDebut(debutStr);
    setDateFin(finStr);
    onApply(debutStr, finStr);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Période</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="date-debut">Date de début</Label>
          <Input
            id="date-debut"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            max={dateFin}
          />
          {dateDebut && (
            <p className="text-xs text-gray-500 mt-1">
              📅 {formatDateFr(dateDebut)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="date-fin">Date de fin</Label>
          <Input
            id="date-fin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            min={dateDebut}
            max={today}
          />
          {dateFin && (
            <p className="text-xs text-gray-500 mt-1">
              📅 {formatDateFr(dateFin)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset('ce_mois')}
        >
          Ce mois
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset('mois_dernier')}
        >
          Mois dernier
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset('cette_annee')}
        >
          Cette année
        </Button>
        <Button
          type="button"
          onClick={handleApply}
          className="ml-auto bg-blue-600 hover:bg-blue-700"
        >
          Appliquer
        </Button>
      </div>
    </div>
  );
}
