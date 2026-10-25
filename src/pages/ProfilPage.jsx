import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouter } from '../lib/router';
import { Auth } from '../lib/auth';
import { isFirebaseConfigured, fetchUserFromCloudByIdentifier } from '../lib/firebase';
import UserDashboard from '../components/UserDashboard';

export default function ProfilPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dutauinssc_auth_token') : null;
    if (!token) {
      navigate('/login');
      return;
    }
    const cleanToken = token.trim().toLowerCase();

    // Verify account directly with server database
    if (isFirebaseConfigured && cleanToken !== 'rizki') {
      fetchUserFromCloudByIdentifier(cleanToken).then((cloudUser) => {
        if (!cloudUser) {
          // Double check: if user was just created locally within the last 2 minutes, keep them in session
          const localUser = Auth.getCurrentUser();
          const isRecent = localUser && localUser.createdAt && (Date.now() - new Date(localUser.createdAt).getTime() < 120000);
          if (isRecent) {
            setUser(localUser);
            setLoading(false);
            return;
          }
          // Account was genuinely deleted from server database!
          Auth.logout();
          const allUsers = Auth.getUsers().filter(u => (u.email || '').toLowerCase() !== cleanToken);
          localStorage.setItem('dutauinssc_users', JSON.stringify(allUsers));
          navigate('/login');
          return;
        }
        setUser(cloudUser);
        setLoading(false);
      }).catch((err) => {
        console.warn('Network issue fetching cloud user, fallback to local cache:', err);
        const local = Auth.getCurrentUser();
        if (local && (local.email || '').toLowerCase() === cleanToken) {
          setUser(local);
          setLoading(false);
        } else {
          Auth.logout();
          navigate('/login');
        }
      });
    } else {
      const local = Auth.getCurrentUser();
      if (local) {
        setUser(local);
        setLoading(false);
      } else {
        navigate('/login');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    Auth.logout();
    router.push('/login');
  };

  if (loading || !user) return null;

  // Direct approval pattern: all authenticated applicants enter UserDashboard directly
  return <UserDashboard user={user} onLogout={handleLogout} />;
}
