-- ---------------------------------
-- HỆ THỐNG QUẢN LÝ NHÂN SỰ (HRM)
-- Script: init.sql (Phiên bản Full-Stack)
-- ---------------------------------

-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS hrm_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrm_app_db;

-- ----------------------------
-- XÓA BẢNG CŨ (THEO THỨ TỰ PHỤ THUỘC NGƯỢC)
-- ----------------------------
DROP TABLE IF EXISTS `salary_history`;
DROP TABLE IF EXISTS `performance_reviews`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `attendance_logs`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `work_shifts`; -- (Bảng mới)
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------
-- Bảng: users (Quản lý)
-- ----------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','manager') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manager',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username_unique` (`username`),
  UNIQUE KEY `idx_email_unique` (`email`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mật khẩu hash: 'admin123@' và 'mana123@' (sử dụng SHA-256 như bạn yêu cầu)
INSERT INTO `users` (`username`, `password_hash`, `role`, `email`) VALUES
('admin', 'c1c9c439f04d7f5511b8a531a7b45f3c1f3c3b01a1c9c4403d3c3b01a1c9c440', 'admin', 'admin@example.com'),
('manager1', 'a81bacb870e283116a30c514578badd066dfc14578badd066dfc14578badd06', 'manager', 'manager1@example.com');

-- ----------------------------
-- Bảng: departments (Phòng ban)
-- ----------------------------
CREATE TABLE `departments` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departments` (`id`, `name`) VALUES
('dept_it', 'Công nghệ thông tin'),
('dept_hr', 'Nhân sự'),
('dept_mkt', 'Marketing');

-- ----------------------------
-- Bảng: work_shifts (Ca làm việc - MỚI)
-- ----------------------------
CREATE TABLE `work_shifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shift_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên ca, ví dụ: Hành chính 8h',
  `total_standard_hours` decimal(4,2) NOT NULL COMMENT 'Số giờ chuẩn của ca này (ví dụ: 8.00)',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm 2 ca làm việc mẫu
INSERT INTO `work_shifts` (`id`, `shift_name`, `total_standard_hours`) VALUES
(1, 'Hành chính 8h', 8.00),
(2, 'Ca gãy 10h', 10.00);

-- ----------------------------
-- Bảng: positions (Vị trí)
-- ----------------------------
CREATE TABLE `positions` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_base` decimal(15,2) NOT NULL DEFAULT 0.00,
  `department_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pos_dept` (`department_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_pos_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `positions` (`id`, `title`, `description`, `salary_base`, `department_id`) VALUES
('pos_dev', 'Developer', 'Phát triển phần mềm', 50000000.00, 'dept_it'),
('pos_qa', 'QA Tester', 'Kiểm thử chất lượng', 40000000.00, 'dept_it'),
('pos_recruiter', 'Recruiter', 'Tuyển dụng nhân sự', 35000000.00, 'dept_hr'),
('pos_manager', 'Marketing Manager', 'Quản lý marketing', 65000000.00, 'dept_mkt'),
('pos_content', 'Content Creator', 'Sáng tạo nội dung', 38000000.00, 'dept_mkt');

-- ----------------------------
-- Bảng: employees (Nhân viên - ĐÃ CẬP NHẬT)
-- ----------------------------
CREATE TABLE `employees` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date NOT NULL,
  `position_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shift_id` int(11) NULL DEFAULT NULL COMMENT 'Ca làm việc mặc định', -- CỘT MỚI
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_emp_name` (`name`),
  KEY `fk_emp_pos` (`position_id`),
  KEY `fk_emp_shift` (`shift_id`), -- INDEX MỚI
  KEY `idx_emp_is_active` (`is_active`),
  CONSTRAINT `fk_emp_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_emp_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON UPDATE CASCADE ON DELETE SET NULL -- RÀNG BUỘC MỚI
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gán tất cả nhân viên mẫu vào "Ca Hành chính 8h" (id=1)
INSERT INTO `employees` (`id`, `name`, `hire_date`, `position_id`, `shift_id`) VALUES
('EMP_1', 'Nguyễn Văn A', '2023-01-15', 'pos_dev', 1),
('EMP_2', 'Trần Thị B', '2022-08-20', 'pos_recruiter', 1),
('EMP_3', 'Lê Văn C', '2021-05-10', 'pos_manager', 1),
('EMP_4', 'Phạm Thị D', '2023-03-01', 'pos_qa', 1),
('EMP_5', 'Hoàng Văn E', '2023-06-15', 'pos_content', 1);

-- ----------------------------
-- Bảng: attendance_logs (Chấm công - ĐÃ CẬP NHẬT)
-- ----------------------------
CREATE TABLE `attendance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_id` int(11) NOT NULL COMMENT 'Ca làm việc tại thời điểm check-in', -- CỘT MỚI
  `date` date NOT NULL COMMENT 'Ngày chấm công (để lọc nhanh)',
  `check_in_time` datetime NOT NULL,
  `check_out_time` datetime NULL DEFAULT NULL,
  `work_duration` decimal(5,2) NULL DEFAULT NULL COMMENT 'Số giờ làm của phiên này',
  `status` enum('Hợp lệ','Bất thường') COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_att_emp` (`employee_id`),
  KEY `fk_att_shift` (`shift_id`), -- INDEX MỚI
  KEY `idx_att_checkout_null` (`check_out_time`), 
  KEY `idx_att_checkin_time` (`check_in_time`),
  KEY `idx_att_date` (`date`),
  CONSTRAINT `fk_att_emp_v2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_att_shift_v2` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng: leave_requests (Nghỉ phép)
-- ----------------------------
CREATE TABLE `leave_requests` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` enum('annual','sick') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_leave_emp` (`employee_id`),
  CONSTRAINT `fk_leave_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng: performance_reviews (Đánh giá)
-- ----------------------------
CREATE TABLE `performance_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewer_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `feedback` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_review_emp` (`employee_id`),
  KEY `fk_review_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_review_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng: salary_history (Lịch sử lương - Dùng thay cho adjustments)
-- ----------------------------
CREATE TABLE `salary_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_type` enum('allowance','bonus','deduction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `effective_date` date NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_salary_emp` (`employee_id`),
  KEY `fk_salary_pos` (`position_id`),
  KEY `fk_salary_user` (`created_by_user_id`),
  CONSTRAINT `fk_salary_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_salary_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_salary_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;