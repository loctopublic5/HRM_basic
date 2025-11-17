<?php
class AuthModel extends BaseModel {
    
    /**
     * Tên bảng CSDL mà Model này quản lý.
     * @var string
     */
    protected string $tableName = 'users';

    /**
     * Xác thực thông tin đăng nhập của người dùng.
     * @param string $username Tên đăng nhập.
     * @param string $password Mật khẩu (dạng thô, chưa hash).
     * @return array|false Mảng thông tin user nếu thành công, ngược lại trả về false.
     */
    public function login(string $username, string $password): array|false {
        try {
            // 1. Tìm người dùng bằng username và đảm bảo họ đang hoạt động (is_active = 1)
            $query = "SELECT * FROM " . $this->tableName . " WHERE username = :username AND is_active = 1";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':username' => $username]);
            
            $user = $stmt->fetch();

            // 2. Kiểm tra xem người dùng có tồn tại không
            if ($user === false) {
                // Không tìm thấy user
                return false;
            }

            // 3. So sánh mật khẩu (Đây là trái tim của bảo mật)
            // $password là mật khẩu thô (ví dụ: "123456")
            // $user['password'] là chuỗi hash từ CSDL (ví dụ: "$2y$10$eImi...")
            if (password_verify($password, $user['password'])) {
                
                // Mật khẩu khớp!
                
                // 4. Xóa trường mật khẩu hash trước khi trả về
                //    Để đảm bảo Controller không bao giờ thấy được chuỗi hash.
                unset($user['password']);
                
                return $user; // Trả về mảng thông tin người dùng
            } else {
                // Mật khẩu sai
                return false;
            }

        } catch (PDOException $e) {
            // Ghi lại lỗi CSDL nếu có
            error_log('AuthModel::login PDOException: ' . $e->getMessage());
            return false;
        }
    }
    
}
?>