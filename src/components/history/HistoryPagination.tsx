
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
    const maxDisplayedPages = 5; // Adjust based on how many page numbers to show
    
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
            className={i === currentPage ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePreviousPage}
            className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent hover:text-accent-foreground'} transition-colors`}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>
        
        {getPaginationItems()}
        
        <PaginationItem>
          <PaginationNext 
            onClick={handleNextPage}
            className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent hover:text-accent-foreground'} transition-colors`}
            aria-disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
