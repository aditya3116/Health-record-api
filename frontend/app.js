// API URL
const API_URL = 'http://localhost:8000/api';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const dashboard = document.getElementById('dashboard');
const patientDashboard = document.getElementById('patientDashboard');
const doctorDashboard = document.getElementById('doctorDashboard');
const userNameDisplay = document.getElementById('userNameDisplay');

// Event Listeners
loginBtn.addEventListener('click', showLoginForm);
registerBtn.addEventListener('click', showRegisterForm);
document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
document.getElementById('addRecordBtn')?.addEventListener('click', showAddRecordForm);

// Show/Hide Functions
function showLoginForm() {
    loginForm.classList.remove('d-none');
    registerForm.classList.add('d-none');
    dashboard.classList.add('d-none');
}

function showRegisterForm() {
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
    dashboard.classList.add('d-none');
}

function showDashboard(userType) {
    loginForm.classList.add('d-none');
    registerForm.classList.add('d-none');
    dashboard.classList.remove('d-none');
    
    if (userType === 'patient') {
        patientDashboard.classList.remove('d-none');
        doctorDashboard.classList.add('d-none');
        loadHealthRecords();
    } else {
        patientDashboard.classList.add('d-none');
        doctorDashboard.classList.remove('d-none');
        loadPatients();
    }
}

// API Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // Get user type and show appropriate dashboard
            const userType = await getUserType();
            userNameDisplay.textContent = username;
            showDashboard(userType);
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const userType = document.getElementById('userType').value;

    try {
        const response = await fetch(`${API_URL}/${userType}s/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: {
                    username,
                    email,
                    password,
                },
                // Add additional fields based on user type
                ...(userType === 'doctor' ? {
                    specialization: 'General',
                    license_number: 'TBD',
                    contact_number: '',
                } : {
                    date_of_birth: new Date().toISOString().split('T')[0],
                    blood_group: 'A+',
                    contact_number: '',
                    address: '',
                })
            }),
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            showLoginForm();
        } else {
            const data = await response.json();
            alert(data.detail || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error during registration');
    }
}

async function getUserType() {
    try {
        // Try to get patient profile
        const patientResponse = await fetch(`${API_URL}/patients/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (patientResponse.ok) return 'patient';

        // Try to get doctor profile
        const doctorResponse = await fetch(`${API_URL}/doctors/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (doctorResponse.ok) return 'doctor';

        return null;
    } catch (error) {
        console.error('Error getting user type:', error);
        return null;
    }
}

async function loadHealthRecords() {
    try {
        const response = await fetch(`${API_URL}/health-records/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            const records = await response.json();
            const recordsList = document.getElementById('healthRecordsList');
            recordsList.innerHTML = records.map(record => `
                <div class="health-record-item">
                    <h4>${record.title}</h4>
                    <p>${record.description}</p>
                    <small>Created: ${new Date(record.date_created).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading health records:', error);
    }
}

async function loadPatients() {
    try {
        const response = await fetch(`${API_URL}/doctors/patients/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            const patients = await response.json();
            const patientsList = document.getElementById('patientsList');
            patientsList.innerHTML = patients.map(patient => `
                <div class="patient-item">
                    <div>
                        <h4>${patient.user.first_name} ${patient.user.last_name}</h4>
                        <p>Email: ${patient.user.email}</p>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="viewPatientRecords(${patient.id})">
                        View Records
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Check if user is already logged in
const token = localStorage.getItem('token');
if (token) {
    getUserType().then(userType => {
        if (userType) {
            const username = localStorage.getItem('username');
            userNameDisplay.textContent = username;
            showDashboard(userType);
        }
    });
} 