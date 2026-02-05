import React, { useEffect, useState, useCallback } from "react";
import { Building2, LandPlot, DollarSign, TrendingUp } from "lucide-react";
import { Container, Row, Col, Card, Button, Badge, Navbar } from "react-bootstrap";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Archive, Trash2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom"
import AddUnit from "../components/AddUnit";
import FloatingSignOut from "./FloatingSingout";
import PaginationComponent from "./PaginationComponent";
import api from "../service/api";
import { showSuccess, showError } from "../service/toast";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
import "../styles/tenantDashboard.css";
import RemainingAbstractsBadge from "../components/RemainingAbstractsBadge";

import NoLeaseAnimation from "./NoLeaseAnimation";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useParams();
  const tenantName = location.state?.tenantName;
  const [showAddUnit, setShowAddUnit] = React.useState(false);
  const [leases, setLeases] = useState([]);
  const token = sessionStorage.getItem("token");
  const [activeActionCardId, setActiveActionCardId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLeases = useCallback(async () => {
    if (!tenantId) return;

    try {
      const res = await api.get(
        `${BASE_URL}/api/tenants/${tenantId}/leases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLeases(Array.isArray(res.data?.leases) ? res.data.leases : []);
    } catch (err) {
      console.error("Failed to fetch leases", err);
    }
  }, [tenantId, token]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchLeases();
  }, [fetchLeases]);

  const handleArchive = async (e, leaseId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to archive this unit?")) return;

    try {
      await api.patch(`${BASE_URL}/api/leases/${leaseId}/archive`, {
        is_archive: true
      });
      showSuccess("Unit archived successfully");
      fetchLeases();
    } catch (err) {
      console.error("Failed to archive unit", err);
      showError("Failed to archive unit");
    }
  };

  const handleDelete = async (e, leaseId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this unit? This action cannot be undone.")) return;

    try {
      await api.delete(`${BASE_URL}/api/leases/${leaseId}`);
      showSuccess("Unit deleted successfully");
      fetchLeases();
    } catch (err) {
      console.error("Failed to delete unit", err);
      showError("Failed to delete unit");
    }
  };

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

          <div className="ms-auto d-flex align-items-center gap-3">
            <RemainingAbstractsBadge />
            <Button
              variant="outline-primary"
              className="add-unit-navbar-btn"
              onClick={() => setShowAddUnit(true)}>
              <Plus size={16} /> Add Unit
            </Button>
          </div>
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

        {leases.length === 0 ? (
          <NoLeaseAnimation onAddUnit={() => setShowAddUnit(true)} />
        ) : (
          <div className="leases-list">
            {leases
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((lease, index) => (
                <div className="unit-card-wrapper mb-3" key={index}>
                  <Card
                    className={`unit-card ${activeActionCardId === lease._id ? "actions-open" : ""}`}
                    onClick={(e) => {
                      if (!e.target.closest('.unit-card-actions') && !e.target.closest('.action-trigger')) {
                        navigate(`/lease-details/${lease._id}`)
                      }
                    }}
                  >
                    <Card.Body className="unit-card-body position-relative overflow-hidden">

                      {/* TRIGGER Button */}
                      <button
                        className="action-trigger btn btn-link p-0 text-muted"
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionCardId(activeActionCardId === lease._id ? null : lease._id);
                        }}
                      >
                        <ChevronLeft size={20} className={`trigger-icon ${activeActionCardId === lease._id ? "rotated" : ""}`} />
                      </button>

                      <div className={`transition-all ${activeActionCardId === lease._id ? "content-shifted" : ""}`}>
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
                          <div className="unit-rent text-end rent-info-wrapper">
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
                      </div>

                      {/* SLIDE IN ACTIONS */}
                      <div className={`unit-card-actions ${activeActionCardId === lease._id ? "show" : ""}`}>
                        <button
                          className="action-btn archive-btn"
                          onClick={(e) => handleArchive(e, lease._id)}
                          title="Archive Unit"
                        >
                          <Archive size={18} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => handleDelete(e, lease._id)}
                          title="Delete Unit"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          className="action-btn close-actions-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionCardId(null);
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                    </Card.Body>
                  </Card>
                </div>
              ))}
          </div>
        )}
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
