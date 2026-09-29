/**
 * Returns a list of up to 3 visible page numbers for pagination.
 * If totalPages > 3, the current page will be in the middle whenever possible:
 * - currentPage <= 1: [1, 2, 3]
 * - currentPage >= totalPages: [totalPages - 2, totalPages - 1, totalPages]
 * - otherwise: [currentPage - 1, currentPage, currentPage + 1]
 */
export function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 1) {
    return [1, 2, 3];
  }
  if (currentPage >= totalPages) {
    return [totalPages - 2, totalPages - 1, totalPages];
  }
  return [currentPage - 1, currentPage, currentPage + 1];
}
