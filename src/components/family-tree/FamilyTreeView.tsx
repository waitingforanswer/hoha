import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FamilyTreeNode } from "./FamilyTreeNode";
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Gender icons as simple components
const MaleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="5"/>
    <line x1="19" y1="5" x2="13.6" y2="10.4"/>
    <line x1="19" y1="5" x2="14" y2="5"/>
    <line x1="19" y1="5" x2="19" y2="10"/>
  </svg>
);

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/>
    <line x1="12" y1="13" x2="12" y2="21"/>
    <line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
);

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
  spouse_id: string | null;
  is_primary_lineage: boolean | null;
  lineage_type?: string | null;
}

interface FamilyTreeViewProps {
  members: FamilyMember[];
}

function buildFamilyTree(members: FamilyMember[]) {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));
  
  // Find all children for a couple (father + mother)
  const getChildrenForCouple = (fatherId: string | null, motherId: string | null): FamilyMember[] => {
    return members.filter(m => {
      if (fatherId && motherId) {
        return m.father_id === fatherId && m.mother_id === motherId;
      }
      if (fatherId) {
        return m.father_id === fatherId;
      }
      if (motherId) {
        return m.mother_id === motherId;
      }
      return false;
    }).sort((a, b) => {
      if (a.birth_date && b.birth_date) {
        return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
      }
      return 0;
    });
  };
  
  // Find spouse for a member
  const getSpouse = (member: FamilyMember): FamilyMember | null => {
    // Check direct spouse_id link
    if (member.spouse_id && memberMap.has(member.spouse_id)) {
      return memberMap.get(member.spouse_id)!;
    }
    
    // Find spouse by looking at children's parents
    const children = members.filter(m => 
      m.father_id === member.id || m.mother_id === member.id
    );
    
    for (const child of children) {
      if (member.gender === 'male' && child.mother_id && memberMap.has(child.mother_id)) {
        return memberMap.get(child.mother_id)!;
      }
      if (member.gender === 'female' && child.father_id && memberMap.has(child.father_id)) {
        return memberMap.get(child.father_id)!;
      }
    }
    
    return null;
  };
  
  // Find root members (primary lineage members without parents in the system, or oldest generation)
  const rootMembers = members.filter(member => {
    // Must be primary lineage
    if (member.is_primary_lineage === false) return false;
    
    // Check if parents exist in system
    const hasParentInSystem = 
      (member.father_id && memberMap.has(member.father_id)) ||
      (member.mother_id && memberMap.has(member.mother_id));
    
    return !hasParentInSystem;
  }).sort((a, b) => a.generation - b.generation);
  
  return { rootMembers, memberMap, getChildrenForCouple, getSpouse };
}

export function FamilyTreeView({ members }: FamilyTreeViewProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  const { rootMembers, memberMap, getChildrenForCouple, getSpouse } = buildFamilyTree(members);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.3));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    if (!isFullscreen) {
      setPosition({ x: 0, y: 0 });
    }
  };
  
  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);
  
  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on a link or button
    if ((e.target as HTMLElement).closest('a, button')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);
  
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
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale));
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

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);
  
  // Recursive function to render family tree - always vertical, no expand/collapse
  const renderFamilyTree = (primaryMember: FamilyMember, processedIds: Set<string>): React.ReactNode => {
    if (processedIds.has(primaryMember.id)) return null;
    processedIds.add(primaryMember.id);
    
    const spouse = getSpouse(primaryMember);
    if (spouse) {
      processedIds.add(spouse.id);
    }
    
    // Get children of this couple
    const children = getChildrenForCouple(
      primaryMember.gender === 'male' ? primaryMember.id : spouse?.id || null,
      primaryMember.gender === 'female' ? primaryMember.id : spouse?.id || null
    );
    
    // Check if children continue the bloodline (họ Hà)
    const childrenContinueBloodline = primaryMember.is_primary_lineage !== false && primaryMember.gender === 'male';
    
    return (
      <div key={primaryMember.id} className="flex flex-col items-center gap-3">
        {/* Couple display */}
        <div className="flex items-center gap-2">
          <FamilyTreeNode member={primaryMember} />
          
          {spouse && (
            <>
              {/* Marriage connector - dashed gray line */}
              <div className="flex items-center">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-lineage-marriage" />
              </div>
              <FamilyTreeNode member={spouse} isSpouse />
            </>
          )}
        </div>
        
        {/* Children */}
        {children.length > 0 && (
          <div className="relative">
            {/* Connector line from parent to children - bloodline or faded */}
            <div 
              className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full",
                childrenContinueBloodline 
                  ? "w-[3px] h-3 bg-lineage-primary" 
                  : "w-0.5 h-3 border-l-2 border-dashed border-lineage-faded"
              )}
            />
            
            <div className="flex gap-6 pt-3 relative">
              {/* Horizontal line connecting children */}
              {children.length > 1 && (
                <div 
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2",
                    childrenContinueBloodline 
                      ? "h-[3px] bg-lineage-primary" 
                      : "h-0.5 border-t-2 border-dashed border-lineage-faded"
                  )}
                  style={{ width: `calc(100% - 80px)` }}
                />
              )}
              
              {children.map(child => {
                // Only recursively render primary lineage children
                if (child.is_primary_lineage !== false) {
                  return (
                    <div key={child.id} className="relative flex flex-col items-center">
                      <div className={cn(
                        "-mt-3",
                        childrenContinueBloodline 
                          ? "w-[3px] h-6 bg-lineage-primary" 
                          : "w-0.5 h-6 border-l-2 border-dashed border-lineage-faded"
                      )} />
                      {renderFamilyTree(child, processedIds)}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (members.length === 0) {
    return null;
  }
  
  const processedIds = new Set<string>();

  const treeContent = (
    <>
      {/* Controls */}
      <div className={cn(
        "flex items-center gap-2 flex-wrap",
        isFullscreen && "absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-lg shadow-lg"
      )}>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.3}
          title="Thu nhỏ"
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
          disabled={zoom >= 3}
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetZoom}
          title="Đặt lại"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Giữ chuột để kéo</span>
        </div>
      </div>
      
      {/* Tree container */}
      <div 
        ref={containerRef}
        className={cn(
          "overflow-hidden border rounded-lg bg-muted/30 select-none",
          isFullscreen ? "flex-1" : "min-h-[400px] max-h-[70vh]",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={contentRef}
          className="p-8 inline-block min-w-full transition-transform duration-75"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <div className="flex flex-col items-center gap-8">
            {rootMembers.map((rootMember) => (
              renderFamilyTree(rootMember, processedIds)
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className={cn(
        "flex items-center gap-4 text-sm text-muted-foreground flex-wrap p-3 bg-muted/50 rounded-lg",
        isFullscreen && "absolute bottom-4 left-4 right-4 z-10 bg-background/90 backdrop-blur-sm shadow-lg"
      )}>
        <span className="font-medium text-foreground">Chú thích:</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded border-2 border-lineage-primary bg-card" />
          <span>Họ Hà (huyết thống)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded border-2 border-dashed border-lineage-secondary-light bg-card" />
          <span>Dâu/Rể</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded border-2 border-lineage-maternal bg-card" />
          <span>Con ngoại tộc</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded border-2 border-lineage-tertiary bg-card" />
          <span>Ngoại tộc (con gái đi lấy chồng)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-[3px] bg-lineage-primary" />
          <span>Đường huyết thống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-lineage-marriage" />
          <span>Đường hôn nhân</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-lineage-faded" />
          <span>Đường đứt mạch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <MaleIcon className="h-2.5 w-2.5 text-white" />
          </div>
          <span>Nam</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
            <FemaleIcon className="h-2.5 w-2.5 text-white" />
          </div>
          <span>Nữ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-card opacity-60 grayscale" />
          <span>Đã mất</span>
        </div>
      </div>
    </>
  );
  
  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div 
        ref={fullscreenRef}
        className="fixed inset-0 z-50 bg-background flex flex-col p-4 gap-4"
      >
        {treeContent}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {treeContent}
    </div>
  );
}
