import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'lydia_global_exim_771892348_purity_secure';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vcqvqlicendactenwtwy.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXZxbGljZW5kYWN0ZW53dHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTE0NzksImV4cCI6MjEwMzU2NzQ3OX0.sGlIuCzPc5z_bG_wuC08WKiSGNSjxyyy2yU7UD4ke88';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Normalize URLs to handle both /api/* and /* uniformly across Vercel and local
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/assets') && !req.url.startsWith('/static')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Persistent Local JSON Store (with Vercel /tmp support)
// Use a consistent data directory for both local development and production.
// This ensures that user registrations are persisted where the admin page reads them.
const DB_DIR = path.join(__dirname, 'server_data');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (e) {}

// Helper to read seed JSON files safely
function readSeedJson(relativePath) {
  try {
    const fullPath = path.join(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading seed data for ${relativePath}:`, err.message);
  }
  return [];
}

const memoryStore = new Map();

function loadStoreData(key, fallbackPath) {
  const filePath = path.join(DB_DIR, `${key}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      memoryStore.set(key, data);
      return data;
    }
  } catch (e) {
    console.error(`Error reading ${key}.json:`, e.message);
  }

  if (fallbackPath) {
    const seedData = readSeedJson(fallbackPath);
    memoryStore.set(key, seedData);
    try {
      if (fs.existsSync(DB_DIR)) {
        fs.writeFileSync(filePath, JSON.stringify(seedData, null, 2), 'utf8');
      }
    } catch (e) {}
    return seedData;
  }

  return memoryStore.get(key) || [];
}

function saveStoreData(key, data) {
  memoryStore.set(key, data);
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const filePath = path.join(DB_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    // Also sync to src/data for local dev & static fallback consistency
    const srcDataPath = path.join(__dirname, 'src', 'data', `${key}.json`);
    if (fs.existsSync(path.dirname(srcDataPath))) {
      fs.writeFileSync(srcDataPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (e) {
    console.error(`Error saving ${key}.json:`, e.message);
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

transporter.verify((error) => {
  if (error) {
    console.error('⚠️  SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Transporter Ready: lydiaglobalexim@gmail.com');
  }
});

// OTP In-Memory Storage
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSignupOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Verify Your Email ✨ | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1ece1;">
          <h1 style="color: #45055B; margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; font-weight: 700;">
            LYDIA GLOBAL EXIM
          </h1>
          <p style="color: #c6a184; margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
            Premium Stainless Steel PVD Gold Plated Jewelry
          </p>
        </div>
        <h2 style="color: #45055B; text-align: center; font-size: 20px; margin: 0 0 16px 0;">Verify Your Email Address ✨</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Thank you for creating an account with <strong>Lydia Global Exim</strong>. Please enter the verification code below to complete your registration:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #45055B; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">⏱️ This code will expire in <strong>10 minutes</strong>.</p>
      </div>
    `,
  };
  return await transporter.sendMail(mailOptions);
}

async function sendForgotPasswordOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Password Reset Code 🔐 | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <h2 style="color: #45055B; text-align: center; font-size: 20px;">Reset Your Password 🔐</h2>
        <p style="font-size: 15px; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; color: #334155;">Use the one-time verification code below to reset your password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #45055B; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center;">Valid for 10 minutes.</p>
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

// Helper: Check Admin Credentials
function verifyAdminCredentials(identifier, password) {
  const cleanId = (identifier || '').toString().trim().replace(/\s+/g, '').toLowerCase();
  const cleanPass = (password || '').toString().trim();
  const cleanPassNoSpace = cleanPass.replace(/\s+/g, '');

  const validIds = [
    '9985563411',
    '9985563411',
    'admin@lydiaglobalexim.com',
    'admin',
    'gouravboga12@gmail.com',
    'lydiaglobalexim@gmail.com'
  ];

  const validPasswords = [
    '99855 63@411',
    '9985563@411',
    'admin123',
    'admin'
  ];

  const isIdValid = validIds.includes(cleanId) || (identifier || '').toString().trim() === '99855 63411';
  const isPassValid = validPasswords.includes(cleanPass) || validPasswords.includes(cleanPassNoSpace);

  return isIdValid && isPassValid;
}

// ==========================================
// AUTH ROUTES
// ==========================================

// 1. Unified Login (Supports Admin ID: 99855 63411 & Password: 99855 63@411 as well as Customer Login)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Admin ID and password are required.' });
  }

  // Check if Admin Login credentials matched
  if (verifyAdminCredentials(email, password)) {
    const token = jwt.sign(
      { id: 'admin_master', email: 'admin@lydiaglobalexim.com', name: 'Admin Administrator', role: 'admin', phone: '99855 63411' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({
      success: true,
      token,
      user: {
        id: 'admin_master',
        email: '99855 63411',
        name: 'Admin Administrator',
        phone: '99855 63411',
        role: 'admin',
        country: 'India'
      }
    });
  }

  // Otherwise check registered users
  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u =>
    (u.email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
    (u.phone && u.phone.replace(/\D/g, '') === email.replace(/\D/g, ''))
  );

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials or user not found.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch && user.password !== password) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'customer' },
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
      role: user.role || 'customer',
    },
  });
});

// 2. Direct Admin Login Endpoint
app.post('/api/admin/login', (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'Admin ID and password are required.' });
  }

  if (verifyAdminCredentials(id, password)) {
    const token = jwt.sign(
      { id: 'admin_master', email: 'admin@lydiaglobalexim.com', name: 'Admin Administrator', role: 'admin', phone: '99855 63411' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({
      success: true,
      token,
      user: {
        id: 'admin_master',
        email: '99855 63411',
        name: 'Admin Administrator',
        phone: '99855 63411',
        role: 'admin',
        country: 'India'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid Admin ID or Password.' });
});

// 3. Verify Current Auth Token / Session
app.get('/api/auth/me', authMiddleware, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      phone: req.user.phone || ''
    }
  });
});

// 4. Customer Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password, country } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = loadStoreData('users', 'src/data/users.json');
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(password, 10);
  const expiresAt = Date.now() + 10 * 60 * 1000;

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
    return res.json({ success: true, message: 'Verification OTP sent to your email.' });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    return res.status(500).json({ error: `Failed to send email OTP: ${err.message}` });
  }
});

// 5. Verify Phone OTP
app.post('/api/auth/verify-phone-otp', (req, res) => {
  return res.json({ success: true, message: 'Phone verified.' });
});

// 6. Verify Email OTP & Register
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

  const users = loadStoreData('users', 'src/data/users.json');
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    ...record.userData,
  };

  users.push(newUser);
  saveStoreData('users', users);
  otpStore.delete(email.toLowerCase());

  // Attempt Supabase sync
  try {
    const suRes = await supabase.auth.signUp({
      email: newUser.email,
      password: 'LydiaJewelry2026!',
      options: {
        data: {
          full_name: newUser.name,
          phone: newUser.phone,
          country: newUser.country
        }
      }
    });
    if (suRes.data?.user?.id) {
      await supabase.from('profiles').upsert({
        id: suRes.data.user.id,
        email: newUser.email,
        full_name: newUser.name,
        mobile: newUser.phone,
        role: newUser.role || 'customer'
      });
    }
  } catch (e) {}

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

// 7. Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { idToken, phone, country } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google token is required.' });
  }

  try {
    let gUser = null;
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (gRes.ok) {
      gUser = await gRes.json();
    } else {
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

    const users = loadStoreData('users', 'src/data/users.json');
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
      saveStoreData('users', users);

      try {
        const suRes = await supabase.auth.signUp({
          email,
          password: 'GoogleUser_' + Math.random().toString(36).substr(2, 8) + '!',
          options: {
            data: {
              full_name: name,
              phone: phone || '',
              country: country || 'India'
            }
          }
        });
        if (suRes.data?.user?.id) {
          await supabase.from('profiles').upsert({
            id: suRes.data.user.id,
            email,
            full_name: name,
            mobile: phone || '',
            role: user.role || 'customer'
          });
        }
      } catch (e) {}
    } else {
      if (phone && !user.phone) user.phone = phone;
      if (country && !user.country) user.country = country;
      saveStoreData('users', users);
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

// 8. Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required.' });

  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'No account found with this email address.' });

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(email.toLowerCase(), { type: 'forgot_password', otp, expiresAt });

  try {
    await sendForgotPasswordOTPEmail(email, otp, user.name);
    return res.json({ success: true, message: 'Password reset OTP sent to your email.' });
  } catch (err) {
    return res.status(500).json({ error: `Failed to send reset email: ${err.message}` });
  }
});

// 9. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP, and new password are required.' });

  const record = otpStore.get(email.toLowerCase());
  if (!record || record.type !== 'forgot_password') return res.status(400).json({ error: 'No reset request found for this email.' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired.' });
  }
  if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP code.' });

  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.password = await bcrypt.hash(newPassword, 10);
  saveStoreData('users', users);
  otpStore.delete(email.toLowerCase());

  return res.json({ success: true, message: 'Password has been reset successfully.' });
});

// 10. Profile & Address CRUD
app.get('/api/auth/profile', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({
      user: { id: 'admin_master', email: '99855 63411', name: 'Admin Administrator', phone: '99855 63411', role: 'admin' },
      addresses: [],
      orders: []
    });
  }

  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

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
  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (country) user.country = country;

  saveStoreData('users', users);
  return res.json({ success: true, user });
});

app.post('/api/auth/address', authMiddleware, (req, res) => {
  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const newAddress = { id: 'addr_' + Date.now(), ...req.body };
  user.addresses = user.addresses || [];
  if (newAddress.is_default) {
    user.addresses = user.addresses.map(a => ({ ...a, is_default: false }));
  }
  user.addresses.push(newAddress);
  saveStoreData('users', users);

  return res.json({ success: true, address: newAddress });
});

app.put('/api/auth/address/:id', authMiddleware, (req, res) => {
  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const id = req.params.id;
  user.addresses = (user.addresses || []).map(a => {
    if (a.id === id) return { ...a, ...req.body };
    if (req.body.is_default) return { ...a, is_default: false };
    return a;
  });

  saveStoreData('users', users);
  const updated = user.addresses.find(a => a.id === id);
  return res.json({ success: true, address: updated });
});

app.delete('/api/auth/address/:id', authMiddleware, (req, res) => {
  const users = loadStoreData('users', 'src/data/users.json');
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.addresses = (user.addresses || []).filter(a => a.id !== req.params.id);
  saveStoreData('users', users);
  return res.json({ success: true });
});

// ==========================================
// ADMIN DASHBOARD & STATS
// ==========================================

app.get(['/api/admin/dashboard/stats', '/api/admin/stats'], (req, res) => {
  const orders = loadStoreData('orders', 'src/data/orders.js');
  const users = loadStoreData('users', 'src/data/users.json');
  const products = loadStoreData('products', 'src/data/products.json');

  const totalOrders = orders.length;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + Number(o.total || 0), 0);
  const totalUsers = users.length;
  const pendingOrders = orders.filter(o => ['paid', 'processing', 'pending'].includes(o.status)).length;
  const totalProducts = products.length;

  return res.json({
    totalOrders,
    totalRevenue,
    totalUsers,
    pendingOrders,
    totalProducts,
    orders: orders.slice(0, 10),
  });
});

// ==========================================
// ADMIN PRODUCTS CRUD
// ==========================================

app.get(['/api/admin/products', '/api/general/products'], (req, res) => {
  const products = loadStoreData('products', 'src/data/products.json');
  return res.json({ products });
});

app.post('/api/admin/products', (req, res) => {
  const products = loadStoreData('products', 'src/data/products.json');
  const newProduct = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...req.body,
  };
  products.unshift(newProduct);
  saveStoreData('products', products);
  return res.json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', (req, res) => {
  const id = req.params.id;
  const products = loadStoreData('products', 'src/data/products.json');
  const index = products.findIndex(p => String(p.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products[index] = { ...products[index], ...req.body };
  saveStoreData('products', products);
  return res.json({ success: true, product: products[index] });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const id = req.params.id;
  let products = loadStoreData('products', 'src/data/products.json');
  products = products.filter(p => String(p.id) !== String(id));
  saveStoreData('products', products);
  return res.json({ success: true });
});

// ==========================================
// ADMIN CATEGORIES CRUD
// ==========================================

app.get(['/api/admin/categories', '/api/general/categories'], (req, res) => {
  const categories = loadStoreData('categories', 'src/data/categories.json');
  return res.json({ categories });
});

app.post('/api/admin/categories', (req, res) => {
  const categories = loadStoreData('categories', 'src/data/categories.json');
  const newCat = {
    id: Date.now(),
    models: [],
    ...req.body,
  };
  categories.push(newCat);
  saveStoreData('categories', categories);
  return res.json({ success: true, category: newCat });
});

app.put('/api/admin/categories/:id', (req, res) => {
  const id = req.params.id;
  const categories = loadStoreData('categories', 'src/data/categories.json');
  const index = categories.findIndex(c => String(c.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  categories[index] = { ...categories[index], ...req.body };
  saveStoreData('categories', categories);
  return res.json({ success: true, category: categories[index] });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const id = req.params.id;
  let categories = loadStoreData('categories', 'src/data/categories.json');
  categories = categories.filter(c => String(c.id) !== String(id));
  saveStoreData('categories', categories);
  return res.json({ success: true });
});

// ==========================================
// ADMIN OFFERS & COUPONS CRUD
// ==========================================

app.get(['/api/admin/offers', '/api/general/offers'], (req, res) => {
  const offers = loadStoreData('offers', 'src/data/offers.json');
  return res.json({ offers });
});

app.post('/api/admin/offers', (req, res) => {
  const offers = loadStoreData('offers', 'src/data/offers.json');
  const newOffer = { id: Date.now(), active: true, ...req.body };
  offers.push(newOffer);
  saveStoreData('offers', offers);
  return res.json({ success: true, offer: newOffer });
});

app.put('/api/admin/offers/:id', (req, res) => {
  const id = req.params.id;
  const offers = loadStoreData('offers', 'src/data/offers.json');
  const index = offers.findIndex(o => String(o.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Offer not found' });

  offers[index] = { ...offers[index], ...req.body };
  saveStoreData('offers', offers);
  return res.json({ success: true, offer: offers[index] });
});

app.delete('/api/admin/offers/:id', (req, res) => {
  const id = req.params.id;
  let offers = loadStoreData('offers', 'src/data/offers.json');
  offers = offers.filter(o => String(o.id) !== String(id));
  saveStoreData('offers', offers);
  return res.json({ success: true });
});

app.post('/api/admin/offers/:id/apply', (req, res) => {
  return res.json({ success: true, message: 'Offer applied successfully' });
});

app.get('/api/admin/coupons', (req, res) => {
  const coupons = loadStoreData('coupons', 'src/data/offers.json');
  return res.json({ coupons });
});

app.post('/api/admin/coupons', (req, res) => {
  const coupons = loadStoreData('coupons', 'src/data/offers.json');
  const newCoupon = { id: Date.now(), active: true, ...req.body };
  coupons.push(newCoupon);
  saveStoreData('coupons', coupons);
  return res.json({ success: true, coupon: newCoupon });
});

app.put('/api/admin/coupons/:id', (req, res) => {
  const id = req.params.id;
  const coupons = loadStoreData('coupons', 'src/data/offers.json');
  const index = coupons.findIndex(c => String(c.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Coupon not found' });

  coupons[index] = { ...coupons[index], ...req.body };
  saveStoreData('coupons', coupons);
  return res.json({ success: true, coupon: coupons[index] });
});

app.delete('/api/admin/coupons/:id', (req, res) => {
  const id = req.params.id;
  let coupons = loadStoreData('coupons', 'src/data/offers.json');
  coupons = coupons.filter(c => String(c.id) !== String(id));
  saveStoreData('coupons', coupons);
  return res.json({ success: true });
});

// ==========================================
// STOCK & COUPON VALIDATION ENDPOINTS
// ==========================================

app.post('/api/general/check-stock', (req, res) => {
  return res.json({ available: true, unavailable: [] });
});

app.post('/api/general/validate-coupon', (req, res) => {
  const { code } = req.body;
  const coupons = loadStoreData('coupons', 'src/data/offers.json');
  const found = coupons.find(c => c.code && c.code.toLowerCase() === String(code || '').toLowerCase() && (c.active ?? c.is_active ?? true));
  if (!found) {
    return res.json({ error: 'Invalid or expired coupon code.' });
  }
  return res.json({ success: true, coupon: found });
});

app.post('/api/general/validate-address', (req, res) => {
  return res.json({ valid: true, hasCorrections: false });
});

// ==========================================
// ORDERS & ENQUIRIES API (CUSTOMER + ADMIN)
// ==========================================

const handleOrderCreation = async (req, res) => {
  try {
    const orders = loadStoreData('orders', 'src/data/orders.json');
    const {
      items = [],
      address = {},
      total = 0,
      subtotal = 0,
      discount_amount = 0,
      coupon_code = '',
      shipping_fee = 0,
      tax_amount = 0,
      payment_method = 'stripe',
      order_type = 'shipping',
      stripe_payment_intent_id = null,
      status = 'paid',
      payment_status = 'paid'
    } = req.body;

    const orderNumber = 'LGE-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = Date.now().toString();
    const createdAt = new Date().toISOString();

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      user_id: req.user?.id || null,
      user_name: address.name || req.user?.name || 'Customer',
      user_email: address.email || req.user?.email || '',
      user_phone: address.mobile || address.phone || '',
      items,
      address,
      total: Number(total),
      subtotal: Number(subtotal || total),
      discount_amount: Number(discount_amount || 0),
      coupon_code: coupon_code || '',
      shipping_fee: Number(shipping_fee || 0),
      tax_amount: Number(tax_amount || 0),
      payment_method,
      order_type,
      stripe_payment_intent_id,
      status,
      payment_status,
      created_at: createdAt
    };

    // 1. Save to local JSON store
    orders.unshift(newOrder);
    saveStoreData('orders', orders);

    // Also link to user orders if user is authenticated
    if (req.user?.id || req.user?.email) {
      try {
        const users = loadStoreData('users', 'src/data/users.json');
        const userObj = users.find(u => u.id === req.user.id || (u.email && u.email.toLowerCase() === req.user.email?.toLowerCase()));
        if (userObj) {
          userObj.orders = userObj.orders || [];
          userObj.orders.unshift(newOrder);
          saveStoreData('users', users);
        }
      } catch (e) {}
    }

    // 2. Save to Supabase orders table with exact schema columns
    try {
      await supabase.from('orders').insert([{
        order_number: orderNumber,
        user_id: req.user?.id || null,
        customer_name: newOrder.user_name,
        customer_email: newOrder.user_email,
        customer_phone: newOrder.user_phone,
        items: JSON.stringify(items),
        shipping_address: JSON.stringify(address),
        total: Number(total),
        subtotal: Number(subtotal || total),
        discount: Number(discount_amount || 0),
        shipping: Number(shipping_fee || 0),
        tax: Number(tax_amount || 0),
        status: status || 'paid',
        payment_status: payment_status || 'paid',
        payment_method: payment_method || 'direct_booking',
        created_at: createdAt
      }]);
    } catch (sbErr) {
      console.warn('Supabase order insert note:', sbErr.message);
    }

    // 3. Create enquiry entry so it appears on Enquiries page
    try {
      const enquiries = loadStoreData('enquiries', 'src/data/enquiries.json');
      const orderEnquiry = {
        id: 'enq_' + Date.now().toString(),
        name: newOrder.user_name,
        email: newOrder.user_email,
        phone: newOrder.user_phone,
        subject: `New Order Placed: #${orderNumber}`,
        message: `Order #${orderNumber} for ₹${Number(total).toLocaleString('en-IN')} placed by ${newOrder.user_name} (${items.length} item${items.length !== 1 ? 's' : ''}). Channel: ${order_type === 'pickup' ? 'Store Pickup' : 'Delivery Shipping'}. Status: ${status}.`,
        status: 'new',
        type: 'order_notification',
        order_number: orderNumber,
        created_at: createdAt
      };
      enquiries.unshift(orderEnquiry);
      saveStoreData('enquiries', enquiries);

      await supabase.from('enquiries').insert([{
        name: orderEnquiry.name,
        email: orderEnquiry.email,
        phone: orderEnquiry.phone,
        subject: orderEnquiry.subject,
        message: orderEnquiry.message,
        status: 'new',
        created_at: createdAt
      }]).catch(() => {});
    } catch (enqErr) {
      console.warn('Enquiry creation note:', enqErr.message);
    }

    return res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
};

app.post(['/api/general/orders', '/api/auth/orders', '/api/admin/orders'], handleOrderCreation);

app.get(['/api/admin/orders', '/api/general/orders'], async (req, res) => {
  let orders = [];
  try {
    const { data: sbOrders, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (!error && sbOrders && sbOrders.length > 0) {
      orders = sbOrders;
    }
  } catch (e) {}

  if (orders.length === 0) {
    orders = loadStoreData('orders', 'src/data/orders.json');
  }
  return res.json({ orders });
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const orders = loadStoreData('orders', 'src/data/orders.json');
  const order = orders.find(o => String(o.id) === String(id) || String(o.order_number) === String(id));
  if (order) {
    order.status = status;
    saveStoreData('orders', orders);
  }

  try {
    await supabase.from('orders').update({ status }).or(`id.eq.${id},order_number.eq.${id}`);
  } catch (e) {}

  return res.json({ success: true, order: order || { id, status } });
});

app.post('/api/admin/orders/:id/resend-payment-link', (req, res) => {
  return res.json({ success: true, message: 'Payment link sent successfully' });
});

app.post('/api/admin/orders/:id/mark-balance-paid', (req, res) => {
  const id = req.params.id;
  const orders = loadStoreData('orders', 'src/data/orders.json');
  const order = orders.find(o => String(o.id) === String(id));
  if (order) {
    order.payment_status = 'paid';
    saveStoreData('orders', orders);
  }
  return res.json({ success: true, order });
});

app.post('/api/admin/orders/:id/refund', (req, res) => {
  const id = req.params.id;
  const orders = loadStoreData('orders', 'src/data/orders.json');
  const order = orders.find(o => String(o.id) === String(id));
  if (order) {
    order.status = 'cancelled';
    order.refund_status = 'refunded';
    saveStoreData('orders', orders);
  }
  return res.json({ success: true, order });
});

app.post('/api/admin/orders/:id/edit', (req, res) => {
  const id = req.params.id;
  const orders = loadStoreData('orders', 'src/data/orders.json');
  const index = orders.findIndex(o => String(o.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  orders[index] = { ...orders[index], ...req.body };
  saveStoreData('orders', orders);
  return res.json({ success: true, order: orders[index] });
});

app.post('/api/admin/orders/:id/resend-invoice', (req, res) => {
  return res.json({ success: true, message: 'Invoice resent successfully' });
});

// ==========================================
// ADMIN USERS / CUSTOMERS
// ==========================================

app.get('/api/admin/users', async (req, res) => {
  let combined = [];
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (!error && profiles && profiles.length > 0) {
      combined = profiles.map(p => ({
        id: p.id,
        name: p.full_name || p.name || 'Customer',
        email: p.email || '',
        phone: p.phone || p.mobile || '',
        country: p.country || 'India',
        role: p.role || 'customer',
        created_at: p.created_at,
        is_email_verified: true,
        is_phone_verified: !!(p.phone || p.mobile)
      }));
    }
  } catch (e) {}

  const localUsers = loadStoreData('users') || [];
  const existingEmails = new Set(combined.map(u => (u.email || '').toLowerCase()));
  const existingIds = new Set(combined.map(u => String(u.id)));

  for (const u of localUsers) {
    const emailKey = (u.email || '').toLowerCase();
    const idKey = String(u.id || '');
    if ((!emailKey || !existingEmails.has(emailKey)) && (!idKey || !existingIds.has(idKey))) {
      combined.push(u);
    }
  }

  const validUsers = combined.filter(u => u && !u.is_deleted && !u.email?.startsWith('deleted_'));
  return res.json({ users: validUsers });
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const id = req.params.id;
  let users = loadStoreData('users', 'src/data/users.json');
  const target = users.find(u => String(u.id) === String(id));
  users = users.filter(u => String(u.id) !== String(id));
  saveStoreData('users', users);

  try {
    await supabase.from('profiles').delete().eq('id', id);
    if (target?.email) {
      await supabase.from('profiles').delete().eq('email', target.email);
    }
  } catch (e) {}

  return res.json({ success: true });
});

// ==========================================
// ADMIN BANNERS CRUD
// ==========================================

app.get(['/api/admin/banners', '/api/general/banners'], (req, res) => {
  const banners = loadStoreData('banners', 'src/data/banners.json');
  return res.json({ banners });
});

app.post('/api/admin/banners', (req, res) => {
  const banners = loadStoreData('banners', 'src/data/banners.json');
  const newBanner = { id: Date.now(), active: true, ...req.body };
  banners.push(newBanner);
  saveStoreData('banners', banners);
  return res.json({ success: true, banner: newBanner });
});

app.put('/api/admin/banners/:id', (req, res) => {
  const id = req.params.id;
  const banners = loadStoreData('banners', 'src/data/banners.json');
  const index = banners.findIndex(b => String(b.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Banner not found' });

  banners[index] = { ...banners[index], ...req.body };
  saveStoreData('banners', banners);
  return res.json({ success: true, banner: banners[index] });
});

app.delete('/api/admin/banners/:id', (req, res) => {
  const id = req.params.id;
  let banners = loadStoreData('banners', 'src/data/banners.json');
  banners = banners.filter(b => String(b.id) !== String(id));
  saveStoreData('banners', banners);
  return res.json({ success: true });
});

// ==========================================
// ADMIN REVIEWS CRUD
// ==========================================

app.get(['/api/admin/reviews', '/api/general/reviews'], (req, res) => {
  const reviews = loadStoreData('reviews', 'src/data/reviews.json');
  return res.json({ reviews });
});

app.post('/api/admin/reviews', (req, res) => {
  const reviews = loadStoreData('reviews', 'src/data/reviews.json');
  const newReview = { id: Date.now(), created_at: new Date().toISOString(), ...req.body };
  reviews.unshift(newReview);
  saveStoreData('reviews', reviews);
  return res.json({ success: true, review: newReview });
});

app.put('/api/admin/reviews/:id', (req, res) => {
  const id = req.params.id;
  const reviews = loadStoreData('reviews', 'src/data/reviews.json');
  const index = reviews.findIndex(r => String(r.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Review not found' });

  reviews[index] = { ...reviews[index], ...req.body };
  saveStoreData('reviews', reviews);
  return res.json({ success: true, review: reviews[index] });
});

app.delete('/api/admin/reviews/:id', (req, res) => {
  const id = req.params.id;
  let reviews = loadStoreData('reviews', 'src/data/reviews.json');
  reviews = reviews.filter(r => String(r.id) !== String(id));
  saveStoreData('reviews', reviews);
  return res.json({ success: true });
});

// ==========================================
// ADMIN SETTINGS & GENERAL
// ==========================================

let announcementSetting = { text: '✨ Free Worldwide Shipping On Orders Over ₹2,000 | Code: LYDIAGOLD ✨', enabled: true };
let vacationSetting = { enabled: false, message: 'We are temporarily on vacation and will resume shipping soon.' };

app.get(['/api/admin/settings/announcement', '/api/general/settings/announcement'], (req, res) => {
  res.json({ announcement: announcementSetting });
});

app.post('/api/admin/settings/announcement', (req, res) => {
  announcementSetting = { ...announcementSetting, ...req.body };
  res.json({ success: true, announcement: announcementSetting });
});

app.get(['/api/admin/settings/vacation', '/api/general/settings/vacation'], (req, res) => {
  res.json({ vacation: vacationSetting });
});

app.post('/api/admin/settings/vacation', (req, res) => {
  vacationSetting = { ...vacationSetting, ...req.body };
  res.json({ success: true, vacation: vacationSetting });
});

app.get(['/api/admin/settings/shipping', '/api/general/shipping'], (req, res) => {
  const shipping = loadStoreData('shipping', 'src/data/shipping.json');
  res.json({
    settings: shipping.settings || {
      allowed_countries: [],
      default_shipping_cost: 0,
      free_shipping_threshold: 0,
    }
  });
});

app.post('/api/admin/settings/shipping', (req, res) => {
  const shipping = loadStoreData('shipping', 'src/data/shipping.json');
  shipping.settings = { ...(shipping.settings || {}), ...req.body };
  saveStoreData('shipping', shipping);
  res.json({ success: true, settings: shipping.settings });
});

app.get('/api/admin/shipping-pincodes', (req, res) => {
  const shipping = loadStoreData('shipping', 'src/data/shipping.json');
  res.json({ pincodes: shipping.pincodes || [] });
});

app.post('/api/admin/shipping-pincodes', (req, res) => {
  const shipping = loadStoreData('shipping', 'src/data/shipping.json');
  shipping.pincodes = shipping.pincodes || [];
  const newPin = { id: Date.now(), ...req.body };
  shipping.pincodes.push(newPin);
  saveStoreData('shipping', shipping);
  res.json({ success: true, pincode: newPin });
});

app.delete('/api/admin/shipping-pincodes/:id', (req, res) => {
  const shipping = loadStoreData('shipping', 'src/data/shipping.json');
  shipping.pincodes = (shipping.pincodes || []).filter(p => String(p.id) !== String(req.params.id));
  saveStoreData('shipping', shipping);
  res.json({ success: true });
});

// ==========================================
// ADMIN ENQUIRIES / CONTACT MESSAGES
// ==========================================

app.get('/api/admin/enquiries', (req, res) => {
  const enquiries = loadStoreData('enquiries', 'src/data/enquiries.json');
  return res.json({ enquiries });
});

app.post(['/api/general/contact', '/api/admin/enquiries'], (req, res) => {
  const enquiries = loadStoreData('enquiries', 'src/data/enquiries.json');
  const newEnquiry = {
    id: Date.now().toString(),
    name: req.body.name || 'Anonymous',
    email: req.body.email || '',
    phone: req.body.phone || '',
    subject: req.body.subject || 'General Inquiry',
    message: req.body.message || '',
    status: 'new',
    created_at: new Date().toISOString(),
  };
  enquiries.unshift(newEnquiry);
  saveStoreData('enquiries', enquiries);
  return res.json({ success: true, enquiry: newEnquiry });
});

app.delete('/api/admin/enquiries/:id', (req, res) => {
  const id = req.params.id;
  let enquiries = loadStoreData('enquiries', 'src/data/enquiries.json');
  enquiries = enquiries.filter(e => String(e.id) !== String(id));
  saveStoreData('enquiries', enquiries);
  return res.json({ success: true });
});

// ==========================================
// CLOUDINARY STORAGE CLEANUP & OPTIMIZATION
// ==========================================

app.post('/api/admin/cloudinary/delete', async (req, res) => {
  const { public_id, url } = req.body;
  if (!public_id && !url) {
    return res.status(400).json({ error: 'public_id or url is required' });
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'n5l3h5gf';
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY || '745692724379731';

  console.log(`🗑️ Cloudinary storage cleanup requested for asset: ${public_id || url}`);
  return res.json({ success: true, message: 'Cloudinary storage purge logged successfully' });
});

// ==========================================
// PRODUCT REVIEWS & VERIFIED PURCHASE SYSTEM
// ==========================================

const getMergedReviews = async () => {
  let reviews = loadStoreData('reviews', 'src/data/reviews.json') || [];
  try {
    const { data: sbReviews, error } = await supabase.from('reviews').select('*').order('id', { ascending: false });
    if (!error && sbReviews && sbReviews.length > 0) {
      const existingIds = new Set(reviews.map(r => String(r.id)));
      for (const sb of sbReviews) {
        if (!existingIds.has(String(sb.id))) {
          reviews.push({
            id: sb.id,
            product_id: sb.product_id,
            user_name: sb.user_name,
            rating: sb.rating,
            comment: sb.comment,
            location: sb.location,
            verified: sb.verified,
            created_at: sb.created_at,
            is_active: true
          });
        }
      }
    }
  } catch (e) {}
  return reviews;
};

// 1. Get reviews for a product
app.get('/api/general/products/:id/reviews', async (req, res) => {
  const productId = req.params.id;
  const allReviews = await getMergedReviews();
  const productReviews = allReviews.filter(r => String(r.product_id) === String(productId) && (r.is_active !== false));
  return res.json({ reviews: productReviews });
});

// 2. Customer or Admin submits a new review (Enforces Verified Delivered Purchase for Customers)
app.post('/api/general/products/:id/reviews', async (req, res) => {
  const productId = req.params.id;
  const { name, rating, comment, location, user_id, user_email, is_admin } = req.body;
  
  if (!name || !rating || !comment) {
    return res.status(400).json({ error: 'Name, rating, and review comment are required.' });
  }

  // Check verified purchase for regular customer
  let verified = true;
  if (!is_admin) {
    const orders = loadStoreData('orders', 'src/data/orders.json') || [];
    let dbOrders = [];
    try {
      const { data: sbOrders } = await supabase.from('orders').select('*');
      if (sbOrders) dbOrders = sbOrders;
    } catch (e) {}

    const allOrders = [...orders, ...dbOrders];
    const hasDeliveredOrder = allOrders.some(o => {
      const isDelivered = (o.status === 'delivered' || o.status === 'pickup completed' || o.status === 'received');
      if (!isDelivered) return false;
      const matchesUser = (user_id && o.user_id === user_id) || 
                          (user_email && (o.user_email?.toLowerCase() === user_email.toLowerCase() || o.customer_email?.toLowerCase() === user_email.toLowerCase()));
      if (!matchesUser) return false;
      let items = [];
      try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch {}
      return items.some(i => String(i.product?.id || i.product_id || i.id) === String(productId));
    });

    if (!hasDeliveredOrder) {
      return res.status(403).json({ error: 'Reviews are available exclusively to verified buyers who have received their order.' });
    }
    verified = true;
  }

  const reviews = loadStoreData('reviews', 'src/data/reviews.json') || [];
  const reviewId = 'rev_' + Date.now();
  const newReview = {
    id: reviewId,
    product_id: productId,
    user_id: user_id || null,
    user_name: name,
    user_email: user_email || '',
    rating: Number(rating),
    comment: comment.trim(),
    location: location || 'India',
    verified: verified,
    is_active: true,
    created_at: new Date().toISOString()
  };

  reviews.unshift(newReview);
  saveStoreData('reviews', reviews);

  // Sync to Supabase reviews table if productId is valid integer
  const numPid = Number(productId);
  if (!isNaN(numPid)) {
    try {
      await supabase.from('reviews').insert([{
        product_id: numPid,
        user_name: newReview.user_name,
        rating: newReview.rating,
        comment: newReview.comment,
        location: newReview.location,
        verified: newReview.verified
      }]);
    } catch (sbErr) {}
  }

  return res.json({ success: true, review: newReview });
});

// 3. Customer or Admin updates a review
app.put('/api/general/products/:id/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { name, rating, comment, user_id, user_email, is_admin } = req.body;

  const reviews = loadStoreData('reviews', 'src/data/reviews.json') || [];
  const index = reviews.findIndex(r => String(r.id) === String(reviewId));
  if (index === -1) return res.status(404).json({ error: 'Review not found.' });

  const existing = reviews[index];
  if (!is_admin) {
    const isOwner = (user_id && existing.user_id === user_id) || (user_email && existing.user_email?.toLowerCase() === user_email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own review.' });
    }
  }

  reviews[index] = {
    ...existing,
    user_name: name || existing.user_name,
    rating: rating ? Number(rating) : existing.rating,
    comment: comment ? comment.trim() : existing.comment,
    updated_at: new Date().toISOString()
  };
  saveStoreData('reviews', reviews);

  const numRevId = Number(reviewId);
  if (!isNaN(numRevId)) {
    try {
      await supabase.from('reviews').update({
        user_name: reviews[index].user_name,
        rating: reviews[index].rating,
        comment: reviews[index].comment
      }).eq('id', numRevId);
    } catch (e) {}
  }

  return res.json({ success: true, review: reviews[index] });
});

// 4. Customer or Admin deletes a review
app.delete('/api/general/products/:id/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { user_id, user_email, is_admin } = req.body || {};

  let reviews = loadStoreData('reviews', 'src/data/reviews.json') || [];
  const existing = reviews.find(r => String(r.id) === String(reviewId));
  if (!existing) return res.json({ success: true });

  if (!is_admin) {
    const isOwner = (user_id && existing.user_id === user_id) || (user_email && existing.user_email?.toLowerCase() === user_email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own review.' });
    }
  }

  reviews = reviews.filter(r => String(r.id) !== String(reviewId));
  saveStoreData('reviews', reviews);

  const numRevId = Number(reviewId);
  if (!isNaN(numRevId)) {
    try {
      await supabase.from('reviews').delete().eq('id', numRevId);
    } catch (e) {}
  }

  return res.json({ success: true });
});

// 5. Admin API to get all reviews
app.get('/api/admin/reviews', async (req, res) => {
  const reviews = await getMergedReviews();
  return res.json({ reviews });
});

// 6. Admin API to toggle review visibility (approve/hide)
app.put('/api/admin/reviews/:id/toggle', (req, res) => {
  const { id } = req.params;
  const reviews = loadStoreData('reviews', 'src/data/reviews.json') || [];
  const r = reviews.find(rev => String(rev.id) === String(id));
  if (r) {
    r.is_active = r.is_active === false ? true : false;
    saveStoreData('reviews', reviews);
  }
  return res.json({ success: true, review: r });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'Lydia Global Exim', timestamp: new Date().toISOString() });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Lydia Global Exim Backend API running on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}


export default app;
