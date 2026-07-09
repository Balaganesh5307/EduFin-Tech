import React, { useState, useRef } from 'react';
import { X, User, Phone, Lock, Upload, LogOut, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/auth.context';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, accessToken, refreshSession, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    setLoadingMsg('Saving changes...');

    // Prepare multi-part form data
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phoneNumber', phoneNumber);
    
    if (currentPassword && newPassword) {
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
    }

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const response = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || 'Profile settings updated.');
        
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setAvatarFile(null);

        // Sync local context session
        await refreshSession();
      } else {
        setErrorMsg(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.warn('API profile update failed. Running mock local update...', err);
      // Fallback sandbox preview:
      setSuccessMsg('Demo Mock: Profile attributes updated successfully (Offline mode).');
      
      // Manually updates session local mock cache to reflect local visual revisions
      const mockSession = localStorage.getItem('edufin_mock_session');
      if (mockSession) {
        const parsed = JSON.parse(mockSession);
        parsed.user.name = name;
        parsed.user.phoneNumber = phoneNumber;
        parsed.user.avatar = avatarPreview;
        localStorage.setItem('edufin_mock_session', JSON.stringify(parsed));
      }
      
      await refreshSession();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out from all active devices and sessions?')) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    setLoadingMsg('Revoking all active session tokens...');

    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('All active device sessions revoked. Redirecting to login...');
        onClose();
        logout();
      } else {
        throw new Error();
      }
    } catch (err) {
      // Offline fallback: log out locally
      onClose();
      logout();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      {/* Modal Shell */}
      <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Profile Settings
            </h3>
            <p className="text-xs text-slate-500">Manage your campus details and security sessions.</p>
          </div>
          {!submitting && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-400 text-left">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400 text-left">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {submitting && loadingMsg ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-300 animate-pulse">{loadingMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6 text-left">
              {/* Avatar Selector Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div className="relative group">
                  <img
                    src={avatarPreview || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.role}`}
                    alt={name}
                    className="h-20 w-20 rounded-2xl object-cover bg-slate-900 border border-slate-800 ring-4 ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" /> Change
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-slate-100">{user.name}</h4>
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">{user.role}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">{user.email}</span>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password updates */}
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Security Credentials</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action operations footer */}
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors active:scale-98"
                >
                  <LogOut className="h-4 w-4" />
                  Logout All Devices
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 sm:w-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all active:scale-98"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
