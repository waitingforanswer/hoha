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

interface FamilyMarriage {
  id: string;
  husband_id: string;
  wife_id: string;
  marriage_order: number;
  marriage_date: string | null;
  divorce_date: string | null;
  is_active: boolean;
  notes: string | null;
}

interface FamilyTreeViewProps {
  members: FamilyMember[];
  marriages?: FamilyMarriage[];
}

function buildFamilyTree(members: FamilyMember[], marriages: FamilyMarriage[] = []) {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));
  
  // Build marriages map: husband_id -> array of wives (sorted by marriage_order)
  const marriagesMap = new Map<string, Array<{ wife: FamilyMember; order: number; isActive: boolean }>>();
  
  marriages.forEach(m => {
    const wife = memberMap.get(m.wife_id);
    if (wife) {
      const existing = marriagesMap.get(m.husband_id) || [];
      existing.push({ wife, order: m.marriage_order, isActive: m.is_active });
      marriagesMap.set(m.husband_id, existing);
    }
  });
  
  // Sort wives by marriage_order
  marriagesMap.forEach((wives, husbandId) => {
    wives.sort((a, b) => a.order - b.order);
  });
  
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
  
  // Get all spouses for a member (supports multiple wives)
  const getSpouses = (member: FamilyMember): Array<{ spouse: FamilyMember; order: number; isActive: boolean }> => {
    // Check marriages table first (for multiple wives)
    if (member.gender === 'male') {
      const wives = marriagesMap.get(member.id);
      if (wives && wives.length > 0) {
        return wives.map(w => ({ spouse: w.wife, order: w.order, isActive: w.isActive }));
      }
    }
    
    // Fallback to spouse_id for backwards compatibility
    if (member.spouse_id && memberMap.has(member.spouse_id)) {
      return [{ spouse: memberMap.get(member.spouse_id)!, order: 1, isActive: true }];
    }
    
    // Find spouse by looking at children's parents
    const children = members.filter(m => 
      m.father_id === member.id || m.mother_id === member.id
    );
    
    // Group by spouse to find all unique spouses
    const spouseMap = new Map<string, FamilyMember>();
    for (const child of children) {
      if (member.gender === 'male' && child.mother_id && memberMap.has(child.mother_id)) {
        spouseMap.set(child.mother_id, memberMap.get(child.mother_id)!);
      }
      if (member.gender === 'female' && child.father_id && memberMap.has(child.father_id)) {
        spouseMap.set(child.father_id, memberMap.get(child.father_id)!);
      }
    }
    
    // Return all found spouses (without order info, they all get order 1)
    return Array.from(spouseMap.values()).map((spouse, idx) => ({
      spouse,
      order: idx + 1,
      isActive: true
    }));
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
  
  return { rootMembers, memberMap, getChildrenForCouple, getSpouses, marriagesMap };
}

// Helper to get wife label
function getWifeLabel(order: number): string {
  switch (order) {
    case 1: return "Vợ cả";
    case 2: return "Vợ hai";
    case 3: return "Vợ ba";
    case 4: return "Vợ tư";
    case 5: return "Vợ năm";
    default: return `Vợ ${order}`;
  }
}

export function FamilyTreeView({ members, marriages = [] }: FamilyTreeViewProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Touch gesture states
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  const { rootMembers, memberMap, getChildrenForCouple, getSpouses, marriagesMap } = buildFamilyTree(members, marriages);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3));
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
  
  // Handle mouse wheel zoom - requires Ctrl/Cmd key
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only zoom if Ctrl (Windows) or Meta/Cmd (Mac) is held
    if (!e.ctrlKey && !e.metaKey) {
      return; // Allow normal scrolling
    }
    
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

  // Touch handlers for mobile/tablet
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start dragging if touching a link or button
    if ((e.target as HTMLElement).closest('a, button')) return;
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Single touch drag start
      setIsTouching(true);
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      // Pinch zoom
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setZoom(prev => Math.max(0.3, Math.min(3, prev * scale)));
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isTouching && !isPinching) {
      // Single touch drag
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y
      });
    }
  }, [isTouching, isPinching, touchStart, lastTouchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsTouching(false);
      setIsPinching(false);
      setLastTouchDistance(0);
    } else if (e.touches.length === 1) {
      // Switched from pinch to single touch
      setIsPinching(false);
      setLastTouchDistance(0);
      setIsTouching(true);
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);

  // Handle minimap click to navigate
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate relative position (0-1)
    const relativeX = clickX / rect.width;
    const relativeY = clickY / rect.height;
    
    // Calculate new position to center the view on clicked point
    const scaledContentWidth = contentSize.width * zoom;
    const scaledContentHeight = contentSize.height * zoom;
    
    const newX = -(relativeX * scaledContentWidth - containerSize.width / 2);
    const newY = -(relativeY * scaledContentHeight - containerSize.height / 2);
    
    setPosition({ x: newX, y: newY });
  }, [contentSize, containerSize, zoom]);
  
  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Update content and container sizes
  useEffect(() => {
    const updateSizes = () => {
      if (contentRef.current) {
        setContentSize({
          width: contentRef.current.scrollWidth,
          height: contentRef.current.scrollHeight
        });
      }
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateSizes();
    window.addEventListener('resize', updateSizes);
    
    // Update after a short delay to ensure content is rendered
    const timer = setTimeout(updateSizes, 100);
    
    return () => {
      window.removeEventListener('resize', updateSizes);
      clearTimeout(timer);
    };
  }, [members, zoom, isFullscreen]);

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
  
  // Recursive function to render family tree with multiple spouses support
  const renderFamilyTree = (primaryMember: FamilyMember, processedIds: Set<string>): React.ReactNode => {
    if (processedIds.has(primaryMember.id)) return null;
    processedIds.add(primaryMember.id);
    
    const spouses = getSpouses(primaryMember);
    const hasMultipleSpouses = spouses.length > 1;
    
    // Mark all spouses as processed
    spouses.forEach(s => processedIds.add(s.spouse.id));
    
    // Check if children continue the bloodline (họ Hà)
    const childrenContinueBloodline = primaryMember.is_primary_lineage !== false && primaryMember.gender === 'male';
    
    // Get all children grouped by mother
    const childrenByMother = new Map<string | null, FamilyMember[]>();
    
    if (primaryMember.gender === 'male') {
      spouses.forEach(({ spouse }) => {
        const children = getChildrenForCouple(primaryMember.id, spouse.id);
        if (children.length > 0) {
          childrenByMother.set(spouse.id, children);
        }
      });
      
      // Also get children with unknown mother
      const childrenWithUnknownMother = members.filter(m => 
        m.father_id === primaryMember.id && 
        (!m.mother_id || !spouses.find(s => s.spouse.id === m.mother_id))
      );
      if (childrenWithUnknownMother.length > 0) {
        childrenByMother.set(null, childrenWithUnknownMother);
      }
    } else {
      // For female members, get children with husband
      const spouse = spouses[0]?.spouse;
      const children = getChildrenForCouple(spouse?.id || null, primaryMember.id);
      if (children.length > 0) {
        childrenByMother.set(primaryMember.id, children);
      }
    }
    
    return (
      <div key={primaryMember.id} className="flex flex-col items-center gap-3">
        {/* Couple display with multiple spouses support */}
        <div className="flex items-start gap-2">
          <FamilyTreeNode member={primaryMember} />
          
          {spouses.length > 0 && (
            <div className="flex flex-col gap-2">
              {spouses.map(({ spouse, order, isActive }, idx) => (
                <div key={spouse.id} className="flex items-center">
                  {/* Marriage connector - dashed gray line */}
                  <div className="flex items-center">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-lineage-marriage" />
                  </div>
                  <FamilyTreeNode 
                    member={spouse} 
                    isSpouse 
                    wifeOrder={hasMultipleSpouses ? order : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Children - grouped by mother if multiple wives */}
        {childrenByMother.size > 0 && (
          <div className="relative">
            {/* Connector line from parent to children */}
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
              {Array.from(childrenByMother.values()).flat().length > 1 && (
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
              
              {Array.from(childrenByMother.entries()).map(([motherId, children]) => (
                children.map(child => {
                  const isOtherType = child.lineage_type === 'maternal';
                  // Only recursively render primary lineage children or "Khác" type
                  if (child.is_primary_lineage !== false || isOtherType) {
                    return (
                      <div key={child.id} className="relative flex flex-col items-center">
                        <div className={cn(
                          "-mt-3 h-6",
                          isOtherType 
                            ? "w-[1px] bg-foreground/50" 
                            : childrenContinueBloodline 
                              ? "w-[3px] bg-lineage-primary" 
                              : "w-0.5 border-l-2 border-dashed border-lineage-faded"
                        )} />
                        {renderFamilyTree(child, processedIds)}
                      </div>
                    );
                  }
                  return null;
                })
              ))}
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
          <span className="hidden sm:inline">Giữ chuột để kéo | Ctrl/⌘ + Scroll để zoom</span>
          <span className="sm:hidden">Chạm để kéo | Chụm để zoom</span>
        </div>
      </div>
      
      {/* Tree container */}
      <div 
        ref={containerRef}
        className={cn(
          "overflow-hidden border rounded-lg bg-muted/30 select-none touch-none",
          isFullscreen ? "flex-1" : "min-h-[400px] max-h-[70vh]",
          isDragging || isTouching ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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

        {/* Mini-map */}
        {(zoom > 1 || position.x !== 0 || position.y !== 0) && contentSize.width > 0 && (
          <div 
            className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 cursor-pointer"
            onClick={handleMinimapClick}
          >
            <div className="text-[10px] text-muted-foreground mb-1 text-center">Mini-map</div>
            <div 
              className="relative bg-muted/50 rounded border overflow-hidden"
              style={{ 
                width: 120, 
                height: Math.min(80, (contentSize.height / contentSize.width) * 120) || 60 
              }}
            >
              {/* Content representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-lineage-primary opacity-50" />
              </div>
              
              {/* Viewport indicator */}
              <div 
                className="absolute border-2 border-primary rounded bg-primary/10 pointer-events-none"
                style={{
                  width: Math.max(10, (containerSize.width / (contentSize.width * zoom)) * 120),
                  height: Math.max(8, (containerSize.height / (contentSize.height * zoom)) * (contentSize.height / contentSize.width * 120)),
                  left: Math.max(0, Math.min(120 - 10, (-position.x / (contentSize.width * zoom)) * 120)),
                  top: Math.max(0, Math.min(60, (-position.y / (contentSize.height * zoom)) * (contentSize.height / contentSize.width * 120)))
                }}
              />
            </div>
          </div>
        )}
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
