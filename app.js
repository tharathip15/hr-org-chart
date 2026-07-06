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

// Load data initially
async function init() {
    setLoaderProgress(15, "กำลังจัดเตรียมสภาพแวดล้อม...");
    
    // Let elements fade in and spin rings start rotating smoothly
    await new Promise(resolve => setTimeout(resolve, 350));
    
    setLoaderProgress(40, "กำลังดึงข้อมูลบุคลากรจากฐานข้อมูล...");
    await loadData();
    
    await new Promise(resolve => setTimeout(resolve, 250));
    
    setLoaderProgress(70, "กำลังดาวน์โหลดค่ากำหนดการแสดงผล...");
    await loadPreferences();
    
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

        if (!Array.isArray(savedEmployees) || savedEmployees.length === 0 || didNormalizeProfiles) {
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
    saveLocalBackup();

    try {
        const response = await fetch(EMPLOYEES_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify(employees)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to save data to database.", error);
        showNotification("Database save failed. A browser backup was kept.", "error");
    }
}

function saveLocalBackup() {
    localStorage.setItem("hr_employees", JSON.stringify(employees));
}

function sanitizeCollapsedNodeIds(value) {
    if (!Array.isArray(value)) return [];

    const validIds = new Set(employees.map(emp => emp.id));
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
    const preferences = getPreferencesPayload();
    localStorage.setItem("hr_org_preferences", JSON.stringify(preferences));

    try {
        const response = await fetch(PREFERENCES_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify(preferences)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to save shared view preferences.", error);
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
        if (e.target.closest(".node-card") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".drawer") || e.target.closest(".modal")) return;
        
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
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(employees, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "hr_org_chart_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showNotification("Backup file downloaded successfully", "success");
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
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].department) {
                    if (confirm(`Are you sure you want to import this backup? It will overwrite your current chart with ${parsed.length} employees.`)) {
                        employees = parsed;
                        normalizeEmployeeProfiles();
                        collapsedNodes.clear();
                        selectedDept = "All";
                        saveData();
                        savePreferences();
                        renderAll();
                        fitToScreen();
                        showNotification("Backup imported successfully!", "success");
                    }
                } else {
                    showNotification("Invalid backup file structure", "error");
                }
            } catch (err) {
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

    // Add Employee Button
    document.getElementById("btn-add-employee").addEventListener("click", () => {
        openEmployeeForm();
    });
    
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
    
    // Close Drop Modal
    document.getElementById("close-drop-modal").addEventListener("click", closeDropModal);
    document.getElementById("drop-modal-overlay").addEventListener("click", closeDropModal);
    
    // Opt 1: Report to (or Set as Top Level if dropTargetId is null)
    document.getElementById("opt-report-to").addEventListener("click", () => {
        if (dropDraggedId === null) return;
        const emp = employees.find(e => e.id === dropDraggedId);
        if (!emp) return;
        
        if (dropTargetId !== null) {
            // Report to target
            const mgr = employees.find(e => e.id === dropTargetId);
            if (mgr) {
                emp.managerId = dropTargetId;
                // Also update department to match manager
                emp.department = mgr.department;
                saveData();
                renderAll();
                showNotification(`Reassigned ${emp.name} under ${mgr.name} (${mgr.department})`, "success");
            }
        } else {
            // Set as Top Level
            emp.managerId = null;
            saveData();
            renderAll();
            showNotification(`Reassigned ${emp.name} as Top Level`, "success");
        }
        closeDropModal();
    });
    
    // Opt 2: Become Manager (Insert above target)
    document.getElementById("opt-become-manager").addEventListener("click", () => {
        if (dropDraggedId === null || dropTargetId === null) return;
        const emp = employees.find(e => e.id === dropDraggedId);
        const targetEmp = employees.find(e => e.id === dropTargetId);
        if (!emp || !targetEmp) return;
        
        // Store target's old manager
        const oldManagerId = targetEmp.managerId;
        
        // Emp reports to target's old manager
        emp.managerId = oldManagerId;
        // Target reports to Emp
        targetEmp.managerId = emp.id;
        
        // Set Emp's department to target's department
        emp.department = targetEmp.department;
        
        saveData();
        renderAll();
        
        showNotification(`Inserted ${emp.name} as manager of ${targetEmp.name}`, "success");
        closeDropModal();
    });
    
    // Opt 3: Change Department Only
    document.getElementById("opt-change-dept").addEventListener("click", () => {
        if (dropDraggedId === null) return;
        const emp = employees.find(e => e.id === dropDraggedId);
        if (!emp) return;
        
        if (dropTargetId !== null) {
            // Change department to target's department immediately
            const targetEmp = employees.find(e => e.id === dropTargetId);
            if (targetEmp) {
                emp.department = targetEmp.department;
                saveData();
                renderAll();
                showNotification(`Moved ${emp.name} to ${targetEmp.department} department`, "success");
                closeDropModal();
            }
        } else {
            // Dropped on background - show department input and datalist
            const deptGroup = document.getElementById("dept-select-group");
            const input = document.getElementById("drop-new-dept");
            const datalist = document.getElementById("drop-department-list");
            
            // Populate datalist with unique departments
            const uniqueDepts = [...new Set(employees.map(e => e.department))].sort();
            datalist.innerHTML = uniqueDepts.map(dept => `<option value="${escapeHTML(dept)}">`).join("");
            
            // Set current department as value
            input.value = emp.department;
            
            deptGroup.style.display = "block"; // Show input field
        }
    });
    
    // Save new department button
    document.getElementById("btn-save-new-dept").addEventListener("click", () => {
        if (dropDraggedId === null) return;
        const emp = employees.find(e => e.id === dropDraggedId);
        const input = document.getElementById("drop-new-dept");
        if (emp && input) {
            const oldDept = emp.department;
            const newDept = input.value.trim();
            if (!newDept) {
                showNotification("กรุณาระบุชื่อแผนก", "error");
                return;
            }
            emp.department = newDept;
            
            saveData();
            renderAll();
            showNotification(`Moved ${emp.name} from ${oldDept} to ${newDept}`, "success");
        }
        closeDropModal();
    });

    // Opt 4: Hold Position Concurrently (Create copy with same personId)
    document.getElementById("opt-hold-concurrent").addEventListener("click", async () => {
        if (dropDraggedId === null) return;
        const emp = employees.find(e => e.id === dropDraggedId);
        if (!emp) return;

        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        let targetDept = emp.department;
        let managerId = null;
        let mgrName = "ระดับสูงสุด (Top Level)";

        if (dropTargetId !== null) {
            const mgr = employees.find(e => e.id === dropTargetId);
            if (mgr) {
                managerId = dropTargetId;
                targetDept = mgr.department;
                mgrName = mgr.name;
            }
        }

        const newEmployee = {
            id: newId,
            personId: emp.personId || createPersonId(emp.name, newId),
            name: emp.name,
            role: `ควบ: ${emp.role}`,
            department: targetDept,
            managerId: managerId,
            email: emp.email || "",
            phone: emp.phone || "",
            bio: emp.bio || "",
            photoUrl: emp.photoUrl || "",
            avatarColor: emp.avatarColor || getDeptColor(targetDept)
        };

        employees.push(newEmployee);

        await saveData();
        renderAll();

        showNotification(`เพิ่มตำแหน่งควบงานให้ ${emp.name} ภายใต้ ${mgrName} สำเร็จ`, "success");
        closeDropModal();
    });
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
    
    const card = document.querySelector(`.node-card[data-id="${id}"]`);
    if (!card) {
        // Employee might be hidden under a collapsed node. Find and expand path!
        expandPathToEmployee(id);
        renderAll();
    }
    
    // Need a tiny delay for DOM to render the card
    setTimeout(() => {
        const targetCard = document.querySelector(`.node-card[data-id="${id}"]`);
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
    let emp = employees.find(e => e.id === id);
    while (emp && emp.managerId) {
        collapsedNodes.delete(emp.managerId);
        emp = employees.find(e => e.id === emp.managerId);
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
}

// Compute counts and populate sidebar
function renderSidebarStats() {
    document.getElementById("total-headcount").innerText = employees.length;
    
    const depts = new Set(employees.map(e => e.department));
    document.getElementById("total-departments").innerText = depts.size;
}

// Build department items list in sidebar
function renderSidebarDeptList() {
    const list = document.getElementById("sidebar-dept-list");
    
    // Group headcount by department
    const deptCounts = {};
    employees.forEach(emp => {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    });
    
    // Sort departments alphabetically
    const sortedDepts = Object.keys(deptCounts).sort();
    
    let html = `
        <li class="department-item ${selectedDept === "All" ? "active" : ""}" data-dept="All">
            <span>Overall View</span>
            <span class="department-count">${employees.length}</span>
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
            const id = parseInt(card.dataset.id);
            showEmployeeDetails(id);
            
            document.querySelectorAll(".node-card").forEach(c => c.classList.remove("selected-focus"));
            card.classList.add("selected-focus");
        });
        
        card.addEventListener("pointerdown", handleCardDragStart);
    });
    
    document.querySelectorAll(".node-toggle-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleNode(id);
        });
    });
}

function renderTree() {
    treeContainer.innerHTML = "";
    svgOverlay.innerHTML = "";

    // 1. Calculate hidden IDs due to collapsed nodes
    const hiddenIds = new Set();
    function markHidden(mgrId) {
        employees.forEach(emp => {
            if (emp.managerId === mgrId) {
                hiddenIds.add(emp.id);
                markHidden(emp.id);
            }
        });
    }
    collapsedNodes.forEach(id => markHidden(id));

    // 2. Filter visible employees (and by department if selectedDept is not "All")
    let visibleEmployees = employees.filter(emp => !hiddenIds.has(emp.id));
    if (selectedDept !== "All") {
        visibleEmployees = visibleEmployees.filter(emp => emp.department === selectedDept);
    }

    // 3. Ensure all employees have coordinates. Run auto-layout if any are missing.
    const needsLayout = employees.some(e => e.x === null || e.y === null);
    if (needsLayout) {
        calculateInitialCoordinates();
        saveData(); // Save coordinates asynchronously
    }

    // 4. Render cards flat with absolute positioning
    const html = visibleEmployees.map(employee => {
        const deptClass = getDeptClass(employee.department);
        const dualRoleCount = employees.filter(e => samePerson(e, employee)).length;
        const isDualRole = dualRoleCount > 1;
        const hasReports = employees.some(e => e.managerId === employee.id);
        
        let cardHtml = `
            <div class="node-card absolute-card" data-id="${employee.id}" style="position: absolute; left: ${employee.x}px; top: ${employee.y}px; touch-action: none;">
                <div class="card-header">
                    ${getAvatarHTML(employee)}
                    <div class="card-title-group">
                        <div class="card-name" style="display: flex; align-items: center; gap: 4px; overflow: visible;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(employee.name)}</span>
                            ${isDualRole ? `<span class="dual-role-badge" title="มีหลายตำแหน่งงาน (Dual Role)" style="font-size: 8px; color: var(--accent-primary); background-color: var(--accent-light); padding: 2px 4px; border-radius: 4px; font-weight: 700; text-transform: uppercase; line-height: 1; flex-shrink: 0;">Dual</span>` : ''}
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
            cardHtml += `
                <button class="node-toggle-btn ${isCollapsed ? 'collapsed' : ''}" data-id="${employee.id}">
                    <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}"></i>
                </button>
            `;
        }

        cardHtml += `</div>`;
        return cardHtml;
    }).join("");

    treeContainer.innerHTML = html;
    wireTreeInteractions();
    scheduleConnectionDraw();
}

function drawConnections() {
    svgOverlay.innerHTML = "";
    updateCanvasBounds();

    const visibleCards = document.querySelectorAll(".node-card");
    const visibleCardIds = new Set();
    visibleCards.forEach(card => visibleCardIds.add(parseInt(card.dataset.id)));

    employees.forEach(emp => {
        if (!visibleCardIds.has(emp.id) || !emp.managerId || !visibleCardIds.has(emp.managerId)) return;

        const childCard = document.querySelector(`.node-card[data-id="${emp.id}"]`);
        const parentCard = document.querySelector(`.node-card[data-id="${emp.managerId}"]`);
        if (!childCard || !parentCard) return;

        const pLocal = getCanvasLocalRect(parentCard);
        const cLocal = getCanvasLocalRect(childCard);
        if (pLocal.width === 0 || pLocal.height === 0 || cLocal.width === 0 || cLocal.height === 0) return;

        const startX = pLocal.x + pLocal.width / 2;
        const startY = pLocal.y + pLocal.height;
        const endX = cLocal.x + cLocal.width / 2;
        const endY = cLocal.y;

        const busY = startY + (endY - startY) / 2;

        const pathParts = [
            `M ${startX} ${startY}`,
            `L ${startX} ${busY}`,
            `L ${endX} ${busY}`,
            `L ${endX} ${endY}`
        ];

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathParts.join(" "));
        path.setAttribute("class", "connection-path");
        
        if (highlightedConnections.has(`${emp.managerId}-${emp.id}`)) {
            path.setAttribute("class", "connection-path highlighted");
        }
        svgOverlay.appendChild(path);
    });
}

function calculateInitialCoordinates() {
    const validIds = new Set(employees.map(e => e.id));
    const roots = employees.filter(e => e.managerId === null || !validIds.has(e.managerId));
    
    const reportsMap = {};
    employees.forEach(emp => {
        if (emp.managerId !== null) {
            if (!reportsMap[emp.managerId]) reportsMap[emp.managerId] = [];
            reportsMap[emp.managerId].push(emp);
        }
    });
    for (let key in reportsMap) {
        reportsMap[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    const subtreeWidths = {};
    const visitedWidths = new Set();
    function computeWidths(empId) {
        if (visitedWidths.has(empId)) return 0;
        visitedWidths.add(empId);

        const children = reportsMap[empId] || [];
        if (children.length === 0) {
            subtreeWidths[empId] = 260;
            return 260;
        }
        let width = 0;
        children.forEach(child => {
            width += computeWidths(child.id);
        });
        subtreeWidths[empId] = Math.max(260, width);
        return subtreeWidths[empId];
    }
    roots.forEach(root => computeWidths(root.id));

    const ySpacing = 220;
    const assignedCoords = new Set();

    function assignCoords(emp, xStart, y) {
        if (assignedCoords.has(emp.id)) return;
        assignedCoords.add(emp.id);

        const children = reportsMap[emp.id] || [];
        const w = subtreeWidths[emp.id] || 260;
        const myX = xStart + w / 2;
        
        emp.x = Math.round(myX - 110);
        emp.y = Math.round(y);
        
        let childXStart = xStart;
        children.forEach(child => {
            assignCoords(child, childXStart, y + ySpacing);
            childXStart += (subtreeWidths[child.id] || 260);
        });
    }

    let currentXStart = 200;
    roots.forEach(root => {
        assignCoords(root, currentXStart, 150);
        currentXStart += (subtreeWidths[root.id] || 260) + 150;
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
            
            syncPersonProfile(nextPersonId, { name, email, phone, bio, photoUrl });
            
            showNotification(`Updated profile for ${name}`, "success");
        }
    } else {
        // Add Mode
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        const personId = selectedPersonProfile?.personId || document.getElementById("form-person-id").value || createPersonId(name, newId);
        const newEmployee = {
            id: newId,
            personId,
            name,
            role,
            department,
            managerId,
            email,
            phone,
            bio,
            photoUrl,
            avatarColor: getDeptColor(department)
        };
        
        employees.push(newEmployee);
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
    
    // Remove from collapsed list if present
    collapsedNodes.delete(id);
    
    saveData();
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

// Simple HTML escaping helper
function escapeHTML(str) {
    if (!str) return "";
    return str
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
let activeDragCard = null;
let dragGrabOffsetX = 0;
let dragGrabOffsetY = 0;

function handleCardDragStart(e) {
    if (e.button !== 0) return;
    if (e.target.closest(".node-toggle-btn") || e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
    
    const card = e.currentTarget;
    activeDragCard = card;
    draggedId = parseInt(card.dataset.id);
    
    const emp = employees.find(emp => emp.id === draggedId);
    if (!emp) return;

    card.setPointerCapture(e.pointerId);
    card.classList.add("dragging");

    dragGrabOffsetX = (e.clientX / currentScale) - emp.x;
    dragGrabOffsetY = (e.clientY / currentScale) - emp.y;

    window.addEventListener("pointermove", handleCardDragMove);
    window.addEventListener("pointerup", handleCardDragEnd);
}

function handleCardDragMove(e) {
    if (!activeDragCard || draggedId === null) return;
    
    const emp = employees.find(emp => emp.id === draggedId);
    if (!emp) return;

    const newX = Math.round(e.clientX / currentScale - dragGrabOffsetX);
    const newY = Math.round(e.clientY / currentScale - dragGrabOffsetY);

    emp.x = newX;
    emp.y = newY;

    activeDragCard.style.left = `${newX}px`;
    activeDragCard.style.top = `${newY}px`;

    drawConnections();
}

function handleCardDragEnd(e) {
    window.removeEventListener("pointermove", handleCardDragMove);
    window.removeEventListener("pointerup", handleCardDragEnd);
    
    if (activeDragCard) {
        try {
            activeDragCard.releasePointerCapture(e.pointerId);
        } catch (err) {}
        activeDragCard.classList.remove("dragging");
        activeDragCard = null;
    }
    
    draggedId = null;
    saveData();
}

// Run application on load
window.addEventListener("DOMContentLoaded", () => {
    init();
    
    const treeResizeObserver = new ResizeObserver(() => {
        drawConnections();
    });
    treeResizeObserver.observe(treeContainer);
});
