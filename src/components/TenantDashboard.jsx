import React, { useEffect, useState, useCallback } from "react";
import { Building2, LandPlot, DollarSign, TrendingUp } from "lucide-react";
import { Container, Row, Col, Card, Button, Badge, Navbar } from "react-bootstrap";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom"
import AddUnit from "../components/AddUnit";
import FloatingSignOut from "./FloatingSingout";
import PaginationComponent from "./PaginationComponent";
import api from "../service/api";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
import "../styles/tenantDashboard.css";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useParams();
  const tenantName = location.state?.tenantName;
  const [showAddUnit, setShowAddUnit] = React.useState(false);
  const [leases, setLeases] = useState([]);
  const token = sessionStorage.getItem("token");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLeases = useCallback(async () => {
    if (!tenantId) return;

    const res = await api.get(
      `${BASE_URL}/api/tenants/${tenantId}/leases`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setLeases(Array.isArray(res.data?.leases) ? res.data.leases : []);
  }, [tenantId, token]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchLeases();
  }, [fetchLeases]);

  const totalMonthlyRent = leases.reduce(
    (sum, lease) => sum + Number(lease.monthly_rent || 0),
    0
  );

  const totalSqFt = leases.reduce(
    (sum, lease) => sum + Number(lease.square_ft || 0),
    0
  );

  const avgRentPerSqFt = totalSqFt > 0 ? totalMonthlyRent / totalSqFt : 0;

  const formatDateOnly = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10);
  };




  return (
    <>
      {/* NAVBAR / HEADER */}
      <Navbar className="tenant-navbar">
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
          {/* Back */}

          <Navbar.Brand className="d-flex align-items-center gap-2">
            <ArrowLeft size={16} className="text-white back-btn" onClick={() => navigate("/dashboard")} />
            <span className="tenant-title">{tenantName || tenantId}</span>
          </Navbar.Brand>

          <Button
            variant="outline-primary"
            className="add-unit-navbar-btn"
            onClick={() => setShowAddUnit(true)}>
            <Plus size={16} /> Add Unit
          </Button>
        </Container>
      </Navbar>

      <Container fluid className="tenant-dashboard p-4">



        {/* KPI CARDS */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="kpi-card purple-border">
              <Card.Body className="kpi-body">
                <div className="kpi-header">
                  <small>Total Units</small>
                  <Building2 size={18} className="kpi-icon purple" />
                </div>
                <h4>{leases.length}</h4>
                <span className="kpi-sub">Occupied units</span>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card purple-border">
              <Card.Body className="kpi-body">
                <div className="kpi-header">
                  <small>Total Sq Ft</small>
                  <LandPlot size={18} className="kpi-icon purple" />
                </div>
                <h4>{totalSqFt.toLocaleString()}</h4>
                <span className="kpi-sub">Square footage</span>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card purple-border">
              <Card.Body className="kpi-body">
                <div className="kpi-header">
                  <small>Monthly Rent</small>
                  <DollarSign size={18} className="kpi-icon purple" />
                </div>
                <h4>${totalMonthlyRent.toLocaleString()}</h4>
                <span className="kpi-sub">Total monthly</span>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card purple-border">
              <Card.Body className="kpi-body">
                <div className="kpi-header">
                  <small>Avg Rent / Sq Ft</small>
                  <TrendingUp size={18} className="kpi-icon purple" />
                </div>
                <h4>${avgRentPerSqFt.toFixed(2)}</h4>
                <span className="kpi-sub">Per square foot</span>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="units-header d-flex justify-content-between align-items-center mb-3">
          <h4>Units</h4>
        </div>
        <div className="leases-list">
          {leases
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((lease, index) => (
              <Card key={index} className="unit-card mb-3" onClick={() => navigate(`/lease-details/${lease._id}`)}>
                <Card.Body className="unit-card-body">

                  {/* TOP ROW */}
                  <div className="unit-header">
                    {/* LEFT COLUMN */}
                    <div className="unit-left">
                      <div className="unit-title">
                        <h6>{lease.unit_number || "Unit 01"}</h6>
                        <span
                          className={`status-badge ${lease.status === "Active" ? "active" : "expiring"
                            }`}
                        >
                          {lease.status || "Active"}
                        </span>
                      </div>

                      <p className="building">{lease.property_name || "Building A"}</p>
                      <p className="address">{lease.address || "123 Main St"}</p>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="unit-rent text-end">
                      <small>Monthly Rent</small>
                      <h6> ${lease.monthly_rent || "0"}</h6>
                      <span className="sqft">{lease.square_ft || "0"} sq ft</span>
                    </div>
                  </div>

                  {/* DATES */}
                  <div className="unit-dates">
                    <span>📅 Start: {formatDateOnly(lease.start_date)}</span>
                    <span>•</span>
                    <span>📅 End: {formatDateOnly(lease.end_date)}</span>
                  </div>

                </Card.Body>
              </Card>
            ))}
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={Math.ceil(leases.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
        {showAddUnit && (
          <AddUnit
            show={showAddUnit}
            tenantId={tenantId}
            tenantName={tenantName}
            onClose={() => setShowAddUnit(false)}
            onSuccess={() => {
              setShowAddUnit(false);
              fetchLeases();
            }}
          />
        )}



      </Container>
    </>

  );
};

export default TenantDashboard;
