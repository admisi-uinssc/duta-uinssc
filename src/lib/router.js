import { useNavigate, useLocation } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    pathname: location.pathname,
    push: (path) => navigate(path),
    replace: (path) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
}
