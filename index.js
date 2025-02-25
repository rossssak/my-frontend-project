const API_URL = 'http://localhost:3000';
let pieChart = null;

// Navigation Functions
function showRegisterPage() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.remove('hidden');
}

function showLoginPage() {
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
}

function showMainPage() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainPage').classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('token');
    showLoginPage();
}

// Authentication helper function
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginPage();
        return null;
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            localStorage.removeItem('token');
            showLoginPage();
            return null;
        }
        return response;
    } catch (error) {
        console.error('Request error:', error);
        throw error;
    }
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMainPage();
            await loadTableData();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        Swal.fire('Error', 'รหัสผ่านไม่ตรงกัน', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire('Success', 'สมัครสมาชิกสำเร็จ', 'success').then(() => {
                showLoginPage();
            });
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการสมัครสมาชิก', 'error');
    }
});

// เพิ่มฟังก์ชันโหลดข้อมูลพยาบาล
async function loadNursesData() {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/nurses`);
        if (!response) return;

        const data = await response.json();
        updateNursesTable(data);
    } catch (error) {
        console.error('Error loading nurses data:', error);
        Swal.fire('Error', 'Failed to load nurses data', 'error');
    }
}

// เพิ่มฟังก์ชันอัพเดตตารางพยาบาล
function updateNursesTable(data) {
    const tbody = document.querySelector('#nursesTable tbody');
    tbody.innerHTML = '';
    
    // เพิ่มการเรียงข้อมูลตาม id จากน้อยไปมาก
    const sortedData = data.sort((a, b) => a.id - b.id);
    
    sortedData.forEach(nurse => {
        const row = `
            <tr>
                <td>${nurse.id}</td>
                <td>${nurse.first_name || '-'}</td>
                <td>${nurse.last_name || '-'}</td>
                <td>${nurse.specialization || '-'}</td>
                <td>${nurse.experience_years || '-'}</td>
                <td>${nurse.certification || '-'}</td>
                <td>${nurse.department || '-'}</td>
                <td>${nurse.created_at || '-'}</td>
                <td>${nurse.updated_at || '-'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Load table data
async function loadTableData() {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/slist`);
        if (!response) return;

        const data = await response.json();
        updateTable(data);
        if (!pieChart) {
            createPieChart();
        }
        updatePieChart(data);
        
        // เพิ่มการโหลดข้อมูลพยาบาล
        await loadNursesData();
    } catch (error) {
        console.error('Error loading data:', error);
        Swal.fire('Error', 'Failed to load data', 'error');
    }
}

// Create pie chart
function createPieChart() {
    const ctx = document.getElementById('targetPieChart');
    if (!ctx) return;

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['ไม่มีความเสี่ยง', 'มีความเสี่ยง'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#3498DB', '#E74C3C'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update pie chart data
function updatePieChart(data) {
    if (!pieChart) return;
    
    const targetCounts = data.reduce((acc, item) => {
        acc[item.target] = (acc[item.target] || 0) + 1;
        return acc;
    }, {});
    
    pieChart.data.datasets[0].data = [
        targetCounts['1'] || 0,
        targetCounts['2'] || 0
    ];
    
    pieChart.update();
}

// Update table with data
function updateTable(data) {
    const tbody = document.querySelector('#mytable tbody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = `
            <tr>
                <td>${item.id}</td>
                <td>${item.age}</td>
                <td>${item.sex}</td>
                <td>${item['Chest pain type'] || 'undefined'}</td>
                <td>${item.trestbps}</td>
                <td>${item.cholesterol}</td>
                <td>${item['fasting blood sugar'] || 'undefined'}</td>
                <td>${item['resting ecg'] || 'undefined'}</td>
                <td>${item['max heart rate'] || 'undefined'}</td>
                <td>${item['exercise angina'] || 'undefined'}</td>
                <td>${item.oldpeak}</td>
                <td>${item['ST slope'] || 'undefined'}</td>
                <td>${item.target}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="showEditBox(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Search functionality
document.getElementById('searchBtn').addEventListener('click', async () => {
    const age = document.getElementById('searchInput').value;
    if (!age) {
        loadTableData();
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/api/search?age=${age}`);
        if (response) {
            const data = await response.json();
            updateTable(data);
        }
    } catch (error) {
        console.error('Error searching:', error);
        Swal.fire('Error', 'Search failed', 'error');
    }
});

// Create new record
function showCreateBox() {
    Swal.fire({
        title: 'เพิ่มข้อมูลใหม่',
        html: `
            <input id="age" class="swal2-input" placeholder="อายุ" type="number">
            <input id="sex" class="swal2-input" placeholder="เพศ" type="number">
            <input id="chestPainType" class="swal2-input" placeholder="ประเภทอาการเจ็บหน้าอก">
            <input id="trestbps" class="swal2-input" placeholder="ความดันโลหิต" type="number">
            <input id="cholesterol" class="swal2-input" placeholder="คอเลสเตอรอล" type="number">
            <input id="fastingBS" class="swal2-input" placeholder="น้ำตาลในเลือด">
            <input id="restingECG" class="swal2-input" placeholder="การตรวจ ECG">
            <input id="maxHR" class="swal2-input" placeholder="อัตราการเต้นของหัวใจสูงสุด" type="number">
            <input id="exerciseAngina" class="swal2-input" placeholder="อาการแอ้งอินา">
            <input id="oldpeak" class="swal2-input" placeholder="Oldpeak" type="number">
            <input id="stSlope" class="swal2-input" placeholder="ST slope">
            <input id="target" class="swal2-input" placeholder="เป้าหมาย" type="number">
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const newData = {
                age: document.getElementById('age').value,
                sex: document.getElementById('sex').value,
                "Chest pain type": document.getElementById('chestPainType').value,
                trestbps: document.getElementById('trestbps').value,
                cholesterol: document.getElementById('cholesterol').value,
                "fasting blood sugar": document.getElementById('fastingBS').value,
                "resting ecg": document.getElementById('restingECG').value,
                "max heart rate": document.getElementById('maxHR').value,
                "exercise angina": document.getElementById('exerciseAngina').value,
                oldpeak: document.getElementById('oldpeak').value,
                "ST slope": document.getElementById('stSlope').value,
                target: document.getElementById('target').value
            };
            return createRecord(newData);
        }
    });
}

// Create record API call
async function createRecord(data) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/slist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            await Swal.fire('สำเร็จ', 'เพิ่มข้อมูลเรียบร้อยแล้ว', 'success');
            await loadTableData();
        } else {
            throw new Error('Failed to create record');
        }
    } catch (error) {
        console.error('Error creating record:', error);
        Swal.fire('Error', 'Failed to create record', 'error');
    }
}

// Show edit box
async function showEditBox(id) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/slist/${id}`);
        if (!response) return;
        
        const data = await response.json();
        
        Swal.fire({
            title: 'แก้ไขข้อมูล',
            html: `
                <input id="age" class="swal2-input" placeholder="อายุ" type="number" value="${data.age}">
                <input id="sex" class="swal2-input" placeholder="เพศ" type="number" value="${data.sex}">
                <input id="chestPainType" class="swal2-input" placeholder="ประเภทอาการเจ็บหน้าอก" value="${data['Chest pain type'] || ''}">
                <input id="trestbps" class="swal2-input" placeholder="ความดันโลหิต" type="number" value="${data.trestbps}">
                <input id="cholesterol" class="swal2-input" placeholder="คอเลสเตอรอล" type="number" value="${data.cholesterol}">
                <input id="fastingBS" class="swal2-input" placeholder="น้ำตาลในเลือด" value="${data['fasting blood sugar'] || ''}">
                <input id="restingECG" class="swal2-input" placeholder="การตรวจ ECG" value="${data['resting ecg'] || ''}">
                <input id="maxHR" class="swal2-input" placeholder="อัตราการเต้นของหัวใจสูงสุด" type="number" value="${data['max heart rate'] || ''}">
                <input id="exerciseAngina" class="swal2-input" placeholder="อาการแอ้งอินา" value="${data['exercise angina'] || ''}">
                <input id="oldpeak" class="swal2-input" placeholder="Oldpeak" type="number" value="${data.oldpeak}">
                <input id="stSlope" class="swal2-input" placeholder="ST slope" value="${data['ST slope'] || ''}">
                <input id="target" class="swal2-input" placeholder="เป้าหมาย" type="number" value="${data.target}">
            `,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const updatedData = {
                    age: document.getElementById('age').value,
                    sex: document.getElementById('sex').value,
                    "Chest pain type": document.getElementById('chestPainType').value,
                    trestbps: document.getElementById('trestbps').value,
                    cholesterol: document.getElementById('cholesterol').value,
                    "fasting blood sugar": document.getElementById('fastingBS').value,
                    "resting ecg": document.getElementById('restingECG').value,
                    "max heart rate": document.getElementById('maxHR').value,
                    "exercise angina": document.getElementById('exerciseAngina').value,
                    oldpeak: document.getElementById('oldpeak').value,
                    "ST slope": document.getElementById('stSlope').value,
                    target: document.getElementById('target').value
                };
                return updateRecord(id, updatedData);
            }
        });
    } catch (error) {
        console.error('Error loading record:', error);
        Swal.fire('Error', 'Failed to load record', 'error');
    }
}

// Update record API call
async function updateRecord(id, data) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/slist/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            await Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
            await loadTableData();
            return true;
        } else {
            throw new Error('Failed to update record');
        }
    } catch (error) {
        console.error('Error updating record:', error);
        Swal.fire('Error', 'Failed to update record', 'error');
        return false;
    }
}

// Delete record
async function deleteRecord(id) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ',
        text: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/slist/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                await Swal.fire('สำเร็จ', 'ลบข้อมูลเรียบร้อยแล้ว', 'success');
                await loadTableData();
            } else {
                throw new Error('Failed to delete record');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            Swal.fire('Error', 'Failed to delete record', 'error');
        }
    }
}

// Pie chart functions remain the same
function createPieChart() {
    const ctx = document.getElementById('targetPieChart');
    if (!ctx) return;

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['ไม่มีความเสี่ยง', 'มีความเสี่ยง'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#3498DB', '#E74C3C'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updatePieChart(data) {
    if (!pieChart) {
        createPieChart();
    }
    
    const targetCounts = data.reduce((acc, item) => {
        acc[item.target] = (acc[item.target] || 0) + 1;
        return acc;
    }, {});
    
    pieChart.data.datasets[0].data = [
        targetCounts['1'] || 0,
        targetCounts['2'] || 0
    ];
    
    pieChart.update();
}

// Check token and load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showMainPage();
        loadTableData();
    } else {
        showLoginPage();
    }
});