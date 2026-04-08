import React, { useMemo, forwardRef, useState, useCallback, useRef, useEffect } from "react";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import { OrgNodeCard } from "./OrgNodeCard";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp } from "lucide-react";

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

/** Group sibling children that share the same cargo */
interface GroupedChild {
  cargo: string;
  items: TreeNodeData[];
}

function groupChildren(children: TreeNodeData[]): GroupedChild[] {
  const groups: GroupedChild[] = [];
  const map = new Map<string, TreeNodeData[]>();
  const order: string[] = [];

  children.forEach((c) => {
    const key = c.node.cargo;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(c);
  });

  order.forEach((cargo) => {
    groups.push({ cargo, items: map.get(cargo)! });
  });

  return groups;
}

const INITIAL_VISIBLE = 3;

/* ── Collapsible group: shows "Cargo (N)" chip when collapsed ── */
function CollapsibleGroup({
  group,
  depth,
  onNodeClick,
}: {
  group: GroupedChild;
  depth: number;
  onNodeClick: (n: OrganogramaNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const count = group.items.length;

  // Single item — render directly
  if (count === 1) {
    return <TreeBranch data={group.items[0]} depth={depth} onNodeClick={onNodeClick} />;
  }

  // Collapsed state — compact chip
  if (!expanded) {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={() => setExpanded(true)}
          className="group relative min-w-[180px] max-w-[220px] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 shadow-sm hover:shadow-md hover:border-muted-foreground/50 transition-all text-left cursor-pointer"
        >
          <div className="text-sm font-semibold text-foreground leading-tight truncate">
            {group.cargo}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {count} posições
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </button>
      </div>
    );
  }

  // Expanded state — show items (with "+X itens" limit)
  const visibleItems = showAll ? group.items : group.items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = count - INITIAL_VISIBLE;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => { setExpanded(false); setShowAll(false); }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
      >
        <ChevronUp className="h-3 w-3" />
        <span>Recolher {group.cargo} ({count})</span>
      </button>

      <div className="flex flex-col items-center">
        {/* Vertical connector */}
        <div className="relative flex items-start">
          {visibleItems.length > 1 && (
            <div
              className="absolute top-0 h-[2px] bg-muted-foreground/40"
              style={{
                left: `calc(${100 / (visibleItems.length * 2)}%)`,
                right: `calc(${100 / (visibleItems.length * 2)}%)`,
              }}
            />
          )}
          <div className="flex gap-5 items-start">
            {visibleItems.map((child) => (
              <div key={child.node.id} className="flex flex-col items-center">
                {visibleItems.length > 1 && <div className="w-[2px] h-5 bg-muted-foreground/40" />}
                <TreeBranch data={child} depth={depth} onNodeClick={onNodeClick} />
              </div>
            ))}
          </div>
        </div>

        {/* +X itens button */}
        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            +{hiddenCount} {hiddenCount === 1 ? "item" : "itens"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Single tree branch (node + children) ── */
function TreeBranch({
  data,
  depth,
  onNodeClick,
}: {
  data: TreeNodeData;
  depth: number;
  onNodeClick: (n: OrganogramaNode) => void;
}) {
  const groups = useMemo(() => groupChildren(data.children), [data.children]);
  const hasChildren = groups.length > 0;

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard node={data.node} depth={depth} onClick={onNodeClick} />

      {hasChildren && (
        <div className="flex flex-col items-center">
          {/* Vertical connector from parent */}
          <div className="w-[2px] h-7 bg-muted-foreground/40" />

          {groups.length === 1 && groups[0].items.length === 1 ? (
            // Single child — straight line
            <TreeBranch data={groups[0].items[0]} depth={depth + 1} onNodeClick={onNodeClick} />
          ) : (
            <div className="flex flex-col items-center">
              {/* Horizontal rail + children */}
              <div className="relative flex items-start">
                {groups.length > 1 && (
                  <div
                    className="absolute top-0 h-[2px] bg-muted-foreground/40"
                    style={{
                      left: `calc(${100 / (groups.length * 2)}%)`,
                      right: `calc(${100 / (groups.length * 2)}%)`,
                    }}
                  />
                )}
                <div className="flex gap-6 items-start">
                  {groups.map((group, gi) => (
                    <div key={gi} className="flex flex-col items-center">
                      {groups.length > 1 && <div className="w-[2px] h-5 bg-muted-foreground/40" />}
                      <CollapsibleGroup group={group} depth={depth + 1} onNodeClick={onNodeClick} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main OrgTree component ── */
interface OrgTreeProps {
  nodes: OrganogramaNode[];
  onNodeClick: (node: OrganogramaNode) => void;
}

export const OrgTree = forwardRef<HTMLDivElement, OrgTreeProps>(({ nodes, onNodeClick }, ref) => {
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(false);

  // Auto-center on first render
  useEffect(() => {
    if (centered || tree.length === 0) return;
    const timer = setTimeout(() => {
      if (containerRef.current && contentRef.current) {
        const containerW = containerRef.current.clientWidth;
        const contentW = contentRef.current.scrollWidth;
        if (contentW > containerW) {
          setPosition({ x: (containerW - contentW) / 2, y: 0 });
        }
        setCentered(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [tree, centered]);

  // Reset centering when nodes change
  useEffect(() => setCentered(false), [nodes]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.15, 2)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.15, 0.3)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCentered(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setScale((s) => Math.min(Math.max(s + delta, 0.3), 2));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    const handleGlobalUp = () => setDragging(false);
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
  }, []);

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Nenhum nó cadastrado. Adicione o primeiro cargo ao organograma.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Centralizar">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="overflow-hidden min-h-[500px] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "top center",
            transition: dragging ? "none" : "transform 0.2s ease-out",
          }}
          className="py-10 px-8"
        >
          <div ref={ref} className="inline-flex flex-col gap-0 items-center w-full">
            {tree.map((root) => (
              <TreeBranch key={root.node.id} data={root} depth={0} onNodeClick={onNodeClick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

OrgTree.displayName = "OrgTree";
