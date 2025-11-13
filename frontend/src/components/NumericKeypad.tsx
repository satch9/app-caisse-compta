import { Button } from '@/components/ui/button';
import { Delete, Check } from 'lucide-react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onConfirm?: () => void;
  showConfirm?: boolean;
  disabled?: boolean;
}

export function NumericKeypad({
  onDigit,
  onClear,
  onConfirm,
  showConfirm = false,
  disabled = false
}: NumericKeypadProps) {
  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {digits.map((digit) => (
        <Button
          key={digit}
          onClick={() => onDigit(digit)}
          disabled={disabled}
          variant="outline"
          size="lg"
          className="h-14 text-2xl font-semibold hover:bg-blue-50"
        >
          {digit}
        </Button>
      ))}

      <Button
        onClick={onClear}
        disabled={disabled}
        variant="destructive"
        size="lg"
        className="h-14"
      >
        <Delete className="h-6 w-6" />
      </Button>

      {showConfirm && onConfirm && (
        <Button
          onClick={onConfirm}
          disabled={disabled}
          variant="default"
          size="lg"
          className="h-14 col-span-2 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-6 w-6 mr-2" />
          Valider
        </Button>
      )}
    </div>
  );
}
