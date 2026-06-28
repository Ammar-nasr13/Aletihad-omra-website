
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
        if (DB.isAppwriteActive() && DB.lastOperationSource === 'appwrite') {
            statusBadge.textContent = 'متصل بـ Appwrite Cloud';
            statusBadge.className = 'badge badge-approved';
            statusBadge.style.background = '';
            statusBadge.style.color = '';
            statusBadge.style.border = '';
        } else {
            const errorMsg = DB.lastError ? ` (${DB.lastError})` : '';
            statusBadge.textContent = `خطأ بالاتصال / وضع التخزين المحلي ${errorMsg}`;
            statusBadge.className = 'badge';
            statusBadge.style.background = '#fee2e2';
            statusBadge.style.color = '#dc2626';
            statusBadge.style.border = '1px solid rgba(220, 38, 38, 0.15)';
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
                <td><a href="mailto:${booking.email || ''}" style="color:#2563eb; text-decoration:none; font-size:13px; font-weight:600;">${booking.email || '-'}</a></td>
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
                    ${booking.email ? `
                    <button class="btn-action-email send-email-btn" data-id="${booking.$id || booking.id}" title="إرسال تأكيد بالبريد">
                        <i class="fa-solid fa-envelope"></i>
                    </button>
                    ` : ''}
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

        // Add Send Email Event Listeners
        document.querySelectorAll('.send-email-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                const booking = bookings.find(b => (b.$id || b.id) === id);
                if (!booking || !booking.email) return;

                // Get API Key from config
                const apiKey = APPWRITE_CONFIG.apiKey;
                if (!apiKey || apiKey === 'YOUR_APPWRITE_API_KEY_HERE') {
                    alert('يرجى أولاً نسخ ولصق مفتاح الـ API Key الخاص بك في ملف appwrite-db.js (في الحقل apiKey) لتتمكن من إرسال البريد الإلكتروني بنقرة واحدة.');
                    return;
                }

                if (confirm(`هل أنت متأكد من رغبتك في إرسال بريد تأكيد حجز العمرة لـ ${booking.name} (${booking.email})؟`)) {
                    this.disabled = true;
                    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                    try {
                        const emailSent = await sendAppwriteEmail(apiKey, booking);
                        if (emailSent) {
                            alert('تم إرسال بريد التأكيد للعميل بنجاح!');
                        } else {
                            alert('فشل إرسال البريد الإلكتروني. يرجى التحقق من مفتاح الـ API وتكوين SMTP في Appwrite.');
                        }
                    } catch (error) {
                        console.error(error);
                        alert('حدث خطأ غير متوقع أثناء إرسال البريد الإلكتروني.');
                    } finally {
                        this.disabled = false;
                        this.innerHTML = '<i class="fa-solid fa-envelope"></i>';
                    }
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
        try {
            // Seed default reviews if they are missing in Appwrite
            await DB.seedAppwriteReviewsIfEmpty();

            const bookings = await DB.getBookings();
            const reviews = await DB.getAllReviews();
            
            updateConnectionStatus();
            
            updateStats(bookings, reviews);
            renderBookings(bookings);
            renderReviews(reviews);
        } catch (e) {
            console.error('Error refreshing dashboard data:', e);
            updateConnectionStatus();
        }
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('admin_session');
            window.location.replace('login.html');
        });
    }

    // Initial load
    refreshDashboard();

    // Subscribe to Realtime Updates (instantly updates dashboard if users book trips or write reviews)
    if (DB.isAppwriteActive()) {
        DB.subscribeToCollection('bookings', (response) => {
            console.log('Realtime event on bookings:', response.events);
            refreshDashboard();
        });
        
        DB.subscribeToCollection('reviews', (response) => {
            console.log('Realtime event on reviews:', response.events);
            refreshDashboard();
        });
    }

    // REST API helper to send transactional email using Appwrite SMTP Messaging and a temporary user
    async function sendAppwriteEmail(apiKey, booking) {
        const endpoint = 'https://appwrite.ammar-nasr13.cloud/v1';
        const projectId = '6a403b12001b7893f851';
        
        try {
            // 1. Create a temporary user with the target email
            const tempUserId = 'user_' + Math.random().toString(36).substring(2, 9);
            const userResponse = await fetch(`${endpoint}/users`, {
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: tempUserId,
                    email: booking.email,
                    password: 'Pass_' + Math.random().toString(36).substring(2, 9),
                    name: booking.name
                })
            });

            if (!userResponse.ok) {
                const errData = await userResponse.json();
                console.error('Failed to create temporary user:', errData);
                return false;
            }

            const userData = await userResponse.json();
            const userId = userData.$id;

            // 2. Prepare HTML template in Arabic
            const subject = 'تأكيد حجز العمرة - الاتحاد لخدمات المعتمرين';
            const emailHtml = `
            <div style="direction: rtl; font-family: 'Tahoma', 'Arial', sans-serif; text-align: right; background-color: #f4f7f6; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #153e2d; margin: 0; font-size: 22px;">الاتحاد لخدمات المعتمرين</h2>
                    <p style="color: #d97706; margin: 5px 0 0 0; font-size: 13.5px; font-weight: bold;">تأكيد طلب حجز العمرة</p>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; border-top: 4px solid #16a34a; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                    <h3 style="color: #1e293b; margin-top: 0;">مرحباً بك يا ${booking.name}،</h3>
                    <p style="color: #4b5563; font-size: 14.5px; line-height: 1.6; margin-bottom: 20px;">
                        يسعدنا إبلاغك بأنه قد تم تلقي طلب حجز العمرة الخاص بك وتأكيده بنجاح في نظامنا. فيما يلي تفاصيل طلب الحجز:
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; width: 35%;">البرنامج:</td>
                            <td style="padding: 10px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${booking.program}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">الرحلة والمسار:</td>
                            <td style="padding: 10px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${booking.trip}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">تاريخ الرحلة:</td>
                            <td style="padding: 10px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${booking.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">السكن والإقامة:</td>
                            <td style="padding: 10px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${booking.hotel} (${booking.beds} أسرّة)</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">المقاعد المحجوزة:</td>
                            <td style="padding: 10px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">ذكور: ${booking.seats_male} | إناث: ${booking.seats_female}</td>
                        </tr>
                    </table>
                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 0; text-align: center; font-weight: bold;">
                        سنقوم بالتواصل معك هاتفياً قريباً لاستكمال الإجراءات المتبقية وإصدار التصاريح.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 25px; color: #9ca3af; font-size: 11px;">
                    <p style="margin: 0;">جميع الحقوق محفوظة © 2026 الاتحاد لخدمات المعتمرين</p>
                    <p style="margin: 5px 0 0 0;">المدينة المنورة، المملكة العربية السعودية</p>
                </div>
            </div>
            `;

            // 3. Send the email using Hostinger SMTP Provider in Appwrite Messaging
            const messageResponse = await fetch(`${endpoint}/messaging/messages/email`, {
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messageId: 'msg_' + Math.random().toString(36).substring(2, 9),
                    subject: subject,
                    content: emailHtml,
                    users: [userId],
                    draft: false,
                    html: true
                })
            });

            if (!messageResponse.ok) {
                const errData = await messageResponse.json();
                console.error('Failed to create/send email message:', errData);
                // Clean up the user immediately
                await fetch(`${endpoint}/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Appwrite-Project': projectId,
                        'X-Appwrite-Key': apiKey
                    }
                });
                return false;
            }

            // 4. Clean up temporary user after a brief delay
            setTimeout(async () => {
                try {
                    await fetch(`${endpoint}/users/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-Appwrite-Project': projectId,
                            'X-Appwrite-Key': apiKey
                        }
                    });
                    console.log('Temporary user cleaned up successfully:', userId);
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
            }, 3000);

            return true;

        } catch (error) {
            console.error('sendAppwriteEmail error:', error);
            return false;
        }
    }
});
