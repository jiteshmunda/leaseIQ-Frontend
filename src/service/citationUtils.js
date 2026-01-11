import { getCachedDocumentPdf, fetchAndCacheDocumentPdf, getDocumentPdfBlobUrl, getLeaseFile } from "./leaseFileStore";
import api from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Parse a citation to extract page number and quoted text
 * Handles both structured citation objects and legacy string citations
 * 
 * Expected structured format:
 * {
 *   value: "Section 4.1, Page 12",      // Display text
 *   page_number: 12,                     // Page to navigate to (1-indexed)
 *   quoted_text: "The tenant shall..."   // Exact text to highlight
 * }
 * 
 * Legacy string format examples:
 * - "Page 12"
 * - "Section 4.1, Page 12"
 * - "p. 5"
 * - "Pages 3-5"
 * 
 * @param {string | object} citation - The citation to parse
 * @returns {{ displayText: string, pageNumber: number | null, quotedText: string | null }}
 */
export const parseCitation = (citation) => {
  // Default result
  const result = {
    displayText: "",
    pageNumber: null,
    quotedText: null,
  };

  if (!citation) return result;

  // Handle structured citation object
  if (typeof citation === "object") {
    // Extract display text
    result.displayText = citation.value || citation.text || "";
    
    // Extract page number
    if (typeof citation.page_number === "number") {
      result.pageNumber = citation.page_number;
    } else if (typeof citation.pageNumber === "number") {
      result.pageNumber = citation.pageNumber;
    } else if (typeof citation.page === "number") {
      result.pageNumber = citation.page;
    }
    
    // Extract quoted text
    result.quotedText = citation.quoted_text || citation.quotedText || citation.text_content || null;
    
    // If no page number found in structured data, try parsing the display text
    if (result.pageNumber === null && result.displayText) {
      result.pageNumber = extractPageNumberFromText(result.displayText);
    }
    
    return result;
  }

  // Handle string citation
  if (typeof citation === "string") {
    result.displayText = citation;
    result.pageNumber = extractPageNumberFromText(citation);
    return result;
  }

  return result;
};

/**
 * Extract page number from citation text
 * @param {string} text - The citation text
 * @returns {number | null}
 */
const extractPageNumberFromText = (text) => {
  if (!text || typeof text !== "string") return null;
  
  const trimmed = text.trim();
  
  // Handle plain numbers like "3" or "12"
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  
  // Handle page ranges like "2-4" or "12-15" (take first number)
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–—]\s*\d+$/);
  if (rangeMatch && rangeMatch[1]) {
    const num = parseInt(rangeMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  
  // Common patterns for page references
  const patterns = [
    /page\s*(\d+)/i,           // "Page 12", "page12"
    /p\.\s*(\d+)/i,            // "p. 12", "p.12"
    /pg\.\s*(\d+)/i,           // "pg. 12"
    /pages?\s*(\d+)/i,         // "Pages 12-15" (gets first)
    /\bp(\d+)\b/i,             // "P12"
    /,\s*(\d+)$/,              // "Section 4.1, 12" (trailing number)
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  
  return null;
};

/**
 * Get or fetch the PDF for a document and return a blob URL
 * @param {string} documentId - The document ID (can be a lease file ID or document ID)
 * @returns {Promise<string>} - The blob URL for the PDF
 */
export const getDocumentPdfUrl = async (documentId) => {
  if (!documentId) {
    throw new Error("Document ID is required");
  }

  // Check if already cached in documentPdfs store
  let blobUrl = await getDocumentPdfBlobUrl(documentId);
  if (blobUrl) {
    return blobUrl;
  }

  // Check if it's a Quick Lease Analysis file (stored in leaseFiles store)
  const leaseFile = await getLeaseFile(documentId);
  if (leaseFile && leaseFile.blob) {
    // Create blob URL directly from the stored file
    return URL.createObjectURL(leaseFile.blob);
  }

  // Not in local storage, fetch from backend
  const res = await api.get(`${BASE_URL}/api/leases/document/${documentId}`);
  const serverUrl = res?.data?.url || res?.data?.data?.url;
  
  if (!serverUrl) {
    throw new Error("Document URL not found");
  }

  // Fetch and cache the PDF
  await fetchAndCacheDocumentPdf(documentId, serverUrl);
  
  // Get the blob URL
  blobUrl = await getDocumentPdfBlobUrl(documentId);
  if (!blobUrl) {
    throw new Error("Failed to create blob URL for cached PDF");
  }

  return blobUrl;
};

/**
 * Store PDF blob URL in session storage for the viewer to access
 * @param {string} blobUrl - The blob URL
 * @param {string} documentId - The document ID
 */
const storePdfForViewer = (blobUrl, documentId) => {
  sessionStorage.setItem("pdfViewer_blobUrl", blobUrl);
  sessionStorage.setItem("pdfViewer_documentId", documentId);
};

/**
 * Open PDF viewer in a new tab with citation navigation
 * @param {string} documentId - The document ID
 * @param {string | object} citation - The citation to navigate to
 * @returns {Promise<void>}
 */
export const openPdfWithCitation = async (documentId, citation) => {
  if (!documentId) {
    throw new Error("Document ID is required");
  }

  // Parse the citation
  const { pageNumber, quotedText } = parseCitation(citation);
  
  // Get the PDF blob URL
  const blobUrl = await getDocumentPdfUrl(documentId);
  
  // Store in session storage for the viewer
  storePdfForViewer(blobUrl, documentId);
  
  // Build query params
  const params = new URLSearchParams();
  if (pageNumber) {
    params.set("page", String(pageNumber));
  }
  if (quotedText) {
    params.set("highlight", encodeURIComponent(quotedText));
  }
  params.set("docId", documentId);
  
  // Open the PDF viewer in a new tab
  const viewerUrl = `/pdf-viewer?${params.toString()}`;
  window.open(viewerUrl, "_blank", "noopener");
};

/**
 * Get the display text for a citation
 * @param {string | object} citation - The citation
 * @returns {string}
 */
export const getCitationDisplayText = (citation) => {
  if (!citation) return "";
  
  if (typeof citation === "string") return citation;
  
  if (typeof citation === "object") {
    return citation.value || citation.text || "";
  }
  
  return "";
};

/**
 * Check if a citation has enough information to navigate
 * @param {string | object} citation - The citation
 * @returns {boolean}
 */
export const canNavigateToCitation = (citation) => {
  const parsed = parseCitation(citation);
  return parsed.pageNumber !== null || parsed.quotedText !== null;
};

