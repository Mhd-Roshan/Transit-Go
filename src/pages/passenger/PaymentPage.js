import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/payment.css';

function PaymentPage() {
  const [balance, setBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyError, setAddMoneyError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const storedTrip = localStorage.getItem('pendingTrip');
    if (storedTrip) {
      setPendingTrip(JSON.parse(storedTrip));
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [balanceRes, transactionsRes, methodsRes] = await Promise.all([
            axios.get("http://localhost:5000/api/payments/balance", { headers }),
            axios.get("http://localhost:5000/api/payments/transactions", { headers }),
            axios.get("http://localhost:5000/api/payments/methods", { headers }).catch(() => ({ data: [] }))
        ]);
        
        setBalance(balanceRes.data.balance);
        setTransactions(transactionsRes.data);
        setPaymentMethods(methodsRes.data);
      } catch (err) {
        setError("Failed to load payment data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handlePayTrip = async () => {
    if (!pendingTrip) return;
    setIsProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/payments/charge",
        { amount: pendingTrip.amount, description: `Trip to ${pendingTrip.destination}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(res.data.newBalance);
      setTransactions(prev => [res.data.newTransaction, ...prev]);
      setPendingTrip(null);
      localStorage.removeItem('pendingTrip');
      alert("Trip payment successful!");
    } catch (err) {
      setError(err.response?.data?.msg || "Payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      setAddMoneyError("Please enter a valid amount.");
      return;
    }
    setAddMoneyError('');
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/payments/add-money",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(res.data.newBalance);
      setTransactions(prev => [res.data.newTransaction, ...prev]);
      setAddMoneyAmount('');
      setShowAddMoneyModal(false);
      alert("Money added successfully!");
    } catch (err) {
      setAddMoneyError(err.response?.data?.msg || "Failed to add money.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PassengerLayout>
      <div className="payment-page-content">
        {loading ? (
          <div className="loading-indicator">
            <Spinner animation="border" variant="primary" />
            <p>Loading payment data...</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger" className="error-banner">{error}</Alert>}

            <section className="balance-section animate-fade-in">
              <div className="balance-card">
                <div className="shine-effect"></div>
                <span>Your Wallet Balance</span>
                {/* THIS H2 REMAINS UNCHANGED */}
                <h2>₹{balance.toLocaleString('en-IN')}</h2>
                <div className="balance-actions">
                  <Button variant="light" size="sm" onClick={() => setShowAddMoneyModal(true)}>
                    <span className="material-icons-outlined">add_circle_outline</span> Add Money
                  </Button>
                </div>
              </div>
            </section>

            {pendingTrip && (
              <section className="pending-section animate-fade-in">
                  {/* ... pending trip content ... */}
              </section>
            )}

            <section className="methods-section animate-fade-in" style={{animationDelay: '100ms'}}>
              {/* --- FIX: Added className="section-title" --- */}
              <h2 className="section-title">Payment Methods</h2>
              {/* ... payment methods content ... */}
            </section>

            <section className="transactions-section animate-fade-in" style={{animationDelay: '200ms'}}>
              {/* --- FIX: Added className="section-title" --- */}
              <h2 className="section-title">Transaction History</h2>
              {/* ... transaction history content ... */}
            </section>
          </>
        )}
      </div>

      <Modal show={showAddMoneyModal} onHide={() => { setShowAddMoneyModal(false); setAddMoneyError(''); setAddMoneyAmount(''); }} centered>
        {/* ... modal content ... */}
      </Modal>
    </PassengerLayout>
  );
}

export default PaymentPage;