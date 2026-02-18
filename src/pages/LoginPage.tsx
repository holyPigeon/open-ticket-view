import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../auth/storage';
import { login } from '../api/openTicketApi';
import { InlineAlert } from '../components/InlineAlert';

type LoginLocationState = {
  from?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LoginLocationState | null) ?? null;
  const redirectPath = state?.from ?? '/events/1';

  const [email, setEmail] = useState('user1@gmail.com');
  const [password, setPassword] = useState('password1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await login({ email, password });
      setAuthToken(response.token);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다. 다시 시도해 주세요.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card fade-in" aria-label="로그인 폼">
        <img className="login-logo" src="/open-logo.svg" alt="오픈 로고" />
        <h1>로그인</h1>
        <p className="login-subtext">계정으로 로그인한 뒤 이벤트 상세 페이지에 진입할 수 있습니다.</p>

        {errorMessage ? <InlineAlert tone="error" message={errorMessage} /> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user1@gmail.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
            />
          </label>

          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="login-hint">개발용 계정: user1@gmail.com / password1</p>
      </section>
    </main>
  );
}
