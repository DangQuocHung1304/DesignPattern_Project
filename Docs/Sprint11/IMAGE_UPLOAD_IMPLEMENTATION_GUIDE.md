# Sprint 11 - Hướng Dẫn Thêm Chức Năng Upload Ảnh Đại Diện

## 📋 Tổng Quan

Sprint 11 bổ sung khả năng upload và quản lý ảnh đại diện cho bác sĩ/nhân viên trong hệ thống. Bao gồm:

1. **Backend API** - Đã hoàn thành ✅
2. **Database Migration** - Đã hoàn thành ✅  
3. **Public Pages** - Đã hoàn thành ✅
4. **Doctor Dashboard** - Cần thực hiện 🔄
5. **Admin Dashboard** - Cần thực hiện 🔄

---

## 🎯 Phần 1: Thêm Upload Ảnh vào Doctor Profile Edit

### File: `Web/HealthySystem-Frontend/doctor-profile-edit.html`

#### Bước 1: Thêm Section Ảnh Đại Diện (Sau dòng ~150, trước form thông tin cơ bản)

```html
<!-- Profile Image Upload Section -->
<div class="form-card">
    <h3><i class="fas fa-camera"></i> Ảnh Đại Diện</h3>
    
    <div class="profile-image-section">
        <div class="profile-image-container">
            <img id="profileImagePreview" 
                 src="https://ui-avatars.com/api/?name=Doctor&background=667eea&color=fff&size=200" 
                 alt="Profile" 
                 class="profile-image-preview">
            <div class="image-overlay">
                <i class="fas fa-camera fa-2x"></i>
            </div>
        </div>
        
        <div class="profile-image-actions">
            <input type="file" 
                   id="profileImageInput" 
                   accept="image/jpeg,image/jpg,image/png,image/gif" 
                   style="display: none;">
            
            <button type="button" 
                    class="btn btn-primary" 
                    onclick="document.getElementById('profileImageInput').click()">
                <i class="fas fa-upload"></i> Chọn ảnh
            </button>
            
            <button type="button" 
                    id="uploadImageBtn" 
                    class="btn btn-success" 
                    style="display: none;">
                <i class="fas fa-check"></i> Upload ảnh
            </button>
            
            <div id="uploadProgress" class="upload-progress" style="display: none;">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <small class="text-muted">Đang upload...</small>
            </div>
        </div>
        
        <div class="image-requirements">
            <small class="text-muted">
                <i class="fas fa-info-circle"></i> 
                Chấp nhận JPG, PNG, GIF. Tối đa 5MB.
            </small>
        </div>
    </div>
</div>
```

#### Bước 2: Thêm CSS Styles (Trong thẻ `<style>`)

```css
/* Profile Image Upload Styles */
.profile-image-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.profile-image-container {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: transform 0.3s ease;
}

.profile-image-container:hover {
    transform: scale(1.05);
}

.profile-image-container:hover .image-overlay {
    opacity: 1;
}

.profile-image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.profile-image-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
}

.image-requirements {
    text-align: center;
}

.upload-progress {
    width: 200px;
}

.upload-progress .progress {
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 5px;
}

.upload-progress .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
}
```

#### Bước 3: Thêm JavaScript Logic (Trong phần script, sau function loadDoctorProfile)

```javascript
// ==========================================
// PROFILE IMAGE UPLOAD FUNCTIONALITY
// ==========================================

let selectedImageFile = null;

// Load current profile image
async function loadProfileImage() {
    try {
        const response = await fetch(`${API_BASE_URL}/doctorprofile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.Profile && data.Profile.ProfileImageUrl) {
                const imageUrl = data.Profile.ProfileImageUrl.startsWith('http') 
                    ? data.Profile.ProfileImageUrl 
                    : `${window.location.origin}${data.Profile.ProfileImageUrl}`;
                document.getElementById('profileImagePreview').src = imageUrl;
            }
        }
    } catch (error) {
        console.error('Error loading profile image:', error);
    }
}

// Handle image file selection
document.getElementById('profileImageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (!file) {
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showMessage('error', 'Chỉ chấp nhận file ảnh JPG, PNG, GIF');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Kích thước file không được vượt quá 5MB');
        return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('profileImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Store file and show upload button
    selectedImageFile = file;
    document.getElementById('uploadImageBtn').style.display = 'inline-block';
});

// Upload profile image
document.getElementById('uploadImageBtn').addEventListener('click', async function() {
    if (!selectedImageFile) {
        showMessage('error', 'Vui lòng chọn file ảnh');
        return;
    }

    const uploadBtn = this;
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv.querySelector('.progress-bar');

    try {
        // Show progress
        uploadBtn.disabled = true;
        progressDiv.style.display = 'block';

        // Create FormData
        const formData = new FormData();
        formData.append('image', selectedImageFile);

        // Simulate progress (since FormData upload doesn't provide progress natively in simple fetch)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressBar.style.width = progress + '%';
            }
        }, 100);

        // Upload image
        const response = await fetch(`${API_BASE_URL}/doctorprofile/profile-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        clearInterval(progressInterval);
        progressBar.style.width = '100%';

        if (response.ok) {
            const result = await response.json();
            showMessage('success', result.message || 'Upload ảnh thành công');
            
            // Update profile image
            if (result.imageUrl) {
                const imageUrl = result.imageUrl.startsWith('http') 
                    ? result.imageUrl 
                    : `${window.location.origin}${result.imageUrl}`;
                document.getElementById('profileImagePreview').src = imageUrl;
            }

            // Reset
            selectedImageFile = null;
            uploadBtn.style.display = 'none';
            document.getElementById('profileImageInput').value = '';

            // Hide progress after delay
            setTimeout(() => {
                progressDiv.style.display = 'none';
                progressBar.style.width = '0%';
            }, 1500);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Upload thất bại');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showMessage('error', error.message || 'Có lỗi xảy ra khi upload ảnh');
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';
    } finally {
        uploadBtn.disabled = false;
    }
});

// Click on image container to trigger file input
document.querySelector('.profile-image-container').addEventListener('click', function() {
    document.getElementById('profileImageInput').click();
});
```

#### Bước 4: Gọi loadProfileImage() trong DOMContentLoaded

```javascript
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadDoctorProfile();
    loadProfileImage(); // ADD THIS LINE
});
```

---

## 🎯 Phần 2: Thêm Upload Ảnh vào Admin Dashboard

### File: `Web/HealthySystem-Frontend/admin-dashboard.html`

Vì file này rất dài (1774 dòng), tôi hướng dẫn các vị trí cần sửa:

### A. Form Tạo Bác Sĩ/Nhân Viên

#### Tìm section: "Tạo tài khoản mới" (khoảng dòng 400-500)

**Thêm field upload ảnh sau trường Số điện thoại:**

```html
<!-- Profile Image -->
<div class="mb-3">
    <label class="form-label">
        <i class="bi bi-image"></i> Ảnh đại diện
    </label>
    <input type="file" 
           class="form-control" 
           id="staffProfileImage" 
           accept="image/jpeg,image/jpg,image/png,image/gif">
    <small class="text-muted">Tối đa 5MB. Định dạng: JPG, PNG, GIF</small>
    
    <!-- Image Preview -->
    <div id="staffImagePreview" style="display: none; margin-top: 10px;">
        <img id="staffImagePreviewImg" 
             style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid #dee2e6;">
    </div>
</div>
```

**Thêm JavaScript xử lý preview ảnh:**

```javascript
// Image preview for staff creation
document.getElementById('staffProfileImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('staffImagePreviewImg').src = event.target.result;
            document.getElementById('staffImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('staffImagePreview').style.display = 'none';
    }
});
```

**Cập nhật function createStaffAccount() để upload ảnh:**

```javascript
async function createStaffAccount() {
    // ... existing validation code ...

    try {
        // Step 1: Create staff account
        const response = await fetch(`${API_BASE_URL}/admin/users/create-staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData)
        });

        if (response.ok) {
            const result = await response.json();
            const userId = result.data.userId;

            // Step 2: Upload profile image if selected
            const imageFile = document.getElementById('staffProfileImage').files[0];
            if (imageFile) {
                await uploadStaffProfileImage(userId, imageFile);
            }

            showMessage('success', result.message);
            // ... reset form ...
            loadStaffAccounts(); // Reload list
        }
    } catch (error) {
        // ... error handling ...
    }
}

async function uploadStaffProfileImage(userId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/profile-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            console.error('Failed to upload profile image');
        }
    } catch (error) {
        console.error('Error uploading profile image:', error);
    }
}
```

### B. Form Quản Lý Tin Tức Y Tế

#### Tìm section: Tab "Tin tức y tế" (khoảng dòng 800-1000)

**Form tạo/sửa health news đã có trường image_url. Chỉ cần thêm preview:**

```html
<!-- Image URL with Preview -->
<div class="mb-3">
    <label class="form-label">URL Hình ảnh *</label>
    <input type="url" 
           class="form-control" 
           id="healthNewsImageUrl" 
           placeholder="https://example.com/image.jpg"
           required>
    
    <!-- Image Preview -->
    <div id="newsImagePreview" style="display: none; margin-top: 10px;">
        <img id="newsImagePreviewImg" 
             style="max-width: 100%; max-height: 300px; border-radius: 8px;">
    </div>
    
    <small class="text-muted">
        Nhập URL hình ảnh hoặc 
        <a href="#" onclick="uploadNewsImage(); return false;">upload file</a>
    </small>
</div>

<!-- Hidden file input -->
<input type="file" 
       id="newsImageFileInput" 
       accept="image/*" 
       style="display: none;">
```

**JavaScript cho image preview và upload:**

```javascript
// Preview image URL
document.getElementById('healthNewsImageUrl').addEventListener('input', function(e) {
    const url = e.target.value;
    if (url) {
        const img = document.getElementById('newsImagePreviewImg');
        img.src = url;
        img.onerror = function() {
            document.getElementById('newsImagePreview').style.display = 'none';
        };
        img.onload = function() {
            document.getElementById('newsImagePreview').style.display = 'block';
        };
    } else {
        document.getElementById('newsImagePreview').style.display = 'none';
    }
});

// Upload news image (optional feature)
function uploadNewsImage() {
    document.getElementById('newsImageFileInput').click();
}

document.getElementById('newsImageFileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // For now, just show preview. In production, upload to server
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('healthNewsImageUrl').value = event.target.result;
        document.getElementById('newsImagePreviewImg').src = event.target.result;
        document.getElementById('newsImagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
    
    // TODO: Implement actual server upload if needed
    // For Sprint 11, using URL input is sufficient
});
```

---

## 📊 Phần 3: Cập Nhật Hiển Thị Ảnh Trong Danh Sách

### Admin Dashboard - Danh sách nhân viên

**Tìm function renderStaffAccounts() và cập nhật để hiển thị ảnh:**

```javascript
function renderStaffAccounts(accounts) {
    const tbody = document.getElementById('staffAccountsTableBody');
    tbody.innerHTML = '';

    accounts.forEach(account => {
        const imageUrl = account.profileImageUrl || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName)}&background=random`;
        
        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${imageUrl}" 
                             alt="${account.fullName}"
                             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 10px;"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName)}'">
                        <div>
                            <div class="fw-bold">${account.fullName}</div>
                            <small class="text-muted">${account.email}</small>
                        </div>
                    </div>
                </td>
                <td>${account.phone || 'N/A'}</td>
                <td><span class="badge bg-${account.role === 'doctor' ? 'primary' : 'info'}">${account.role}</span></td>
                <td>${account.createdAt || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editStaff(${account.userId})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${account.userId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
```

---

## 🔧 Phần 4: Testing Checklist

### Backend API Testing (sử dụng Thunder Client/Postman)

- [ ] **POST /api/doctorprofile/profile-image**
  - Headers: `Authorization: Bearer {doctor_token}`
  - Body: form-data với key `image`, chọn file ảnh
  - Expected: Status 200, trả về `imageUrl`

- [ ] **POST /api/admin/users/{userId}/profile-image**
  - Headers: `Authorization: Bearer {admin_token}`
  - Body: form-data với key `image`, chọn file ảnh
  - Expected: Status 200, trả về `imageUrl`

- [ ] **GET /api/doctorprofile**
  - Kiểm tra response có chứa `Profile.ProfileImageUrl`

### Frontend Testing

#### Doctor Profile Edit Page
- [ ] Load trang, ảnh placeholder hiển thị
- [ ] Click chọn ảnh, preview hiển thị đúng
- [ ] Upload ảnh, progress bar hoạt động
- [ ] Upload thành công, message hiển thị
- [ ] Reload trang, ảnh mới được load

#### Admin Dashboard
- [ ] Tab Quản lý tài khoản
  - [ ] Form tạo nhân viên có field upload ảnh
  - [ ] Chọn ảnh hiển thị preview
  - [ ] Tạo account + upload ảnh thành công
  - [ ] Danh sách nhân viên hiển thị ảnh đại diện

- [ ] Tab Tin tức y tế
  - [ ] Form có field Image URL
  - [ ] Nhập URL hiển thị preview
  - [ ] Tạo tin tức với ảnh thành công

#### Public Pages
- [ ] `service-prices.html` load và hiển thị đúng
- [ ] `health-news.html` hiển thị danh sách tin tức với ảnh
- [ ] Pagination hoạt động
- [ ] Click vào tin tức → chuyển sang detail page
- [ ] `health-news-detail.html` hiển thị đầy đủ content và ảnh
- [ ] Related news hiển thị
- [ ] Social share buttons hoạt động

### Database Testing

```sql
-- Chạy migration script
USE HealthySystem;
EXEC [path_to_script]\Add_ProfileImage_Column.sql

-- Kiểm tra cột đã được tạo
SELECT TOP 10 
    u.id, u.first_name, u.last_name, u.role,
    sp.profile_image_url
FROM users u
INNER JOIN staff_profiles sp ON u.id = sp.user_id
WHERE u.role IN ('doctor', 'reception');

-- Test upload ảnh từ frontend, sau đó kiểm tra
SELECT profile_image_url 
FROM staff_profiles 
WHERE user_id = [user_id_vừa_upload];
```

---

## 📝 Notes & Best Practices

### Security
- ✅ Validate file type (JPG, PNG, GIF only)
- ✅ Validate file size (max 5MB)
- ✅ Generate unique filename với GUID
- ✅ Store in secure directory (`wwwroot/uploads/doctors/`)
- ✅ Auto delete old image when uploading new

### Performance
- ✅ Compress images on client-side (optional, future enhancement)
- ✅ Use CDN for profile images (future enhancement)
- ✅ Lazy loading for image lists

### UX
- ✅ Image preview before upload
- ✅ Progress indicator during upload
- ✅ Success/error messages
- ✅ Fallback to UI Avatars nếu không có ảnh

### Future Enhancements
- [ ] Image cropping tool
- [ ] Multiple image upload
- [ ] Image optimization/compression
- [ ] CDN integration
- [ ] Batch upload for admin

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Console (F12) để xem error messages
2. Kiểm tra Network tab để xem API responses
3. Kiểm tra backend logs
4. Verify file permissions trên thư mục `wwwroot/uploads/doctors/`

---

**Document Version:** 1.0  
**Last Updated:** Sprint 11  
**Author:** AI Assistant
