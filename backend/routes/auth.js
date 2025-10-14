import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the main User model

const router = express.Router();

// @route   POST api/auth/signup
// @desc    Register a new user (Passenger or Operator)
// @access  Public
router.post('/signup', async (req, res) => {
  // Destructure all required fields from the request body
  const { fullName, email, password, role, phoneNumber } = req.body;

  // Basic validation to ensure all fields are present
  if (!fullName || !email || !password || !role || !phoneNumber) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  try {
    // Check if a user with the given email already exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }
    
    // Check if a user with the given phone number already exists
    if (await User.findOne({ phoneNumber })) {
      return res.status(400).json({ msg: 'User with this phone number already exists' });
    }

    // Create a new user instance
    const newUser = new User({
      fullName,
      email,
      password,
      role,
      phoneNumber,
      // Set the status based on the role. Operators must be approved by an admin.
      status: role === 'Operator' ? 'Pending' : 'Approved',
    });
    
    // Save password as provided (no hashing)
    // Save the new user to the database
    await newUser.save();

    // Send a success response
    res.status(201).json({ msg: 'Registration successful! You will be redirected to log in.' });

  } catch (err) {
    console.error("Signup Server Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate any valid user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by their email address
        const user = await User.findOne({ email });
        if (!user) {
            // Use a generic message to prevent revealing which emails are registered
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Compare provided password with stored password (no hashing)
        const isMatch = password === user.password;
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // If the user is an Operator, check if their account has been approved
        if (user.role === 'Operator' && user.status !== 'Approved') {
            return res.status(403).json({ msg: 'Your account is pending approval by an administrator.' });
        }
        
        // Create the payload for the JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                fullName: user.fullName
            },
        };

        // Sign the token, set it to expire in 1 hour
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'jwtSecret', // Use environment variable for secret
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                // Send the token back to the client
                res.json({ token });
            }
        );
    } catch (err) {
        console.error("Login Server Error:", err.message);
        res.status(500).send('Server Error');
    }
});

export default router;