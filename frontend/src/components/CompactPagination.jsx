import { getPaginationItems } from "./pagination";

function CompactPagination({
  ariaLabel,
  currentPage,
  onPageChange,
  resultText,
  totalPages,
}) {
  return (
    <div className="feature-pagination">
      {resultText && <span className="feature-result-count">{resultText}</span>}
      {totalPages > 1 && <nav aria-label={ariaLabel}>
        <button className="feature-page-button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))} type="button">← Previous</button>
        <div className="feature-page-numbers">
          {getPaginationItems(currentPage, totalPages).map((item, index) => item === "ellipsis" ? <span className="feature-page-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span> : <button className={`feature-page-button ${item === currentPage ? "is-current" : ""}`} aria-current={item === currentPage ? "page" : undefined} aria-label={`Go to page ${item}`} onClick={() => onPageChange(item)} type="button" key={item}>{item}</button>)}
        </div>
        <button className="feature-page-button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} type="button">Next →</button>
      </nav>}
    </div>
  );
}

export default CompactPagination;
