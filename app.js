/* HR Org Chart Application Logic */

// Default Demo Data
const DEFAULT_EMPLOYEES = [
    {
        "id": 1,
        "name": "PAIBOON R.",
        "role": "Chief Executive Officer (CEO)",
        "department": "Executive",
        "managerId": null,
        "email": "paiboon.r.@company.com",
        "phone": "+66 81-234-5678",
        "bio": "Chief Executive Officer leading the overall organization strategy."
    },
    {
        "id": 2,
        "name": "BENJAPORN C.",
        "role": "Officer",
        "department": "Waste Treatment",
        "managerId": 5,
        "email": "benjapornc@company.com",
        "phone": "+66 802-234-5678",
        "bio": "Officer in the Waste Treatment department."
    },
    {
        "id": 3,
        "name": "CHANINATH A.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 29,
        "email": "chaninatha@company.com",
        "phone": "+66 803-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 4,
        "name": "CHINDAPHORN S.",
        "role": "Officer",
        "department": "WS/RDF",
        "managerId": 5,
        "email": "chindaphorns@company.com",
        "phone": "+66 804-234-5678",
        "bio": "Officer in the WS/RDF department."
    },
    {
        "id": 5,
        "name": "CHOLANAN S.",
        "role": "Director of Waste & WS/RDF",
        "department": "WS/RDF",
        "managerId": 22,
        "email": "cholanans@company.com",
        "phone": "+66 805-234-5678",
        "bio": "Director of Waste & WS/RDF in the WS/RDF department."
    },
    {
        "id": 6,
        "name": "DIREC T.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 9,
        "email": "direct@company.com",
        "phone": "+66 806-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 7,
        "name": "EAKKACHON K.",
        "role": "Officer",
        "department": "Energy",
        "managerId": 5,
        "email": "eakkachonk@company.com",
        "phone": "+66 807-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 8,
        "name": "FUANGLADA M.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 23,
        "email": "fuangladam@company.com",
        "phone": "+66 808-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 9,
        "name": "JIRANAN K.",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 29,
        "email": "jiranank@company.com",
        "phone": "+66 809-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 10,
        "name": "JIRAPA R.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 24,
        "email": "jirapar@company.com",
        "phone": "+66 810-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 11,
        "name": "JUTAMAS P.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 24,
        "email": "jutamasp@company.com",
        "phone": "+66 811-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 12,
        "name": "KHEMIKA A.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 37,
        "email": "khemikaa@company.com",
        "phone": "+66 812-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 13,
        "name": "KOTCHAMON J.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 37,
        "email": "kotchamonj@company.com",
        "phone": "+66 813-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 14,
        "name": "KULTHARA W.",
        "role": "Officer",
        "department": "HR",
        "managerId": 16,
        "email": "kultharaw@company.com",
        "phone": "+66 814-234-5678",
        "bio": "Officer in the HR department."
    },
    {
        "id": 15,
        "name": "MIRUNTEE M.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 23,
        "email": "mirunteem@company.com",
        "phone": "+66 815-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 16,
        "name": "NATTAWAN P.",
        "role": "VP of Human Resources",
        "department": "HR",
        "managerId": 39,
        "email": "nattawanp@company.com",
        "phone": "+66 816-234-5678",
        "bio": "VP of Human Resources in the HR department."
    },
    {
        "id": 17,
        "name": "NATTHANIDA L.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 11,
        "email": "natthanidal@company.com",
        "phone": "+66 817-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 18,
        "name": "NE W.",
        "role": "Officer",
        "department": "Overview",
        "managerId": 1,
        "email": "new@company.com",
        "phone": "+66 818-234-5678",
        "bio": "Officer in the Overview department."
    },
    {
        "id": 19,
        "name": "NILIN W.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 24,
        "email": "nilinw@company.com",
        "phone": "+66 819-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 20,
        "name": "NUNTAPORN S.",
        "role": "Executive Secretary",
        "department": "Executive",
        "managerId": 1,
        "email": "nuntaporns@company.com",
        "phone": "+66 820-234-5678",
        "bio": "Executive Secretary in the Executive department."
    },
    {
        "id": 21,
        "name": "NUTTHAWA T.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 25,
        "email": "nutthawat@company.com",
        "phone": "+66 821-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 22,
        "name": "PAITOON R.",
        "role": "Chief Operating Officer (COO)",
        "department": "Executive",
        "managerId": 1,
        "email": "paitoonr@company.com",
        "phone": "+66 822-234-5678",
        "bio": "Chief Operating Officer (COO) in the Executive department."
    },
    {
        "id": 23,
        "name": "PANITPORN Y.",
        "role": "VP of Procurement & Logistics",
        "department": "Procurement & Logistics",
        "managerId": 1,
        "email": "panitporny@company.com",
        "phone": "+66 823-234-5678",
        "bio": "VP of Procurement & Logistics in the Procurement & Logistics department."
    },
    {
        "id": 24,
        "name": "PHONGSATORN K.",
        "role": "Director of Finance & Accounting",
        "department": "Finance & Accounting",
        "managerId": 18,
        "email": "phongsatornk@company.com",
        "phone": "+66 824-234-5678",
        "bio": "Director of Finance & Accounting in the Finance & Accounting department."
    },
    {
        "id": 25,
        "name": "PINPAWEE K.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 23,
        "email": "pinpaweek@company.com",
        "phone": "+66 825-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 26,
        "name": "PORNCHANOK . P",
        "role": "Officer",
        "department": "Solvent",
        "managerId": 29,
        "email": "pornchanokp@company.com",
        "phone": "+66 826-234-5678",
        "bio": "Officer in the Solvent department."
    },
    {
        "id": 27,
        "name": "PORNCHITAR D.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 8,
        "email": "pornchitard@company.com",
        "phone": "+66 827-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 28,
        "name": "RINLITA W.",
        "role": "Officer",
        "department": "Energy",
        "managerId": 41,
        "email": "rinlitaw@company.com",
        "phone": "+66 828-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 29,
        "name": "SARASA W.",
        "role": "Director of Solvent",
        "department": "Solvent",
        "managerId": 1,
        "email": "sarasaw@company.com",
        "phone": "+66 829-234-5678",
        "bio": "Director of Solvent in the Solvent department."
    },
    {
        "id": 30,
        "name": "SASIPHA S.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 25,
        "email": "sasiphas@company.com",
        "phone": "+66 830-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 31,
        "name": "SUDARA T.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 15,
        "email": "sudarat@company.com",
        "phone": "+66 831-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 32,
        "name": "SUPAWIT J.",
        "role": "Officer",
        "department": "Procurement & Logistics",
        "managerId": 8,
        "email": "supawitj@company.com",
        "phone": "+66 832-234-5678",
        "bio": "Officer in the Procurement & Logistics department."
    },
    {
        "id": 33,
        "name": "SUTAWAN S.",
        "role": "Officer",
        "department": "Finance & Accounting",
        "managerId": 24,
        "email": "sutawans@company.com",
        "phone": "+66 833-234-5678",
        "bio": "Officer in the Finance & Accounting department."
    },
    {
        "id": 34,
        "name": "TAWIDA P.",
        "role": "VP of Corporate Affairs",
        "department": "Corporate",
        "managerId": 39,
        "email": "tawidap@company.com",
        "phone": "+66 834-234-5678",
        "bio": "VP of Corporate Affairs in the Corporate department."
    },
    {
        "id": 35,
        "name": "THARATHIP I.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 37,
        "email": "tharathipi@company.com",
        "phone": "+66 835-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 36,
        "name": "THONGPITAK A.",
        "role": "Director of Sugar & Chemical",
        "department": "Sugar",
        "managerId": 5,
        "email": "thongpitaka@company.com",
        "phone": "+66 836-234-5678",
        "bio": "Director of Sugar & Chemical in the Sugar department."
    },
    {
        "id": 37,
        "name": "VACAN T.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 34,
        "email": "vacant@company.com",
        "phone": "+66 837-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 38,
        "name": "WARANPORN R.",
        "role": "Officer",
        "department": "Corporate",
        "managerId": 34,
        "email": "waranpornr@company.com",
        "phone": "+66 838-234-5678",
        "bio": "Officer in the Corporate department."
    },
    {
        "id": 39,
        "name": "WATCHARACHAI S.",
        "role": "Director of Marketing",
        "department": "Marketing",
        "managerId": 22,
        "email": "watcharachais@company.com",
        "phone": "+66 839-234-5678",
        "bio": "Director of Marketing in the Marketing department."
    },
    {
        "id": 40,
        "name": "คุณ อ้วน",
        "role": "Officer",
        "department": "Energy",
        "managerId": 5,
        "email": "คุณอ้วน@company.com",
        "phone": "+66 840-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 41,
        "name": "คุณตั้น",
        "role": "Officer",
        "department": "Energy",
        "managerId": 5,
        "email": "คุณตั้น@company.com",
        "phone": "+66 841-234-5678",
        "bio": "Officer in the Energy department."
    },
    {
        "id": 42,
        "name": "คุณเซียง 69",
        "role": "Officer",
        "department": "Energy",
        "managerId": 5,
        "email": "คุณเซียง69@company.com",
        "phone": "+66 842-234-5678",
        "bio": "Officer in the Energy department."
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

// Load data initially
function init() {
    const saved = localStorage.getItem("hr_employees");
    if (saved) {
        try {
            employees = JSON.parse(saved);
            // If the saved data contains the old demo data (e.g. Sarah Jenkins), force reset to the new corporate data!
            if (employees.some(e => e.name === "Sarah Jenkins")) {
                employees = [...DEFAULT_EMPLOYEES];
                saveData();
            }
        } catch (e) {
            employees = [...DEFAULT_EMPLOYEES];
            saveData();
        }
    } else {
        employees = [...DEFAULT_EMPLOYEES];
        saveData();
    }
    
    setupEventListeners();
    renderAll();
    
    // Smooth fade-in and fit to screen
    setTimeout(() => {
        fitToScreen();
    }, 150);
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem("hr_employees", JSON.stringify(employees));
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
    
    // Reset data button
    document.getElementById("btn-reset-data").addEventListener("click", () => {
        if (confirm("Are you sure you want to reset to the default demo organization chart? All custom additions will be lost.")) {
            employees = [...DEFAULT_EMPLOYEES];
            collapsedNodes.clear();
            selectedDept = "All";
            saveData();
            renderAll();
            fitToScreen();
            showNotification("Organization chart reset to demo data", "info");
        }
    });
    
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
                    <div class="avatar" style="background-color: ${emp.avatarColor || getDeptColor(emp.department)}; width: 32px; height: 32px; font-size: 11px;">
                        ${getInitials(emp.name)}
                    </div>
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

// Fit organization tree to screen bounds
function fitToScreen() {
    const tree = document.getElementById("tree-container");
    
    // Momentarily reset scale/pan to get natural unscaled dimensions
    const viewportRect = viewport.getBoundingClientRect();
    
    // Save current styling to restore in case
    const oldTransform = canvas.style.transform;
    canvas.style.transform = "none";
    
    const treeRect = tree.getBoundingClientRect();
    canvas.style.transform = oldTransform;
    
    const treeWidth = treeRect.width;
    const treeHeight = treeRect.height;
    
    if (treeWidth === 0 || treeHeight === 0) return;
    
    const padding = 60;
    const scaleX = (viewportRect.width - padding * 2) / treeWidth;
    const scaleY = (viewportRect.height - padding * 2) / treeHeight;
    
    currentScale = Math.min(scaleX, scaleY);
    currentScale = Math.max(0.2, Math.min(1.2, currentScale)); // clamp fitting scale
    
    // Center it horizontally, add padding top
    panX = (viewportRect.width - treeWidth * currentScale) / 2;
    panY = 40;
    
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
        
        // Centering viewport on the target card
        const viewportRect = viewport.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        
        // Card coordinates relative to canvas (unscaled)
        const cx = (cardRect.left - canvasRect.left) / currentScale;
        const cy = (cardRect.top - canvasRect.top) / currentScale;
        
        // Center the card in the viewport
        panX = (viewportRect.width / 2) - (cx + (cardRect.width / currentScale) / 2) * currentScale;
        panY = (viewportRect.height / 2) - (cy + (cardRect.height / currentScale) / 2) * currentScale;
        
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

// Render dynamic DOM tree structure
function renderTree() {
    treeContainer.innerHTML = "";
    
    // Identify Roots
    let roots = [];
    
    if (selectedDept === "All") {
        // Global roots: Employees whose managerId is null or invalid
        const validIds = new Set(employees.map(e => e.id));
        roots = employees.filter(e => e.managerId === null || !validIds.has(e.managerId));
        
        // If there's no root (e.g. data corrupted), make the first employee the root
        if (roots.length === 0 && employees.length > 0) {
            roots = [employees[0]];
        }
    } else {
        // Department focused view
        // Find highest-ranking employee(s) in the selected department.
        // A highest-ranking employee is one in this department whose manager is NOT in this department (or null)
        const deptEmployees = employees.filter(e => e.department === selectedDept);
        const deptEmployeeIds = new Set(deptEmployees.map(e => e.id));
        
        roots = deptEmployees.filter(e => e.managerId === null || !deptEmployeeIds.has(e.managerId));
        
        if (roots.length === 0 && deptEmployees.length > 0) {
            roots = [deptEmployees[0]];
        }
    }
    
    // Build reports mapping
    const reportsMap = {};
    employees.forEach(emp => {
        if (emp.managerId !== null) {
            if (!reportsMap[emp.managerId]) {
                reportsMap[emp.managerId] = [];
            }
            // In department mode, we only render children who belong to the same department
            if (selectedDept === "All" || emp.department === selectedDept) {
                reportsMap[emp.managerId].push(emp);
            }
        }
    });
    
    // Sort reports alphabetically by name for consistent layout
    for (let key in reportsMap) {
        reportsMap[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Recursive Tree builder function
    function buildNodeHTML(employee) {
        const reports = reportsMap[employee.id] || [];
        const hasReports = reports.length > 0;
        const initials = getInitials(employee.name);
        const deptClass = getDeptClass(employee.department);
        const avatarColor = employee.avatarColor || getDeptColor(employee.department);
        
        let html = `
            <div class="tree-node" data-id="${employee.id}">
                <div class="node-card-wrapper">
                    <div class="node-card" data-id="${employee.id}">
                        <div class="card-header">
                            <div class="avatar" style="background-color: ${avatarColor}">${initials}</div>
                            <div class="card-title-group">
                                <div class="card-name">${escapeHTML(employee.name)}</div>
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
            html += `
                <div class="node-children ${isCollapsed ? 'collapsed' : ''}">
                    ${reports.map(report => buildNodeHTML(report)).join("")}
                </div>
            `;
        }
        
        html += `</div>`;
        return html;
    }
    
    // Render the tree structures side by side if multiple roots
    const treeHTML = roots.map(root => buildNodeHTML(root)).join("");
    treeContainer.innerHTML = treeHTML;
    
    // Wire up events dynamically
    lucide.createIcons();
    
    document.querySelectorAll(".node-card").forEach(card => {
        card.addEventListener("click", (e) => {
            const id = parseInt(card.dataset.id);
            showEmployeeDetails(id);
            
            // Highlight active card
            document.querySelectorAll(".node-card").forEach(c => c.classList.remove("selected-focus"));
            card.classList.add("selected-focus");
        });
    });
    
    document.querySelectorAll(".node-toggle-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleNode(id);
        });
    });
    
    // Recalculate connection lines after layout renders
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            drawConnections();
        });
    });
}

// Generate connection lines in the SVG overlay
function drawConnections() {
    svgOverlay.innerHTML = "";
    
    const canvasRect = canvas.getBoundingClientRect();
    
    const nodes = document.querySelectorAll(".tree-node");
    nodes.forEach(node => {
        const parentId = parseInt(node.dataset.id);
        const parentCard = node.querySelector(`.node-card-wrapper > .node-card[data-id="${parentId}"]`);
        
        if (!parentCard) return;
        
        const childrenContainer = node.querySelector(`.node-children`);
        if (!childrenContainer || childrenContainer.classList.contains("collapsed")) return;
        
        // Fetch only immediate children of this node
        const childNodes = childrenContainer.querySelectorAll(`:scope > .tree-node`);
        childNodes.forEach(childNode => {
            const childId = parseInt(childNode.dataset.id);
            const childCard = childNode.querySelector(`.node-card-wrapper > .node-card[data-id="${childId}"]`);
            
            if (!childCard) return;
            
            // Compute screen-relative positions
            const pRect = parentCard.getBoundingClientRect();
            const cRect = childCard.getBoundingClientRect();
            
            // Map to canvas scale/coordinates
            const px = (pRect.left - canvasRect.left) / currentScale;
            const py = (pRect.top - canvasRect.top) / currentScale;
            const pWidth = pRect.width / currentScale;
            const pHeight = pRect.height / currentScale;
            
            const cx = (cRect.left - canvasRect.left) / currentScale;
            const cy = (cRect.top - canvasRect.top) / currentScale;
            const cWidth = cRect.width / currentScale;
            
            // Connection Anchors: Parent bottom center to Child top center
            const startX = px + pWidth / 2;
            const startY = py + pHeight;
            const endX = cx + cWidth / 2;
            const endY = cy;
            
            const midY = (startY + endY) / 2;
            
            // Render Bezier Curve SVG Path
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
            path.setAttribute("class", "connection-path");
            
            // Check if connection is in highlight set
            if (highlightedConnections.has(`${parentId}-${childId}`)) {
                path.classList.add("highlighted");
            }
            
            svgOverlay.appendChild(path);
        });
    });
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
            <div class="avatar-sm" style="background-color: ${manager.avatarColor || getDeptColor(manager.department)}">${getInitials(manager.name)}</div>
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
                        <div class="avatar-sm" style="background-color: ${rep.avatarColor || getDeptColor(rep.department)}">${getInitials(rep.name)}</div>
                        <div class="mini-profile-info">
                            <h5>${escapeHTML(rep.name)}</h5>
                            <p>${escapeHTML(rep.role)} • ${escapeHTML(rep.department)}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }
    
    const body = document.getElementById("detail-drawer-body");
    const initials = getInitials(emp.name);
    const deptClass = getDeptClass(emp.department);
    const avatarColor = emp.avatarColor || getDeptColor(emp.department);
    
    body.innerHTML = `
        <div class="profile-card-large">
            <div class="avatar-lg" style="background-color: ${avatarColor}">${initials}</div>
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

function openEmployeeForm(editId = null) {
    const modal = document.getElementById("form-modal");
    const overlay = document.getElementById("form-modal-overlay");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("employee-form");
    
    // Clear and reset form
    form.reset();
    document.getElementById("form-employee-id").value = "";
    
    // Populate Managers Dropdown
    const managerSelect = document.getElementById("form-manager");
    managerSelect.innerHTML = `<option value="">None (Top Level / CEO)</option>`;
    
    let eligibleManagers = [...employees];
    
    if (editId) {
        title.innerText = "Edit Employee Details";
        document.getElementById("form-employee-id").value = editId;
        
        const emp = employees.find(e => e.id === editId);
        if (emp) {
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
        managerSelect.innerHTML += `<option value="${mgr.id}">${escapeHTML(mgr.name)} (${escapeHTML(mgr.role)} • ${escapeHTML(mgr.department)})</option>`;
    });
    
    if (editId) {
        const emp = employees.find(e => e.id === editId);
        if (emp && emp.managerId) {
            managerSelect.value = emp.managerId;
        }
    }
    
    overlay.classList.add("active");
    modal.classList.add("active");
}

function closeFormModal() {
    document.getElementById("form-modal-overlay").classList.remove("active");
    document.getElementById("form-modal").classList.remove("active");
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const idVal = document.getElementById("form-employee-id").value;
    const name = document.getElementById("form-name").value.trim();
    const role = document.getElementById("form-role").value.trim();
    const department = document.getElementById("form-department").value.trim();
    const managerIdVal = document.getElementById("form-manager").value;
    const email = document.getElementById("form-email").value.trim();
    const phone = document.getElementById("form-phone").value.trim();
    const bio = document.getElementById("form-bio").value.trim();
    
    const managerId = managerIdVal ? parseInt(managerIdVal) : null;
    
    if (!name || !role || !department) {
        showNotification("Please fill in all required fields", "error");
        return;
    }
    
    if (idVal) {
        // Edit mode
        const id = parseInt(idVal);
        const empIndex = employees.findIndex(e => e.id === id);
        if (empIndex > -1) {
            // Update fields
            employees[empIndex].name = name;
            employees[empIndex].role = role;
            employees[empIndex].department = department;
            employees[empIndex].managerId = managerId;
            employees[empIndex].email = email;
            employees[empIndex].phone = phone;
            employees[empIndex].bio = bio;
            
            // Department color update check (if changed, keep or randomize)
            if (employees[empIndex].department.toLowerCase() !== department.toLowerCase()) {
                employees[empIndex].avatarColor = getDeptColor(department);
            }
            
            showNotification(`Updated profile for ${name}`, "success");
        }
    } else {
        // Add Mode
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        const newEmployee = {
            id: newId,
            name,
            role,
            department,
            managerId,
            email,
            phone,
            bio,
            avatarColor: getDeptColor(department)
        };
        
        employees.push(newEmployee);
        showNotification(`Added ${name} to organization`, "success");
    }
    
    saveData();
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

// Run application on load
window.addEventListener("DOMContentLoaded", init);
