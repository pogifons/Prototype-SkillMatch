const newJobBtn = document.getElementById('newJobBtn');
const jobModal = document.getElementById('jobModal');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const skillsInput = document.getElementById('skillsInput');
const skillInput = skillsInput.querySelector('input');
const aiSuggestions = document.getElementById('aiSuggestions');

newJobBtn.addEventListener('click', () => {
    jobModal.classList.add('open');
    document.body.style.overflow = 'hidden';
});

function closeModal() {
    jobModal.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) closeModal();
});

skillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = skillInput.value.trim();
        if (value) {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerHTML = `${value} <button type="button">&times;</button>`;
            skillsInput.insertBefore(tag, skillInput);
            skillInput.value = '';
            tag.querySelector('button').addEventListener('click', () => tag.remove());
        }
    }
});

document.querySelectorAll('.skill-tag button').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.remove());
});

aiSuggestions.querySelectorAll('span').forEach(tag => {
    tag.addEventListener('click', () => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `${tag.textContent} <button type="button">&times;</button>`;
        skillsInput.insertBefore(skillTag, skillsInput);
        tag.remove();
        skillTag.querySelector('button').addEventListener('click', () => skillTag.remove());
    });
});

