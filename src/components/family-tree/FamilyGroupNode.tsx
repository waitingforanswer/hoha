import { useState } from "react";
import { ChevronDown, ChevronRight, Users, Heart } from "lucide-react";
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
  const hasFamily = spouse || children.length > 0;
  
  const familyTitle = `Gia đình ${primaryMember.gender === 'male' ? 'anh' : 'chị'} ${primaryMember.full_name.split(' ').slice(-2).join(' ')}`;

  if (orientation === "horizontal") {
    return (
      <div className="flex items-start gap-2">
        {/* Family group header */}
        <div className="flex flex-col items-center gap-2">
          {/* Couple display */}
          <div className="flex items-center gap-2">
            <FamilyTreeNode member={primaryMember} orientation={orientation} />
            
            {spouse && (
              <>
                {/* Marriage connector */}
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-primary/50" />
                  <Heart className="h-4 w-4 text-primary/50 fill-primary/20" />
                  <div className="w-4 h-0.5 bg-primary/50" />
                </div>
                <FamilyTreeNode member={spouse} orientation={orientation} isSpouse />
              </>
            )}
          </div>
          
          {/* Expand/Collapse button */}
          {hasFamily && children.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                "bg-muted hover:bg-muted/80 transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Users className="h-3 w-3" />
              <span>{children.length} con</span>
            </button>
          )}
        </div>
        
        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div className="flex items-start">
            {/* Connector to children */}
            <div className="flex items-center self-stretch">
              <div className="w-4 h-0.5 bg-border" />
            </div>
            <div className="flex flex-col gap-4">
              {/* Vertical line connecting children */}
              <div className="relative">
                {children.length > 1 && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-border"
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
    <div className="flex flex-col items-center gap-4">
      {/* Couple display */}
      <div className="flex items-center gap-2">
        <FamilyTreeNode member={primaryMember} orientation={orientation} />
        
        {spouse && (
          <>
            {/* Marriage connector */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary/50" />
              <Heart className="h-4 w-4 text-primary/50 fill-primary/20" />
              <div className="w-3 h-0.5 bg-primary/50" />
            </div>
            <FamilyTreeNode member={spouse} orientation={orientation} isSpouse />
          </>
        )}
      </div>
      
      {/* Expand/Collapse button */}
      {hasFamily && children.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs",
            "bg-muted hover:bg-muted/80 transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Users className="h-3 w-3" />
          <span>{familyTitle} ({children.length} con)</span>
        </button>
      )}
      
      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div className="relative">
          {/* Connector line from parent to children */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border -translate-y-full" />
          
          <div className="flex gap-4 pt-4 relative">
            {/* Horizontal line connecting children */}
            {children.length > 1 && (
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-border"
                style={{ width: `calc(100% - 60px)` }}
              />
            )}
            
            {onRenderChildren(children)}
          </div>
        </div>
      )}
    </div>
  );
}
