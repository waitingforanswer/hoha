import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import MemberForm from "@/components/admin/MemberForm";
import MemberQRCode from "@/components/admin/MemberQRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, QrCode, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FamilyMember = Tables<"family_members">;

const AdminMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const { toast } = useToast();

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .order("generation", { ascending: true })
      .order("full_name", { ascending: true });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thành viên",
        variant: "destructive",
      });
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setFormOpen(true);
  };

  const handleQR = (member: FamilyMember) => {
    setSelectedMember(member);
    setQrOpen(true);
  };

  const handleDeleteClick = (member: FamilyMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberToDelete.id);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thành viên",
        variant: "destructive",
      });
    } else {
      toast({ title: "Đã xóa thành viên!" });
      fetchMembers();
    }

    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Quản lý thành viên</h1>
            <p className="mt-1 text-muted-foreground">
              {members.length} thành viên trong gia phả
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thành viên
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-elegant">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <User className="mb-2 h-12 w-12" />
              <p>Chưa có thành viên nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Đời</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Năm sinh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {member.full_name}
                    </TableCell>
                    <TableCell>Đời {member.generation}</TableCell>
                    <TableCell>
                      {member.gender === "male"
                        ? "Nam"
                        : member.gender === "female"
                        ? "Nữ"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {member.birth_date
                        ? new Date(member.birth_date).getFullYear()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          member.is_alive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.is_alive ? "Còn sống" : "Đã mất"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQR(member)}
                          title="Tạo mã QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive hover:text-destructive"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        member={selectedMember}
        allMembers={members}
        onSuccess={fetchMembers}
      />

      {/* QR Code Dialog */}
      <MemberQRCode
        open={qrOpen}
        onOpenChange={setQrOpen}
        member={selectedMember}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thành viên "{memberToDelete?.full_name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMembers;
