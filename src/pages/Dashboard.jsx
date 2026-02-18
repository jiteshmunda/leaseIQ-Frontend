import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Navbar, } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/dashboard.css";
import AddUnit from "../components/AddUnit";
import AddTenant from "../components/AddTenant";
import { Plus, Users, DollarSign, AlertCircle, Building, LayoutDashboard, Search, ChevronLeft, ChevronRight, Archive, Trash2, MoreVertical } from "lucide-react";
import FloatingSignOut from "../components/FloatingSingout";
import PaginationComponent from "../components/PaginationComponent";
import api from "../service/api";
import { showSuccess, showError } from "../service/toast";
import RemainingAbstractsBadge from "../components/RemainingAbstractsBadge";
import NoTenantAnimation from "../components/NoTenantAnimation";

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const Dashboard = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(true);
  const token = sessionStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [activeActionCardId, setActiveActionCardId] = useState(null);

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [prevPage, setPrevPage] = useState(1);
  const itemsPerPage = 5;

  // Critical items pagination
  const [criticalPage, setCriticalPage] = useState(1);
  const criticalItemsPerPage = 3;

  const [filterDays, setFilterDays] = useState(null);

  // Helper to calculate days remaining from lease_details array
  const calculateDaysRemaining = (leaseDetails) => {
    if (!leaseDetails || !Array.isArray(leaseDetails) || leaseDetails.length === 0) return { days: Infinity, date: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today

    let minDays = Infinity;
    let nearestDate = null;

    leaseDetails.forEach(detail => {
      // Check for valid end_date in the object
      if (!detail?.end_date) return;

      const expiry = new Date(detail.end_date);
      expiry.setHours(0, 0, 0, 0); // Normalize expiry

      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // We only care about future or today (>= 0) and finding the smallest positive diff
      if (diffDays >= 0 && diffDays < minDays) {
        minDays = diffDays;
        nearestDate = detail.end_date;
      }
    });

    return { days: minDays, date: nearestDate };
  };

  const fetchTenants = useCallback(async () => {
    try {
      setIsTenantsLoading(true);   // 👈 start loader
      const res = await api.get(`${BASE_URL}/api/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setTenants(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setIsTenantsLoading(false); // 👈 stop loader
    }
  }, [token]);

  const handleArchive = async (e, tenantId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to archive this tenant?")) return;

    try {
      await api.patch(`${BASE_URL}/api/tenants/${tenantId}/archive`, {
        is_archive: true
      });
      showSuccess("Tenant archived successfully");
      fetchTenants(); // Refresh list
    } catch (err) {
      console.error("Failed to archive tenant", err);
      showError("Failed to archive tenant");
    }
  };

  const handleDelete = async (e, tenantId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;

    try {
      await api.delete(`${BASE_URL}/api/tenants/${tenantId}`);
      showSuccess("Tenant deleted successfully");
      fetchTenants(); // Refresh list
    } catch (err) {
      console.error("Failed to delete tenant", err);
      showError("Failed to delete tenant");
    }
  };

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
  // Calculate critical items (<= 30 days)
  // Calculate critical items (<= 30 days) - flattened list of specific units
  const criticalItems = tenants.flatMap(tenant => {
    const details = tenant.lease_details || [];
    if (!Array.isArray(details)) return [];

    return details
      .filter(detail => {
        if (!detail?.end_date) return false;

        const expiry = new Date(detail.end_date);
        expiry.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 30 && diffDays >= 0;
      })
      .map(detail => {
        const expiry = new Date(detail.end_date);
        expiry.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
          ...detail,
          tenant_name: tenant.tenant_name,
          tenant_id: tenant._id,
          days_remaining: Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
        };
      });
  });

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.tenant_name
      .toLowerCase()
      .includes(search.toLowerCase());

    let matchesDate = true;
    if (filterDays !== null) {
      // Use helper to check lease_details
      const { days } = calculateDaysRemaining(tenant.lease_details);
      matchesDate = days <= filterDays && days !== Infinity;
    }

    return matchesSearch && matchesDate;
  });

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

          <div className="ms-auto d-flex align-items-center gap-3">
            <RemainingAbstractsBadge />
            <Button
              variant="outline-primary"
              onClick={() => setShowAddUnit(true)}
            >
              <Plus size={16} /> Add Tenent
            </Button>
          </div>
          <AddUnit show={showAddUnit}
            onClose={() => setShowAddUnit(false)}
            onSuccess={async () => {
              try {
                await api.post("/api/leases/update-periods");
              } catch (err) {
                console.error("Failed to update periods", err);
              }
              // Fetch tenants AFTER periods update so data is fresh
              fetchTenants();
            }}
          />
        </Container>
      </Navbar>
      <Container fluid className="p-4 dashboard-container">

        {/* TITLE + FILTER */}
        <Row className="align-items-center mb-4">
          {/* <Col xs={12} md={6}>
          <h5 className="mb-3 mb-md-0">Upcoming Critical Items</h5>
        </Col>  */}

          <Col
            xs={12}
            md={12}
            className="d-flex justify-content-start justify-content-md-end gap-2 flex-wrap"
          >
            <Button
              variant={filterDays === 30 ? "primary" : "outline-primary"}
              onClick={() => setFilterDays(filterDays === 30 ? null : 30)}
            >
              30 Days
            </Button>
            <Button
              variant={filterDays === 60 ? "primary" : "outline-primary"}
              onClick={() => setFilterDays(filterDays === 60 ? null : 60)}
            >
              60 Days
            </Button>
            <Button
              variant={filterDays === 90 ? "primary" : "outline-primary"}
              onClick={() => setFilterDays(filterDays === 90 ? null : 90)}
            >
              90 Days
            </Button>

            {filterDays !== null && (
              <Button
                variant="outline-danger"
                onClick={() => setFilterDays(null)}
                className="d-flex align-items-center gap-1"
              >
                <Trash2 size={16} /> Clear Filter
              </Button>
            )}
          </Col>
        </Row>

        {/* KPI CARDS */}
        <Row className="mb-4">
          {/* TOTAL TENANTS */}
          <Col md={4}>
            <Card className="kpi-card purple-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Total Tenants</span>
                  <Users className="kpi-icon purple" />
                </div>

                <h2 className="kpi-value">{tenants.length}</h2>
                <small className="text-muted">Across all properties</small>
              </Card.Body>
            </Card>
          </Col>

          {/* MONTHLY REVENUE */}
          <Col md={4}>
            <Card className="kpi-card purple-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Monthly Revenue</span>
                  <DollarSign className="kpi-icon purple" />
                </div>

                <h2 className="kpi-value">{totalMonthlyRent}</h2>
                <small className="text-muted">Total rent collection</small>
              </Card.Body>
            </Card>
          </Col>

          {/* CRITICAL ITEMS */}
          <Col md={4}>
            <Card className="kpi-card purple-border">
              <Card.Body>
                <div className="kpi-header">
                  <span className="kpi-title">Critical Items</span>
                  <AlertCircle className="kpi-icon purple" />
                </div>

                <h2 className="kpi-value">{criticalItems.length}</h2>
                <small className="text-muted">Next 30 days</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h6 className="mb-3">Critical Dates</h6>

            {criticalItems.length === 0 ? (
              <div className="text-muted text-center py-4">
                🎉 No critical items in the next 30 days
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover critical-table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 border-0 rounded-start">Tenant</th>
                      <th className="border-0">Unit</th>
                      <th className="border-0">Days Left</th>
                      <th className="text-end pe-3 border-0 rounded-end">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalItems
                      .slice((criticalPage - 1) * criticalItemsPerPage, criticalPage * criticalItemsPerPage)
                      .map((item, index) => (
                        <tr key={`${item.tenant_id}-${index}`}>
                          <td className="ps-3">
                            <div className="fw-medium text-dark">{item.tenant_name}</div>
                          </td>
                          <td>
                            <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                              {item.unit_number || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-danger fw-bold">{item.days_remaining}</span>
                              <span className="text-muted small">days</span>
                            </div>
                          </td>
                          <td className="text-end pe-3">
                            <span className="text-muted fw-medium font-monospace">
                              {new Date(item.end_date).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="critical-pagination">
                  <button
                    className="cp-nav-btn"
                    onClick={() => setCriticalPage(prev => Math.max(prev - 1, 1))}
                    disabled={criticalPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="cp-dots">
                    {Array.from({ length: Math.ceil(criticalItems.length / criticalItemsPerPage) }).map((_, i) => (
                      <div
                        key={i}
                        className={`cp-dot ${criticalPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCriticalPage(i + 1)}
                      />
                    ))}
                  </div>

                  <button
                    className="cp-nav-btn"
                    onClick={() => setCriticalPage(prev => Math.min(prev + 1, Math.ceil(criticalItems.length / criticalItemsPerPage)))}
                    disabled={criticalPage === Math.ceil(criticalItems.length / criticalItemsPerPage)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>


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
                  const val = e.target.value;
                  setSearch(val);

                  if (val === "") {
                    // Search cleared -> restore previous page
                    setCurrentPage(prevPage);
                  } else if (search === "") {
                    // Search started -> save current page and go to page 1 for results
                    setPrevPage(currentPage);
                    setCurrentPage(1);
                  } else {
                    // Already searching -> stay on page 1 of results
                    setCurrentPage(1);
                  }
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
        {isTenantsLoading ? (
          // 🔄 Loading tenants
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-muted">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          // 📭 No tenants at all
          <NoTenantAnimation onAddTenant={() => setShowAddUnit(true)} />
        ) : filteredTenants.length === 0 ? (
          // 🔍 Tenants exist, but search returned nothing
          <NoTenantAnimation onAddTenant={() => setShowAddUnit(true)} />
        ) : (
          // 📦 Normal list
          filteredTenants
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((tenant) => (
              <div className="lease-card-wrapper mb-3" key={tenant._id}>
                {/* 🔽 KEEP YOUR EXISTING TENANT CARD UI AS IS */}
                <Card
                  className={`shadow-sm lease-card ${activeActionCardId === tenant._id ? "actions-open" : ""}`}
                  onClick={(e) => {
                    if (!e.target.closest('.lease-card-actions') && !e.target.closest('.action-trigger')) {
                      navigate(`/tenant/${tenant._id}`, {
                        state: { tenantName: tenant.tenant_name },
                      });
                    }
                  }}
                >
                  <Card.Body className="p-0 position-relative overflow-hidden">
                    <div className="p-3">
                      <Row className={`align-items-center transition-all ${activeActionCardId === tenant._id ? "content-shifted" : ""}`}>

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

                        <Col md={3} className="text-end rent-col">
                          <div className="rent-info-wrapper">
                            <small className="text-muted">Monthly Rent</small>
                            <h6 className="mb-0">$ {tenant.monthly_rent}</h6>
                          </div>
                        </Col>

                        <Col md={1} className="d-flex justify-content-end align-items-center">
                          <button
                            className="action-trigger btn btn-link p-0 text-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionCardId(activeActionCardId === tenant._id ? null : tenant._id);
                            }}
                          >
                            <MoreVertical size={20} className={`trigger-icon ${activeActionCardId === tenant._id ? "rotated" : ""}`} />
                          </button>
                        </Col>

                      </Row>
                    </div>

                    {/* SLIDE IN ACTIONS */}
                    <div className={`lease-card-actions ${activeActionCardId === tenant._id ? "show" : ""}`}>
                      <button
                        className="action-btn archive-btn"
                        onClick={(e) => handleArchive(e, tenant._id)}
                        title="Archive Tenant"
                      >
                        <Archive size={18} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => handleDelete(e, tenant._id)}
                        title="Delete Tenant"
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
