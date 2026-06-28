document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const statusBadge = document.getElementById('statusBadge');
    const statBookings = document.getElementById('statBookings');
    const statAvgRating = document.getElementById('statAvgRating');
    const statApprovedReviews = document.getElementById('statApprovedReviews');
    const statPendingReviews = document.getElementById('statPendingReviews');

    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const pendingReviewsTableBody = document.getElementById('pendingReviewsTableBody');
    const approvedReviewsTableBody = document.getElementById('approvedReviewsTableBody');

    const bookingCountLabel = document.getElementById('bookingCountLabel');
    const pendingReviewsCountLabel = document.getElementById('pendingReviewsCountLabel');
    const approvedReviewsCountLabel = document.getElementById('approvedReviewsCountLabel');

    // Tab Switching
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // Verify and show Database connection status
    function updateConnectionStatus() {
        if (!statusBadge) return;
        if (DB.isAppwriteActive()) {
            statusBadge.textContent = 'متصل بـ Appwrite Cloud';
            statusBadge.className = 'badge badge-approved';
        } else {
            statusBadge.textContent = 'وضع التخزين المحلي (LocalStorage)';
            statusBadge.className = 'badge badge-pending';
        }
    }

    // Refresh Stats Dashboard
    function updateStats(bookings, reviews) {
        if (statBookings) statBookings.textContent = bookings.length;
        
        const approved = reviews.filter(r => r.status === 'approved');
        const pending = reviews.filter(r => r.status === 'pending');
        
        if (statApprovedReviews) statApprovedReviews.textContent = approved.length;
        if (statPendingReviews) statPendingReviews.textContent = pending.length;

        // Calculate Average Rating
        if (statAvgRating) {
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                const avg = totalRating / reviews.length;
                statAvgRating.textContent = avg.toFixed(1);
            } else {
                statAvgRating.textContent = '0.0';
            }
        }

        // Update Table Headers Badge Count
        if (bookingCountLabel) bookingCountLabel.textContent = `${bookings.length} حجز`;
        if (pendingReviewsCountLabel) pendingReviewsCountLabel.textContent = `${pending.length} معلق`;
        if (approvedReviewsCountLabel) approvedReviewsCountLabel.textContent = `${approved.length} مقبول`;
    }

    // Render Bookings list
    function renderBookings(bookings) {
        if (!bookingsTableBody) return;
        if (bookings.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="admin-empty-state">لا توجد طلبات حجز مسجلة حالياً.</td>
                </tr>
            `;
            return;
        }

        bookingsTableBody.innerHTML = '';
        bookings.forEach(booking => {
            const tr = document.createElement('tr');
            
            // Format Date
            const dateObj = new Date(booking.created_at || booking.$createdAt);
            const dateStr = dateObj.toLocaleDateString('ar-SA', { 
                month: 'numeric', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Booking Type Badge
            const typeBadge = booking.booking_type === 'عوائل' ? 'عوائل' : 'عزاب';

            tr.innerHTML = `
                <td style="font-size:12px; color:#6b7280; white-space:nowrap;">${dateStr}</td>
                <td style="font-weight:700;">${booking.name}</td>
                <td><a href="tel:${booking.phone}" style="color:var(--primary-color); text-decoration:none; font-weight:700;">${booking.phone}</a></td>
                <td style="font-size:13px; font-weight:600; color:var(--secondary-color);">${booking.program}</td>
                <td style="font-size:13px;">
                    <div>${booking.trip}</div>
                    <div style="font-size:11px; color:#6b7280; margin-top:2px;"><i class="fa-solid fa-calendar-days"></i> ${booking.date}</div>
                </td>
                <td style="font-size:13px;">${booking.hotel}</td>
                <td style="font-size:13px; font-weight:600;">
                    <div>أسرّة: ${booking.beds || 0}</div>
                    <div style="font-size:11px; color:#6b7280; margin-top:2px;">مقاعد: ذكور ${booking.seats_male || 0} | إناث ${booking.seats_female || 0}</div>
                </td>
                <td style="font-size:12.5px; max-width:180px; overflow-wrap:break-word; color:#4b5563;">${booking.notes || '-'}</td>
                <td>
                    <button class="btn-action-delete delete-booking-btn" data-id="${booking.$id || booking.id}" title="حذف الحجز">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            bookingsTableBody.appendChild(tr);
        });

        // Add Delete Event Listeners
        document.querySelectorAll('.delete-booking-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                if (confirm('هل أنت متأكد من رغبتك في حذف طلب الحجز هذا نهائياً؟')) {
                    this.disabled = true;
                    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    await DB.deleteBooking(id);
                    refreshDashboard();
                }
            });
        });
    }

    // Render Reviews
    function renderReviews(reviews) {
        if (!pendingReviewsTableBody || !approvedReviewsTableBody) return;

        const pending = reviews.filter(r => r.status === 'pending');
        const approved = reviews.filter(r => r.status === 'approved');

        // Render Pending Table
        if (pending.length === 0) {
            pendingReviewsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="admin-empty-state">لا توجد تقييمات معلقة بانتظار المراجعة.</td>
                </tr>
            `;
        } else {
            pendingReviewsTableBody.innerHTML = '';
            pending.forEach(review => {
                const tr = document.createElement('tr');
                const dateObj = new Date(review.created_at || review.$createdAt);
                const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric', year: '2-digit' });

                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += i <= review.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
                }

                tr.innerHTML = `
                    <td style="font-size:12px; color:#6b7280;">${dateStr}</td>
                    <td style="font-weight:700;">${review.name}</td>
                    <td><div class="admin-stars">${stars}</div></td>
                    <td style="max-width:300px; color:#4b5563; font-style:italic;">"${review.comment}"</td>
                    <td>
                        <button class="btn-action-approve approve-review-btn" data-id="${review.$id || review.id}" title="قبول ونشر التقييم">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn-action-delete delete-review-btn" data-id="${review.$id || review.id}" title="حذف التقييم">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                pendingReviewsTableBody.appendChild(tr);
            });
        }

        // Render Approved Table
        if (approved.length === 0) {
            approvedReviewsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="admin-empty-state">لا توجد تقييمات منشورة على الموقع.</td>
                </tr>
            `;
        } else {
            approvedReviewsTableBody.innerHTML = '';
            approved.forEach(review => {
                const tr = document.createElement('tr');
                const dateObj = new Date(review.created_at || review.$createdAt);
                const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric', year: '2-digit' });

                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += i <= review.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
                }

                tr.innerHTML = `
                    <td style="font-size:12px; color:#6b7280;">${dateStr}</td>
                    <td style="font-weight:700;">${review.name}</td>
                    <td><div class="admin-stars">${stars}</div></td>
                    <td style="max-width:300px; color:#4b5563; font-style:italic;">"${review.comment}"</td>
                    <td>
                        <button class="btn-action-reject reject-review-btn" data-id="${review.$id || review.id}" title="إخفاء التقييم وإعادته للمراجعة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <button class="btn-action-delete delete-review-btn" data-id="${review.$id || review.id}" title="حذف التقييم">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                approvedReviewsTableBody.appendChild(tr);
            });
        }

        // Add Review Event Listeners
        document.querySelectorAll('.approve-review-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                this.disabled = true;
                this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await DB.updateReviewStatus(id, 'approved');
                refreshDashboard();
            });
        });

        document.querySelectorAll('.reject-review-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                this.disabled = true;
                this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await DB.updateReviewStatus(id, 'pending');
                refreshDashboard();
            });
        });

        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                if (confirm('هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟')) {
                    this.disabled = true;
                    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    await DB.deleteReview(id);
                    refreshDashboard();
                }
            });
        });
    }

    // Refresh Dashboard Data
    async function refreshDashboard() {
        updateConnectionStatus();
        try {
            const bookings = await DB.getBookings();
            const reviews = await DB.getAllReviews();
            
            updateStats(bookings, reviews);
            renderBookings(bookings);
            renderReviews(reviews);
        } catch (e) {
            console.error('Error refreshing dashboard data:', e);
        }
    }

    // Initial load
    refreshDashboard();
});
