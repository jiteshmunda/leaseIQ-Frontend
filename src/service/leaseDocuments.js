import api from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const deleteLeaseDocument = async (leaseId, documentId) => {
  if (!leaseId) throw new Error("Missing leaseId");
  if (!documentId) throw new Error("Missing documentId");

  return api.delete(`${BASE_URL}/api/leases/${leaseId}/document/${documentId}`);
};
