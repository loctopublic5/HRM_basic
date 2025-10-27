const USERS_STORAGE_KEY = 'hrm_users';
const SESSION_STORAGE_KEY = 'hrm_session';

/**
 * [Closure] Tạo ra một hàm "hash" mật khẩu đơn giản.
 * Lưu ý: Đây không phải là hashing an toàn, chỉ dùng để minh họa closure.
 * @param {string} secret - Một chuỗi bí mật.
 * @returns {function(string): string} Một hàm nhận mật khẩu và trả về chuỗi đã "hash".
 */
function createPasswordHasher(secret) {
    // Hàm bên ngoài có biến 'secret'.
    // Hàm bên trong (được return) sẽ "nhớ" biến 'secret' này ngay cả khi hàm bên ngoài đã chạy xong.
    return function(password) {
        // Một cách "hash" đơn giản: đảo ngược mật khẩu và nối với chuỗi bí mật.
        return password.split('').reverse().join('') + `::${secret}`;
    };
}

const hashPassword = createPasswordHasher('my-super-secret-key');

/**
 * Đăng ký một người dùng mới.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>} True nếu thành công, false nếu người dùng đã tồn tại.
 */
async function register(username, password) {
    // Giả lập độ trễ mạng
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        console.error('Người dùng đã tồn tại.');
        return false;
    }

    const newUser = {
        username: username,
        passwordHash: hashPassword(password), // Dùng hàm hash
    };
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
}

/**
 * Đăng nhập người dùng.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>} True nếu đăng nhập thành công.
 */
async function login(username, password) {
    // Giả lập độ trễ mạng
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const user = users.find(u => u.username === username);

    if (user && user.passwordHash === hashPassword(password)) {
        console.log('Đăng nhập thành công.');
        // Đăng nhập thành công, tạo một session token đơn giản
        const sessionToken = `session_${username}_${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
        console.log('Session token:', sessionToken);
        return true;
    }

    return false;
}

/**
 * Đăng xuất.
 */
function logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('Đã đăng xuất.');
}

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa.
 * @returns {boolean}
 */
function isLoggedIn() {
    return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
}

/**
 * Khởi tạo: Tạo tài khoản admin mặc định nếu chưa có.
 */
(function init() {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    if (users.length === 0) {
        console.log('Chưa có người dùng, đang tạo tài khoản admin mặc định...');
        register('admin', 'password123');
    }
})();

export { register, login, logout, isLoggedIn };