import { MainLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { useState } from "react";

const FamilyTree = () => {
  const [searchTerm, setSearchTerm] = useState("");

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

      <section className="py-12">
        <div className="container">
          <div className="mx-auto mb-8 max-w-md">
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

          <Card className="mx-auto max-w-4xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">
                Chưa có dữ liệu gia phả
              </h3>
              <p className="text-muted-foreground">
                Admin cần thêm thành viên vào cây gia phả để hiển thị ở đây.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
};

export default FamilyTree;
