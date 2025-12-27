import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Info } from "lucide-react";

const PagesManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Trang</h1>
          <p className="text-muted-foreground">
            Quản lý nội dung các trang tĩnh trên website
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Tính năng này đang được phát triển. Vui lòng quay lại sau.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Danh sách trang
            </CardTitle>
            <CardDescription>
              Quản lý nội dung các trang như Giới thiệu, Họ Hà, v.v.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Sắp ra mắt</h3>
              <p className="max-w-md text-muted-foreground">
                Tính năng quản lý nội dung trang sẽ cho phép bạn chỉnh sửa nội dung
                các trang tĩnh trên website một cách dễ dàng.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PagesManagement;
