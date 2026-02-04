interface TooltipProps {
  text: string;
  visible: boolean;
}

export const Tooltip = ({ text, visible }: TooltipProps) => {
  if (!visible) return null;

  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1.5 px-3 bg-[rgba(30,30,30,0.95)] text-text-primary text-xs font-mono whitespace-nowrap rounded-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] pointer-events-none z-10 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[rgba(30,30,30,0.95)]">
      {text}
    </span>
  );
};
