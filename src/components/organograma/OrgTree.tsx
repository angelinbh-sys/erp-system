import React, { useMemo, forwardRef } from "react";
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

function TreeBranch({ data, depth, onNodeClick }: { data: TreeNodeData; depth: number; onNodeClick: (n: OrganogramaNode) => void }) {
  const childCount = data.children.length;

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard node={data.node} depth={depth} onClick={onNodeClick} />
      {childCount > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical line down from parent */}
          <div className="w-0.5 h-6 bg-border/70" />

          {childCount === 1 ? (
            /* Single child — just a straight vertical connector */
            <TreeBranch data={data.children[0]} depth={depth + 1} onNodeClick={onNodeClick} />
          ) : (
            /* Multiple children — horizontal rail + vertical drops */
            <div className="relative flex items-start">
              {/* Horizontal rail connecting first child center to last child center */}
              <div
                className="absolute top-0 h-0.5 bg-border/70"
                style={{
                  left: `calc(${(100 / (childCount * 2))}%)`,
                  right: `calc(${(100 / (childCount * 2))}%)`,
                }}
              />
              <div className="flex gap-8 items-start">
                {data.children.map((child) => (
                  <div key={child.node.id} className="flex flex-col items-center">
                    {/* Vertical drop from horizontal rail to child */}
                    <div className="w-0.5 h-5 bg-border/70" />
                    <TreeBranch data={child} depth={depth + 1} onNodeClick={onNodeClick} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OrgTreeProps {
  nodes: OrganogramaNode[];
  onNodeClick: (node: OrganogramaNode) => void;
}

export const OrgTree = forwardRef<HTMLDivElement, OrgTreeProps>(({ nodes, onNodeClick }, ref) => {
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
      <div ref={ref} className="inline-flex gap-10 justify-center items-start">
        {tree.map((root) => (
          <TreeBranch key={root.node.id} data={root} depth={0} onNodeClick={onNodeClick} />
        ))}
      </div>
    </div>
  );
});

OrgTree.displayName = "OrgTree";
