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
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await login({ email, password });
      setAuthToken(response.token);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card fade-in" aria-label="Login form">
        <img className="login-logo" src="/open-logo.svg" alt="Open logo" />
        <h1>Sign in</h1>
        <p className="login-subtext">Use your account to access protected event details.</p>

        {errorMessage ? <InlineAlert tone="error" message={errorMessage} /> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user1@gmail.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
            />
          </label>

          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">Dev hint: user1@gmail.com / password1</p>
      </section>
    </main>
  );
}
