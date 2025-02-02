import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db.js';

// Login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (user not found)' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials (wrong password)' });
        }

        const token = jwt.sign({ id: user.uid_users }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ token, user: { id: user.uid_users, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Logout
export const logout = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

// Request Password Reset
export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = jwt.sign({ id: user.uid_users }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        console.log(`Código de recuperación enviado al correo ${email}: ${resetToken}`);

        res.json({ message: 'Password reset token generated. Check your email.', resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    try {
        jwt.verify(resetToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await pool.query(
                'UPDATE users SET password = $1 WHERE uid_users = $2 RETURNING *',
                [hashedPassword, decoded.id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'Password reset successfully' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
