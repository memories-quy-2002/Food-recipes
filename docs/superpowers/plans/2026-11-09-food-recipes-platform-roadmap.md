# Food Recipes — kế hoạch nâng cấp theo master prompt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Mục tiêu.** Nâng cấp ứng dụng hiện có theo Discover → Plan → Shop → Cook → Share. Bếp cá nhân là phạm vi phát hành đầu tiên. Share ban đầu là chia sẻ công thức đã xuất bản. Cộng đồng công khai là mốc tiếp theo với tiêu chí mở riêng. Shopping List phục vụ mua nguyên liệu ngoài ứng dụng.

**Kiến trúc.** Giữ hai package pnpm, React/Vite, NestJS modular monolith, Prisma và PostgreSQL. Dùng controller/DTO và OpenAPI nội bộ làm hợp đồng. Giữ query cache theo người dùng và phạm vi. Mọi thay đổi quyền sở hữu phải được cưỡng chế ở backend. Dùng migration bổ sung và kiểm tra backfill trước khi dọn dữ liệu cũ.

## Hiện trạng đầu vào

### Tiến độ thực hiện — 2026-11-10

- M0 hoàn tất trên worktree `feat/food-recipes-platform-roadmap`; các package cài frozen, PostgreSQL sạch được migrate/seed và bộ baseline đã chạy lại. Chi tiết lệnh và exit code nằm trong `.superpowers/sdd/2026-11-09-food-recipes-platform-roadmap/progress.md`.
- M1 đã triển khai preview không ghi dữ liệu, xác nhận tính lại theo pantry hiện tại, xem lượng thiếu theo khẩu phần, cập nhật preview khi đổi khẩu phần, cùng luồng hoàn tất và Skip/Save leftover. PostgreSQL thật kiểm tra thao tác lặp/song song và rollback giao dịch.
- M2 đã bổ sung Recipe JSON-LD chỉ cho công thức public, lọc backend theo nguyên liệu cụ thể (cả nguyên liệu có cấu trúc và chuỗi cũ), và lazy-load các route ít dùng. Real-stack xác nhận tìm “Avocado” ra công thức đúng; main JS giảm từ 819.89 kB xuống 391.37 kB (gzip 120.97 kB). Facet cuisine/difficulty chưa có trường dữ liệu công thức tương ứng nên chưa tự tạo.
- M3 có lát cắt pantry expiry → tìm đúng công thức theo nguyên liệu → xem thiếu → thêm vào lịch; real-stack xác minh lọc ingredient, mock journey xác minh tiếp tới plan. Phần preview/tổng hợp danh sách mua cả tuần và tương tác đồng thời vẫn cần thực hiện.
- M4 còn mở: hồ sơ/collections công khai, moderation và audit log là các lát cắt riêng cần tiêu chí sản phẩm và kiểm tra quyền. M5 được hoãn theo điều kiện đầu tư đã nêu; chưa có mục tiêu đo lường, ngân sách, hay bộ đánh giá AI.

| Phạm vi | Trạng thái | Việc còn lại |
|---|---|---|
| Auth và hồ sơ | Một phần | Đã có local auth, session, recovery, verification, cài đặt. Xác minh delivery và quyền truy cập. Google OAuth, hồ sơ công khai và moderator thuộc các lát cắt riêng. |
| Recipe | Một phần | Có CRUD, draft, publish/archive, media, nguyên liệu có cấu trúc, chia sẻ và JSON-LD public. Còn semantics unpublish và toàn bộ chuỗi tạo/publish thật. |
| Discover và Saved | Một phần | Có tìm kiếm theo tên/mô tả/nguyên liệu, facet cơ bản, sort, phân trang công thức, Saved và collections. Cuisine/difficulty chưa có dữ liệu nguồn; còn kiểm tra pagination Saved và chất lượng gợi ý. |
| Bếp cá nhân | Một phần | Có Kitchen Command Center, lịch tuần, mẫu, pantry, shopping, nấu, hẹn giờ, lịch sử và món dư. Khoảng trống ở preview/confirm, retry, tổng hợp tuần và các ca E2E. |
| Cộng đồng | Một phần | Có đánh giá, review và báo cáo. Còn hồ sơ công khai, quyền hiển thị collection, comment/follow, UI moderation và audit log. |
| Nâng cao | Một phần | Có feed dựa trên luật và thông báo. AI assistant và nhận diện ảnh chờ điều kiện đầu tư. |

Nhánh `feat/food-recipes-platform-roadmap` được rebase trên `origin/master` tại `7516048`. Các lát cắt đã commit gồm `e83dc29` (dotenv), `21a6010` (bếp), `c911fd8` (kiểm chứng shopping), `e4588be` (tìm kiếm pantry và SEO), và `a2915ae` (lazy loading). Baseline trước rebase: 26 migrations, backend 63 suites / 310 tests, frontend 133 files / 423 tests, 62/62 mock E2E, 11/11 real-stack và 8/8 PostgreSQL idempotency; CI trên nhánh master mới sẽ xác minh lại sau rebase.

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
- [x] Recipe detail/share: canonical/metadata sẵn có; thêm Recipe JSON-LD chỉ từ công thức published, không đưa dinh dưỡng vào schema nếu chưa có nguồn đáng tin. E2E xác nhận JSON-LD trên API thật. Đã đo và lazy-load route ít dùng, entry JS giảm còn 391.37 kB (120.97 kB gzip). Ca ảnh lỗi và draft owner vẫn cần acceptance bổ sung.
- [ ] Cổng qua mốc: đăng ký → tạo/publish → tìm/lọc → mở/chia sẻ → lưu công thức qua API thật. Kiểm tra quyền riêng tư bằng tài khoản thứ hai. Chạy mobile, desktop và keyboard.

## M3 — P1: Lập lịch và mua nguyên liệu theo tuần

- [ ] Tái sử dụng kế hoạch, mẫu tuần, drag/drop và recurring meals. Xác minh đổi khẩu phần, move/duplicate và chế độ dùng bàn phím. Chỉ hiển thị dinh dưỡng khi dữ liệu đủ.
- [ ] Thêm tổng hợp danh sách mua từ kế hoạch đã chọn. Gộp theo danh tính nguyên liệu và đơn vị tương thích, tính lượng cần theo khẩu phần và tồn kho theo quy tắc đã chốt. Cho xem thay đổi trước khi ghi, giữ mục thủ công và checked. Test số lẻ, đơn vị không tương thích, đổi lịch, retry và cập nhật đồng thời.
- [x] Nối Pantry → món dùng nguyên liệu sắp hết hạn → tìm kiếm nguyên liệu server-side → chi tiết → kế hoạch. Real-stack xác nhận recipe search theo ingredient; mock E2E xác nhận so sánh lượng thiếu và thêm vào lịch. Xếp hạng mức độ khớp/thời gian và Wake Lock vẫn còn mở.
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
