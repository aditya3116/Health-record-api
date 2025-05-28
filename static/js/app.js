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
    const addRecordBtn = document.getElementById('addRecordBtn');
    const addRecordModal = new bootstrap.Modal(document.getElementById('addRecordModal'));

    // Initial setup
    setupLoginButton();

    // Setup Login Button
    function setupLoginButton() {
        loginBtn.textContent = 'Login';
        // Remove any existing event listeners
        loginBtn.replaceWith(loginBtn.cloneNode(true));
        // Get the fresh reference
        const freshLoginBtn = document.getElementById('loginBtn');
        // Add the login form show handler
        freshLoginBtn.addEventListener('click', showLoginForm);
    }

    // Show Login Form
    function showLoginForm() {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        dashboard.classList.add('d-none');
    }

    // Event Listeners
    registerBtn.addEventListener('click', () => {
        // Show registration form, hide others
        registerForm.classList.remove('d-none');
        loginForm.classList.add('d-none');
        dashboard.classList.add('d-none');
        
        // Reset the form
        document.getElementById('registerFormElement').reset();
        
        // Get the current selected user type
        const userType = document.getElementById('userType');
        const selectedType = userType.value;
        
        // Initialize form state based on selected type
        handleUserTypeChange(selectedType);
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

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                await checkUserType(username);
            } else {
                alert(data.detail || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    });

    // Load Available Doctors
    async function loadAvailableDoctors() {
        const selectedDoctor = document.getElementById('selectedDoctor');
        selectedDoctor.innerHTML = '<option value="">Loading available doctors...</option>';
        
        try {
            console.log('Fetching doctors...');
            const response = await fetch('/api/available-doctors/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                selectedDoctor.innerHTML = `
                    <option value="">-- Select your doctor --</option>
                    ${data.map(doctor => 
                        `<option value="${doctor.id}">Dr. ${doctor.username}</option>`
                    ).join('')}
                `;
            } else {
                // Handle specific error cases
                if (response.status === 404) {
                    selectedDoctor.innerHTML = '<option value="">No doctors available</option>';
                    const message = data.message || 'There are no registered doctors in the system. Please try again later.';
                    console.log('404 Error:', message);
                    alert(message);
                } else {
                    selectedDoctor.innerHTML = '<option value="">Error loading doctors</option>';
                    const message = data.message || 'Failed to load available doctors. Please try again.';
                    console.log('Other Error:', message);
                    alert(message);
                }
            }
        } catch (error) {
            console.error('Detailed error:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            selectedDoctor.innerHTML = '<option value="">Error loading doctors</option>';
            alert('Failed to connect to the server. Please check your connection and try again.');
        }
    }

    // Handle User Type Change
    function handleUserTypeChange(userType) {
        console.log('User type changed to:', userType);
        
        const doctorSelectionDiv = document.getElementById('doctorSelectionDiv');
        const selectedDoctor = document.getElementById('selectedDoctor');

        // Update required attribute and visibility based on user type
        if (userType === 'Doctor') {
            console.log('Hiding doctor selection');
            doctorSelectionDiv.style.display = 'none';
            selectedDoctor.required = false;
            selectedDoctor.value = '';
        } else if (userType === 'Patient') {
            console.log('Showing doctor selection');
            doctorSelectionDiv.style.display = 'block';
            selectedDoctor.required = true;
            loadAvailableDoctors(); // Load available doctors when switching to Patient
        }
    }

    // Add event listener for user type changes
    document.getElementById('userType').addEventListener('change', function() {
        handleUserTypeChange(this.value);
    });

    // Register Form Handler
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const userType = document.getElementById('userType').value;
        const selectedDoctor = document.getElementById('selectedDoctor').value;

        console.log('Form submission:', {
            userType,
            selectedDoctor,
            isPatient: userType === 'Patient'
        });

        // Validate doctor selection for patients
        if (userType === 'Patient') {
            if (!selectedDoctor) {
                alert('Please select a doctor to proceed with registration');
                return;
            }
        }

        const requestData = {
            username,
            email,
            password,
            user_type: userType.toLowerCase(),
            doctor_id: userType === 'Patient' ? selectedDoctor : null
        };

        console.log('Sending request:', requestData);

        try {
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok) {
                let successMessage = 'Registration successful!';
                if (userType === 'Patient' && data.doctor) {
                    successMessage += ` You have been registered under Dr. ${data.doctor}.`;
                }
                alert(successMessage);
                loginBtn.click();
            } else {
                const errorMessage = data.error || data.message || Object.values(data).flat().join('\n') || 'Registration failed';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again.');
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
            alert('An error occurred while loading dashboard. Please try logging in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            loginBtn.click();
        }
    }

    // Show Dashboard Based on User Type
    function showDashboard(username, userType) {
        loginForm.classList.add('d-none');
        registerForm.classList.add('d-none');
        dashboard.classList.remove('d-none');
        userNameDisplay.textContent = userType === 'doctor' ? `Dr. ${username}` : username;

        // Update the login button to logout
        const loginButton = document.getElementById('loginBtn');
        loginButton.textContent = 'Logout';
        // Remove any existing event listeners
        loginButton.replaceWith(loginButton.cloneNode(true));
        // Get the fresh reference and add logout handler
        const freshLoginButton = document.getElementById('loginBtn');
        freshLoginButton.addEventListener('click', handleLogout);

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

    // Handle Logout
    function handleLogout() {
        // Clear the stored token
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');

        // Reset the login button and form
        setupLoginButton();
        
        // Hide dashboard and show login form
        dashboard.classList.add('d-none');
        loginForm.classList.remove('d-none');
        
        // Clear any displayed data
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
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
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">${record.title}</h5>
                            <p class="card-text">${record.description}</p>
                            <small class="text-muted">Date: ${new Date(record.date).toLocaleDateString()}</small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm view-record-btn" data-record-id="${record.id}">
                                View
                            </button>
                            <button class="btn btn-warning btn-sm edit-record-btn" data-record-id="${record.id}">
                                Edit
                            </button>
                            <button class="btn btn-danger btn-sm delete-record-btn" data-record-id="${record.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners for view buttons
        document.querySelectorAll('.view-record-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.dataset.recordId;
                viewHealthRecord(recordId);
            });
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-record-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.dataset.recordId;
                editHealthRecord(recordId);
            });
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-record-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.dataset.recordId;
                if (confirm('Are you sure you want to delete this record?')) {
                    deleteHealthRecord(recordId);
                }
            });
        });
    }

    // View Health Record Function
    async function viewHealthRecord(recordId) {
        try {
            const response = await fetch(`/api/health-records/${recordId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const record = await response.json();
                
                // Create and show a modal with the record details
                const modalHtml = `
                    <div class="modal fade" id="viewRecordModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">${record.title}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p>${record.description}</p>
                                    <small class="text-muted">Date: ${new Date(record.date).toLocaleDateString()}</small>
                                    
                                    ${record.doctor_notes && record.doctor_notes.length > 0 ? `
                                        <div class="mt-3">
                                            <h6>Doctor Notes:</h6>
                                            ${record.doctor_notes.map(note => `
                                                <div class="card bg-light mb-2">
                                                    <div class="card-body py-2">
                                                        <p class="card-text mb-1">${note.note}</p>
                                                        <small class="text-muted">By Dr. ${note.doctor_name} - ${new Date(note.date).toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : '<p class="text-muted mt-3">No doctor notes available.</p>'}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing modal if any
                const existingModal = document.getElementById('viewRecordModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add the modal to the document
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Show the modal
                const viewModal = new bootstrap.Modal(document.getElementById('viewRecordModal'));
                viewModal.show();
            } else {
                throw new Error('Failed to fetch record details');
            }
        } catch (error) {
            console.error('Error viewing record:', error);
            alert('Failed to view record. Please try again.');
        }
    }

    // Edit Health Record Function
    async function editHealthRecord(recordId) {
        try {
            const response = await fetch(`/api/health-records/${recordId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const record = await response.json();
                
                // Update modal title
                document.querySelector('#addRecordModal .modal-title').textContent = 'Edit Health Record';
                
                // Populate the modal with record data
                document.getElementById('recordTitle').value = record.title;
                document.getElementById('recordDescription').value = record.description;
                
                // Update the form submission handler
                const form = document.getElementById('addRecordForm');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    await updateRecord(recordId);
                };
                
                // Show the modal
                addRecordModal.show();
            } else {
                throw new Error('Failed to fetch record details');
            }
        } catch (error) {
            console.error('Error editing record:', error);
            alert('Failed to edit record. Please try again.');
        }
    }

    // Update Record Function
    async function updateRecord(recordId) {
        const title = document.getElementById('recordTitle').value;
        const description = document.getElementById('recordDescription').value;

        try {
            const response = await fetch(`/api/health-records/${recordId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    title,
                    description
                }),
            });

            if (response.ok) {
                addRecordModal.hide();
                document.getElementById('addRecordForm').reset();
                // Reset modal title back to Add
                document.querySelector('#addRecordModal .modal-title').textContent = 'Add New Health Record';
                loadHealthRecords(); // Reload the records list
                alert('Health record updated successfully!');
            } else {
                throw new Error('Failed to update record');
            }
        } catch (error) {
            console.error('Error updating record:', error);
            alert('Failed to update record. Please try again.');
        }
    }

    // Delete Health Record Function
    async function deleteHealthRecord(recordId) {
        try {
            const response = await fetch(`/api/health-records/${recordId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                loadHealthRecords(); // Reload the records list
                alert('Health record deleted successfully!');
            } else {
                throw new Error('Failed to delete record');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Failed to delete record. Please try again.');
        }
    }

    // View Patient Records Function
    async function viewPatientRecords(patientId) {
        try {
            const response = await fetch(`/api/patient-records/${patientId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const records = await response.json();
                const container = document.getElementById('patientsList');
                
                if (records.length === 0) {
                    container.innerHTML = `
                        <div>
                            <button class="btn btn-secondary mb-3" id="backToPatients">← Back to Patients List</button>
                            <div class="alert alert-info">
                                <h4>No Records Found</h4>
                                <p>This patient has no health records yet.</p>
                            </div>
                        </div>
                    `;
                } else {
                    // Create records display
                    const recordsHtml = records.map(record => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h4 class="card-title">${record.title}</h4>
                                <p class="card-text">${record.description}</p>
                                <small class="text-muted">Date: ${new Date(record.date).toLocaleDateString()}</small>
                                
                                <div class="mt-3">
                                    <button class="btn btn-primary btn-sm view-notes-btn" data-record-id="${record.id}">
                                        View Notes
                                    </button>
                                    <button class="btn btn-success btn-sm add-note-btn" data-record-id="${record.id}">
                                        Add Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    // Update the view with records
                    container.innerHTML = `
                        <button class="btn btn-secondary mb-3" id="backToPatients">← Back to Patients List</button>
                        <div class="patient-records">
                            ${recordsHtml}
                        </div>
                    `;
                }

                // Add event listeners for the note buttons
                document.querySelectorAll('.view-notes-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const recordId = button.dataset.recordId;
                        viewDoctorNotes(recordId);
                    });
                });

                document.querySelectorAll('.add-note-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const recordId = button.dataset.recordId;
                        addDoctorNote(recordId);
                    });
                });

                // Add event listener to the back button
                document.getElementById('backToPatients').addEventListener('click', () => {
                    loadPatients();
                });
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to load patient records');
            }
        } catch (error) {
            console.error('Error viewing patient records:', error);
            document.getElementById('patientsList').innerHTML = `
                <div>
                    <button class="btn btn-secondary mb-3" id="backToPatients">← Back to Patients List</button>
                    <div class="alert alert-danger">
                        <h4>Error</h4>
                        <p>${error.message || 'Failed to load patient records. Please try again.'}</p>
                    </div>
                </div>
            `;
            // Add event listener to the back button in error state
            document.getElementById('backToPatients').addEventListener('click', () => {
                loadPatients();
            });
        }
    }

    // Global functions for doctor notes
    async function viewDoctorNotes(recordId) {
        try {
            const response = await fetch(`/api/health-records/${recordId}/notes/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const notes = await response.json();
                
                // Create modal HTML
                const modalHtml = `
                    <div class="modal fade" id="viewNotesModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Doctor Notes</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    ${notes.length > 0 ? notes.map(note => `
                                        <div class="card mb-2">
                                            <div class="card-body">
                                                <p class="card-text">${note.note}</p>
                                                <small class="text-muted">Date: ${new Date(note.date).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                    `).join('') : '<p>No notes available.</p>'}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing modal if any
                const existingModal = document.getElementById('viewNotesModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add modal to document
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Show modal
                const notesModal = new bootstrap.Modal(document.getElementById('viewNotesModal'));
                notesModal.show();
            } else {
                throw new Error('Failed to fetch doctor notes');
            }
        } catch (error) {
            console.error('Error viewing doctor notes:', error);
            alert('Failed to load doctor notes. Please try again.');
        }
    }

    async function addDoctorNote(recordId) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="addNoteModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Doctor Note</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addNoteForm">
                                <div class="mb-3">
                                    <label for="noteContent" class="form-label">Note</label>
                                    <textarea class="form-control" id="noteContent" rows="3" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Save Note</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addNoteModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const noteModal = new bootstrap.Modal(document.getElementById('addNoteModal'));
        noteModal.show();

        // Handle form submission
        document.getElementById('addNoteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('noteContent').value;

            try {
                const response = await fetch(`/api/health-records/${recordId}/notes/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        note: content
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    noteModal.hide();
                    alert('Note added successfully!');
                    // Refresh the notes view
                    viewDoctorNotes(recordId);
                } else {
                    throw new Error(data.error || 'Failed to add note');
                }
            } catch (error) {
                console.error('Error adding note:', error);
                alert(error.message || 'Failed to add note. Please try again.');
            }
        });
    }

    // Add Record Button Handler
    addRecordBtn.addEventListener('click', () => {
        addRecordModal.show();
    });

    // Add Record Form Handler
    document.getElementById('addRecordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('recordTitle').value;
        const description = document.getElementById('recordDescription').value;

        try {
            const response = await fetch('/api/health-records/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    title,
                    description
                }),
            });

            if (response.ok) {
                addRecordModal.hide();
                document.getElementById('addRecordForm').reset();
                loadHealthRecords(); // Reload the records list
                alert('Health record added successfully!');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to add health record');
            }
        } catch (error) {
            console.error('Error adding health record:', error);
            alert('An error occurred while adding the health record');
        }
    });

    // Make loadPatients function globally accessible
    async function loadPatients() {
        try {
            const response = await fetch('/api/doctors/patients/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const patients = await response.json();
                if (patients.length === 0) {
                    document.getElementById('patientsList').innerHTML = `
                        <div class="alert alert-info">
                            <h4>No Patients Found</h4>
                            <p>You currently have no patients assigned to you.</p>
                        </div>
                    `;
                } else {
                    displayPatients(patients);
                }
            } else {
                throw new Error('Failed to load patients');
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            document.getElementById('patientsList').innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error</h4>
                    <p>Failed to load patients. Please try again later.</p>
                </div>
            `;
        }
    }

    // Make displayPatients function globally accessible
    function displayPatients(patients) {
        const container = document.getElementById('patientsList');
        container.innerHTML = `
            ${patients.map(patient => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${patient.user ? patient.user.username : patient.username}</h5>
                        <button class="btn btn-primary btn-sm view-records-btn" data-patient-id="${patient.id}">
                            View Health Records
                        </button>
                    </div>
                </div>
            `).join('')}
        `;

        // Add event listeners to all View Records buttons
        document.querySelectorAll('.view-records-btn').forEach(button => {
            button.addEventListener('click', () => {
                const patientId = button.dataset.patientId;
                viewPatientRecords(patientId);
            });
        });
    }
}); 