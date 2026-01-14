
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function HistoryPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: HistoryPaginationProps) {
  const { t } = useTranslation();
  
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const getPaginationItems = () => {
    const items = [];
    const maxDisplayedPages = window.innerWidth < 768 ? 3 : 5; // Fewer pages on mobile
    
    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxDisplayedPages) {
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage}
            onClick={() => onPageChange(i)}
            className={`
              ${i === currentPage ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
              min-w-[32px] h-8 text-sm px-2 md:min-w-[40px] md:h-10 md:text-base md:px-4
            `}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <div className="flex justify-center py-2">
      <Pagination className="mx-0">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePreviousPage}
              className={`
                ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent hover:text-accent-foreground'} 
                transition-colors h-8 px-2 text-sm md:h-10 md:px-4 md:text-base
              `}
              aria-disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline ml-1">{t('previous')}</span>
            </PaginationPrevious>
          </PaginationItem>
          
          {getPaginationItems()}
          
          <PaginationItem>
            <PaginationNext 
              onClick={handleNextPage}
              className={`
                ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent hover:text-accent-foreground'} 
                transition-colors h-8 px-2 text-sm md:h-10 md:px-4 md:text-base
              `}
              aria-disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline mr-1">{t('next')}</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
