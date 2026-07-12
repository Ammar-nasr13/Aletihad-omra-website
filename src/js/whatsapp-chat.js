// WhatsApp Chatbot widget for Etihad Omrah Services
(function () {
    // 1. Inject Styles dynamically to keep the widget fully self-contained
    const styles = `
        .wa-chat-widget {
            position: fixed;
            bottom: 80px;
            right: 25px;
            z-index: 99999;
            font-family: 'Cairo', 'Almarai', sans-serif;
            direction: rtl;
            text-align: right;
        }

        @media (max-width: 768px) {
            .wa-chat-widget {
                bottom: 85px;
                right: 15px;
            }
        }

        .wa-chat-trigger {
            background-color: #25d366;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 32px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s ease;
            outline: none;
        }
        .wa-chat-trigger:hover {
            transform: scale(1.08);
            background-color: #20ba5a;
        }
        .wa-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #25d366;
            opacity: 0.4;
            animation: wa-pulse-anim 2.5s infinite;
            z-index: -1;
            top: 0;
            left: 0;
        }
        @keyframes wa-pulse-anim {
            0% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(1.6); opacity: 0; }
        }

        .wa-chat-box {
            position: absolute;
            bottom: 75px;
            right: 0;
            width: 360px;
            max-width: calc(100vw - 30px);
            height: 480px;
            max-height: calc(100vh - 180px);
            background-color: #efeae2;
            border-radius: 16px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.22);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            opacity: 1;
            transform: translateY(0) scale(1);
            transform-origin: bottom right;
        }
        
        .wa-chat-box.hidden {
            opacity: 0;
            transform: translateY(30px) scale(0.8);
            pointer-events: none;
        }

        .wa-chat-header {
            background-color: #075e54;
            color: white;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .wa-chat-avatar {
            position: relative;
            width: 42px;
            height: 42px;
            flex-shrink: 0;
        }
        .wa-chat-avatar img {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            object-fit: cover;
            background-color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .wa-status-dot {
            position: absolute;
            bottom: 1px;
            left: 1px;
            width: 10px;
            height: 10px;
            background-color: #4caf50;
            border-radius: 50%;
            border: 2px solid #075e54;
        }
        .wa-chat-info {
            flex: 1;
        }
        .wa-chat-info h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.3;
        }
        .wa-chat-info p {
            margin: 2px 0 0 0;
            font-size: 11px;
            opacity: 0.9;
        }
        .wa-chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 26px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s, transform 0.2s;
            line-height: 1;
            padding: 0;
            margin: 0;
        }
        .wa-chat-close:hover {
            opacity: 1;
            transform: scale(1.15);
        }

        .wa-chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background-color: #efeae2;
            background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
            background-size: contain;
            background-repeat: repeat;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-behavior: smooth;
        }
        
        .wa-msg {
            max-width: 85%;
            padding: 9px 12px;
            border-radius: 8.5px;
            font-size: 13.5px;
            line-height: 1.5;
            position: relative;
            box-shadow: 0 1px 1.5px rgba(0,0,0,0.12);
            word-break: break-word;
            animation: wa-msg-slide 0.25s ease-out;
        }
        
        @keyframes wa-msg-slide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .wa-msg.sent {
            align-self: flex-start;
            background-color: #e2f7cb;
            color: #111;
            border-top-left-radius: 0;
        }
        .wa-msg.received {
            align-self: flex-end;
            background-color: white;
            color: #111;
            border-top-right-radius: 0;
        }
        .wa-time {
            display: block;
            font-size: 9px;
            color: #7f7f7f;
            text-align: left;
            margin-top: 4px;
        }

        .wa-chat-footer {
            padding: 10px 12px;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            gap: 8px;
            border-top: 1px solid #e2e2e2;
        }
        .wa-chat-input-container {
            flex: 1;
            position: relative;
        }
        .wa-chat-footer input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #e2e2e2;
            border-radius: 24px;
            outline: none;
            font-size: 13.5px;
            background-color: white;
            font-family: inherit;
            box-sizing: border-box;
        }
        .wa-chat-footer input:focus {
            border-color: #075e54;
        }
        .wa-chat-send {
            background-color: #075e54;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s, transform 0.2s;
            flex-shrink: 0;
            outline: none;
        }
        .wa-chat-send:hover {
            background-color: #054d44;
            transform: scale(1.05);
        }
        
        .wa-typing-bubble {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 10px 14px !important;
            align-self: flex-end;
            background-color: white;
            border-top-right-radius: 0;
        }
        .wa-dot {
            width: 6px;
            height: 6px;
            background-color: #909090;
            border-radius: 50%;
            animation: wa-dot-blink 1.4s infinite both;
        }
        .wa-dot:nth-child(2) { animation-delay: 0.2s; }
        .wa-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes wa-dot-blink {
            0% { opacity: .2; transform: scale(0.8); }
            20% { opacity: 1; transform: scale(1.15); }
            100% { opacity: .2; transform: scale(0.8); }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // 2. Inject HTML into the DOM dynamically
    const chatWidgetMarkup = `
        <div id="wa-chat-widget" class="wa-chat-widget">
            <button id="wa-chat-trigger" class="wa-chat-trigger" aria-label="محادثة واتساب">
                <i class="fa-brands fa-whatsapp"></i>
                <span class="wa-pulse"></span>
            </button>
            
            <div id="wa-chat-box" class="wa-chat-box hidden">
                <div class="wa-chat-header">
                    <div class="wa-chat-avatar">
                        <img src="images/logo-navbar.webp" alt="شعار الاتحاد" onerror="this.src='images/logo.png'">
                        <span class="wa-status-dot"></span>
                    </div>
                    <div class="wa-chat-info">
                        <h4>مساعد اتحاد المعتمرين الذكي</h4>
                        <p id="wa-typing-status">نشط الآن</p>
                    </div>
                    <button id="wa-chat-close" class="wa-chat-close" aria-label="إغلاق">&times;</button>
                </div>
                <div id="wa-chat-body" class="wa-chat-body">
                    <!-- Dynamic Messages will load here -->
                </div>
                <div class="wa-chat-footer">
                    <div class="wa-chat-input-container">
                        <input type="text" id="wa-chat-input" placeholder="اكتب استفسارك هنا..." autocomplete="off" />
                    </div>
                    <button id="wa-chat-send" class="wa-chat-send" aria-label="إرسال">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = chatWidgetMarkup;
    document.body.appendChild(wrapper.firstElementChild);

    // 3. Logic and API Integration
    const trigger = document.getElementById('wa-chat-trigger');
    const chatBox = document.getElementById('wa-chat-box');
    const closeBtn = document.getElementById('wa-chat-close');
    const input = document.getElementById('wa-chat-input');
    const sendBtn = document.getElementById('wa-chat-send');
    const chatBody = document.getElementById('wa-chat-body');
    const typingStatus = document.getElementById('wa-typing-status');

    let chatHistory = [];
    let config = null;

    // Toggle Chatbox
    trigger.addEventListener('click', async () => {
        const isHidden = chatBox.classList.contains('hidden');
        chatBox.classList.toggle('hidden');
        if (isHidden) {
            input.focus();
            // Load config on open if not loaded
            if (!config) {
                await initChatbotConfig();
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        chatBox.classList.add('hidden');
    });

    // Close on escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            chatBox.classList.add('hidden');
        }
    });

    // Format Current Time
    function getFormattedTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12; // 12 instead of 0
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    }

    // Append Message to UI
    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `wa-msg ${sender}`;
        
        // Escape HTML to prevent XSS
        const textSpan = document.createElement('span');
        textSpan.innerHTML = text.replace(/\n/g, '<br>');
        msgDiv.appendChild(textSpan);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'wa-time';
        timeSpan.textContent = getFormattedTime();
        msgDiv.appendChild(timeSpan);

        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Save to in-memory session history
        chatHistory.push({ sender, text });
    }

    // Show/Hide Typing Indicator
    function showTypingIndicator() {
        if (document.getElementById('wa-typing-bubble')) return;
        
        typingStatus.textContent = 'يكتب الآن...';
        
        const bubble = document.createElement('div');
        bubble.id = 'wa-typing-bubble';
        bubble.className = 'wa-msg received wa-typing-bubble';
        bubble.innerHTML = `
            <span class="wa-dot"></span>
            <span class="wa-dot"></span>
            <span class="wa-dot"></span>
        `;
        chatBody.appendChild(bubble);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTypingIndicator() {
        const bubble = document.getElementById('wa-typing-bubble');
        if (bubble) bubble.remove();
        typingStatus.textContent = 'نشط الآن';
    }

    // Initialize Chatbot configuration from Appwrite / LocalStorage
    async function initChatbotConfig() {
        try {
            if (typeof DB !== 'undefined') {
                config = await DB.getChatbotConfig();
            }
        } catch (e) {
            console.warn('Appwrite DB config fetch failed, using localStorage fallback:', e);
        }

        if (!config) {
            config = {
                apiKey: localStorage.getItem('chatbot_openai_key') || '',
                greetingMessage: localStorage.getItem('chatbot_greeting_message') || 'أهلاً بك أخي المعتمر / أختي المعتمرة في الاتحاد لخدمات المعتمرين. كيف يمكنني مساعدتك اليوم؟',
                systemPrompt: localStorage.getItem('chatbot_system_prompt') || '',
                model: localStorage.getItem('chatbot_model') || 'gpt-4o-mini'
            };
        }

        // Add greeting message if chat is empty
        if (chatBody.children.length === 0) {
            setTimeout(() => {
                appendMessage('received', config.greetingMessage);
            }, 500);
        }
    }

    // Call OpenAI API
    async function callOpenAI(apiKey, model, systemPrompt, userMessage, history) {
        const url = 'https://api.openai.com/v1/chat/completions';
        
        // Default prompt if not customized
        const defaultPrompt = `أنت المساعد الذكي الافتراضي لشركة "الاتحاد لخدمات المعتمرين" (Etihad Omrah Services).
مهمتك هي الإجابة على استفسارات العملاء والزوار حول رحلات العمرة والخدمات التي تقدمها الشركة بأدب واحترام وبأسلوب إسلامي ترحيبي دافئ (مثال: "أهلاً بك أخي المعتمر / أختي المعتمرة...").

معلومات الشركة والبرامج المتاحة:
1. برنامج اتحاد المناسك المسيرة:
   - برنامج شامل يغطي كافة مناسك العمرة بيسر وتوجيه كامل مع مرافق ديني وإشراف ميداني.
   - النقل بباصات حديثة ومكيفة من المدينة المنورة، وإقامة مريحة في فنادق مجهزة.
   - تفاصيل الحجز: متاح لـ 3 أيام أو 4 أيام (مكة والمدينة)، ومناسب للعائلات والأفراد.

2. برنامج اتحاد الطواف الميسر:
   - خيار سريع واقتصادي وعملي لرحلات نهاية الأسبوع القصيرة لزيارة مكة المكرمة مباشرة وأداء العمرة.
   - أيام الرحلة: الأربعاء أو الخميس.
   - تفاصيل الحجز: 3 أيام (مكة فقط).

3. برنامج مقام المعتمر:
   - باقة إيمانية متكاملة تبدأ بزيارة المدينة المنورة للسلام على رسول الله ثم الانتقال إلى مكة.
   - مستوى إقامة فاخر (فنادق 4 أو 5 نجوم قريبة جداً من الحرمين).
   - باصات حديثة ممتازة، تنظيم زيارة الروضة الشريفة والمزارات.
   - تفاصيل الحجز: 4 أيام (مكة والمدينة).

4. برنامج طواف للسياحة الدينية:
   - برنامج مرن ومخصص يومياً لزيارة المواقع التاريخية والمزارات الإسلامية في مكة والمدينة المنورة.
   - جولات سياحية برفقة مرشدين متخصصين.
   - تفاصيل الحجز: رحلات يومية مرنة (عائلات أو مجموعات)، يمكن تفصيل الحجز بالكامل (بدون فندق أو بفندق).

معلومات التواصل وحجز الرحلات:
- رقم الهاتف والواتساب الرسمي: 0550784878 (أو بالصيغة الدولية: +966550784878)
- البريد الإلكتروني: omra@etihadalmdina.com
- للحجز: وجه العميل للضغط على زر "احجز الآن" الموجود في أعلى الصفحة أو في كروت البرامج، حيث سيفتح له نموذج الحجز مباشرة لملء بياناته.
- يرجى عدم عرض أي أسعار للرحلات لأن الأسعار غير محددة وتتغير باستمرار بناءً على تواريخ السفر وخيارات الفنادق. اطلب منهم التواصل معنا عبر الواتساب للحصول على السعر الحالي المحدث.

قواعد الاستجابة:
- كن مختصراً وودوداً. لا تطل الإجابة بدون داعٍ.
- أجب باللغة العربية الفصحى أو بلهجة سعودية/مصرية بيضاء مبسطة يفهمها الجميع.
- إذا سألك العميل عن شيء خارج خدمات العمرة وزيارات مكة والمدينة، اعتذر منه بلطف ووجهه للاستفسار عن خدمات العمرة فقط.`;

        const messages = [
            { role: 'system', content: systemPrompt || defaultPrompt }
        ];

        // Include history (limit to last 8 messages)
        const recentHistory = history.slice(-8);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.sender === 'sent' ? 'user' : 'assistant',
                content: msg.text
            });
        });

        // Add current message
        messages.push({ role: 'user', content: userMessage });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Error communicating with OpenAI.');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Local FAQ Parser fallback when OpenAI API key is missing
    function parseLocalFAQ(msg) {
        msg = msg.toLowerCase();
        
        if (msg.includes('مناسك') || msg.includes('مسيرة') || msg.includes('مسيره')) {
            return `برنامج *اتحاد المناسك المسيرة*:\nهو برنامج شامل يغطي كافة مناسك العمرة بيسر وتوجيه كامل مع مرافق ديني وإشراف ميداني.\n• النقل بباصات حديثة ومكيفة من المدينة المنورة.\n• إقامة مريحة في فنادق مجهزة.\n• مدة الرحلة: 3 أيام أو 4 أيام (مكة والمدينة).\nللحجز اضغط على زر "احجز الآن" بأعلى الصفحة!`;
        }
        
        if (msg.includes('طواف ميسر') || msg.includes('الطواف الميسر') || msg.includes('ميسر')) {
            return `برنامج *اتحاد الطواف الميسر*:\nهو الخيار المثالي والسريع لرحلات نهاية الأسبوع القصيرة.\n• السفر مباشرة إلى مكة المكرمة لأداء العمرة.\n• أيام الرحلة: الأربعاء أو الخميس.\n• تفاصيل الإقامة: 3 أيام (مكة فقط) في فنادق ممتازة وقريبة من الحرم.\nللحجز اضغط على زر "احجز الآن" بأعلى الصفحة!`;
        }
        
        if (msg.includes('مقام') || msg.includes('المعتمر') || msg.includes('مقام المعتمر')) {
            return `برنامج *مقام المعتمر*:\nباقة فاخرة تبدأ بزيارة المدينة المنورة للسلام على رسول الله ثم الانتقال لمكة.\n• فنادق 4 أو 5 نجوم قريبة جداً من الحرمين.\n• تنظيم زيارة الروضة الشريفة والمزارات.\n• النقل بباصات حديثة وفاخرة.\n• المدة: 4 أيام (المدينة ومكة).\nللحجز اضغط على زر "احجز الآن" بأعلى الصفحة!`;
        }

        if (msg.includes('سياحة') || msg.includes('سياحه') || msg.includes('طواف للسياحة')) {
            return `برنامج *طواف للسياحة الدينية*:\nهو برنامج مرن ويومي مخصص لزيارة المواقع التاريخية والمزارات في مكة والمدينة.\n• جولات سياحية برفقة مرشدين متخصصين.\n• رحلات يومية مرنة وعائلية.\n• إمكانية تفصيل الحجز بالكامل (بدون فندق/فندق فقط).\nللحجز اضغط على زر "احجز الآن" بأعلى الصفحة!`;
        }

        if (msg.includes('برنامج') || msg.includes('برامج') || msg.includes('باقات') || msg.includes('باقة')) {
            return `نقدم 4 برامج رئيسية ومميزة للعمرة:\n1. *اتحاد المناسك المسيرة*: شامل مكة والمدينة مع إرشاد ديني.\n2. *اتحاد الطواف الميسر*: رحلة نهاية أسبوع سريعة (مكة فقط).\n3. *مقام المعتمر*: رحلة فاخرة (فنادق 4/5 نجوم) مكة والمدينة.\n4. *طواف للسياحة الدينية*: جولات ومزارات تاريخية يومية مرنة.\nاكتب اسم البرنامج لمعرفة تفاصيله!`;
        }

        if (msg.includes('سعر') || msg.includes('اسعار') || msg.includes('أسعار') || msg.includes('تكلفة') || msg.includes('تكلفه')) {
            return `تتغير أسعار باقات العمرة بشكل مستمر بناءً على تواريخ السفر ونوع الغرف المختارة ومواعيد الفنادق.\nيرجى التواصل معنا مباشرة عبر الواتساب للحصول على عرض السعر الحالي والمحدث للرحلة المطلوبة:\n📞 اتصل بنا أو راسلنا: *0550784878*`;
        }

        if (msg.includes('حجز') || msg.includes('احجز') || msg.includes('طريقة الحجز')) {
            return `يمكنك الحجز بسهولة عبر الضغط على زر *احجز الآن* الموجود في أعلى صفحات الموقع أو بجوار تفاصيل البرامج، وستفتح لك نافذة نموذج الحجز لملء بياناتك وسنتواصل معك هاتفياً فوراً لاستكمال الحجز!`;
        }

        if (msg.includes('رقم') || msg.includes('تواصل') || msg.includes('تليفون') || msg.includes('تلفون') || msg.includes('اتصال') || msg.includes('واتس')) {
            return `يسعدنا تواصلك معنا مباشرة:\n📞 هاتف / واتساب: *0550784878*\n✉️ بريد إلكتروني: *omra@etihadalmdina.com*\n📍 العنوان: المدينة المنورة، المملكة العربية السعودية.`;
        }

        if (msg.includes('سلام') || msg.includes('مرحبا') || msg.includes('مرحباً') || msg.includes('أهلاً') || msg.includes('اهلاً') || msg.includes('صباح') || msg.includes('مساء')) {
            return `وعليكم السلام ورحمة الله وبركاته، أهلاً بك أخي المعتمر في شركة الاتحاد لخدمات المعتمرين. كيف يمكنني مساعدتك اليوم؟`;
        }

        return `شكراً لاستفسارك! لم يتوفر جواب محدد لهذا السؤال حالياً.\nيسعدنا تواصلك معنا مباشرة للإجابة على كافة استفساراتك وتوفير العروض المناسبة لك:\n📞 رقم الهاتف والواتساب: *0550784878*\nأو يمكنك الضغط على زر "احجز الآن" لطلب حجز رحلة وسنتصل بك فوراً!`;
    }

    // Process Sent Message
    async function handleSendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // Clear input
        input.value = '';

        // Append user message
        appendMessage('sent', text);

        // Show typing indicator
        showTypingIndicator();

        // Delay response slightly for realistic typing effect
        setTimeout(async () => {
            try {
                let reply = '';
                // 1. If OpenAI API Key is configured, use OpenAI
                if (config && config.apiKey && config.apiKey.startsWith('sk-')) {
                    try {
                        reply = await callOpenAI(config.apiKey, config.model, config.systemPrompt, text, chatHistory);
                    } catch (apiError) {
                        console.error('OpenAI API Error, falling back to Local FAQ:', apiError);
                        reply = parseLocalFAQ(text);
                    }
                } else {
                    // 2. Otherwise fall back to Local FAQ
                    reply = parseLocalFAQ(text);
                }

                removeTypingIndicator();
                appendMessage('received', reply);
            } catch (err) {
                console.error('Chatbot error:', err);
                removeTypingIndicator();
                appendMessage('received', 'عذراً، حدث خطأ أثناء معالجة الطلب. يرجى مراسلتنا مباشرة عبر الواتساب على الرقم 0550784878.');
            }
        }, 1200);
    }

    // Send on button click
    sendBtn.addEventListener('click', handleSendMessage);

    // Send on Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Initialize config when DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotConfig);
    } else {
        initChatbotConfig();
    }
})();
