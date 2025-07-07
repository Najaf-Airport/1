// NajafFlightsApp/js/script.js

// Function to safely parse JSON from localStorage
function getStoredItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error parsing localStorage item ${key}:`, e);
        return null;
    }
}

// Function to safely set JSON to localStorage
function setStoredItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error setting localStorage item ${key}:`, e);
    }
}

// Function to safely remove item from localStorage
function removeStoredItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Error removing localStorage item ${key}:`, e);
    }
}

// Global variable to store current user and flight data
let currentUser = getStoredItem('currentUser'); // Load from localStorage
let flights = getStoredItem('flights') || []; // Load from localStorage
let users = getStoredItem('users') || {}; // Load from localStorage

// UI Elements (assuming these are already defined in your flights.html)
const loginView = document.getElementById('loginView');
const mainAppView = document.getElementById('mainAppView');
const loginForm = document.getElementById('loginForm');
const flightForm = document.getElementById('flightForm');
const adminForm = document.getElementById('adminForm');
const flightsTableBody = document.getElementById('flightsTableBody');
const adminFlightsTableBody = document.getElementById('adminFlightsTableBody');
const adminUsersList = document.getElementById('adminUsersList');
const loginMessage = document.getElementById('loginMessage');
const flightMessage = document.getElementById('flightMessage');
const adminMessage = document.getElementById('adminMessage');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const adminViewBtn = document.getElementById('adminViewBtn');
const returnToFlightsBtn = document.getElementById('returnToFlightsBtn');
const exportMonthlyBtn = document.getElementById('exportMonthlyBtn');
const exportDailyBtn = document.getElementById('exportDailyBtn');
const exportDateInput = document.getElementById('exportDateInput');

// DOM elements for admin filters
const adminMonthFilter = document.getElementById('adminMonthFilter');
const adminUserFilter = document.getElementById('adminUserFilter');
const exportAdminStatsBtn = document.getElementById('exportAdminStatsBtn');
const exportAdminAllFlightsBtn = document.getElementById('exportAdminAllFlightsBtn');
const adminUserEmailInput = document.getElementById('adminUserEmail');
const adminUserNameInput = document.getElementById('adminUserName');
const adminUserPasswordInput = document.getElementById('adminUserPassword');
const adminAddUserBtn = document.getElementById('adminAddUserBtn');
const adminUsersMessage = document.getElementById('adminUsersMessage');

// *** NEW: Check authentication on app load ***
function checkAuth() {
    if (currentUser && currentUser.token && currentUser.email) {
        // Assume token validity (for a simple client-side app)
        // In a real app, you'd send the token to a server to validate.
        showAppView();
        userNameDisplay.textContent = currentUser.name || currentUser.email;
    } else {
        showLoginView();
    }
}

// Show/Hide Views
function showLoginView() {
    loginView.style.display = 'flex';
    mainAppView.style.display = 'none';
}

function showAppView() {
    loginView.style.display = 'none';
    mainAppView.style.display = 'block';
    renderFlights(); // Make sure flights are rendered when app view is shown
    updateAdminUI(); // Update admin UI in case of direct access
}

// User Authentication
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginUser(email, password);
});

async function loginUser(email, password) {
    // In a real app, you'd send these to a backend for authentication
    // For this simple app, we check against stored users
    if (users[email] && users[email].password === password) {
        // Simulate a token generation
        const token = btoa(`${email}:${password}:${Date.now()}`); // Basic Base64 encoding

        currentUser = {
            email: email,
            name: users[email].name,
            role: users[email].role,
            token: token // Store the token
        };

        setStoredItem('currentUser', currentUser); // *** Save currentUser to localStorage ***
        displayMessage(loginMessage, `مرحباً ${currentUser.name}!`, 'success');
        setTimeout(() => {
            loginForm.reset();
            hideMessage(loginMessage);
            showAppView();
            userNameDisplay.textContent = currentUser.name;
        }, 1000);
    } else {
        displayMessage(loginMessage, 'بريد إلكتروني أو كلمة مرور غير صحيحة.', 'error');
    }
}

logoutBtn.addEventListener('click', () => {
    logoutUser();
});

function logoutUser() {
    currentUser = null;
    removeStoredItem('currentUser'); // *** Remove currentUser from localStorage ***
    flights = []; // Clear flights to prevent showing previous user's data
    setStoredItem('flights', flights); // Save empty flights array
    displayMessage(loginMessage, 'تم تسجيل الخروج بنجاح.', 'success');
    setTimeout(() => {
        hideMessage(loginMessage);
        showLoginView();
    }, 500);
}

// Initialize default admin user if not exists
function initializeDefaultAdmin() {
    if (!users['admin@airport.com']) {
        users['admin@airport.com'] = {
            name: 'المسؤول',
            password: 'admin', // In a real app, hash this password!
            role: 'admin'
        };
        setStoredItem('users', users); // Save updated users to localStorage
    }
}

// Flight Management
flightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addFlight();
});

function addFlight() {
    if (!currentUser) {
        displayMessage(flightMessage, 'الرجاء تسجيل الدخول لإضافة رحلة.', 'error');
        return;
    }

    const fltNo = document.getElementById('fltNo').value;
    const onChocksTime = document.getElementById('onChocksTime').value;
    const openDoorTime = document.getElementById('openDoorTime').value;
    const startCleaningTime = document.getElementById('startCleaningTime').value;
    const completeCleaningTime = document.getElementById('completeCleaningTime').value;
    const readyBoardingTime = document.getElementById('readyBoardingTime').value;
    const startBoardingTime = document.getElementById('startBoardingTime').value;
    const completeBoardingTime = document.getElementById('completeBoardingTime').value;
    const closeDoorTime = document.getElementById('closeDoorTime').value;
    const offChocksTime = document.getElementById('offChocksTime').value;
    const notes = document.getElementById('notes').value;

    const newFlight = {
        id: Date.now(),
        userId: currentUser.email, // Link flight to user
        userName: currentUser.name,
        date: new Date().toISOString().slice(0, 10), // Current date in YYYY-MM-DD
        fltNo,
        onChocksTime,
        openDoorTime,
        startCleaningTime,
        completeCleaningTime,
        readyBoardingTime,
        startBoardingTime,
        completeBoardingTime,
        closeDoorTime,
        offChocksTime,
        notes
    };

    flights.unshift(newFlight); // Add to the beginning
    setStoredItem('flights', flights); // Save flights to localStorage
    flightForm.reset();
    renderFlights();
    displayMessage(flightMessage, 'تمت إضافة الرحلة بنجاح!', 'success');
    setTimeout(() => hideMessage(flightMessage), 3000);
}

function renderFlights() {
    flightsTableBody.innerHTML = '';
    const userFlights = flights.filter(flight => flight.userId === currentUser.email);

    if (userFlights.length === 0) {
        flightsTableBody.innerHTML = `<tr><td colspan="12" style="text-align: center;">لا توجد رحلات مسجلة.</td></tr>`;
        return;
    }

    userFlights.forEach(flight => {
        const row = flightsTableBody.insertRow();
        row.dataset.id = flight.id;
        row.insertCell().textContent = flight.date;
        row.insertCell().textContent = flight.fltNo;
        row.insertCell().textContent = flight.onChocksTime || 'N/A';
        row.insertCell().textContent = flight.openDoorTime || 'N/A';
        row.insertCell().textContent = flight.startCleaningTime || 'N/A';
        row.insertCell().textContent = flight.completeCleaningTime || 'N/A';
        row.insertCell().textContent = flight.readyBoardingTime || 'N/A';
        row.insertCell().textContent = flight.startBoardingTime || 'N/A';
        row.insertCell().textContent = flight.completeBoardingTime || 'N/A';
        row.insertCell().textContent = flight.closeDoorTime || 'N/A';
        row.insertCell().textContent = flight.offChocksTime || 'N/A';
        row.insertCell().textContent = flight.notes || 'N/A';

        const actionsCell = row.insertCell();
        actionsCell.classList.add('action-buttons');
        const editButton = document.createElement('button');
        editButton.textContent = 'تعديل';
        editButton.addEventListener('click', () => editFlight(flight.id));
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => deleteFlight(flight.id));
        actionsCell.appendChild(deleteButton);
    });
}

function editFlight(id) {
    const flightToEdit = flights.find(flight => flight.id === id);
    if (!flightToEdit) return;

    // Populate the form fields with flight data
    document.getElementById('fltNo').value = flightToEdit.fltNo;
    document.getElementById('onChocksTime').value = flightToEdit.onChocksTime;
    document.getElementById('openDoorTime').value = flightToEdit.openDoorTime;
    document.getElementById('startCleaningTime').value = flightToEdit.startCleaningTime;
    document.getElementById('completeCleaningTime').value = flightToEdit.completeCleaningTime;
    document.getElementById('readyBoardingTime').value = flightToEdit.readyBoardingTime;
    document.getElementById('startBoardingTime').value = flightToEdit.startBoardingTime;
    document.getElementById('completeBoardingTime').value = flightToEdit.completeBoardingTime;
    document.getElementById('closeDoorTime').value = flightToEdit.closeDoorTime;
    document.getElementById('offChocksTime').value = flightToEdit.offChocksTime;
    document.getElementById('notes').value = flightToEdit.notes;

    // Change submit button to update and add a cancel button
    const submitButton = flightForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'تحديث الرحلة';
    submitButton.onclick = (e) => {
        e.preventDefault();
        updateFlight(id);
    };

    let cancelButton = flightForm.querySelector('#cancelEditBtn');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelEditBtn';
        cancelButton.textContent = 'إلغاء';
        cancelButton.type = 'button';
        cancelButton.classList.add('primary-button');
        cancelButton.style.backgroundColor = '#6c757d'; // Grey color
        cancelButton.style.marginLeft = '10px';
        cancelButton.onclick = cancelEdit;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

function updateFlight(id) {
    const flightIndex = flights.findIndex(flight => flight.id === id);
    if (flightIndex === -1) return;

    flights[flightIndex] = {
        ...flights[flightIndex], // Keep existing data like userId, userName, date
        fltNo: document.getElementById('fltNo').value,
        onChocksTime: document.getElementById('onChocksTime').value,
        openDoorTime: document.getElementById('openDoorTime').value,
        startCleaningTime: document.getElementById('startCleaningTime').value,
        completeCleaningTime: document.getElementById('completeCleaningTime').value,
        readyBoardingTime: document.getElementById('readyBoardingTime').value,
        startBoardingTime: document.getElementById('startBoardingTime').value,
        completeBoardingTime: document.getElementById('completeBoardingTime').value,
        closeDoorTime: document.getElementById('closeDoorTime').value,
        offChocksTime: document.getElementById('offChocksTime').value,
        notes: document.getElementById('notes').value
    };

    setStoredItem('flights', flights); // Save updated flights to localStorage
    flightForm.reset();
    renderFlights();
    displayMessage(flightMessage, 'تم تحديث الرحلة بنجاح!', 'success');
    setTimeout(() => hideMessage(flightMessage), 3000);

    // Restore submit button to original state
    const submitButton = flightForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'حفظ جميع الرحلات';
    submitButton.onclick = (e) => {
        e.preventDefault();
        addFlight();
    };
    const cancelButton = flightForm.querySelector('#cancelEditBtn');
    if (cancelButton) {
        cancelButton.remove();
    }
}

function cancelEdit() {
    flightForm.reset();
    const submitButton = flightForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'حفظ جميع الرحلات';
    submitButton.onclick = (e) => {
        e.preventDefault();
        addFlight();
    };
    const cancelButton = flightForm.querySelector('#cancelEditBtn');
    if (cancelButton) {
        cancelButton.remove();
    }
}


function deleteFlight(id) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه الرحلة؟')) {
        flights = flights.filter(flight => flight.id !== id);
        setStoredItem('flights', flights); // Save updated flights to localStorage
        renderFlights();
        displayMessage(flightMessage, 'تم حذف الرحلة بنجاح.', 'success');
        setTimeout(() => hideMessage(flightMessage), 3000);
    }
}

// Admin Panel
adminViewBtn.addEventListener('click', () => {
    if (currentUser && currentUser.role === 'admin') {
        document.getElementById('flightsView').style.display = 'none';
        document.getElementById('adminView').style.display = 'block';
        updateAdminUI();
    } else {
        displayMessage(flightMessage, 'ليس لديك صلاحيات الوصول إلى لوحة التحكم.', 'error');
    }
});

returnToFlightsBtn.addEventListener('click', () => {
    document.getElementById('adminView').style.display = 'none';
    document.getElementById('flightsView').style.display = 'block';
    renderFlights(); // Re-render flights for the current user
});

adminAddUserBtn.addEventListener('click', () => {
    const email = adminUserEmailInput.value.trim();
    const name = adminUserNameInput.value.trim();
    const password = adminUserPasswordInput.value.trim();

    if (!email || !name || !password) {
        displayMessage(adminUsersMessage, 'الرجاء ملء جميع الحقول.', 'error');
        return;
    }

    if (users[email]) {
        displayMessage(adminUsersMessage, 'هذا البريد الإلكتروني مسجل بالفعل.', 'error');
        return;
    }

    users[email] = { name, password, role: 'user' }; // New users are 'user' role by default
    setStoredItem('users', users); // Save updated users to localStorage
    displayMessage(adminUsersMessage, `تم إضافة المستخدم ${name} بنجاح!`, 'success');
    adminUserEmailInput.value = '';
    adminUserNameInput.value = '';
    adminUserPasswordInput.value = '';
    updateAdminUI(); // Refresh user list
    setTimeout(() => hideMessage(adminUsersMessage), 3000);
});

function deleteUser(email) {
    if (email === 'admin@airport.com') {
        displayMessage(adminUsersMessage, 'لا يمكنك حذف المستخدم المسؤول الافتراضي.', 'error');
        return;
    }
    if (email === currentUser.email) {
        displayMessage(adminUsersMessage, 'لا يمكنك حذف حسابك الحالي.', 'error');
        return;
    }
    if (confirm(`هل أنت متأكد أنك تريد حذف المستخدم ${users[email].name} (${email})؟`)) {
        delete users[email];
        // Also remove flights associated with this user
        flights = flights.filter(flight => flight.userId !== email);
        setStoredItem('users', users); // Save updated users to localStorage
        setStoredItem('flights', flights); // Save updated flights to localStorage
        displayMessage(adminUsersMessage, 'تم حذف المستخدم بنجاح.', 'success');
        updateAdminUI();
        setTimeout(() => hideMessage(adminUsersMessage), 3000);
    }
}

function updateAdminUI() {
    renderAdminUsers();
    populateAdminFilters();
    renderAdminFlightsTable(); // Show all flights in admin table by default
}

function renderAdminUsers() {
    adminUsersList.innerHTML = '';
    for (const email in users) {
        const user = users[email];
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${user.name} (${email}) - ${user.role === 'admin' ? 'مسؤول' : 'مستخدم عادي'}</span>
            <button class="delete-btn" onclick="deleteUser('${email}')">حذف</button>
        `;
        adminUsersList.appendChild(listItem);
    }
}

function populateAdminFilters() {
    // Populate month filter
    adminMonthFilter.innerHTML = '<option value="all">كل الأشهر</option>';
    const uniqueMonths = new Set();
    flights.forEach(flight => {
        uniqueMonths.add(flight.date.substring(0, 7)); // YYYY-MM
    });
    Array.from(uniqueMonths).sort().reverse().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month; // You might want to format this for better display
        adminMonthFilter.appendChild(option);
    });

    // Populate user filter
    adminUserFilter.innerHTML = '<option value="all">كل المستخدمين</option>';
    for (const email in users) {
        const option = document.createElement('option');
        option.value = email;
        option.textContent = users[email].name;
        adminUserFilter.appendChild(option);
    }
}

adminMonthFilter.addEventListener('change', renderAdminFlightsTable);
adminUserFilter.addEventListener('change', renderAdminFlightsTable);

function renderAdminFlightsTable() {
    adminFlightsTableBody.innerHTML = '';
    const selectedMonth = adminMonthFilter.value;
    const selectedUser = adminUserFilter.value;

    let filteredFlights = flights;

    if (selectedMonth !== 'all') {
        filteredFlights = filteredFlights.filter(flight => flight.date.startsWith(selectedMonth));
    }
    if (selectedUser !== 'all') {
        filteredFlights = filteredFlights.filter(flight => flight.userId === selectedUser);
    }

    if (filteredFlights.length === 0) {
        adminFlightsTableBody.innerHTML = `<tr><td colspan="13" style="text-align: center;">لا توجد رحلات مطابقة للفلاتر.</td></tr>`;
        return;
    }

    // Sort by date descending then by FLT.NO (basic alpha sort)
    filteredFlights.sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        if (a.fltNo < b.fltNo) return -1;
        if (a.fltNo > b.fltNo) return 1;
        return 0;
    });

    filteredFlights.forEach(flight => {
        const row = adminFlightsTableBody.insertRow();
        row.insertCell().textContent = flight.date;
        row.insertCell().textContent = flight.userName || flight.userId; // Show user name or email
        row.insertCell().textContent = flight.fltNo;
        row.insertCell().textContent = flight.onChocksTime || 'N/A';
        row.insertCell().textContent = flight.openDoorTime || 'N/A';
        row.insertCell().textContent = flight.startCleaningTime || 'N/A';
        row.insertCell().textContent = flight.completeCleaningTime || 'N/A';
        row.insertCell().textContent = flight.readyBoardingTime || 'N/A';
        row.insertCell().textContent = flight.startBoardingTime || 'N/A';
        row.insertCell().textContent = flight.completeBoardingTime || 'N/A';
        row.insertCell().textContent = flight.closeDoorTime || 'N/A';
        row.insertCell().textContent = flight.offChocksTime || 'N/A';
        row.insertCell().textContent = flight.notes || 'N/A';
    });
}

// DOCX Export Functionality
exportMonthlyBtn.addEventListener('click', async () => {
    if (!currentUser) {
        displayMessage(flightMessage, 'الرجاء تسجيل الدخول لتصدير الرحلات.', 'error');
        return;
    }

    const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const flightsForMonth = flights.filter(flight =>
        flight.userId === currentUser.email && flight.date.startsWith(currentYearMonth)
    );

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "أيلول", "أكتوبر", "نوفمبر", "ديسمبر"];
    const [year, monthNum] = currentYearMonth.split('-');
    const monthName = monthNames[parseInt(monthNum) - 1];

    await exportMonthlyFlightsToDocx(flightsForMonth, currentUser.name, monthName, year);
    displayMessage(flightMessage, 'تم تصدير الرحلات الشهرية بنجاح!', 'success');
    setTimeout(() => hideMessage(flightMessage), 3000);
});

exportDailyBtn.addEventListener('click', async () => {
    if (!currentUser) {
        displayMessage(flightMessage, 'الرجاء تسجيل الدخول لتصدير الرحلات.', 'error');
        return;
    }

    const selectedDate = exportDateInput.value;
    if (!selectedDate) {
        displayMessage(flightMessage, 'الرجاء اختيار تاريخ لتصدير الرحلات اليومية.', 'error');
        return;
    }

    const flightsForDate = flights.filter(flight =>
        flight.userId === currentUser.email && flight.date === selectedDate
    );

    await exportDailyFlightsToDocx(flightsForDate, currentUser.name, selectedDate);
    displayMessage(flightMessage, `تم تصدير رحلات تاريخ ${selectedDate} بنجاح!`, 'success');
    setTimeout(() => hideMessage(flightMessage), 3000);
});


exportAdminStatsBtn.addEventListener('click', async () => {
    if (currentUser?.role !== 'admin') {
        displayMessage(adminMessage, 'ليس لديك صلاحيات لتصدير الإحصائيات.', 'error');
        return;
    }

    const selectedMonth = adminMonthFilter.value; // YYYY-MM
    if (selectedMonth === 'all') {
        displayMessage(adminMessage, 'الرجاء اختيار شهر محدد لتصدير الإحصائيات الشهرية.', 'error');
        return;
    }

    const flightsForMonth = flights.filter(flight =>
        flight.date.startsWith(selectedMonth)
    );

    const userFlightCounts = {};
    flightsForMonth.forEach(flight => {
        userFlightCounts[flight.userId] = (userFlightCounts[flight.userId] || 0) + 1;
    });

    const allUsersMap = new Map();
    for(const email in users) {
        allUsersMap.set(email, users[email].name);
    }

    await exportAdminDataToDocx('stats', { userFlightCounts, totalFlights: flightsForMonth.length, allUsersMap }, selectedMonth);
    displayMessage(adminMessage, `تم تصدير إحصائيات شهر ${selectedMonth} بنجاح!`, 'success');
    setTimeout(() => hideMessage(adminMessage), 3000);
});

exportAdminAllFlightsBtn.addEventListener('click', async () => {
    if (currentUser?.role !== 'admin') {
        displayMessage(adminMessage, 'ليس لديك صلاحيات لتصدير جميع الرحلات.', 'error');
        return;
    }

    const selectedMonth = adminMonthFilter.value;
    const selectedUser = adminUserFilter.value;

    let flightsToExport = flights;

    if (selectedMonth !== 'all') {
        flightsToExport = flightsToExport.filter(flight => flight.date.startsWith(selectedMonth));
    }
    if (selectedUser !== 'all') {
        flightsToExport = flightsToExport.filter(flight => flight.userId === selectedUser);
    }

    // Sort flights for consistent export order (e.g., by date and then FLT.NO)
    flightsToExport.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.fltNo < b.fltNo) return -1;
        if (a.fltNo > b.fltNo) return 1;
        return 0;
    });

    await exportAdminDataToDocx('allFlights', { flightsToExport, usersStored: users }, selectedMonth, selectedUser);
    displayMessage(adminMessage, `تم تصدير الرحلات التفصيلية بنجاح!`, 'success');
    setTimeout(() => hideMessage(adminMessage), 3000);
});


// Utility functions
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}-message`;
    element.style.display = 'block';
}

function hideMessage(element) {
    element.style.display = 'none';
    element.textContent = '';
    element.className = 'message';
}

// Initializations
initializeDefaultAdmin(); // Ensure default admin exists
// *** IMPORTANT: Call checkAuth on initial load ***
document.addEventListener('DOMContentLoaded', checkAuth);

