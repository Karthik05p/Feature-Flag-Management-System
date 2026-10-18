export function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 0) return [];
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages]);
  const start = currentPage <= 3 ? 2 : currentPage >= totalPages - 2 ? totalPages - 3 : currentPage - 2;
  const end = currentPage <= 3 ? 4 : currentPage >= totalPages - 2 ? totalPages - 1 : currentPage + 2;
  for (let page = start; page <= end; page += 1) pages.add(page);

  const orderedPages = [...pages].sort((left, right) => left - right);
  const items = [];
  orderedPages.forEach((page, index) => {
    if (index > 0 && page - orderedPages[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}
