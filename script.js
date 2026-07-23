// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header background on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.9)';
    }
});

// Update about link to be a placeholder
const aboutLink = document.querySelector('a[href="#about"]');
if (aboutLink) {
    aboutLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('About page coming soon!');
    });
}

// Circle draw hover effect
document.querySelectorAll('.nav-link-wrap').forEach(wrap => {
    const path = wrap.querySelector('.circle-path');
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.style.transition = 'none';
    wrap.addEventListener('mouseenter', () => {
        path.style.transition = `stroke-dashoffset 0.65s cubic-bezier(0.4, 0, 0.2, 1)`;
        path.style.strokeDashoffset = '0';
    });
    wrap.addEventListener('mouseleave', () => {
        path.style.transition = `stroke-dashoffset 0.2s ease-in`;
        path.style.strokeDashoffset = len;
    });
});

// CSV line splitter — shared between index and project page
function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ';' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// Hamburger menu
const hamburger = document.getElementById('hamburger');
if (hamburger) {
    hamburger.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
    });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.remove('open');
    });
});

// =====================
// INDEX PAGE ONLY
// =====================
if (document.getElementById('portfolio-grid')) {

    fetch('projects.csv')
        .then(res => res.text())
        .then(csv => {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(';');
            const projects = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = splitCSVLine(lines[i]);
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h.trim()] = (cols[idx] || '').trim();
                });
                if (obj.id) projects.push(obj);
            }

            buildFilters(projects);
            buildGrid(projects);
        });

    const activeFilters = { year: [], skills: [], tags: [] };

    function buildFilters(projects) {
        const years = [...new Set(projects.map(p => p.year).filter(Boolean))].sort();
        const skills = [...new Set(projects.flatMap(p => p.skills ? p.skills.split('|').map(s => s.trim()) : []))].sort();
        const tags = [...new Set(projects.flatMap(p => p.tags ? p.tags.split('|').map(t => t.trim()) : []))].sort();

        const filterHTML = `
            <div class="filters">
                ${buildFilterGroup('year', 'Year', years)}
                ${buildFilterGroup('skills', 'Skills', skills)}
                ${buildFilterGroup('tags', 'Type', tags)}
                <button class="filter-reset" onclick="resetFilters()">Clear all</button>
            </div>
        `;

        document.getElementById('filters-container').innerHTML = filterHTML;

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-group')) {
                document.querySelectorAll('.filter-group').forEach(g => g.classList.remove('open'));
            }
        });

        document.querySelectorAll('.filter-group-label').forEach(label => {
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                const group = label.parentElement;
                const isOpen = group.classList.contains('open');
                document.querySelectorAll('.filter-group').forEach(g => g.classList.remove('open'));
                if (!isOpen) group.classList.add('open');
            });
        });
    }

    function buildFilterGroup(key, label, values) {
        const allOption = `<button class="filter-option filter-all active" data-key="${key}" data-value="all" onclick="setFilter(event, '${key}', 'all')">All</button>`;
        const options = values.map(v =>
            `<button class="filter-option" data-key="${key}" data-value="${v}" onclick="setFilter(event, '${key}', '${v}')">${v}</button>`
        ).join('');

        return `
            <div class="filter-group" data-key="${key}">
                <button class="filter-group-label">${label} <span class="filter-arrow">▾</span></button>
                <div class="filter-options">${allOption}${options}</div>
            </div>
        `;
    }

    function setFilter(e, key, value) {
        e.stopPropagation();

        if (value === 'all') {
            activeFilters[key] = [];
            document.querySelectorAll(`.filter-option[data-key="${key}"]`).forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.filter-all[data-key="${key}"]`).classList.add('active');
        } else {
            const idx = activeFilters[key].indexOf(value);
            if (idx > -1) {
                activeFilters[key].splice(idx, 1);
            } else {
                activeFilters[key].push(value);
            }
            const allBtn = document.querySelector(`.filter-all[data-key="${key}"]`);
            allBtn.classList.toggle('active', activeFilters[key].length === 0);
            const btn = document.querySelector(`.filter-option[data-key="${key}"][data-value="${value}"]`);
            btn.classList.toggle('active', activeFilters[key].includes(value));
        }

        const labelEl = document.querySelector(`.filter-group[data-key="${key}"] .filter-group-label`);
        const count = activeFilters[key].length;
        const labelText = { year: 'Year', skills: 'Skills', tags: 'Type' }[key];
        labelEl.innerHTML = `${labelText}${count > 0 ? ` (${count})` : ''} <span class="filter-arrow">▾</span>`;

        filterGrid();
    }

    function resetFilters() {
        Object.keys(activeFilters).forEach(k => activeFilters[k] = []);
        document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.filter-all').forEach(btn => btn.classList.add('active'));
        document.querySelectorAll('.filter-group').forEach(g => g.classList.remove('open'));
        document.querySelectorAll('.filter-group-label').forEach(label => {
            const key = label.closest('.filter-group').dataset.key;
            const labelText = { year: 'Year', skills: 'Skills', tags: 'Type' }[key];
            label.innerHTML = `${labelText} <span class="filter-arrow">▾</span>`;
        });
        filterGrid();
    }

    function filterGrid() {
        document.querySelectorAll('.portfolio-item').forEach(item => {
            const year = item.dataset.year;
            const skills = item.dataset.skills;
            const tags = item.dataset.tags;

            const matchYear = activeFilters.year.length === 0 || activeFilters.year.includes(year);
            const matchSkills = activeFilters.skills.length === 0 || activeFilters.skills.some(s => skills.includes(s));
            const matchTags = activeFilters.tags.length === 0 || activeFilters.tags.some(t => tags.includes(t));

            item.style.display = (matchYear && matchSkills && matchTags) ? 'block' : 'none';
        });
    }

    function buildGrid(projects) {
        const grid = document.getElementById('portfolio-grid');
        projects.forEach(obj => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.setAttribute('data-id', obj.id);
            item.setAttribute('data-year', obj.year || '');
            item.setAttribute('data-skills', obj.skills || '');
            item.setAttribute('data-tags', obj.tags || '');

            item.innerHTML = `
                <div class="portfolio-item-image">
                    <img src="images/${obj.id}/${obj.title_image}" alt="${obj.title}">
                </div>
                <div class="portfolio-content">
                    <h3>${obj.title}</h3>
                </div>
            `;

            item.addEventListener('click', () => {
                window.location.href = `project.html?id=${obj.id}`;
            });

            grid.appendChild(item);
        });
    }

    // Underline animation
    function animateUnderline(id) {
        const wrap = document.getElementById(id);
        if (!wrap) return;
        const path = wrap.querySelector('.underline-path');
        if (!path) return;
        const len = path.getTotalLength();
        path.style.transition = 'none';
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                path.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                path.style.strokeDashoffset = '0';
            });
        });
    }

    const portfolioNavLink = document.querySelector('a[href="#portfolio"]');
    if (portfolioNavLink) {
        portfolioNavLink.addEventListener('click', () => animateUnderline('underline-portfolio'));
    }

    const contactNavLink = document.querySelector('a[href="#contact"]');
    if (contactNavLink) {
        contactNavLink.addEventListener('click', () => animateUnderline('underline-contact'));
    }
}
// Globe (About section)
if (document.getElementById('globe')) {
    Promise.all([
        fetch('basemap.json').then(r => r.json()),
        fetch('points.json').then(r => r.json())
    ]).then(([BASEMAP, POINTS]) => {
        // paste all the globe JS here without the const declarations for BASEMAP and POINTS
    });
}

// CV Modal
const openCvBtn = document.getElementById('open-cv');
const cvModal = document.getElementById('cv-modal');
const closeCvBtn = document.getElementById('close-cv');
if (openCvBtn && cvModal) {
    openCvBtn.addEventListener('click', () => cvModal.style.display = 'flex');
    closeCvBtn.addEventListener('click', () => cvModal.style.display = 'none');
    cvModal.addEventListener('click', e => { if (e.target === cvModal) cvModal.style.display = 'none'; });
}
// =====================
// PROJECT PAGE ONLY
// =====================
if (document.getElementById('project-content')) {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        document.getElementById('project-content').innerHTML = '<div class="error">No project found.</div>';
    } else {
        fetch('projects.csv')
            .then(res => res.text())
            .then(csv => {
                const lines = csv.trim().split('\n');
                const headers = lines[0].split(';');
                const allProjects = [];

                for (let i = 1; i < lines.length; i++) {
                    const cols = splitCSVLine(lines[i]);
                    const obj = {};
                    headers.forEach((h, idx) => {
                        obj[h.trim()] = (cols[idx] || '').trim();
                    });
                    if (obj.id) allProjects.push(obj);
                }

                const currentIndex = allProjects.findIndex(p => p.id === projectId);
                const project = allProjects[currentIndex];
                const nextProject = allProjects[currentIndex + 1] || allProjects[0];

                if (!project) {
                    document.getElementById('project-content').innerHTML = '<div class="error">Project not found.</div>';
                } else {
                    renderProject(project, nextProject);
                    document.title = `${project.title} - gs.caustics`;
                }
            });
    }

    function renderProject(p, nextProject) {
        const skills = p.skills ? p.skills.split('|').map(s => s.trim()).join(' · ') : '';
        const tags = p.tags ? p.tags.split('|').map(t => t.trim()).join(' · ') : '';

        const linkHTML = p.link
            ? `<div class="sidebar-section">
                   <div class="sidebar-label">Link</div>
                   <a href="${p.link.trim()}" target="_blank" class="project-link">View project ↗</a>
               </div>`
            : '';

        const mainImageHTML = p.main_image
            ? `<div class="main-image-wrap">
                   <img src="images/${p.id}/${p.main_image}" alt="${p.title}">
               </div>`
            : '';

        const extraImagesHTML = p.extra_images
            ? p.extra_images.split('|').map(img =>
                `<div class="extra-image-wrap">
                    <img src="images/${p.id}/${img.trim()}" alt="${p.title}">
                 </div>`
              ).join('')
            : '';

        document.getElementById('project-content').innerHTML = `
            <div class="project-layout">
                <aside class="project-sidebar">
                    <h1 class="project-title">${p.title}</h1>
                    <div class="sidebar-section">
                        <div class="sidebar-label">Year</div>
                        <div class="sidebar-value">${p.year}</div>
                    </div>
                    <div class="sidebar-section">
                        <div class="sidebar-label">Skills & Tools</div>
                        <div class="skills-text">${skills}</div>
                    </div>
                    <div class="sidebar-section">
                        <div class="sidebar-label">Type</div>
                        <div class="tags-text">${tags}</div>
                    </div>
                    ${linkHTML}
                </aside>
                <div class="project-content">
                    ${mainImageHTML}
                    <p class="project-description">${p.description}</p>
                    <div class="extra-images">${extraImagesHTML}</div>
                </div>
            </div>
        `;

        if (nextProject) {
            document.getElementById('next-btn-wrap').innerHTML = `
                <a href="project.html?id=${nextProject.id}" class="next-btn">
                    ${nextProject.title} →
                </a>
            `;
        }
    }
}
