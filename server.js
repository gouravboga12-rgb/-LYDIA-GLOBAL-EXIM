import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'lydia_global_exim_771892348_purity_secure';

app.use(cors());
app.use(express.json());

// Persistent Local User & Address Store (JSON File DB)
const DB_DIR = path.join(__dirname, 'server_data');
const USERS_FILE = path.join(DB_DIR, 'users.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading users DB:', e);
  }
  return [];
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users DB:', e);
  }
}

// Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || 'lydiaglobalexim@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'ihcyjxmdovruxtql',
  },
});

// Verify SMTP Connection on Startup
transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️  SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Transporter Ready: lydiaglobalexim@gmail.com');
  }
});

// OTP In-Memory Storage (with 10 min TTL)
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send Account Sign Up OTP Email
 */
async function sendSignupOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Verify Your Email ✨ | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1ece1;">
          <h1 style="color: #060B19; margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; font-weight: 700;">
            LYDIA GLOBAL EXIM
          </h1>
          <p style="color: #c6a184; margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
            Premium Stainless Steel PVD Gold Plated Jewelry
          </p>
        </div>

        <h2 style="color: #060B19; text-align: center; font-size: 20px; margin: 0 0 16px 0;">Verify Your Email Address ✨</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Thank you for creating an account with <strong>Lydia Global Exim</strong>. Please enter the verification code below to complete your registration:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #060B19; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 8px 0;">
          ⏱️ This code will expire in <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 4px 0;">
          🔒 For your security, do not share this code with anyone.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 24px;">
          If you did not request this account registration, you can safely ignore this email.
        </p>

        <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1ece1;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #060B19;">Team Lydia Global Exim</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
            <a href="mailto:lydiaglobalexim@gmail.com" style="color: #b38827; text-decoration: none; font-weight: 600;">lydiaglobalexim@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Lydia Global Exim. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
  return await transporter.sendMail(mailOptions);
}

/**
 * Send Forgot Password Reset OTP Email
 */
async function sendForgotPasswordOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Password Reset Code 🔐 | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1ece1;">
          <h1 style="color: #060B19; margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; font-weight: 700;">
            LYDIA GLOBAL EXIM
          </h1>
          <p style="color: #c6a184; margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
            Premium Stainless Steel PVD Gold Plated Jewelry
          </p>
        </div>

        <h2 style="color: #060B19; text-align: center; font-size: 20px; margin: 0 0 16px 0;">Reset Your Password 🔐</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          We received a request to reset the password for your <strong>Lydia Global Exim</strong> account. Use the one-time verification code below to set a new password:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #060B19; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 8px 0;">
          ⏱️ This code is valid for <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 13px; line-height: 1.5; color: #dc2626; text-align: center; font-weight: 600; margin: 4px 0;">
          ⚠️ Never share this OTP with anyone, including Lydia Global Exim staff.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 24px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1ece1;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #060B19;">Team Lydia Global Exim</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
            <a href="mailto:lydiaglobalexim@gmail.com" style="color: #b38827; text-decoration: none; font-weight: 600;">lydiaglobalexim@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Lydia Global Exim. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
  return await transporter.sendMail(mailOptions);
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is expired or invalid.' });
  }
}

// ==========================================
// AUTH ROUTES
// ==========================================

// 1. Sign Up - Sends OTP to Email
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password, country } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = loadUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(password, 10);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email.toLowerCase(), {
    type: 'signup',
    otp,
    expiresAt,
    userData: {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      country: country || 'India',
      role: ['gouravboga12@gmail.com', 'lydiaglobalexim@gmail.com'].includes(email.toLowerCase()) ? 'admin' : 'customer',
      addresses: [],
      orders: [],
      created_at: new Date().toISOString(),
    },
  });

  try {
    await sendSignupOTPEmail(email, otp, name);
    console.log(`✉️ Signup OTP sent to ${email}: [${otp}]`);
    return res.json({ success: true, message: 'Verification OTP sent to your email.' });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    // Fallback if SMTP has network error, return OTP in dev log
    return res.status(500).json({ error: `Failed to send email OTP: ${err.message}` });
  }
});

// 2. Verify Phone OTP (Pass-through for multi-step)
app.post('/api/auth/verify-phone-otp', (req, res) => {
  return res.json({ success: true, message: 'Phone verified.' });
});

// 3. Verify Email OTP & Create User
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const record = otpStore.get(email.toLowerCase());
  if (!record || record.type !== 'signup') {
    return res.status(400).json({ error: 'No pending sign up found for this email. Please sign up again.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
  }

  const users = loadUsers();
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    ...record.userData,
  };

  users.push(newUser);
  saveUsers(users);
  otpStore.delete(email.toLowerCase());

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      country: newUser.country,
      role: newUser.role,
    },
  });
});

// 4. Login with Email + Password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      country: user.country,
      role: user.role,
    },
  });
});

// 5. Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { idToken, phone, country } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google token is required.' });
  }

  try {
    // Fetch Google User Profile using token
    let gUser = null;
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (gRes.ok) {
      gUser = await gRes.json();
    } else {
      // Try tokeninfo endpoint
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (tokenInfoRes.ok) {
        gUser = await tokenInfoRes.json();
      }
    }

    if (!gUser || !gUser.email) {
      return res.status(400).json({ error: 'Failed to verify Google account details.' });
    }

    const email = gUser.email.toLowerCase();
    const name = gUser.name || gUser.given_name || 'Google User';

    const users = loadUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      user = {
        id: 'usr_g_' + Date.now(),
        email,
        name,
        phone: phone || '',
        country: country || 'India',
        password: '',
        role: ['gouravboga12@gmail.com', 'lydiaglobalexim@gmail.com'].includes(email) ? 'admin' : 'customer',
        addresses: [],
        orders: [],
        created_at: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);
    } else {
      if (phone && !user.phone) user.phone = phone;
      if (country && !user.country) user.country = country;
      saveUsers(users);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        country: user.country,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google OAuth backend error:', err);
    return res.status(500).json({ error: 'Google Login processing failed.' });
  }
});

// 6. Forgot Password - Send Reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(email.toLowerCase(), {
    type: 'forgot_password',
    otp,
    expiresAt,
  });

  try {
    await sendForgotPasswordOTPEmail(email, otp, user.name);
    console.log(`🔐 Forgot Password OTP sent to ${email}: [${otp}]`);
    return res.json({ success: true, message: 'Password reset OTP sent to your email.' });
  } catch (err) {
    console.error('Failed to send reset email:', err);
    return res.status(500).json({ error: `Failed to send reset email: ${err.message}` });
  }
});

// 7. Reset Password with OTP
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
  }

  const record = otpStore.get(email.toLowerCase());
  if (!record || record.type !== 'forgot_password') {
    return res.status(400).json({ error: 'No reset request found for this email.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid OTP code.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  otpStore.delete(email.toLowerCase());

  return res.json({ success: true, message: 'Password has been reset successfully.' });
});

// 8. User Profile & Addresses
app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      country: user.country,
      role: user.role,
    },
    addresses: user.addresses || [],
    orders: user.orders || [],
  });
});

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { name, phone, country } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (country) user.country = country;

  saveUsers(users);
  return res.json({ success: true, user });
});

// Address CRUD
app.post('/api/auth/address', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const newAddress = {
    id: 'addr_' + Date.now(),
    ...req.body,
  };

  user.addresses = user.addresses || [];
  if (newAddress.is_default) {
    user.addresses = user.addresses.map(a => ({ ...a, is_default: false }));
  }
  user.addresses.push(newAddress);
  saveUsers(users);

  return res.json({ success: true, address: newAddress });
});

app.put('/api/auth/address/:id', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const id = req.params.id;
  user.addresses = (user.addresses || []).map(a => {
    if (a.id === id) {
      return { ...a, ...req.body };
    }
    if (req.body.is_default) {
      return { ...a, is_default: false };
    }
    return a;
  });

  saveUsers(users);
  const updated = user.addresses.find(a => a.id === id);
  return res.json({ success: true, address: updated });
});

app.delete('/api/auth/address/:id', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.addresses = (user.addresses || []).filter(a => a.id !== req.params.id);
  saveUsers(users);
  return res.json({ success: true });
});

// Shipping Settings
app.get('/api/general/shipping', (req, res) => {
  return res.json({
    settings: {
      allowed_countries: [],
      default_shipping_cost: 0,
      free_shipping_threshold: 0,
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'Lydia Global Exim', timestamp: new Date().toISOString() });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Lydia Global Exim Backend API running on http://localhost:${PORT}`);
  });
}

export default app;
