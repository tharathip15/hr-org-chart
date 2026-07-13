/* HR Org Chart Application Logic */

// Default Demo Data
const DEFAULT_EMPLOYEES = [
    {
        "id": 1,
        "name": "PAIBOON R.",
        "role": "CEO",
        "department": "Executive",
        "managerId": null,
        "email": "paiboon.r.@company.com",
        "phone": "+66 81-234-5678",
        "bio": "Chief Executive Officer leading the overall organization strategy."
    },
    {
        "id": 2,
        "name": "NUNTAPORN S.",
        "role": "EA",
        "department": "Executive",
        "managerId": 1,
        "email": "nuntaporns@company.com",
        "phone": "+66 820-234-5678",
        "bio": "Executive Secretary in the Executive department."
    },
    {
        "id": 3,
        "name": "PAITOON R.",
        "role": "CMO",
        "department": "Executive",
        "managerId": 1,
        "email": "paitoonr@company.com",
        "phone": "+66 822-234-5678",
        "bio": "Chief Operating Officer (COO) in the Executive department."
    },
    {
        "id": 4,
        "name": "PAIBOON R.",
        "role": "COO (Acting)",
        "department": "Executive",
        "managerId": 1,
        "email": "paiboon.r.@company.com",
        "phone": "+66 81-234-5678",
        "bio": "Chief Executive Officer leading the overall organization strategy."
    },
    {
        "id": 5,
        "name": "WATCHARACHAI S.",
        "role": "MD MKT",
        "department": "Marketing",
        "managerId": 3,
        "email": "watcharachais@company.com",
        "phone": "+66 839-234-5678",
        "bio": "Director of Marketing in the Marketing department."
    },
    {
        "id": 6,
        "name": "NATTAWAN P.",
        "role": "CST.MKT (Acting)",
        "department": "Marketing",
        "managerId": 5,
        "email": "nattawanp@company.com",
        "phone": "+66 816-234-5678",
        "bio": "VP of Human Resources in the HR department."
    },
    {
        "id": 7,
        "name": "TAWIDA P.",
        "role": "Manager of MKT (Acting)",
        "department": "Marketing",
        "managerId": 6,
        "email": "tawidap@company.com",
        "phone": "+66 834-234-5678",
        "bio": "VP of Corporate Affairs in the Corporate department."
    },
    {
        "id": 8,
        "name": "PAITOON R.",
        "role": "DOS (Acting)",
        "department": "Solvent",
        "managerId": 3,
        "email": "paitoonr@company.com",
        "phone": "+66 822-234-5678",
        "bio": "Chief Operating Officer (COO) in the Executive department."
    },
    {
        "id": 9,
        "name": "CHOLANAN S.",
        "role": "Manager of EN",
        "department": "Energy",
        "managerId": 8,
        "email": "cholanans@company.com",
        "phone": "+66 805-234-5678",
        "bio": "Director of Waste & WS/RDF in the WS/RDF department."
    },
    {
        "id": 10,
        "name": "THONGPITAK A.",
        "role": "Manager of BC (Acting)",
        "department": "Sugar",
        "managerId": 8,
        "email": "thongpitaka@company.com",
        "phone": "+66 836-234-5678",
        "bio": "Director of Sugar & Chemical in the Sugar department."
    },
    {
        "id": 11,
        "name": "THONGPITAK A.",
        "role": "Manager of SG (Acting)",
        "department": "Sugar",
        "managerId": 8,
        "email": "thongpitaka@company.com",
        "phone": "+66 836-234-5678",
        "bio": "Director of Sugar & Chemical in the Sugar department."
    },
    {
        "id": 12,
        "name": "SARASA W.",
        "role": "Manager of SV / CT",
        "department": "Solvent",
        "managerId": 8,
        "email": "sarasaw@company.com",
        "phone": "+66 829-234-5678",
        "bio": "Director of Solvent in the Solvent department."
    },
    {
        "id": 13,
        "name": "CHOLANAN S.",
        "role": "Manager of WT (Acting)",
        "department": "Waste Treatment",
        "managerId": 8,
        "email": "cholanans@company.com",
        "phone": "+66 805-234-5678",
        "bio": "Director of Waste & WS/RDF in the WS/RDF department."
    },
    {
        "id": 14,
        "name": "CHOLANAN S.",
        "role": "Manager of WS/RDF (Acting)",
        "department": "WS/RDF",
        "managerId": 8,
        "email": "cholanans@company.com",
        "phone": "+66 805-234-5678",
        "bio": "Director of Waste & WS/RDF in the WS/RDF department."
    },
    {
        "id": 15,
        "name": "NATTAWAN P.",
        "role": "DOO",
        "department": "Executive",
        "managerId": 4,
        "email": "nattawanp@company.com",
        "phone": "+66 816-234-5678",
        "bio": "VP of Human Resources in the HR department."
    },
    {
        "id": 16,
        "name": "TAWIDA P.",
        "role": "Manager of COR",
        "department": "Corporate",
        "managerId": 15,
        "email": "tawidap@company.com",
        "phone": "+66 834-234-5678",
        "bio": "VP of Corporate Affairs in the Corporate department."
    },
    {
        "id": 17,
        "name": "PANITPORN Y.",
        "role": "Manager of Pro& Log",
        "department": "Procurement & Logistics",
        "managerId": 15,
        "email": "panitporny@company.com",
        "phone": "+66 823-234-5678",
        "bio": "VP of Procurement & Logistics in the Procurement & Logistics department."
    },
    {
        "id": 18,
        "name": "PHONGSATORN K.",
        "role": "Manager of Fin& Acc (Acting)",
        "department": "Finance & Accounting",
        "managerId": 15,
        "email": "phongsatornk@company.com",
        "phone": "+66 824-234-5678",
        "bio": "Director of Finance & Accounting in the Finance & Accounting department."
    },
    {
        "id": 19,
        "name": "NATTAWAN P.",
        "role": "Manager of HRM&HRD (Acting)",
        "department": "HR",
        "managerId": 15,
        "email": "nattawanp@company.com",
        "phone": "+66 816-234-5678",
        "bio": "VP of Human Resources in the HR department."
    },
    {
        "id": 20,
        "name": "BENJAPORN C.",
        "role": "Officer",
        "department": "Waste Treatment",
        "managerId": 13,
        "email": "benjapornc@company.com",
        "phone": "+66 802-234-5678",
        "bio": "Officer in the Waste Treatment department."
    },
    {
        "id": 21,
        "name": "CHINDAPHORN S.",
        "role": "Officer",
        "department": "WS/RDF",
        "managerId": 14,
        "email": "chindaphorns@company.com",
        "phone": "+66 804-234-5678",
        "bio": "Officer in the WS/RDF department."
    },
    {
        "id": 22,
        "name": "EAKKACHON K.",
        "role": "Officer",
        "department": "Energy",
        "managerId": 9,
        "email": "eakkachonk@company.com",
        "phone": "+66 807-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 23,
        "name": "คุณ อ้วน",
        "role": "Officer",
        "department": "Energy",
        "managerId": 9,
        "email": "คุณอ้วน@company.com",
        "phone": "+66 840-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 24,
        "name": "คุณตั้น",
        "role": "Officer",
        "department": "Energy",
        "managerId": 9,
        "email": "คุณตั้น@company.com",
        "phone": "+66 841-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 25,
        "name": "คุณเซียง 69",
        "role": "Officer",
        "department": "Energy",
        "managerId": 9,
        "email": "คุณเซียง69@company.com",
        "phone": "+66 842-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 26,
        "name": "RINLITA W.",
        "role": "Officer",
        "department": "Energy",
        "managerId": 24,
        "email": "rinlitaw@company.com",
        "phone": "+66 828-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 27,
        "name": "CHANINATH A.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 12,
        "email": "chaninatha@company.com",
        "phone": "+66 803-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 28,
        "name": "DIREC T.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 30,
        "email": "direct@company.com",
        "phone": "+66 806-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 29,
        "name": "PORNCHANOK . P",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 12,
        "email": "pornchanokp@company.com",
        "phone": "+66 826-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 30,
        "name": "JIRANAN K.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 12,
        "email": "jiranank@company.com",
        "phone": "+66 809-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 31,
        "name": "KHEMIKA A.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 16,
        "email": "khemikaa@company.com",
        "phone": "+66 812-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 32,
        "name": "KOTCHAMON J.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 16,
        "email": "kotchamonj@company.com",
        "phone": "+66 813-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 33,
        "name": "THARATHIP I.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 16,
        "email": "tharathipi@company.com",
        "phone": "+66 835-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 34,
        "name": "VACAN T.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 16,
        "email": "vacant@company.com",
        "phone": "+66 837-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 35,
        "name": "WARANPORN R.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 16,
        "email": "waranpornr@company.com",
        "phone": "+66 838-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 36,
        "name": "FUANGLADA M.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 17,
        "email": "fuangladam@company.com",
        "phone": "+66 808-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 37,
        "name": "MIRUNTEE M.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 17,
        "email": "mirunteem@company.com",
        "phone": "+66 815-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 38,
        "name": "NUTTHAWA T.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 39,
        "email": "nutthawat@company.com",
        "phone": "+66 821-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 39,
        "name": "PINPAWEE K.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 17,
        "email": "pinpaweek@company.com",
        "phone": "+66 825-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 40,
        "name": "SASIPHA S.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 39,
        "email": "sasiphas@company.com",
        "phone": "+66 830-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 41,
        "name": "SUDARA T.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 37,
        "email": "sudarat@company.com",
        "phone": "+66 831-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 42,
        "name": "SUPAWIT J.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 36,
        "email": "supawitj@company.com",
        "phone": "+66 832-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 43,
        "name": "PORNCHITAR D.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 36,
        "email": "pornchitard@company.com",
        "phone": "+66 827-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 44,
        "name": "JIRAPA R.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 18,
        "email": "jirapar@company.com",
        "phone": "+66 810-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 45,
        "name": "JUTAMAS P.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 18,
        "email": "jutamasp@company.com",
        "phone": "+66 811-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 46,
        "name": "NILIN W.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 18,
        "email": "nilinw@company.com",
        "phone": "+66 819-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 47,
        "name": "NATTHANIDA L.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 45,
        "email": "natthanidal@company.com",
        "phone": "+66 817-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 48,
        "name": "SUTAWAN S.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 18,
        "email": "sutawans@company.com",
        "phone": "+66 833-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 49,
        "name": "KULTHARA W.",
        "role": "Officer",
        "department": "HR",
        "managerId": 19,
        "email": "kultharaw@company.com",
        "phone": "+66 814-234-5678",
        "bio": "Officer in the HR department."
    },
    {
        "id": 50,
        "name": "NE W.",
        "role": "Officer",
        "department": "Overview",
        "managerId": 1,
        "email": "new@company.com",
        "phone": "+66 818-234-5678",
        "bio": "Officer in the Overview department."
    }
];

// State variables
let employees = [];
let positions = [];
let collapsedNodes = new Set();
let highlightedConnections = new Set();
let selectedDept = "All"; // "All" or department name
let currentScale = 1.0;
let panX = 0;
let panY = 0;

// Dragging state
let isDragging = false;
let startX = 0;
let startY = 0;

// DOM Elements
const viewport = document.getElementById("chart-viewport");
const canvas = document.getElementById("chart-canvas");
const svgOverlay = document.getElementById("svg-overlay");
const treeContainer = document.getElementById("tree-container");
const EMPLOYEES_API_URL = "/api/employees";
const POSITIONS_API_URL = "/api/positions";
const PREFERENCES_API_URL = "/api/preferences";
const PHOTO_MAX_SIZE = 256;
const PHOTO_QUALITY = 0.82;

// Loader helper functions
function setLoaderProgress(percent, statusText) {
    const progressBar = document.getElementById("loader-progress-bar");
    const loaderPercent = document.getElementById("loader-percent");
    const loaderStatus = document.getElementById("loader-status");
    
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (loaderPercent) loaderPercent.innerText = `${percent}%`;
    if (loaderStatus && statusText) loaderStatus.innerText = statusText;
}

function hideLoader() {
    const loader = document.getElementById("app-loader");
    if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => {
            loader.style.display = "none";
        }, 600); // matches CSS fade-out transition duration
    }
}

let activeSyncOperations = 0;

function setSyncStatus(status) {
    const container = document.getElementById("sync-status");
    if (!container) return;
    
    let icon = "cloud";
    let text = "Saved to Cloud";
    let iconClass = "success";
    
    if (status === "saving") {
        activeSyncOperations++;
        icon = "refresh-cw";
        text = "Saving...";
        iconClass = "loading";
    } else if (status === "success") {
        activeSyncOperations = Math.max(0, activeSyncOperations - 1);
        if (activeSyncOperations > 0) {
            return;
        }
        icon = "cloud";
        text = "Saved to Cloud";
        iconClass = "success";
    } else if (status === "error") {
        activeSyncOperations = Math.max(0, activeSyncOperations - 1);
        icon = "cloud-off";
        text = "Sync Error";
        iconClass = "error";
    }
    
    container.innerHTML = `
        <i data-lucide="${icon}" class="sync-icon ${iconClass}"></i>
        <span class="sync-text">${text}</span>
    `;
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Load data initially
async function init() {
    setLoaderProgress(15, "กำลังจัดเตรียมสภาพแวดล้อม...");
    
    // Let elements fade in and spin rings start rotating smoothly
    await new Promise(resolve => setTimeout(resolve, 350));
    
    setLoaderProgress(40, "กำลังดึงข้อมูลบุคลากรจากฐานข้อมูล...");
    await loadData();
    await loadPositions();
    
    await new Promise(resolve => setTimeout(resolve, 250));
    
    setLoaderProgress(70, "กำลังดาวน์โหลดค่ากำหนดการแสดงผล...");
    await loadPreferences();
    await loadAnnotations();
    
    await new Promise(resolve => setTimeout(resolve, 250));
    
    setLoaderProgress(90, "กำลังเรนเดอร์แผนผังโครงสร้างองค์กร...");
    setupEventListeners();
    renderAll();
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoaderProgress(100, "เสร็จสิ้น!");
    
    // Fade out and fit layout smoothly
    setTimeout(() => {
        fitToScreen();
        hideLoader();
    }, 350);
}

function compressBase64Image(base64Str) {
    return new Promise((resolve) => {
        if (!base64Str || !base64Str.startsWith("data:image/") || base64Str.length < 50000) {
            resolve(base64Str);
            return;
        }
        const img = new Image();
        img.onload = () => {
            try {
                const scale = Math.min(1, PHOTO_MAX_SIZE / Math.max(img.width, img.height));
                const width = Math.max(1, Math.round(img.width * scale));
                const height = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
            } catch (err) {
                console.warn("Failed to compress image on canvas, using original", err);
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
        img.src = base64Str;
    });
}

async function compressAllEmployeePhotos() {
    const promises = employees.map(async (emp) => {
        if (emp.photoUrl && emp.photoUrl.startsWith("data:image/") && emp.photoUrl.length > 50000) {
            const compressed = await compressBase64Image(emp.photoUrl);
            if (compressed !== emp.photoUrl) {
                emp.photoUrl = compressed;
                return true;
            }
        }
        return false;
    });
    const results = await Promise.all(promises);
    return results.some(r => r === true);
}

// Load data from the server database. LocalStorage is only a fallback for file:// previews.
async function loadData() {
    try {
        const response = await fetch(EMPLOYEES_API_URL);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const savedEmployees = await response.json();
        employees = Array.isArray(savedEmployees) && savedEmployees.length > 0
            ? savedEmployees
            : [...DEFAULT_EMPLOYEES];

        const didNormalizeProfiles = normalizeEmployeeProfiles();

        // Self-heal and compress any oversized profile pictures to prevent Vercel 413 Payload Too Large
        const photoCompressed = await compressAllEmployeePhotos();

        if (!Array.isArray(savedEmployees) || savedEmployees.length === 0 || didNormalizeProfiles || photoCompressed) {
            await saveData();
        }
        return;
    } catch (error) {
        console.warn("Database API unavailable; falling back to localStorage.", error);
    }

    const saved = localStorage.getItem("hr_employees");
    if (saved) {
        try {
            employees = JSON.parse(saved);
            normalizeEmployeeProfiles();
            return;
        } catch (error) {
            console.warn("Failed to parse localStorage backup.", error);
        }
    }

    employees = [...DEFAULT_EMPLOYEES];
    normalizeEmployeeProfiles();
    saveLocalBackup();
}

// Save to server database, with a local browser backup as a fallback copy.
async function saveData() {
    setSyncStatus("saving");
    saveLocalBackup();

    try {
        const response = await fetch(EMPLOYEES_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employees)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        setSyncStatus("success");
    } catch (error) {
        console.error("Failed to save data to database.", error);
        setSyncStatus("error");
        showNotification("Database save failed. A browser backup was kept.", "error");
    }
}

function saveLocalBackup() {
    try {
        localStorage.setItem("hr_employees", JSON.stringify(employees));
    } catch (error) {
        console.warn("Failed to write to localStorage (quota exceeded or private mode):", error);
    }
}

function toNullableInteger(value) {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function normalizePosition(position, fallbackId) {
    const id = toNullableInteger(position?.id) || fallbackId;
    const title = (position?.title || position?.role || "Open Position").trim();
    const department = (position?.department || "Unassigned").trim();

    let layoutStyle = "horizontal";
    let isManual = false;
    let notesText = (position?.notes || "").trim();

    // Check if notes contains layout style JSON
    if (notesText.startsWith("{") && notesText.endsWith("}")) {
        try {
            const parsed = JSON.parse(notesText);
            layoutStyle = parsed.layoutStyle || "horizontal";
            isManual = !!parsed.isManual;
            notesText = parsed.text || "";
        } catch (e) {
            // Not valid JSON, keep as is
        }
    }

    return {
        id,
        title,
        department,
        managerId: toNullableInteger(position?.managerId ?? position?.manager_id),
        employeeId: toNullableInteger(position?.employeeId ?? position?.employee_id),
        x: toNullableInteger(position?.x),
        y: toNullableInteger(position?.y),
        layoutStyle,
        isManual: isManual || (position?.isManual === true),
        notes: notesText
    };
}

function normalizePositionsList(rawPositions) {
    if (!Array.isArray(rawPositions)) return [];

    const normalized = [];
    const usedIds = new Set();
    let nextId = 1;

    rawPositions.forEach(position => {
        while (usedIds.has(nextId)) nextId += 1;
        const candidate = normalizePosition(position, toNullableInteger(position?.id) || nextId);
        if (!Number.isInteger(candidate.id) || usedIds.has(candidate.id)) {
            candidate.id = nextId;
        }
        usedIds.add(candidate.id);
        nextId = Math.max(nextId, candidate.id + 1);
        normalized.push(candidate);
    });

    const validPositionIds = new Set(normalized.map(position => position.id));
    const validEmployeeIds = new Set(employees.map(employee => employee.id));

    normalized.forEach(position => {
        if (position.managerId !== null && !validPositionIds.has(position.managerId)) {
            position.managerId = null;
        }
        if (position.employeeId !== null && !validEmployeeIds.has(position.employeeId)) {
            position.employeeId = null;
        }
    });

    return normalized;
}

function derivePositionsFromEmployees() {
    const employeeIds = new Set(employees.map(employee => employee.id));

    return employees.map(employee => normalizePosition({
        id: employee.id,
        title: employee.role,
        department: employee.department,
        managerId: employeeIds.has(employee.managerId) ? employee.managerId : null,
        employeeId: employee.id,
        x: employee.x,
        y: employee.y,
        notes: ""
    }, employee.id));
}

function isTransitivelyReportingTo(positionId, targetManagerEmployeeId) {
    let current = positions.find(p => p.id === positionId);
    while (current && current.managerId !== null) {
        const parent = positions.find(p => p.id === current.managerId);
        if (!parent) break;
        if (parent.employeeId === targetManagerEmployeeId) {
            return true;
        }
        // Keep traversing only if the parent is vacant!
        if (parent.employeeId !== null) {
            break;
        }
        current = parent;
    }
    return false;
}

function saveLocalPositionsBackup() {
    try {
        localStorage.setItem("hr_positions", JSON.stringify(positions));
    } catch (error) {
        console.warn("Failed to write positions to localStorage:", error);
    }
}

async function loadPositions() {
    try {
        const response = await fetch(POSITIONS_API_URL);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const savedPositions = await response.json();
        positions = normalizePositionsList(savedPositions);
        const hierarchyRepair = OrgHierarchy.repairPositionHierarchy(positions);
        positions = hierarchyRepair.positions;

        if (!Array.isArray(savedPositions) || positions.length === 0) {
            positions = derivePositionsFromEmployees();
            await savePositions();
        } else {
            // Auto-align employees who don't have positions (e.g. newly synced from Microsoft AD)
            let positionsChanged = hierarchyRepair.changed;
            const assignedEmployeeIds = new Set(positions.map(p => p.employeeId).filter(id => id !== null));
            
            employees.forEach(employee => {
                if (!assignedEmployeeIds.has(employee.id)) {
                    // 1. Try to find a vacant position that matches the employee's role and department
                    const matchedVacant = positions.find(p => 
                        p.employeeId === null && 
                        p.title.toLowerCase().trim() === employee.role.toLowerCase().trim() && 
                        p.department.toLowerCase().trim() === employee.department.toLowerCase().trim()
                    );
                    
                    if (matchedVacant) {
                        matchedVacant.employeeId = employee.id;
                        assignedEmployeeIds.add(employee.id);
                        positionsChanged = true;
                        console.log(`Auto-assigned employee ${employee.name} to matching vacant position ${matchedVacant.title}`);
                    } else {
                        // 2. Create a new position for the employee
                        const newPositionManagerId = getPositionManagerIdFromEmployeeManager(employee.managerId, { department: employee.department, employeeId: employee.id });
                        const positionAutoPos = getAutoPositionForPosition(newPositionManagerId);
                        positions.push({
                            id: getNextPositionId(),
                            title: employee.role,
                            department: employee.department,
                            managerId: newPositionManagerId,
                            employeeId: employee.id,
                            x: positionAutoPos.x,
                            y: positionAutoPos.y,
                            notes: ""
                        });
                        assignedEmployeeIds.add(employee.id);
                        positionsChanged = true;
                    }
                }
            });

            // Position hierarchy is managed explicitly; employee manager data must not rewrite it.
            if (false) positions.forEach(position => {
                if (position.employeeId) {
                    const employee = employees.find(e => e.id === position.employeeId);
                    if (employee && employee.managerId) {
                        // Only self-heal primary positions, leaving secondary dual-roles editable
                        const primaryPos = getPrimaryPositionForEmployee(employee.id);
                        if (primaryPos && primaryPos.id === position.id) {
                            // Skip self-healing if already transitively reporting to this manager employee through vacant positions
                            if (isTransitivelyReportingTo(position.id, employee.managerId)) {
                                return;
                            }
                            const correctManagerPosId = getPositionManagerIdFromEmployeeManager(employee.managerId, position);
                            if (correctManagerPosId !== position.managerId) {
                                // Skip if current manager is in the chain leading up to the correct manager
                                // e.g. position→62→75 is valid, don't flatten to position→75
                                if (position.managerId !== null && correctManagerPosId !== null) {
                                    let walkId = position.managerId;
                                    const visited = new Set();
                                    while (walkId !== null && !visited.has(walkId)) {
                                        if (walkId === correctManagerPosId) {
                                            return; // Current manager is under the correct manager, hierarchy is fine
                                        }
                                        visited.add(walkId);
                                        const walkPos = positions.find(p => p.id === walkId);
                                        walkId = walkPos ? walkPos.managerId : null;
                                    }
                                }
                                console.log(`Self-healed position ${position.title} manager from ${position.managerId} to ${correctManagerPosId}`);
                                position.managerId = correctManagerPosId;
                                positionsChanged = true;
                            }
                        }
                    }
                }
            });

            if (positionsChanged) {
                await savePositions();
            }
        }
        return;
    } catch (error) {
        console.warn("Positions API unavailable; falling back to localStorage.", error);
    }

    const saved = localStorage.getItem("hr_positions");
    if (saved) {
        try {
            positions = normalizePositionsList(JSON.parse(saved));
            if (positions.length > 0) return;
        } catch (error) {
            console.warn("Failed to parse localStorage positions backup.", error);
        }
    }

    positions = derivePositionsFromEmployees();
    saveLocalPositionsBackup();
}

async function savePositions() {
    setSyncStatus("saving");
    positions = normalizePositionsList(positions);
    saveLocalPositionsBackup();

    const payload = positions.map(p => ({
        ...p,
        notes: JSON.stringify({
            layoutStyle: p.layoutStyle || "horizontal",
            isManual: !!p.isManual,
            text: p.notes || ""
        })
    }));

    try {
        const response = await fetch(POSITIONS_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        setSyncStatus("success");
    } catch (error) {
        console.error("Failed to save positions to database.", error);
        setSyncStatus("error");
        showNotification("Position save failed. A browser backup was kept.", "error");
    }
}

function sanitizeCollapsedNodeIds(value) {
    if (!Array.isArray(value)) return [];

    const validIds = new Set((positions.length > 0 ? positions : employees).map(item => item.id));
    return [...new Set(value.map(id => parseInt(id, 10)))]
        .filter(id => Number.isInteger(id) && validIds.has(id));
}

function applyPreferences(preferences) {
    collapsedNodes = new Set(sanitizeCollapsedNodeIds(preferences?.collapsedNodeIds));
}

function getPreferencesPayload() {
    return {
        collapsedNodeIds: [...collapsedNodes]
            .filter(id => Number.isInteger(id))
            .sort((a, b) => a - b)
    };
}

async function loadPreferences() {
    try {
        const response = await fetch(PREFERENCES_API_URL);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        applyPreferences(await response.json());
        return;
    } catch (error) {
        console.warn("Preferences API unavailable; falling back to localStorage.", error);
    }

    const saved = localStorage.getItem("hr_org_preferences");
    if (saved) {
        try {
            applyPreferences(JSON.parse(saved));
            return;
        } catch (error) {
            console.warn("Failed to parse localStorage preferences backup.", error);
        }
    }

    applyPreferences({});
}

async function savePreferences() {
    setSyncStatus("saving");
    const preferences = getPreferencesPayload();
    try {
        localStorage.setItem("hr_org_preferences", JSON.stringify(preferences));
    } catch (error) {
        console.warn("Failed to write preferences to localStorage:", error);
    }

    try {
        const response = await fetch(PREFERENCES_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preferences)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        setSyncStatus("success");
    } catch (error) {
        console.error("Failed to save shared view preferences.", error);
        setSyncStatus("error");
    }
}

function normalizePersonKey(name) {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function createPersonId(name, fallbackId) {
    const slug = normalizePersonKey(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "employee";
    return `person-${slug}-${fallbackId}`;
}

function normalizeEmployeeProfiles() {
    let changed = false;
    const managerRepair = OrgHierarchy.repairEmployeeManagers(employees);
    if (managerRepair.changed) {
        employees = managerRepair.employees;
        changed = true;
    }
    const personIdByName = new Map();

    employees.forEach(emp => {
        const key = normalizePersonKey(emp.name);
        if (!emp.personId) {
            if (!personIdByName.has(key)) {
                personIdByName.set(key, createPersonId(emp.name, emp.id));
            }
            emp.personId = personIdByName.get(key);
            changed = true;
        } else if (key && !personIdByName.has(key)) {
            personIdByName.set(key, emp.personId);
        }
    });

    const profileByPersonId = new Map();
    employees.forEach(emp => {
        const current = profileByPersonId.get(emp.personId);
        if (!current || profileCompletenessScore(emp) > profileCompletenessScore(current)) {
            profileByPersonId.set(emp.personId, emp);
        }
    });

    employees.forEach(emp => {
        const profile = profileByPersonId.get(emp.personId);
        if (!profile) return;
        ["name", "email", "phone", "bio", "photoUrl"].forEach(field => {
            const nextValue = profile[field] || "";
            if ((emp[field] || "") !== nextValue) {
                emp[field] = nextValue;
                changed = true;
            }
        });
    });

    return changed;
}

function profileCompletenessScore(emp) {
    return ["photoUrl", "email", "phone", "bio", "name"]
        .reduce((score, field) => score + ((emp[field] || "").trim ? (emp[field] || "").trim().length > 0 : Boolean(emp[field])), 0);
}

function samePerson(a, b) {
    if (!a || !b) return false;
    if (a.personId && b.personId) return a.personId === b.personId;
    return normalizePersonKey(a.name) === normalizePersonKey(b.name);
}

function getPersonProfile(personId) {
    return employees.find(emp => emp.personId === personId) || null;
}

function getUniquePersonProfiles() {
    const profiles = new Map();
    employees.forEach(emp => {
        if (!profiles.has(emp.personId)) {
            profiles.set(emp.personId, emp);
            return;
        }
        if (profileCompletenessScore(emp) > profileCompletenessScore(profiles.get(emp.personId))) {
            profiles.set(emp.personId, emp);
        }
    });

    return [...profiles.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function getPersonPositionCount(personId) {
    return employees.filter(emp => emp.personId === personId).length;
}

function getPersonOptionLabel(profile) {
    const count = getPersonPositionCount(profile.personId);
    const suffix = count > 1 ? `${count} positions` : `${count} position`;
    return `${profile.name} (${suffix})`;
}

function findPersonProfileFromInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return getUniquePersonProfiles().find(profile =>
        getPersonOptionLabel(profile) === trimmed ||
        profile.name === trimmed ||
        profile.personId === trimmed
    ) || null;
}

function syncPersonProfile(personId, profileFields) {
    employees.forEach(emp => {
        if (emp.personId !== personId) return;
        emp.name = profileFields.name;
        emp.email = profileFields.email;
        emp.phone = profileFields.phone;
        emp.bio = profileFields.bio;
        emp.photoUrl = profileFields.photoUrl;
    });
}

function getAvatarHTML(emp, className = "avatar", extraStyle = "") {
    if (emp?.photoUrl) {
        return `
            <div class="${className} avatar-photo" style="${extraStyle}">
                <img src="${escapeHTML(emp.photoUrl)}" alt="${escapeHTML(emp.name || "Employee")}">
            </div>
        `;
    }

    const color = emp?.avatarColor || getDeptColor(emp?.department);
    return `<div class="${className}" style="background-color: ${color}; ${extraStyle}">${getInitials(emp?.name || "")}</div>`;
}

function setPhotoPreview(photoUrl, name = "") {
    const preview = document.getElementById("form-photo-preview");
    if (!preview) return;

    if (photoUrl) {
        preview.innerHTML = `<img src="${escapeHTML(photoUrl)}" alt="${escapeHTML(name || "Employee photo")}">`;
        preview.classList.add("has-photo");
    } else {
        preview.innerHTML = `<i data-lucide="camera"></i>`;
        preview.classList.remove("has-photo");
        lucide.createIcons();
    }
}

function resizeImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please choose an image file."));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const scale = Math.min(1, PHOTO_MAX_SIZE / Math.max(image.width, image.height));
                const width = Math.max(1, Math.round(image.width * scale));
                const height = Math.max(1, Math.round(image.height * scale));
                const canvasEl = document.createElement("canvas");
                canvasEl.width = width;
                canvasEl.height = height;
                const ctx = canvasEl.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);
                resolve(canvasEl.toDataURL("image/jpeg", PHOTO_QUALITY));
            };
            image.onerror = () => reject(new Error("Could not read the selected image."));
            image.src = reader.result;
        };
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.readAsDataURL(file);
    });
}

// Set up UI and canvas event listeners
function setupEventListeners() {
    // Zoom in/out buttons
    document.getElementById("zoom-in").addEventListener("click", () => zoom(1.2));
    document.getElementById("zoom-out").addEventListener("click", () => zoom(0.8));
    document.getElementById("zoom-fit").addEventListener("click", fitToScreen);
    const btnExpandAll = document.getElementById("btn-expand-all");
    if (btnExpandAll) {
        btnExpandAll.addEventListener("click", async () => {
            if (collapsedNodes.size === 0) return;
            collapsedNodes.clear();
            renderAll();
            fitToScreen();
            await savePreferences();
        });
    }
    
    // Mouse Wheel Zoom
    viewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        let nextScale;
        if (e.deltaY < 0) {
            nextScale = currentScale * zoomFactor;
        } else {
            nextScale = currentScale / zoomFactor;
        }
        
        // Clamp scale
        nextScale = Math.max(0.15, Math.min(3.0, nextScale));
        
        // Get mouse position relative to viewport
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Canvas coordinate under mouse before zoom
        const canvasMouseX = (mouseX - panX) / currentScale;
        const canvasMouseY = (mouseY - panY) / currentScale;
        
        currentScale = nextScale;
        
        // Shift pan coordinates to anchor the mouse position
        panX = mouseX - canvasMouseX * currentScale;
        panY = mouseY - canvasMouseY * currentScale;
        
        updateCanvasTransform();
    }, { passive: false });
    
    // Drag/Pan Canvas
    viewport.addEventListener("mousedown", (e) => {
        // Left click only
        if (e.button !== 0) return;
        // Don't drag if clicking buttons, input fields or profile cards
        if (e.target.closest(".node-card") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".drawer") || e.target.closest(".modal") || e.target.closest(".annotation-card") || e.target.closest(".annotation-text-wrapper")) return;
        
        isDragging = true;
        viewport.style.cursor = "grabbing";
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });
    
    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateCanvasTransform();
    });
    
    window.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            viewport.style.cursor = "grab";
        }
    });
    
    // Viewport drag and drop to make employee top-level
    viewport.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    
    viewport.addEventListener("drop", (e) => {
        // Only handle if dropped directly on viewport/canvas, not on a card
        if (e.target.closest(".node-card") || e.target.closest(".drawer") || e.target.closest(".modal")) return;
        
        e.preventDefault();
        if (draggedId !== null) {
            openDropActionModal(draggedId, null);
        }
    });
    
    // Export Backup data
    document.getElementById("btn-export-data").addEventListener("click", () => {
        const backupData = {
            version: "1.0",
            employees: employees,
            positions: positions,
            annotations: annotations,
            preferences: {
                collapsedNodeIds: [...collapsedNodes]
            }
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "hr_org_chart_unified_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showNotification("Unified backup file downloaded successfully", "success");
    });
    
    // Import Backup data trigger
    const fileInput = document.getElementById("import-file-input");
    document.getElementById("btn-import-trigger").addEventListener("click", () => {
        fileInput.click();
    });
    
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                
                // Check if it's the new unified backup format
                if (parsed && parsed.version && Array.isArray(parsed.employees) && Array.isArray(parsed.positions)) {
                    if (confirm(`Are you sure you want to import this unified backup? It will restore all ${parsed.employees.length} employees, ${parsed.positions.length} positions, annotations, and layouts.`)) {
                        employees = parsed.employees;
                        positions = parsed.positions;
                        annotations = parsed.annotations || [];
                        collapsedNodes = new Set(sanitizeCollapsedNodeIds(parsed.preferences?.collapsedNodeIds || []));
                        selectedDept = "All";
                        
                        // Compress photos on import to prevent 413 Payload Too Large
                        await compressAllEmployeePhotos();
                        
                        await saveData();
                        await savePositions();
                        await saveAnnotations();
                        await savePreferences();
                        
                        renderAll();
                        fitToScreen();
                        showNotification("Unified backup imported successfully!", "success");
                    }
                } 
                // Fallback: Check if it's the old format (just an array of employees)
                else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].department) {
                    if (confirm(`Are you sure you want to import this backup? It will overwrite your current chart with ${parsed.length} employees.`)) {
                        employees = parsed;
                        normalizeEmployeeProfiles();
                        positions = derivePositionsFromEmployees();
                        collapsedNodes.clear();
                        selectedDept = "All";
                        
                        // Compress photos on import to prevent 413 Payload Too Large
                        await compressAllEmployeePhotos();
                        
                        await saveData();
                        await savePositions();
                        await savePreferences();
                        
                        renderAll();
                        fitToScreen();
                        showNotification("Legacy backup imported successfully!", "success");
                    }
                } else {
                    showNotification("Invalid backup file format", "error");
                }
            } catch (err) {
                console.error(err);
                showNotification("Failed to parse JSON backup file", "error");
            }
            // Clear input so same file can be uploaded again
            fileInput.value = "";
        };
        reader.readAsText(file);
    });
    
    // Sync Microsoft 365 button
    const btnSync = document.getElementById("btn-sync-microsoft");
    if (btnSync) {
        btnSync.addEventListener("click", async () => {
            if (!confirm("ต้องการซิงค์ข้อมูลพนักงานกับ Microsoft 365 หรือไม่? ข้อมูลการจัดตำแหน่งและการตั้งค่าปัจจุบันอาจถูกแทนที่ด้วยข้อมูลจาก Azure AD")) return;
            
            btnSync.disabled = true;
            const originalHTML = btnSync.innerHTML;
            btnSync.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Syncing...`;
            if (window.lucide) window.lucide.createIcons();
            
            try {
                const response = await fetch("/api/sync-microsoft", { method: "POST" });
                const result = await response.json();
                
                if (response.ok && result.ok) {
                    showNotification(`ซิงค์ข้อมูลพนักงานจำนวน ${result.count} คน จาก Microsoft 365 สำเร็จ`, "success");
                    await loadData();
                    await loadPositions();
                    renderAll();
                } else {
                    throw new Error(result.error || "Sync failed");
                }
            } catch (error) {
                console.error("Microsoft sync failed:", error);
                showNotification(`เกิดข้อผิดพลาดในการซิงค์: ${error.message}`, "error");
            } finally {
                btnSync.disabled = false;
                btnSync.innerHTML = originalHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // Auto-Arrange Layout Button
    const btnAutoLayout = document.getElementById("btn-auto-layout");
    if (btnAutoLayout) {
        btnAutoLayout.addEventListener("click", () => {
            if (confirm("ต้องการจัดระเบียบแผนผังและพิกัดการ์ดทั้งหมดโดยอัตโนมัติหรือไม่? (พิกัดการจัดวางที่คุณลากเองจะถูกรีเซ็ตให้เรียงกันอย่างเป็นระเบียบ)")) {
                positions.forEach(position => {
                    position.x = null;
                    position.y = null;
                    position.isManual = false;
                });
                renderTree();
                savePositions();
                showNotification("จัดตำแหน่งการ์ดทั้งหมดและดึงกลับมาใกล้กันเรียบร้อยแล้ว", "success");
            }
        });
    }

    // Add Employee Button
    document.getElementById("btn-add-employee").addEventListener("click", () => {
        openEmployeeForm();
    });

    const btnManagePositions = document.getElementById("btn-manage-positions");
    if (btnManagePositions) {
        btnManagePositions.addEventListener("click", () => openPositionsModal());
    }

    const btnManageEmployees = document.getElementById("btn-manage-employees");
    if (btnManageEmployees) {
        btnManageEmployees.addEventListener("click", () => openEmployeeManagementModal());
    }
    
    // Search logic
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            searchResults.style.display = "none";
            clearHighlights();
            return;
        }
        
        const matches = employees.filter(emp => 
            emp.name.toLowerCase().includes(query) || 
            emp.role.toLowerCase().includes(query) || 
            emp.department.toLowerCase().includes(query)
        );
        
        if (matches.length === 0) {
            searchResults.innerHTML = `<div class="search-result-item" style="cursor: default; color: var(--text-tertiary);">No matches found</div>`;
        } else {
            searchResults.innerHTML = matches.map(emp => `
                <div class="search-result-item" data-id="${emp.id}">
                    ${getAvatarHTML(emp, "avatar", "width: 32px; height: 32px; font-size: 11px;")}
                    <div class="search-result-info">
                        <h4>${escapeHTML(emp.name)}</h4>
                        <p>${escapeHTML(emp.role)} • ${escapeHTML(emp.department)}</p>
                    </div>
                </div>
            `).join("");
            
            // Add click listeners to results
            searchResults.querySelectorAll(".search-result-item").forEach(item => {
                item.addEventListener("click", () => {
                    const id = parseInt(item.dataset.id);
                    searchResults.style.display = "none";
                    searchInput.value = "";
                    focusAndHighlightEmployee(id);
                });
            });
        }
        searchResults.style.display = "block";
    });
    
    // Close search dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container")) {
            searchResults.style.display = "none";
        }
    });
    
    // Form submission
    document.getElementById("employee-form").addEventListener("submit", handleFormSubmit);
    document.getElementById("position-form").addEventListener("submit", handlePositionFormSubmit);
    document.getElementById("btn-photo-trigger").addEventListener("click", () => {
        document.getElementById("form-photo-input").click();
    });
    
    document.getElementById("form-photo-input").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const resizedPhoto = await resizeImageFile(file);
            document.getElementById("form-photo-data").value = resizedPhoto;
            setPhotoPreview(resizedPhoto, document.getElementById("form-name").value.trim());
            showNotification("Photo added to employee profile", "success");
        } catch (error) {
            showNotification(error.message || "Could not upload photo", "error");
        } finally {
            e.target.value = "";
        }
    });
    
    document.getElementById("btn-remove-photo").addEventListener("click", () => {
        document.getElementById("form-photo-data").value = "";
        setPhotoPreview("", document.getElementById("form-name").value.trim());
    });
    
    document.getElementById("form-person-link").addEventListener("change", () => {
        applySelectedPersonProfile();
    });
    
    document.getElementById("form-person-link").addEventListener("input", () => {
        applySelectedPersonProfile();
    });
    
    // Close buttons for drawers/modals
    document.getElementById("close-detail-drawer").addEventListener("click", closeDetailDrawer);
    document.getElementById("detail-drawer-overlay").addEventListener("click", closeDetailDrawer);
    document.getElementById("close-form-modal").addEventListener("click", closeFormModal);
    document.getElementById("btn-cancel-form").addEventListener("click", closeFormModal);
    document.getElementById("form-modal-overlay").addEventListener("click", closeFormModal);
    document.getElementById("close-position-modal").addEventListener("click", closePositionsModal);
    document.getElementById("position-modal-overlay").addEventListener("click", closePositionsModal);
    document.getElementById("close-employee-management-modal").addEventListener("click", closeEmployeeManagementModal);
    document.getElementById("employee-management-modal-overlay").addEventListener("click", closeEmployeeManagementModal);
    document.getElementById("employee-search").addEventListener("input", (event) => renderEmployeeList(event.target.value));
    document.getElementById("btn-new-employee").addEventListener("click", () => openEmployeeForm());
    document.getElementById("btn-reset-position-form").addEventListener("click", () => resetPositionForm());
    document.getElementById("btn-delete-position").addEventListener("click", () => {
        const id = parseInt(document.getElementById("form-position-id").value, 10);
        if (Number.isInteger(id)) {
            deletePosition(id);
        }
    });
    
    // Edit & Delete actions inside Detail view
    document.getElementById("btn-edit-employee").addEventListener("click", () => {
        const id = parseInt(document.getElementById("btn-edit-employee").dataset.id);
        openEmployeeForm(id);
    });
    
    document.getElementById("btn-delete-employee").addEventListener("click", () => {
        const id = parseInt(document.getElementById("btn-delete-employee").dataset.id);
        const emp = employees.find(e => e.id === id);
        if (emp && confirm(`Are you sure you want to delete ${emp.name}? Any direct reports will report to their manager, keeping the hierarchy connected.`)) {
            deleteEmployee(id);
            closeDetailDrawer();
        }
    });
    
    setupAnnotationListeners();
}

// Update the canvas scale and pan position
function updateCanvasTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
    document.getElementById("zoom-percent").innerText = `${Math.round(currentScale * 100)}%`;
}

// Simple Zoom function
function zoom(factor) {
    const nextScale = Math.max(0.15, Math.min(3.0, currentScale * factor));
    
    // Centering the zoom in the middle of the viewport
    const rect = viewport.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    
    const canvasMidX = (midX - panX) / currentScale;
    const canvasMidY = (midY - panY) / currentScale;
    
    currentScale = nextScale;
    
    panX = midX - canvasMidX * currentScale;
    panY = midY - canvasMidY * currentScale;
    
    updateCanvasTransform();
}

// Helper: get bounding box of all employee cards in canvas-local coordinates
function getTreeContentBounds() {
    const contentElements = document.querySelectorAll(".node-card, .overview-frame");
    if (contentElements.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    contentElements.forEach(element => {
        const r = getCanvasLocalRect(element);
        if (r.width === 0 || r.height === 0) return;
        minX = Math.min(minX, r.x);
        maxX = Math.max(maxX, r.x + r.width);
        minY = Math.min(minY, r.y);
        maxY = Math.max(maxY, r.y + r.height);
    });
    
    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

// Fit organization tree to screen bounds based on actual card positions
function fitToScreen() {
    updateCanvasBounds();
    
    const bounds = getTreeContentBounds();
    if (bounds.width === 0 || bounds.height === 0) return;
    
    const viewportRect = viewport.getBoundingClientRect();
    
    const padding = 80; // Add some breathing room around the tree
    const scaleX = (viewportRect.width - padding * 2) / bounds.width;
    const scaleY = (viewportRect.height - padding * 2) / bounds.height;
    
    currentScale = Math.min(scaleX, scaleY);
    currentScale = Math.max(0.15, Math.min(1.2, currentScale)); // clamp fitting scale
    
    // Center it horizontally, add padding top
    const centerX = bounds.minX + bounds.width / 2;
    panX = (viewportRect.width / 2) - centerX * currentScale;
    panY = 80 - bounds.minY * currentScale;
    
    updateCanvasTransform();
    
    // Redraw connectors in case anything moved
    setTimeout(() => {
        drawConnections();
    }, 50);
}

// Highlight employee and zoom into them
function focusAndHighlightEmployee(id) {
    renderAll(); // Full redraw to clear previous filters/highlights
    const assignedPosition = positions.find(position => position.employeeId === id);
    const targetCardId = assignedPosition ? assignedPosition.id : id;

    const card = document.querySelector(`.node-card[data-id="${targetCardId}"]`);
    if (!card) {
        // Employee might be hidden under a collapsed node. Find and expand path!
        expandPathToEmployee(id);
        renderAll();
    }
    
    // Need a tiny delay for DOM to render the card
    setTimeout(() => {
        const targetCard = document.querySelector(`.node-card[data-id="${targetCardId}"]`);
        if (!targetCard) return;
        
        targetCard.classList.add("highlighted");
        
        // Centering viewport on the target card using canvas-local coordinates
        const viewportRect = viewport.getBoundingClientRect();
        const tLocal = getCanvasLocalRect(targetCard);
        
        // Center the card in the viewport
        panX = (viewportRect.width / 2) - (tLocal.x + tLocal.width / 2) * currentScale;
        panY = (viewportRect.height / 2) - (tLocal.y + tLocal.height / 2) * currentScale;
        
        updateCanvasTransform();
        drawConnections();
        showEmployeeDetails(id);
    }, 100);
}

// Recursively expand all managers of an employee so they are visible
function expandPathToEmployee(id) {
    let position = positions.find(position => position.employeeId === id) || positions.find(position => position.id === id);
    while (position && position.managerId) {
        collapsedNodes.delete(position.managerId);
        position = positions.find(candidate => candidate.id === position.managerId);
    }
}

// Expand / Collapse sub-tree toggle
function toggleNode(id) {
    if (collapsedNodes.has(id)) {
        collapsedNodes.delete(id);
    } else {
        collapsedNodes.add(id);
    }
    
    savePreferences();
    renderAll();
}

// Reset highlights
function clearHighlights() {
    document.querySelectorAll(".node-card").forEach(c => c.classList.remove("highlighted"));
    highlightedConnections.clear();
    drawConnections();
}

/* Rendering Methods */

function renderAll() {
    renderSidebarStats();
    renderSidebarDeptList();
    renderTree();

    const employeeManagementModal = document.getElementById("employee-management-modal");
    if (employeeManagementModal?.classList.contains("active")) {
        renderEmployeeList(document.getElementById("employee-search").value);
    }
}

// Compute counts and populate sidebar
function renderSidebarStats() {
    document.getElementById("total-headcount").innerText = positions.length;
    
    const depts = new Set(positions.map(position => position.department));
    document.getElementById("total-departments").innerText = depts.size;
}

// Build department items list in sidebar
function renderSidebarDeptList() {
    const list = document.getElementById("sidebar-dept-list");
    
    // Group planned positions by department
    const deptCounts = {};
    positions.forEach(position => {
        deptCounts[position.department] = (deptCounts[position.department] || 0) + 1;
    });
    
    // Sort departments alphabetically
    const sortedDepts = Object.keys(deptCounts).sort();
    
    let html = `
        <li class="department-item ${selectedDept === "All" ? "active" : ""}" data-dept="All">
            <span>Overall View</span>
            <span class="department-count">${positions.length}</span>
        </li>
    `;
    
    html += sortedDepts.map(dept => `
        <li class="department-item ${selectedDept === dept ? "active" : ""}" data-dept="${dept}">
            <span>${escapeHTML(dept)}</span>
            <span class="department-count">${deptCounts[dept]}</span>
        </li>
    `).join("");
    
    list.innerHTML = html;
    
    // Add Click listeners to departments
    list.querySelectorAll(".department-item").forEach(item => {
        item.addEventListener("click", () => {
            const dept = item.dataset.dept;
            selectDepartment(dept);
        });
    });
}

// Filter or focus by department
function selectDepartment(dept) {
    selectedDept = dept;
    
    // Update heading labels
    const title = document.getElementById("current-view-title");
    const desc = document.getElementById("current-view-desc");
    
    if (dept === "All") {
        title.innerText = "Overall Organization";
        desc.innerText = "Showing complete hierarchy";
    } else {
        title.innerText = `${dept} Department`;
        desc.innerText = `Focusing on ${dept} department hierarchy`;
    }
    
    renderSidebarDeptList();
    renderTree();
    fitToScreen();
}

function getRootsForDepartment(dept) {
    if (dept === "All") {
        const validIds = new Set(employees.map(e => e.id));
        const roots = employees.filter(e => e.managerId === null || !validIds.has(e.managerId));
        return roots.length > 0 || employees.length === 0 ? roots : [employees[0]];
    }

    const deptEmployees = employees.filter(e => e.department === dept);
    const deptEmployeeIds = new Set(deptEmployees.map(e => e.id));
    const roots = deptEmployees.filter(e => e.managerId === null || !deptEmployeeIds.has(e.managerId));
    return roots.length > 0 || deptEmployees.length === 0 ? roots : [deptEmployees[0]];
}

function buildReportsMap(dept) {
    const reportsMap = {};

    employees.forEach(emp => {
        if (emp.managerId === null) return;

        if (!reportsMap[emp.managerId]) {
            reportsMap[emp.managerId] = [];
        }

        if (dept === "All" || emp.department === dept) {
            reportsMap[emp.managerId].push(emp);
        }
    });

    Object.values(reportsMap).forEach(reports => {
        reports.sort((a, b) => a.name.localeCompare(b.name));
    });

    return reportsMap;
}

function overviewRoleIncludes(emp, roleText) {
    return (emp?.role || "").toLowerCase().includes(roleText.toLowerCase());
}

function overviewMatchesAnyRole(emp, roleTexts) {
    return roleTexts.some(roleText => overviewRoleIncludes(emp, roleText));
}

function buildOverviewFrame(label, className, reports, reportsMap) {
    if (reports.length === 0) return "";

    return `
        <div class="overview-frame ${className} overview-child-group">
            <span class="overview-frame-label">${label}</span>
            ${reports.map(report => buildOverviewNodeHTML(report, reportsMap)).join("")}
        </div>
    `;
}

function buildOverviewChildrenHTML(employee, reports, reportsMap) {
    if (overviewRoleIncludes(employee, "CEO")) {
        const frontReports = reports.filter(report => overviewRoleIncludes(report, "CMO"));
        const operationReports = reports.filter(report => overviewRoleIncludes(report, "COO"));
        const groupedIds = new Set([...frontReports, ...operationReports].map(report => report.id));
        const otherReports = reports.filter(report => !groupedIds.has(report.id));

        return [
            buildOverviewFrame("Front", "overview-front-frame", frontReports, reportsMap),
            buildOverviewFrame("Operation", "overview-operation-frame", operationReports, reportsMap),
            ...otherReports.map(report => buildOverviewNodeHTML(report, reportsMap))
        ].join("");
    }

    if (overviewRoleIncludes(employee, "DOS")) {
        const directRoles = ["Manager of EN", "Manager of BC", "Manager of SG"];
        const specialRoles = ["Manager of SV", "Manager of WT", "Manager of WS/RDF"];
        const directReports = reports.filter(report => overviewMatchesAnyRole(report, directRoles));
        const specialReports = reports.filter(report => overviewMatchesAnyRole(report, specialRoles));
        const groupedIds = new Set([...directReports, ...specialReports].map(report => report.id));
        const otherReports = reports.filter(report => !groupedIds.has(report.id));

        return [
            ...otherReports.map(report => buildOverviewNodeHTML(report, reportsMap)),
            buildOverviewFrame("Direct", "overview-direct-frame", directReports, reportsMap),
            buildOverviewFrame("Special", "overview-special-frame", specialReports, reportsMap)
        ].join("");
    }

    return reports.map(report => buildOverviewNodeHTML(report, reportsMap)).join("");
}

function buildNodeHTML(employee, reportsMap, options = {}) {
    const reports = reportsMap[employee.id] || [];
    const hasReports = reports.length > 0;
    const deptClass = getDeptClass(employee.department);
    const dualRoleCount = employees.filter(e => samePerson(e, employee)).length;
    const isDualRole = dualRoleCount > 1;
    
    let html = `
        <div class="tree-node" data-id="${employee.id}">
            <div class="node-card-wrapper">
                <div class="node-card" draggable="false" style="touch-action: none;" data-id="${employee.id}">
                    <div class="card-header">
                        ${getAvatarHTML(employee)}
                        <div class="card-title-group">
                            <div class="card-name" style="display: flex; align-items: center; gap: 4px; overflow: visible;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(employee.name)}</span>
                                ${isDualRole ? `<span class="dual-role-badge" title="เธกเธตเธซเธฅเธฒเธขเธ•เธณเนเธซเธเนเธเธเธฒเธ (Dual Role)" style="font-size: 8px; color: var(--accent-primary); background-color: var(--accent-light); padding: 2px 4px; border-radius: 4px; font-weight: 700; text-transform: uppercase; line-height: 1; flex-shrink: 0;">Dual</span>` : ''}
                            </div>
                            <div class="card-role">${escapeHTML(employee.role)}</div>
                        </div>
                    </div>
                    <div class="card-department-badge ${deptClass}">
                        ${escapeHTML(employee.department)}
                    </div>
    `;
    
    if (hasReports) {
        const isCollapsed = collapsedNodes.has(employee.id);
        html += `
            <button class="node-toggle-btn ${isCollapsed ? 'collapsed' : ''}" data-id="${employee.id}">
                <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}"></i>
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
    `;
    
    if (hasReports) {
        const isCollapsed = collapsedNodes.has(employee.id);
        const childrenHTML = options.overview
            ? buildOverviewChildrenHTML(employee, reports, reportsMap)
            : reports.map(report => buildNodeHTML(report, reportsMap, options)).join("");

        html += `
            <div class="node-children ${isCollapsed ? 'collapsed' : ''}">
                ${childrenHTML}
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

function buildOverviewNodeHTML(employee, reportsMap) {
    return buildNodeHTML(employee, reportsMap, { overview: true });
}

function wireTreeInteractions() {
    lucide.createIcons();
    
    document.querySelectorAll(".node-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = parseInt(card.dataset.id, 10);
            const position = positions.find(position => position.id === id);
            const employee = position ? getAssignedEmployee(position) : null;

            if (employee) {
                showEmployeeDetails(employee.id);
            } else if (position) {
                openPositionsModal(id);
            }

            document.querySelectorAll(".node-card").forEach(c => c.classList.remove("selected-focus"));
            card.classList.add("selected-focus");
        });

        card.addEventListener("pointerdown", handleCardDragStart);
    });

    document.querySelectorAll(".node-toggle-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id, 10);
            toggleNode(id);
        });
    });
}

function getAssignedEmployee(position) {
    if (!position || position.employeeId === null || position.employeeId === undefined) return null;
    return employees.find(employee => employee.id === position.employeeId) || null;
}

function getPositionTitle(position) {
    return (position?.title || "Open Position").trim();
}

function getPositionDepartment(position) {
    return (position?.department || "Unassigned").trim();
}

function getPositionCardHTML(position) {
    const employee = getAssignedEmployee(position);
    const title = getPositionTitle(position);
    const department = getPositionDepartment(position);
    const deptClass = getDeptClass(department);
    const hasReports = positions.some(child => child.managerId === position.id);
    const isCollapsed = collapsedNodes.has(position.id);
    const isVacant = !employee;
    const dualRoleCount = employee ? positions.filter(candidate => candidate.employeeId === employee.id).length : 0;
    const isDualRole = dualRoleCount > 1;
    const displayName = employee ? employee.name : "VACANT";
    const avatarHTML = employee
        ? getAvatarHTML({ ...employee, department }, "avatar")
        : `<div class="avatar position-vacant-avatar" style="background-color: #f43f5e;">OP</div>`;

    let cardHtml = `
        <div class="node-card absolute-card ${isVacant ? "position-card-vacant" : "position-card-filled"}" data-id="${position.id}" style="position: absolute; left: ${position.x}px; top: ${position.y}px; touch-action: none;">
            <div class="card-header">
                ${avatarHTML}
                <div class="card-title-group">
                    <div class="card-name" style="display: flex; align-items: center; gap: 4px; overflow: visible;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(displayName)}</span>
                        ${isDualRole ? `<span class="dual-role-badge" title="Multiple assigned positions" style="font-size: 8px; color: var(--accent-primary); background-color: var(--accent-light); padding: 2px 4px; border-radius: 4px; font-weight: 700; text-transform: uppercase; line-height: 1; flex-shrink: 0;">Dual</span>` : ""}
                    </div>
                    <div class="card-role">${escapeHTML(title)}</div>
                </div>
            </div>
            <div class="position-card-footer">
                <div class="card-department-badge ${deptClass}">
                    ${escapeHTML(department)}
                </div>
                <span class="${isVacant ? "position-status-vacant" : "position-status-filled"}">
                    ${isVacant ? "Open Position" : "Filled"}
                </span>
            </div>
    `;

    if (hasReports) {
        cardHtml += `
            <button class="node-toggle-btn ${isCollapsed ? "collapsed" : ""}" data-id="${position.id}">
                <i data-lucide="${isCollapsed ? "chevron-down" : "chevron-up"}"></i>
            </button>
        `;
    }

    cardHtml += `</div>`;
    return cardHtml;
}

function renderTree() {
    treeContainer.innerHTML = "";
    svgOverlay.innerHTML = "";

    // 1. Calculate hidden IDs due to collapsed nodes
    const hiddenIds = new Set();
    function markHidden(mgrId, visited) {
        if (!visited) visited = new Set();
        if (visited.has(mgrId)) return;
        visited.add(mgrId);
        positions.forEach(position => {
            if (position.managerId === mgrId) {
                hiddenIds.add(position.id);
                markHidden(position.id, visited);
            }
        });
    }
    collapsedNodes.forEach(id => markHidden(id));

    // 2. Filter visible positions (and by department if selectedDept is not "All")
    let visiblePositions = positions.filter(position => !hiddenIds.has(position.id));
    if (selectedDept !== "All") {
        visiblePositions = visiblePositions.filter(position => position.department === selectedDept);
    }

    // 3. Run auto-layout dynamically to adjust layout and close gaps automatically on visibility/filter changes
    calculateInitialCoordinates();

    // 4. Render cards flat with absolute positioning
    const html = visiblePositions.map(position => getPositionCardHTML(position)).join("");
    treeContainer.innerHTML = html;
    wireTreeInteractions();
    scheduleConnectionDraw();
    renderAnnotations();
}

function drawConnections() {
    svgOverlay.innerHTML = "";
    updateCanvasBounds();

    const visibleCards = document.querySelectorAll(".node-card");
    const visibleCardIds = new Set();
    visibleCards.forEach(card => visibleCardIds.add(parseInt(card.dataset.id)));

    positions.forEach(position => {
        if (!visibleCardIds.has(position.id) || !position.managerId || !visibleCardIds.has(position.managerId)) return;

        const childCard = document.querySelector(`.node-card[data-id="${position.id}"]`);
        const parentCard = document.querySelector(`.node-card[data-id="${position.managerId}"]`);
        if (!childCard || !parentCard) return;

        const pLocal = getCanvasLocalRect(parentCard);
        const cLocal = getCanvasLocalRect(childCard);
        if (pLocal.width === 0 || pLocal.height === 0 || cLocal.width === 0 || cLocal.height === 0) return;

        const parentPosition = positions.find(p => p.id === position.managerId);
        const isVerticalLayout = parentPosition && parentPosition.layoutStyle === "vertical";

        let pathParts;
        if (isVerticalLayout) {
            const startX = pLocal.x + pLocal.width / 2;
            const startY = pLocal.y + pLocal.height;
            const endX = cLocal.x; // connect to the left edge of the child card
            const endY = cLocal.y + cLocal.height / 2; // vertical center of the child card

            pathParts = [
                `M ${startX} ${startY}`,
                `L ${startX} ${endY}`,
                `L ${endX} ${endY}`
            ];
        } else {
            const startX = pLocal.x + pLocal.width / 2;
            const startY = pLocal.y + pLocal.height;
            const endX = cLocal.x + cLocal.width / 2;
            const endY = cLocal.y;

            // Calculate the minimum Y among all visible children of this manager to keep the horizontal bus line at the sibling level
            const childrenPositions = positions.filter(p => p.managerId === position.managerId && visibleCardIds.has(p.id));
            const childYs = childrenPositions.map(p => {
                const card = document.querySelector(`.node-card[data-id="${p.id}"]`);
                if (card) {
                    const rect = getCanvasLocalRect(card);
                    return rect.y;
                }
                return p.y;
            }).filter(y => y !== undefined && y !== null);
            
            const minChildY = childYs.length > 0 ? Math.min(...childYs) : endY;
            const busY = startY + Math.max(20, (minChildY - startY) / 2);

            pathParts = [
                `M ${startX} ${startY}`,
                `L ${startX} ${busY}`,
                `L ${endX} ${busY}`,
                `L ${endX} ${endY}`
            ];
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathParts.join(" "));
        path.setAttribute("class", "connection-path");
        
        if (highlightedConnections.has(`${position.managerId}-${position.id}`)) {
            path.setAttribute("class", "connection-path highlighted");
        }
        svgOverlay.appendChild(path);
    });
}

function calculateInitialCoordinates() {
    // 1. Determine which positions are currently visible (active)
    const hiddenIds = new Set();
    function markHidden(mgrId, visited) {
        if (!visited) visited = new Set();
        if (visited.has(mgrId)) return;
        visited.add(mgrId);
        positions.forEach(pos => {
            if (pos.managerId === mgrId) {
                hiddenIds.add(pos.id);
                markHidden(pos.id, visited);
            }
        });
    }
    collapsedNodes.forEach(id => markHidden(id));
    
    let activePositions = positions.filter(pos => !hiddenIds.has(pos.id));
    if (selectedDept !== "All") {
        activePositions = activePositions.filter(pos => pos.department === selectedDept);
    }

    if (activePositions.length === 0) return;

    const activeIds = new Set(activePositions.map(p => p.id));
    
    // 2. Find roots within active positions
    const roots = activePositions.filter(position => position.managerId === null || !activeIds.has(position.managerId));
    
    // Dynamic spacing based on active positions count
    const totalCount = activePositions.length;
    let xSpacing = 260;    // default sibling width allocated (220 width + 40 gap)
    let ySpacing = 220;    // default vertical gap (100 height + 120 gap)
    let rootSpacing = 150; // default horizontal gap between independent root trees

    if (totalCount <= 8) {
        xSpacing = 236;    // 220 width + 16 gap
        ySpacing = 160;    // 100 height + 60 gap
        rootSpacing = 80;
    } else if (totalCount <= 20) {
        xSpacing = 250;    // 220 width + 30 gap
        ySpacing = 190;    // 100 height + 90 gap
        rootSpacing = 120;
    } else if (totalCount > 40) {
        xSpacing = 280;    // 220 width + 60 gap
        ySpacing = 245;    // 100 height + 145 gap
        rootSpacing = 200;
    }

    const reportsMap = {};
    activePositions.forEach(position => {
        if (position.managerId !== null && activeIds.has(position.managerId)) {
            if (!reportsMap[position.managerId]) reportsMap[position.managerId] = [];
            reportsMap[position.managerId].push(position);
        }
    });
    for (let key in reportsMap) {
        reportsMap[key].sort((a, b) => getPositionTitle(a).localeCompare(getPositionTitle(b)));
    }

    const subtreeWidths = {};
    const subtreeHeights = {};
    const visitedWidths = new Set();
    
    function computeWidthsAndHeights(positionId) {
        if (visitedWidths.has(positionId)) return 0;
        visitedWidths.add(positionId);

        const children = reportsMap[positionId] || [];
        const position = positions.find(p => p.id === positionId);
        
        if (children.length === 0) {
            subtreeWidths[positionId] = xSpacing;
            subtreeHeights[positionId] = 140; // default height for a leaf node
            return xSpacing;
        }

        const isVertical = position && position.layoutStyle === "vertical";
        
        if (isVertical) {
            // Children are stacked vertically, so width is just xSpacing
            subtreeWidths[positionId] = xSpacing;
            
            let totalHeight = 140; // height for parent itself
            children.forEach(child => {
                computeWidthsAndHeights(child.id);
                totalHeight += (subtreeHeights[child.id] || 140);
            });
            subtreeHeights[positionId] = totalHeight;
            return xSpacing;
        } else {
            // Horizontal layout (default)
            let width = 0;
            let maxHeight = 0;
            children.forEach(child => {
                width += computeWidthsAndHeights(child.id);
                maxHeight = Math.max(maxHeight, subtreeHeights[child.id] || 140);
            });
            subtreeWidths[positionId] = Math.max(xSpacing, width);
            subtreeHeights[positionId] = ySpacing + maxHeight;
            return subtreeWidths[positionId];
        }
    }
    roots.forEach(root => computeWidthsAndHeights(root.id));

    const assignedCoords = new Set();

    function assignCoords(position, xStart, y) {
        if (assignedCoords.has(position.id)) return;
        assignedCoords.add(position.id);

        const children = reportsMap[position.id] || [];
        const w = subtreeWidths[position.id] || xSpacing;

        // If this position was manually dragged, keep its custom coordinates and adjust childXStart
        // Only honor manual positioning within individual department views, not in overview ("All")
        const useManual = selectedDept !== "All" && position.isManual && position.x !== undefined && position.x !== null && position.y !== undefined && position.y !== null;
        if (useManual) {
            xStart = position.x + 110 - w / 2;
        } else {
            const myX = xStart + w / 2;
            position.x = Math.round(myX - 110);
            position.y = Math.round(y);
        }
        
        const isVertical = position.layoutStyle === "vertical";
        
        if (isVertical) {
            // Stack children vertically under the parent
            let currentChildY = position.y + 140; // Start below the parent
            children.forEach(child => {
                // Place child shifted horizontally to the right
                const childXStart = position.x + 110 - (subtreeWidths[child.id] || xSpacing) / 2 + 140;
                assignCoords(child, childXStart, currentChildY);
                currentChildY += (subtreeHeights[child.id] || 140);
            });
        } else {
            // Standard horizontal sibling layout
            let childXStart = xStart;
            children.forEach(child => {
                assignCoords(child, childXStart, position.y + ySpacing);
                childXStart += (subtreeWidths[child.id] || xSpacing);
            });
        }
    }

    let currentXStart = 200;
    roots.forEach(root => {
        assignCoords(root, currentXStart, 150);
        currentXStart += (subtreeWidths[root.id] || xSpacing) + rootSpacing;
    });
}

function scheduleConnectionDraw() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            drawConnections();
            setTimeout(() => drawConnections(), 300);
        });
    });
}

// Helper: get element's position in canvas-local coordinates (unaffected by CSS transform)
function getCanvasLocalRect(el) {
    // Walk up the DOM accumulating offsetTop/offsetLeft until we reach chart-canvas
    let x = 0, y = 0;
    let cur = el;
    while (cur && cur !== canvas) {
        x += cur.offsetLeft;
        y += cur.offsetTop;
        cur = cur.offsetParent;
    }
    return { x, y, width: el.offsetWidth, height: el.offsetHeight };
}

// Update the SVG overlay bounds based on all employee cards
function updateCanvasBounds() {
    const minWidth = 20000;
    const minHeight = 10000;
    const padding = 600;
    const contentElements = document.querySelectorAll(".node-card, .overview-frame");
    let maxX = minWidth;
    let maxY = minHeight;

    contentElements.forEach(element => {
        const r = getCanvasLocalRect(element);
        if (r.width === 0 || r.height === 0) return;
        maxX = Math.max(maxX, r.x + r.width);
        maxY = Math.max(maxY, r.y + r.height);
    });

    const width = Math.max(minWidth, Math.ceil(maxX) + padding);
    const height = Math.max(minHeight, Math.ceil(maxY) + padding);

    svgOverlay.setAttribute("width", width);
    svgOverlay.setAttribute("height", height);
    svgOverlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
}


// Window resize handler to redraw connections
window.addEventListener("resize", () => {
    drawConnections();
});

/* Drawer: Employee Details Profile Slide-out */

function showEmployeeDetails(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    // Add active classes
    document.getElementById("detail-drawer-overlay").classList.add("active");
    const drawer = document.getElementById("detail-drawer");
    drawer.classList.add("active");
    
    // Setup Action button IDs
    document.getElementById("btn-edit-employee").dataset.id = id;
    document.getElementById("btn-delete-employee").dataset.id = id;
    
    // Find manager name
    const manager = emp.managerId ? employees.find(e => e.id === emp.managerId) : null;
    const managerHTML = manager ? `
        <div class="mini-profile-card" onclick="focusAndHighlightEmployee(${manager.id})">
            ${getAvatarHTML(manager, "avatar-sm")}
            <div class="mini-profile-info">
                <h5>${escapeHTML(manager.name)}</h5>
                <p>${escapeHTML(manager.role)} • ${escapeHTML(manager.department)}</p>
            </div>
        </div>
    ` : `<p style="font-size: 13px; color: var(--text-tertiary); font-style: italic;">No manager (Top level)</p>`;
    
    // Find direct reports
    const reports = employees.filter(e => e.managerId === id);
    let reportsHTML = `<p style="font-size: 13px; color: var(--text-tertiary); font-style: italic;">No direct reports</p>`;
    
    if (reports.length > 0) {
        reportsHTML = `
            <div class="reports-list">
                ${reports.map(rep => `
                    <div class="mini-profile-card" onclick="focusAndHighlightEmployee(${rep.id})">
                        ${getAvatarHTML(rep, "avatar-sm")}
                        <div class="mini-profile-info">
                            <h5>${escapeHTML(rep.name)}</h5>
                            <p>${escapeHTML(rep.role)} • ${escapeHTML(rep.department)}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }
    
    // Find sibling positions for the same person (dual-position profile)
    const siblingPositions = employees.filter(e => samePerson(e, emp) && e.id !== emp.id);
    let siblingsHTML = "";
    if (siblingPositions.length > 0) {
        siblingsHTML = `
            <div>
                <div class="info-section-title">ตำแหน่งงานอื่น ๆ ของพนักงานคนนี้ (${siblingPositions.length})</div>
                <div class="reports-list">
                    ${siblingPositions.map(pos => {
                        const mgr = pos.managerId ? employees.find(e => e.id === pos.managerId) : null;
                        return `
                            <div class="mini-profile-card" onclick="focusAndHighlightEmployee(${pos.id})">
                                ${getAvatarHTML(pos, "avatar-sm")}
                                <div class="mini-profile-info">
                                    <h5>${escapeHTML(pos.role)}</h5>
                                    <p>${escapeHTML(pos.department)} • หัวหน้า: ${mgr ? escapeHTML(mgr.name) : 'ระดับสูงสุด (Top Level)'}</p>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }
    
    const body = document.getElementById("detail-drawer-body");
    const deptClass = getDeptClass(emp.department);
    
    body.innerHTML = `
        <div class="profile-card-large">
            ${getAvatarHTML(emp, "avatar-lg")}
            <div class="profile-name">${escapeHTML(emp.name)}</div>
            <div class="profile-role">${escapeHTML(emp.role)}</div>
            <div class="card-department-badge ${deptClass}">${escapeHTML(emp.department)}</div>
        </div>
        
        <div>
            <div class="info-section-title">Contact Details</div>
            
            <div class="info-item">
                <div class="info-icon-wrapper"><i data-lucide="mail"></i></div>
                <div class="info-content">
                    <span class="info-label">Email</span>
                    <a href="mailto:${emp.email}" class="info-value link">${escapeHTML(emp.email || "N/A")}</a>
                </div>
            </div>
            
            <div class="info-item">
                <div class="info-icon-wrapper"><i data-lucide="phone"></i></div>
                <div class="info-content">
                    <span class="info-label">Phone</span>
                    <a href="tel:${emp.phone}" class="info-value link">${escapeHTML(emp.phone || "N/A")}</a>
                </div>
            </div>
        </div>
        
        <div>
            <div class="info-section-title">Reports To</div>
            ${managerHTML}
        </div>
        
        <div>
            <div class="info-section-title">Direct Reports (${reports.length})</div>
            ${reportsHTML}
        </div>
        
        ${siblingsHTML}
        
        ${emp.bio ? `
            <div>
                <div class="info-section-title">Bio / Notes</div>
                <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); background-color: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">${escapeHTML(emp.bio)}</p>
            </div>
        ` : ""}
    `;
    
    lucide.createIcons();
}

function closeDetailDrawer() {
    document.getElementById("detail-drawer-overlay").classList.remove("active");
    document.getElementById("detail-drawer").classList.remove("active");
    document.querySelectorAll(".node-card").forEach(c => c.classList.remove("selected-focus"));
}

/* Modals: CRUD Form management */

function populatePersonDatalist() {
    const personList = document.getElementById("person-list");
    personList.innerHTML = getUniquePersonProfiles()
        .map(profile => `<option value="${escapeHTML(getPersonOptionLabel(profile))}">`)
        .join("");
}

function applySelectedPersonProfile() {
    const linkInput = document.getElementById("form-person-link");
    const profile = findPersonProfileFromInput(linkInput.value);
    if (!profile) return;

    document.getElementById("form-person-id").value = profile.personId;
    document.getElementById("form-name").value = profile.name || "";
    document.getElementById("form-email").value = profile.email || "";
    document.getElementById("form-phone").value = profile.phone || "";
    document.getElementById("form-bio").value = profile.bio || "";
    document.getElementById("form-photo-data").value = profile.photoUrl || "";
    setPhotoPreview(profile.photoUrl || "", profile.name || "");
}

function openEmployeeForm(editId = null) {
    const modal = document.getElementById("form-modal");
    const overlay = document.getElementById("form-modal-overlay");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("employee-form");
    
    // Clear and reset form
    form.reset();
    document.getElementById("form-employee-id").value = "";
    document.getElementById("form-person-id").value = "";
    document.getElementById("form-photo-data").value = "";
    setPhotoPreview("");
    populatePersonDatalist();
    
    // Populate Managers Datalist
    const managerInput = document.getElementById("form-manager");
    const managerDatalist = document.getElementById("manager-list");
    managerDatalist.innerHTML = "";
    
    let eligibleManagers = [...employees];
    
    if (editId) {
        title.innerText = "Edit Employee Details";
        document.getElementById("form-employee-id").value = editId;
        
        const emp = employees.find(e => e.id === editId);
        if (emp) {
            document.getElementById("form-person-id").value = emp.personId || "";
            document.getElementById("form-person-link").value = emp.personId ? getPersonOptionLabel(getPersonProfile(emp.personId) || emp) : "";
            document.getElementById("form-photo-data").value = emp.photoUrl || "";
            setPhotoPreview(emp.photoUrl || "", emp.name);
            document.getElementById("form-name").value = emp.name;
            document.getElementById("form-role").value = emp.role;
            document.getElementById("form-department").value = emp.department;
            document.getElementById("form-email").value = emp.email || "";
            document.getElementById("form-phone").value = emp.phone || "";
            document.getElementById("form-bio").value = emp.bio || "";
            
            // To prevent cyclic management, exclude themselves and any of their reports
            const descendantIds = getDescendantIds(editId);
            eligibleManagers = employees.filter(e => e.id !== editId && !descendantIds.includes(e.id));
        }
    } else {
        title.innerText = "Add New Employee";
    }
    
    // Sort managers alphabetically
    eligibleManagers.sort((a, b) => a.name.localeCompare(b.name));
    
    eligibleManagers.forEach(mgr => {
        managerDatalist.innerHTML += `<option value="${escapeHTML(mgr.name)} (${escapeHTML(mgr.role)} • ${escapeHTML(mgr.department)})">`;
    });
    
    if (editId) {
        const emp = employees.find(e => e.id === editId);
        if (emp && emp.managerId) {
            const mgr = employees.find(e => e.id === emp.managerId);
            if (mgr) {
                managerInput.value = `${mgr.name} (${mgr.role} • ${mgr.department})`;
            } else {
                managerInput.value = "";
            }
        } else {
            managerInput.value = "";
        }
    } else {
        managerInput.value = "";
    }
    
    // Populate Department Suggestions Datalist
    const deptList = document.getElementById("department-list");
    const uniqueDepts = [...new Set(employees.map(e => e.department))].sort();
    deptList.innerHTML = uniqueDepts.map(dept => `<option value="${escapeHTML(dept)}">`).join("");
    
    overlay.classList.add("active");
    modal.classList.add("active");
}

function closeFormModal() {
    document.getElementById("form-modal-overlay").classList.remove("active");
    document.getElementById("form-modal").classList.remove("active");
}

function getNextPositionId() {
    return positions.length > 0 ? Math.max(...positions.map(position => position.id)) + 1 : 1;
}

function getPositionOptionLabel(position) {
    const employee = getAssignedEmployee(position);
    const assignee = employee ? ` - ${employee.name}` : " - VACANT";
    return `${getPositionTitle(position)} (${getPositionDepartment(position)}) #${position.id}${assignee}`;
}

function findPositionFromInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const idMatch = trimmed.match(/#(\d+)/);
    if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const byId = positions.find(position => position.id === id);
        if (byId) return byId;
    }

    return positions.find(position =>
        getPositionOptionLabel(position) === trimmed ||
        getPositionTitle(position) === trimmed ||
        String(position.id) === trimmed
    ) || null;
}

function getEmployeeOptionLabel(employee) {
    return `${employee.name} (${employee.role} - ${employee.department}) #${employee.id}`;
}

function findEmployeeFromInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const idMatch = trimmed.match(/#(\d+)/);
    if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const byId = employees.find(employee => employee.id === id);
        if (byId) return byId;
    }

    return employees.find(employee =>
        getEmployeeOptionLabel(employee) === trimmed ||
        employee.name === trimmed ||
        String(employee.id) === trimmed
    ) || null;
}

function getPrimaryPositionForEmployee(employeeId) {
    return positions.find(position => position.employeeId === employeeId) || null;
}

function getPositionManagerIdFromEmployeeManager(managerEmployeeId, childPosition = null) {
    if (!managerEmployeeId) return null;
    if (childPosition?.employeeId === managerEmployeeId) return null;
    const managerPositions = positions.filter(p => p.employeeId === managerEmployeeId);
    if (managerPositions.length === 0) return null;
    if (managerPositions.length === 1) return managerPositions[0].id;
    
    if (childPosition && childPosition.department) {
        const matchingPos = managerPositions.find(p => p.id !== childPosition.id && p.department === childPosition.department);
        if (matchingPos) return matchingPos.id;
    }
    
    return managerPositions.find(p => p.id !== childPosition?.id)?.id || null;
}

function getDescendantPositionIds(positionId) {
    const descendants = [];
    const queue = [positionId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        positions.forEach(position => {
            if (position.managerId === currentId) {
                descendants.push(position.id);
                queue.push(position.id);
            }
        });
    }

    return descendants;
}

function getAutoPositionForPosition(managerId, excludePositionId = null) {
    let newX = 200;
    let newY = 150;

    if (managerId !== null) {
        const manager = positions.find(position => position.id === managerId);
        if (manager) {
            newY = manager.y !== undefined && manager.y !== null ? manager.y + 220 : 150;

            const siblings = positions.filter(position => position.managerId === managerId && position.id !== excludePositionId);
            if (siblings.length > 0) {
                const validSiblingXs = siblings
                    .filter(position => position.x !== undefined && position.x !== null)
                    .map(position => position.x);
                newX = validSiblingXs.length > 0
                    ? Math.max(...validSiblingXs) + 260
                    : (manager.x !== undefined && manager.x !== null ? manager.x : 200);
            } else {
                newX = manager.x !== undefined && manager.x !== null ? manager.x : 200;
            }
        }
    } else {
        const roots = positions.filter(position => position.managerId === null && position.id !== excludePositionId);
        if (roots.length > 0) {
            const validRootXs = roots
                .filter(position => position.x !== undefined && position.x !== null)
                .map(position => position.x);
            if (validRootXs.length > 0) {
                newX = Math.max(...validRootXs) + 300;
            }
        }
    }

    return { x: newX, y: newY };
}

function populatePositionFormLookups(excludePositionId = null) {
    const positionDeptList = document.getElementById("position-department-list");
    const managerList = document.getElementById("position-manager-list");
    const employeeList = document.getElementById("position-employee-list");

    const departments = [...new Set([
        ...positions.map(position => getPositionDepartment(position)),
        ...employees.map(employee => employee.department)
    ].filter(Boolean))].sort();
    positionDeptList.innerHTML = departments.map(department => `<option value="${escapeHTML(department)}">`).join("");

    const blockedIds = excludePositionId ? new Set([excludePositionId, ...getDescendantPositionIds(excludePositionId)]) : new Set();
    managerList.innerHTML = positions
        .filter(position => !blockedIds.has(position.id))
        .sort((a, b) => getPositionTitle(a).localeCompare(getPositionTitle(b)))
        .map(position => `<option value="${escapeHTML(getPositionOptionLabel(position))}">`)
        .join("");

    employeeList.innerHTML = employees
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(employee => `<option value="${escapeHTML(getEmployeeOptionLabel(employee))}">`)
        .join("");
}

function resetPositionForm(editId = null) {
    const form = document.getElementById("position-form");
    form.reset();
    document.getElementById("form-position-id").value = "";
    document.getElementById("btn-delete-position").disabled = true;
    populatePositionFormLookups(editId);

    if (editId === null) return;

    const position = positions.find(position => position.id === editId);
    if (!position) return;

    document.getElementById("form-position-id").value = position.id;
    document.getElementById("form-position-title").value = getPositionTitle(position);
    document.getElementById("form-position-department").value = getPositionDepartment(position);
    document.getElementById("form-position-layout").value = position.layoutStyle || "horizontal";
    document.getElementById("form-position-notes").value = position.notes || "";
    document.getElementById("btn-delete-position").disabled = false;

    const manager = position.managerId ? positions.find(candidate => candidate.id === position.managerId) : null;
    document.getElementById("form-position-manager").value = manager ? getPositionOptionLabel(manager) : "";

    const employee = getAssignedEmployee(position);
    document.getElementById("form-position-employee").value = employee ? getEmployeeOptionLabel(employee) : "";
}

function openPositionsModal() {
    const editId = arguments.length > 0 ? arguments[0] : null;
    document.getElementById("position-modal-overlay").classList.add("active");
    document.getElementById("position-modal").classList.add("active");
    renderPositionsList();
    resetPositionForm(editId);
    lucide.createIcons();
}

function closePositionsModal() {
    document.getElementById("position-modal-overlay").classList.remove("active");
    document.getElementById("position-modal").classList.remove("active");
}

function openEmployeeManagementModal() {
    document.getElementById("employee-management-modal-overlay").classList.add("active");
    document.getElementById("employee-management-modal").classList.add("active");
    document.getElementById("employee-search").value = "";
    renderEmployeeList();
    lucide.createIcons();
}

function closeEmployeeManagementModal() {
    document.getElementById("employee-management-modal-overlay").classList.remove("active");
    document.getElementById("employee-management-modal").classList.remove("active");
}

function getEmployeeListSearchText(employee) {
    return [employee.name, employee.role, employee.department, employee.email]
        .map(value => String(value || "").toLowerCase())
        .join(" ");
}

function renderEmployeeList(query = "") {
    const list = document.getElementById("employee-list");
    const summary = document.getElementById("employee-summary");
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const matchingEmployees = employees
        .filter(employee => getEmployeeListSearchText(employee).includes(normalizedQuery))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    summary.innerText = `${matchingEmployees.length} of ${employees.length} employees`;

    if (matchingEmployees.length === 0) {
        list.innerHTML = `<div class="employee-empty-state">${employees.length === 0 ? "No employees yet" : "No employees match your search"}</div>`;
        return;
    }

    list.innerHTML = matchingEmployees.map(employee => {
        const source = EmployeeDirectory.getEmployeeSource(employee);
        const assignment = EmployeeDirectory.getAssignmentSummary(employee.id, positions);
        const assignmentText = assignment.count === 0
            ? "Unassigned"
            : `${assignment.count} assigned position${assignment.count === 1 ? "" : "s"}`;
        return `
            <button type="button" class="employee-row" data-employee-id="${employee.id}">
                <span class="employee-row-main">
                    <strong>${escapeHTML(employee.name || "Unnamed employee")}</strong>
                    <small>${escapeHTML(employee.role || "No role")} - ${escapeHTML(employee.department || "No department")}</small>
                </span>
                <span class="employee-row-meta">
                    <span class="employee-source-badge">${source === "manual" ? "Manual" : "Microsoft"}</span>
                    <span class="employee-assignment-state ${assignment.status === "unassigned" ? "is-unassigned" : ""}">${assignmentText}</span>
                </span>
            </button>
        `;
    }).join("");

    list.querySelectorAll(".employee-row").forEach(row => {
        row.addEventListener("click", () => openEmployeeForm(parseInt(row.dataset.employeeId, 10)));
    });
}

function renderPositionsList() {
    const list = document.getElementById("positions-list");
    const summary = document.getElementById("positions-summary");
    const vacantCount = positions.filter(position => !getAssignedEmployee(position)).length;

    summary.innerText = `${positions.length} positions - ${vacantCount} vacant`;

    if (positions.length === 0) {
        list.innerHTML = `<div class="positions-empty">No positions yet</div>`;
        return;
    }

    const sortedPositions = positions
        .slice()
        .sort((a, b) => {
            const deptCompare = getPositionDepartment(a).localeCompare(getPositionDepartment(b));
            return deptCompare !== 0 ? deptCompare : getPositionTitle(a).localeCompare(getPositionTitle(b));
        });

    list.innerHTML = sortedPositions.map(position => {
        const employee = getAssignedEmployee(position);
        const manager = position.managerId ? positions.find(candidate => candidate.id === position.managerId) : null;
        return `
            <button type="button" class="position-row ${employee ? "" : "is-vacant"}" data-id="${position.id}">
                <span class="position-row-main">
                    <strong>${escapeHTML(getPositionTitle(position))}</strong>
                    <small>${escapeHTML(getPositionDepartment(position))}</small>
                </span>
                <span class="position-row-meta">
                    <span>${employee ? escapeHTML(employee.name) : "VACANT"}</span>
                    <small>${manager ? `Reports to ${escapeHTML(getPositionTitle(manager))}` : "Top level"}</small>
                </span>
            </button>
        `;
    }).join("");

    list.querySelectorAll(".position-row").forEach(row => {
        row.addEventListener("click", () => {
            const id = parseInt(row.dataset.id, 10);
            resetPositionForm(id);
        });
    });
}

async function handlePositionFormSubmit(e) {
    e.preventDefault();

    const idVal = document.getElementById("form-position-id").value;
    const title = document.getElementById("form-position-title").value.trim();
    const department = document.getElementById("form-position-department").value.trim();
    const managerInputVal = document.getElementById("form-position-manager").value.trim();
    const employeeInputVal = document.getElementById("form-position-employee").value.trim();
    const layoutStyle = document.getElementById("form-position-layout").value;
    const notes = document.getElementById("form-position-notes").value.trim();

    if (!title || !department) {
        showNotification("Please fill in all required position fields", "error");
        return;
    }

    const currentId = idVal ? parseInt(idVal, 10) : null;
    let managerId = null;
    if (managerInputVal) {
        const manager = findPositionFromInput(managerInputVal);
        if (!manager) {
            showNotification("Reports To position is not valid", "error");
            return;
        }

        managerId = manager.id;
        if (currentId && managerId === currentId) {
            showNotification("A position cannot report to itself", "error");
            return;
        }
        if (currentId && getDescendantPositionIds(currentId).includes(managerId)) {
            showNotification("A position cannot report to its own child position", "error");
            return;
        }
    }

    let employeeId = null;
    if (employeeInputVal) {
        const employee = findEmployeeFromInput(employeeInputVal);
        if (!employee) {
            showNotification("Assigned employee is not valid", "error");
            return;
        }
        employeeId = employee.id;
    }

    let savedPositionId = currentId;
    if (currentId) {
        const index = positions.findIndex(position => position.id === currentId);
        if (index === -1) return;

        const oldManagerId = positions[index].managerId;
        const managerChanged = oldManagerId !== managerId;
        positions[index] = {
            ...positions[index],
            title,
            department,
            managerId,
            employeeId,
            layoutStyle,
            notes
        };

        if (managerChanged) {
            const autoPos = getAutoPositionForPosition(managerId, currentId);
            const dx = autoPos.x - (positions[index].x || 0);
            const dy = autoPos.y - (positions[index].y || 0);
            positions[index].x = autoPos.x;
            positions[index].y = autoPos.y;

            getDescendantPositionIds(currentId).forEach(descId => {
                const descIndex = positions.findIndex(position => position.id === descId);
                if (descIndex > -1) {
                    positions[descIndex].x = (positions[descIndex].x || 0) + dx;
                    positions[descIndex].y = (positions[descIndex].y || 0) + dy;
                }
            });
        }

        showNotification(`Updated position: ${title}`, "success");
    } else {
        const newId = getNextPositionId();
        savedPositionId = newId;
        const autoPos = getAutoPositionForPosition(managerId);
        positions.push({
            id: newId,
            title,
            department,
            managerId,
            employeeId,
            layoutStyle,
            x: autoPos.x,
            y: autoPos.y,
            notes
        });
        showNotification(`Added position: ${title}`, "success");
    }

    // Only a person's primary position controls the employee-level manager field.
    if (employeeId && OrgHierarchy.isPrimaryEmployeePosition(positions, savedPositionId, employeeId)) {
        const empIndex = employees.findIndex(e => e.id === employeeId);
        if (empIndex > -1) {
            let nextEmployeeManagerId = null;
            let canSyncManager = true;
            if (managerId) {
                const mgrPos = positions.find(p => p.id === managerId);
                if (mgrPos && mgrPos.employeeId && mgrPos.employeeId !== employeeId) {
                    nextEmployeeManagerId = mgrPos.employeeId;
                } else if (mgrPos?.employeeId === employeeId) {
                    canSyncManager = false;
                }
            }
            if (canSyncManager && employees[empIndex].managerId !== nextEmployeeManagerId) {
                employees[empIndex].managerId = nextEmployeeManagerId;
                await saveData();
            }
        }
    }

    await savePositions();
    renderAll();
    renderPositionsList();
    resetPositionForm();
}

async function deletePosition(id) {
    const positionToDelete = positions.find(position => position.id === id);
    if (!positionToDelete) return;

    if (!confirm(`Delete position "${getPositionTitle(positionToDelete)}"? Child positions will move up one level.`)) {
        return;
    }

    const parentManagerId = positionToDelete.managerId;
    positions.forEach(position => {
        if (position.managerId === id) {
            position.managerId = parentManagerId;
        }
    });

    positions = positions.filter(position => position.id !== id);
    collapsedNodes.delete(id);

    await savePositions();
    await savePreferences();
    renderAll();
    renderPositionsList();
    resetPositionForm();
    showNotification(`Deleted position: ${getPositionTitle(positionToDelete)}`, "info");
}

// Calculate the automatic coordinates for a new or relocated employee card
function getAutoPositionForNode(managerId, excludeEmployeeId = null) {
    let newX = 200;
    let newY = 150;

    if (managerId !== null) {
        const manager = employees.find(e => e.id === managerId);
        if (manager) {
            newY = (manager.y !== undefined && manager.y !== null) ? manager.y + 220 : 150;

            const siblings = employees.filter(e => e.managerId === managerId && e.id !== excludeEmployeeId);
            if (siblings.length > 0) {
                const validSiblingXs = siblings.filter(s => s.x !== undefined && s.x !== null).map(s => s.x);
                if (validSiblingXs.length > 0) {
                    newX = Math.max(...validSiblingXs) + 260;
                } else {
                    newX = (manager.x !== undefined && manager.x !== null) ? manager.x : 200;
                }
            } else {
                newX = (manager.x !== undefined && manager.x !== null) ? manager.x : 200;
            }
        }
    } else {
        const roots = employees.filter(e => e.managerId === null && e.id !== excludeEmployeeId);
        if (roots.length > 0) {
            const validRootXs = roots.filter(r => r.x !== undefined && r.x !== null).map(r => r.x);
            if (validRootXs.length > 0) {
                newX = Math.max(...validRootXs) + 300;
            }
        }
    }
    return { x: newX, y: newY };
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const idVal = document.getElementById("form-employee-id").value;
    const selectedPersonProfile = findPersonProfileFromInput(document.getElementById("form-person-link").value);
    const name = document.getElementById("form-name").value.trim();
    const role = document.getElementById("form-role").value.trim();
    const department = document.getElementById("form-department").value.trim();
    const managerInputVal = document.getElementById("form-manager").value.trim();
    const email = document.getElementById("form-email").value.trim();
    const phone = document.getElementById("form-phone").value.trim();
    const bio = document.getElementById("form-bio").value.trim();
    const photoUrl = document.getElementById("form-photo-data").value;
    let managerId = null;
    
    if (managerInputVal) {
        // Try to find a manager that matches the input string
        const matchedMgr = employees.find(mgr => {
            const optionText = `${mgr.name} (${mgr.role} • ${mgr.department})`;
            return optionText === managerInputVal || mgr.name === managerInputVal;
        });
        if (matchedMgr) {
            managerId = matchedMgr.id;
            
            // Check for cyclical relationship
            if (idVal) {
                const currentId = parseInt(idVal);
                if (managerId === currentId) {
                    showNotification("ไม่สามารถตั้งตัวเองเป็นผู้จัดการได้", "error");
                    return;
                }
                const descendantIds = getDescendantIds(currentId);
                if (descendantIds.includes(managerId)) {
                    showNotification("ไม่สามารถเลือกผู้ใต้บังคับบัญชาเป็นผู้จัดการได้ (สายงานเป็นวงกลม)", "error");
                    return;
                }
            }
        } else {
            showNotification("ชื่อผู้จัดการไม่ถูกต้องหรือไม่มีในระบบ", "error");
            return;
        }
    }
    
    if (!name || !role || !department) {
        showNotification("Please fill in all required fields", "error");
        return;
    }
    
    if (idVal) {
        // Edit mode
        const id = parseInt(idVal);
        const empIndex = employees.findIndex(e => e.id === id);
        if (empIndex > -1) {
            const currentPersonId = employees[empIndex].personId || createPersonId(employees[empIndex].name, id);
            const nextPersonId = selectedPersonProfile?.personId || document.getElementById("form-person-id").value || currentPersonId;
            
            const oldManagerId = employees[empIndex].managerId;
            const managerChanged = oldManagerId !== managerId;
            // Update fields
            employees[empIndex].personId = nextPersonId;
            employees[empIndex].role = role;
            employees[empIndex].department = department;
            employees[empIndex].managerId = managerId;
            employees[empIndex].name = name;
            employees[empIndex].email = email;
            employees[empIndex].phone = phone;
            employees[empIndex].bio = bio;
            employees[empIndex].photoUrl = photoUrl;
            
            // Department color update check (if changed, keep or randomize)
            if (employees[empIndex].department.toLowerCase() !== department.toLowerCase()) {
                employees[empIndex].avatarColor = getDeptColor(department);
            }
            
            // If the manager has changed, auto-position the employee and their descendants under the new manager
            if (managerChanged) {
                const autoPos = getAutoPositionForNode(managerId, id);
                const dx = autoPos.x - (employees[empIndex].x || 0);
                const dy = autoPos.y - (employees[empIndex].y || 0);

                employees[empIndex].x = autoPos.x;
                employees[empIndex].y = autoPos.y;

                const descendantIds = getDescendantIds(id);
                descendantIds.forEach(descId => {
                    const descIndex = employees.findIndex(e => e.id === descId);
                    if (descIndex > -1) {
                        employees[descIndex].x = (employees[descIndex].x || 0) + dx;
                        employees[descIndex].y = (employees[descIndex].y || 0) + dy;
                    }
                });
            }

            syncPersonProfile(nextPersonId, { name, email, phone, bio, photoUrl });
            showNotification(`Updated profile for ${name}`, "success");
        }
    } else {
        // Add Mode
        const addResult = EmployeeDirectory.addManualEmployee(employees, positions, {
            name,
            role,
            department,
            managerId,
            email,
            phone,
            bio,
            photoUrl,
            avatarColor: getDeptColor(department)
        });
        const newEmployee = addResult.employee;
        const personId = selectedPersonProfile?.personId || document.getElementById("form-person-id").value || newEmployee.personId;
        newEmployee.personId = personId;
        employees = addResult.employees;

        syncPersonProfile(personId, { name, email, phone, bio, photoUrl });
        showNotification(`Added ${name} to organization`, "success");
    }
    
    await saveData();
    closeFormModal();
    renderAll();
    
    // Close details drawer if it was open (to refresh data)
    closeDetailDrawer();
    
    // Select newly added/edited employee
    const targetId = idVal ? parseInt(idVal) : employees[employees.length - 1].id;
    setTimeout(() => {
        focusAndHighlightEmployee(targetId);
    }, 100);
}

function deleteEmployee(id) {
    const employeeToDelete = employees.find(e => e.id === id);
    if (!employeeToDelete) return;
    
    const parentManagerId = employeeToDelete.managerId;
    
    // Reassign children to their grandparent
    employees.forEach(emp => {
        if (emp.managerId === id) {
            emp.managerId = parentManagerId;
        }
    });
    
    // Filter out deleted
    employees = employees.filter(e => e.id !== id);
    positions.forEach(position => {
        if (position.employeeId === id) {
            position.employeeId = null;
        }
    });
    
    // Remove from collapsed list if present
    collapsedNodes.delete(id);
    
    saveData();
    savePositions();
    savePreferences();
    renderAll();
    showNotification(`Deleted employee: ${employeeToDelete.name}`, "info");
}

/* Helpers */

// Helper to get descendant IDs to prevent cyclical structures
function getDescendantIds(employeeId) {
    const descendants = [];
    const queue = [employeeId];
    
    while (queue.length > 0) {
        const currentId = queue.shift();
        employees.forEach(emp => {
            if (emp.managerId === currentId) {
                descendants.push(emp.id);
                queue.push(emp.id);
            }
        });
    }
    
    return descendants;
}

// Generate initials for avatar circles
function getInitials(name) {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

// Class matching for styling badges in CSS
function getDeptClass(dept) {
    if (!dept) return "dept-generic";
    const d = dept.toLowerCase().trim();
    if (d.includes("engineering") || d.includes("developer") || d.includes("tech")) return "dept-engineering";
    if (d.includes("hr") || d.includes("human")) return "dept-hr";
    if (d.includes("design") || d.includes("ux") || d.includes("creative")) return "dept-design";
    if (d.includes("marketing") || d.includes("mktg") || d.includes("growth")) return "dept-marketing";
    if (d.includes("sales") || d.includes("biz")) return "dept-sales";
    if (d.includes("exec") || d.includes("ceo") || d.includes("president") || d.includes("chief")) return "dept-exec";
    return "dept-generic";
}

// Hex colors matching dept for avatars
function getDeptColor(dept) {
    if (!dept) return "#64748b"; // default slate
    const d = dept.toLowerCase().trim();
    if (d.includes("engineering") || d.includes("developer") || d.includes("tech")) return "#3b82f6"; // blue
    if (d.includes("hr") || d.includes("human")) return "#10b981"; // emerald
    if (d.includes("design") || d.includes("ux") || d.includes("creative")) return "#8b5cf6"; // purple
    if (d.includes("marketing") || d.includes("mktg") || d.includes("growth")) return "#ec4899"; // pink
    if (d.includes("sales") || d.includes("biz")) return "#f59e0b"; // amber
    if (d.includes("exec") || d.includes("ceo") || d.includes("president") || d.includes("chief")) return "#0f172a"; // dark slate
    
    // Generate a random-ish hash-based aesthetic color if department is custom
    const colors = ["#0ea5e9", "#f43f5e", "#14b8a6", "#f97316", "#84cc16", "#a855f7"];
    let hash = 0;
    for (let i = 0; i < dept.length; i++) {
        hash = dept.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// Simple HTML escaping helper (coerced safely to string)
function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Toast Notifications System
function showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    const toast = document.createElement("div");
    toast.className = `notification ${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-triangle";
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${escapeHTML(message)}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Animating slide-in
    setTimeout(() => {
        toast.classList.add("active");
    }, 10);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Drag and Drop Global State & Handlers
let draggedId = null;
let dropDraggedId = null;
let dropTargetId = null;

let activeDragCard = null;
let dragGrabOffsetX = 0;
let dragGrabOffsetY = 0;

function handleCardDragStart(e) {
    if (e.button !== 0) return;
    if (e.target.closest(".node-toggle-btn") || e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
    
    const card = e.currentTarget;
    activeDragCard = card;
    draggedId = parseInt(card.dataset.id);
    
    const position = positions.find(position => position.id === draggedId);
    if (!position) return;

    card.setPointerCapture(e.pointerId);
    card.classList.add("dragging");

    dragGrabOffsetX = (e.clientX / currentScale) - position.x;
    dragGrabOffsetY = (e.clientY / currentScale) - position.y;

    window.addEventListener("pointermove", handleCardDragMove);
    window.addEventListener("pointerup", handleCardDragEnd);
}

function handleCardDragMove(e) {
    if (!activeDragCard || draggedId === null) return;
    
    const position = positions.find(position => position.id === draggedId);
    if (!position) return;

    const newX = Math.round(e.clientX / currentScale - dragGrabOffsetX);
    const newY = Math.round(e.clientY / currentScale - dragGrabOffsetY);

    // Magnetic snap (ดูดล็อคเป็นขั้นๆ) - Snap to other positions' X and Y if within 25px
    const SNAP_THRESHOLD = 25;
    let snappedX = newX;
    let snappedY = newY;

    const otherPositions = positions.filter(p => p.id !== draggedId && p.x !== undefined && p.x !== null && p.y !== undefined && p.y !== null);

    // Check X snap
    for (let other of otherPositions) {
        if (Math.abs(newX - other.x) < SNAP_THRESHOLD) {
            snappedX = other.x;
            break;
        }
    }

    // Check Y snap
    for (let other of otherPositions) {
        if (Math.abs(newY - other.y) < SNAP_THRESHOLD) {
            snappedY = other.y;
            break;
        }
    }

    position.x = snappedX;
    position.y = snappedY;

    activeDragCard.style.left = `${snappedX}px`;
    activeDragCard.style.top = `${snappedY}px`;

    drawConnections();
}

function handleCardDragEnd(e) {
    window.removeEventListener("pointermove", handleCardDragMove);
    window.removeEventListener("pointerup", handleCardDragEnd);
    
    if (activeDragCard && draggedId !== null) {
        const position = positions.find(p => p.id === draggedId);
        if (position) {
            position.isManual = true;
        }
        try {
            activeDragCard.releasePointerCapture(e.pointerId);
        } catch (err) {}
        activeDragCard.classList.remove("dragging");
        activeDragCard = null;
    }
    
    draggedId = null;
    savePositions();
}

// Run application on load
// Run application on load
window.addEventListener("DOMContentLoaded", () => {
    init();
    
    const treeResizeObserver = new ResizeObserver(() => {
        drawConnections();
    });
    treeResizeObserver.observe(treeContainer);
});

/* Canvas Annotations (Frames & Free Texts) Logic */

let annotations = [];
let annotationHistory = [];
let annotationRedoHistory = [];

const ANNOTATIONS_API_URL = "/api/annotations";

async function loadAnnotations() {
    try {
        const response = await fetch(ANNOTATIONS_API_URL);
        if (response.ok) {
            annotations = await response.json();
            if (!Array.isArray(annotations)) annotations = [];
        }
    } catch (err) {
        console.warn("Failed to load annotations from database, falling back to local storage", err);
        const local = localStorage.getItem("hr_org_annotations");
        if (local) {
            try {
                annotations = JSON.parse(local);
            } catch (e) {
                annotations = [];
            }
        }
    }
    renderAnnotations();
}

async function saveAnnotations() {
    setSyncStatus("saving");
    try {
        localStorage.setItem("hr_org_annotations", JSON.stringify(annotations));
    } catch (error) {
        console.warn("Failed to write annotations to localStorage:", error);
    }
    try {
        const response = await fetch(ANNOTATIONS_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(annotations)
        });
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        setSyncStatus("success");
    } catch (err) {
        console.error("Failed to save annotations to database", err);
        setSyncStatus("error");
    }
}

function pushAnnotationHistory() {
    annotationHistory.push(JSON.stringify(annotations));
    annotationRedoHistory = []; // clear redo on new action
    updateAnnotationToolbarButtons();
}

function undoAnnotation() {
    if (annotationHistory.length === 0) return;
    const currentState = JSON.stringify(annotations);
    annotationRedoHistory.push(currentState);
    
    const prev = annotationHistory.pop();
    annotations = JSON.parse(prev);
    renderAnnotations();
    saveAnnotations();
    updateAnnotationToolbarButtons();
}

function redoAnnotation() {
    if (annotationRedoHistory.length === 0) return;
    const currentState = JSON.stringify(annotations);
    annotationHistory.push(currentState);
    
    const next = annotationRedoHistory.pop();
    annotations = JSON.parse(next);
    renderAnnotations();
    saveAnnotations();
    updateAnnotationToolbarButtons();
}

function updateAnnotationToolbarButtons() {
    const btnUndo = document.getElementById("tool-undo");
    const btnRedo = document.getElementById("tool-redo");
    if (btnUndo) btnUndo.disabled = annotationHistory.length === 0;
    if (btnRedo) btnRedo.disabled = annotationRedoHistory.length === 0;
}

// Global active drag vars for annotations
let activeDragAnnotation = null;
let annotDragOffsetX = 0;
let annotDragOffsetY = 0;
let activeResizeAnnotation = null;
let annotResizeStartW = 0;
let annotResizeStartH = 0;
let annotResizeStartX = 0;
let annotResizeStartY = 0;

function renderAnnotations() {
    const container = document.getElementById("annotations-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    annotations.forEach(annot => {
        if (annot.type === "frame") {
            const el = document.createElement("div");
            el.className = "annotation-card";
            el.dataset.id = annot.id;
            el.style.left = `${annot.x}px`;
            el.style.top = `${annot.y}px`;
            el.style.width = `${annot.width || 240}px`;
            el.style.height = `${annot.height || 160}px`;
            
            el.innerHTML = `
                <div class="annotation-header">
                    <div class="annotation-title" contenteditable="true" spellcheck="false">${escapeHTML(annot.text || "กรอบข้อความ")}</div>
                    <button class="annotation-delete-btn" title="ลบ">&times;</button>
                </div>
                <div class="annotation-content"></div>
                <div class="annotation-resize-handle"></div>
            `;
            
            // Edit title
            const titleEl = el.querySelector(".annotation-title");
            titleEl.addEventListener("blur", () => {
                const text = titleEl.innerText.trim();
                if (text !== annot.text) {
                    pushAnnotationHistory();
                    annot.text = text;
                    saveAnnotations();
                }
            });
            titleEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    titleEl.blur();
                }
            });
            
            // Delete btn
            el.querySelector(".annotation-delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                deleteAnnotation(annot.id);
            });
            
            // Drag listeners
            el.addEventListener("pointerdown", (e) => {
                if (e.target.closest(".annotation-resize-handle") || e.target.closest("[contenteditable='true']") || e.target.closest(".annotation-delete-btn")) return;
                e.stopPropagation();
                startDragAnnotation(e, annot, el);
            });
            
            // Resize listener
            el.querySelector(".annotation-resize-handle").addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                startResizeAnnotation(e, annot, el);
            });
            
            container.appendChild(el);
        } else if (annot.type === "text") {
            const wrapper = document.createElement("div");
            wrapper.className = "annotation-text-wrapper";
            wrapper.dataset.id = annot.id;
            wrapper.style.left = `${annot.x}px`;
            wrapper.style.top = `${annot.y}px`;
            
            const txt = document.createElement("div");
            txt.className = "annotation-text";
            txt.contentEditable = "true";
            txt.spellcheck = false;
            txt.innerText = annot.text || "ดับเบิ้ลคลิกแก้ไขข้อความ";
            
            const del = document.createElement("button");
            del.className = "annotation-text-delete-btn";
            del.innerHTML = "&times;";
            del.title = "ลบ";
            
            wrapper.appendChild(txt);
            wrapper.appendChild(del);
            
            // Edit text
            txt.addEventListener("blur", () => {
                const text = txt.innerText.trim();
                if (text !== annot.text) {
                    pushAnnotationHistory();
                    annot.text = text;
                    saveAnnotations();
                }
            });
            txt.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    txt.blur();
                }
            });
            
            // Delete btn
            del.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteAnnotation(annot.id);
            });
            
            // Drag listeners
            wrapper.addEventListener("pointerdown", (e) => {
                if (e.target.closest(".annotation-text-delete-btn")) return;
                if (e.target === txt && document.activeElement === txt) return; // allow typing selection
                e.stopPropagation();
                startDragAnnotation(e, annot, wrapper);
            });
            
            container.appendChild(wrapper);
        }
    });
}

function startDragAnnotation(e, annot, el) {
    if (e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    activeDragAnnotation = { annot, el };
    
    annotDragOffsetX = (e.clientX / currentScale) - annot.x;
    annotDragOffsetY = (e.clientY / currentScale) - annot.y;
    
    window.addEventListener("pointermove", handleDragAnnotationMove);
    window.addEventListener("pointerup", handleDragAnnotationEnd);
}

function handleDragAnnotationMove(e) {
    if (!activeDragAnnotation) return;
    const { annot, el } = activeDragAnnotation;
    
    const newX = Math.round(e.clientX / currentScale - annotDragOffsetX);
    const newY = Math.round(e.clientY / currentScale - annotDragOffsetY);
    
    annot.x = newX;
    annot.y = newY;
    el.style.left = `${newX}px`;
    el.style.top = `${newY}px`;
}

function handleDragAnnotationEnd(e) {
    if (!activeDragAnnotation) return;
    const { el } = activeDragAnnotation;
    try {
        el.releasePointerCapture(e.pointerId);
    } catch(err) {}
    
    pushAnnotationHistory();
    saveAnnotations();
    activeDragAnnotation = null;
    window.removeEventListener("pointermove", handleDragAnnotationMove);
    window.removeEventListener("pointerup", handleDragAnnotationEnd);
}

function startResizeAnnotation(e, annot, el) {
    if (e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    activeResizeAnnotation = { annot, el };
    
    annotResizeStartW = annot.width || 240;
    annotResizeStartH = annot.height || 160;
    annotResizeStartX = e.clientX;
    annotResizeStartY = e.clientY;
    
    window.addEventListener("pointermove", handleResizeAnnotationMove);
    window.addEventListener("pointerup", handleResizeAnnotationEnd);
}

function handleResizeAnnotationMove(e) {
    if (!activeResizeAnnotation) return;
    const { annot, el } = activeResizeAnnotation;
    
    const deltaX = (e.clientX - annotResizeStartX) / currentScale;
    const deltaY = (e.clientY - annotResizeStartY) / currentScale;
    
    const newW = Math.max(120, Math.round(annotResizeStartW + deltaX));
    const newH = Math.max(80, Math.round(annotResizeStartH + deltaY));
    
    annot.width = newW;
    annot.height = newH;
    el.style.width = `${newW}px`;
    el.style.height = `${newH}px`;
}

function handleResizeAnnotationEnd(e) {
    if (!activeResizeAnnotation) return;
    const { el } = activeResizeAnnotation;
    try {
        el.releasePointerCapture(e.pointerId);
    } catch(err) {}
    
    pushAnnotationHistory();
    saveAnnotations();
    activeResizeAnnotation = null;
    window.removeEventListener("pointermove", handleResizeAnnotationMove);
    window.removeEventListener("pointerup", handleResizeAnnotationEnd);
}

function deleteAnnotation(id) {
    pushAnnotationHistory();
    annotations = annotations.filter(a => a.id !== id);
    renderAnnotations();
    saveAnnotations();
}

function setupAnnotationListeners() {
    // Toolbar buttons
    document.getElementById("tool-add-frame").addEventListener("click", () => {
        pushAnnotationHistory();
        const id = `annot-${Date.now()}`;
        // Position it centered in current viewport
        const rect = viewport.getBoundingClientRect();
        const centerX = (rect.width / 2 - panX) / currentScale - 120;
        const centerY = (rect.height / 2 - panY) / currentScale - 80;
        
        annotations.push({
            id,
            type: "frame",
            x: Math.round(centerX),
            y: Math.round(centerY),
            width: 240,
            height: 160,
            text: "กรอบระบุกลุ่มงาน"
        });
        renderAnnotations();
        saveAnnotations();
    });
    
    document.getElementById("tool-add-text").addEventListener("click", () => {
        pushAnnotationHistory();
        const id = `annot-${Date.now()}`;
        const rect = viewport.getBoundingClientRect();
        const centerX = (rect.width / 2 - panX) / currentScale - 80;
        const centerY = (rect.height / 2 - panY) / currentScale - 20;
        
        annotations.push({
            id,
            type: "text",
            x: Math.round(centerX),
            y: Math.round(centerY),
            text: "พิมพ์คำอธิบาย..."
        });
        renderAnnotations();
        saveAnnotations();
    });
    
    document.getElementById("tool-undo").addEventListener("click", undoAnnotation);
    document.getElementById("tool-redo").addEventListener("click", redoAnnotation);
    
    document.getElementById("tool-clear").addEventListener("click", () => {
        if (annotations.length === 0) return;
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบกรอบและข้อความวาดเขียนทั้งหมดบนแผนผังนี้?")) {
            pushAnnotationHistory();
            annotations = [];
            renderAnnotations();
            saveAnnotations();
        }
    });
}
