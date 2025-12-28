// Toggle match breakdown
function toggleMatchBreakdown(id) {
    const breakdown = document.getElementById(`breakdown-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    
    if (breakdown.classList.contains('hidden')) {
        breakdown.classList.remove('hidden');
        chevron.classList.remove('fa-chevron-down');
        chevron.classList.add('fa-chevron-up');
    } else {
        breakdown.classList.add('hidden');
        chevron.classList.remove('fa-chevron-up');
        chevron.classList.add('fa-chevron-down');
    }
}

// Mobile sidebar toggle (if needed)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open breakdowns
        document.querySelectorAll('[id^="breakdown-"]').forEach(el => {
            if (!el.classList.contains('hidden')) {
                const id = el.id.split('-')[1];
                toggleMatchBreakdown(id);
            }
        });
    }
});

