import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InlineInputProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export const InlineInput = ({ 
  value, 
  onSave, 
  className, 
  placeholder, 
  multiline = false,
  disabled = false 
}: InlineInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      setEditValue(value); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const Component = multiline ? Textarea : Input;
    return (
      <Component
        ref={inputRef as any}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("min-w-[120px]", className)}
        placeholder={placeholder}
        disabled={isLoading}
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors",
        "border border-transparent hover:border-muted-foreground/20",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {value || <span className="text-muted-foreground">{placeholder || "Click to edit"}</span>}
    </div>
  );
};