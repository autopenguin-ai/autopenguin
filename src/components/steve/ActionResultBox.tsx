import { useState } from 'react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionResultBoxProps {
  action: string;
  success?: boolean;
  details?: { label: string; value: string }[];
}

export function ActionResultBox({ action, success = true, details }: ActionResultBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 my-2 bg-muted/50 max-w-[85%]">
      <div 
        className={cn(
          "flex items-center justify-between",
          details && details.length > 0 && "cursor-pointer"
        )}
        onClick={() => details && details.length > 0 && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {success ? (
            <Check className="h-4 w-4 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="font-medium text-sm">{action}</span>
        </div>
        {details && details.length > 0 && (
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform shrink-0",
              isExpanded && "rotate-180"
            )} 
          />
        )}
      </div>
      
      {isExpanded && details && details.length > 0 && (
        <div className="mt-2 pt-2 border-t space-y-1 text-sm">
          {details.map((detail, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground">{detail.label}:</span>
              <span className="font-medium">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
