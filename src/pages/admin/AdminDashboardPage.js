import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/adminDashboard.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userName = "Admin"; 

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }

        // --- THIS IS THE FIX: Port changed from 3000 to 5000 ---
        const res = await axios.get("http://localhost:5000/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError("Could not load dashboard data. Please try again.");
          console.error("Dashboard fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  const statCards = React.useMemo(() => [
    { title: "Total Users", value: stats?.totalUsers ?? '0', icon: "group", color: "blue", path: "/admin/users" },
    { title: "Total Vehicles", value: stats?.totalVehicles ?? '0', icon: "directions_bus", color: "green", path: "/admin/vehicles" },
    { title: "Total Operators", value: stats?.totalOperators ?? '0', icon: "engineering", color: "yellow", path: "/admin/operators" },
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: "account_balance_wallet", color: "purple", path: "/admin/fares" },
  ], [stats]);

  return (
    <AdminLayout>
      <div className="dashboard-page animate-fade-in">
        <h2 className="page-title">Welcome back, {userName}!</h2>
        <p className="page-subtitle">Here’s a snapshot of your transit system today.</p>

        {loading ? (
          <p className="loading-text">Loading statistics...</p>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            <div className="stats-grid">
              {statCards.map((stat, index) => (
                <Link key={index} to={stat.path} className="stat-card-link">
                  <div className="stat-card" style={{ animationDelay: `${index * 100}ms` }}>
                    <div>
                      <p className="stat-label">{stat.title}</p>
                      <h3 className="stat-value">{stat.value}</h3>
                    </div>
                    <div className={`stat-icon-wrapper ${stat.color}`}>
                      <span className="material-icons">{stat.icon}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="recent-activity">
              <div className="activity-header">
                <h3 className="section-title">Recent Activity</h3>
                <Link to="/admin/users" className="view-all-link">View All</Link>
              </div>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => {
                  const firstName = activity.fullName.split(' ')[0];
                  return (
                    <div key={activity._id} className="activity-item" style={{ animationDelay: `${(index + statCards.length) * 100}ms` }}>
                      <img 
                        src={`https://i.pravatar.cc/150?u=${activity._id}`} 
                        alt="User Avatar" 
                        className="activity-avatar" 
                      />
                      <div>
                        <p className="activity-title">
                          <strong>{firstName}</strong> registered as a new {activity.role}
                        </p>
                        <p className="activity-time">
                          {new Date(activity.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <span className="material-icons empty-icon">history_toggle_off</span>
                  <p className="empty-title">No recent activities</p>
                  <p className="empty-subtitle">New user registrations will appear here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;