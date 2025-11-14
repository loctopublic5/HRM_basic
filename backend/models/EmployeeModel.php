<?php
// backend/models/EmployeeModel.php

class EmployeeModel extends BaseModel {
    
    protected string $tableName = 'employees';

    /**
     * Thêm một nhân viên mới (ĐÃ CẬP NHẬT THÊM shift_id).
     * @param object $data Dữ liệu từ request body.
     * @return array Dữ liệu nhân viên vừa được tạo.
     * @throws Exception Nếu tạo thất bại.
     */
    public function create(object $data): array {
        $id = 'EMP_' . time();
        
        // 1. Làm sạch dữ liệu đầu vào
        $name = htmlspecialchars(strip_tags($data->name));
        $hireDate = htmlspecialchars(strip_tags($data->hireDate));
        $positionId = htmlspecialchars(strip_tags($data->positionId));
        // Lấy shift_id (cho phép NULL nếu không được cung cấp)
        $shiftId = !empty($data->shift_id) ? (int)$data->shift_id : null;

        // 2. Chuẩn bị câu truy vấn
        $query = "INSERT INTO " . $this->tableName . " 
                    (id, name, hire_date, position_id, shift_id, is_active) 
                  VALUES 
                    (:id, :name, :hire_date, :position_id, :shift_id, 1)";
        
        $stmt = $this->pdo->prepare($query);

        // 3. Bind các tham số
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':hire_date', $hireDate);
        $stmt->bindParam(':position_id', $positionId);
        // Bind shift_id (cho phép NULL)
        $stmt->bindParam(':shift_id', $shiftId, $shiftId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);

        // 4. Thực thi và kiểm tra
        if ($stmt->execute()) {
            return [
                'id' => $id, 
                'name' => $name, 
                'hire_date' => $hireDate,
                'position_id' => $positionId,
                'shift_id' => $shiftId
            ];
        }
        
        throw new Exception('Lỗi máy chủ: Không thể tạo nhân viên.', 500);
    }

    /**
     * Cập nhật thông tin một nhân viên (ĐÃ CẬP NHẬT THÊM shift_id).
     * @param string $id ID nhân viên cần cập nhật.
     * @param object $data Dữ liệu mới từ request body.
     * @return bool True nếu cập nhật thành công.
     */
    public function update(string $id, object $data): bool {
        // 1. Làm sạch dữ liệu
        $name = htmlspecialchars(strip_tags($data->name));
        $hireDate = htmlspecialchars(strip_tags($data->hireDate));
        $positionId = htmlspecialchars(strip_tags($data->positionId));
        $shiftId = !empty($data->shift_id) ? (int)$data->shift_id : null;

        // 2. Chuẩn bị câu truy vấn
        $query = "UPDATE " . $this->tableName . " 
                  SET 
                      name = :name, 
                      hire_date = :hire_date, 
                      position_id = :position_id,
                      shift_id = :shift_id 
                  WHERE 
                      id = :id AND is_active = 1";
                  
        $stmt = $this->pdo->prepare($query);
        
        // 3. Bind các tham số
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':hire_date', $hireDate);
        $stmt->bindParam(':position_id', $positionId);
        $stmt->bindParam(':shift_id', $shiftId, $shiftId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':id', $id);
        
        // 4. Thực thi
        return $stmt->execute();
    }

    /**
     * Xóa mềm một nhân viên (Giữ nguyên).
     */
    public function softDelete(string $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    /**
     * Lấy thông tin chi tiết của MỘT nhân viên (ĐÃ CẬP NHẬT THÊM JOIN).
     */
    public function getById(string $id): ?array {
        // Cập nhật câu query để JOIN và lấy thêm Tên Vị trí, Tên Phòng ban, Tên Ca
        $query = "SELECT 
                    e.*, 
                    p.title as position_title, 
                    d.name as department_name,
                    ws.shift_name
                  FROM " . $this->tableName . " AS e
                  LEFT JOIN positions AS p ON e.position_id = p.id
                  LEFT JOIN departments AS d ON p.department_id = d.id
                  LEFT JOIN work_shifts AS ws ON e.shift_id = ws.id
                  WHERE 
                    e.id = :id AND e.is_active = 1";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':id' => $id]); 
        $result = $stmt->fetch(); 
        
        return $result === false ? null : $result;
    }

    /**
     * Lấy danh sách nhân viên có phân trang và sắp xếp (ĐÃ CẬP NHẬT THÊM JOIN).
     */
    public function getAll(int $page = 1, int $limit = 10, string $sortBy = 'name', string $sortOrder = 'ASC'): array {
        // 1. Bảo mật Sắp xếp (Thêm shift_name)
        $allowedSortBy = ['id', 'name', 'hire_date', 'position_title', 'department_name', 'shift_name'];
        if (!in_array($sortBy, $allowedSortBy)) $sortBy = 'name';
        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';

        // 2. Tính toán OFFSET
        $offset = ($page - 1) * $limit;

        // 3. Câu truy vấn SQL JOIN (Thêm LEFT JOIN work_shifts)
        $query = "SELECT 
                    e.id, 
                    e.name, 
                    e.hire_date, 
                    p.title as position_title, 
                    d.name as department_name,
                    ws.shift_name
                  FROM " . $this->tableName . " AS e
                  LEFT JOIN positions AS p ON e.position_id = p.id
                  LEFT JOIN departments AS d ON p.department_id = d.id
                  LEFT JOIN work_shifts AS ws ON e.shift_id = ws.id
                  WHERE 
                    e.is_active = 1
                  ORDER BY 
                    " . $sortBy . " " . $sortOrder . "
                  LIMIT 
                    :limit 
                  OFFSET 
                    :offset";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy tổng số nhân viên đang hoạt động (Giữ nguyên).
     */
    public function getTotalEmployees(): int {
        $query = "SELECT COUNT(id) as total FROM " . $this->tableName . " WHERE is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /**
     * Tìm kiếm nhân viên (động) và có phân trang (ĐÃ CẬP NHẬT THÊM JOIN).
     */
    public function search(array $criteria, int $page = 1, int $limit = 10, string $sortBy = 'name', string $sortOrder = 'ASC'): array {
        
        // 1. Khởi tạo câu truy vấn (Thêm LEFT JOIN work_shifts)
        $queryBase = "FROM " . $this->tableName . " AS e
                      LEFT JOIN positions AS p ON e.position_id = p.id
                      LEFT JOIN departments AS d ON p.department_id = d.id
                      LEFT JOIN work_shifts AS ws ON e.shift_id = ws.id";
        
        $whereClauses = ["e.is_active = 1"];
        $params = [];

        // 2. Xây dựng mệnh đề WHERE "động" (Thêm lọc theo shift_id)
        if (!empty($criteria['name'])) {
            $whereClauses[] = "e.name LIKE :name";
            $params[':name'] = '%' . $criteria['name'] . '%';
        }
        if (!empty($criteria['deptId'])) {
            $whereClauses[] = "p.department_id = :deptId";
            $params[':deptId'] = $criteria['deptId'];
        }
        if (!empty($criteria['posId'])) {
            $whereClauses[] = "e.position_id = :posId";
            $params[':posId'] = $criteria['posId'];
        }
        if (!empty($criteria['shiftId'])) {
            $whereClauses[] = "e.shift_id = :shiftId";
            $params[':shiftId'] = $criteria['shiftId'];
        }

        $whereSql = " WHERE " . implode(" AND ", $whereClauses);

        // --- TÍNH TỔNG SỐ KẾT QUẢ ---
        $countQuery = "SELECT COUNT(e.id) as total " . $queryBase . $whereSql;
        $countStmt = $this->pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalResults = (int) $countStmt->fetchColumn();

        // --- LẤY DỮ LIỆU ĐÃ PHÂN TRANG ---
        $allowedSortBy = ['id', 'name', 'hire_date', 'position_title', 'department_name', 'shift_name'];
        // ... (Logic bảo mật sắp xếp và offset giữ nguyên) ...
        $offset = ($page - 1) * $limit;

        // Câu truy vấn SQL hoàn chỉnh (Thêm shift_name)
        $dataQuery = "SELECT 
                        e.id, e.name, e.hire_date, 
                        p.title as position_title, 
                        d.name as department_name,
                        ws.shift_name
                      " . $queryBase . $whereSql . "
                      ORDER BY " . $sortBy . " " . $sortOrder . "
                      LIMIT :limit OFFSET :offset";
        
        $dataStmt = $this->pdo->prepare($dataQuery);
        $dataStmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $dataStmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        foreach ($params as $key => &$val) {
            $dataStmt->bindParam($key, $val);
        }
        $dataStmt->execute();
        
        return [
            'total' => $totalResults,
            'page' => $page,
            'limit' => $limit,
            'data' => $dataStmt->fetchAll()
        ];
    }
}
?>


