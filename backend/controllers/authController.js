const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ActivityLog } = require('../models/index');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc Register user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email or username' });
    }

    const user = await User.create({ username, email, password });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'Account created',
      details: 'Welcome to CipherNest!',
      icon: '🎉'
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      securityScore: user.securityScore,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// @desc Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Logged in',
      details: 'Session started',
      icon: '🔐'
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      securityScore: user.securityScore,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// @desc Get current user profile
const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    securityScore: req.user.securityScore,
    createdAt: req.user.createdAt
  });
};

module.exports = { register, login, getProfile };
