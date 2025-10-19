import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/userManagement.css";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          return;
        }
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Could not load user data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateStatus = (id, status) => {
    const token = localStorage.getItem("token");
    axios
      .put(`http://localhost:5000/api/users/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(users.map((user) => (user._id === id ? res.data : user)));
      })
      .catch((err) => console.error("Failed to update user status:", err));
  };

  const deleteUser = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      const token = localStorage.getItem("token");
      axios
        .delete(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setUsers(users.filter((user) => user._id !== id));
        })
        .catch((err) => console.error("Failed to delete user:", err));
    }
  };

  const filteredUsers = users.filter(user => 
    user.role !== 'Admin' &&
    user.fullName && 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return <div className="loading-indicator">Loading users...</div>;
    }
    if (error) {
      return <div className="error-banner">{error}</div>;
    }
    if (filteredUsers.length === 0) {
      return (
        <div className="empty-state">
          <span className="material-icons empty-icon">search_off</span>
          <h4 className="empty-title">No Users Found</h4>
          <p className="empty-subtitle">
            {searchTerm ? "Try adjusting your search." : "There are no users to display yet."}
          </p>
        </div>
      );
    }
    return (
      <div className="um-cards">
        {filteredUsers.map((user, index) => (
          <div className="um-card" key={user._id} style={{ animationDelay: `${index * 50}ms` }}>
            {/* --- HEADER (Unchanged) --- */}
            <div className="um-card-header">
              <img src={`https://i.pravatar.cc/150?u=${user._id}`} alt="User Avatar" className="um-card-avatar" />
              <div className="um-card-info">
                <p className="username">{user.fullName}</p>
                <p className="role">{user.role}</p>
              </div>
              {user.role === 'Operator' && (
                <span className={`um-badge ${user.status === "Approved" ? "success" : "pending"}`}>
                  {user.status || "Pending"}
                </span>
              )}
            </div>

            {/* --- NEW: CARD BODY WITH MORE DETAILS --- */}
            <div className="um-card-body">
                <div className="detail-item">
                    <span className="material-icons detail-icon">email</span>
                    <span>{user.email || 'No email provided'}</span>
                </div>
                <div className="detail-item">
                    <span className="material-icons detail-icon">phone</span>
                    <span>{user.phoneNumber || 'No phone provided'}</span>
                </div>
                <div className="detail-item">
                    <span className="material-icons detail-icon">event</span>
                    <span>Joined on {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            {/* --- FOOTER (Unchanged) --- */}
            {user.role === 'Operator' && (
              <div className="um-card-footer">
                {user.status === 'Pending' ? (
                  <>
                    <button className="btn reject-icon" onClick={() => deleteUser(user._id)} title="Reject & Delete User">
                      <span className="material-icons">delete_forever</span>
                    </button>
                    <button className="btn approve-icon" onClick={() => updateStatus(user._id, 'Approved')} title="Approve Operator">
                      <span className="material-icons">check_circle</span>
                      Approve
                    </button>
                  </>
                ) : (
                  <button className="btn delete" onClick={() => deleteUser(user._id)} title="Delete Operator">
                    <span className="material-icons">delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="user-management-page animate-fade-in">
        <h2 className="page-title">User Management</h2>
        <p className="page-subtitle">Approve, manage, and view all users in the system.</p>
        <div className="um-search">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {renderContent()}
      </div>
    </AdminLayout>
  );
}

export default UserManagementPage;