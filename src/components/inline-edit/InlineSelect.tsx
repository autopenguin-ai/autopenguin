import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface InlineSelectProps {
  value: string;
  options: SelectOption[];
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  renderValue?: (value: string, option?: SelectOption) => React.ReactNode;
}

export const InlineSelect = ({ 
  value, 
  options, 
  onSave, 
  className, 
  placeholder,
  disabled = false,
  renderValue
}: InlineSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentOption = options.find(opt => opt.value === value);

  const handleValueChange = async (newValue: string) => {
    if (newValue === value) return;

    setIsLoading(true);
    try {
      await onSave(newValue);
    } catch (error) {
      // Error handling could be improved here
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const defaultRenderValue = () => {
    if (!currentOption) {
      return <span className="text-muted-foreground">{placeholder || "Select..."}</span>;
    }

    if (currentOption.color) {
      return (
        <Badge className={`text-white ${currentOption.color}`}>
          {currentOption.label}
        </Badge>
      );
    }

    return <Badge variant="outline">{currentOption.label}</Badge>;
  };

  return (
    <Select 
      value={value} 
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
      disabled={disabled || isLoading}
    >
      <SelectTrigger 
        className={cn(
          "w-auto h-auto p-2 border-transparent hover:border-muted-foreground/20 bg-transparent",
          "hover:bg-muted/50 transition-colors cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <SelectValue>
          {renderValue ? renderValue(value, currentOption) : defaultRenderValue()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};