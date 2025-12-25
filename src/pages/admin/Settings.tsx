import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, MoreHorizontal, UserCheck, UserX, Key, Users } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface AppUser {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

const AdminSettings = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({
          title: "Lỗi",
          description: "Phiên đăng nhập không hợp lệ",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("admin-users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        setUsers(response.data.users || []);
      } else {
        throw new Error(response.data?.error || "Failed to fetch users");
      }
    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (user: AppUser, newStatus: "ACTIVE" | "INACTIVE") => {
    setActionLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No session");
      }

      const response = await supabase.functions.invoke("admin-users/update-status", {
        body: { user_id: user.id, status: newStatus },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Thành công",
          description: newStatus === "ACTIVE" 
            ? `Đã kích hoạt tài khoản ${user.username}` 
            : `Đã vô hiệu hóa tài khoản ${user.username}`,
        });
        fetchUsers();
      } else {
        throw new Error(response.data?.error || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Update status error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 8) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 8 ký tự",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No session");
      }

      const response = await supabase.functions.invoke("admin-users/change-password", {
        body: { user_id: selectedUser.id, new_password: newPassword },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Thành công",
          description: `Đã đổi mật khẩu cho ${selectedUser.username}`,
        });
        setPasswordDialogOpen(false);
        setNewPassword("");
        setSelectedUser(null);
      } else {
        throw new Error(response.data?.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đổi mật khẩu",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Hoạt động</Badge>;
      case "INACTIVE":
        return <Badge variant="destructive">Vô hiệu hóa</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý hệ thống và người dùng</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Quản lý người dùng</CardTitle>
                <CardDescription>
                  Quản lý tài khoản người dùng ứng dụng
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, username, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? "Không tìm thấy người dùng" : "Chưa có người dùng nào"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đăng nhập</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: vi })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={actionLoading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.status !== "ACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user, "ACTIVE")}
                                  className="text-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Kích hoạt
                                </DropdownMenuItem>
                              )}
                              {user.status !== "INACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user, "INACTIVE")}
                                  className="text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Vô hiệu hóa
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Đổi mật khẩu
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Đổi mật khẩu cho người dùng <strong>{selectedUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setNewPassword("");
                setSelectedUser(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleChangePassword} disabled={actionLoading || !newPassword}>
              {actionLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSettings;
