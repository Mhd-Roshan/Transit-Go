import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import API from '../../api'; // Import the new API client
import '../../styles/adminDashboard.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
);

const getPastSevenDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
    }
    return labels;
};


const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trafficData, setTrafficData] = useState({
    labels: getPastSevenDays(),
    datasets: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }

        // Use the new API client
        const [statsRes, reportsRes] = await Promise.all([
            API.get("/dashboard/stats"),
            API.get("/reports")
        ]);

        setStats(statsRes.data);
        setReports(reportsRes.data);

        const totalUsers = statsRes.data.totalUsers || 50;
        const baseTraffic = Math.max(10, Math.round(totalUsers / 2));
        const dynamicTraffic = Array.from({ length: 7 }, () => 
          baseTraffic + Math.floor(Math.random() * baseTraffic) - (baseTraffic / 2)
        );

        setTrafficData({
          labels: getPastSevenDays(),
          datasets: [{
            label: 'User Activity',
            data: dynamicTraffic,
            borderColor: 'rgba(88, 86, 214, 1)',
            backgroundColor: 'rgba(88, 86, 214, 0.1)',
            fill: true,
          }]
        });

      } catch (err) {
        // Global interceptor will handle 401, just show a message here
        setError("Could not load all dashboard data. Please try again.");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const statCards = useMemo(() => [
    { title: "Total Users", value: stats?.totalUsers ?? '0', icon: "group", color: "blue", path: "/admin/users" },
    { title: "Total Vehicles", value: stats?.totalVehicles ?? '0', icon: "directions_bus", color: "green", path: "/admin/vehicles" },
    { title: "Total Operators", value: stats?.totalOperators ?? '0', icon: "engineering", color: "yellow", path: "/admin/operators" },
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: "account_balance_wallet", color: "purple", path: "/admin/fares" },
  ], [stats]);
  
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1c1c1e', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false, }},
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(142, 142, 147, 0.2)' }, ticks: { precision: 0 } }},
    elements: { line: { tension: 0.4 }, point: { radius: 0 } }
  };
  
  return (
    <AdminLayout>
      <div className="dashboard-page animate-fade-in">
        <h2 className="page-title">Dashboard Overview</h2>
        <p className="page-subtitle">A real-time snapshot of your transit system's performance.</p>

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

            <div className="dashboard-grid">
              <div className="main-chart-container">
                <div className="chart-card" style={{ animationDelay: '400ms' }}>
                  <div className="chart-header">
                    <h3 className="chart-title">User Activity</h3>
                    <span className="time-range-selector">Last 7 Days</span>
                  </div>
                  <div style={{ height: '280px' }}><Line options={chartOptions} data={trafficData} /></div>
                </div>
                <div className="quick-actions-card" style={{ animationDelay: '500ms' }}>
                   <h3 className="section-title" style={{marginBottom: '1rem'}}>Quick Actions</h3>
                   <div className="quick-actions-grid">
                       <Link to="/admin/vehicles" className="action-link">
                           <span className="material-icons action-icon">directions_bus</span>
                           <span className="action-label">Add New Vehicle</span>
                       </Link>
                       <Link to="/admin/operators" className="action-link">
                           <span className="material-icons action-icon">engineering</span>
                           <span className="action-label">Assign Operator</span>
                       </Link>
                   </div>
                </div>
              </div>

              <div className="right-feed-column">
                <div className="reports-overview-card" style={{ animationDelay: '600ms' }}>
                    <div className="activity-header">
                        <h3 className="section-title">Recent Reports</h3>
                        <Link to="/admin/reports" className="view-all-link">View All</Link>
                    </div>
                    {reports.length > 0 ? (
                        reports.slice(0, 3).map(report => (
                            <Link to="/admin/reports" key={report._id} className="report-item">
                                <span className="material-icons report-item-icon">article</span>
                                <div className="report-item-details">
                                    <p className="report-item-user">{report.passenger?.fullName} reported an issue.</p>
                                    <p className="report-item-preview">Vehicle: {report.vehicle?.vehicleId || 'N/A'}</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="empty-state" style={{border: 'none', padding: '1rem 0'}}>
                            <span className="material-icons empty-icon">inbox</span>
                            <p className="empty-title" style={{fontSize: '1rem', marginTop: '0.5rem'}}>No reports submitted yet.</p>
                        </div>
                    )}
                </div>

                <div className="activity-container" style={{ animationDelay: '700ms' }}>
                  <div className="activity-header">
                    <h3 className="section-title">Recent Activity</h3>
                    <Link to="/admin/users" className="view-all-link">View All</Link>
                  </div>
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.slice(0, 4).map((activity) => {
                      const firstName = activity.fullName.split(' ')[0];
                      return (
                        <div key={activity._id} className="activity-item">
                          <img src={`https://i.pravatar.cc/150?u=${activity._id}`} alt="User Avatar" className="activity-avatar" />
                          <div>
                            <p className="activity-title"><strong>{firstName}</strong> registered as a new {activity.role}</p>
                            <p className="activity-time">{new Date(activity.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state" style={{border: 'none', padding: '2rem 0'}}>
                      <span className="material-icons empty-icon">history_toggle_off</span>
                      <p className="empty-title">No recent activities</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;