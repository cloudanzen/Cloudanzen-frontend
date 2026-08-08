import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ValidationOwnerChipProps {
  name?: string | null;
  email?: string | null;
  fallback?: string | null;
  interactive?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  maxWidthClassName?: string;
  className?: string;
}

export function ValidationOwnerChip({
  name,
  email,
  fallback,
  interactive = false,
  ariaLabel,
  onClick,
  maxWidthClassName = 'max-w-[120px]',
  className = '',
}: ValidationOwnerChipProps) {
  const { t } = useTranslation('tests');
  const label = name || email || fallback || t('validations.unassigned');
  const title = email || label;

  const content = (
    <>
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200">
        <User className="h-3 w-3 text-blue-600" />
      </span>
      <span className={`truncate ${maxWidthClassName}`} title={title}>
        {label}
      </span>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        aria-label={ariaLabel ? `${ariaLabel}: ${label}` : label}
        title={ariaLabel ? `${ariaLabel}: ${label}` : title}
        className={`group inline-flex min-w-0 items-center gap-1.5 rounded-full px-1 py-0.5 text-left text-sm text-muted-foreground transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 px-1 py-0.5 text-sm text-muted-foreground ${className}`}
    >
      {content}
    </span>
  );
}
