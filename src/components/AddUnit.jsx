import React, { useEffect, useState } from "react";
import { Form, Button, Modal, Row, Col } from "react-bootstrap";
import axios from "axios";
import "../styles/addUnit.css";
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";


const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddUnit = ({ show, onClose }) => {
  const token = sessionStorage.getItem("token");
  const { runLeaseAnalysis } = useLeaseAnalyzer();

  const [properties, setProperties] = useState([]);
  const [useExistingProperty, setUseExistingProperty] = useState(true);
  const [document, setDocument] = useState(null);

  const [form, setForm] = useState({
    property_id: "",
    property_name: "",
    address: "",
    tenant_name: "",
    unit_number: "",
    square_ft: "",
    monthly_rent: "",
  });

  const [loading, setLoading] = useState(false);

  /* ---------- FETCH PROPERTIES ---------- */
  useEffect(() => {
    if (show) fetchProperties();
  }, [show]);

  const fetchProperties = async () => {
    const res = await axios.get(`${BASE_URL}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProperties(res.data.data || []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    if (!document) {
      alert("Please upload the lease document");
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
      payload.append("square_ft", form.square_ft);
      payload.append("monthly_rent", form.monthly_rent);
      payload.append("tenant_name", form.tenant_name);

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

      await axios.post(
        `${BASE_URL}/api/units/with-lease`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Unit, tenant, and lease created successfully");
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
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
                onChange={(e) => setUseExistingProperty(e.target.checked)}
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
                  >
                    <option value="">Select</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.property_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Property Name</Form.Label>
                    <Form.Control
                      name="property_name"
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      name="address"
                      onChange={handleChange}
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
                  name="tenant_name"
                  placeholder="Enter tenant name"
                  onChange={handleChange}
                />
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
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Square Feet</Form.Label>
                <Form.Control
                  name="square_ft"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Monthly Rent</Form.Label>
                <Form.Control
                  name="monthly_rent"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <hr />

          {/* DOCUMENT UPLOAD */}
          <Form.Group className="mb-3">
            <Form.Label>Upload Main Lease (PDF)</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={(e) => setDocument(e.target.files[0])}
            />
            <small className="text-muted">
              Document type will be saved as <b>Main Lease</b>
            </small>
          </Form.Group>

        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Add Unit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddUnit;
