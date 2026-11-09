# Food Recipes — kế hoạch nâng cấp theo master prompt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Mục tiêu.** Nâng cấp ứng dụng hiện có theo Discover → Plan → Shop → Cook → Share. Bếp cá nhân là phạm vi phát hành đầu tiên. Share ban đầu là chia sẻ công thức đã xuất bản. Cộng đồng công khai là mốc tiếp theo với tiêu chí mở riêng. Shopping List phục vụ mua nguyên liệu ngoài ứng dụng.

**Kiến trúc.** Giữ hai package pnpm, React/Vite, NestJS modular monolith, Prisma và PostgreSQL. Dùng controller/DTO và OpenAPI nội bộ làm hợp đồng. Giữ query cache theo người dùng và phạm vi. Mọi thay đổi quyền sở hữu phải được cưỡng chế ở backend. Dùng migration bổ sung và kiểm tra backfill trước khi dọn dữ liệu cũ.

## Hiện trạng đầu vào

### Tiến độ thực hiện — 2026-11-09

- M0 hoàn tất trên worktree `codex/2026-11-09-platform-roadmap`; các package cài frozen, PostgreSQL sạch được migrate/seed và bộ baseline đã chạy lại. Chi tiết lệnh và exit code nằm trong `.superpowers/sdd/2026-11-09-food-recipes-platform-roadmap/progress.md`.
- M1 đã triển khai preview không ghi dữ liệu, xác nhận tính lại theo pantry hiện tại, xem lượng thiếu theo khẩu phần, cập nhật preview khi đổi khẩu phần, cùng luồng hoàn tất và Skip/Save leftover. PostgreSQL thật kiểm tra thao tác lặp/song song và rollback giao dịch.
- M3 có lát cắt pantry expiry → tìm công thức → so nguyên liệu → thêm thiếu → thêm vào lịch; bài mock journey chạy qua. Phần tổng hợp nguyên liệu tuần có preview và tương tác đồng thời vẫn cần thực hiện.
- M2/M4 còn mở. Không thêm OAuth, hồ sơ/cộng đồng hay moderation trong lượt này vì đó là các lát cắt riêng cần tiêu chí phát hành và kiểm tra quyền đầy đủ. M5 được hoãn theo điều kiện đầu tư đã nêu; chưa có mục tiêu đo lường, ngân sách, hay bộ đánh giá AI.

| Phạm vi | Trạng thái | Việc còn lại |
|---|---|---|
| Auth và hồ sơ | Một phần | Đã có local auth, session, recovery, verification, cài đặt. Xác minh delivery và quyền truy cập. Google OAuth, hồ sơ công khai và moderator thuộc các lát cắt riêng. |
| Recipe | Một phần | Có CRUD, draft, publish/archive, media, nguyên liệu có cấu trúc và chia sẻ. Xác minh scaling, semantics unpublish, dữ liệu cũ và Recipe JSON-LD. |
| Discover và Saved | Một phần | Có tìm kiếm, lọc, phân trang công thức, Saved và collections. Kiểm tra thiếu facet, pagination Saved và chất lượng gợi ý theo nguyên liệu. |
| Bếp cá nhân | Một phần | Có Kitchen Command Center, lịch tuần, mẫu, pantry, shopping, nấu, hẹn giờ, lịch sử và món dư. Khoảng trống ở preview/confirm, retry, tổng hợp tuần và các ca E2E. |
| Cộng đồng | Một phần | Có đánh giá, review và báo cáo. Còn hồ sơ công khai, quyền hiển thị collection, comment/follow, UI moderation và audit log. |
| Nâng cao | Một phần | Có feed dựa trên luật và thông báo. AI assistant và nhận diện ảnh chờ điều kiện đầu tư. |

Master đang có diff sản phẩm, dependency và bài test PostgreSQL chưa commit. Nhánh codex/food-recipes-quality-baseline có e4e69dc và eaaacd1. Baseline lịch sử có 415 frontend tests, 12 API contract tests, 26 migrations và 8/9 real-stack qua. Nhánh test đạt 60/62 mock E2E, hai ca còn lại là nguyên liệu sắp hết hạn và tạo thực đơn tuần. Các số này cần chạy lại trên trạng thái tích hợp.

## M0 — Tạo baseline tích hợp

- [x] Kiểm tra git status, diff từng hunk và provenance. Dùng nhánh/worktree riêng để tích hợp hai commit QA cùng các diff liên quan. Kiểm tra giao nhau ở E2E, giữ README và các thay đổi ngoài lát cắt theo nguồn gốc của chúng.
- [x] Xác minh packageManager và lockfile của từng package. Kiểm tra dotenv là dependency trực tiếp, cài frozen-lockfile, generate/validate Prisma, lint/typecheck, unit, API E2E và build. Chạy từ đúng package. Ghi từng exit code.
- [x] Dựng PostgreSQL cô lập, migrate rồi seed. Chạy mock và real-stack với URL/cổng cấu hình, output directory sạch. Tái hiện hai lỗi retention và xác định fixture hay hành vi sản phẩm trước khi sửa. Lưu kết quả so với baseline.
- [x] Cổng qua mốc: tái lập được build và bộ kiểm thử từ checkout sạch, biết rõ từng lỗi còn lại, có bằng chứng cho môi trường và commit được chạy.

## M1 — P0: Kiểm tra nguyên liệu, xác nhận mua, hoàn tất nấu

- [x] Chốt hợp đồng giữa Planning API, Home, Recipe Detail và Shopping. Xem trước trả nguyên liệu đủ/thiếu/cần định lượng theo khẩu phần và giữ danh sách mua nguyên vẹn. Xác nhận tính lại từ dữ liệu hiện tại phía server rồi ghi đúng phạm vi; giữ tương thích caller/payload.
- [x] Kiểm chứng repository trên PostgreSQL thật với yêu cầu gửi lặp và song song, đơn vị khác nhau, mục thủ công, pantry thay đổi sau preview, rollback, hoàn tất nấu lặp/song song, quyền sở hữu và lỗi ghi history.
- [x] Tích hợp preview/xác nhận vào Home, Recipe Detail và PreparationSummary. Hiện lượng thiếu theo khẩu phần; đổi khẩu phần yêu cầu preview mới trước khi ghi. Trạng thái cần định lượng được hiển thị nhất quán.
- [x] Kiểm tra Finish → Skip/Save leftover → Review recipe và history trên stack thật. Test cũ cũng giữ trạng thái nấu qua điều hướng. Kiểm tra lỗi mạng/retry sâu hơn vẫn là hạng mục QA tiếp theo.
- [x] Cổng qua mốc: real-stack Playwright chạy chọn món → đổi khẩu phần → xem thiếu → xác nhận → nấu và hai nhánh leftover; bộ PostgreSQL riêng đối chiếu số dòng shopping, history và pantry usage.

## M2 — P0: Hoàn thiện nền tảng công thức và khám phá

- [ ] Auth/recipe editor: xác minh đăng ký, xác thực email, reset, session rotation, quyền chủ sở hữu, upload hợp lệ, draft → publish và semantics archive/unpublish. Chỉ triển khai khoảng trống có ca chấp nhận cụ thể. OAuth phụ thuộc nhu cầu phát hành và cấu hình nhà cung cấp.
- [ ] Discover/Saved: kiểm tra facet cuisine, difficulty, dietary, sort và pagination phía server. Bổ sung từng facet còn thiếu qua DTO, query và URL state. Giữ URL có thể chia sẻ, quay lại giữ bộ lọc. Chỉ thêm index sau khi đo query plan trên dữ liệu đại diện.
- [ ] Recipe detail/share: kiểm tra ảnh, canonical, metadata và Recipe structured data lấy từ công thức public. Test draft riêng tư, công thức không tồn tại và ảnh lỗi. Đo bundle và tách route ít dùng khi có chênh lệch kiểm chứng được.
- [ ] Cổng qua mốc: đăng ký → tạo/publish → tìm/lọc → mở/chia sẻ → lưu công thức qua API thật. Kiểm tra quyền riêng tư bằng tài khoản thứ hai. Chạy mobile, desktop và keyboard.

## M3 — P1: Lập lịch và mua nguyên liệu theo tuần

- [ ] Tái sử dụng kế hoạch, mẫu tuần, drag/drop và recurring meals. Xác minh đổi khẩu phần, move/duplicate và chế độ dùng bàn phím. Chỉ hiển thị dinh dưỡng khi dữ liệu đủ.
- [ ] Thêm tổng hợp danh sách mua từ kế hoạch đã chọn. Gộp theo danh tính nguyên liệu và đơn vị tương thích, tính lượng cần theo khẩu phần và tồn kho theo quy tắc đã chốt. Cho xem thay đổi trước khi ghi, giữ mục thủ công và checked. Test số lẻ, đơn vị không tương thích, đổi lịch, retry và cập nhật đồng thời.
- [x] Nối Pantry → món dùng nguyên liệu sắp hết hạn → chi tiết → kế hoạch. E2E hiện xác nhận được so sánh lượng pantry/thiếu và thêm vào lịch; thứ tự gợi ý hiện dựa trên tìm kiếm theo tên nguyên liệu. Xếp hạng xác định theo mức độ khớp và thời gian, cùng Wake Lock, vẫn còn mở.
- [ ] Thu gọn điều hướng hộ gia đình trong mốc cá nhân nếu cần. Gỡ route, endpoint hoặc cột chỉ sau khi kiểm tra dữ liệu, lưu lượng và kế hoạch tương thích. Giữ dữ liệu và thử phương án khôi phục trước migration phá vỡ tương thích.

## M4 — P1: Cộng đồng và quản trị

- [ ] Chốt quyền USER/MODERATOR/ADMIN, quyền riêng tư của hồ sơ/collections, quy trình xử lý báo cáo và audit log. Đưa moderation API và màn xử lý báo cáo lên trước mở rộng tương tác công khai.
- [ ] Phát hành tuần tự hồ sơ và collections công khai, rồi comment/reply, follow và thông báo liên quan. Mỗi lát cắt có phân trang, giới hạn spam, quyền sửa/xóa và kiểm thử chống đọc dữ liệu riêng tư. Xác định tác dụng riêng của likes trước khi thêm cạnh Saved và rating.
- [ ] Cổng qua mốc: người dùng báo cáo, moderator xử lý, hành động có audit log và quyền admin được kiểm tra ở API. Chỉ công bố số liệu analytics có định nghĩa và nguồn rõ.

## M5 — P2 có điều kiện

- [ ] Đo chất lượng gợi ý theo luật hiện có trước. AI trợ lý và nhận diện ảnh chỉ đi tiếp sau khi có mục tiêu đo lường, ngân sách, dữ liệu đánh giá và phương án fallback. Kết quả ảnh cần người dùng xác nhận, dữ liệu dị ứng/dinh dưỡng cần nguồn đáng tin cậy. Hạ tầng bổ sung phải gắn với nhu cầu đã đo.

## Kỷ luật giao diện và phát hành

- Frontend App Builder áp dụng cho màn mới hoặc tái thiết kế đáng kể. Lập concept đầy đủ desktop/mobile và các trạng thái, chốt token từ UI hiện tại, kiểm tra qua Browser và so ảnh concept với ảnh render trước bàn giao. Với thay đổi nhỏ, dùng design system sẵn có.
- Áp dụng hướng dẫn Storefront cho khám phá, ảnh, bộ lọc, trạng thái rỗng, nút xác nhận và cảm ứng. Khi triển khai đọc reference/design.md và mobile-responsiveness.md, thêm product-listing/search cho Discover và connecting-to-backend cho hợp đồng API. Danh sách mua là checklist nguyên liệu, cấu trúc SEO theo loại Recipe.
- Tách việc độc lập giữa backend, frontend và QA sau khi chốt hợp đồng. TDD cho logic thay đổi, review quyền sở hữu, retry và migration, chạy kiểm tra mới trước mỗi commit. Push/PR theo quyền của phiên triển khai.
