import { ApiMode } from '../api/contracts';

type PageHeaderProps = {
  mode: ApiMode;
  onLogout?: () => void;
};

export function PageHeader({ mode, onLogout }: PageHeaderProps) {
  return (
    <header className="page-header card">
      <div>
        <p className="eyebrow">오픈 티켓</p>
        <h1>이벤트 상세</h1>
      </div>
      <div className="page-header__actions">
        <div className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
          {mode === 'MOCK' ? '목 데이터 모드' : '실서버 API'}
        </div>
        {onLogout ? (
          <button type="button" className="button-secondary" onClick={onLogout}>
            로그아웃
          </button>
        ) : null}
      </div>
    </header>
  );
}
