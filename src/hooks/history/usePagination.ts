
import { useState, useCallback } from 'react';

export function usePagination(totalRecords: number, recordsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  return {
    currentPage,
    totalPages,
    handlePageChange,
    recordsPerPage
  };
}
