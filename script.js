// Single module-scoped script: consolidate initialization, improve fetch fallback and event delegation
// This file is loaded as an ES module (`type="module"`) for modern scoping and deferred execution.

// Utility: safe query
const $ = (selector, el = document) => el.querySelector(selector);
const $$ = (selector, el = document) => Array.from(el.querySelectorAll(selector));

// Fetch courses.json with fallbacks: fetch -> window.COURSES -> inline JSON script (#courses-json)
async function fetchCoursesWithFallback() {
    // Try network fetch first (works when served over http://)
    try {
        const res = await fetch('courses.json', { cache: 'no-store' });
        if (res.ok) return await res.json();
        console.warn('courses.json fetch returned', res.status);
    } catch (err) {
        console.warn('fetch courses.json failed, falling back:', err && err.message);
    }

    // Fallback to global provided data (for file:// usage)
    if (window.COURSES) return window.COURSES;

    // Final fallback: an inline <script type="application/json" id="courses-json">...</script>
    const inline = document.getElementById('courses-json');
    if (inline) {
        try {
            return JSON.parse(inline.textContent);
        } catch (err) {
            console.error('Invalid inline courses JSON', err);
        }
    }

    // Nothing available
    return null;
}

// Main initialiser
document.addEventListener('DOMContentLoaded', async () => {
    // NAVIGATION
    const navToggle = $('#navToggle');
    const navMenu = $('#navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));

        // Close when clicking a link (event delegation not necessary here)
        navMenu.addEventListener('click', (e) => {
            if (e.target.closest('a')) navMenu.classList.remove('active');
        });

        // Close when clicking outside
        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !navToggle.contains(event.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        });
    }

    // THEME
    const themeToggle = $('#themeToggle');
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', theme === 'dark');
            themeToggle.innerHTML = theme === 'dark'
                ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
                : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        }
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) applyTheme(savedTheme);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
    else applyTheme('light');
    if (themeToggle) themeToggle.addEventListener('click', () => { const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(next); localStorage.setItem('theme', next); });

    // HERO SLIDER
    if ($('#heroSlider')) initHeroSlider();

    // COURSES (if present)
    const coursesGrid = $('#coursesGrid');
    let coursesData = null;
    if (coursesGrid) {
        coursesData = await fetchCoursesWithFallback();
        if (!coursesData || !Array.isArray(coursesData.courses)) {
            coursesGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">Error loading courses. Please try again later.</p>';
            console.error('No courses data available');
        } else {
            displayCourses(coursesData.courses);

            // Use event delegation for enroll buttons
            coursesGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.enroll-btn');
                if (!btn) return;
                const id = btn.getAttribute('data-course-id');
                const title = btn.getAttribute('data-course-title');
                const params = new URLSearchParams({ courseId: id, courseTitle: title });
                window.location.href = `contact.html?${params.toString()}`;
            });

            // Filter buttons via delegation
            const filterContainer = $('.filter-buttons');
            if (filterContainer) {
                filterContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('.filter-btn');
                    if (!btn) return;
                    $$('.filter-btn', filterContainer).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const category = btn.getAttribute('data-category') || 'all';
                    filterCourses(coursesData.courses, category);
                });
            }
        }
    }

    // CONTACT FORM
    if ($('#contactForm')) handleContactForm();

    // SMOOTH SCROLL for anchors (uses delegation)
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });

    // Animate-on-scroll: observe after initial content inserted
    initScrollAnimations();
});

// Load and display courses from JSON or from window.COURSES (file:// fallback)
async function loadCourses() {
    try {
        let data;

        // If a global `window.COURSES` is provided (e.g. courses-data.js), use it.
        if (window.COURSES) {
            data = window.COURSES;
        } else {
            const response = await fetch('courses.json');
            data = await response.json();
        }

        const coursesGrid = document.getElementById('coursesGrid');

        // Display all courses
        displayCourses(data.courses);

        // Setup filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Filter courses
                const category = this.getAttribute('data-category');
                filterCourses(data.courses, category);
            });
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        const grid = document.getElementById('coursesGrid');
        if (grid) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Error loading courses. Please try again later.</p>';
        }
    }
}

// Display courses in the grid
function displayCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = '';

    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

// Create a course card element
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.setAttribute('data-category', course.category);
    card.innerHTML = `
        <div class="course-media">
            <img src="${course.image || 'https://via.placeholder.com/600x360?text=Course+Image'}" alt="${course.title} cover" loading="lazy">
            <div class="course-media-overlay">
                <h3 class="media-title">${course.title}</h3>
                <span class="course-type">${course.type}</span>
            </div>
        </div>
        <div class="course-body">
            <p>${course.description}</p>
            <div class="course-info">
                <div class="info-row">
                    <strong>Duration:</strong> <span>${course.duration}</span>
                </div>
                <div class="info-row">
                    <strong>Credits:</strong> <span>${course.credits}</span>
                </div>
            </div>
        </div>
        <div class="course-footer">
            <div class="price">Price / year: <strong>${course.pricePerYear || 'TBD'}</strong></div>
            <button class="btn enroll-btn" data-course-id="${course.id}" data-course-title="${escapeHtmlAttr(course.title)}">Enroll</button>
        </div>
    `;

    return card;
}

// Small utility to escape attribute values
function escapeHtmlAttr(str = '') {
    return String(str).replace(/"/g, '&quot;');
}

// Filter courses by category
function filterCourses(courses, category) {
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.classList.remove('hidden');
            // Add fade-in animation
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.classList.add('hidden');
        }
    });
}

// Handle contact form submission
function handleContactForm() {
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // Validate form
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showFormMessage('Please fill in all required fields.', 'error');
            return;
        }

        // Validate email
        if (!isValidEmail(formData.email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Simulate form submission (in a real application, this would send data to a server)
        console.log('Form submitted:', formData);

        // Show success message
        showFormMessage('Thank you for your message! We will get back to you within 24 hours.', 'success');

        // Reset form
        form.reset();

        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
            formMessage.className = 'form-message';
        }, 5000);
    });
}

// Scroll animations: set up the observer and apply to elements
function initScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .stat-item, .course-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Show form message
function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';

    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// Add animation on scroll (optional enhancement)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.feature-card, .stat-item, .course-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Hero slider: basic automatic slideshow with controls and indicators
function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.slide'));
    const prev = document.getElementById('sliderPrev');
    const next = document.getElementById('sliderNext');
    const indicatorsContainer = document.getElementById('sliderIndicators');

    // (Re)build indicators to match the number of slides so adding/removing slides
    // in the HTML doesn't require manual updates to the indicator buttons.
    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.className = 'indicator' + (i === 0 ? ' active' : '');
            btn.setAttribute('data-index', String(i));
            btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicatorsContainer.appendChild(btn);
        });
    }
    let indicators = [];
    if (indicatorsContainer) indicators = Array.from(indicatorsContainer.querySelectorAll('.indicator'));
    let current = slides.findIndex(s => s.classList.contains('active'));
    if (current < 0) current = 0;

    // Ensure initial active state
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === current));

    let interval = null;
    const delay = 4000; // autoplay interval in ms

    function goTo(index) {
        index = ((index % slides.length) + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
        current = index;
    }

    function nextSlide() { goTo(current + 1); }
    function prevSlide() { goTo(current - 1); }

    function start() {
        stop();
        interval = setInterval(nextSlide, delay);
    }

    function stop() {
        if (interval) { clearInterval(interval); interval = null; }
    }

    // Controls: advance and restart timer when user interacts
    if (next) next.addEventListener('click', () => { nextSlide(); start(); });
    if (prev) prev.addEventListener('click', () => { prevSlide(); start(); });

    // Indicators
    indicators.forEach(ind => ind.addEventListener('click', function() {
        const idx = Number(this.getAttribute('data-index'));
        if (!Number.isNaN(idx)) { goTo(idx); start(); }
    }));

    // Start autoplay immediately and do not pause on hover
    start();
}
