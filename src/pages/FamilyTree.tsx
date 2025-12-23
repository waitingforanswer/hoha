import { MainLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FamilyTreeView } from "@/components/family-tree/FamilyTreeView";

const FamilyTree = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["family-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("generation", { ascending: true })
        .order("birth_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <section className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
            Cây Gia Phả
          </h1>
          <p className="opacity-90">Khám phá các thế hệ trong dòng họ</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          <div className="mx-auto mb-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thành viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <Card className="mx-auto max-w-4xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
              </CardContent>
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card className="mx-auto max-w-4xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  {searchTerm ? "Không tìm thấy thành viên" : "Chưa có dữ liệu gia phả"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Thử tìm kiếm với từ khóa khác." 
                    : "Admin cần thêm thành viên vào cây gia phả để hiển thị ở đây."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <FamilyTreeView members={filteredMembers} />
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default FamilyTree;
