import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Trash2, Users, AlertTriangle } from "lucide-react";
import api from "../service/api.js";
import { showError } from "../service/toast";
import { useNavigate } from "react-router-dom";

const OrganizationUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, userId: null, userName: "" });
    const [deleting, setDeleting] = useState(false);
    const [editModal, setEditModal] = useState({ open: false, user: null, formData: {} });
    const [updating, setUpdating] = useState(false);

    const currentUserId = sessionStorage.getItem("userId");
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrgUsers();
    }, [page, limit]);

    const fetchOrgUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/users?page=${page}&limit=${limit}`);
            setUsers(res.data.data || []);
            setTotalUsers(res.data.pagination?.total || 0);
            setTotalPages(res.data.pagination?.pages || 0);
        } catch (err) {
            showError(err.response?.data?.message || "Failed to fetch organization users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case "active":
                return <span className="status-pill active">Active</span>;
            case "inactive":
                return <span className="status-pill inactive">Inactive</span>;
            case "pending_approval":
                return <span className="status-pill pending_approval">Pending Approval</span>;
            default:
                return <span className="status-pill inactive">Unknown</span>;
        }
    };
    const handleUpdateClick = (user) => {
        setEditModal({
            open: true,
            user,
            formData: { name: user.name, is_active: user.is_active ?? true }
        });
    };

    const handleEditChange = (field, value) => {
        setEditModal(prev => ({
            ...prev,
            formData: { ...prev.formData, [field]: value }
        }));
    };



    const handleDeleteClick = (userId, userName) => {
        setConfirmDelete({ open: true, userId, userName });
    };

    const handleConfirmDelete = async () => {
        const { userId } = confirmDelete;
        setDeleting(true);
        try {
            // Remove user from organization (not delete the account)
            await api.delete(`/api/organization/users/${userId}`);
            setConfirmDelete({ open: false, userId: null, userName: "" });
            // refresh list after deletion
            fetchOrgUsers();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to remove user from organization");
            setConfirmDelete({ open: false, userId: null, userName: "" });
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setConfirmDelete({ open: false, userId: null, userName: "" });
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    return (
        <div className="content-section">
            <div className="section-header">
                <h1>Organization Users</h1>
                <p>Manage and monitor team members in your organization</p>
            </div>

            {loading ? (
                <div className="settings-card premium-card empty-state">
                    <div className="loader-premium"></div>
                    <p>Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="settings-card premium-card empty-state">
                    <Users size={48} />
                    <p>No users found in your organization.</p>
                </div>
            ) : (
                <>
                    <div className="settings-card premium-card table-card">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle custom-premium-table m-0">
                                <thead>
                                    <tr>
                                        <th className="avatar-col">Avatar</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>User Name</th>
                                        <th>Status</th>
                                        {/* <th className="text-end actions-col">Actions</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id} className={currentUserId === user._id ? "current-user-row" : ""}>
                                            <td>
                                                <div className="avatar-small-premium">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-name-cell">
                                                    <span className="fw-semibold">{user.name}</span>
                                                    {currentUserId === user._id && <span className="badge bg-primary-subtle text-primary ms-2">You</span>}
                                                </div>
                                            </td>
                                            <td className="text-secondary">{user.email}</td>
                                            <td><code className="username-code">{user.username}</code></td>
                                            <td>
                                                {getStatusBadge(user.status)}
                                            </td>
                                            {/* <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2">

                                                    <button className=" btn-delete" onClick={() => handleDeleteClick(user._id, user.name)} title="Remove User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-section-premium">
                            <div className="pagination-info">
                                <span>Page <strong>{page}</strong> of {totalPages}</span>
                                <span className="user-count">Total: {totalUsers} users</span>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn-pagination-premium"
                                    onClick={handlePrevPage}
                                    disabled={page === 1}
                                    title="Previous page"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    className="btn-pagination-premium"
                                    onClick={handleNextPage}
                                    disabled={page >= totalPages}
                                    title="Next page"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}



            {/* Confirmation Modal */}
            {confirmDelete.open && (
                <div className="modal-overlay" onClick={handleCancelDelete}>
                    <div className="modal-dialog-premium modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-premium">
                            <h2>Confirm Removal</h2>
                            <button className="modal-close-premium" onClick={handleCancelDelete}>&times;</button>
                        </div>
                        <div className="modal-body-premium text-center py-4">
                            <div className="warning-icon mb-3">
                                <AlertTriangle size={48} className="text-warning" />
                            </div>
                            <p>Are you sure you want to remove <strong>{confirmDelete.userName}</strong> from the organization?</p>
                            <p className="text-secondary small mt-2">This user will lose access to all organization resources.</p>
                        </div>
                        <div className="modal-footer-premium">
                            <button className="btn-cancel-premium" onClick={handleCancelDelete} disabled={deleting}>Cancel</button>
                            <button className="btn-save-premium bg-danger border-danger" onClick={handleConfirmDelete} disabled={deleting}>
                                {deleting ? 'Removing...' : 'Remove User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationUsers;
