import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

type Align = 'left' | 'center' | 'right';

interface MetricInfoProps {
  title: string;
  description: string;
  formula?: string;
  note?: string;
  align?: Align;
  iconClassName?: string;
}

export function MetricInfo({
  title,
  description,
  formula,
  note,
  align = 'center',
  iconClassName,
}: MetricInfoProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const popoverPosition =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`text-slate-400 hover:text-slate-600 transition-colors ${iconClassName ?? ''}`}
        aria-label={`How is ${title} calculated?`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className={`absolute z-50 top-6 ${popoverPosition} w-64 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 leading-relaxed`}
          role="tooltip"
        >
          <div className="font-semibold mb-1.5 text-slate-50">{title}</div>
          <div className="text-slate-200 mb-2">{description}</div>
          {formula && (
            <div className="font-mono text-[11px] bg-slate-800 rounded px-2 py-1.5 mb-2 text-slate-100 break-words">
              {formula}
            </div>
          )}
          {note && <div className="text-amber-300 text-[11px] italic">{note}</div>}
        </div>
      )}
    </div>
  );
}
