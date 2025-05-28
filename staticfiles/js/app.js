document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const dashboard = document.getElementById('dashboard');
    const patientDashboard = document.getElementById('patientDashboard');
    const doctorDashboard = document.getElementById('doctorDashboard');
    const userNameDisplay = document.getElementById('userNameDisplay');

    // Event Listeners
    loginBtn.addEventListener('click', () => {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        dashboard.classList.add('d-none');
    });

    registerBtn.addEventListener('click', () => {
        registerForm.classList.remove('d-none');
        loginForm.classList.add('d-none');
        dashboard.classList.add('d-none');
    });

    // Login Form Handler
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/token/', {
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
                await checkUserType(username);
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });

    // Register Form Handler
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const userType = document.getElementById('userType').value;

        try {
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    user_type: userType,
                }),
            });

            if (response.ok) {
                alert('Registration successful! Please login.');
                loginBtn.click();
            } else {
                const data = await response.json();
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });

    // Check User Type and Show Appropriate Dashboard
    async function checkUserType(username) {
        try {
            const response = await fetch('/api/user-type/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                showDashboard(username, data.user_type);
            } else {
                throw new Error('Failed to get user type');
            }
        } catch (error) {
            console.error('Error checking user type:', error);
            alert('An error occurred while loading dashboard');
        }
    }

    // Show Dashboard Based on User Type
    function showDashboard(username, userType) {
        loginForm.classList.add('d-none');
        registerForm.classList.add('d-none');
        dashboard.classList.remove('d-none');
        userNameDisplay.textContent = username;

        if (userType === 'patient') {
            patientDashboard.classList.remove('d-none');
            doctorDashboard.classList.add('d-none');
            loadHealthRecords();
        } else if (userType === 'doctor') {
            doctorDashboard.classList.remove('d-none');
            patientDashboard.classList.add('d-none');
            loadPatients();
        }
    }

    // Load Health Records for Patient
    async function loadHealthRecords() {
        try {
            const response = await fetch('/api/health-records/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const records = await response.json();
                displayHealthRecords(records);
            } else {
                throw new Error('Failed to load health records');
            }
        } catch (error) {
            console.error('Error loading health records:', error);
            alert('Failed to load health records');
        }
    }

    // Display Health Records
    function displayHealthRecords(records) {
        const container = document.getElementById('healthRecordsList');
        container.innerHTML = records.map(record => `
            <div class="health-record">
                <h4>${record.title}</h4>
                <p>${record.description}</p>
                <small>Date: ${new Date(record.date).toLocaleDateString()}</small>
            </div>
        `).join('');
    }

    // Load Patients for Doctor
    async function loadPatients() {
        try {
            const response = await fetch('/api/patients/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const patients = await response.json();
                displayPatients(patients);
            } else {
                throw new Error('Failed to load patients');
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            alert('Failed to load patients');
        }
    }

    // Display Patients
    function displayPatients(patients) {
        const container = document.getElementById('patientsList');
        container.innerHTML = patients.map(patient => `
            <div class="patient-item">
                <h4>${patient.username}</h4>
                <p>Email: ${patient.email}</p>
                <button class="btn btn-primary btn-sm" onclick="viewPatientRecords(${patient.id})">
                    View Records
                </button>
            </div>
        `).join('');
    }

    // Add New Health Record
    document.getElementById('addRecordBtn')?.addEventListener('click', () => {
        // Implement add record functionality
        alert('Add record functionality to be implemented');
    });
}); 