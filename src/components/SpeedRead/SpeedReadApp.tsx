import { useState } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import type { AppComponentProps } from '../../types/window';

const SAMPLE_TEXT = `Welcome to SpeedRead. This sample will gradually increase in speed from 200 words per minute all the way up to 900. Just relax and let your eyes focus on the highlighted letter. You do not need to move your eyes at all. The word will come to you.

Right now you are reading at a comfortable pace. Most people read around 200 to 250 words per minute when reading text on a screen. At this speed every word should feel easy and natural. There is no rush. Let each word register before the next one appears.

Now the pace is starting to pick up slightly. You may notice that you are still able to understand every word without difficulty. This is because your brain processes language faster than you normally read. The bottleneck in traditional reading is eye movement, not comprehension. By eliminating saccades, RSVP frees your brain to work at its natural speed.

We are now approaching 400 words per minute. Many trained speed readers operate comfortably at this level for extended periods of time. The key is to avoid subvocalization, which means silently pronouncing each word in your head. Instead, try to absorb the meaning of each word visually, the same way you recognize a face or a familiar logo without spelling it out.

The speed continues to climb. At this point you are reading significantly faster than the average person. Some words may start to feel like they appear and vanish quickly, but your brain is still capturing them. Trust the process. Research shows that comprehension remains high even at elevated speeds when words are presented one at a time in a fixed position.

You are now well above 500 words per minute. This is the range where speed reading starts to feel genuinely fast. Short common words like the, and, is, and it should be nearly invisible because your brain predicts and fills them in automatically. Longer and more unusual words will naturally draw more of your attention.

At this stage the words are flying past at around 600 to 700 words per minute. You are processing information at roughly three times the speed of a typical reader. Even if you miss an occasional word, the overall meaning of each sentence should still come through clearly. This is the power of RSVP technology combined with focused attention.

We are now pushing toward the upper limits. The display speed is approaching 800 words per minute. Elite speed readers and competitive reading athletes often train at this pace. It requires intense concentration and a quiet environment, but it is absolutely achievable with practice. The more you use SpeedRead, the more natural these higher speeds will feel.

You have reached approximately 900 words per minute. This is the fastest setting in the application. At this speed you are reading roughly four times faster than average. Congratulations on making it through the entire sample. You can now paste your own text and choose any speed you like, or try this sample again to see how much easier it feels the second time around.`;

export const SpeedReadApp = (props: AppComponentProps) => {
  void props;
  const { openApp } = useWindowManager();
  const [text, setText] = useState('');
  const [wpm, setWpm] = useState(300);
  const [showIntro, setShowIntro] = useState(true);

  const handleRead = () => {
    const content = text.trim();
    if (!content) return;
    openApp('speedread-reader', {
      data: { text: content, wpm },
    });
  };

  const handleTrySample = () => {
    openApp('speedread-reader', {
      data: { text: SAMPLE_TEXT, wpm: 200, progressive: true },
    });
  };

  if (showIntro) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-bg-primary p-8">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-text-primary font-mono">SpeedRead</h1>

          <p className="text-sm leading-relaxed text-text-secondary font-mono">
            Read faster using <span className="text-accent">RSVP</span> (Rapid Serial Visual
            Presentation). Words flash one at a time at your chosen speed, eliminating eye movement
            and letting your brain focus purely on recognition.
          </p>

          <div className="flex w-full flex-col gap-3 text-left">
            <div className="flex items-start gap-3 rounded-lg bg-bg-terminal p-3">
              <span className="mt-0.5 text-accent font-mono text-sm">1.</span>
              <span className="text-xs text-text-secondary font-mono">
                Paste any text — articles, essays, notes
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-bg-terminal p-3">
              <span className="mt-0.5 text-accent font-mono text-sm">2.</span>
              <span className="text-xs text-text-secondary font-mono">
                Set your speed (100–1000 WPM)
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-bg-terminal p-3">
              <span className="mt-0.5 text-accent font-mono text-sm">3.</span>
              <span className="text-xs text-text-secondary font-mono">
                Click Read — words flash in a new window with playback controls
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowIntro(false)}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg-primary font-mono transition-colors hover:bg-accent/80"
            >
              Begin
            </button>
            <button
              onClick={handleTrySample}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-mono text-text-secondary transition-colors hover:bg-bg-terminal hover:text-text-primary"
            >
              Try Sample
            </button>
          </div>
        </div>
      </div>
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = wordCount > 0 ? Math.ceil((wordCount / wpm) * 60) : 0;

  return (
    <div className="flex h-full w-full flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-sm font-semibold">SpeedRead</span>
        </div>
        <button
          onClick={() => {
            setShowIntro(true);
            setText('');
          }}
          className="text-xs font-mono text-text-muted transition-colors hover:text-text-secondary"
        >
          Back to intro
        </button>
      </div>

      {/* Text Input */}
      <div className="flex flex-1 flex-col gap-3 p-4 overflow-hidden">
        <label className="text-xs font-mono text-text-secondary">Paste your text below</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an article, essay, or any text here..."
          className="flex-1 resize-none rounded-lg border border-border bg-bg-terminal p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          autoFocus
        />

        {/* Stats */}
        {wordCount > 0 && (
          <div className="flex gap-4 text-xs font-mono text-text-muted">
            <span>{wordCount} words</span>
            <span>
              ~{readTime}s at {wpm} WPM
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 border-t border-border p-4">
        {/* WPM Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-text-secondary">Speed</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={wpm}
                onChange={(e) => {
                  const v = Math.max(100, Math.min(1000, Number(e.target.value) || 100));
                  setWpm(v);
                }}
                className="w-16 rounded border border-border bg-bg-terminal px-2 py-1 text-center font-mono text-sm text-accent focus:border-accent focus:outline-none"
                min={100}
                max={1000}
                step={25}
              />
              <span className="text-xs font-mono text-text-muted">WPM</span>
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={25}
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] font-mono text-text-muted">
            <span>100</span>
            <span>Slow</span>
            <span>300</span>
            <span>Fast</span>
            <span>1000</span>
          </div>
        </div>

        {/* Read Button */}
        <button
          onClick={handleRead}
          disabled={wordCount === 0}
          className="w-full rounded-lg bg-accent py-3 font-mono text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Read ({wordCount} words)
        </button>
      </div>
    </div>
  );
};
