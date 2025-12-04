import { Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DecisionPickerButtonProps {
  attachedCount: number;
  onClick: () => void;
  disabled?: boolean;
}

export function DecisionPickerButton({
  attachedCount,
  onClick,
  disabled = false,
}: DecisionPickerButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <Paperclip className="h-4 w-4" />
      <span>Attach Decisions</span>
      {attachedCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {attachedCount}
        </Badge>
      )}
    </Button>
  );
}
