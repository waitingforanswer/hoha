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
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border bg-card transition-all hover:shadow-md relative",
        isDeceased ? "opacity-60 border-muted" : "border-border",
        isSpouse && "border-dashed border-primary/50",
        orientation === "horizontal" ? "min-w-[140px]" : "min-w-[120px]"
      )}
    >
      {/* Gender icon */}
      <div className={cn(
        "absolute -top-2 -right-2 rounded-full p-1",
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

      {/* Primary lineage badge */}
      {member.is_primary_lineage === false && (
        <div className="absolute -top-2 -left-2 bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
          Dâu/Rể
        </div>
      )}
      
      <Link to={`/member/${member.id}`} className="group">
        <Avatar className={cn(
          "h-16 w-16 border-2 transition-transform group-hover:scale-105",
          isDeceased ? "border-muted grayscale" : "border-primary/20"
        )}>
          <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
          <AvatarFallback className={cn(
            isDeceased ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="text-center space-y-1">
        <Link 
          to={`/member/${member.id}`}
          className={cn(
            "font-medium text-sm hover:underline block truncate max-w-[120px]",
            isDeceased ? "text-muted-foreground" : "text-foreground"
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
            "text-xs flex items-center justify-center gap-1 truncate max-w-[120px]",
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
