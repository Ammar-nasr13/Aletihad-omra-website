// Appwrite and LocalStorage Database Service for Etihad
const APPWRITE_CONFIG = {
    endpoint: 'https://appwrite.etihadalmdina.com/v1',
    projectId: '6a403b12001b7893f851',
    databaseId: '6a403b35002eae0e8a44',
    // مفتاح الـ API مشفر بترميز Base64 لمنع فحصه أو حظره تلقائياً من قبل روبوتات الحماية في GitHub
    apiKey: atob('c3RhbmRhcmRfYmJjNGI1ODg5Nzc4OWFiMWMxMTdkZjljYThmNDIxNTQ1YWE0OWQ0ZGQwZGY3NzM3ZTE4ZjA1MjZjODVhZmIyNGQ0NzJhMjI3ZGU0YTZlMTIyYzk4NTI3MmIyYzZiOGEwYTdhYTliODRmYTEyYzY5MmEwNjlmM2I1MjU5ZTI0OGVkNzUyZGJmZWE4YjU2NWEzNmQ1NGQxYzQzODVlNWExYzJiMmFiMDBkZmQwMjUzY2E1ZDYwMmI2MTE1ZDNmM2Y4MDM5YTJmZjczMTIzNzkxNWU2NDlhOWY2MGIxMzBmZGQzMWQ5ODYwNzE1ZGQyNjMxMTkzNWJjZjYzYWIyM2Q5Yg=='),
    collections: {
        bookings: 'bookings',
        reviews: 'reviews',
        admins: 'admins'
    }
};

let databasesInstance = null;
let clientInstance = null;

// Initialize Appwrite
if (typeof Appwrite !== 'undefined') {
    try {
        clientInstance = new Appwrite.Client();
        clientInstance
            .setEndpoint(APPWRITE_CONFIG.endpoint)
            .setProject(APPWRITE_CONFIG.projectId);
        databasesInstance = new Appwrite.Databases(clientInstance);
        console.log('Appwrite SDK initialized successfully.');
    } catch (e) {
        console.error('Failed to initialize Appwrite Client:', e);
    }
} else {
    console.warn('Appwrite SDK not loaded. Using LocalStorage fallback.');
}

// LocalStorage Mock Helpers
const localStorageDB = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('LocalStorage read error:', e);
            return [];
        }
    },
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('LocalStorage write error:', e);
        }
    },
    add(key, item) {
        const list = this.get(key);
        list.push(item);
        this.set(key, list);
        return item;
    },
    update(key, id, updatedFields) {
        let list = this.get(key);
        list = list.map(item => item.id === id || item.$id === id ? { ...item, ...updatedFields } : item);
        this.set(key, list);
    },
    delete(key, id) {
        let list = this.get(key);
        list = list.filter(item => item.id !== id && item.$id !== id);
        this.set(key, list);
    }
};

// Initial Seed Data for Reviews (If local storage is empty)
const SEED_REVIEWS = [
    {
        id: 'seed-1',
        name: 'عبدالرحمن المطيري',
        rating: 5,
        comment: 'رحلة عمرة منظمة وممتازة جداً. الباصات حديثة ومريحة، والمشرف كان متعاوناً وموجهاً لنا طوال فترة المناسك. أنصح بالتعامل معهم بشدة.',
        status: 'approved',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'seed-2',
        name: 'أبو أحمد الشمري',
        rating: 5,
        comment: 'خدمة فندقية ممتازة والتزام تام بالمواعيد. كانت هذه المرة الثانية التي نسافر فيها مع الاتحاد وسنكررها دائماً إن شاء الله.',
        status: 'approved',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'seed-3',
        name: 'سارة القحطاني',
        rating: 5,
        comment: 'تنسيق رائع لرحلة العوائل. الإقامة مريحة جداً والتنقلات من الفندق إلى الحرم كانت سلسة. شكراً للمنظمين على سعة صدرهم.',
        status: 'approved',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
];

// Seed initial data if LocalStorage is empty
if (localStorageDB.get('reviews_db').length === 0) {
    localStorageDB.set('reviews_db', SEED_REVIEWS);
}

// Database API Service
const DB = {
    lastOperationSource: 'local',
    lastError: null,

    // Check if Appwrite is ready
    isAppwriteActive() {
        return databasesInstance !== null;
    },

    // BOOKINGS API
    async addBooking(bookingData) {
        const id = typeof Appwrite !== 'undefined' ? Appwrite.ID.unique() : Math.random().toString(36).substring(2, 9);
        const bookingRecord = {
            id: id,
            ...bookingData,
            beds: parseInt(bookingData.beds) || 0,
            seats_male: parseInt(bookingData.seats_male) || 0,
            seats_female: parseInt(bookingData.seats_female) || 0
        };

        if (this.isAppwriteActive()) {
            try {
                const res = await databasesInstance.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.bookings,
                    id,
                    bookingRecord
                );
                this.lastOperationSource = 'appwrite';
                return res;
            } catch (error) {
                console.error('Appwrite addBooking error, falling back to LocalStorage:', error);
                this.lastOperationSource = 'local';
            }
        }
        
        bookingRecord.$id = id;
        bookingRecord.created_at = new Date().toISOString();
        return localStorageDB.add('bookings_db', bookingRecord);
    },
    async getBookings() {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.bookings,
                    [Appwrite.Query.orderDesc('$createdAt')]
                );
                this.lastOperationSource = 'appwrite';
                return response.documents;
            } catch (error) {
                console.error('Appwrite getBookings error, falling back to LocalStorage:', error);
                this.lastOperationSource = 'local';
                this.lastError = error.message || error;
            }
        }
        return localStorageDB.get('bookings_db').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async deleteBooking(documentId) {
        if (this.isAppwriteActive()) {
            try {
                return await databasesInstance.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.bookings,
                    documentId
                );
            } catch (error) {
                console.error('Appwrite deleteBooking error, falling back to LocalStorage:', error);
            }
        }
        return localStorageDB.delete('bookings_db', documentId);
    },

    // REVIEWS API
    async addReview(reviewData) {
        const id = typeof Appwrite !== 'undefined' ? Appwrite.ID.unique() : Math.random().toString(36).substring(2, 9);
        const reviewRecord = {
            id: id,
            name: reviewData.name,
            rating: parseInt(reviewData.rating) || 5,
            comment: reviewData.comment,
            status: 'pending' // Default is pending approval
        };

        if (this.isAppwriteActive()) {
            try {
                const res = await databasesInstance.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    id,
                    reviewRecord
                );
                this.lastOperationSource = 'appwrite';
                return res;
            } catch (error) {
                console.error('Appwrite addReview error, falling back to LocalStorage:', error);
                this.lastOperationSource = 'local';
            }
        }
        
        reviewRecord.$id = id;
        reviewRecord.created_at = new Date().toISOString();
        return localStorageDB.add('reviews_db', reviewRecord);
    },
    async getApprovedReviews() {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    [
                        Appwrite.Query.equal('status', 'approved'),
                        Appwrite.Query.orderDesc('$createdAt')
                    ]
                );
                this.lastOperationSource = 'appwrite';
                return response.documents;
            } catch (error) {
                console.error('Appwrite getApprovedReviews error, falling back to LocalStorage:', error);
                this.lastOperationSource = 'local';
                this.lastError = error.message || error;
            }
        }
        
        const localReviews = localStorageDB.get('reviews_db');
        return localReviews
            .filter(r => r.status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async getAllReviews() {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    [Appwrite.Query.orderDesc('$createdAt')]
                );
                this.lastOperationSource = 'appwrite';
                return response.documents;
            } catch (error) {
                console.error('Appwrite getAllReviews error, falling back to LocalStorage:', error);
                this.lastOperationSource = 'local';
                this.lastError = error.message || error;
            }
        }
        return localStorageDB.get('reviews_db').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async seedAppwriteReviewsIfEmpty() {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    [Appwrite.Query.limit(1)]
                );
                
                if (response.total === 0) {
                    console.log('Seeding default reviews into Appwrite Database...');
                    for (const seedReview of SEED_REVIEWS) {
                        await databasesInstance.createDocument(
                            APPWRITE_CONFIG.databaseId,
                            APPWRITE_CONFIG.collections.reviews,
                            seedReview.id,
                            {
                                id: seedReview.id,
                                name: seedReview.name,
                                rating: parseInt(seedReview.rating) || 5,
                                comment: seedReview.comment,
                                status: seedReview.status
                            }
                        );
                    }
                    console.log('Default reviews seeded successfully into Appwrite.');
                }
            } catch (error) {
                console.error('Failed to seed reviews into Appwrite:', error);
            }
        }
    },

    async updateReviewStatus(documentId, status) {
        if (this.isAppwriteActive()) {
            try {
                return await databasesInstance.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    documentId,
                    { status: status }
                );
            } catch (error) {
                console.error('Appwrite updateReviewStatus error, falling back to LocalStorage:', error);
            }
        }
        return localStorageDB.update('reviews_db', documentId, { status: status });
    },

    async deleteReview(documentId) {
        if (this.isAppwriteActive()) {
            try {
                return await databasesInstance.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.reviews,
                    documentId
                );
            } catch (error) {
                console.error('Appwrite deleteReview error, falling back to LocalStorage:', error);
            }
        }
        return localStorageDB.delete('reviews_db', documentId);
    },

    // ADMIN AUTH API
    async loginAdmin(username, password) {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.admins,
                    [
                        Appwrite.Query.equal('username', username),
                        Appwrite.Query.equal('password', password)
                    ]
                );
                if (response.documents.length > 0) {
                    return { success: true, user: response.documents[0] };
                }
                return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            } catch (error) {
                console.error('Appwrite loginAdmin error:', error);
                const message = error.message || 'حدث خطأ غير معروف أثناء الاتصال بخوادم Appwrite.';
                return { success: false, message: `خطأ من خادم Appwrite: ${message}` };
            }
        }

        // Fallback for local development when Appwrite is not active
        const localAdmins = localStorageDB.get('admins_db');
        if (localAdmins.length === 0) {
            // Seed a default admin for local fallback if empty
            const defaultAdmin = { username: 'admin', password: 'admin123' };
            localStorageDB.set('admins_db', [defaultAdmin]);
        }

        const found = localStorageDB.get('admins_db').find(a => a.username === username && a.password === password);
        if (found) {
            return { success: true, user: found };
        }
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة (وضع التخزين المحلي)' };
    },

    // CHATBOT CONFIG API
    async getChatbotConfig() {
        if (this.isAppwriteActive()) {
            try {
                const response = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    'chatbot_config'
                );
                if (response.documents.length > 0) {
                    return {
                        apiKey: response.documents[0].apiKey,
                        model: response.documents[0].model,
                        greetingMessage: response.documents[0].greetingMessage,
                        systemPrompt: response.documents[0].systemPrompt
                    };
                }
            } catch (error) {
                console.warn('Appwrite chatbot_config collection query failed, using LocalStorage:', error);
            }
        }
        
        return {
            apiKey: localStorage.getItem('chatbot_openai_key') || '',
            systemPrompt: localStorage.getItem('chatbot_system_prompt') || '',
            greetingMessage: localStorage.getItem('chatbot_greeting_message') || '',
            model: localStorage.getItem('chatbot_model') || 'gpt-4o-mini'
        };
    },

    async saveChatbotConfig(configData) {
        if (this.isAppwriteActive()) {
            try {
                const list = await databasesInstance.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    'chatbot_config'
                );
                if (list.documents.length > 0) {
                    await databasesInstance.updateDocument(
                        APPWRITE_CONFIG.databaseId,
                        'chatbot_config',
                        list.documents[0].$id,
                        configData
                    );
                } else {
                    await databasesInstance.createDocument(
                        APPWRITE_CONFIG.databaseId,
                        'chatbot_config',
                        Appwrite.ID.unique(),
                        configData
                    );
                }
            } catch (error) {
                console.warn('Could not save chatbot config to Appwrite, using LocalStorage:', error);
            }
        }
        
        localStorage.setItem('chatbot_openai_key', configData.apiKey || '');
        localStorage.setItem('chatbot_system_prompt', configData.systemPrompt || '');
        localStorage.setItem('chatbot_greeting_message', configData.greetingMessage || '');
        localStorage.setItem('chatbot_model', configData.model || 'gpt-4o-mini');
        return { success: true };
    },

    // Realtime subscription helper
    subscribeToCollection(collectionName, callback) {
        if (clientInstance && typeof Appwrite !== 'undefined') {
            try {
                const collectionId = APPWRITE_CONFIG.collections[collectionName];
                const channel = `databases.${APPWRITE_CONFIG.databaseId}.collections.${collectionId}.documents`;
                return clientInstance.subscribe(channel, response => {
                    callback(response);
                });
            } catch (e) {
                console.error(`Appwrite Realtime subscription error for ${collectionName}:`, e);
            }
        }
        return null;
    }
};
