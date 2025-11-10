<?php
class EmployeeModel extends BaseModel {
    

    protected string $tableName = 'employees';

    /**
     * Thêm một nhân viên mới.
     * @param object $data Dữ liệu từ request body (đã được Controller kiểm tra).
     * @return array Dữ liệu nhân viên vừa được tạo.
     * @throws Exception Nếu tạo thất bại.
     */
    public function create(object $data): array {
        $id = 'EMP_' . time(); // Tạo ID nhân viên
        
        // 1. Làm sạch dữ liệu đầu vào
        $name = htmlspecialchars(strip_tags($data->name));
        $hireDate = htmlspecialchars(strip_tags($data->hireDate));
        $positionId = htmlspecialchars(strip_tags($data->positionId));

        // 2. Chuẩn bị câu truy vấn (Tuân thủ Xóa Mềm, is_active=1)
        $query = "INSERT INTO " . $this->tableName . " 
                    (id, name, hire_date, position_id, is_active) 
                VALUES 
                    (:id, :name, :hire_date, :position_id, 1)";
        
        $stmt = $this->pdo->prepare($query);

        // 3. Bind các tham số
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':hire_date', $hireDate);
        $stmt->bindParam(':position_id', $positionId);

        // 4. Thực thi và kiểm tra
        if ($stmt->execute()) {
            return [
                'id' => $id, 
                'name' => $name, 
                'hire_date' => $hireDate,
                'position_id' => $positionId
            ];
        }
        
        throw new Exception('Lỗi máy chủ: Không thể tạo nhân viên.', 500);
    }

    /**
     * Cập nhật thông tin một nhân viên.
     * @param string $id ID nhân viên cần cập nhật.
     * @param object $data Dữ liệu mới từ request body.
     * @return bool True nếu cập nhật thành công.
     */
    public function update(string $id, object $data): bool {
        // 1. Làm sạch dữ liệu
        $name = htmlspecialchars(strip_tags($data->name));
        $hireDate = htmlspecialchars(strip_tags($data->hireDate));
        $positionId = htmlspecialchars(strip_tags($data->positionId));

        // 2. Chuẩn bị câu truy vấn
        $query = "UPDATE " . $this->tableName . " 
                SET 
                    name = :name, 
                    hire_date = :hire_date, 
                    position_id = :position_id 
                WHERE 
                    id = :id AND is_active = 1";
                
        $stmt = $this->pdo->prepare($query);
        
        // 3. Bind các tham số
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':hire_date', $hireDate);
        $stmt->bindParam(':position_id', $positionId);
        $stmt->bindParam(':id', $id);
        
        // 4. Thực thi
        return $stmt->execute();
    }

    /**
     * Xóa mềm một nhân viên.
     * @param string $id ID nhân viên cần xóa.
     * @return bool True nếu thành công.
     */
    public function softDelete(string $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

/**
     * Lấy danh sách nhân viên có phân trang và sắp xếp.
     * @param int $page Số trang hiện tại.
     * @param int $limit Số lượng mục trên mỗi trang.
     * @param string $sortBy Cột để sắp xếp.
     * @param string $sortOrder Chiều sắp xếp (ASC hoặc DESC).
     * @return array Danh sách nhân viên.
     */
    public function getAll(int $page = 1, int $limit = 10, string $sortBy = 'name', string $sortOrder = 'ASC'): array {
        // 1. Bảo mật Sắp xếp: Ngăn SQL Injection bằng cách chỉ cho phép sắp xếp theo các cột an toàn
        $allowedSortBy = ['id', 'name', 'hire_date', 'position_title', 'department_name'];
        if (!in_array($sortBy, $allowedSortBy)) {
            $sortBy = 'name'; // Mặc định
        }
        // Đảm bảo chiều sắp xếp là hợp lệ
        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';

        // 2. Tính toán OFFSET
        $offset = ($page - 1) * $limit;

        // 3. Câu truy vấn SQL JOIN
        $query = "SELECT 
                    e.id, 
                    e.name, 
                    e.hire_date, 
                    p.title as position_title, 
                    d.name as department_name
                FROM " . $this->tableName . " AS e
                LEFT JOIN positions AS p ON e.position_id = p.id
                LEFT JOIN departments AS d ON p.department_id = d.id
                WHERE 
                    e.is_active = 1
                ORDER BY 
                    " . $sortBy . " " . $sortOrder . "
                LIMIT 
                    :limit 
                OFFSET 
                    :offset";
        
        $stmt = $this->pdo->prepare($query);

        // 4. Bind giá trị cho LIMIT và OFFSET
        // Phải dùng bindParam với PDO::PARAM_INT vì LIMIT/OFFSET yêu cầu kiểu số nguyên
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy tổng số nhân viên đang hoạt động (để tính toán phân trang).
     * @return int Tổng số nhân viên.
     */
    public function getTotalEmployees(): int {
        $query = "SELECT COUNT(id) as total FROM " . $this->tableName . " WHERE is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        // fetchColumn() lấy giá trị của cột đầu tiên (total) từ hàng đầu tiên
        return (int) $stmt->fetchColumn();
    }

/**
     * Tìm kiếm nhân viên (động) và có phân trang.
     * @param array $criteria - Mảng chứa các tiêu chí [name, deptId, posId]
     * @param int $page
     * @param int $limit
     * @param string $sortBy
     * @param string $sortOrder
     * @return array - Trả về một mảng chứa [data, total]
     */
    public function search(array $criteria, int $page = 1, int $limit = 10, string $sortBy = 'name', string $sortOrder = 'ASC'): array {
        
        // 1. Khởi tạo câu truy vấn và mảng tham số
        // Chúng ta JOIN ngay từ đầu để có thể lọc theo phòng ban và vị trí
        $queryBase = "FROM " . $this->tableName . " AS e
                    LEFT JOIN positions AS p ON e.position_id = p.id
                    LEFT JOIN departments AS d ON p.department_id = d.id";
        
        $whereClauses = ["e.is_active = 1"]; // Luôn bắt đầu với xóa mềm
        $params = [];

        // 2. Xây dựng mệnh đề WHERE "động"
        if (!empty($criteria['name'])) {
            $whereClauses[] = "e.name LIKE :name";
            $params[':name'] = '%' . $criteria['name'] . '%'; // LIKE %value%
        }
        if (!empty($criteria['deptId'])) {
            $whereClauses[] = "p.department_id = :deptId";
            $params[':deptId'] = $criteria['deptId'];
        }
        if (!empty($criteria['posId'])) {
            $whereClauses[] = "e.position_id = :posId";
            $params[':posId'] = $criteria['posId'];
        }

        // Ghép các mệnh đề WHERE lại
        $whereSql = " WHERE " . implode(" AND ", $whereClauses);

        // --- TÍNH TỔNG SỐ KẾT QUẢ (CHO PHÂN TRANG) ---
        $countQuery = "SELECT COUNT(e.id) as total " . $queryBase . $whereSql;
        $countStmt = $this->pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalResults = (int) $countStmt->fetchColumn();

        // --- LẤY DỮ LIỆU ĐÃ PHÂN TRANG ---
        
        // 3. Bảo mật Sắp xếp
        $allowedSortBy = ['id', 'name', 'hire_date', 'position_title', 'department_name'];
        if (!in_array($sortBy, $allowedSortBy)) $sortBy = 'name';
        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';

        // 4. Tính toán OFFSET
        $offset = ($page - 1) * $limit;

        // 5. Câu truy vấn SQL hoàn chỉnh
        $dataQuery = "SELECT 
                        e.id, e.name, e.hire_date, 
                        p.title as position_title, 
                        d.name as department_name
                      " . $queryBase . $whereSql . "
                      ORDER BY " . $sortBy . " " . $sortOrder . "
                      LIMIT :limit OFFSET :offset";
        
        $dataStmt = $this->pdo->prepare($dataQuery);
        
        // 6. Bind các tham số (cả cho WHERE và LIMIT/OFFSET)
        $dataStmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $dataStmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        foreach ($params as $key => &$val) { // Phải dùng & (tham chiếu) khi bindParam
            $dataStmt->bindParam($key, $val);
        }

        $dataStmt->execute();
        
        // 7. Trả về kết quả
        return [
            'total' => $totalResults,
            'page' => $page,
            'limit' => $limit,
            'data' => $dataStmt->fetchAll()
        ];
    }

    /**
     * Lấy thông tin chi tiết của MỘT nhân viên theo ID.
     * @param string $id ID của nhân viên cần tìm.
     * @return array|null Dữ liệu nhân viên hoặc null nếu không tìm thấy.
     */
    public function getById(string $id): ?array {
        // Lấy tất cả thông tin (bao gồm cả position_id) và phải đang active
        $query = "SELECT * FROM " . $this->tableName . " WHERE id = :id AND is_active = 1";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':id' => $id]); 
        
        $result = $stmt->fetch(); 
        
        return $result === false ? null : $result;
    }
}
?>

