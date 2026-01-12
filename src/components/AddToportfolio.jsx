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
      if (arr.length < 2) {
        console.error("Invalid base64 format: missing comma separator");
        return null;
      }
      
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch || !mimeMatch[1]) {
        console.error("Invalid base64 format: missing MIME type");
        return null;
      }
      
      const mime = mimeMatch[1];
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
  }, [show, token, getStoredLeaseData]);

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

  /* ---------------- PROPERTY ---------------- */
  if (useExistingProperty) {
    if (!form.property_id) {
      e.property_id = "Select property";
    }
  } else {
    const propertyName = String(form.property_name || "").trim();

    if (!propertyName) {
      e.property_name = "Property name required";
    } else if (propertyName.length > 30) {
      e.property_name = "Property name must not exceed 30 characters";
    } else if (!/^[A-Za-z]/.test(propertyName)) {
      e.property_name = "Property name must start with a letter";
    } else if (!/^[A-Za-z0-9 ]+$/.test(propertyName)) {
      e.property_name =
        "Property name can contain only letters, numbers, and spaces";
    }

    const address = String(form.address || "").trim();
    if (!address) {
      e.address = "Address is required";
    } else if (address.length > 60) {
      e.address = "Address must not exceed 60 characters";
    } else if (!/^[A-Za-z0-9 ,.-]+$/.test(address)) {
      e.address =
        "Address can contain only letters, numbers, commas, dots and hyphens";
    }
  }

  /* ---------------- TENANT ---------------- */
  if (useExistingTenant) {
    if (!tenantId) {
      e.tenant_id = "Select tenant";
    }
  } else {
    const tenantName = String(form.tenant_name || "").trim();

    if (!tenantName) {
      e.tenant_name = "Tenant name required";
    } else if (tenantName.length > 30) {
      e.tenant_name = "Tenant name must not exceed 30 characters";
    } else if (!/^[A-Za-z]/.test(tenantName)) {
      e.tenant_name = "Tenant name must start with a letter";
    } else if (!/^[A-Za-z ]+$/.test(tenantName)) {
      e.tenant_name = "Tenant name can contain only letters and spaces";
    }
  }

  /* ---------------- UNIT NUMBER ---------------- */
  const unitNumber = String(form.unit_number || "").trim();

  if (!unitNumber) {
    e.unit_number = "Unit number required";
  } else if (unitNumber.length > 15) {
    e.unit_number = "Unit number must not exceed 15 characters";
  } else if (!/^[A-Za-z0-9]/.test(unitNumber)) {
    e.unit_number = "Unit number must start with a letter or number";
  } else if (!/^[A-Za-z0-9-]+$/.test(unitNumber)) {
    e.unit_number =
      "Unit number can contain only letters, numbers, and hyphens";
  }

  /* ---------------- SQUARE FEET (OPTIONAL) ---------------- */
  const sqft = String(form.square_ft ?? "").trim();
  if (sqft) {
    if (!/^\d+$/.test(sqft)) {
      e.square_ft = "Square feet must contain only numbers";
    } else if (sqft.length > 7) {
      e.square_ft = "Square feet value is too large";
    } else if (Number(sqft) <= 0) {
      e.square_ft = "Square feet must be greater than 0";
    }
  }

  /* ---------------- MONTHLY RENT (OPTIONAL) ---------------- */
  const rent = String(form.monthly_rent ?? "").trim();
  if (rent) {
    if (!/^\d+$/.test(rent)) {
      e.monthly_rent = "Monthly rent must contain only numbers";
    } else if (rent.length > 9) {
      e.monthly_rent = "Monthly rent value is too large";
    } else if (Number(rent) <= 0) {
      e.monthly_rent = "Monthly rent must be greater than 0";
    }
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
              <h6>
                Property
                <span className="required-star">*</span>
              </h6>

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
                  isInvalid={submitAttempted && !!errors.property_id}
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
                    value={form.property_name}
                    placeholder="Property name"
                    onChange={handleChange}
                    isInvalid={submitAttempted && !!errors.property_name}
                    disabled={loading}
                  />
                  {submitAttempted && errors.property_name && (
                    <Form.Text className="text-danger">{errors.property_name}</Form.Text>
                  )}

                  <Form.Control
                    name="address"
                    value={form.address}
                    placeholder="Address"
                    onChange={handleChange}
                    isInvalid={submitAttempted && !!errors.address}
                    disabled={loading}
                  />
                  {submitAttempted && errors.address && (
                    <Form.Text className="text-danger">{errors.address}</Form.Text>
                  )}
                </>
              )}
            </Col>

            {/* TENANT COLUMN */}
            <Col md={6}>
              <h6>
                Tenant
                <span className="required-star">*</span>
              </h6>

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
            <h6>
              Unit
              <span className="required-star">*</span>
            </h6>
              <Form.Control 
                name="unit_number"
                value={form.unit_number}
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
                value={form.square_ft}
                placeholder="Square Feet"
                onChange={handleChange}
                onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} 
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
                value={form.monthly_rent}
                placeholder="Monthly Rent"
                onChange={handleChange}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                }}
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