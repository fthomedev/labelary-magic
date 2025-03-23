
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}

export function HistoryPagination({
  currentPage,
  totalPages,
  onPageChange,
  isMobile
}: HistoryPaginationProps) {
  const { t } = useTranslation();
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={(e) => { 
            e.preventDefault(); 
            onPageChange(1); 
          }}
          href="#"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Calculate range to show
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
    
    // Adjust if we're near the start
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={(e) => { 
              e.preventDefault(); 
              onPageChange(i); 
            }}
            href="#"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if there are more pages
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if it's not the first page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={(e) => { 
              e.preventDefault(); 
              onPageChange(totalPages); 
            }}
            href="#"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <Pagination className="mt-2">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious 
              onClick={(e) => { 
                e.preventDefault();
                onPageChange(currentPage - 1); 
              }}
              href="#"
            />
          </PaginationItem>
        )}
        
        {renderPaginationItems()}
        
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext 
              onClick={(e) => { 
                e.preventDefault();
                onPageChange(currentPage + 1); 
              }}
              href="#"
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
