-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS hrm_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrm_app_db;

-- ----------------------------
-- Bảng: users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
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
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `password_hash`, `role`, `email`) VALUES
('admin', 'c1c9c439f04d7f5511b8a531a7b45f3c1f3c3b01a1c9c439f04d7f5511b8a531', 'admin', 'admin@example.com'), -- Mật khẩu: admin123@
('manager1', 'a81bacb870e283116a30c5147a30c5147a30c5147a30c5147a30c5147a30c514', 'manager', 'manager1@example.com');-- Mật khẩu: manager123@

-- ----------------------------
-- Bảng: departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dept_name` (`name`),
  KEY `idx_dept_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departments` (`id`, `name`) VALUES
('dept_it', 'Công nghệ thông tin'),
('dept_hr', 'Nhân sự'),
('dept_mkt', 'Marketing');

-- ----------------------------
-- Bảng: positions
-- ----------------------------
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_base` decimal(15,2) NOT NULL DEFAULT 0.00,
  `department_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pos_title` (`title`),
  KEY `fk_pos_dept` (`department_id`),
  KEY `idx_pos_is_active` (`is_active`),
  CONSTRAINT `fk_pos_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `positions` (`id`, `title`, `salary_base`, `department_id`) VALUES
('pos_dev', 'Developer', 50000000.00, 'dept_it'),
('pos_qa', 'QA Tester', 40000000.00, 'dept_it'),
('pos_bse', 'BrSE', 60000000.00, 'dept_it'),
('pos_recruiter', 'Recruiter', 35000000.00, 'dept_hr'),
('pos_cpo', 'C&B Officer', 42000000.00, 'dept_hr'),
('pos_manager', 'Marketing Manager', 65000000.00, 'dept_mkt'),
('pos_content', 'Content Creator', 38000000.00, 'dept_mkt');

-- ----------------------------
-- Bảng: employees
-- ----------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date NOT NULL,
  `position_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_emp_name` (`name`),
  KEY `fk_emp_pos` (`position_id`),
  KEY `idx_emp_is_active` (`is_active`),
  CONSTRAINT `fk_emp_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `employees` (`id`, `name`, `hire_date`, `position_id`) VALUES
('EMP_1', 'Nguyễn Văn A', '2023-01-15', 'pos_dev'),
('EMP_2', 'Trần Thị B', '2022-08-20', 'pos_recruiter'),
('EMP_3', 'Lê Văn C', '2021-05-10', 'pos_manager'),
('EMP_4', 'Phạm Thị D', '2023-03-01', 'pos_qa'),
('EMP_5', 'Hoàng Văn E', '2023-06-15', 'pos_content');

-- ----------------------------
-- Bảng: attendance_logs
-- ----------------------------
DROP TABLE IF EXISTS `attendance_logs`;
CREATE TABLE `attendance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `check_in_time` timestamp NOT NULL,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `work_duration` decimal(5,2) DEFAULT NULL,
  `status` enum('on_time','late','early_leave','late_and_early','incomplete') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `late_minutes` int(11) DEFAULT 0,
  `early_leave_minutes` int(11) DEFAULT 0,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_att_emp` (`employee_id`),
  KEY `idx_att_date` (`date`),
  KEY `idx_att_status` (`status`),
  CONSTRAINT `fk_att_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE -- Cascade delete log nếu xóa nhân viên
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Thêm dữ liệu mẫu cho attendance_logs nếu cần)

-- ----------------------------
-- Bảng: leave_requests
-- ----------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` enum('annual','sick') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `is_active` tinyint(1) NOT NULL DEFAULT 1, -- Để có thể 'hủy' yêu cầu
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_leave_emp` (`employee_id`),
  KEY `idx_leave_type` (`type`),
  KEY `idx_leave_status` (`status`),
  KEY `idx_leave_is_active` (`is_active`),
  CONSTRAINT `fk_leave_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Thêm dữ liệu mẫu cho leave_requests nếu cần)

-- ----------------------------
-- Bảng: performance_reviews
-- ----------------------------
DROP TABLE IF EXISTS `performance_reviews`;
CREATE TABLE `performance_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewer_id` int(11) DEFAULT NULL, -- ID từ bảng users (người đánh giá)
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `feedback` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_review_emp` (`employee_id`),
  KEY `fk_review_reviewer` (`reviewer_id`),
  KEY `idx_review_date` (`date`),
  KEY `idx_review_rating` (`rating`),
  CONSTRAINT `fk_review_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng: salary_history 
-- ----------------------------
DROP TABLE IF EXISTS `salary_history`;
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
  KEY `idx_change_type` (`change_type`),
  KEY `idx_effective_date` (`effective_date`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_salary_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_salary_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_salary_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci