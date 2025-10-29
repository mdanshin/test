const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;
const savedTheme = localStorage.getItem('gh-pages-demo-theme');

if (savedTheme) {
  root.setAttribute('data-theme', savedTheme);
} else if (prefersDark.matches) {
  root.setAttribute('data-theme', 'dark');
}

const toggleButton = document.querySelector('.theme-toggle');
const cards = document.querySelectorAll('.card');

function toggleTheme() {
  const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', nextTheme);
  localStorage.setItem('gh-pages-demo-theme', nextTheme);
}

toggleButton?.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', () => {
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 120}ms`;
    card.classList.add('fade-in');
  });
});
