import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/payment.css';

// Helper function to calculate time left for the 24-hour deadline
const calculateTimeLeft = (createdAt) => {
    if (!createdAt) return null;
    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000; // 24 hours from creation
    const now = new Date().getTime();
    const difference = deadline - now;

    if (difference <= 0) {
        return { total: 0, hours: '00', minutes: '00', seconds: '00' };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60)); // Total hours left
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return {
        total: difference,
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
    };
};

function PaymentPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('500');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [addMoneyError, setAddMoneyError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        navigate('/login');
        return;
    }

    const storedTripJSON = localStorage.getItem('pendingTrip');
    if (storedTripJSON) {
        const storedTrip = JSON.parse(storedTripJSON);
        if (!storedTrip.createdAt) {
            storedTrip.createdAt = new Date().toISOString();
            localStorage.setItem('pendingTrip', JSON.stringify(storedTrip));
        }
        setPendingTrip(storedTrip);
        setTimeLeft(calculateTimeLeft(storedTrip.createdAt));
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [balanceRes, transactionsRes] = await Promise.all([
            axios.get("http://localhost:5000/api/payments/balance", { headers }),
            axios.get("http://localhost:5000/api/payments/transactions", { headers }),
        ]);
        
        setBalance(balanceRes.data.balance);
        setTransactions(transactionsRes.data);
      } catch (err) {
        setError("Failed to load payment data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!pendingTrip?.createdAt) return;

    const timer = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(pendingTrip.createdAt);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft.total <= 0) {
            clearInterval(timer);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingTrip]);

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

  const handleAddMoney = async (e) => {
    e.preventDefault();
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
      setShowAddMoneyModal(false);
      setAddMoneyAmount('500');
      alert(res.data.message);
    } catch (err) {
      setAddMoneyError(err.response?.data?.msg || "Failed to add money.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTransactionItem = (tx) => {
    const isCredit = tx.amount > 0;
    return (
        <div key={tx._id} className="transaction-item">
            <div className={`transaction-icon ${isCredit ? 'credit' : 'debit'}`}>
                <span className="material-icons-outlined">{isCredit ? 'add' : 'remove'}</span>
            </div>
            <div className="transaction-details">
                <p>{tx.description}</p>
                <small>{new Date(tx.createdAt).toLocaleString()}</small>
            </div>
            <span className={`transaction-amount ${isCredit ? 'credit' : 'debit'}`}>
                {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
            </span>
        </div>
    );
  };

  return (
    <PassengerLayout>
      <div className="payment-page-content">
        {loading ? (
          <div className="loading-indicator"><Spinner animation="border" variant="primary" /><p>Loading payment data...</p></div>
        ) : (
          <>
            {error && <Alert variant="danger" className="error-banner">{error}</Alert>}

            <section className="balance-section animate-fade-in">
              <div className="balance-card">
                <div className="shine-effect"></div>
                <span>Your Wallet Balance</span>
                <h2>₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                <div className="balance-actions">
                  <Button variant="light" size="sm" onClick={() => setShowAddMoneyModal(true)}>
                    <span className="material-icons-outlined">add_circle_outline</span> Add Money
                  </Button>
                </div>
              </div>
            </section>

            {pendingTrip && (
              <section className="pending-section animate-fade-in">
                  <div className={`pending-card ${timeLeft?.total <= 0 ? 'expired' : ''}`}>
                    <div className="pending-header">
                        <span className="material-icons-outlined">pending_actions</span>
                        Pending Trip Payment
                    </div>
                    <div className="pending-details">
                        <p>Trip to <strong>{pendingTrip.destination}</strong></p>
                        <h4>₹{pendingTrip.amount.toFixed(2)}</h4>
                    </div>
                    
                    {timeLeft && timeLeft.total > 0 ? (
                        <div className="countdown-timer">
                            Time left to pay: <span>{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
                        </div>
                    ) : (
                        <div className="countdown-timer expired">Payment window has expired.</div>
                    )}

                    {balance >= pendingTrip.amount ? (
                      <Button 
                        className="pay-button" 
                        variant="warning" 
                        onClick={handlePayTrip} 
                        disabled={isProcessing || timeLeft?.total <= 0}
                      >
                          {isProcessing ? <Spinner size="sm" /> : 'Pay Now from Wallet'}
                      </Button>
                    ) : (
                      <div className="insufficient-balance-text">
                        Insufficient balance. <a href="#add-money" onClick={() => setShowAddMoneyModal(true)}>Add money</a> to pay.
                      </div>
                    )}
                    
                    <div className="payment-warning">
                      <span className="material-icons-outlined">warning</span>
                      {timeLeft?.total > 0
                        ? "Payment must be completed within 24 hours to avoid a fine or account suspension."
                        : "Please contact support to resolve this pending payment."
                      }
                    </div>
                  </div>
              </section>
            )}

            <section className="transactions-section animate-fade-in" style={{animationDelay: '200ms'}}>
              <h2 className="section-title">Transaction History</h2>
              {transactions.length > 0 ? (
                <div className="transaction-list">
                    {transactions.map(renderTransactionItem)}
                </div>
              ) : (
                <div className="no-transactions">
                    <p>No transactions yet.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal show={showAddMoneyModal} onHide={() => setShowAddMoneyModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Money to Wallet</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddMoney}>
          <Modal.Body>
              {addMoneyError && <Alert variant="danger">{addMoneyError}</Alert>}
              <Form.Group className="mb-3">
                  <Form.Label>Amount (₹)</Form.Label>
                  <Form.Control type="number" step="100" min="100" value={addMoneyAmount} onChange={e => setAddMoneyAmount(e.target.value)} required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Payment Method</Form.Label>
                <Form.Select value={selectedPaymentMethod} onChange={e => setSelectedPaymentMethod(e.target.value)}>
                    <option value="upi">UPI (GPay, PhonePe, etc.)</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="netbanking">Net Banking</option>
                </Form.Select>
              </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddMoneyModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isProcessing}>
              {isProcessing ? <Spinner size="sm" /> : `Add ₹${addMoneyAmount || 0}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </PassengerLayout>
  );
}

export default PaymentPage;