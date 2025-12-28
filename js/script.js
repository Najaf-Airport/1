// --- Global Constants ---
import { exportMonthlyFlightsToDocx, exportDailyFlightsToDocx } from './docx-export.js'; // استيراد الدالة الجديدة

const ACCESS_CODE = 'alpha2007';
const FLIGHTS_STORAGE_KEY = 'najaf_flights_data_v2';
const LOGGED_IN_USER_KEY = 'najaf_flights_logged_in_user_v2';
const DRAFT_FLIGHT_FORM_KEY = 'najaf_flights_draft_form_data'; // *** مفتاح جديد لحفظ مسودة النموذج ***

// --- DOM Elements ---
let loginForm, codeInput, userNameInput, loginMessage;
let logoutBtn, userNameDisplaySpan;
let welcomeMessage, flightFormsContainer, saveAllFlightsBtn, messageContainer, userPastFlightsTableBody, currentMonthNameSpan;
let exportMonthlyFlightsBtn, exportDailyFlightsBtn, exportDateInput;

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Shared elements
    logoutBtn = document.getElementById('logoutBtn');
    userNameDisplaySpan = document.getElementById('userNameDisplay');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Login View (index.html)
    if (document.getElementById('loginView')) {
        loginForm = document.getElementById('loginForm');
        codeInput = document.getElementById('code');
        userNameInput = document.getElementById('userNameInput');
        loginMessage = document.getElementById('loginMessage');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
    }

    // Flights View (flights.html)
    if (document.getElementById('flightsView')) {
        welcomeMessage = document.getElementById('welcomeMessage');
        flightFormsContainer = document.getElementById('flightFormsContainer');
        saveAllFlightsBtn = document.getElementById('saveAllFlightsBtn');
        messageContainer = document.getElementById('messageContainer');
        userPastFlightsTableBody = document.querySelector('#userPastFlightsTable tbody');
        currentMonthNameSpan = document.getElementById('currentMonthName');
        
        exportMonthlyFlightsBtn = document.getElementById('exportMonthlyFlightsBtn');
        exportDailyFlightsBtn = document.getElementById('exportDailyFlightsBtn');
        exportDateInput = document.getElementById('exportDateInput');
        
        if (saveAllFlightsBtn) saveAllFlightsBtn.addEventListener('click', saveAllFlights);
        if (exportMonthlyFlightsBtn) exportMonthlyFlightsBtn.addEventListener('click', handleExportMonthlyFlights);
        if (exportDailyFlightsBtn) exportDailyFlightsBtn.addEventListener('click', handleExportDailyFlights);
        
        // --- NEW: Generate forms and then load/save draft ---
        generateFlightForms(4); // يجب أن يتم إنشاء النماذج أولاً
        // إضافة مستمع حدث لكل حقل في كل نموذج لحفظ المسودة
        const allFlightInputs = flightFormsContainer.querySelectorAll('input, textarea'); // شاملة textarea لو موجودة
        allFlightInputs.forEach(input => {
            input.addEventListener('input', saveFlightFormDraft);
        });
        
        loadFlightFormDraft(); // *** تحميل المسودة عند تحميل الصفحة ***

        const today = new Date();
        currentMonthNameSpan.textContent = today.toLocaleString('ar-IQ', { month: 'long' });
        exportDateInput.value = today.toISOString().split('T')[0];
    }

    checkAuthState();
});

// --- Utility Functions ---
function getStoredFlights() {
    try {
        return JSON.parse(localStorage.getItem(FLIGHTS_STORAGE_KEY)) || {};
    } catch (e) {
        console.error("Error parsing flights from localStorage:", e);
        return {};
    }
}

function setStoredFlights(flights) {
    localStorage.setItem(FLIGHTS_STORAGE_KEY, JSON.stringify(flights));
}

function getLoggedInUser() {
    try {
        return JSON.parse(localStorage.getItem(LOGGED_IN_USER_KEY));
    } catch (e) {
        console.error("Error parsing logged in user from localStorage:", e);
        return null;
    }
}

function setLoggedInUser(user) {
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
}

function clearLoggedInUser() {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
}

function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        // لا يتم إخفاء الرسالة تلقائياً إذا كانت خطأ لتترك للمستخدم وقتًا للقراءة
        if (!isError) {
            setTimeout(() => { element.textContent = ''; element.className = ''; }, 5000);
        }
    }
}

// Function to explicitly hide a message
function hideMessage(element) {
    if (element) {
        element.textContent = '';
        element.className = '';
    }
}


function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- NEW: Draft Form Management Functions ---
function saveFlightFormDraft() {
    const forms = flightFormsContainer.querySelectorAll('.flight-card');
    const draftData = {};
    forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input, textarea');
        const formDraft = {};
        inputs.forEach(input => {
            formDraft[input.name] = input.value;
        });
        draftData[`form_${index}`] = formDraft;
    });
    localStorage.setItem(DRAFT_FLIGHT_FORM_KEY, JSON.stringify(draftData));
}

function loadFlightFormDraft() {
    const draftData = JSON.parse(localStorage.getItem(DRAFT_FLIGHT_FORM_KEY));
    if (draftData) {
        const forms = flightFormsContainer.querySelectorAll('.flight-card');
        forms.forEach((form, index) => {
            const formDraft = draftData[`form_${index}`];
            if (formDraft) {
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    if (formDraft[input.name] !== undefined) {
                        input.value = formDraft[input.name];
                    }
                });
            }
        });
    }
}

function clearFlightFormDraft() {
    localStorage.removeItem(DRAFT_FLIGHT_FORM_KEY);
    // أيضا قم بمسح الحقول في الواجهة
    const forms = flightFormsContainer.querySelectorAll('.flight-card');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.name !== 'date') { // لا تمسح حقل التاريخ
                 input.value = '';
            } else {
                 const today = new Date();
                 input.value = today.toISOString().split('T')[0]; // أعد تعيين تاريخ اليوم
            }
        });
    });
}
// --- END NEW: Draft Form Management Functions ---


// --- Authentication Logic ---
async function checkAuthState() {
    const user = getLoggedInUser();
    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath.endsWith('index.html') || currentPath === '/NajafFlightsApp/' || currentPath === '/NajafFlightsApp' || currentPath === '/';

    if (user && user.isLoggedIn) {
        if (userNameDisplaySpan) userNameDisplaySpan.textContent = `مرحباً بك، ${user.name || 'مستخدم'}!`;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        if (isOnLoginPage) {
            window.location.href = 'flights.html';
        } else if (currentPath.endsWith('flights.html')) {
            loadUserFlights(user.id);
            // *** تم نقل loadFlightFormDraft إلى DOMContentLoaded ليتم التحميل فوراً ***
        } else if (currentPath.endsWith('admin.html')) {
            window.location.href = 'flights.html'; // أو أعد التوجيه لصفحة لوحة الإدارة إذا كانت موجودة
        }
    } else {
        if (!isOnLoginPage) {
            window.location.href = 'index.html';
        }
        if (userNameDisplaySpan) userNameDisplaySpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        clearFlightFormDraft(); // *** مسح المسودة عند عدم تسجيل الدخول ***
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const code = codeInput.value.trim();
    const userName = userNameInput.value.trim();

    hideMessage(loginMessage); // إخفاء الرسائل السابقة

    if (userName === '') {
        showMessage(loginMessage, 'الرجاء إدخال اسمك الكامل.', true);
        return;
    }

    if (code === ACCESS_CODE) {
        const user = { 
            id: 'single_user_id', // بما أن الكود واحد لجميع المستخدمين، سيكون الـ ID واحد
            name: userName,
            isLoggedIn: true 
        };
        setLoggedInUser(user);
        window.location.href = 'flights.html';
    } else {
        showMessage(loginMessage, 'الكود المدخل غير صحيح.', true);
    }
}

async function handleLogout() {
    clearLoggedInUser();
    clearFlightFormDraft(); // *** مسح المسودة عند تسجيل الخروج ***
    window.location.href = 'index.html';
}

// --- Flights Page Logic (User) ---
function generateFlightForms(numForms) {
    if (!flightFormsContainer) return;
    flightFormsContainer.innerHTML = '';
    const flightFields = [
        { id: 'date', label: 'التاريخ', type: 'date', required: true },
        { id: 'fltNo', label: 'FLT.NO', type: 'text', placeholder: 'اسم ورقم الرحلة', required: true },
        { id: 'onChocksTime', label: 'ON chocks Time', type: 'time' },
        { id: 'openDoorTime', label: 'Open Door Time', type: 'time' },
        { id: 'startCleaningTime', label: 'Start Cleaning Time', type: 'time' },
        { id: 'completeCleaningTime', label: 'Complete Cleaning Time', type: 'time' },
        { id: 'readyBoardingTime', label: 'Ready Boarding Time', type: 'time' },
        { id: 'startBoardingTime', label: 'Start Boarding Time', type: 'time' },
        { id: 'completeBoardingTime', label: 'Complete Boarding Time', type: 'time' },
        { id: 'closeDoorTime', label: 'Close Door Time', type: 'time' },
        { id: 'offChocksTime', label: 'Off chocks Time', type: 'time' },
        { id: 'notes', label: 'الملاحظات', type: 'text', placeholder: 'ملاحظات إضافية' }
    ];

    for (let i = 0; i < numForms; i++) {
        const card = document.createElement('div');
        card.className = 'flight-card';
        card.innerHTML = `<h4>رحلة رقم ${i + 1}</h4>`;

        flightFields.forEach(field => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            const label = document.createElement('label');
            label.setAttribute('for', `flight${i + 1}-${field.id}`);
            label.textContent = field.label + (field.required ? ' *' : '');
            
            const input = document.createElement('input');
            input.setAttribute('type', field.type);
            input.setAttribute('id', `flight${i + 1}-${field.id}`);
            input.setAttribute('name', field.id); // مهم: استخدام "name" لجمع البيانات
            if (field.required) {
                input.setAttribute('required', 'true');
            }
            if (field.placeholder) {
                input.setAttribute('placeholder', field.placeholder);
            }
            if (field.type === 'date') {
                const today = new Date();
                input.value = today.toISOString().split('T')[0];
            }

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            card.appendChild(inputGroup);
        });
        flightFormsContainer.appendChild(card);
    }
}

async function saveAllFlights() {
    const user = getLoggedInUser();
    if (!user || !user.isLoggedIn) {
        showMessage(messageContainer, "خطأ: معلومات المستخدم غير متوفرة. يرجى تسجيل الدخول.", true);
        return;
    }
    const userId = user.id;
    const userName = user.name;

    const forms = flightFormsContainer.querySelectorAll('.flight-card');
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    
    let allFlights = getStoredFlights();
    if (!allFlights[userId]) allFlights[userId] = {};
    if (!allFlights[userId][currentYear]) allFlights[userId][currentYear] = {};
    if (!allFlights[userId][currentYear][currentMonth]) allFlights[userId][currentYear][currentMonth] = {};

    let flightsSavedCount = 0;
    let hasAnyFormError = false; // لتتبع ما إذا كان هناك أي أخطاء في أي نموذج
    let formsWithErrors = []; // لتخزين أرقام النماذج التي بها أخطاء

    // إخفاء أي رسائل سابقة في بداية عملية الحفظ
    hideMessage(messageContainer); 

    for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        const formNumber = i + 1; // رقم الرحلة المعروض للمستخدم
        const inputs = form.querySelectorAll('input');
        const flightData = {
            id: generateUniqueId(),
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString(),
        };
        let hasAnyInput = false; // لتتبع ما إذا كان النموذج يحتوي على أي مدخلات (غير فارغ تماماً)

        let dateValue = '';
        let fltNoValue = '';

        inputs.forEach(input => {
            const fieldId = input.name;
            const value = input.value.trim();
            
            if (value) {
                hasAnyInput = true; 
            }

            if (fieldId === 'date') {
                dateValue = value;
            } else if (fieldId === 'fltNo') {
                fltNoValue = value;
            }
            flightData[fieldId] = value; 
        });

        // إذا كان النموذج فارغاً تماماً (لا يوجد أي مدخلات على الإطلاق)، تخطاه دون رسالة خطأ
        if (!hasAnyInput) {
            continue;
        }

        // إذا وصل الكود إلى هنا، فهذا يعني أن النموذج ليس فارغاً تماماً (يحتوي على مدخل واحد على الأقل)
        // الآن نتحقق من الحقول الإجبارية للحفظ
        if (!dateValue || !fltNoValue) {
            showMessage(messageContainer, `الرحلة رقم ${formNumber}: حقل التاريخ و/أو FLT.NO إجباريان للحفظ.`, true);
            hasAnyFormError = true; 
            formsWithErrors.push(formNumber); // أضف رقم النموذج الذي به خطأ
            continue; // لا تحفظ هذا النموذج وانتقل للي بعده
        }
        
        // إذا وصل الكود إلى هنا، فهذا يعني أن النموذج ليس فارغاً تماماً وأن الحقول الإجبارية مملوءة
        allFlights[userId][currentYear][currentMonth][flightData.id] = flightData;
        flightsSavedCount++;
    }

    // بعد الانتهاء من مراجعة جميع النماذج:
    // 1. دائماً احفظ الرحلات التي تم جمعها بنجاح
    if (flightsSavedCount > 0) {
        setStoredFlights(allFlights);
        loadUserFlights(userId); // إعادة تحميل وعرض الرحلات المحفوظة في الجدول
    }

    // 2. إدارة الرسائل ومسح المسودة بناءً على النتائج النهائية
    if (hasAnyFormError) {
        // إذا كان هناك أي نموذج به خطأ، حتى لو تم حفظ نماذج أخرى بنجاح
        let combinedMessage = '';
        if (flightsSavedCount > 0) {
            combinedMessage += `تم حفظ ${flightsSavedCount} رحلة بنجاح. `;
        }
        combinedMessage += `الرجاء مراجعة الرحلات التالية التي لم يتم حفظها: ${formsWithErrors.join(', ')} بسبب حقول إجبارية مفقودة.`;
        showMessage(messageContainer, combinedMessage, true);
        // لا يتم مسح المسودة بالكامل هنا، ليتمكن المستخدم من تصحيح الأخطاء.
        // يمكننا تطوير clearFlightFormDraft لمسح فقط النماذج التي تم حفظها بنجاح في المستقبل.
    } else if (flightsSavedCount > 0) {
        // كل شيء تم حفظه بنجاح ودون أخطاء
        clearFlightFormDraft(); // مسح المسودة بالكامل
        showMessage(messageContainer, `تم حفظ ${flightsSavedCount} رحلة بنجاح!`, false);
    } else {
        // لم يتم حفظ أي شيء، ولم تكن هناك أخطاء (كل النماذج كانت فارغة تماماً)
        showMessage(messageContainer, 'لم يتم حفظ أي رحلات. يرجى ملء الحقول المطلوبة (التاريخ و FLT.NO على الأقل).', true);
    }
}

function loadUserFlights(userId) {
    if (!userPastFlightsTableBody) return;
    userPastFlightsTableBody.innerHTML = '';

    const allFlights = getStoredFlights();
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

    const userFlightsForMonth = allFlights[userId]?.[currentYear]?.[currentMonth] || {};
    
    // فرز الرحلات حسب التاريخ ثم رقم الرحلة
    const flightsArray = Object.values(userFlightsForMonth).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // الأحدث أولاً
        }
        return (a.fltNo || '').localeCompare(b.fltNo || ''); // ثم حسب رقم الرحلة أبجدياً
    });

    if (flightsArray.length === 0) {
        const row = userPastFlightsTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 12;
        cell.textContent = 'لا توجد رحلات سابقة لهذا الشهر.';
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    flightsArray.forEach(flight => {
        const row = userPastFlightsTableBody.insertRow();
        row.dataset.flightId = flight.id;
        
        row.insertCell(0).textContent = flight.date || '';
        row.insertCell(1).textContent = flight.fltNo || '';
        row.insertCell(2).textContent = flight.onChocksTime || '';
        row.insertCell(3).textContent = flight.openDoorTime || '';
        row.insertCell(4).textContent = flight.startCleaningTime || '';
        row.insertCell(5).textContent = flight.completeCleaningTime || '';
        row.insertCell(6).textContent = flight.readyBoardingTime || '';
        row.insertCell(7).textContent = flight.startBoardingTime || '';
        row.insertCell(8).textContent = flight.completeBoardingTime || '';
        row.insertCell(9).textContent = flight.closeDoorTime || '';
        row.insertCell(10).textContent = flight.offChocksTime || '';
        row.insertCell(11).textContent = flight.notes || '';
    });
}

async function handleExportMonthlyFlights() {
    const user = getLoggedInUser();
    if (!user || !user.isLoggedIn) {
        showMessage(messageContainer, "خطأ: معلومات المستخدم غير متوفرة. يرجى تسجيل الدخول.", true);
        return;
    }
    const userId = user.id;

    const allFlights = getStoredFlights();
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const userName = user.name;

    const userFlightsForMonth = allFlights[userId]?.[currentYear]?.[currentMonth] || {};
    
    const flightsArray = Object.values(userFlightsForMonth).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
        }
        return (a.fltNo || '').localeCompare(b.fltNo || '');
    });

    if (flightsArray.length === 0) {
        showMessage(messageContainer, 'لا توجد رحلات لتصديرها لهذا الشهر.', true);
        return;
    }

    try {
        await exportMonthlyFlightsToDocx(flightsArray, userName, currentMonthNameSpan.textContent, currentYear);
        showMessage(messageContainer, 'تم تصدير جميع رحلات هذا الشهر إلى ملف Word (DOCX) بنجاح!', false);
    } catch (error) {
        console.error("Error exporting monthly flights to DOCX:", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تصدير الرحلات إلى Word.', true);
    }
}

// دالة جديدة لمعالجة تصدير الرحلات ليوم محدد
async function handleExportDailyFlights() {
    const user = getLoggedInUser();
    if (!user || !user.isLoggedIn) {
        showMessage(messageContainer, "خطأ: معلومات المستخدم غير متوفرة. يرجى تسجيل الدخول.", true);
        return;
    }

    const exportDate = exportDateInput.value;
    if (!exportDate) {
        showMessage(messageContainer, "الرجاء اختيار تاريخ لتصدير الرحلات.", true);
        return;
    }

    const userId = user.id;
    const userName = user.name;
    const [year, month, day] = exportDate.split('-'); // 2025-07-08

    const allFlights = getStoredFlights();
    const userFlightsForDate = allFlights[userId]?.[year]?.[month] || {}; // جلب رحلات الشهر

    const flightsForSelectedDate = Object.values(userFlightsForDate).filter(
        flight => flight.date === exportDate
    ).sort((a, b) => {
        // فرز الرحلات لليوم المحدد حسب الوقت أو رقم الرحلة
        return (a.fltNo || '').localeCompare(b.fltNo || ''); 
    });

    if (flightsForSelectedDate.length === 0) {
        showMessage(messageContainer, `لا توجد رحلات مسجلة بتاريخ ${exportDate} لتصديرها.`, true);
        return;
    }

    try {
        await exportDailyFlightsToDocx(flightsForSelectedDate, userName, exportDate);
        showMessage(messageContainer, `تم تصدير ${flightsForSelectedDate.length} رحلة بتاريخ ${exportDate} بنجاح!`, false);
    } catch (error) {
        console.error("Error exporting daily flights to DOCX:", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تصدير رحلات اليوم المحدد إلى Word.', true);
    }
}
