// Window controls
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');
const themeToggle = document.getElementById('themeToggle');
const changelogBtn = document.getElementById('changelogBtn');
const changelogModal = document.getElementById('changelogModal');
const closeModal = document.getElementById('closeModal');

// Window control functions
minimizeBtn.addEventListener('click', () => {
    window.electron.minimize();
});

maximizeBtn.addEventListener('click', () => {
    window.electron.maximize();
});

closeBtn.addEventListener('click', () => {
    window.electron.close();
});

// Theme toggle
let currentTheme = 'dark';
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
});

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    currentTheme = savedTheme;
});

// Changelog modal
changelogBtn.addEventListener('click', async () => {
    try {
        // Fetch the CHANGELOG.md content
        const response = await fetch('../CHANGELOG.md');
        const markdownContent = await response.text();
        
        // Convert markdown to HTML (basic conversion)
        const htmlContent = markdownContent
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^\- (.*$)/gm, '<li>$1</li>')
            .replace(/\n\n/g, '<br>')
            .replace(/^(?!<[h|l])/gm, '<p>$&</p>');

        // Update modal content
        const modalBody = changelogModal.querySelector('.modal-body');
        modalBody.innerHTML = htmlContent;
        
        // Show modal
        changelogModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading changelog:', error);
        const modalBody = changelogModal.querySelector('.modal-body');
        modalBody.innerHTML = '<p>Error loading changelog. Please try again later.</p>';
        changelogModal.style.display = 'block';
    }
});

closeModal.addEventListener('click', () => {
    changelogModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === changelogModal) {
        changelogModal.style.display = 'none';
    }
}); 