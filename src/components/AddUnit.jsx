import React, { useCallback, useEffect, useState } from "react";
import { Form, Button, Modal, Row, Col } from "react-bootstrap";
import api from "../service/api";
import "../styles/addUnit.css";
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";
import { showError, showSuccess } from "../service/toast";


const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddUnit = ({ show, onClose,onSuccess, tenantName=" ", tenantId }) => {
  const token = sessionStorage.getItem("token");
  const { runLeaseAnalysis } = useLeaseAnalyzer();
  
  const [properties, setProperties] = useState([]);
  const [useExistingProperty, setUseExistingProperty] = useState(true);
  const [document, setDocument] = useState(null);

  const [form, setForm] = useState({
    property_id: "",
    property_name: "",
    address: "",
    tenant_name:  tenantName || "",
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
    const res = await api.get(`${BASE_URL}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProperties(res.data.data || []);
  }, [token]);

  useEffect(() => {
    if (show) fetchProperties();
  }, [show, fetchProperties]);

  useEffect(() => {
    // When the modal closes, clear local state so next open is fresh.
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
      if (!String(form.property_name || "").trim()) {
        nextErrors.property_name = "Property name is required.";
      }
      // Address is optional per current UI label.
    }

    if (!tenantId) {
      if (!String(form.tenant_name || "").trim()) {
        nextErrors.tenant_name = "Tenant name is required.";
      }
    }

    if (!String(form.unit_number || "").trim()) {
      nextErrors.unit_number = "Unit number is required.";
    }

    // Optional: only validate when user provides a value.
    const squareFeetRaw = String(form.square_ft ?? "").trim();
    if (squareFeetRaw) {
      const squareFeet = Number(squareFeetRaw);
      if (!Number.isFinite(squareFeet) || squareFeet <= 0) {
        nextErrors.square_ft = "Square feet must be greater than 0.";
      }
    }

    const monthlyRentRaw = String(form.monthly_rent ?? "").trim();
    if (monthlyRentRaw) {
      const monthlyRent = Number(monthlyRentRaw);
      if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
        nextErrors.monthly_rent = "Monthly rent must be greater than 0.";
      }
    }

    if (!document) {
      nextErrors.document = "Please upload the lease document (PDF).";
    } else {
      const name = String(document.name || "");
      const isPdf =
        document.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        nextErrors.document = "Only PDF files are allowed.";
      }
    }

    return nextErrors;
  };

  /* ---------- SUBMIT ---------- */
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
    console.log("BEFORE ANALYSIS");
    const leaseDetails = await runLeaseAnalysis({
      formData: analysisForm,
    });
      const payload = new FormData();

      // unit details
      payload.append("unit_number", form.unit_number);

      const squareFeetRaw = String(form.square_ft ?? "").trim();
      if (squareFeetRaw) {
        payload.append("square_ft", squareFeetRaw);
      }

      const monthlyRentRaw = String(form.monthly_rent ?? "").trim();
      if (monthlyRentRaw) {
        payload.append("monthly_rent", monthlyRentRaw);
      }
      if (tenantId) {
        payload.append("tenant_id", tenantId); // ✅ EXISTING TENANT
      } else {
        payload.append("tenant_name", form.tenant_name); // ✅ NEW TENANT
      }
      // property
      if (useExistingProperty) {
        payload.append("property_id", form.property_id);
      } else {
        payload.append("property_name", form.property_name);
        payload.append("address", form.address);
      }

      // document
      payload.append("document_type", "main lease"); 
      payload.append("lease_details", JSON.stringify(leaseDetails));
      payload.append("assets", document);    

      await api.post(
        `${BASE_URL}/api/units/with-lease`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSuccess("created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Unit</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>

          {/* PROPERTY TOGGLE */}
          <Row className="mb-3">
            <Col>
              <Form.Check
                type="checkbox"
                label="Use Existing Property"
                checked={useExistingProperty}
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
            {/* PROPERTY */}
            <Col md={6}>
              <h6>Property</h6>

              {useExistingProperty ? (
                <Form.Group className="mb-3">
                  <Form.Label>Select Property</Form.Label>
                  <Form.Select
                    name="property_id"
                    onChange={handleChange}
                    value={form.property_id}
                    isInvalid={submitAttempted && !!errors.property_id}
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.property_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.property_id}
                  </Form.Control.Feedback>
                </Form.Group>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Property Name</Form.Label>
                    <Form.Control
                      name="property_name"
                      onChange={handleChange}
                      value={form.property_name}
                      isInvalid={submitAttempted && !!errors.property_name}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.property_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      name="address"
                      onChange={handleChange}
                      value={form.address}
                      disabled={loading}
                    />
                  </Form.Group>
                </>
              )}
            </Col>

            {/* TENANT */}
            <Col md={6}>
              <h6>Tenant</h6>
              <Form.Group className="mb-3">
                <Form.Label>Tenant Name</Form.Label>
                <Form.Control
                  type="text"
                  name="tenant_name"
                  placeholder="Enter tenant name"
                  value={form.tenant_name}
                 //disabled={Boolean(tenantId)}   // 🔒 IMPORTANT
                  onChange={handleChange}
                  isInvalid={submitAttempted && !!errors.tenant_name}
                  disabled={Boolean(tenantId) || loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.tenant_name}
                </Form.Control.Feedback>

              </Form.Group>
            </Col>
          </Row>

          <hr />

          {/* UNIT DETAILS */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unit Number</Form.Label>
                <Form.Control
                  name="unit_number"
                  onChange={handleChange}
                  value={form.unit_number}
                  isInvalid={submitAttempted && !!errors.unit_number}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.unit_number}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Square Feet</Form.Label>
                <Form.Control
                  type="number"
                  name="square_ft"
                  onChange={handleChange}
                  value={form.square_ft}
                  isInvalid={submitAttempted && !!errors.square_ft}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.square_ft}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Monthly Rent</Form.Label>
                <Form.Control
                  type="number"
                  name="monthly_rent"
                  onChange={handleChange}
                  value={form.monthly_rent}
                  isInvalid={submitAttempted && !!errors.monthly_rent}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.monthly_rent}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <hr />

          {/* DOCUMENT UPLOAD */}
          <Form.Group className="mb-3">
            <Form.Label>Upload Main Lease (PDF)</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const nextFile = e.target.files?.[0] ?? null;
                setDocument(nextFile);
                setErrors((prev) => {
                  if (!prev.document) return prev;
                  const next = { ...prev };
                  delete next.document;
                  return next;
                });
              }}
              isInvalid={submitAttempted && !!errors.document}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.document}
            </Form.Control.Feedback>
            <small className="text-muted">
              Document type will be saved as <b>Main Lease</b>
            </small>
          </Form.Group>

        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" variant="outline-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Add Unit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddUnit;
