document.getElementById('year').textContent = new Date().getFullYear();

const toggle = document.querySelector('.nav-toggle');
const header = document.querySelector('.site-header');
const mobileNav = document.getElementById('mobile-nav');

if (toggle && header && mobileNav) {
  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('[data-copy-email]').forEach((button) => {
  const email = button.getAttribute('data-copy-email');
  const defaultLabel = button.textContent;

  button.addEventListener('click', () => {
    const temp = document.createElement('textarea');
    temp.value = email;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      copied = false;
    }
    document.body.removeChild(temp);

    // Fire-and-forget: a nicer copy path on browsers where it resolves
    // immediately, but never block the feedback above on it (it can hang
    // indefinitely on a stalled permission prompt in some environments).
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).catch(() => {});
    }

    button.textContent = copied ? 'Copied' : 'Select and copy: ' + email;
    setTimeout(() => {
      button.textContent = defaultLabel;
    }, 2500);
  });
});
