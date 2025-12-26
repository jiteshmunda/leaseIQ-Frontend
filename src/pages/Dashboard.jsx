import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge,Navbar,} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/dashboard.css";
import AddUnit from "../components/AddUnit";
import AddTenant from "../components/AddTenant";
import {Home, Plus,CalendarDays, Users, DollarSign, AlertCircle, Building } from "lucide-react";
import FloatingSignOut from "../components/FloatingSingout";

const leases = [
  {
    name: "ACME Corp",
    units: 3,
    sqft: "15,000",
    expiry: "2025-01-15",
    rent: "$45,000"
  },
  {
    name: "TechStart Inc",
    units: 2,
    sqft: "8,500",
    expiry: "2026-06-30",
    rent: "$28,000"
  },
  {
    name: "Retail Solutions LLC",
    units: 1,
    sqft: "5,000",
    expiry: "2025-12-31",
    rent: "$15,000"
  },
  {
    name: "Global Fitness",
    units: 1,
    sqft: "12,000",
    expiry: "2027-03-15",
    rent: "$36,000"
  },
  {
    name: "Downtown Cafe",
    units: 1,
    sqft: "2,500",
    expiry: "2025-03-20",
    rent: "$8,500"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);

  return (
    <>
    <Navbar bg="white" className="dashboard-navbar">
      <FloatingSignOut />
     <Container fluid>
      <Navbar.Brand className="d-flex align-items-center gap-2">
         <Home /> <span>Sage Portfolio</span>
      </Navbar.Brand>

      <Button
        variant="outline-primary"
        onClick={() => setShowAddUnit(true)}
      >
        <Plus size={16} /> Add Unit
      </Button>
       <AddUnit show={showAddUnit}
       onClose={() => setShowAddUnit(false)}/>
     </Container>
     </Navbar>
    <Container fluid className="p-4 dashboard-container">

      {/* TITLE + FILTER */}
      <Row className="align-items-center mb-4">
        <Col xs={12} md={6}>
          <h5 className="mb-3 mb-md-0">Upcoming Critical Items</h5>
        </Col>

        <Col
          xs={12}
          md={6}
          className="d-flex justify-content-start justify-content-md-end gap-2 flex-wrap"
        >
          <Button variant="outline-primary">30 Days</Button>
          <Button variant="outline-secondary">60 Days</Button>
          <Button variant="outline-secondary">90 Days</Button>
        </Col>
      </Row>

      {/* KPI CARDS */}
      <Row className="mb-4">
  {/* TOTAL TENANTS */}
  <Col md={4}>
    <Card className="kpi-card">
      <Card.Body>
        <div className="kpi-header">
          <span className="kpi-title">Total Tenants</span>
          <Users className="kpi-icon text-primary" />
        </div>

        <h2 className="kpi-value">8</h2>
        <small className="text-muted">Across all properties</small>
      </Card.Body>
    </Card>
  </Col>

  {/* MONTHLY REVENUE */}
  <Col md={4}>
    <Card className="kpi-card">
      <Card.Body>
        <div className="kpi-header">
          <span className="kpi-title">Monthly Revenue</span>
          <DollarSign className="kpi-icon text-success" />
        </div>

        <h2 className="kpi-value">$242,500</h2>
        <small className="text-muted">Total rent collection</small>
      </Card.Body>
    </Card>
  </Col>

  {/* CRITICAL ITEMS */}
  <Col md={4}>
    <Card className="kpi-card">
      <Card.Body>
        <div className="kpi-header">
          <span className="kpi-title">Critical Items</span>
          <AlertCircle className="kpi-icon text-danger" />
        </div>

        <h2 className="kpi-value">2</h2>
        <small className="text-muted">Next 30 days</small>
      </Card.Body>
    </Card>
  </Col>
</Row>

      {/* CRITICAL DATES */}
<Card className="mb-4 shadow-sm">
  <Card.Body>
    <h6 className="mb-3">Critical Dates</h6>

    {/* ITEM */}
    <Card className="critical-item mb-3">
      <Card.Body>
        <Row className="align-items-center">

          {/* ICON + DAYS (VERTICAL) */}
          <Col xs="auto" className="text-center me-3">
            <CalendarDays size={20} className="calendar-icon" />
            <div className="days-left">7d</div>
          </Col>

          {/* NAME + DESCRIPTION */}
          <Col>
            <div className="fw-medium">
              ACME Corp <span className="text-muted">• Unit 101</span>
            </div>
            <div className="text-muted small">
              Lease Expiration
            </div>
          </Col>

          {/* DATE + BADGE */}
          <Col className="text-end">
            <span className="text-muted me-3">2025-01-15</span>
            <Badge pill bg="danger-subtle" text="danger">
              Lease Expiration
            </Badge>
          </Col>

        </Row>
      </Card.Body>
    </Card>

    {/* ITEM 2 */}
    <Card className="critical-item">
      <Card.Body>
        <Row className="align-items-center">

          <Col xs="auto" className="text-center me-3">
            <CalendarDays size={20} className="calendar-icon" />
            <div className="days-left">24d</div>
          </Col>

          <Col>
            <div className="fw-medium">
              TechStart Inc <span className="text-muted">• Unit 203</span>
            </div>
            <div className="text-muted small">
              Renewal Option Deadline
            </div>
          </Col>

          <Col className="text-end">
            <span className="text-muted me-3">2025-02-01</span>
            <Badge pill bg="warning-subtle" text="warning">
              Option Deadline
            </Badge>
          </Col>

        </Row>
      </Card.Body>
    </Card>

  </Card.Body>
</Card>

       {/* HEADER */}
      <Row className="align-items-center mb-4">
        <Col>
          <h4>Leases</h4>
        </Col>

        <Col className="d-flex justify-content-end gap-3 lease-actions">
          <InputGroup style={{ maxWidth: "260px" }}>
            <Form.Control placeholder="Search tenants..." />
          </InputGroup>
            {/* <button
              className="add-unit-btn"
              onClick={() => setShowAddTenant(true)}
            >
              <Plus size={16} /> Add Tenant
            </button> */}
        </Col>
      </Row>
      {leases.map((lease, idx) => (
        <Card
          key={idx}
          className="mb-3 shadow-sm lease-card"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/tenant/${lease.name}`)}
        >
          <Card.Body>
            <Row className="align-items-center">
              
              <Col md={8} className="d-flex gap-3 align-items-start">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg,#6f42ff,#8f6bff)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: "bold"
                  }}
                >
                  <Building size={24} />
                </div>

                {/* INFO */}
                <div>
                  <h6 className="mb-1">{lease.name}</h6>
                  <small className="text-muted">
                    {lease.units} Units &nbsp;•&nbsp; {lease.sqft} sq ft
                    &nbsp;•&nbsp; Expires {lease.expiry}
                  </small>
                </div>
              </Col>

              <Col md={4} className="text-end">
                <small className="text-muted">Monthly Rent</small>
                <h6 className="mb-0">{lease.rent}</h6>
              </Col>

            </Row>
          </Card.Body>
        </Card>
      ))}

    </Container>
     
    {showAddTenant && (
      <AddTenant onClose={() => setShowAddTenant(false)} />
    )}
    </>
  );
};

export default Dashboard;
