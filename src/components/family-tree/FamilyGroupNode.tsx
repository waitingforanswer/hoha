import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FamilyTreeNode } from "./FamilyTreeNode";
import { cn } from "@/lib/utils";

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
}

interface FamilyGroupNodeProps {
  primaryMember: FamilyMember;
  spouse: FamilyMember | null;
  children: FamilyMember[];
  orientation: "horizontal" | "vertical";
  onRenderChildren: (children: FamilyMember[]) => React.ReactNode;
}

export function FamilyGroupNode({ 
  primaryMember, 
  spouse, 
  children,
  orientation,
  onRenderChildren
}: FamilyGroupNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;
  
  // Check if primary member is the bloodline (họ Hà)
  const isPrimaryBloodline = primaryMember.is_primary_lineage !== false;
  
  // Get direct children count (not including spouses of children)
  const directChildrenCount = children.filter(c => 
    c.father_id === primaryMember.id || c.mother_id === primaryMember.id
  ).length;

  // Determine if children continue the bloodline
  // Children continue bloodline if the primary member is from the Hà family and is male
  const childrenContinueBloodline = isPrimaryBloodline && primaryMember.gender === 'male';

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (orientation === "horizontal") {
    return (
      <div className="flex items-start gap-2">
        {/* Family group */}
        <div className="flex flex-col items-center gap-2">
          {/* Couple display - Primary member with spouse beside */}
          <div className="flex items-center gap-2">
            <FamilyTreeNode member={primaryMember} orientation={orientation} />
            
            {spouse && (
              <>
                {/* Marriage connector - dashed gray line */}
                <div className="flex items-center">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-lineage-marriage" />
                </div>
                <FamilyTreeNode member={spouse} orientation={orientation} isSpouse />
              </>
            )}
          </div>
          
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={handleToggle}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                "border-2",
                isExpanded 
                  ? "bg-lineage-primary text-white border-lineage-primary" 
                  : "bg-card text-lineage-primary border-lineage-primary hover:bg-lineage-primary/10"
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>{directChildrenCount} con</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Children - Bloodline connects directly from primary member to children */}
        {isExpanded && hasChildren && (
          <div className="flex items-start">
            {/* Connector from PRIMARY MEMBER only (not from spouse) */}
            <div className="flex items-center self-stretch">
              <div className={cn(
                "w-6",
                childrenContinueBloodline 
                  ? "h-[3px] bg-lineage-primary" 
                  : "h-0.5 border-t-2 border-dashed border-lineage-faded"
              )} />
            </div>
            <div className="flex flex-col gap-4">
              {/* Vertical line connecting children */}
              <div className="relative">
                {children.length > 1 && (
                  <div 
                    className={cn(
                      "absolute left-0 top-0 bottom-0",
                      childrenContinueBloodline 
                        ? "w-[3px] bg-lineage-primary" 
                        : "w-0.5 border-l-2 border-dashed border-lineage-faded"
                    )}
                  />
                )}
                <div className="flex flex-col gap-4">
                  {onRenderChildren(children)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Vertical orientation (default)
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Couple display - Primary member centered, spouse beside */}
      <div className="flex items-center gap-2">
        <FamilyTreeNode member={primaryMember} orientation={orientation} />
        
        {spouse && (
          <>
            {/* Marriage connector - dashed gray line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-lineage-marriage" />
            </div>
            <FamilyTreeNode member={spouse} orientation={orientation} isSpouse />
          </>
        )}
      </div>
      
      {/* Expand/Collapse button */}
      {hasChildren && (
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "border-2 shadow-sm",
            isExpanded 
              ? "bg-lineage-primary text-white border-lineage-primary" 
              : "bg-card text-lineage-primary border-lineage-primary hover:bg-lineage-primary/10"
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Thu gọn</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>{directChildrenCount} con</span>
            </>
          )}
        </button>
      )}
      
      {/* Children - Bloodline connects from primary member position down to children */}
      {isExpanded && hasChildren && (
        <div className="relative flex flex-col items-center">
          {/* Connector line from PRIMARY MEMBER down to children (not from center of couple) */}
          <div 
            className={cn(
              "absolute -top-3 -translate-y-0",
              // Position connector at primary member (left side if spouse exists)
              spouse ? "-translate-x-[calc(50%+3rem)]" : "",
              childrenContinueBloodline 
                ? "w-[3px] h-6 bg-lineage-primary" 
                : "w-0.5 h-6 border-l-2 border-dashed border-lineage-faded"
            )}
            style={spouse ? { left: 'calc(50% - 50px)' } : { left: '50%', transform: 'translateX(-50%)' }}
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
            
            {onRenderChildren(children)}
          </div>
        </div>
      )}
    </div>
  );
}
