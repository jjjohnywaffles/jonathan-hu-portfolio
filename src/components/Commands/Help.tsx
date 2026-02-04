import { getCommandList } from './commandUtils';

export const Help = () => {
  const commands = getCommandList();

  return (
    <div className="text-text-primary">
      <p className="text-accent mb-2">Available commands:</p>
      <br />
      <div className="flex flex-col gap-1">
        {commands.map((cmd) => (
          <div key={cmd.name} className="flex gap-8 max-md:flex-col max-md:gap-1">
            <span className="text-accent-secondary min-w-[120px] max-md:min-w-0">{cmd.name}</span>
            <span className="text-text-secondary">{cmd.description}</span>
          </div>
        ))}
      </div>
      <br />
      <p className="text-text-muted text-xs">
        Tip: Use <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">↑</span> and{' '}
        <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">↓</span> to navigate
        command history.
      </p>
    </div>
  );
};
