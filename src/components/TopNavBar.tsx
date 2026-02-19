import { Link, useNavigate } from 'react-router-dom';
import { clearAuthToken, isAuthenticated } from '../auth/storage';

type TopNavBarProps = {
  className?: string;
};

export function TopNavBar({ className }: TopNavBarProps) {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    clearAuthToken();
    navigate('/', { replace: true });
  }

  return (
    <header className={`top-nav card ${className ?? ''}`.trim()}>
      <Link to="/" className="brand-link" aria-label="홈으로 이동">
        <span className="brand-link__open">Open</span>
        <span className="brand-link__ticket">ticket</span>
      </Link>

      <nav aria-label="인증 메뉴">
        {loggedIn ? (
          <button type="button" className="button-secondary" onClick={handleLogout}>
            로그아웃
          </button>
        ) : (
          <Link to="/login" className="button-secondary link-button">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
