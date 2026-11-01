const NODES = ['source', 'transform', 'target'] as const;

/**
 * The site's one piece of ambient motion: a signal travels a source → transform → target
 * connector once on load, ending at the name. Decorative only; reduced motion skips straight to the end.
 */
export function FlowLine() {
  return (
    <div className="flow" aria-hidden="true">
      {NODES.map((label) => (
        <span key={label} className={label === 'target' ? 'flow__node flow__node--end' : 'flow__node'}>
          {label}
        </span>
      ))}
      <span className="flow__pulse" />
    </div>
  );
}
