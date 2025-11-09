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
    <div className="bg-gray-50 rounded-lg px-4 py-2 border-2 border-gray-200">
      <div className="text-xs text-gray-500 mb-1">SOLDE DU JOUR</div>
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Wallet className="w-4 h-4 text-green-600" />
          <span className="font-semibold">{solde.especes.toFixed(2)}€</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold">{solde.cheques.toFixed(2)}€</span>
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{solde.cb.toFixed(2)}€</span>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="font-bold text-green-600">
          {solde.total.toFixed(2)}€
        </div>
      </div>
    </div>
  );
}
