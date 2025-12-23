import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="font-serif text-lg font-bold">H</span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">Dòng Họ Hà</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Website gia phả dòng họ - Nơi lưu giữ và kết nối các thế hệ trong
              gia đình, giúp con cháu nhớ về nguồn cội.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Liên kết</h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/gioi-thieu"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Giới thiệu
              </Link>
              <Link
                to="/cay-gia-pha"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Cây Gia Phả
              </Link>
              <Link
                to="/bai-viet"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Bài viết
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Liên hệ</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+84 xxx xxx xxx</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@donghoha.vn</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Thông điệp</h4>
            <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-muted-foreground">
              "Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự
              nhiên mà có."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dòng Họ Hà. Bảo lưu mọi quyền.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Xây dựng với{" "}
            <Heart className="h-4 w-4 fill-primary text-primary" /> cho gia đình
          </p>
        </div>
      </div>
    </footer>
  );
}
