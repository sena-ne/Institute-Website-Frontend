# Course Catalog Website — Higher Education Institute

Responsive front-end website for a Higher Education Institute to showcase courses, view course details, and contact the institute. Built with plain HTML, CSS and JavaScript/JSON (no backend required).

## 📜 Project Summary
- Purpose: Provide a static, responsive website that lets students and visitors browse available courses, view detailed course information, and contact the institute.
- Pages: Home (institutional details), Course Details (course listings), Contact Us (contact form / contact details).
- Allowed technologies: HTML, CSS, JavaScript and JSON for data.

## 📁 Structure & Key Files
- `index.html` — Home page /  institutional details.
- `courses.html` — Course details page template (or per-course view).
- `contact.html` — Contact page with a form or contact information.
- `styles.css` — Global styles and responsive rules.
- `script.js` — Client-side JavaScript for data loading, interactivity, and navigation.
- `courses.json` / `courses-data.js` — Course data (id, title, type, category, description, duration, fees, image paths, etc.).
- `assets/` — Images, icons and other media (e.g., `assets/courses/` for course images).

## Functional Requirements (implemented)
- Browse a list of courses on the Courses page with summary cards (title, short description, image, call-to-action).
- Contact page with institute address, phone, email and an optional contact form (form can be client-side-only or use mailto/third-party endpoint).
- All data loaded from `courses.json` or `courses-data.js` using JavaScript (so content is easy to update without changing HTML).

## Non-functional Requirements
- Responsive design: layout adapts to phone, tablet and desktop breakpoints.
- Accessibility basics: semantic HTML, alt attributes for images, focus states for interactive elements.
- Performance: optimized images in `assets/`, small JSON payloads, and minimal external dependencies.

## Responsive Design Notes
- Suggested breakpoints: mobile (<= 600px), tablet (601–1024px), desktop (> 1024px).
- Course cards stack vertically on mobile; use a grid (2–3 columns) on larger screens.
- Ensure navigation and contact form are usable on small touch screens (large tap areas, readable fonts).

## How to view locally
1. Open `index.html` directly in your browser for quick checks.
2. Or serve the project folder locally (recommended) to avoid CORS issues when loading JSON:

```bash
# using Python 3
python -m http.server 8000
# then open http://localhost:8000
```

## Recommended Course Data Schema (courses.json)
Example single course object:

```json
{
	"id": "1",
	"title": "Bachelor of Computer Science",
	"type": "Undergraduate",
	"category": "undergraduate",
	"description": "Full course description, learning outcomes, syllabus...",
	"duration": "3 years",
	"credits": "120 credits",
    "image": "assets/courses/cs.jpg",
    "pricePerYear": "$5,000"
}
```

## Testing & Validation
- Manual responsive checks using browser devtools device toolbar.
- Validate HTML with the W3C validator and test images/links before publishing.



