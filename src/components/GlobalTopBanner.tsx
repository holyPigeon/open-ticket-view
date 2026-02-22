import { BannerTone } from './globalUiStore';

type GlobalTopBannerProps = {
  tone: BannerTone;
  message: string;
  onClose: () => void;
};

export function GlobalTopBanner({ tone, message, onClose }: GlobalTopBannerProps) {
  return (
    <div className={`global-top-banner global-top-banner--${tone}`} role="status" aria-live="polite">
      <p>{message}</p>
      <button type="button" className="global-top-banner__close" aria-label="알림 닫기" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
