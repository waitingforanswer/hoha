import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
}

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onSuccess: () => void;
}

export default function PostForm({
  open,
  onOpenChange,
  post,
  onSuccess,
}: PostFormProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setFeaturedImage(post.featured_image);
      setIsPublished(post.is_published || false);
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setFeaturedImage(null);
      setIsPublished(false);
    }
  }, [post, open]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!post) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      setFeaturedImage(data.publicUrl);
      toast({ title: "Đã tải ảnh lên!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải ảnh lên",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = async () => {
    if (featuredImage) {
      try {
        // Extract file path from URL
        const url = new URL(featuredImage);
        const pathMatch = url.pathname.match(/\/post-images\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("post-images").remove([pathMatch[1]]);
        }
      } catch (error) {
        console.error("Error removing old image:", error);
      }
    }
    setFeaturedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề bài viết",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        featured_image: featuredImage,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      };

      if (post) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;
        toast({ title: "Đã cập nhật bài viết!" });
      } else {
        // Create new post
        const { error } = await supabase.from("posts").insert([postData]);

        if (error) throw error;
        toast({ title: "Đã tạo bài viết mới!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu bài viết",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {post ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            {featuredImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click để tải ảnh lên
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tối đa 5MB
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="text-lg"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Đường dẫn (slug)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="duong-dan-bai-viet"
              className="font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Tóm tắt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Mô tả ngắn về bài viết..."
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung bài viết..."
              rows={10}
              className="min-h-[200px]"
            />
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="published">Xuất bản</Label>
              <p className="text-sm text-muted-foreground">
                Bài viết sẽ hiển thị công khai trên trang Bài Viết
              </p>
            </div>
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {post ? "Cập nhật" : "Tạo bài viết"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
