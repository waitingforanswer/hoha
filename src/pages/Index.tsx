import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TreeDeciduous, 
  Users, 
  BookOpen, 
  Search,
  ArrowRight,
  Heart
} from "lucide-react";

const features = [
  {
    icon: TreeDeciduous,
    title: "Cây Gia Phả",
    description: "Xem cây gia phả nhiều đời với các mối quan hệ rõ ràng",
    href: "/cay-gia-pha",
  },
  {
    icon: Users,
    title: "Thành Viên",
    description: "Tìm hiểu thông tin về các thành viên trong dòng họ",
    href: "/cay-gia-pha",
  },
  {
    icon: BookOpen,
    title: "Bài Viết",
    description: "Đọc các bài viết về lịch sử và truyền thống dòng họ",
    href: "/bai-viet",
  },
  {
    icon: Search,
    title: "Tìm Kiếm",
    description: "Tìm kiếm thành viên theo tên hoặc quan hệ trong gia phả",
    href: "/cay-gia-pha",
  },
];

const Index = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground md:py-32">
        <div className="pattern-traditional absolute inset-0 opacity-10" />
        
        {/* Decorative Elements */}
        <div className="absolute left-0 top-0 h-32 w-32 opacity-20 md:h-48 md:w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-current">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm backdrop-blur">
              <Heart className="h-4 w-4" />
              <span>Gìn giữ truyền thống - Kết nối thế hệ</span>
            </div>
            
            <h1 className="animate-fade-in mb-6 font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Gia Phả <span className="text-gold">Dòng Họ Hà</span>
            </h1>
            
            <p className="animate-fade-in animation-delay-150 mb-8 text-lg opacity-90 md:text-xl">
              Nơi lưu giữ và kết nối các thế hệ trong gia đình, 
              giúp con cháu nhớ về nguồn cội và truyền thống tốt đẹp của dòng họ.
            </p>
            
            <div className="animate-fade-in animation-delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/cay-gia-pha">
                <Button size="lg" className="gap-2 bg-gold text-accent-foreground hover:bg-gold/90">
                  Xem Cây Gia Phả
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/gioi-thieu">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  Tìm Hiểu Thêm
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full fill-background">
            <path d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
              Khám Phá <span className="text-primary">Nguồn Cội</span>
            </h2>
            <p className="text-muted-foreground">
              Tìm hiểu về lịch sử, truyền thống và các thành viên trong dòng họ
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Link key={feature.title} to={feature.href}>
                <Card className="group h-full transition-all duration-300 hover:shadow-elegant hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-2 font-serif text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-block rounded-full bg-primary/10 p-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <blockquote className="mb-6 font-serif text-2xl font-medium italic text-foreground md:text-3xl">
              "Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự nhiên mà có."
            </blockquote>
            <p className="text-muted-foreground">— Tục ngữ Việt Nam —</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="rounded-2xl bg-gradient-hero p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 font-serif text-2xl font-bold md:text-3xl">
              Tìm Kiếm Thành Viên Trong Gia Phả
            </h2>
            <p className="mx-auto mb-8 max-w-2xl opacity-90">
              Nhập tên để tìm vị trí của một người trong cây gia phả và xem thông tin chi tiết
            </p>
            <Link to="/cay-gia-pha">
              <Button size="lg" className="gap-2 bg-gold text-accent-foreground hover:bg-gold/90">
                <Search className="h-4 w-4" />
                Bắt Đầu Tìm Kiếm
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
