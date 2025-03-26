
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div className="mt-2 p-3 bg-destructive/10 rounded-lg text-sm flex items-center text-destructive">
      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      {message}
    </div>
  );
}
