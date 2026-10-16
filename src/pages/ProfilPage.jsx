import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouter } from '../lib/router';
import { Auth } from '../lib/auth';
import UserDashboard from '../components/UserDashboard';

export default function ProfilPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
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
