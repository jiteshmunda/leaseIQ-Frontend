import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../service/api.js";
import { showError } from "../service/toast";
import "../styles/organizationUsers.css";
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

    const handleConfirmUpdate = async () => {
        const { user, formData } = editModal;
        setUpdating(true);
        try {
            // Only allow updating name and is_active fields (field whitelisting)
            const payload = {
                name: formData.name,
                is_active: formData.is_active
            };
            await api.patch(`/api/users/${user._id}`, payload);
            setEditModal({ open: false, user: null, formData: {} });
            fetchOrgUsers();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to update user");
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelUpdate = () => {
        setEditModal({ open: false, user: null, formData: {} });
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
            <h1>Organization Users</h1>
            
            {loading ? (
                <div className="settings-card text-center">
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="settings-card text-center">
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No users found in your organization.</p>
                </div>
            ) : (
                <>
                    <div className="users-table-wrap">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Organization</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className={currentUserId === user._id ? "current-user-row" : ""}>
                                        <td>
                                            <div className="avatar small">
                                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="user-name">
                                                {user.name}
                                                {currentUserId === user._id && <span className="you-badge"> (You)</span>}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.role?.replace(/_/g, " ") || "member"}</td>
                                        <td>{user.organization?.name || user.organizationName || "—"}</td>
                                        <td>
                                            <button className="btn-action btn-update" onClick={() => handleUpdateClick(user)}>Update</button>
                                            <button className="btn-action btn-delete" onClick={() => handleDeleteClick(user._id, user.name)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-section">
                            <div className="pagination-info">
                                <span>Page {page} of {totalPages}</span>
                                <span className="user-count">Total: {totalUsers} users</span>
                            </div>
                            <div className="pagination-controls">
                                <button 
                                    className="btn-pagination" 
                                    onClick={handlePrevPage} 
                                    disabled={page === 1}
                                    title="Previous page"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button 
                                    className="btn-pagination" 
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

            {/* Edit Modal */}
            {editModal.open && editModal.user && (
                <div className="modal-overlay" onClick={handleCancelUpdate}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit User</h2>
                            <button className="modal-close" onClick={handleCancelUpdate}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={editModal.formData.name || ""}
                                    onChange={(e) => handleEditChange("name", e.target.value)}
                                    disabled={updating}
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={editModal.formData.is_active ?? true}
                                        onChange={(e) => handleEditChange("is_active", e.target.checked)}
                                        disabled={updating}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>Note: Role changes are not allowed for org admins</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCancelUpdate} disabled={updating}>Cancel</button>
                            <button className="btn-update-confirm" onClick={handleConfirmUpdate} disabled={updating}>
                                {updating ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmDelete.open && (
                <div className="modal-overlay" onClick={handleCancelDelete}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                            <button className="modal-close" onClick={handleCancelDelete}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{confirmDelete.userName}</strong>?</p>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '12px' }}>This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCancelDelete} disabled={deleting}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={handleConfirmDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationUsers;
