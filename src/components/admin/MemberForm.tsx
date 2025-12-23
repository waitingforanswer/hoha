import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FamilyMember = Tables<"family_members">;

const memberSchema = z.object({
  full_name: z.string().min(1, "Tên không được để trống").max(100),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  occupation: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  generation: z.number().min(1).max(20),
  is_alive: z.boolean(),
  father_id: z.string().optional(),
  mother_id: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember | null;
  allMembers: FamilyMember[];
  onSuccess: () => void;
}

const MemberForm = ({
  open,
  onOpenChange,
  member,
  allMembers,
  onSuccess,
}: MemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      gender: "",
      birth_date: "",
      death_date: "",
      phone: "",
      email: "",
      occupation: "",
      address: "",
      bio: "",
      generation: 1,
      is_alive: true,
      father_id: "",
      mother_id: "",
    },
  });

  const isAlive = watch("is_alive");

  useEffect(() => {
    if (member) {
      reset({
        full_name: member.full_name,
        gender: member.gender || "",
        birth_date: member.birth_date || "",
        death_date: member.death_date || "",
        phone: member.phone || "",
        email: member.email || "",
        occupation: member.occupation || "",
        address: member.address || "",
        bio: member.bio || "",
        generation: member.generation,
        is_alive: member.is_alive ?? true,
        father_id: member.father_id || "",
        mother_id: member.mother_id || "",
      });
      setAvatarPreview(member.avatar_url);
    } else {
      reset({
        full_name: "",
        gender: "",
        birth_date: "",
        death_date: "",
        phone: "",
        email: "",
        occupation: "",
        address: "",
        bio: "",
        generation: 1,
        is_alive: true,
        father_id: "",
        mother_id: "",
      });
      setAvatarPreview(null);
    }
    setAvatarFile(null);
  }, [member, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh tối đa là 5MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (memberId: string): Promise<string | null> => {
    if (!avatarFile) return member?.avatar_url || null;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${memberId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);

    try {
      const memberData = {
        full_name: data.full_name,
        gender: data.gender || null,
        birth_date: data.birth_date || null,
        death_date: data.death_date || null,
        phone: data.phone || null,
        email: data.email || null,
        occupation: data.occupation || null,
        address: data.address || null,
        bio: data.bio || null,
        generation: data.generation,
        is_alive: data.is_alive,
        father_id: data.father_id || null,
        mother_id: data.mother_id || null,
      };

      if (member) {
        // Update existing member
        const avatarUrl = await uploadAvatar(member.id);
        
        const { error } = await supabase
          .from("family_members")
          .update({ ...memberData, avatar_url: avatarUrl })
          .eq("id", member.id);

        if (error) throw error;

        toast({ title: "Đã cập nhật thành viên!" });
      } else {
        // Create new member
        const { data: newMember, error } = await supabase
          .from("family_members")
          .insert(memberData)
          .select()
          .single();

        if (error) throw error;

        // Upload avatar if exists
        if (avatarFile && newMember) {
          const avatarUrl = await uploadAvatar(newMember.id);
          if (avatarUrl) {
            await supabase
              .from("family_members")
              .update({ avatar_url: avatarUrl })
              .eq("id", newMember.id);
          }
        }

        toast({ title: "Đã thêm thành viên mới!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const maleMembers = allMembers.filter(
    (m) => m.gender === "male" && m.id !== member?.id
  );
  const femaleMembers = allMembers.filter(
    (m) => m.gender === "female" && m.id !== member?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {member ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30">
              {avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute right-0 top-0 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-muted-foreground hover:text-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="mt-1 text-xs">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Tải lên ảnh đại diện</p>
              <p>Định dạng: JPG, PNG. Tối đa: 5MB</p>
            </div>
          </div>

          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                placeholder="Nguyễn Văn A"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Ngày sinh</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
            </div>

            <div className="space-y-2">
              <Label>Còn sống</Label>
              <Select
                value={isAlive ? "true" : "false"}
                onValueChange={(value) => setValue("is_alive", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Còn sống</SelectItem>
                  <SelectItem value="false">Đã mất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isAlive && (
              <div className="space-y-2">
                <Label htmlFor="death_date">Ngày mất</Label>
                <Input id="death_date" type="date" {...register("death_date")} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="generation">Đời thứ *</Label>
              <Input
                id="generation"
                type="number"
                min={1}
                max={20}
                {...register("generation", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Parent info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bố</Label>
              <Select
                value={watch("father_id") || ""}
                onValueChange={(value) => setValue("father_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bố" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Không có --</SelectItem>
                  {maleMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} (Đời {m.generation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mẹ</Label>
              <Select
                value={watch("mother_id") || ""}
                onValueChange={(value) => setValue("mother_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mẹ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Không có --</SelectItem>
                  {femaleMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} (Đời {m.generation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="0123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Nghề nghiệp</Label>
              <Input
                id="occupation"
                {...register("occupation")}
                placeholder="Kỹ sư, Bác sĩ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Hà Nội, Việt Nam"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Tiểu sử</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Mô tả ngắn về thành viên..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : member ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberForm;
