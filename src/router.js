// src/router.js

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import LandingPage from "./pages/LandingPage.js";  
import LoginPage from "./pages/login.js";
import SignupPage from "./pages/signup.js";

// Passenger Pages (from the 'passenger' subfolder)
import HomePage from "./pages/passenger/Home.js"; 
import TimingsPage from "./pages/passenger/TimingsPage.js";
import PaymentPage from "./pages/passenger/PaymentPage.js";
import HistoryPage from "./pages/passenger/HistoryPage.js";
import ReportPage from "./pages/passenger/ReportPage.js";

// Operator Pages (from the 'operator' subfolder)
import OperatorDashboard from "./pages/operator/Dashboard.js";
import OperatorRoutesPage from "./pages/operator/OperatorRoutesPage.js";
import OperatorLayout from "./layouts/OperatorLayout.js";

// Admin Pages (from the 'admin' subfolder)
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.js";
import UserManagementPage from "./pages/admin/UserManagementPage.js";
import AssignOperatorsPage from "./pages/admin/AssignOperatorsPage.js";
import Vehicle from "./pages/admin/Vehicle.js";
import Faresmgt from "./pages/admin/Faresmgt.js";
import ViewReportsPage from "./pages/admin/ViewReportsPage.js";

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        

        {/* --- PASSENGER ROUTES --- */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/timings" element={<TimingsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
         <Route path="/history" element={<HistoryPage />} /> 
         <Route path="/report" element={<ReportPage />} /> 

        {/* --- OPERATOR ROUTES --- */}
        <Route path="/operator" element={<OperatorLayout />}>
          <Route path="dashboard" element={<OperatorDashboard />} />
          <Route path="routes" element={<OperatorRoutesPage />} />
        </Route>
       
        
        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/operators" element={<AssignOperatorsPage />} />
        <Route path="/admin/vehicles" element={<Vehicle />} />
        <Route path="/admin/fares" element={<Faresmgt />} />
        <Route path="/admin/reports" element={<ViewReportsPage />} />
        
        {/* --- REDIRECTS & FALLBACK --- */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;