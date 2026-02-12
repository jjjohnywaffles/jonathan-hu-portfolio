import type { ReactNode } from 'react';

/** Breadcrumb comment at the top of command output (e.g. "// Experience > Matrices") */
export const CommandHeader = ({ children }: { children: ReactNode }) => (
  <p className="text-text-muted text-xs">// {children}</p>
);

/** Numbered selectable item card used in list views */
export const ListItemButton = ({
  index,
  title,
  subtitle,
  trailing,
  isActive,
  selected,
  onSelect,
}: {
  index: number;
  title: string;
  subtitle: string;
  trailing?: string;
  isActive: boolean;
  selected?: boolean;
  onSelect: () => void;
}) => (
  <button
    className={`flex items-center gap-4 px-4 py-3 bg-accent/5 border rounded cursor-pointer font-mono text-sm text-left transition-all w-full disabled:cursor-default disabled:opacity-70 ${
      selected
        ? 'border-accent bg-accent/10'
        : 'border-border hover:bg-accent/10 hover:border-accent'
    } ${!isActive ? '[&_.list-key]:text-text-muted' : ''}`}
    onClick={onSelect}
    disabled={!isActive}
  >
    <span className="list-key text-accent font-semibold shrink-0">[{index}]</span>
    <div className="flex flex-col flex-1 min-w-0">
      <span className="text-text-primary font-medium">{title}</span>
      <span className="text-text-secondary text-xs">{subtitle}</span>
    </div>
    {trailing && <span className="text-text-muted text-xs shrink-0">{trailing}</span>}
  </button>
);

/** Inline confirmation row shown beneath a selected item */
export const InlineConfirm = ({
  label,
  url,
  onConfirm,
  onCancel,
}: {
  label: string;
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="ml-8 mt-1 flex flex-col gap-2 py-2">
    <p className="text-accent-secondary text-xs break-all">{url}</p>
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-xs">{label}</span>
      <ActionButton keyLabel="ENTER" onClick={onConfirm} variant="primary">
        Open
      </ActionButton>
      <ActionButton keyLabel="ESC" onClick={onCancel}>
        Cancel
      </ActionButton>
    </div>
  </div>
);

/** Keyboard-hinted action button (e.g. [ESC] Back to list, [ENTER] Open) */
export const ActionButton = ({
  keyLabel,
  children,
  onClick,
  variant = 'default',
}: {
  keyLabel: string;
  children: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}) => (
  <button
    className={`inline-flex items-center gap-3 px-4 py-2 bg-transparent border rounded cursor-pointer font-mono text-sm transition-all hover:bg-accent-secondary/10 hover:border-accent-secondary ${
      variant === 'primary' ? 'border-accent-secondary' : 'border-border'
    }`}
    onClick={onClick}
  >
    <span className="text-accent-secondary">[{keyLabel}]</span>
    <span className="text-text-primary">{children}</span>
  </button>
);

/** Hint text shown at the bottom of a list (e.g. "Press 1-4 or click to view details.") */
export const ListHint = ({ children }: { children: ReactNode }) => (
  <>
    <br />
    <p className="text-text-muted text-xs">{children}</p>
  </>
);
