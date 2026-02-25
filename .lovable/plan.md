

# Plan: Tạo file seed.sql cho dự án

## Mục tiêu
Tạo file `supabase/seed.sql` chứa toàn bộ dữ liệu mẫu cần thiết để khởi tạo một dự án Supabase mới từ đầu. File này sẽ chèn dữ liệu vào các bảng đã được tạo bởi migrations.

## Phân tích

Dự án có 30 file migration tạo schema. Một số migration đã bao gồm `INSERT` cho dữ liệu mặc định (categories, menu_items, footer_settings, roles, permissions, homepage data, about page data...). Tuy nhiên khi chạy trên project Supabase mới, các migration sẽ tự chạy và đã tạo dữ liệu đó.

File `seed.sql` sẽ bổ sung thêm dữ liệu mà **không có trong migrations** nhưng cần thiết để hệ thống hoạt động, ví dụ: gán permissions vào roles, tạo storage buckets (đã trong migrations).

Thực tế, hầu hết dữ liệu seed đã nằm trong migrations. File seed.sql sẽ đóng vai trò:
1. **Tài liệu tham khảo** - tổng hợp lại toàn bộ dữ liệu mặc định ở một nơi
2. **Chạy bổ sung** khi cần reset data mà không chạy lại migrations
3. **Đảm bảo dữ liệu đầy đủ** với `ON CONFLICT DO NOTHING`

## Nội dung file seed.sql

File sẽ chứa INSERT cho các bảng sau (với `ON CONFLICT DO NOTHING` để chạy an toàn):

| Bảng | Dữ liệu |
|------|----------|
| `roles` | ADMIN, USER |
| `permissions` | VIEW_FAMILY_TREE, VIEW_MEMBER_DETAIL, MANAGE_USERS, MANAGE_MEMBERS, ACCESS_ADMIN, MANAGE_POSTS |
| `role_permissions` | Gán tất cả permissions cho role USER |
| `categories` | 3 danh mục mặc định |
| `menu_items` | 5 mục menu |
| `footer_settings` | 5 section footer |
| `homepage_hero` | 1 bản ghi hero |
| `homepage_features` | 4 feature cards |
| `homepage_quotes` | 1 câu tục ngữ |
| `about_page_hero` | 1 bản ghi |
| `about_page_sections` | 4 sections |
| `about_page_list_items` | 7 items (4 purpose + 3 participation) |
| `about_page_donation` | 1 bản ghi |

## Thực hiện

Tạo 1 file mới: `supabase/seed.sql`

File sẽ có header hướng dẫn cách sử dụng, sau đó là các INSERT statements theo thứ tự phụ thuộc (roles trước, rồi permissions, rồi role_permissions...).

## Lưu ý quan trọng
- File seed.sql **không** tạo bảng hay schema - việc đó do migrations đảm nhận
- File seed.sql **không** chứa dữ liệu thành viên gia phả (family_members) - dữ liệu đó import qua Excel
- Sử dụng `ON CONFLICT DO NOTHING` để có thể chạy nhiều lần an toàn
- Storage buckets (avatars, post-images) đã được tạo trong migrations

