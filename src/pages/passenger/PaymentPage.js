import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form, Alert } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PassengerBottomNav from '../../components/PassengerBottomNav';
import '../../styles/payment.css'; // Ensure this path is correct

// Assuming your ModernPassengerHeader from HomePage looks something like this
const ModernPassengerHeader = ({ user, onLogout }) => (
  <div className="header-container">
    <header className="passenger-header">
      <div className="user-info">
        {/* Placeholder: Replace with actual user info JSX from HomePage */}
        <span className="material-icons profile-icon">account_circle</span>
        <span>Welcome, {user ? user.name.split(' ')[0] : 'Guest'}</span>
      </div>
      <button onClick={onLogout} className="header-action-btn" title="Logout">
        <span className="material-icons">logout</span>
      </button>
    </header>
  </div>
);


function PaymentPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyError, setAddMoneyError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // For trip payment

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUser({ name: decodedToken.user.fullName, id: decodedToken.user.id });
    } catch (err) {
      console.error("Failed to decode token:", err);
      localStorage.removeItem("token");
      navigate('/login');
      return;
    }

    const storedTrip = localStorage.getItem('pendingTrip');
    if (storedTrip) {
      setPendingTrip(JSON.parse(storedTrip));
    }

    // --- THIS ENTIRE FUNCTION IS THE FIX ---
    const fetchData = async () => {
      setLoading(true);
      setError(''); // Clear previous errors
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch critical data first. If these fail, we show a general error.
        const balanceRes = await axios.get("http://localhost:5000/api/payments/balance", { headers });
        setBalance(balanceRes.data.balance);
        
        const transactionsRes = await axios.get("http://localhost:5000/api/payments/transactions", { headers });
        setTransactions(transactionsRes.data);

        // Fetch non-critical data in its own try-catch. If this fails, the page still loads.
        try {
          const methodsRes = await axios.get("http://localhost:5000/api/payments/methods", { headers });
          setPaymentMethods(methodsRes.data);
        } catch (methodsError) {
          console.warn("Could not fetch payment methods, but the page will still render.", methodsError);
          setPaymentMethods([]); // Default to an empty array so the .map() doesn't break
        }

      } catch (err) {
        console.error("Error fetching critical payment data:", err);
        setError("Failed to load payment data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePayTrip = async () => {
    if (!pendingTrip) return;
    setIsProcessingPayment(true);
    setError(''); // Clear previous errors
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/payments/charge",
        { amount: pendingTrip.amount, description: `Trip to ${pendingTrip.destination}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBalance(res.data.newBalance);
      setTransactions([res.data.newTransaction, ...transactions]);
      setPendingTrip(null);
      localStorage.removeItem('pendingTrip');
      alert("Trip payment successful!");
    } catch (err) {
      console.error("Trip payment failed:", err);
      const errorMessage = err.response?.data?.msg || "Payment failed. Please check your balance.";
      setError(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      setAddMoneyError("Please enter a valid amount.");
      return;
    }

    setAddMoneyError('');
    setIsProcessingPayment(true); // Reusing this for any processing
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/payments/add-money", // NEW: Assuming this endpoint
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(res.data.newBalance);
      setTransactions([res.data.newTransaction, ...transactions]); // Add new transaction
      setAddMoneyAmount('');
      setShowAddMoneyModal(false);
      alert("Money added to wallet successfully!");
    } catch (err) {
      console.error("Add money failed:", err);
      setAddMoneyError(err.response?.data?.msg || "Failed to add money. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="payment-page">
      <ModernPassengerHeader user={user} onLogout={handleLogout} />

      <main className="payment-main animate-fade-in">
        {loading ? (
          <div className="loading-indicator">
            <Spinner animation="border" variant="primary" />
            <p>Loading payment data...</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger" className="error-banner">{error}</Alert>}

            <section className="balance-section">
              <div className="balance-card">
                <div className="shine-effect"></div>
                <span>Your Wallet Balance</span>
                <h2>₹{balance.toLocaleString('en-IN')}</h2>
                <div className="balance-actions">
                  <Button variant="light" size="sm" onClick={() => setShowAddMoneyModal(true)}>
                    <span className="material-icons-outlined">add_circle_outline</span> Add Money
                  </Button>
                </div>
              </div>
            </section>

            {pendingTrip && (
              <section className="pending-section">
                <div className="pending-card">
                  <div className="pending-header">
                    <span className="material-icons">directions_bus</span>
                    <span>Pending Trip Payment</span>
                  </div>
                  <div className="pending-details">
                    <p>Trip to <strong>{pendingTrip.destination}</strong></p>
                    <h4>₹{pendingTrip.amount.toFixed(2)}</h4>
                  </div>
                  <Button
                    variant="success"
                    className="w-100 pay-button"
                    onClick={handlePayTrip}
                    disabled={isProcessingPayment || balance < pendingTrip.amount} // Disable if processing or insufficient balance
                  >
                    {isProcessingPayment ? <Spinner as="span" animation="border" size="sm" /> : 'Pay From Wallet'}
                    {balance < pendingTrip.amount && !isProcessingPayment && " (Insufficient Balance)"}
                  </Button>
                  {balance < pendingTrip.amount && !isProcessingPayment && (
                     <p className="insufficient-balance-text mt-2">
                        You need ₹{(pendingTrip.amount - balance).toFixed(2)} more.
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowAddMoneyModal(true); }}> Add money now.</a>
                     </p>
                  )}
                </div>
              </section>
            )}

            <section className="methods-section">
              <h2>Payment Methods</h2>
              {paymentMethods.length > 0 ? (
                paymentMethods.map(card => (
                  <div key={card._id} className="method-card">
                    <div className="method-icon" style={{ backgroundColor: '#1e88e5' }}>
                      <span className="material-icons">credit_card</span>
                    </div>
                    <div className="method-details">
                      <h4>{card.cardType}</h4>
                      <p>**** **** **** {card.last4}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="method-card add-method">
                  <span className="material-icons add-icon">add_circle_outline</span>
                  <span>Add New Method</span>
                </div>
              )}
            </section>

            <section className="transactions-section">
              <h2>Transaction History</h2>
              {transactions.length > 0 ? (
                <div className="transaction-list">
                  {transactions.map(tx => (
                    <div key={tx._id} className="transaction-item">
                      <div className="transaction-icon">
                        <span className="material-icons">
                          {tx.type === 'credit' ? 'add_circle' : 'remove_circle'}
                        </span>
                      </div>
                      <div className="transaction-details">
                        <p>{tx.description}</p>
                        <small>{new Date(tx.createdAt).toLocaleString()}</small>
                      </div>
                      <span className={`transaction-amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                        {tx.type === 'credit' ? '+ ' : '- '}₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-transactions">No recent transactions.</p>
              )}
            </section>
          </>
        )}
      </main>

      <PassengerBottomNav />

      {/* Add Money Modal */}
      <Modal show={showAddMoneyModal} onHide={() => { setShowAddMoneyModal(false); setAddMoneyError(''); setAddMoneyAmount(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Money to Wallet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addMoneyError && <Alert variant="danger">{addMoneyError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Amount to Add (₹)</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 500"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAddMoneyModal(false); setAddMoneyError(''); setAddMoneyAmount(''); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddMoney} disabled={isProcessingPayment}>
            {isProcessingPayment ? <Spinner as="span" animation="border" size="sm" /> : 'Add Money'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PaymentPage;