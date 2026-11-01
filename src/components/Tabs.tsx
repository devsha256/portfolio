import { useRef, type KeyboardEvent, type ReactNode } from 'react';

type Tab = { id: string; label: string };

type TabListProps = {
  label: string;
  tabs: readonly Tab[];
  selected: string;
  onSelect: (id: string) => void;
};

const KEY_STEPS: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_i, n) => n - 1,
};

function TabList({ label, tabs, selected, onSelect }: TabListProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = KEY_STEPS[event.key];
    const next = step ? step(index, tabs.length) : -1;
    const tab = tabs[next];
    if (!tab) return;
    event.preventDefault();
    onSelect(tab.id);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2 border-b border-line">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === selected}
          aria-controls={`panel-${tab.id}`}
          tabIndex={tab.id === selected ? 0 : -1}
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className="-mb-px border-b-2 border-transparent px-3 py-2 font-medium aria-selected:border-signal"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** WAI-ARIA tabs with automatic activation: arrow keys, Home and End move and select. */
export function Tabs({ children, ...list }: TabListProps & { children: ReactNode }) {
  return (
    <>
      <TabList {...list} />
      <div role="tabpanel" id={`panel-${list.selected}`} aria-labelledby={`tab-${list.selected}`} tabIndex={0} className="pt-8">
        {children}
      </div>
    </>
  );
}
