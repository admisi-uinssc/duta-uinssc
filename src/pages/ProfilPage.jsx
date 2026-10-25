import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouter } from '../lib/router';
import { Auth } from '../lib/auth';
import { isFirebaseConfigured, fetchUserFromCloudByIdentifier, syncUserToCloud } from '../lib/firebase';
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
    const localUser = Auth.getCurrentUser();

    // Immediately render local user session to avoid blank screen or false redirects
    if (localUser && (localUser.email || '').toLowerCase() === cleanToken) {
      setUser(localUser);
      setLoading(false);
    }

    // Verify account directly with server database
    if (isFirebaseConfigured && cleanToken !== 'rizki') {
      const sessionCreated = Number(localStorage.getItem('dutauinssc_session_created') || 0);
      const isFreshSession = sessionCreated && (Date.now() - sessionCreated < 600000);
      const isRecentLocal = localUser && localUser.createdAt && (Date.now() - new Date(localUser.createdAt).getTime() < 600000);

      fetchUserFromCloudByIdentifier(cleanToken).then((cloudUser) => {
        if (!cloudUser) {
          // If the user just registered or logged in recently, never kick them out! Re-sync to cloud
          if (isFreshSession || isRecentLocal) {
            if (localUser) {
              syncUserToCloud(localUser);
              setUser(localUser);
              setLoading(false);
            }
            return;
          }
          // Account was genuinely deleted from server database long ago!
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
        if (localUser && (localUser.email || '').toLowerCase() === cleanToken) {
          setUser(localUser);
          setLoading(false);
        } else {
          Auth.logout();
          navigate('/login');
        }
      });
    } else {
      if (localUser) {
        setUser(localUser);
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
