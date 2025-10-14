import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/adminDashboard.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        // Ensure the URL is correct (using port 5000 as per your server.js)
        const res = await axios.get("http://localhost:5000/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        setError("Could not load dashboard data. Please try again.");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Data for the statistics cards, now driven by state
  const statCards = [
    { title: "Total Users", value: stats?.totalUsers, icon: "group", color: "blue" },
    { title: "Total Vehicles", value: stats?.totalVehicles, icon: "directions_bus", color: "green" },
    { title: "Total Operators", value: stats?.totalOperators, icon: "engineering", color: "yellow" },
    { title: "Fares Today", value: `₹${stats?.faresToday.toLocaleString('en-IN') || 0}`, icon: "receipt_long", color: "pink" },
  ];

  return (
    <AdminLayout>
      <div className="dashboard-page">
        <h2 className="page-title">Dashboard</h2>

        {loading ? (
          <p>Loading statistics...</p>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            {/* Stats Cards Grid */}
            <div className="stats-grid">
              {statCards.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div>
                    <p className="stat-label">{stat.title}</p>
                    <h3 className="stat-value">{stat.value ?? '0'}</h3>
                  </div>
                  <div className={`stat-icon-wrapper ${stat.color}`}>
                    <span className="material-icons">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Section */}
            <div className="recent-activity">
              <div className="activity-header">
                <h3 className="section-title">Recent Activity</h3>
                <Link to="/admin/users" className="view-all-link">View All</Link>
              </div>
              
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map(activity => (
                  <div key={activity._id} className="activity-item">
                    <div className="activity-icon-wrapper blue">
                      <span className="material-icons">person_add</span>
                    </div>
                    <div>
                      <p className="activity-title">New {activity.role} registered</p>
                      <p className="activity-time">{activity.fullName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{marginTop: '1rem', padding: '2rem'}}>
                  <span className="material-icons empty-icon" style={{fontSize: '48px'}}>history_toggle_off</span>
                  <p className="empty-title" style={{color: '#1c1c1e', fontSize: '1.1rem', fontWeight: '600'}}>No recent activities</p>
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