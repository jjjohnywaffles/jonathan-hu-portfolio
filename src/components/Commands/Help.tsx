import { getCommandList } from './commandUtils';

export const Help = () => {
  const commands = getCommandList();

  return (
    <div className="terminal-help">
      <p className="help-header">Available commands:</p>
      <br />
      <div className="help-commands">
        {commands.map((cmd) => (
          <div key={cmd.name} className="help-command">
            <span className="help-cmd-name">{cmd.name}</span>
            <span className="help-cmd-desc">{cmd.description}</span>
          </div>
        ))}
      </div>
      <br />
      <p className="help-tip">
        Tip: Use <span className="cmd-highlight">↑</span> and{' '}
        <span className="cmd-highlight">↓</span> to navigate command history.
      </p>
    </div>
  );
};
