import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Home, Plus, Pencil, Trash2, GripVertical, Quote,
  TreeDeciduous, Users, BookOpen, Search, Heart, Star, 
  MapPin, Calendar, Phone, Mail, Globe, Settings, FileText,
  Image, MessageSquare, Bell, Shield, Award, Target, Zap
} from "lucide-react";

const AVAILABLE_ICONS = [
  { value: 'TreeDeciduous', label: 'Cây', Icon: TreeDeciduous },
  { value: 'Users', label: 'Người dùng', Icon: Users },
  { value: 'BookOpen', label: 'Sách', Icon: BookOpen },
  { value: 'Search', label: 'Tìm kiếm', Icon: Search },
  { value: 'Heart', label: 'Trái tim', Icon: Heart },
  { value: 'Star', label: 'Ngôi sao', Icon: Star },
  { value: 'MapPin', label: 'Địa điểm', Icon: MapPin },
  { value: 'Calendar', label: 'Lịch', Icon: Calendar },
  { value: 'Phone', label: 'Điện thoại', Icon: Phone },
  { value: 'Mail', label: 'Email', Icon: Mail },
  { value: 'Globe', label: 'Toàn cầu', Icon: Globe },
  { value: 'Settings', label: 'Cài đặt', Icon: Settings },
  { value: 'FileText', label: 'Tài liệu', Icon: FileText },
  { value: 'Image', label: 'Hình ảnh', Icon: Image },
  { value: 'MessageSquare', label: 'Tin nhắn', Icon: MessageSquare },
  { value: 'Bell', label: 'Chuông', Icon: Bell },
  { value: 'Shield', label: 'Bảo vệ', Icon: Shield },
  { value: 'Award', label: 'Giải thưởng', Icon: Award },
  { value: 'Target', label: 'Mục tiêu', Icon: Target },
  { value: 'Zap', label: 'Sấm sét', Icon: Zap },
];

const getIconComponent = (iconName: string) => {
  const iconConfig = AVAILABLE_ICONS.find(i => i.value === iconName);
  return iconConfig?.Icon || TreeDeciduous;
};

interface HomepageFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  display_order: number;
  is_visible: boolean;
}

interface HomepageQuote {
  id: string;
  quote: string;
  author: string;
  is_visible: boolean;
}

const PagesManagement = () => {
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [quotes, setQuotes] = useState<HomepageQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Feature dialog
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<HomepageFeature | null>(null);
  const [featureForm, setFeatureForm] = useState({
    icon: 'TreeDeciduous',
    title: '',
    description: '',
    href: '/',
    is_visible: true
  });
  
  // Quote dialog
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<HomepageQuote | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    quote: '',
    author: 'Tục ngữ Việt Nam',
    is_visible: true
  });

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'feature' | 'quote', id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [featuresRes, quotesRes] = await Promise.all([
        supabase.from('homepage_features').select('*').order('display_order'),
        supabase.from('homepage_quotes').select('*').order('created_at')
      ]);

      if (featuresRes.error) throw featuresRes.error;
      if (quotesRes.error) throw quotesRes.error;

      setFeatures(featuresRes.data || []);
      setQuotes(quotesRes.data || []);
    } catch (error: any) {
      toast.error('Không thể tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Feature handlers
  const openFeatureDialog = (feature?: HomepageFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatureForm({
        icon: feature.icon,
        title: feature.title,
        description: feature.description,
        href: feature.href,
        is_visible: feature.is_visible
      });
    } else {
      setEditingFeature(null);
      setFeatureForm({
        icon: 'TreeDeciduous',
        title: '',
        description: '',
        href: '/',
        is_visible: true
      });
    }
    setFeatureDialogOpen(true);
  };

  const saveFeature = async () => {
    if (!featureForm.title.trim() || !featureForm.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      if (editingFeature) {
        const { error } = await supabase
          .from('homepage_features')
          .update({
            icon: featureForm.icon,
            title: featureForm.title,
            description: featureForm.description,
            href: featureForm.href,
            is_visible: featureForm.is_visible
          })
          .eq('id', editingFeature.id);
        
        if (error) throw error;
        toast.success('Đã cập nhật section');
      } else {
        if (features.length >= 4) {
          toast.error('Chỉ được phép tối đa 4 sections');
          return;
        }
        
        const maxOrder = Math.max(...features.map(f => f.display_order), 0);
        const { error } = await supabase
          .from('homepage_features')
          .insert({
            icon: featureForm.icon,
            title: featureForm.title,
            description: featureForm.description,
            href: featureForm.href,
            is_visible: featureForm.is_visible,
            display_order: maxOrder + 1
          });
        
        if (error) throw error;
        toast.success('Đã thêm section mới');
      }
      
      setFeatureDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Quote handlers
  const openQuoteDialog = (quote?: HomepageQuote) => {
    if (quote) {
      setEditingQuote(quote);
      setQuoteForm({
        quote: quote.quote,
        author: quote.author,
        is_visible: quote.is_visible
      });
    } else {
      setEditingQuote(null);
      setQuoteForm({
        quote: '',
        author: 'Tục ngữ Việt Nam',
        is_visible: true
      });
    }
    setQuoteDialogOpen(true);
  };

  const saveQuote = async () => {
    if (!quoteForm.quote.trim()) {
      toast.error('Vui lòng nhập câu nói');
      return;
    }

    setSaving(true);
    try {
      if (editingQuote) {
        const { error } = await supabase
          .from('homepage_quotes')
          .update({
            quote: quoteForm.quote,
            author: quoteForm.author,
            is_visible: quoteForm.is_visible
          })
          .eq('id', editingQuote.id);
        
        if (error) throw error;
        toast.success('Đã cập nhật câu nói');
      } else {
        const { error } = await supabase
          .from('homepage_quotes')
          .insert({
            quote: quoteForm.quote,
            author: quoteForm.author,
            is_visible: quoteForm.is_visible
          });
        
        if (error) throw error;
        toast.success('Đã thêm câu nói mới');
      }
      
      setQuoteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const confirmDelete = (type: 'feature' | 'quote', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const table = deleteTarget.type === 'feature' ? 'homepage_features' : 'homepage_quotes';
      const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
      
      if (error) throw error;
      toast.success('Đã xóa thành công');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Trang chủ</h1>
          <p className="text-muted-foreground">
            Quản lý nội dung hiển thị trên trang chủ website
          </p>
        </div>

        <Tabs defaultValue="features" className="space-y-4">
          <TabsList>
            <TabsTrigger value="features" className="gap-2">
              <Home className="h-4 w-4" />
              Khám phá nguồn cội
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <Quote className="h-4 w-4" />
              Câu nói tục ngữ
            </TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Các section "Khám phá nguồn cội"</CardTitle>
                    <CardDescription>
                      Tối đa 4 sections. Mỗi section gồm icon, tiêu đề, mô tả và link.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => openFeatureDialog()} 
                    disabled={features.length >= 4}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : features.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chưa có section nào. Nhấn "Thêm section" để bắt đầu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Hiển thị</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => {
                        const IconComp = getIconComponent(feature.icon);
                        return (
                          <TableRow key={feature.id}>
                            <TableCell>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <IconComp className="h-5 w-5 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{feature.title}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {feature.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{feature.href}</TableCell>
                            <TableCell>
                              <Switch 
                                checked={feature.is_visible} 
                                onCheckedChange={async (checked) => {
                                  await supabase
                                    .from('homepage_features')
                                    .update({ is_visible: checked })
                                    .eq('id', feature.id);
                                  fetchData();
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openFeatureDialog(feature)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => confirmDelete('feature', feature.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Câu nói tục ngữ</CardTitle>
                    <CardDescription>
                      Các câu nói sẽ được hiển thị ngẫu nhiên trên trang chủ, thay đổi mỗi 5 giây.
                    </CardDescription>
                  </div>
                  <Button onClick={() => openQuoteDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm câu nói
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : quotes.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chưa có câu nói nào. Nhấn "Thêm câu nói" để bắt đầu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Câu nói</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Hiển thị</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="max-w-[400px]">
                            <p className="line-clamp-2 italic">"{quote.quote}"</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            — {quote.author} —
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={quote.is_visible} 
                              onCheckedChange={async (checked) => {
                                await supabase
                                  .from('homepage_quotes')
                                  .update({ is_visible: checked })
                                  .eq('id', quote.id);
                                fetchData();
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openQuoteDialog(quote)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => confirmDelete('quote', quote.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Dialog */}
        <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFeature ? 'Chỉnh sửa section' : 'Thêm section mới'}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin cho section hiển thị trên trang chủ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select 
                  value={featureForm.icon} 
                  onValueChange={(value) => setFeatureForm({ ...featureForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input 
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                  placeholder="VD: Cây Gia Phả"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea 
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  placeholder="VD: Xem cây gia phả nhiều đời với các mối quan hệ rõ ràng"
                />
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input 
                  value={featureForm.href}
                  onChange={(e) => setFeatureForm({ ...featureForm, href: e.target.value })}
                  placeholder="VD: /cay-gia-pha"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="feature-visible"
                  checked={featureForm.is_visible}
                  onCheckedChange={(checked) => setFeatureForm({ ...featureForm, is_visible: checked })}
                />
                <Label htmlFor="feature-visible">Hiển thị trên trang chủ</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={saveFeature} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quote Dialog */}
        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? 'Chỉnh sửa câu nói' : 'Thêm câu nói mới'}
              </DialogTitle>
              <DialogDescription>
                Câu nói sẽ được hiển thị ngẫu nhiên trên trang chủ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Câu nói</Label>
                <Textarea 
                  value={quoteForm.quote}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
                  placeholder="VD: Cây có cội, nước có nguồn..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Tác giả / Nguồn</Label>
                <Input 
                  value={quoteForm.author}
                  onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                  placeholder="VD: Tục ngữ Việt Nam"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="quote-visible"
                  checked={quoteForm.is_visible}
                  onCheckedChange={(checked) => setQuoteForm({ ...quoteForm, is_visible: checked })}
                />
                <Label htmlFor="quote-visible">Hiển thị trên trang chủ</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={saveQuote} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa {deleteTarget?.type === 'feature' ? 'section' : 'câu nói'} này? 
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={executeDelete} disabled={saving}>
                {saving ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PagesManagement;
