interface NodeStatusListProps {
  nodes: string[];
  type: 'alive' | 'down';
}

export function NodeStatusList({ nodes, type }: NodeStatusListProps) {
  if (!nodes || nodes.length === 0) {
    return <p className={type}>なし</p>;
  }

  return (
    <p className={type}>
      {nodes.map((node, index) => (
        <span key={index}>
          {node}
          {index < nodes.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}
