import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiSearch, FiX } from "react-icons/fi";
import { getCachedDocumentPdf, getLeaseFile } from "../service/leaseFileStore";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../styles/pdfViewer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = () => {
  const [searchParams] = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightText, setHighlightText] = useState("");
  const [highlightMatches, setHighlightMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [renderedPages, setRenderedPages] = useState(new Set());
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  
  const pageRefs = useRef({});
  const containerRef = useRef(null);
  const documentRef = useRef(null);

  // Parse URL parameters
  const targetPage = parseInt(searchParams.get("page"), 10) || 1;
  const highlightParam = searchParams.get("highlight");
  const documentId = searchParams.get("docId");

  // Load PDF from session storage or IndexedDB
  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, try session storage (set by openPdfWithCitation)
        const sessionBlobUrl = sessionStorage.getItem("pdfViewer_blobUrl");
        const sessionDocId = sessionStorage.getItem("pdfViewer_documentId");

        if (sessionBlobUrl && sessionDocId === documentId) {
          setPdfUrl(sessionBlobUrl);
          setLoading(false);
          return;
        }

        // If not in session, try to get from IndexedDB
        if (documentId) {
          // First check documentPdfs store (for regular lease details)
          const cached = await getCachedDocumentPdf(documentId);
          if (cached && cached.blob) {
            const blobUrl = URL.createObjectURL(cached.blob);
            setPdfUrl(blobUrl);
            setLoading(false);
            return;
          }

          // Also check leaseFiles store (for Quick Lease Analysis)
          const leaseFile = await getLeaseFile(documentId);
          if (leaseFile && leaseFile.blob) {
            const blobUrl = URL.createObjectURL(leaseFile.blob);
            setPdfUrl(blobUrl);
            setLoading(false);
            return;
          }
        }

        setError("PDF not found. Please close this tab and try again from the lease details page.");
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setError("Failed to load PDF. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    // Cleanup blob URLs on unmount
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [documentId]);

  // Set highlight text from URL param
  useEffect(() => {
    if (highlightParam) {
      try {
        const decoded = decodeURIComponent(highlightParam);
        setHighlightText(decoded);
      } catch {
        setHighlightText(highlightParam);
      }
    }
  }, [highlightParam]);

  // Navigate to target page once PDF is loaded
  useEffect(() => {
    if (numPages && targetPage > 0 && targetPage <= numPages) {
      setCurrentPage(targetPage);
    }
  }, [numPages, targetPage]);

  // Scroll to target page ONLY after it has been rendered (initial navigation)
  useEffect(() => {
    if (!initialScrollDone && renderedPages.has(targetPage) && pageRefs.current[targetPage]) {
      pageRefs.current[targetPage].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setInitialScrollDone(true);
    }
  }, [renderedPages, targetPage, initialScrollDone]);

  // Scroll to current page (for manual navigation via buttons/input)
  useEffect(() => {
    // Skip if this is initial load - that's handled by the effect above
    if (!initialScrollDone) return;
    
    if (pageRefs.current[currentPage]) {
      pageRefs.current[currentPage].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentPage, initialScrollDone]);

  // Highlight text on the page
  const performHighlight = useCallback(() => {
    if (!highlightText || !containerRef.current) return;

    // Remove existing highlights
    const existingHighlights = containerRef.current.querySelectorAll(".pdf-highlight");
    existingHighlights.forEach((el) => el.classList.remove("pdf-highlight"));

    // Find text layers and search for matches
    const textLayers = containerRef.current.querySelectorAll(".react-pdf__Page__textContent");
    const matches = [];

    textLayers.forEach((layer, pageIndex) => {
      const textSpans = layer.querySelectorAll("span");
      const searchLower = highlightText.toLowerCase();
      
      textSpans.forEach((span) => {
        const text = span.textContent || "";
        if (text.toLowerCase().includes(searchLower)) {
          span.classList.add("pdf-highlight");
          matches.push({
            element: span,
            page: pageIndex + 1,
          });
        }
      });
    });

    setHighlightMatches(matches);

    // Scroll to first match if on target page
    if (matches.length > 0) {
      const firstMatch = matches.find((m) => m.page === currentPage) || matches[0];
      if (firstMatch) {
        setTimeout(() => {
          firstMatch.element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    }
  }, [highlightText, currentPage]);

  // Perform highlight after pages render
  useEffect(() => {
    if (numPages && highlightText) {
      // Delay to ensure text layer is rendered
      const timer = setTimeout(performHighlight, 500);
      return () => clearTimeout(timer);
    }
  }, [numPages, highlightText, currentPage, performHighlight]);

  const onDocumentLoadSuccess = ({ numPages: pages }) => {
    setNumPages(pages);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF load error:", err);
    setError("Failed to load PDF document.");
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages || prev, prev + 1));
  };

  const goToPrevMatch = () => {
    if (highlightMatches.length === 0) return;
    const newIndex = currentMatchIndex <= 0 ? highlightMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    const match = highlightMatches[newIndex];
    if (match) {
      setCurrentPage(match.page);
      setTimeout(() => {
        match.element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const goToNextMatch = () => {
    if (highlightMatches.length === 0) return;
    const newIndex = currentMatchIndex >= highlightMatches.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(newIndex);
    const match = highlightMatches[newIndex];
    if (match) {
      setCurrentPage(match.page);
      setTimeout(() => {
        match.element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  const clearHighlight = () => {
    setHighlightText("");
    setHighlightMatches([]);
    const existingHighlights = containerRef.current?.querySelectorAll(".pdf-highlight");
    existingHighlights?.forEach((el) => el.classList.remove("pdf-highlight"));
  };

  if (loading) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-loading">
          <div className="pdf-viewer-spinner"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      {/* Toolbar */}
      <div className="pdf-viewer-toolbar">
        <div className="pdf-viewer-toolbar-section">
          <button
            className="pdf-viewer-btn"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <FiChevronLeft />
          </button>
          
          <span className="pdf-viewer-page-info">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value, 10);
                if (page >= 1 && page <= numPages) {
                  setCurrentPage(page);
                }
              }}
              className="pdf-viewer-page-input"
            />
            <span> / {numPages || "?"}</span>
          </span>
          
          <button
            className="pdf-viewer-btn"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            title="Next Page"
          >
            <FiChevronRight />
          </button>
        </div>

        <div className="pdf-viewer-toolbar-section">
          <button
            className="pdf-viewer-btn"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            title="Zoom Out"
          >
            <FiZoomOut />
          </button>
          
          <span className="pdf-viewer-zoom-level">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            className="pdf-viewer-btn"
            onClick={zoomIn}
            disabled={scale >= 3}
            title="Zoom In"
          >
            <FiZoomIn />
          </button>
        </div>

        {highlightText && (
          <div className="pdf-viewer-toolbar-section pdf-viewer-search-section">
            <FiSearch className="pdf-viewer-search-icon" />
            <span className="pdf-viewer-search-term">
              "{highlightText.substring(0, 30)}{highlightText.length > 30 ? "..." : ""}"
            </span>
            {highlightMatches.length > 0 && (
              <>
                <button
                  className="pdf-viewer-btn pdf-viewer-btn-sm"
                  onClick={goToPrevMatch}
                  title="Previous Match"
                >
                  <FiChevronLeft size={14} />
                </button>
                <span className="pdf-viewer-match-count">
                  {currentMatchIndex + 1} / {highlightMatches.length}
                </span>
                <button
                  className="pdf-viewer-btn pdf-viewer-btn-sm"
                  onClick={goToNextMatch}
                  title="Next Match"
                >
                  <FiChevronRight size={14} />
                </button>
              </>
            )}
            <button
              className="pdf-viewer-btn pdf-viewer-btn-sm"
              onClick={clearHighlight}
              title="Clear Search"
            >
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* PDF Document */}
      <div className="pdf-viewer-content" ref={containerRef}>
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="pdf-viewer-loading">
                <div className="pdf-viewer-spinner"></div>
                <p>Loading document...</p>
              </div>
            }
            ref={documentRef}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => (pageRefs.current[index + 1] = el)}
                className={`pdf-viewer-page-wrapper ${currentPage === index + 1 ? "active" : ""}`}
              >
                <div className="pdf-viewer-page-number">Page {index + 1}</div>
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="pdf-viewer-page"
                  onRenderSuccess={() => setRenderedPages(prev => new Set(prev).add(index + 1))}
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

