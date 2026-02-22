type SessionExpiredDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SessionExpiredDialog({ open, onConfirm, onCancel }: SessionExpiredDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="session-dialog-backdrop" role="presentation">
      <section className="session-dialog" role="dialog" aria-modal="true" aria-labelledby="session-dialog-title">
        <h2 id="session-dialog-title">로그인 세션이 만료되었습니다</h2>
        <p>보안을 위해 다시 로그인해 주세요.</p>
        <div className="session-dialog__actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="button-primary" onClick={onConfirm}>
            다시 로그인
          </button>
        </div>
      </section>
    </div>
  );
}
