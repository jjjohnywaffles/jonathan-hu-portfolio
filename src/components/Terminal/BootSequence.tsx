import { useState, useEffect } from 'react';
import { BOOT_TIMING } from './constants';

interface BootStep {
  text: string;
  delay: number;
  status?: 'loading' | 'success';
}

const bootSteps: BootStep[] = [
  { text: 'Establishing connection', delay: BOOT_TIMING.CONNECTION_START, status: 'loading' },
  { text: 'Connection established', delay: BOOT_TIMING.CONNECTION_DONE, status: 'success' },
  { text: 'Loading portfolio data', delay: BOOT_TIMING.LOADING_START, status: 'loading' },
  { text: 'Portfolio data loaded', delay: BOOT_TIMING.LOADING_DONE, status: 'success' },
  { text: 'Initializing terminal', delay: BOOT_TIMING.INIT_START, status: 'loading' },
  { text: 'Terminal ready', delay: BOOT_TIMING.INIT_DONE, status: 'success' },
];

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence = ({ onComplete }: BootSequenceProps) => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    bootSteps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setVisibleSteps(index + 1);
      }, step.delay);
      timers.push(timer);
    });

    // Complete the boot sequence
    const completeTimer = setTimeout(() => {
      setComplete(true);
      setTimeout(onComplete, BOOT_TIMING.FADE_DELAY);
    }, BOOT_TIMING.COMPLETE);
    timers.push(completeTimer);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onComplete]);

  return (
    <div
      className={`w-full max-w-[500px] p-8 transition-opacity duration-400 ${complete ? 'opacity-0' : 'opacity-100'}`}
    >
      <div>
        <div className="flex justify-between items-baseline mb-8 pb-4 border-b border-border">
          <span className="text-accent text-xl font-semibold">jonathan.hu</span>
          <span className="text-text-muted text-[0.8rem]">v1.0.0</span>
        </div>
        <div className="flex flex-col gap-2">
          {bootSteps.slice(0, visibleSteps).map((step, index) => (
            <div key={index} className="flex items-center gap-3 animate-fade-in">
              <span
                className={`w-5 text-center shrink-0 ${step.status === 'loading' ? 'text-warning' : 'text-accent'}`}
              >
                {step.status === 'loading' ? '...' : step.status === 'success' ? '✓' : '>'}
              </span>
              <span
                className={step.status === 'success' ? 'text-text-primary' : 'text-text-secondary'}
              >
                {step.text}
              </span>
              {step.status === 'loading' && index === visibleSteps - 1 && (
                <span className="inline-flex ml-1">
                  <span className="animate-dot-pulse text-warning">.</span>
                  <span className="animate-dot-pulse-delay-1 text-warning">.</span>
                  <span className="animate-dot-pulse-delay-2 text-warning">.</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
