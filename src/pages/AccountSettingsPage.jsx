import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogOut, AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import { Header } from '../components/Header';
import { PhoneInput } from '../components/PhoneInput';
import { CountryPicker } from '../components/CountryPicker';

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { token, user, fetchProfile, updateProfile, logout } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', country: '' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '', country: user.country || '' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.country) {
      setProfileMsg('Country field is mandatory');
      return;
    }
    setSaving(true);
    const res = await updateProfile(profileForm.name, profileForm.phone, profileForm.country);
    setProfileMsg(res.success ? '✓ Profile updated!' : (res.error || 'Failed to update'));
    setSaving(false);
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passForm.current) return setPassMsg('Please enter your current password');
    if (passForm.newPass !== passForm.confirm) return setPassMsg('Passwords do not match');

    const pwRules = [
      { ok: passForm.newPass.length >= 8, msg: 'Minimum 8 characters' },
      { ok: /\d/.test(passForm.newPass), msg: 'At least 1 number' },
      { ok: /[^A-Za-z0-9]/.test(passForm.newPass), msg: 'At least 1 special character' },
    ];
    const failedRule = pwRules.find(r => !r.ok);
    if (failedRule) return setPassMsg(`Password requirement: ${failedRule.msg}`);

    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.current, newPassword: passForm.newPass });
      setPassMsg('✓ Password changed successfully!');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPassMsg(err.response?.data?.error || 'Failed to change password. Check your current password.');
    }
    setSaving(false);
    setTimeout(() => setPassMsg(''), 5000);
  };

  const handleLogoutAllDevices = async () => {
    setLogoutLoading(true);
    try {
      await api.post('/auth/logout-all').catch(() => {});
    } catch {}
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Account Settings" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-brand-gold text-white text-2xl font-bold flex items-center justify-center shadow-md">
            {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
              {user?.role === 'admin' ? '👑 Admin' : '✓ Verified'}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-gold" /> Personal Information
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input value={user?.email || ''} disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
              <PhoneInput value={profileForm.phone} onChange={v => setProfileForm(f => ({ ...f, phone: v }))} placeholder="Phone number" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Country *</label>
              <CountryPicker value={profileForm.country} onChange={v => setProfileForm(f => ({ ...f, country: v }))} />
            </div>
            {profileMsg && (
              <p className={`text-xs font-semibold ${profileMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{profileMsg}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-brand-gold text-white font-bold py-3 rounded-xl text-sm hover:bg-gray-600 transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-gold" /> Change Password
          </h2>
          <p className="text-[10px] text-gray-400 mb-4">Min. 8 characters · at least 1 number · at least 1 special character (!@#$...)</p>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {[
              { key: 'current', label: 'Current Password', show: showPass.current, toggle: () => setShowPass(p => ({ ...p, current: !p.current })) },
              { key: 'newPass', label: 'New Password', show: showPass.new, toggle: () => setShowPass(p => ({ ...p, new: !p.new })) },
              { key: 'confirm', label: 'Confirm New Password', show: showPass.new, toggle: null },
            ].map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={passForm[key]}
                    onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-gray-50 pr-10" />
                  {toggle && (
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {passMsg && (
              <p className={`text-xs font-semibold ${passMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{passMsg}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
              {saving ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
          <h2 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h2>
          <p className="text-[11px] text-gray-400 mb-3">
            Logging out from all devices will invalidate all your active sessions. You will need to sign in again.
          </p>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Logout from All Devices
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Logout from All Devices?</h3>
              </div>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              All active sessions on all your devices will be terminated. You'll be redirected to the login page.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogoutAllDevices} disabled={logoutLoading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                {logoutLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Logging out...</>
                ) : (
                  <><LogOut className="w-3.5 h-3.5" /> Logout All</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
