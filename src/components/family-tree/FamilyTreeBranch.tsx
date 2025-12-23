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
}

interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
}

interface FamilyTreeBranchProps {
  node: TreeNode;
  orientation: "horizontal" | "vertical";
  isRoot?: boolean;
}

export function FamilyTreeBranch({ node, orientation, isRoot = false }: FamilyTreeBranchProps) {
  const hasChildren = node.children.length > 0;
  
  if (orientation === "horizontal") {
    return (
      <div className="flex items-center gap-4">
        <div className="relative">
          <FamilyTreeNode member={node.member} orientation={orientation} />
          
          {/* Connector line to children */}
          {hasChildren && (
            <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-border" />
          )}
        </div>
        
        {hasChildren && (
          <div className="flex flex-col gap-4 relative">
            {/* Vertical line connecting children */}
            {node.children.length > 1 && (
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 bg-border"
                style={{ 
                  height: `calc(100% - 40px)`,
                }}
              />
            )}
            
            {node.children.map((child, index) => (
              <div key={child.member.id} className="relative flex items-center">
                {/* Horizontal connector from vertical line to child */}
                <div className="w-4 h-0.5 bg-border" />
                <FamilyTreeBranch node={child} orientation={orientation} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Vertical orientation (default)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <FamilyTreeNode member={node.member} orientation={orientation} />
        
        {/* Connector line to children */}
        {hasChildren && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0.5 h-4 bg-border" />
        )}
      </div>
      
      {hasChildren && (
        <div className="flex gap-4 relative pt-4">
          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-border"
              style={{ 
                width: `calc(100% - 60px)`,
              }}
            />
          )}
          
          {node.children.map((child) => (
            <div key={child.member.id} className="relative flex flex-col items-center">
              {/* Vertical connector from horizontal line to child */}
              <div className="w-0.5 h-4 bg-border -mt-4" />
              <FamilyTreeBranch node={child} orientation={orientation} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
