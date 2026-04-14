document.addEventListener('DOMContentLoaded', () => {
    // Handle Splash Screen
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.visibility = 'hidden';
            }, 500);
        }, 2000); // 2 seconds splash
    }

    // Scroll Animations (Simple Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // Handle Active Nav State
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // ROI Counter Animation
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const target = parseInt(stat.innerText);
        if (isNaN(target)) return;
        
        let count = 0;
        const increment = target / 50;
        const interval = setInterval(() => {
            count += increment;
            if (count >= target) {
                stat.innerText = target + (stat.innerText.includes('%') ? '%' : '+');
                clearInterval(interval);
            } else {
                stat.innerText = Math.floor(count) + (stat.innerText.includes('%') ? '%' : '+');
            }
        }, 30);
    });
});
