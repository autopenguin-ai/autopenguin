import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InlineDatePickerProps {
  value: string | null;
  onSave: (value: string | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const InlineDatePicker = ({ 
  value, 
  onSave, 
  className, 
  placeholder = "No due date",
  disabled = false 
}: InlineDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dateValue = value ? new Date(value) : undefined;

  const handleDateSelect = async (date: Date | undefined) => {
    const newValue = date ? date.toISOString() : null;
    
    if (newValue === value) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(newValue);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-auto h-auto p-2 justify-start text-left font-normal",
            "hover:bg-muted/50 border border-transparent hover:border-muted-foreground/20",
            !dateValue && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled || isLoading}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, "MMM dd, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          initialFocus
          className="pointer-events-auto"
        />
        {dateValue && (
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(undefined)}
              className="w-full"
            >
              Clear Date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};