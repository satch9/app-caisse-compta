import { Wallet, FileText, CreditCard } from 'lucide-react';

interface SoldeCaisse {
  especes: number;
  cheques: number;
  cb: number;
  total: number;
}

interface SoldeCaisseDisplayProps {
  solde: SoldeCaisse;
}

export function SoldeCaisseDisplay({ solde }: SoldeCaisseDisplayProps) {
  return (
    <div className="bg-card rounded-lg px-4 py-2 border-2 border-border">
      <div className="text-xs text-muted-foreground mb-1">SOLDE DU JOUR</div>
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{solde.especes.toFixed(2)}€</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-accent" />
          <span className="font-semibold text-foreground">{solde.cheques.toFixed(2)}€</span>
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="w-4 h-4 text-info" />
          <span className="font-semibold text-foreground">{solde.cb.toFixed(2)}€</span>
        </div>
        <div className="h-6 w-px bg-border"></div>
        <div className="font-bold text-primary">
          {solde.total.toFixed(2)}€
        </div>
      </div>
    </div>
  );
}
