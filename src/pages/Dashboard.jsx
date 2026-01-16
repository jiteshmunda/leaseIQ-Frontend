import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Navbar, } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/dashboard.css";
import AddUnit from "../components/AddUnit";
import AddTenant from "../components/AddTenant";
import { Home, Plus, CalendarDays, Users, DollarSign, AlertCircle, Building, LayoutDashboard, Search } from "lucide-react";
import FloatingSignOut from "../components/FloatingSingout";
import PaginationComponent from "../components/PaginationComponent";
import api from "../service/api";
const BASE_URL = import.meta.env.VITE_API_BASE_URL
const criticalItems = [];
const Dashboard = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const token = sessionStorage.getItem("token");
  const [search, setSearch] = useState("");

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchTenants = useCallback(async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setTenants(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    }
  }, [token]);

  useEffect(() => {
    if (!showAddUnit) {
      // eslint-disable-next-line
      fetchTenants();
    }
  }, [showAddUnit, fetchTenants]);

  const totalMonthlyRent = tenants.reduce(
    (sum, tenant) => sum + Number(tenant.monthly_rent || 0),
    0
  );
  const filteredTenants = tenants.filter((tenant) =>
    tenant.tenant_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar className="dashboard-navbar">
        {/* Animated Background Elements */}
        <div className="navbar-animation-bg">
          <ul className="navbar-circles">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
        <FloatingSignOut />
        <Container fluid className="navbar-content">
          <Navbar.Brand className="d-flex align-items-center gap-2">
            <LayoutDashboard onClick={() => navigate("/landing")} /> <span>Portfolio</span>
          </Navbar.Brand>

          <Button
            variant="outline-primary"
            onClick={() => setShowAddUnit(true)}
          >
            <Plus size={16} /> Add Tenent
          </Button>
          <AddUnit show={showAddUnit}
            onClose={() => setShowAddUnit(false)}
            onSuccess={fetchTenants}
          />
        </Container>
      </Navbar>
      <Container fluid className="p-4 dashboard-container">

        {/* TITLE + FILTER */}
        {/* <Row className="align-items-center mb-4">
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
      </Row> */}

        {/* KPI CARDS */}
        <Row className="mb-4">
          {/* TOTAL TENANTS */}
          <Col md={4}>
            <Card className="kpi-card blue-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Total Tenants</span>
                  <Users className="kpi-icon blue text-primary" />
                </div>

                <h2 className="kpi-value">{tenants.length}</h2>
                <small className="text-muted">Across all properties</small>
              </Card.Body>
            </Card>
          </Col>

          {/* MONTHLY REVENUE */}
          <Col md={4}>
            <Card className="kpi-card green-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Monthly Revenue</span>
                  <DollarSign className="kpi-icon green text-success" />
                </div>

                <h2 className="kpi-value">{totalMonthlyRent}</h2>
                <small className="text-muted">Total rent collection</small>
              </Card.Body>
            </Card>
          </Col>

          {/* CRITICAL ITEMS */}
          <Col md={4}>
            <Card className="kpi-card orange-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Critical Items</span>
                  <AlertCircle className="kpi-icon orange text-orange" />
                </div>

                <h2 className="kpi-value">{criticalItems.length}</h2>
                <small className="text-muted">Next 30 days</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* <Card className="mb-4 shadow-sm">
  <Card.Body>
    <h6 className="mb-3">Critical Dates</h6>

    {criticalItems.length === 0 ? (
      <div className="text-muted text-center py-4">
        🎉 No critical items in the next 30 days
      </div>
    ) : (
      criticalItems.map((item, index) => (
        <Card key={index} className="critical-item mb-3">
          <Card.Body>
            <Row className="align-items-center">
              <Col xs="auto" className="text-center me-3">
                <CalendarDays size={20} className="calendar-icon" />
                <div className="days-left">{item.daysLeft}d</div>
              </Col>

              <Col>
                <div className="fw-medium">
                  {item.tenant} <span className="text-muted">• {item.unit}</span>
                </div>
                <div className="text-muted small">{item.type}</div>
              </Col>

              <Col className="text-end">
                <span className="text-muted me-3">{item.date}</span>
                <Badge pill bg={item.badgeColor}>
                  {item.label}
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))
    )}
  </Card.Body>
</Card> */}


        {/* HEADER */}
        <Row className="align-items-center mb-4">
          <Col>
            <h4>Tenants</h4>
          </Col>

          <Col className="d-flex justify-content-end gap-3 lease-actions">
            <InputGroup style={{ maxWidth: "260px" }}>
              <Form.Control
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />

            </InputGroup>
            {/* <button
              className="add-unit-btn"
              onClick={() => setShowAddTenant(true)}
            >
              <Plus size={16} /> Add Tenant
            </button> */}
          </Col>
        </Row>
        {filteredTenants.length === 0 ? (
          <div className="no-results-container">
            <div className="no-results-icon-wrapper">
              <Search size={48} className="no-results-icon" />
            </div>
            <h5>No tenants found</h5>
            <p className="text-muted">
              We couldn't find any tenants matching "<strong>{search}</strong>"
            </p>
            <Button
              variant="outline-primary"
              className="mt-2"
              onClick={() => setSearch("")}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          filteredTenants
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((tenant) => (
              <Card key={tenant._id}
                className="mb-3 shadow-sm lease-card"
                onClick={() =>
                  navigate(`/tenant/${tenant._id}`, {
                    state: { tenantName: tenant.tenant_name },
                  })
                }
              >
                <Card.Body>
                  <Row className="align-items-center">

                    <Col md={8} className="d-flex gap-3 align-items-start">
                      <div className="tenant-icon">
                        <Building size={24} />
                      </div>

                      <div>
                        <h6 className="mb-1">{tenant.tenant_name}</h6>
                        <small className="text-muted">
                          {tenant.total_units} Units • {/*{tenant.total_sqft} sq ft • */}
                          {/* Expires {tenant.lease_expiry} */}
                        </small>
                      </div>
                    </Col>

                    <Col md={4} className="text-end">
                      <small className="text-muted">Monthly Rent</small>
                      <h6 className="mb-0">$ {tenant.monthly_rent}</h6>
                    </Col>

                  </Row>
                </Card.Body>
              </Card>
            ))
        )}

        <PaginationComponent
          currentPage={currentPage}
          totalPages={Math.ceil(filteredTenants.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />


      </Container>

      {showAddTenant && (
        <AddTenant onClose={() => setShowAddTenant(false)} />
      )}
    </>
  );
};

export default Dashboard;
