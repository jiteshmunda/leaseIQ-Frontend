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
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";
import { showError, showSuccess } from "../service/toast";
import DragDropUpload from "./DragDropUpload";


const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddUnit = ({ show, onClose, onSuccess, tenantName = " ", tenantId }) => {
  const token = sessionStorage.getItem("token");
  const { runLeaseAnalysis } = useLeaseAnalyzer();

  const [properties, setProperties] = useState([]);
  const [useExistingProperty, setUseExistingProperty] = useState(true);
  const [document, setDocument] = useState(null);

  const [form, setForm] = useState({
    property_id: "",
    property_name: "",
    address: "",
    tenant_name: tenantName || "",
    unit_number: "",
    square_ft: "",
    monthly_rent: "",
  });

  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  const buildInitialForm = useCallback(
    () => ({
      property_id: "",
      property_name: "",
      address: "",
      tenant_name: tenantName || "",
      unit_number: "",
      square_ft: "",
      monthly_rent: "",
    }),
    [tenantName]
  );

  const resetState = useCallback(() => {
    setUseExistingProperty(true);
    setDocument(null);
    setErrors({});
    setSubmitAttempted(false);
    setForm(buildInitialForm());
  }, [buildInitialForm]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch properties", err);
    }
  }, [token]);

  useEffect(() => {
    if (show) fetchProperties();
  }, [show, fetchProperties]);

  useEffect(() => {
    if (!show) resetState();
  }, [show, resetState]);

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (useExistingProperty) {
      if (!String(form.property_id || "").trim()) {
        nextErrors.property_id = "Please select a property.";
      }
    } else {
      const propertyName = String(form.property_name || "").trim();
      if (!propertyName) {
        nextErrors.property_name = "Property name is required.";
      } else if (propertyName.length > 30) {
        nextErrors.property_name = "Property name must not exceed 30 characters.";
      } else if (!/^[A-Za-z]/.test(propertyName)) {
        nextErrors.property_name = "Property name must start with a letter.";
      } else if (!/^[A-Za-z0-9 ]+$/.test(propertyName)) {
        nextErrors.property_name = "Property name can contain only letters, numbers, and spaces.";
      } else {
        const isDuplicate = properties.some(
          (p) => p.property_name?.trim().toLowerCase() === propertyName.toLowerCase()
        );
        if (isDuplicate) {
          nextErrors.property_name = "This property name already exists.";
        }
      }

      const address = String(form.address || "").trim();
      if (!address) {
        nextErrors.address = "Address is required.";
      } else if (address.length > 80) {
        nextErrors.address = "Address must not exceed 80 characters.";
      } else if (!/^[A-Za-z0-9 ,.()/-]+$/.test(address)) {
        nextErrors.address = "Address can contain only letters, numbers, spaces, commas, dots, hyphens, /, and parentheses.";
      }
    }

    if (!tenantId) {
      const tName = String(form.tenant_name || "").trim();
      if (!tName) {
        nextErrors.tenant_name = "Tenant name is required.";
      } else if (tName.length > 30) {
        nextErrors.tenant_name = "Tenant name must not exceed 30 characters.";
      } else if (!/^[A-Za-z]/.test(tName)) {
        nextErrors.tenant_name = "Tenant name must start with a letter.";
      } else if (!/^[A-Za-z ]+$/.test(tName)) {
        nextErrors.tenant_name = "Tenant name can contain only letters and spaces.";
      }
    }

    const unitNumber = String(form.unit_number || "").trim();
    if (!unitNumber) {
      nextErrors.unit_number = "Unit number is required.";
    } else if (unitNumber.length > 15) {
      nextErrors.unit_number = "Unit number must not exceed 15 characters.";
    } else if (!/^[A-Za-z0-9]/.test(unitNumber)) {
      nextErrors.unit_number = "Unit number must start with a letter or number.";
    } else if (!/^[A-Za-z0-9-]+$/.test(unitNumber)) {
      nextErrors.unit_number = "Unit number can contain only letters, numbers, and hyphens.";
    }

    const squareFeetRaw = String(form.square_ft ?? "").trim();
    if (squareFeetRaw) {
      if (!/^\d+$/.test(squareFeetRaw)) {
        nextErrors.square_ft = "Square feet must contain only numbers.";
      } else if (squareFeetRaw.length > 7) {
        nextErrors.square_ft = "Square feet value is too large.";
      } else if (Number(squareFeetRaw) <= 0) {
        nextErrors.square_ft = "Square feet must be greater than 0.";
      }
    }

    const monthlyRentRaw = String(form.monthly_rent ?? "").trim();
    if (monthlyRentRaw) {
      if (!/^\d+$/.test(monthlyRentRaw)) {
        nextErrors.monthly_rent = "Monthly rent must contain only numbers.";
      } else if (monthlyRentRaw.length > 9) {
        nextErrors.monthly_rent = "Monthly rent value is too large.";
      } else if (Number(monthlyRentRaw) <= 0) {
        nextErrors.monthly_rent = "Monthly rent must be greater than 0.";
      }
    }

    if (!document) {
      nextErrors.document = "Please upload the lease document (PDF).";
    } else {
      const name = String(document.name || "");
      const isPdf = document.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        nextErrors.document = "Only PDF files are allowed.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showError("Please fix the highlighted fields.");
      return;
    }

    try {
      setLoading(true);
      const analysisForm = new FormData();
      analysisForm.append("assets", document);

      const leaseDetails = await runLeaseAnalysis({
        formData: analysisForm,
      });

      const payload = new FormData();
      payload.append("unit_number", form.unit_number);

      const squareFeetRaw = String(form.square_ft ?? "").trim();
      if (squareFeetRaw) payload.append("square_ft", squareFeetRaw);

      const monthlyRentRaw = String(form.monthly_rent ?? "").trim();
      if (monthlyRentRaw) payload.append("monthly_rent", monthlyRentRaw);

      if (tenantId) {
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
      payload.append("lease_details", JSON.stringify(leaseDetails));
      payload.append("assets", document);

      await api.post(`${BASE_URL}/api/units/with-lease`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      showSuccess("Unit created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      showError(err?.message || err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
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
          <p className="loading-text">Analyzing Lease Document</p>
          <p className="loading-subtext">This will only take a moment...</p>
        </div>
      )}

      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <PlusCircle className="text-primary" size={24} />
            <span>Create </span>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <div className="form-section-title">
            <Building2 size={16} />
            <span>Property & Tenant Information</span>
          </div>

          <Row className="mb-4">
            <Col>
              <Form.Check
                type="switch"
                id="property-toggle"
                label="Use Existing Property"
                checked={useExistingProperty}
                className="custom-toggle"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseExistingProperty(checked);
                  setSubmitAttempted(false);
                  setErrors({});
                  setForm((prev) =>
                    checked
                      ? { ...prev, property_name: "", address: "" }
                      : { ...prev, property_id: "" }
                  );
                }}
                disabled={loading}
              />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              {useExistingProperty ? (
                <Form.Group className="mb-4">
                  <Form.Label className="form-icon-label">
                    <Building2 size={18} className="text-muted" />
                    Select Property <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="input-with-icon">
                    <Building2 size={18} className="field-icon" />
                    <Form.Select
                      name="property_id"
                      onChange={handleChange}
                      value={form.property_id}
                      isInvalid={submitAttempted && !!errors.property_id}
                      disabled={loading}
                    >
                      <option value="">Select a property</option>
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
                  <Form.Group className="mb-4">
                    <Form.Label className="form-icon-label">
                      Property Name <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-with-icon">
                      <Building2 size={18} className="field-icon" />
                      <Form.Control
                        name="property_name"
                        placeholder="Company Tower A"
                        onChange={handleChange}
                        value={form.property_name}
                        isInvalid={submitAttempted && !!errors.property_name}
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.property_name}
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-icon-label">
                      Address <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-with-icon">
                      <MapPin size={18} className="field-icon" />
                      <Form.Control
                        name="address"
                        placeholder="123 Business St, City"
                        onChange={handleChange}
                        value={form.address}
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
              <Form.Group className="mb-4">
                <Form.Label className="form-icon-label">
                  Tenant Name <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <User size={18} className="field-icon" />
                  <Form.Control
                    type="text"
                    name="tenant_name"
                    placeholder="Enter tenant name"
                    value={form.tenant_name}
                    onChange={handleChange}
                    isInvalid={submitAttempted && !!errors.tenant_name}
                    disabled={Boolean(tenantId) || loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.tenant_name}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="form-section-title mt-2">
            <Hash size={16} />
            <span>Unit Specifications</span>
          </div>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-4">
                <Form.Label className="form-icon-label">
                  Unit Number <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <Hash size={18} className="field-icon" />
                  <Form.Control
                    name="unit_number"
                    placeholder="402-B"
                    onChange={handleChange}
                    value={form.unit_number}
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
              <Form.Group className="mb-4">
                <Form.Label className="form-icon-label">Square Feet</Form.Label>
                <div className="input-with-icon">
                  <Maximize2 size={18} className="field-icon" />
                  <Form.Control
                    type="number"
                    name="square_ft"
                    placeholder="1200"
                    onChange={handleChange}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    }}
                    value={form.square_ft}
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
              <Form.Group className="mb-4">
                <Form.Label className="form-icon-label">Monthly Rent</Form.Label>
                <div className="input-with-icon">
                  <CircleDollarSign size={18} className="field-icon" />
                  <Form.Control
                    type="number"
                    name="monthly_rent"
                    placeholder="2500"
                    onChange={handleChange}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    }}
                    value={form.monthly_rent}
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
            <DragDropUpload
              onFileSelect={(file) => {
                setDocument(file);
                setErrors((prev) => {
                  if (!prev.document) return prev;
                  const next = { ...prev };
                  delete next.document;
                  return next;
                });
              }}
              currentFile={document}
              label="Click to upload or lease PDF"
              subLabel="Only PDF files are supported"
              accept=".pdf,application/pdf"
              className={submitAttempted && errors.document ? "border-danger" : ""}
              disabled={loading}
            />
            {submitAttempted && errors.document && (
              <div className="text-danger small mt-2 d-flex align-items-center gap-1">
                <AlertCircle size={14} />
                {errors.document}
              </div>
            )}
          </Form.Group>
          <div className="d-flex align-items-center gap-1 text-muted small px-1">
            <CheckCircle2 size={12} />
            <span>Document type: <b>Main Lease</b></span>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <button
          className="btn-premium-secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn-premium-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="spinner-border-sm animate-spin" size={18} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              <span>Add</span>
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddUnit;
