const newTrainingBtn = document.getElementById('newTrainingBtn');
const trainingModal = document.getElementById('trainingModal');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');

newTrainingBtn.addEventListener('click', () => {
    trainingModal.classList.add('open');
    document.body.style.overflow = 'hidden';
});

function closeModal() {
    trainingModal.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
trainingModal.addEventListener('click', (e) => {
    if (e.target === trainingModal) closeModal();
});

