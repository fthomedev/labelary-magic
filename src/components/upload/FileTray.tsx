import React from 'react';
import { Plus, Trash2, Files, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { FileListItem, ProcessedFileInfo } from './FileListItem';

interface FileTrayProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProcessedFileInfo[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onAddMore: () => void;
}

export function FileTray({ 
  isOpen, 
  onClose, 
  files, 
  onRemoveFile, 
  onClearAll, 
  onAddMore 
}: FileTrayProps) {
  const { t } = useTranslation();
  
  const totalLabels = files.reduce((sum, f) => sum + f.labelCount, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Files className="h-5 w-5 text-primary" />
            {t('fileTray')}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Files className="h-4 w-4" />
              {files.length} {files.length === 1 ? t('file') : t('files')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {totalLabels} {totalLabels === 1 ? t('label') : t('labels')}
            </span>
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 h-[calc(100%-140px)] py-4">
          <div className="space-y-2 pr-4">
            {files.map((fileInfo, index) => (
              <FileListItem
                key={`${fileInfo.file.name}-${index}`}
                fileInfo={fileInfo}
                onRemove={() => onRemoveFile(index)}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>
        
        <SheetFooter className="flex-row gap-2 pt-4 border-t border-border sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="h-4 w-4" />
                {t('clearAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clearAllConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('clearAllConfirmMessage', { count: files.length })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMore}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addMoreFiles')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
