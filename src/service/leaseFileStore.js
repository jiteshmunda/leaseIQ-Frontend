const DB_NAME = "leaseiq";
const DB_VERSION = 2; // Bumped version for new store
const STORE_NAME = "leaseFiles";
const DOC_STORE_NAME = "documentPdfs"; // New store for document-keyed PDFs

const openDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      // Create new store for document-keyed PDFs
      if (!db.objectStoreNames.contains(DOC_STORE_NAME)) {
        db.createObjectStore(DOC_STORE_NAME, { keyPath: "documentId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withStore = async (storeName, mode, fn) => {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await fn(store);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    return result;
  } finally {
    db.close();
  }
};

// Legacy helper for backward compatibility
const withLeaseStore = (mode, fn) => withStore(STORE_NAME, mode, fn);

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lease_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const saveLeaseFile = async (file) => {
  if (!file) throw new Error("No file provided");

  const record = {
    id: generateId(),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    blob: file,
    createdAt: Date.now(),
  };

  await withLeaseStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  return {
    id: record.id,
    name: record.name,
    type: record.type,
    size: record.size,
    lastModified: record.lastModified,
  };
};

export const getLeaseFile = async (id) => {
  if (!id) return null;

  return withLeaseStore("readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
};

export const deleteLeaseFile = async (id) => {
  if (!id) return;

  await withLeaseStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
};

// ============================================================
// Document PDF Cache - for citation navigation
// ============================================================

/**
 * Cache a PDF blob for a specific document ID
 * @param {string} documentId - The document ID from the backend
 * @param {Blob} blob - The PDF blob to cache
 * @param {string} [fileName] - Optional filename for the PDF
 */
export const cacheDocumentPdf = async (documentId, blob, fileName = "document.pdf") => {
  if (!documentId || !blob) {
    throw new Error("Document ID and blob are required");
  }

  const record = {
    documentId,
    blob,
    fileName,
    type: blob.type || "application/pdf",
    size: blob.size,
    cachedAt: Date.now(),
  };

  await withStore(DOC_STORE_NAME, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  return record;
};

/**
 * Get a cached PDF for a document ID
 * @param {string} documentId - The document ID
 * @returns {Promise<{documentId: string, blob: Blob, fileName: string} | null>}
 */
export const getCachedDocumentPdf = async (documentId) => {
  if (!documentId) return null;

  return withStore(DOC_STORE_NAME, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(documentId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
};

/**
 * Check if a PDF is cached for a document ID
 * @param {string} documentId - The document ID
 * @returns {Promise<boolean>}
 */
export const isDocumentPdfCached = async (documentId) => {
  const cached = await getCachedDocumentPdf(documentId);
  return cached !== null;
};

/**
 * Delete a cached PDF for a document ID
 * @param {string} documentId - The document ID
 */
export const deleteCachedDocumentPdf = async (documentId) => {
  if (!documentId) return;

  await withStore(DOC_STORE_NAME, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(documentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
};

/**
 * Create a blob URL for a cached document PDF
 * @param {string} documentId - The document ID
 * @returns {Promise<string | null>} - The blob URL or null if not cached
 */
export const getDocumentPdfBlobUrl = async (documentId) => {
  const cached = await getCachedDocumentPdf(documentId);
  if (!cached || !cached.blob) return null;
  return URL.createObjectURL(cached.blob);
};

/**
 * Fetch a PDF from URL and cache it
 * @param {string} documentId - The document ID
 * @param {string} url - The URL to fetch the PDF from
 * @param {string} [fileName] - Optional filename
 * @returns {Promise<Blob>} - The fetched blob
 */
export const fetchAndCacheDocumentPdf = async (documentId, url, fileName = "document.pdf") => {
  // Check if already cached
  const cached = await getCachedDocumentPdf(documentId);
  if (cached && cached.blob) {
    return cached.blob;
  }

  // Fetch from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  
  // Cache it
  await cacheDocumentPdf(documentId, blob, fileName);
  
  return blob;
};
