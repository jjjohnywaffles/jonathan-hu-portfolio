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
    <div className={`boot-sequence ${complete ? 'fade-out' : ''}`}>
      <div className="boot-content">
        <div className="boot-header">
          <span className="boot-title">jonathan.hu</span>
          <span className="boot-version">v1.0.0</span>
        </div>
        <div className="boot-steps">
          {bootSteps.slice(0, visibleSteps).map((step, index) => (
            <div key={index} className={`boot-step ${step.status}`}>
              <span className="boot-prefix">
                {step.status === 'loading' ? '...' : step.status === 'success' ? '✓' : '>'}
              </span>
              <span className="boot-text">{step.text}</span>
              {step.status === 'loading' && index === visibleSteps - 1 && (
                <span className="boot-dots">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              )}
            </div>
          ))}
        </div>
        {complete && (
          <div className="boot-complete">
            <span>Press any key or wait to continue...</span>
          </div>
        )}
      </div>
    </div>
  );
};
