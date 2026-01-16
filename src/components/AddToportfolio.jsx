import React, { useCallback, useEffect, useState } from "react";
import { Form, Modal, Row, Col } from "react-bootstrap";
import {
  Building2,
  MapPin,
  User,
  Hash,
  Maximize2,
  CircleDollarSign,
  FileUp,
  X,
  CheckCircle2,
  Loader2,
  PlusCircle,
  AlertCircle
} from "lucide-react";
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

  const base64ToFile = (base64Data, filename) => {
    if (!base64Data) return null;
    try {
      const arr = base64Data.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch || !mimeMatch[1]) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
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

      if (uploaded?.base64) {
        const file = base64ToFile(uploaded.base64, uploaded.name);
        if (file) setDocument(file);
        else showError("Failed to load stored lease file");
      }
    };

    loadStoredDocument();

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
    if (useExistingProperty) {
      if (!form.property_id) e.property_id = "Select property";
    } else {
      const propertyName = String(form.property_name || "").trim();
      if (!propertyName) e.property_name = "Property name required";
      else if (propertyName.length > 30) e.property_name = "Max 30 chars";
      else if (!/^[A-Za-z]/.test(propertyName)) e.property_name = "Must start with letter";
      else if (!/^[A-Za-z0-9 ]+$/.test(propertyName)) e.property_name = "Letters, numbers, spaces only";

      const address = String(form.address || "").trim();
      if (!address) e.address = "Address is required";
      else if (address.length > 80) e.address = "Max 80 chars";
      else if (!/^[A-Za-z0-9 ,.()/-]+$/.test(address)) e.address = "Letters/numbers + , . - / ( ) only";
    }

    if (useExistingTenant) {
      if (!tenantId) e.tenant_id = "Select tenant";
    } else {
      const tenantName = String(form.tenant_name || "").trim();
      if (!tenantName) e.tenant_name = "Tenant name required";
      else if (tenantName.length > 30) e.tenant_name = "Max 30 chars";
      else if (!/^[A-Za-z]/.test(tenantName)) e.tenant_name = "Must start with letter";
      else if (!/^[A-Za-z ]+$/.test(tenantName)) e.tenant_name = "Letters and spaces only";
    }

    const unitNumber = String(form.unit_number || "").trim();
    if (!unitNumber) e.unit_number = "Unit number required";
    else if (unitNumber.length > 15) e.unit_number = "Max 15 chars";
    else if (!/^[A-Za-z0-9]/.test(unitNumber)) e.unit_number = "Must start with letter/number";
    else if (!/^[A-Za-z0-9-]+$/.test(unitNumber)) e.unit_number = "Letters, numbers, hyphens only";

    const sqft = String(form.square_ft ?? "").trim();
    if (sqft) {
      if (!/^\d+$/.test(sqft)) e.square_ft = "Numbers only";
      else if (sqft.length > 7) e.square_ft = "Value too large";
      else if (Number(sqft) <= 0) e.square_ft = "Must be > 0";
    }

    const rent = String(form.monthly_rent ?? "").trim();
    if (rent) {
      if (!/^\d+$/.test(rent)) e.monthly_rent = "Numbers only";
      else if (rent.length > 9) e.monthly_rent = "Value too large";
      else if (Number(rent) <= 0) e.monthly_rent = "Must be > 0";
    }

    if (!document) e.document = "Upload lease PDF";
    return e;
  };

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
      if (!document) {
        showError("Lease document is required");
        setLoading(false);
        return;
      }

      const payload = new FormData();
      payload.append("unit_number", form.unit_number);
      if (form.square_ft) payload.append("square_ft", form.square_ft);
      if (form.monthly_rent) payload.append("monthly_rent", form.monthly_rent);

      if (useExistingTenant) payload.append("tenant_id", tenantId);
      else payload.append("tenant_name", form.tenant_name);

      if (useExistingProperty) payload.append("property_id", form.property_id);
      else {
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

      try {
        const stored = getStoredLeaseData();
        const fileId = stored?.uploadedFile?.id;
        if (fileId) {
          await deleteLeaseFile(fileId);
          const next = { ...stored };
          if (next.uploadedFile) delete next.uploadedFile.id;
          sessionStorage.setItem("quickLeaseAnalysis", JSON.stringify(next));
        }
      } catch (e) {
        console.warn("Failed to cleanup stored lease file", e);
      }

      showSuccess("Added to portfolio successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      className="add-unit-modal"
      backdrop={loading ? "static" : true}
    >
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="spinner-ring"></div>
            <Loader2 className="spinner-icon" size={32} />
          </div>
          <p className="loading-text">Saving to Portfolio</p>
          <p className="loading-subtext">Updating your database...</p>
        </div>
      )}

      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <PlusCircle className="text-primary" size={24} />
            <span>Add To Portfolio</span>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <div className="form-section-title">
            <div className="d-flex align-items-center gap-1">
              <Building2 size={16} />
              <User size={16} />
            </div>
            <span>Property & Tenant Information</span>
          </div>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Check
                type="switch"
                id="property-toggle-portfolio"
                label="Use Existing Property"
                checked={useExistingProperty}
                className="custom-toggle mb-3"
                onChange={(e) => {
                  setUseExistingProperty(e.target.checked);
                  setSubmitAttempted(false);
                  setErrors(prev => ({ ...prev, property_id: null, property_name: null, address: null }));
                }}
                disabled={loading}
              />

              {useExistingProperty ? (
                <Form.Group>
                  <div className="input-with-icon">
                    <Building2 size={18} className="field-icon" />
                    <Form.Select
                      name="property_id"
                      value={form.property_id}
                      onChange={handleChange}
                      isInvalid={submitAttempted && !!errors.property_id}
                      disabled={loading}
                    >
                      <option value="">Select Property</option>
                      {properties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.property_name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.property_id}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <div className="input-with-icon">
                      <Building2 size={18} className="field-icon" />
                      <Form.Control
                        name="property_name"
                        value={form.property_name}
                        placeholder="Property Name"
                        onChange={handleChange}
                        isInvalid={submitAttempted && !!errors.property_name}
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.property_name}
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <div className="input-with-icon">
                      <MapPin size={18} className="field-icon" />
                      <Form.Control
                        name="address"
                        value={form.address}
                        placeholder="Address"
                        onChange={handleChange}
                        isInvalid={submitAttempted && !!errors.address}
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.address}
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>
                </>
              )}
            </Col>

            <Col md={6}>
              <Form.Check
                type="switch"
                id="tenant-toggle-portfolio"
                label="Use Existing Tenant"
                checked={useExistingTenant}
                className="custom-toggle mb-3"
                onChange={(e) => {
                  setUseExistingTenant(e.target.checked);
                  setTenantId("");
                  setForm((prev) => ({ ...prev, tenant_name: "" }));
                  setSubmitAttempted(false);
                  setErrors(prev => ({ ...prev, tenant_id: null, tenant_name: null }));
                }}
                disabled={loading}
              />

              {useExistingTenant ? (
                <Form.Group>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <Form.Select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      isInvalid={submitAttempted && !!errors.tenant_id}
                      disabled={loading}
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.tenant_name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.tenant_id}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              ) : (
                <Form.Group>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <Form.Control
                      name="tenant_name"
                      placeholder="Tenant Name"
                      onChange={handleChange}
                      value={form.tenant_name}
                      isInvalid={submitAttempted && !!errors.tenant_name}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.tenant_name}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              )}
            </Col>
          </Row>

          <div className="form-section-title mt-2">
            <Hash size={16} />
            <span>Unit Specifications</span>
          </div>

          <Row className="mb-4">
            <Col md={4}>

              <Form.Group>
                <Form.Label className="form-icon-label">
                  Unit Number <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <Hash size={18} className="field-icon" />
                  <Form.Control
                    name="unit_number"
                    value={form.unit_number}
                    placeholder="Unit No"
                    onChange={handleChange}
                    isInvalid={submitAttempted && !!errors.unit_number}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.unit_number}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>
            <Col md={4}>

              <Form.Group>
                <Form.Label className="form-icon-label">Square Feet</Form.Label>
                <div className="input-with-icon">
                  <Maximize2 size={18} className="field-icon" />
                  <Form.Control
                    type="number"
                    name="square_ft"
                    value={form.square_ft}
                    placeholder="Square Feet"
                    onChange={handleChange}
                    onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                    isInvalid={submitAttempted && !!errors.square_ft}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.square_ft}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-icon-label">Monthly Rent ($)</Form.Label>
                <div className="input-with-icon">
                  <CircleDollarSign size={18} className="field-icon" />
                  <Form.Control
                    type="number"
                    name="monthly_rent"
                    value={form.monthly_rent}
                    placeholder="Monthly Rent"
                    onChange={handleChange}
                    onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
                    isInvalid={submitAttempted && !!errors.monthly_rent}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.monthly_rent}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="form-section-title mt-2">
            <FileUp size={16} />
            <span>Lease Document</span>
          </div>

          <Form.Group className="mb-2">
            <div className={`file-upload-container ${document ? "has-file" : ""} ${submitAttempted && errors.document ? "border-danger" : ""}`}>
              {document ? (
                <div className="d-flex flex-column align-items-center">
                  <CheckCircle2 size={40} className="text-success mb-2" />
                  <p className="mb-0 fw-bold">{document.name}</p>
                  <small className="text-muted">Analyzed Document Linked</small>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center">
                  <AlertCircle size={40} className="text-danger mb-2" />
                  <p className="mb-0 fw-bold text-danger">No Lease Found</p>
                  <small className="text-muted">Analyze a lease first to add to portfolio</small>
                </div>
              )}
            </div>
            {submitAttempted && errors.document && (
              <div className="text-danger small mt-2 d-flex align-items-center gap-1">
                <AlertCircle size={14} />
                {errors.document}
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <button
          className="btn-premium-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn-premium-primary"
          onClick={handleSubmit}
          disabled={loading || !document}
        >
          {loading ? (
            <>
              <Loader2 className="spinner-border-sm animate-spin" size={18} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              <span>Add to Portfolio</span>
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddToportfolio;
