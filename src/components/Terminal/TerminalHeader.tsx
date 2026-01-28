interface TerminalHeaderProps {
  title: string;
}

export const TerminalHeader = ({ title }: TerminalHeaderProps) => {
  return (
    <div className="terminal-header">
      <div className="terminal-buttons">
        <span className="terminal-btn close" />
        <span className="terminal-btn minimize" />
        <span className="terminal-btn maximize" />
      </div>
      <span className="terminal-title">{title}</span>
      <div className="terminal-header-spacer" />
    </div>
  );
};
