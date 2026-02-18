import clsx from 'clsx';

type InlineAlertProps = {
  tone: 'error' | 'success' | 'info';
  message: string;
};

export function InlineAlert({ tone, message }: InlineAlertProps) {
  return <div className={clsx('inline-alert', `inline-alert--${tone}`)}>{message}</div>;
}
