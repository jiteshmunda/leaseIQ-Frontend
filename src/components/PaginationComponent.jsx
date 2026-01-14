import React from "react";
import "../styles/pagination.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageItems = () => {
        const items = [];
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <button
                    key={i}
                    className={`pagination-btn ${i === currentPage ? "active" : ""}`}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </button>
            );
        }
        return items;
    };

    return (
        <div className="custom-pagination-container">
            <button
                className="pagination-btn pagination-nav-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
            >
                <ChevronLeft size={18} />
            </button>

            {renderPageItems()}

            <button
                className="pagination-btn pagination-nav-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default PaginationComponent;
