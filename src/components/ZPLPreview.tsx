
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ZPLPreviewProps {
  content: string;
}

export function ZPLPreview({ content }: ZPLPreviewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Conteúdo ZPL
        </h3>
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          <pre className="text-sm font-mono">{content}</pre>
        </ScrollArea>
      </div>
    </Card>
  );
}
