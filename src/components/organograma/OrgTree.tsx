import React, { useMemo } from "react";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import { OrgNodeCard } from "./OrgNodeCard";

interface TreeNodeData {
  node: OrganogramaNode;
  children: TreeNodeData[];
}

function buildTree(nodes: OrganogramaNode[]): TreeNodeData[] {
  const map = new Map<string, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  nodes.forEach((n) => map.set(n.id, { node: n, children: [] }));

  nodes.forEach((n) => {
    const treeNode = map.get(n.id)!;
    if (n.superior_id && map.has(n.superior_id)) {
      map.get(n.superior_id)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });

  return roots;
}

function TreeBranch({ data, onNodeClick }: { data: TreeNodeData; onNodeClick: (n: OrganogramaNode) => void }) {
  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard node={data.node} onClick={onNodeClick} />
      {data.children.length > 0 && (
        <>
          {/* vertical connector */}
          <div className="w-px h-6 bg-border" />
          {/* horizontal line spanning children */}
          {data.children.length > 1 && (
            <div className="relative flex items-start">
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: "50%",
                  right: "50%",
                  // will be sized by children flex
                }}
              />
            </div>
          )}
          <div className="flex gap-6 items-start">
            {data.children.map((child, i) => (
              <div key={child.node.id} className="flex flex-col items-center">
                {data.children.length > 1 && (
                  <div className="w-px h-4 bg-border" />
                )}
                <TreeBranch data={child} onNodeClick={onNodeClick} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface OrgTreeProps {
  nodes: OrganogramaNode[];
  onNodeClick: (node: OrganogramaNode) => void;
}

export function OrgTree({ nodes, onNodeClick }: OrgTreeProps) {
  const tree = useMemo(() => buildTree(nodes), [nodes]);

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Nenhum nó cadastrado. Adicione o primeiro cargo ao organograma.
      </div>
    );
  }

  return (
    <div className="overflow-auto py-8 px-4">
      <div className="flex gap-10 justify-center items-start">
        {tree.map((root) => (
          <TreeBranch key={root.node.id} data={root} onNodeClick={onNodeClick} />
        ))}
      </div>
    </div>
  );
}
