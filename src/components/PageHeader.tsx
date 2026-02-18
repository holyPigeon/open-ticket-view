import { ApiMode } from '../api/contracts';

type PageHeaderProps = {
  mode: ApiMode;
  onLogout?: () => void;
};

export function PageHeader({ mode, onLogout }: PageHeaderProps) {
  return (
    <header className="page-header card">
      <div>
        <p className="eyebrow">Open Ticket</p>
        <h1>Event Detail</h1>
      </div>
      <div className="page-header__actions">
        <div className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
          {mode === 'MOCK' ? 'Mock Mode' : 'Live API'}
        </div>
        {onLogout ? (
          <button type="button" className="button-secondary" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
