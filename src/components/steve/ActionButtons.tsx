import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface ActionButton {
  label: string;      // "Delete Option 1" or "刪除選項 1"
  message: string;    // What to send: "delete contact option 1"
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  onButtonClick: (message: string) => void;
}

export const ActionButtons = ({ buttons, onButtonClick }: ActionButtonsProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (message: string) => {
    if (isClicked) return; // Prevent double-click
    setIsClicked(true);
    onButtonClick(message);
  };

  if (!buttons.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || 'outline'}
          size="sm"
          onClick={() => handleClick(button.message)}
          disabled={isClicked}
          className="text-xs"
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
};
