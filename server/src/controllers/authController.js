const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const signup = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Username, email and password required' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

        const allowedRoles = ['ADMIN', 'TEAM_OWNER'];
        const userRole = allowedRoles.includes(role) ? role : 'TEAM_OWNER';

        const user = await User.create({ username, email, password, role: userRole });
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: { _id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id);
        res.json({
            token,
            user: { _id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMe = async (req, res) => {
    res.json({ _id: req.user._id, username: req.user.username, email: req.user.email, role: req.user.role });
};

module.exports = { signup, login, getMe };
