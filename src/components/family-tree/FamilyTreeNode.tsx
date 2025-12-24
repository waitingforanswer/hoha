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

// lineage_type: 'primary' = họ Hà, 'spouse' = dâu/rể, 'maternal' = con ngoại tộc (mẹ họ Hà, theo họ bố)
type LineageType = 'primary' | 'spouse' | 'maternal';

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
  lineage_type?: LineageType;
}

interface FamilyTreeNodeProps {
  member: FamilyMember;
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

export function FamilyTreeNode({ member, isSpouse = false }: FamilyTreeNodeProps) {
  const age = calculateAge(member.birth_date, member.death_date, member.is_alive);
  const isDeceased = member.is_alive === false;
  const isMale = member.gender === "male";
  const isFemale = member.gender === "female";
  
  // Determine lineage type
  const lineageType: LineageType = member.lineage_type || 
    (member.is_primary_lineage === false ? 'spouse' : 'primary');
  
  const isPrimaryLineage = lineageType === 'primary';
  const isMaternalLineage = lineageType === 'maternal';
  
  // Determine role label for non-primary lineage
  const getRoleLabel = () => {
    if (isPrimaryLineage) return null;
    if (isMaternalLineage) return "Ngoại tộc";
    return isMale ? "Rể" : "Dâu";
  };
  
  const roleLabel = getRoleLabel();
  
  // Get border color based on lineage type
  const getBorderClass = () => {
    if (isMaternalLineage) return "border-2 border-lineage-maternal";
    if (isPrimaryLineage) return "border-2 border-lineage-primary shadow-sm";
    return "border-2 border-lineage-secondary-light border-dashed";
  };
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg bg-card transition-all hover:shadow-md relative",
        // Fixed width and height for consistent card size
        "w-[140px] h-[180px]",
        // Border styling based on lineage
        getBorderClass(),
        isDeceased && "opacity-70"
      )}
    >
      {/* Gender icon - top right */}
      <div className={cn(
        "absolute -top-2 -right-2 rounded-full p-1 shadow-sm",
        isMale ? "bg-blue-500 text-white" : isFemale ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground"
      )}>
        {isMale ? (
          <MaleIcon className="h-3 w-3" />
        ) : isFemale ? (
          <FemaleIcon className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )}
      </div>

      {/* Role label for Dâu/Rể/Ngoại tộc - top left */}
      {roleLabel && (
        <div className={cn(
          "absolute -top-2 -left-2 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm",
          isMaternalLineage ? "bg-lineage-maternal" : "bg-lineage-secondary"
        )}>
          {roleLabel}
        </div>
      )}
      
      <Link to={`/member/${member.id}`} className="group flex-shrink-0">
        <Avatar className={cn(
          "h-14 w-14 border-2 transition-transform group-hover:scale-105",
          isDeceased ? "border-muted grayscale" : isPrimaryLineage ? "border-lineage-primary-light" : isMaternalLineage ? "border-lineage-maternal" : "border-lineage-secondary-light"
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
                : isMaternalLineage
                  ? "bg-lineage-maternal/10 text-lineage-maternal"
                  : "bg-lineage-secondary/10 text-lineage-secondary"
          )}>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="text-center space-y-1 flex-1 flex flex-col justify-start overflow-hidden">
        <Link 
          to={`/member/${member.id}`}
          className={cn(
            "text-sm hover:underline block text-center leading-tight",
            // Allow 2 lines with ellipsis
            "line-clamp-2 min-h-[2.5rem]",
            isPrimaryLineage ? "font-semibold text-lineage-primary" : isMaternalLineage ? "font-medium text-lineage-maternal" : "font-medium text-foreground",
            isDeceased && "opacity-70"
          )}
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
            "text-xs flex items-center justify-center gap-1 line-clamp-1",
            isDeceased ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{member.address}</span>
          </p>
        )}
      </div>
    </div>
  );
}
