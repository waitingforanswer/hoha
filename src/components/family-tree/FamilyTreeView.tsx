import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FamilyTreeBranch } from "./FamilyTreeBranch";
import { ZoomIn, ZoomOut, RotateCcw, MonitorSmartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FamilyMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean | null;
  address: string | null;
  gender: string | null;
  father_id: string | null;
  mother_id: string | null;
  generation: number;
}

interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
}

interface FamilyTreeViewProps {
  members: FamilyMember[];
}

function buildFamilyTree(members: FamilyMember[]): TreeNode[] {
  // Find root members (those without parents in the system)
  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));
  
  // Build children map
  const childrenMap = new Map<string, FamilyMember[]>();
  
  members.forEach(member => {
    // Add as child to father
    if (member.father_id && memberMap.has(member.father_id)) {
      const existing = childrenMap.get(member.father_id) || [];
      if (!existing.find(c => c.id === member.id)) {
        childrenMap.set(member.father_id, [...existing, member]);
      }
    }
    // Add as child to mother (only if no father, to avoid duplicates)
    else if (member.mother_id && memberMap.has(member.mother_id)) {
      const existing = childrenMap.get(member.mother_id) || [];
      if (!existing.find(c => c.id === member.id)) {
        childrenMap.set(member.mother_id, [...existing, member]);
      }
    }
  });
  
  // Find root nodes (members without parents in the system)
  const roots = members.filter(member => {
    const hasParentInSystem = 
      (member.father_id && memberMap.has(member.father_id)) ||
      (member.mother_id && memberMap.has(member.mother_id));
    return !hasParentInSystem;
  });
  
  // Build tree recursively
  function buildNode(member: FamilyMember): TreeNode {
    const children = childrenMap.get(member.id) || [];
    return {
      member,
      children: children
        .sort((a, b) => {
          // Sort by birth date
          if (a.birth_date && b.birth_date) {
            return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
          }
          return 0;
        })
        .map(child => buildNode(child))
    };
  }
  
  return roots
    .sort((a, b) => a.generation - b.generation)
    .map(root => buildNode(root));
}

export function FamilyTreeView({ members }: FamilyTreeViewProps) {
  const isMobile = useIsMobile();
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("vertical");
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const trees = buildFamilyTree(members);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
  };
  
  const toggleOrientation = () => {
    setOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal");
  };
  
  // Handle pinch zoom on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let initialDistance = 0;
    let initialZoom = zoom;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = zoom;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.5, Math.min(2, initialZoom * scale));
        setZoom(newZoom);
      }
    };
    
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [zoom]);
  
  if (members.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetZoom}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleOrientation}
          className="gap-2"
        >
          {orientation === "vertical" ? (
            <>
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Xem ngang</span>
            </>
          ) : (
            <>
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Xem dọc</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Tree container */}
      <div 
        ref={containerRef}
        className="overflow-auto border rounded-lg bg-muted/30 min-h-[400px] max-h-[70vh]"
      >
        <div 
          className={cn(
            "p-8 inline-block min-w-full transition-transform origin-top-left",
            orientation === "horizontal" ? "min-h-full" : ""
          )}
          style={{ transform: `scale(${zoom})` }}
        >
          <div className={cn(
            "flex gap-8",
            orientation === "vertical" ? "flex-col items-center" : "flex-row items-start"
          )}>
            {trees.map((tree) => (
              <FamilyTreeBranch 
                key={tree.member.id} 
                node={tree} 
                orientation={orientation}
                isRoot 
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-card" />
          <span>Còn sống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-card opacity-60 grayscale" />
          <span>Đã mất</span>
        </div>
      </div>
    </div>
  );
}
