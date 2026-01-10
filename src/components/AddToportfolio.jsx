import React, { useCallback, useEffect, useState } from "react";
import { Form, Button, Modal, Row, Col } from "react-bootstrap";
import api from "../service/api";
import "../styles/addUnit.css";
import { showError, showSuccess } from "../service/toast";
import { deleteLeaseFile, getLeaseFile } from "../service/leaseFileStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AddToportfolio({ show, onClose, onSuccess }) {
  const token = sessionStorage.getItem("token");
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [useExistingProperty, setUseExistingProperty] = useState(true);
  const [useExistingTenant, setUseExistingTenant] = useState(false);

  const [tenantId, setTenantId] = useState("");
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStoredLeaseData = useCallback(() => {
    return JSON.parse(sessionStorage.getItem("quickLeaseAnalysis") || "{}");
  }, []);
  
  // Parse the stored lease analysis data
  const storedLeaseData = getStoredLeaseData();
  const leaseDetail = storedLeaseData.leaseDetails || {};
  
  const [form, setForm] = useState({
    property_id: "",
    property_name: "",
    address: "",
    tenant_name: "",
    unit_number: "",
    square_ft: "",
    monthly_rent: "",
  });

  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Helper function to convert base64 back to File object
  const base64ToFile = (base64Data, filename) => {
    if (!base64Data) return null;
    
    try {
      // Extract content type and base64 data
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error("Error converting base64 to file:", error);
      return null;
    }
  };

  const resetState = useCallback(() => {
    setUseExistingProperty(true);
    setUseExistingTenant(false);
    setTenantId("");
    setDocument(null);
    setErrors({});
    setSubmitAttempted(false);
    setForm({
      property_id: "",
      property_name: "",
      address: "",
      tenant_name: "",
      unit_number: "",
      square_ft: "",
      monthly_rent: "",
    });
  }, []);

  useEffect(() => {
    if (!show) return;

    const loadStoredDocument = async () => {
      if (document) return;

      const uploaded = getStoredLeaseData().uploadedFile;

      // Preferred path: IndexedDB
      if (uploaded?.id) {
        try {
          const record = await getLeaseFile(uploaded.id);
          if (record?.blob) {
            const file = new File([record.blob], record.name || uploaded.name || "lease", {
              type: record.type || uploaded.type,
              lastModified: record.lastModified || uploaded.lastModified || Date.now(),
            });
            setDocument(file);
            return;
          }
        } catch (e) {
          console.error("Failed to load lease file from IndexedDB", e);
        }

        showError("Stored lease file not found. Please re-analyze the lease.");
        return;
      }

      // Backward-compatible fallback: base64 stored in sessionStorage
      if (uploaded?.base64) {
        const file = base64ToFile(uploaded.base64, uploaded.name);
        if (file) {
          setDocument(file);
        } else {
          showError("Failed to load stored lease file");
        }
      }
    };

    loadStoredDocument();

    // Fetch properties and tenants
    api.get(`${BASE_URL}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setProperties(res.data.data || []));

    api.get(`${BASE_URL}/api/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setTenants(res.data.data || []));
  }, [show, token, document, getStoredLeaseData]);

  useEffect(() => {
    if (!show) resetState();
  }, [show, resetState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const e = {};

    if (useExistingProperty) {
      if (!form.property_id) e.property_id = "Select property";
    } else {
      if (!form.property_name) e.property_name = "Property name required";
    }

    if (useExistingTenant) {
      if (!tenantId) e.tenant_id = "Select tenant";
    } else {
      if (!form.tenant_name) e.tenant_name = "Tenant name required";
    }

    if (!form.unit_number) e.unit_number = "Unit number required";
    if (form.square_ft !== "" && form.square_ft !== null && form.square_ft !== undefined) {
      if (Number(form.square_ft) <= 0) e.square_ft = "Sqft must be greater than 0";
    }

    if (form.monthly_rent !== "" && form.monthly_rent !== null && form.monthly_rent !== undefined) {
      if (Number(form.monthly_rent) <= 0) e.monthly_rent = "Rent must be greater than 0";
    }

    if (!document) e.document = "Upload lease PDF";

    return e;
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      showError("Fix highlighted fields");
      return;
    }

    try {
      setLoading(true);

      // Use the stored document
      if (!document) {
        showError("Lease document is required");
        setLoading(false);
        return;
      }

      const payload = new FormData();

      payload.append("unit_number", form.unit_number);

      if (form.square_ft !== "" && form.square_ft !== null && form.square_ft !== undefined) {
        payload.append("square_ft", form.square_ft);
      }

      if (form.monthly_rent !== "" && form.monthly_rent !== null && form.monthly_rent !== undefined) {
        payload.append("monthly_rent", form.monthly_rent);
      }

      if (useExistingTenant) {
        payload.append("tenant_id", tenantId);
      } else {
        payload.append("tenant_name", form.tenant_name);
      }

      if (useExistingProperty) {
        payload.append("property_id", form.property_id);
      } else {
        payload.append("property_name", form.property_name);
        payload.append("address", form.address);
      }

      payload.append("document_type", "main lease");
      payload.append("lease_details", JSON.stringify(leaseDetail));
      payload.append("assets", document);

      await api.post(`${BASE_URL}/api/units/with-lease`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Cleanup: remove stored file from IndexedDB after successful upload
      try {
        const stored = getStoredLeaseData();
        const fileId = stored?.uploadedFile?.id;
        if (fileId) {
          await deleteLeaseFile(fileId);

          // Remove the reference so we don't try to load a deleted file later
          const next = { ...stored };
          if (next.uploadedFile) {
            delete next.uploadedFile.id;
          }
          sessionStorage.setItem("quickLeaseAnalysis", JSON.stringify(next));
        }
      } catch (e) {
        console.warn("Failed to cleanup stored lease file", e);
      }

      showSuccess("Portfolio added successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload separately (optional manual upload)
//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setDocument(file);
//     }
//   };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add To Portfolio</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-3">
            {/* PROPERTY COLUMN */}
            <Col md={6}>
              <h6>Property</h6>

              <Form.Check
                className="mb-2"
                label="Use Existing Property"
                checked={useExistingProperty}
                onChange={(e) => setUseExistingProperty(e.target.checked)}
              />

              {useExistingProperty ? (
                <Form.Select
                  name="property_id"
                  value={form.property_id}
                  onChange={handleChange}
                  isInvalid={submitAttempted && errors.property_id}
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.property_name}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <>
                  <Form.Control
                    className="mb-2"
                    name="property_name"
                    placeholder="Property name"
                    onChange={handleChange}
                    isInvalid={submitAttempted && errors.property_name}
                    disabled={loading}
                  />
                  <Form.Control
                    name="address"
                    placeholder="Address"
                    onChange={handleChange}
                    isInvalid={submitAttempted && errors.address}
                    disabled={loading}
                  />
                </>
              )}
              {submitAttempted && errors.property_id && (
                <Form.Text className="text-danger">{errors.property_id}</Form.Text>
              )}
            </Col>

            {/* TENANT COLUMN */}
            <Col md={6}>
              <h6>Tenant</h6>

              <Form.Check
                className="mb-2"
                label="Use Existing Tenant"
                checked={useExistingTenant}
                onChange={(e) => {
                  setUseExistingTenant(e.target.checked);
                  setTenantId("");
                  setForm((prev) => ({ ...prev, tenant_name: "" }));
                }}
              />

              {useExistingTenant ? (
                <Form.Select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  isInvalid={submitAttempted && errors.tenant_id}
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tenant_name}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  name="tenant_name"
                  placeholder="Tenant name"
                  onChange={handleChange}
                  value={form.tenant_name}
                  isInvalid={submitAttempted && errors.tenant_name}
                  disabled={loading}
                />
              )}
              {submitAttempted && errors.tenant_id && (
                <Form.Text className="text-danger">{errors.tenant_id}</Form.Text>
              )}
              {submitAttempted && errors.tenant_name && (
                <Form.Text className="text-danger">{errors.tenant_name}</Form.Text>
              )}
            </Col>
          </Row>

          {/* UNIT DETAILS */}
          <Row className="mb-3">
            <Col>
            <h6>Unit</h6>
              <Form.Control 
                name="unit_number" 
                placeholder="Unit No" 
                onChange={handleChange}
                isInvalid={submitAttempted && errors.unit_number}
                disabled={loading}
              />
              {submitAttempted && errors.unit_number && (
                <Form.Text className="text-danger">{errors.unit_number}</Form.Text>
              )}
            </Col>
            <Col>
            <h6>Square Feet</h6>
              <Form.Control 
                type="number" 
                name="square_ft" 
                placeholder="Square Feet" 
                onChange={handleChange}
                isInvalid={submitAttempted && errors.square_ft}
                disabled={loading}
              />
              {submitAttempted && errors.square_ft && (
                <Form.Text className="text-danger">{errors.square_ft}</Form.Text>
              )}
            </Col>
            <Col>
            <h6>Monthly Rent</h6>
              <Form.Control 
                type="number" 
                name="monthly_rent" 
                placeholder="Monthly Rent" 
                onChange={handleChange}
                isInvalid={submitAttempted && errors.monthly_rent}
                disabled={loading}
              />
              {submitAttempted && errors.monthly_rent && (
                <Form.Text className="text-danger">{errors.monthly_rent}</Form.Text>
              )}
            </Col>
          </Row>

          {/* DOCUMENT UPLOAD (Already pre-filled, but allows override) */}
          <Row className="mb-3">
            <Col>
              <h6>Lease Document</h6>
              
              {document && (
                <Form.Text className="text-muted">
                  Using file: {document.name}
                </Form.Text>
              )}
              {submitAttempted && errors.document && (
                <Form.Text className="text-danger">{errors.document}</Form.Text>
              )}
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Portfolio"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddToportfolio;