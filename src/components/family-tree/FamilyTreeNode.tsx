import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
  is_primary_lineage?: boolean | null;
}

interface FamilyTreeNodeProps {
  member: FamilyMember;
  orientation: "horizontal" | "vertical";
  isSpouse?: boolean;
}

const calculateAge = (birthDate: string | null, deathDate: string | null, isAlive: boolean | null): number | null => {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const endDate = isAlive === false && deathDate ? new Date(deathDate) : new Date();
  
  let age = endDate.getFullYear() - birth.getFullYear();
  const monthDiff = endDate.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export function FamilyTreeNode({ member, orientation, isSpouse = false }: FamilyTreeNodeProps) {
  const age = calculateAge(member.birth_date, member.death_date, member.is_alive);
  const isDeceased = member.is_alive === false;
  const isMale = member.gender === "male";
  const isFemale = member.gender === "female";
  const isPrimaryLineage = member.is_primary_lineage !== false;
  
  // Determine role label for non-primary lineage
  const getRoleLabel = () => {
    if (isPrimaryLineage) return null;
    return isMale ? "Rể" : "Dâu";
  };
  
  const roleLabel = getRoleLabel();
  
  // Spouse nodes are smaller
  const nodeSize = isSpouse || !isPrimaryLineage ? "small" : "normal";
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg bg-card transition-all hover:shadow-md relative",
        // Size based on primary/spouse
        nodeSize === "small" ? "p-2 min-w-[100px]" : "p-3 min-w-[140px]",
        // Border styling based on lineage
        isPrimaryLineage 
          ? "border-2 border-lineage-primary shadow-sm" 
          : "border-2 border-lineage-secondary-light border-dashed",
        isDeceased && "opacity-70"
      )}
    >
      {/* Gender icon - top right */}
      <div className={cn(
        "absolute -top-2 -right-2 rounded-full shadow-sm flex items-center justify-center",
        nodeSize === "small" ? "w-5 h-5" : "w-6 h-6",
        isMale ? "bg-blue-500 text-white" : isFemale ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground"
      )}>
        {isMale ? (
          <MaleIcon className={nodeSize === "small" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        ) : isFemale ? (
          <FemaleIcon className={nodeSize === "small" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        ) : (
          <User className={nodeSize === "small" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        )}
      </div>

      {/* Role label for Dâu/Rể - top left */}
      {roleLabel && (
        <div className="absolute -top-2 -left-2 bg-lineage-secondary text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
          {roleLabel}
        </div>
      )}
      
      <Link to={`/member/${member.id}`} className="group">
        <Avatar className={cn(
          "border-2 transition-transform group-hover:scale-105",
          nodeSize === "small" ? "h-12 w-12" : "h-16 w-16",
          isDeceased ? "border-muted grayscale" : isPrimaryLineage ? "border-lineage-primary-light" : "border-lineage-secondary-light"
        )}>
          <AvatarImage 
            src={member.avatar_url || undefined} 
            alt={member.full_name}
            className="object-cover object-center"
          />
          <AvatarFallback className={cn(
            isDeceased 
              ? "bg-muted text-muted-foreground" 
              : isPrimaryLineage 
                ? "bg-lineage-primary/10 text-lineage-primary" 
                : "bg-lineage-secondary/10 text-lineage-secondary"
          )}>
            <User className={nodeSize === "small" ? "h-5 w-5" : "h-6 w-6"} />
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="text-center space-y-1">
        <Link 
          to={`/member/${member.id}`}
          className={cn(
            "text-sm hover:underline block text-center leading-tight",
            nodeSize === "small" ? "max-w-[90px]" : "max-w-[130px]",
            isPrimaryLineage ? "font-semibold text-lineage-primary" : "font-medium text-foreground",
            isDeceased && "opacity-70"
          )}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          {member.full_name}
        </Link>
        
        {age !== null && (
          <p className={cn(
            "text-xs",
            isDeceased ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {isDeceased ? `Mất năm ${age} tuổi` : `${age} tuổi`}
          </p>
        )}
        
        {member.address && (
          <p className={cn(
            "text-xs flex items-center justify-center gap-1",
            nodeSize === "small" ? "max-w-[90px]" : "max-w-[130px]",
            isDeceased ? "text-muted-foreground/70" : "text-muted-foreground"
          )}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
          >
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-2">{member.address}</span>
          </p>
        )}
      </div>
    </div>
  );
}
