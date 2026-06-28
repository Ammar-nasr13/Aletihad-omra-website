
        // Mobile Menu Toggle
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');

        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });

        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Smooth scroll for anchor links
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

        // Animate stats on scroll
        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            observer.observe(statsSection);
        }

        function animateStats() {
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                let current = 0;
                const increment = target / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = target + '%';
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(current) + '%';
                    }
                }, 30);
            });
        }

        // Add animation to elements on scroll
        const animateOnScroll = () => {
            const elements = document.querySelectorAll('.feature-card, .program-card');
            elements.forEach((element, index) => {
                const elementTop = element.getBoundingClientRect().top;
                const elementBottom = element.getBoundingClientRect().bottom;
                
                if (elementTop < window.innerHeight && elementBottom > 0) {
                    setTimeout(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        };

        // Set initial state
        document.querySelectorAll('.feature-card, .program-card').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease';
        });

        window.addEventListener('scroll', animateOnScroll);
        window.addEventListener('load', animateOnScroll);

        /* Booking modal and form handling */
        (function () {
            const bookBtn = document.getElementById('bookNowBtn');
            const modal = document.getElementById('bookingModal');
            const closeBtn = modal ? modal.querySelector('.modal-close') : null;
            const cancelBtn = modal ? modal.querySelector('.modal-cancel') : null;
            const form = document.getElementById('bookingForm');
            const status = form ? form.querySelector('.form-status') : null;
            let opener = null;

            function openModal() {
                if (!modal) return;
                opener = document.activeElement;
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                // focus first input
                const first = form.querySelector('input, select, textarea');
                if (first) first.focus();
            }

            function closeModal() {
                if (!modal) return;
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                if (opener) opener.focus();
            }

            if (bookBtn) bookBtn.addEventListener('click', () => openModal());
            if (closeBtn) closeBtn.addEventListener('click', closeModal);

            // Restrict date input to future dates only (today and onwards)
            if (form) {
                const dateInput = form.querySelector('input[type="date"]');
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.min = today;
                }
            }
            if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
            if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

            // Handle "Book this program" button clicks
            document.querySelectorAll('.program-book-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const card = this.closest('.real-program');
                    const progName = card ? card.getAttribute('data-program-name') : null;
                    
                    openModal();
                    
                    // Pre-select the clicked program
                    if (form && progName) {
                        const select = form.querySelector('select[name="program"]');
                        if (select) {
                            select.value = progName;
                        }
                    }
                });
            });

            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.classList.add('is-loading');
                    submitBtn.setAttribute('aria-busy', 'true');
                    if (cancelBtn) cancelBtn.disabled = true;
                    status.textContent = 'جاري الإرسال...';
                    status.classList.remove('success','error');

                    const bookingData = {
                        name: form.elements.name.value,
                        phone: form.elements.phone.value,
                        program: form.elements.program.value,
                        trip: form.elements.trip.value,
                        date: form.elements.date.value,
                        booking_type: form.elements.booking_type.value,
                        gender: form.elements.gender.value,
                        hotel: form.elements.hotel.value,
                        beds: parseInt(form.elements.beds.value) || 0,
                        seats_male: parseInt(form.elements.seats_male.value) || 0,
                        seats_female: parseInt(form.elements.seats_female.value) || 0,
                        notes: form.elements.notes.value
                    };

                    DB.addBooking(bookingData)
                        .then(() => {
                            status.textContent = 'تم إرسال طلب الحجز بنجاح. سنتواصل معك قريبا.';
                            status.classList.add('success');
                            form.reset();
                            setTimeout(() => { 
                                closeModal(); 
                                status.textContent = ''; 
                                status.classList.remove('success'); 
                                submitBtn.disabled = false;
                                submitBtn.classList.remove('is-loading');
                                submitBtn.removeAttribute('aria-busy');
                                submitBtn.textContent = originalText;
                                if (cancelBtn) cancelBtn.disabled = false;
                            }, 2200);
                        })
                        .catch((err) => {
                            console.error(err);
                            status.textContent = 'حدث خطأ أثناء إرسال الطلب. يمكنك المحاولة لاحقًا أو الاتصال بنا.';
                            status.classList.add('error');
                            submitBtn.disabled = false;
                            submitBtn.classList.remove('is-loading');
                            submitBtn.removeAttribute('aria-busy');
                            submitBtn.textContent = originalText;
                            if (cancelBtn) cancelBtn.disabled = false;
                        });
                });
            }
        })();

        /* Reviews Carousel and Submission Handling */
        (function () {
            const addReviewBtn = document.getElementById('addReviewBtn');
            const reviewModal = document.getElementById('reviewModal');
            const reviewForm = document.getElementById('reviewForm');
            const reviewsCarousel = document.getElementById('reviewsCarousel');
            const prevReviewBtn = document.getElementById('prevReviewBtn');
            const nextReviewBtn = document.getElementById('nextReviewBtn');

            if (!reviewsCarousel) return; // Only run on pages with the reviews section

            const closeBtn = reviewModal ? reviewModal.querySelector('.modal-close') : null;
            const cancelBtn = reviewModal ? reviewModal.querySelector('.modal-cancel') : null;
            const status = reviewForm ? reviewForm.querySelector('.form-status') : null;

            // Load and Render Approved Reviews
            async function loadReviews() {
                try {
                    reviewsCarousel.innerHTML = '<div class="carousel-loading">جاري تحميل التقييمات...</div>';
                    const list = await DB.getApprovedReviews();
                    
                    if (list.length === 0) {
                        reviewsCarousel.innerHTML = '<div class="carousel-empty">لا توجد تقييمات معتمدة بعد. كن أول من يضيف تقييمه!</div>';
                        return;
                    }

                    reviewsCarousel.innerHTML = '';
                    list.forEach(review => {
                        const card = document.createElement('div');
                        card.className = 'review-card';
                        
                        // Stars HTML
                        let starsHtml = '';
                        for (let i = 1; i <= 5; i++) {
                            if (i <= review.rating) {
                                starsHtml += '<i class="fa-solid fa-star"></i>';
                            } else {
                                starsHtml += '<i class="fa-regular fa-star"></i>';
                            }
                        }

                        // Avatar Initial
                        const initial = review.name ? review.name.trim().charAt(0) : 'ع';

                        // Format Date
                        let dateStr = '';
                        if (review.created_at) {
                            const dateObj = new Date(review.created_at);
                            dateStr = dateObj.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
                        }

                        card.innerHTML = `
                            <div class="review-header">
                                <div class="review-avatar">${initial}</div>
                                <div class="review-user-info">
                                    <h4 class="review-username">${review.name}</h4>
                                    <div class="review-verified"><i class="fa-solid fa-circle-check"></i> عميل مؤكد</div>
                                </div>
                                <div class="review-stars">${starsHtml}</div>
                            </div>
                            <p class="review-comment">"${review.comment}"</p>
                            <span class="review-date">${dateStr}</span>
                        `;
                        reviewsCarousel.appendChild(card);
                    });
                } catch (e) {
                    console.error('Error loading reviews:', e);
                    reviewsCarousel.innerHTML = '<div class="carousel-error">حدث خطأ أثناء تحميل التقييمات.</div>';
                }
            }

            // Carousel Scrolling Logic
            if (prevReviewBtn && nextReviewBtn) {
                prevReviewBtn.addEventListener('click', () => {
                    reviewsCarousel.scrollBy({
                        left: 320, // scroll width of one card + gap
                        behavior: 'smooth'
                    });
                });

                nextReviewBtn.addEventListener('click', () => {
                    reviewsCarousel.scrollBy({
                        left: -320,
                        behavior: 'smooth'
                    });
                });
            }

            // Stars Selection Logic
            const starRatingInput = document.getElementById('starRatingInput');
            const ratingValue = document.getElementById('ratingValue');
            if (starRatingInput && ratingValue) {
                const stars = starRatingInput.querySelectorAll('.star-btn');
                stars.forEach(star => {
                    star.addEventListener('click', function () {
                        const val = parseInt(this.getAttribute('data-value'));
                        ratingValue.value = val;
                        
                        // Update active stars
                        stars.forEach(s => {
                            const sVal = parseInt(s.getAttribute('data-value'));
                            const icon = s.querySelector('i');
                            if (sVal <= val) {
                                icon.className = 'fa-solid fa-star';
                                s.classList.add('selected');
                            } else {
                                icon.className = 'fa-regular fa-star';
                                s.classList.remove('selected');
                            }
                        });
                    });
                });
            }

            // Modal Toggles
            function openReviewModal() {
                if (!reviewModal) return;
                reviewModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                const first = reviewForm.querySelector('input, textarea');
                if (first) first.focus();
            }

            function closeReviewModal() {
                if (!reviewModal) return;
                reviewModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }

            if (addReviewBtn) addReviewBtn.addEventListener('click', openReviewModal);
            if (closeBtn) closeBtn.addEventListener('click', closeReviewModal);
            if (cancelBtn) cancelBtn.addEventListener('click', closeReviewModal);
            if (reviewModal) reviewModal.addEventListener('click', (e) => { if (e.target === reviewModal) closeReviewModal(); });

            // Form Submit Logic
            if (reviewForm) {
                reviewForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    if (!reviewForm.checkValidity()) {
                        reviewForm.reportValidity();
                        return;
                    }

                    const submitBtn = reviewForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.classList.add('is-loading');
                    if (cancelBtn) cancelBtn.disabled = true;
                    status.textContent = 'جاري إرسال التقييم...';
                    status.classList.remove('success', 'error');

                    const reviewData = {
                        name: reviewForm.elements.name.value,
                        rating: parseInt(ratingValue.value) || 5,
                        comment: reviewForm.elements.comment.value
                    };

                    try {
                        await DB.addReview(reviewData);
                        status.textContent = 'تم إرسال تقييمك بنجاح. سيتم عرضه فور مراجعته من الإدارة.';
                        status.classList.add('success');
                        reviewForm.reset();
                        
                        // Reset star rating UI
                        const stars = starRatingInput.querySelectorAll('.star-btn');
                        stars.forEach((s, idx) => {
                            s.querySelector('i').className = 'fa-solid fa-star'; // Reset to 5 stars
                            s.classList.add('selected');
                        });
                        ratingValue.value = 5;

                        setTimeout(() => {
                            closeReviewModal();
                            status.textContent = '';
                            status.classList.remove('success');
                            submitBtn.disabled = false;
                            submitBtn.classList.remove('is-loading');
                            if (cancelBtn) cancelBtn.disabled = false;
                        }, 2500);

                    } catch (err) {
                        console.error(err);
                        status.textContent = 'حدث خطأ أثناء إرسال التقييم. يمكنك المحاولة مرة أخرى.';
                        status.classList.add('error');
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('is-loading');
                        if (cancelBtn) cancelBtn.disabled = false;
                    }
                });
            }

            // Initial Load
            loadReviews();
        })();