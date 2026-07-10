document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 0. API CONFIGURATION
    // ==========================================================================
    // Localhostda mahaliy serverdan foydalanamiz.
    // Netlify'ga joylanganda, agar Netlify proxy redirect o'rnatilgan bo'lsa, relative path '/api' ishlatiladi.
    // Agar to'g'ridan-to'g'ri backend serverga so'rov yuborish kerak bo'lsa, quyidagi o'zgaruvchini o'zingizning backend URL'ingiz bilan almashtiring.
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : ''; // Agar bo'sh qolsa, Netlify proxy redirect (netlify.toml) orqali ishlaydi.

    // ==========================================================================
    // 1. STATE VARIABLES
    // ==========================================================================
    let books = [];
    let activeBook = null;
    let activeChapter = null;
    let currentFontSize = 18;
    let currentReaderTheme = 'dark';
    let currentNavTab = 'children'; // children, adults, history, ai-tutor, admin-section
    let activeMobilePanel = 'left-panel'; // left-panel, middle-panel, right-panel
    let currentLanguage = 'uz'; // uz, en, ru
    let isStaticMode = false;
    
    // Quiz state
    let currentQuestionIdx = 0;
    let quizScore = 0;
    let quizQuestions = [];

    const translations = {
        uz: {
            menu_btn: "Bo'limlar",
            children: "Bolalar uchun",
            adults: "Kattalar uchun",
            history: "Tariximizni o'rganamiz",
            ai_tutor: "AI Bilimdoni",
            admin: "Admin Paneli",
            video: "Video",
            map: "Xarita",
            ai: "AI Bilim",
            quiz: "Test",
            sources_title: "Ishonchli Manbalar:",
            search_placeholder: "Kitob qidirish...",
            no_books: "Kitoblar topilmadi.",
            claim_cert: "Sertifikatni Olish",
            restart_quiz: "Testni Qayta Topshirish",
            no_comments: "Izohlar yo'q.",
            greeting: "Assalomu alaykum! Bizning Bilimxon kutubxonamizga xush kelibsiz. Vaqtingizni chog' o'tkazing!"
        },
        en: {
            menu_btn: "Sections",
            children: "For Children",
            adults: "For Adults",
            history: "Learn Our History",
            ai_tutor: "AI Tutor",
            admin: "Admin Panel",
            video: "Video",
            map: "Map",
            ai: "AI Tutor",
            quiz: "Quiz",
            sources_title: "Authentic Sources:",
            search_placeholder: "Search books...",
            no_books: "No books found.",
            claim_cert: "Claim Certificate",
            restart_quiz: "Retake Quiz",
            no_comments: "No comments yet.",
            greeting: "Assalomu alaykum! Welcome to our Bilimxon library! Have a pleasant time!"
        },
        ru: {
            menu_btn: "Разделы",
            children: "Для детей",
            adults: "Для взрослых",
            history: "Изучаем историю",
            ai_tutor: "ИИ Репетитор",
            admin: "Админ Панель",
            video: "Видео",
            map: "Карта",
            ai: "ИИ Знания",
            quiz: "Тест",
            sources_title: "Достоверные Источники:",
            search_placeholder: "Поиск книг...",
            no_books: "Книги не найдены.",
            claim_cert: "Получить Сертификат",
            restart_quiz: "Пройти Тест Заново",
            no_comments: "Нет комментариев.",
            greeting: "Assalomu alaykum! Добро пожаловать в нашу библиотеку Билимхон! Желаем вам приятного времени!"
        }
    };

    // ==========================================================================
    // 2. DOM ELEMENTS
    // ==========================================================================
    const menuToggle = document.getElementById('menu-toggle');
    const navDrawer = document.getElementById('nav-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const drawerItems = document.querySelectorAll('.drawer-item');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Panels
    const leftPanel = document.getElementById('left-panel');
    const middlePanel = document.getElementById('middle-panel');
    const rightPanel = document.getElementById('right-panel');
    const adminPanelSection = document.getElementById('admin-panel-section');
    
    // Mobile Panel Switcher
    const mobileSwitchBtns = document.querySelectorAll('.mobile-switch-btn');
    
    // Library selectors
    const bookSearchInput = document.getElementById('book-search');
    const bookListContainer = document.getElementById('book-list-container');
    const activeBookInfo = document.getElementById('active-book-info');
    const activeBookCover = document.getElementById('active-book-cover');
    const activeBookTitle = document.getElementById('active-book-title');
    const activeBookAuthor = document.getElementById('active-book-author');
    const activeBookGenre = document.getElementById('active-book-genre');
    const activeBookDesc = document.getElementById('active-book-desc');
    const chaptersListContainer = document.getElementById('chapters-list-container');
    const booksCountBadge = document.getElementById('books-count');

    // Reader selectors
    const readerWelcome = document.getElementById('reader-welcome');
    const readerMain = document.getElementById('reader-main');
    const readerChapterTitle = document.getElementById('reader-chapter-title');
    const readerTextContent = document.getElementById('reader-text-content');
    const readerBookmarkBtn = document.getElementById('reader-bookmark');
    const sourcesCard = document.getElementById('sources-card');
    const sourcesList = document.getElementById('sources-list');
    const prevChapterBtn = document.getElementById('prev-chapter-btn');
    const nextChapterBtn = document.getElementById('next-chapter-btn');
    
    // Reader style customizers
    const fontDecreaseBtn = document.getElementById('font-decrease');
    const fontIncreaseBtn = document.getElementById('font-increase');
    const fontSizeIndicator = document.getElementById('font-size-indicator');
    const themeDots = document.querySelectorAll('.theme-dot');
    const readerBodyContent = document.querySelector('.reader-body-container');

    // Comments selectors
    const commentForm = document.getElementById('comment-form');
    const commentUserInput = document.getElementById('comment-user');
    const commentTextInput = document.getElementById('comment-text');
    const commentsListContainer = document.getElementById('comments-list-container');
    const commentsCountSpan = document.getElementById('comments-count');

    // Right Panel Subtabs
    const rightSubtabBtns = document.querySelectorAll('.right-tab-btn');
    const subtabContents = document.querySelectorAll('.subtab-content');
    
    // Multimedia selectors
    const mediaVideoPlayer = document.getElementById('media-video-player');
    const mediaYoutubePlayer = document.getElementById('media-youtube-player');
    const welcomeOverlay = document.getElementById('welcome-overlay-screen');
    const enterPlatformBtn = document.getElementById('enter-platform-btn');
    const videoTitle = document.getElementById('video-title');
    const videoDesc = document.getElementById('video-desc');
    const videoYoutubeLink = document.getElementById('video-youtube-link');

    // Map selectors
    const mapTitle = document.getElementById('map-title');
    const mapBaseImg = document.getElementById('map-base-img');
    const mapHotspotsContainer = document.getElementById('map-hotspots-container');
    const hotspotInfoBox = document.getElementById('hotspot-info-box');
    const hotspotName = document.getElementById('hotspot-name');
    const hotspotDesc = document.getElementById('hotspot-desc');
    const mapFallbackMsg = document.getElementById('map-fallback-msg');

    // AI Chat selectors
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatInputForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const quickPromptBtns = document.querySelectorAll('.quick-prompt-btn');

    // Quiz selectors
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizStateStart = document.getElementById('quiz-state-start');
    const quizStateActive = document.getElementById('quiz-state-active');
    const quizStateFinished = document.getElementById('quiz-state-finished');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const quizQuestionNumber = document.getElementById('quiz-question-number');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsList = document.getElementById('quiz-options-list');
    const resultIconMain = document.getElementById('result-icon-main');
    const resultTitle = document.getElementById('result-title');
    const resultScorePercent = document.getElementById('result-score-percent');
    const resultCorrectCount = document.getElementById('result-correct-count');
    const resultDescription = document.getElementById('result-description');
    const certificateClaimBox = document.getElementById('certificate-claim-box');
    const certNameInput = document.getElementById('cert-name-input');
    const claimCertBtn = document.getElementById('claim-cert-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    // Admin selectors
    const adminBookForm = document.getElementById('admin-book-form');

    // Certificate selectors
    const certModal = document.getElementById('cert-modal');
    const certCloseBtn = document.getElementById('cert-close-btn');
    const closeCertActionBtn = document.getElementById('close-cert-action-btn');
    const printCertBtn = document.getElementById('print-cert-btn');
    const certDisplayName = document.getElementById('cert-display-name');
    const certDisplayBook = document.getElementById('cert-display-book');
    const certDate = document.getElementById('cert-date');

    // ==========================================================================
    // 3. CORE APP ROUTING & FETCHING
    // ==========================================================================

    // Fetch all books on boot
    async function loadBooks() {
        try {
            const res = await fetch(`${API_BASE}/api/books`);
            if (!res.ok) throw new Error("API responded with error");
            books = await res.json();
            isStaticMode = false;
            renderBooksList();
        } catch (err) {
            console.warn("Backend API not available, trying static database.json fallback...", err);
            try {
                const res = await fetch('/database.json');
                if (!res.ok) throw new Error("Static file not found");
                const data = await res.json();
                books = data.books || data;
                isStaticMode = true;
                
                // Merge locally saved comments in static mode
                const localComments = JSON.parse(localStorage.getItem('bilimxon_comments') || '[]');
                books.forEach(b => {
                    if (!b.comments) b.comments = [];
                    const match = localComments.filter(lc => lc.bookId === b.id);
                    match.forEach(lc => {
                        if (!b.comments.some(c => c.timestamp === lc.timestamp && c.user === lc.user)) {
                            b.comments.push({
                                chapterId: lc.chapterId,
                                user: lc.user,
                                text: lc.text,
                                timestamp: lc.timestamp
                            });
                        }
                    });
                });

                console.log("Loaded successfully in Static Fallback Mode!");
                renderBooksList();
            } catch (staticErr) {
                console.error("Static fallback also failed:", staticErr);
                bookListContainer.innerHTML = `<p class="error-msg"><i class="fas fa-exclamation-triangle"></i> Ma'lumotlarni yuklab bo'lmadi.</p>`;
            }
        }
    }

    // Render left sidebar books
    function renderBooksList() {
        bookListContainer.innerHTML = '';
        const query = bookSearchInput.value.toLowerCase().trim();
        
        // Filter by search query AND current tab selection
        let filtered = books.filter(b => {
            const bTitle = typeof b.title === 'object' ? b.title[currentLanguage] : b.title;
            const matchesQuery = bTitle.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
            if (!matchesQuery) return false;
            
            if (currentNavTab === 'children' || currentNavTab === 'adults' || currentNavTab === 'history') {
                return b.category === currentNavTab;
            }
            return true;
        });

        booksCountBadge.textContent = filtered.length;

        if (filtered.length === 0) {
            bookListContainer.innerHTML = `<p class="no-results-msg">${translations[currentLanguage].no_books}</p>`;
            return;
        }

        filtered.forEach(book => {
            const isActive = activeBook && activeBook.id === book.id;
            const card = document.createElement('div');
            card.className = `book-card ${isActive ? 'active' : ''}`;
            const bookTitle = typeof book.title === 'object' ? book.title[currentLanguage] : book.title;
            card.innerHTML = `
                <img src="${book.cover}" alt="${bookTitle}" class="book-cover">
                <div class="book-details">
                    <h4>${bookTitle}</h4>
                    <p class="author-tag"><i class="fas fa-pen-nib"></i> ${book.author}</p>
                    <span class="genre-tag">${book.genre}</span>
                </div>
            `;
            card.addEventListener('click', () => selectBook(book.id));
            bookListContainer.appendChild(card);
        });
    }

    // Select book and load chapters
    async function selectBook(bookId) {
        try {
            // Update active states in left sidebar
            document.querySelectorAll('.book-card').forEach(c => c.classList.remove('active'));
            
            if (isStaticMode) {
                activeBook = books.find(b => b.id === bookId);
                if (!activeBook) throw new Error("Kitob topilmadi");
            } else {
                try {
                    const res = await fetch(`${API_BASE}/api/books/${bookId}`);
                    if (!res.ok) throw new Error("Backend API responded with error");
                    activeBook = await res.json();
                } catch (fetchErr) {
                    console.warn("Backenddan ma'lumot olishda xato, local ro'yxatdan olinmoqda:", fetchErr);
                    activeBook = books.find(b => b.id === bookId);
                    if (!activeBook) throw new Error("Kitob topilmadi (local fallback)");
                }
            }
            
            // Re-render books list to show active state
            renderBooksList();

            // Populate Book Info Block
            activeBookCover.src = activeBook.cover;
            activeBookTitle.textContent = typeof activeBook.title === 'object' ? activeBook.title[currentLanguage] : activeBook.title;
            activeBookAuthor.textContent = activeBook.author;
            activeBookGenre.textContent = activeBook.genre;
            activeBookDesc.textContent = typeof activeBook.description === 'object' ? activeBook.description[currentLanguage] : activeBook.description;
            activeBookInfo.style.display = 'block';

            // Populate Chapters list
            chaptersListContainer.innerHTML = '';
            activeBook.chapters.forEach((ch, idx) => {
                const item = document.createElement('div');
                item.className = 'chapter-item';
                item.textContent = typeof ch.title === 'object' ? ch.title[currentLanguage] : ch.title;
                item.addEventListener('click', () => selectChapter(ch.id));
                chaptersListContainer.appendChild(item);
            });

            // Automatically load first chapter of the book
            if (activeBook.chapters.length > 0) {
                selectChapter(activeBook.chapters[0].id);
            }

            // On mobile screen, switch panel automatically to reader pane on book selection!
            if (window.innerWidth <= 992) {
                switchMobilePanel('middle-panel');
            }

        } catch (err) {
            console.error("Error selecting book:", err);
            showToast("Kitobni yuklashda xatolik yuz berdi!");
        }
    }

    // Select and load chapter to reader & multimedia panels
    function selectChapter(chapterId) {
        if (!activeBook) return;
        
        const chapter = activeBook.chapters.find(ch => ch.id === chapterId);
        if (!chapter) return;

        activeChapter = chapter;

        // Highlight active chapter item in list
        document.querySelectorAll('.chapter-item').forEach((item, idx) => {
            if (activeBook.chapters[idx].id === chapterId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Hide welcome screen and show reader screen
        readerWelcome.style.display = 'none';
        readerMain.style.display = 'block';

        // Load reader content
        const chTitle = typeof chapter.title === 'object' ? chapter.title[currentLanguage] : chapter.title;
        const chContent = typeof chapter.content === 'object' ? chapter.content[currentLanguage] : chapter.content;
        
        readerChapterTitle.textContent = chTitle;
        readerTextContent.innerHTML = chContent.split('\n').map(p => `<p>${p}</p>`).join('');

        // Bookmark indicator loading from localStorage
        const bookmarks = JSON.parse(localStorage.getItem('bilimxon_bookmarks') || '{}');
        const isBookmarked = bookmarks[chapterId] === true;
        if (isBookmarked) {
            readerBookmarkBtn.classList.add('active');
            readerBookmarkBtn.innerHTML = `<i class="fas fa-bookmark"></i>`;
        } else {
            readerBookmarkBtn.classList.remove('active');
            readerBookmarkBtn.innerHTML = `<i class="far fa-bookmark"></i>`;
        }

        // Load Sources
        sourcesList.innerHTML = '';
        const chSources = (chapter.sources && typeof chapter.sources === 'object') ? chapter.sources[currentLanguage] : chapter.sources;
        if (chSources && chSources.length > 0) {
            // Update sources title
            document.querySelector('.sources-card h4').textContent = translations[currentLanguage].sources_title;
            chSources.forEach(src => {
                const li = document.createElement('li');
                li.textContent = src;
                sourcesList.appendChild(li);
            });
            sourcesCard.style.display = 'block';
        } else {
            sourcesCard.style.display = 'none';
        }

        // Manage Prev/Next Buttons
        const currentChIdx = activeBook.chapters.findIndex(ch => ch.id === chapterId);
        prevChapterBtn.disabled = currentChIdx === 0;
        nextChapterBtn.disabled = currentChIdx === activeBook.chapters.length - 1;

        // Load comments for this chapter
        renderComments();

        // ----------------------------------------------------
        // Update Right Panel Tabs Content
        // ----------------------------------------------------
        
        // 1. Update Video (Dynamic Language Native/YouTube Selector)
        const mediaData = (chapter.media && chapter.media[currentLanguage]) ? chapter.media[currentLanguage] : null;
        if (mediaData && mediaData.videoUrl) {
            const url = mediaData.videoUrl;
            const isYoutube = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('embed');
            
            if (isYoutube) {
                // Show YouTube, hide native
                mediaYoutubePlayer.src = url;
                mediaYoutubePlayer.style.display = 'block';
                
                mediaVideoPlayer.src = "";
                mediaVideoPlayer.load();
                mediaVideoPlayer.style.display = 'none';
                
                if (videoYoutubeLink) {
                    const watchUrl = url.replace('/embed/', '/watch?v=');
                    videoYoutubeLink.href = watchUrl;
                    videoYoutubeLink.style.display = 'inline-flex';
                }
            } else {
                // Show native, hide YouTube
                mediaVideoPlayer.src = url;
                mediaVideoPlayer.load();
                mediaVideoPlayer.style.display = 'block';
                
                mediaYoutubePlayer.src = "";
                mediaYoutubePlayer.style.display = 'none';
                
                if (videoYoutubeLink) {
                    videoYoutubeLink.style.display = 'none';
                }
            }
            videoTitle.textContent = mediaData.videoTitle || "Video";
            videoDesc.textContent = translations[currentLanguage].greeting;
        } else {
            mediaVideoPlayer.src = "";
            mediaVideoPlayer.load();
            mediaVideoPlayer.style.display = 'none';
            
            mediaYoutubePlayer.src = "";
            mediaYoutubePlayer.style.display = 'none';
            
            if (videoYoutubeLink) {
                videoYoutubeLink.style.display = 'none';
            }
            
            videoTitle.textContent = "Video";
            videoDesc.textContent = "";
        }

        // 2. Update Map
        if (chapter.media && chapter.media.map && chapter.media.map.image) {
            const mapTitleText = typeof chapter.media.map.title === 'object' ? chapter.media.map.title[currentLanguage] : chapter.media.map.title;
            mapTitle.textContent = mapTitleText || "Xarita";
            mapBaseImg.src = chapter.media.map.image;
            mapBaseImg.style.display = 'block';
            mapHotspotsContainer.innerHTML = '';
            hotspotInfoBox.style.display = 'none';
            mapFallbackMsg.style.display = 'none';

            // Render Hotspots
            chapter.media.map.hotspots.forEach(spot => {
                const dot = document.createElement('div');
                dot.className = 'hotspot-dot';
                dot.style.left = `${spot.x}%`;
                dot.style.top = `${spot.y}%`;
                dot.title = spot.name;
                
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hotspotName.textContent = spot.name;
                    hotspotDesc.textContent = spot.info;
                    hotspotInfoBox.style.display = 'block';
                });
                
                mapHotspotsContainer.appendChild(dot);
            });
        } else {
            mapBaseImg.style.display = 'none';
            mapHotspotsContainer.innerHTML = '';
            hotspotInfoBox.style.display = 'none';
            mapFallbackMsg.style.display = 'block';
            mapTitle.textContent = "Xarita mavjud emas";
        }

        // 3. Reset Quiz for new chapter
        resetQuiz();
    }

    // ==========================================================================
    // 4. READER CUSTOMIZATION & BAR ACTIONS
    // ==========================================================================
    
    // Decrement Font Size
    fontDecreaseBtn.addEventListener('click', () => {
        if (currentFontSize > 12) {
            currentFontSize -= 2;
            applyFontSize();
        }
    });

    // Increment Font Size
    fontIncreaseBtn.addEventListener('click', () => {
        if (currentFontSize < 32) {
            currentFontSize += 2;
            applyFontSize();
        }
    });

    function applyFontSize() {
        readerTextContent.style.fontSize = `${currentFontSize}px`;
        fontSizeIndicator.textContent = `${currentFontSize}px`;
    }

    // Toggle Reading Mode Theme (Dark, Sepia, Light)
    themeDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            themeDots.forEach(d => d.classList.remove('active'));
            e.target.classList.add('active');
            
            const theme = e.target.getAttribute('data-theme');
            readerBodyContent.classList.remove('theme-dark', 'theme-sepia', 'theme-light');
            readerBodyContent.classList.add(`theme-${theme}`);
            currentReaderTheme = theme;
        });
    });

    // Bookmark Action Handler
    readerBookmarkBtn.addEventListener('click', () => {
        if (!activeChapter) return;
        
        const bookmarks = JSON.parse(localStorage.getItem('bilimxon_bookmarks') || '{}');
        const isBookmarked = bookmarks[activeChapter.id] === true;
        
        if (isBookmarked) {
            bookmarks[activeChapter.id] = false;
            readerBookmarkBtn.classList.remove('active');
            readerBookmarkBtn.innerHTML = `<i class="far fa-bookmark"></i>`;
        } else {
            bookmarks[activeChapter.id] = true;
            readerBookmarkBtn.classList.add('active');
            readerBookmarkBtn.innerHTML = `<i class="fas fa-bookmark"></i>`;
            
            // Notification toast simulation
            showToast("Bookmark saqlandi!");
        }
        localStorage.setItem('bilimxon_bookmarks', JSON.stringify(bookmarks));
    });

    // Chapter navigation triggers
    prevChapterBtn.addEventListener('click', () => {
        if (!activeBook || !activeChapter) return;
        const currentChIdx = activeBook.chapters.findIndex(ch => ch.id === activeChapter.id);
        if (currentChIdx > 0) {
            selectChapter(activeBook.chapters[currentChIdx - 1].id);
        }
    });

    nextChapterBtn.addEventListener('click', () => {
        if (!activeBook || !activeChapter) return;
        const currentChIdx = activeBook.chapters.findIndex(ch => ch.id === activeChapter.id);
        if (currentChIdx < activeBook.chapters.length - 1) {
            selectChapter(activeBook.chapters[currentChIdx + 1].id);
        }
    });

    // ==========================================================================
    // 5. COMMENTS / muhokamalar MANAGEMENT
    // ==========================================================================
    
    function renderComments() {
        commentsListContainer.innerHTML = '';
        if (!activeBook || !activeChapter) return;

        // Comments for this book's current chapter
        const chapterComments = (activeBook.comments || []).filter(c => c.chapterId === activeChapter.id);
        commentsCountSpan.textContent = chapterComments.length;

        if (chapterComments.length === 0) {
            commentsListContainer.innerHTML = `<p class="no-results-msg">Hozircha izohlar yo'q. Birinchi bo'lib izoh qoldiring!</p>`;
            return;
        }

        chapterComments.forEach(comm => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            const dateStr = comm.timestamp ? new Date(comm.timestamp).toLocaleDateString() : 'Bugun';
            item.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comm.user}</span>
                    <span>${dateStr}</span>
                </div>
                <div class="comment-text">${comm.text}</div>
            `;
            commentsListContainer.appendChild(item);
        });
    }

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeBook || !activeChapter) return;

        const user = commentUserInput.value.trim();
        const text = commentTextInput.value.trim();
        if (!user || !text) return;

        if (isStaticMode) {
            const newComment = {
                chapterId: activeChapter.id,
                user,
                text,
                timestamp: new Date().toISOString()
            };
            
            if (!activeBook.comments) activeBook.comments = [];
            activeBook.comments.push(newComment);
            
            // Save to localStorage for persistence
            const localComments = JSON.parse(localStorage.getItem('bilimxon_comments') || '[]');
            localComments.push({
                bookId: activeBook.id,
                ...newComment
            });
            localStorage.setItem('bilimxon_comments', JSON.stringify(localComments));
            
            renderComments();
            commentTextInput.value = '';
            showToast("Fikringiz saqlandi!");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/books/${activeBook.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId: activeChapter.id,
                    user,
                    text
                })
            });

            if (res.ok) {
                const newComment = await res.json();
                
                // Add comments to activeBook client state
                if (!activeBook.comments) activeBook.comments = [];
                activeBook.comments.push(newComment);
                
                // Refresh comments and clear form
                renderComments();
                commentTextInput.value = '';
                showToast("Fikringiz muvaffaqiyatli yuklandi!");
            }
        } catch (err) {
            console.error("Error posting comment:", err);
            showToast("Tizimda xatolik yuz berdi!");
        }
    });

    // ==========================================================================
    // 6. RIGHT PANEL SUBTABS CONTROLLER
    // ==========================================================================
    rightSubtabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            rightSubtabBtns.forEach(b => b.classList.remove('active'));
            subtabContents.forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            const target = e.target.getAttribute('data-subtab');
            document.getElementById(`subtab-${target}`).classList.add('active');
        });
    });

    // ==========================================================================
    // 7. AI TUTOR (SUN'IY INTELLEKT MASLAHATCHI) ENGINE
    // ==========================================================================
    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        appendChatMessage('user', text);
        
        // Append Bot Typing Loading indicator
        const loadingDiv = appendChatMessage('bot', `<i class="fas fa-spinner fa-spin"></i> Bilimxon o'ylamoqda...`);

        if (isStaticMode) {
            loadingDiv.remove();
            appendChatMessage('bot', "Assalomu alaykum! Men bilimdon AI maslahatchisiman. Hozirda sayt Netlify (Static Hosting) orqali yuklangani sababli sun'iy intellekt backend serverimizga ulanib bo'lmadi. AI bilan muloqot qilish uchun loyihani mahalliy (local) serverda ishga tushiring.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    contextBookId: activeBook ? activeBook.id : null,
                    contextChapterId: activeChapter ? activeChapter.id : null
                })
            });

            const data = await res.json();
            
            // Remove loading indicator
            loadingDiv.remove();
            
            // Render Bot response typing animation
            appendChatMessage('bot', data.reply);

        } catch (err) {
            loadingDiv.remove();
            appendChatMessage('bot', "Afsuski, AI xizmati bilan bog'lanishda muammo yuz berdi. Iltimos, keyinroq urinib ko'ring.");
        }
    });

    // Quick Prompts buttons trigger
    quickPromptBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.target.getAttribute('data-prompt') || e.target.textContent;
            chatInput.value = prompt;
            chatInputForm.dispatchEvent(new Event('submit'));
        });
    });

    function appendChatMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.innerHTML = text;
        chatMessagesContainer.appendChild(msgDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        return msgDiv;
    }

    // ==========================================================================
    // 8. INTERACTIVE QUIZ & CERTIFICATE SYSTEM
    // ==========================================================================
    
    function resetQuiz() {
        quizStateStart.style.display = 'block';
        quizStateActive.style.display = 'none';
        quizStateFinished.style.display = 'none';
        currentQuestionIdx = 0;
        quizScore = 0;
    }

    startQuizBtn.addEventListener('click', () => {
        if (!activeBook || !activeBook.quiz || !activeBook.quiz.questions) {
            showToast("Ushbu kitob bo'yicha test mavjud emas!");
            return;
        }

        quizQuestions = activeBook.quiz.questions;
        if (quizQuestions.length === 0) {
            showToast("Hozircha test savollari yo'q.");
            return;
        }

        quizStateStart.style.display = 'none';
        quizStateActive.style.display = 'block';
        
        loadQuizQuestion();
    });

    function loadQuizQuestion() {
        const q = quizQuestions[currentQuestionIdx];
        
        // Progress Fill
        const progressPercent = (currentQuestionIdx / quizQuestions.length) * 100;
        quizProgressFill.style.width = `${progressPercent}%`;
        quizQuestionNumber.textContent = `${currentQuestionIdx + 1}-savol`;
        
        quizQuestionText.textContent = q.question;
        quizOptionsList.innerHTML = '';
        
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => selectQuizAnswer(idx));
            quizOptionsList.appendChild(btn);
        });
    }

    function selectQuizAnswer(selectedIndex) {
        const q = quizQuestions[currentQuestionIdx];
        if (selectedIndex === q.answer) {
            quizScore++;
        }

        currentQuestionIdx++;
        if (currentQuestionIdx < quizQuestions.length) {
            loadQuizQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        quizStateActive.style.display = 'none';
        quizStateFinished.style.display = 'block';
        
        // Progress fill to 100%
        quizProgressFill.style.width = '100%';

        const scorePercent = Math.round((quizScore / quizQuestions.length) * 100);
        resultScorePercent.textContent = `${scorePercent}%`;
        resultCorrectCount.textContent = `${quizQuestions.length} dan ${quizScore} ta to'g'ri topildi`;

        if (scorePercent >= 70) {
            // Passed! User claims certificate
            resultIconMain.className = "fas fa-medal result-icon text-gold";
            resultTitle.textContent = "Ajoyib Natija!";
            resultDescription.textContent = "Siz darsni mukammal o'zlashtirdingiz va maxsus sertifikatga loyiq topildingiz!";
            certificateClaimBox.style.display = 'block';
        } else {
            // Failed
            resultIconMain.className = "fas fa-heart-broken result-icon";
            resultTitle.textContent = "Yana urinib ko'ring";
            resultDescription.textContent = "Afsuski, sertifikat olish uchun kamida 70% to'g'ri javob berishingiz kerak. Bobni qaytadan yaxshilab o'qib topshirishingiz mumkin.";
            certificateClaimBox.style.display = 'none';
        }
    }

    restartQuizBtn.addEventListener('click', resetQuiz);

    // Certificate generation and trigger
    claimCertBtn.addEventListener('click', () => {
        const name = certNameInput.value.trim();
        if (!name) {
            showToast("Iltimos, ism-familiyangizni kiriting!");
            return;
        }

        // Fill certificate template details
        certDisplayName.textContent = name.toUpperCase();
        certDisplayBook.textContent = activeBook ? activeBook.title.toUpperCase() : "Platforma Kursi";
        certDate.textContent = new Date().toLocaleDateString();

        // Reveal Certificate modal
        certModal.style.display = 'flex';
    });

    // Close certificate triggers
    certCloseBtn.addEventListener('click', () => certModal.style.display = 'none');
    closeCertActionBtn.addEventListener('click', () => certModal.style.display = 'none');
    
    // Print/PDF trigger
    printCertBtn.addEventListener('click', () => {
        window.print();
    });

    // ==========================================================================
    // 9. ADMIN PANEL SUBMIT ACTION
    // ==========================================================================
    adminBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('admin-title').value.trim();
        const author = document.getElementById('admin-author').value.trim();
        const genre = document.getElementById('admin-genre').value.trim();
        const cover = document.getElementById('admin-cover').value.trim();
        const description = document.getElementById('admin-desc').value.trim();
        
        // Chapter details
        const chTitle = document.getElementById('admin-ch-title').value.trim();
        const chVideo = document.getElementById('admin-ch-video').value.trim();
        const chContent = document.getElementById('admin-ch-content').value.trim();
        const chSources = document.getElementById('admin-ch-sources').value.trim().split('\n').filter(s => s.trim() !== "");
        
        // Quiz Details
        const qText = document.getElementById('admin-q1-text').value.trim();
        const optA = document.getElementById('admin-q1-opt1').value.trim();
        const optB = document.getElementById('admin-q1-opt2').value.trim();
        const optC = document.getElementById('admin-q1-opt3').value.trim();
        const optD = document.getElementById('admin-q1-opt4').value.trim();

        const options = [optA, optB];
        if (optC) options.push(optC);
        if (optD) options.push(optD);

        const newBookPayload = {
            title,
            author,
            genre,
            cover,
            description,
            chapters: [
                {
                    title: chTitle,
                    content: chContent,
                    sources: chSources,
                    media: {
                        videoUrl: chVideo,
                        videoTitle: chTitle,
                        map: { title: "Xarita", image: "", hotspots: [] }
                    }
                }
            ],
            quiz: {
                questions: [
                    {
                        id: 1,
                        question: qText,
                        options,
                        answer: 0 // Index 0 represents Option A (Correct answer)
                    }
                ]
            }
        };

        if (isStaticMode) {
            showToast("Netlify (Static mode)da kitob qo'shish imkonsiz. Loyihani local serverda ishga tushiring.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBookPayload)
            });

            if (res.ok) {
                showToast("Yangi kitob muvaffaqiyatli qo'shildi!");
                adminBookForm.reset();
                
                // Refresh books catalog and switch to Library tab
                await loadBooks();
                switchNavTab('library');
            } else {
                showToast("Xatolik yuz berdi, ma'lumotlarni tekshiring!");
            }
        } catch (err) {
            console.error("Error creating book:", err);
            showToast("Serverga ulanish xatosi!");
        }
    });

    // ==========================================================================
    // 10. APP NAVIGATION TABS CONTROLLER (Slide-out Drawer)
    // ==========================================================================
    
    // Toggle navigation drawer open
    if (menuToggle && navDrawer) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navDrawer.classList.toggle('active');
        });
    }

    // Close navigation drawer
    if (drawerClose && navDrawer) {
        drawerClose.addEventListener('click', () => {
            navDrawer.classList.remove('active');
        });
    }

    // Close drawer when clicking outside drawer content
    if (navDrawer) {
        navDrawer.addEventListener('click', (e) => {
            if (e.target === navDrawer) {
                navDrawer.classList.remove('active');
            }
        });
    }

    // Drawer items click listeners
    drawerItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            switchNavTab(target);
            
            // Auto close drawer after selection
            if (navDrawer) {
                navDrawer.classList.remove('active');
            }
        });
    });

    function switchNavTab(tabId) {
        currentNavTab = tabId;
        
        // Highlight drawer items
        drawerItems.forEach(b => {
            if (b.getAttribute('data-target') === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Toggle visibility of panels/sections
        if (tabId === 'admin-section') {
            leftPanel.style.display = 'none';
            middlePanel.style.display = 'none';
            rightPanel.style.display = 'none';
            adminPanelSection.style.display = 'block';
            
            // Disable mobile panel switchers
            document.querySelector('.mobile-panel-switcher').style.display = 'none';
        } else {
            adminPanelSection.style.display = 'none';
            
            // Restore three-panel visibility based on window size
            if (window.innerWidth <= 992) {
                document.querySelector('.mobile-panel-switcher').style.display = 'flex';
                switchMobilePanel(activeMobilePanel);
            } else {
                leftPanel.style.display = 'flex';
                middlePanel.style.display = 'flex';
                rightPanel.style.display = 'flex';
                document.querySelector('.mobile-panel-switcher').style.display = 'none';
            }

            // Refresh books list (crucial if switching to 'islamic' tab)
            renderBooksList();
        }
    }

    // ==========================================================================
    // 11. MOBILE PANEL SWITCHER LOGIC (<= 992px)
    // ==========================================================================
    mobileSwitchBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const panelId = e.currentTarget.getAttribute('data-show');
            switchMobilePanel(panelId);
        });
    });

    function switchMobilePanel(panelId) {
        activeMobilePanel = panelId;
        
        // Update switch buttons state
        mobileSwitchBtns.forEach(b => {
            if (b.getAttribute('data-show') === panelId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Hide all three panels, then show only selected one
        leftPanel.classList.remove('active-mobile');
        middlePanel.classList.remove('active-mobile');
        rightPanel.classList.remove('active-mobile');
        
        leftPanel.style.display = 'none';
        middlePanel.style.display = 'none';
        rightPanel.style.display = 'none';

        const activePanel = document.getElementById(panelId);
        activePanel.classList.add('active-mobile');
        activePanel.style.display = 'flex';
    }

    // Handle screen resize to reset panels layout automatically
    window.addEventListener('resize', () => {
        if (currentNavTab !== 'admin-section') {
            if (window.innerWidth > 992) {
                leftPanel.style.display = 'flex';
                middlePanel.style.display = 'flex';
                rightPanel.style.display = 'flex';
                document.querySelector('.mobile-panel-switcher').style.display = 'none';
            } else {
                document.querySelector('.mobile-panel-switcher').style.display = 'flex';
                switchMobilePanel(activeMobilePanel);
            }
        }
    });

    // ==========================================================================
    // 12. UTILITIES & HELPERS
    // ==========================================================================
    
    // Book search query listener
    bookSearchInput.addEventListener('input', renderBooksList);

    // Global Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme', !isDark);
        
        themeToggleBtn.innerHTML = isDark ? `<i class="fas fa-moon"></i>` : `<i class="fas fa-sun"></i>`;
        
        // Update reading theme dot active state
        const targetDot = isDark ? document.querySelector('.theme-dot.dark') : document.querySelector('.theme-dot.light');
        if (targetDot) {
            targetDot.click();
        }
    });

    // Toast Notification generator
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification card-glass';
        toast.innerHTML = `<i class="fas fa-info-circle text-gold"></i> <span>${message}</span>`;
        document.body.appendChild(toast);
        
        // Slide up and fade out animation trigger
        setTimeout(() => toast.classList.add('active'), 50);
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Prepend stylesheet with toast style dynamically for clean modularity
    const style = document.createElement('style');
    style.innerHTML = `
        .toast-notification {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 12px 24px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            border-color: var(--border-gold-glass);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .toast-notification.active {
            transform: translateY(0);
            opacity: 1;
        }
        @media (max-width: 480px) {
            .toast-notification {
                bottom: 20px;
                right: 20px;
                left: 20px;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);

    // ==========================================================================
    // 14. HUMAN VOICE GREETING & SOFT BACKGROUND VIDEO SOUND ENGINE
    // ==========================================================================
    const appBgVideo = document.getElementById('app-bg-video');
    const audioReminder = document.getElementById('audio-reminder');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');
    
    let hasPlayedGreeting = false;
    let bgMusic = null;
    let isMusicPlaying = false;

    // Initialize background music
    try {
        bgMusic = new Audio('/assets/audio/bg_music.ogg');
        bgMusic.loop = true;
        bgMusic.volume = 0.08; // very soft, pleasant, and premium volume
    } catch(e) {
        console.error("Failed to load bg music:", e);
    }

    // Play welcome greeting voice immediately or on first gesture
    function playGreetingVoice() {
        if (hasPlayedGreeting) return;
        hasPlayedGreeting = true;

        // 1. Play background video (muted, visual only)
        if (appBgVideo) {
            appBgVideo.muted = true;
            appBgVideo.play().catch(err => console.log("Bg video play blocked:", err));
        }

        // 2. Play high-quality human girl welcome greeting voice
        try {
            const welcomeVoice = new Audio('/assets/audio/welcome_voice.mp3');
            welcomeVoice.volume = 0.95;
            welcomeVoice.play().then(() => {
                // Success: Hide the floating banner reminder
                if (audioReminder) {
                    audioReminder.style.opacity = '0';
                    audioReminder.style.transform = 'translate(-50%, -20px)';
                    setTimeout(() => {
                        audioReminder.style.display = 'none';
                    }, 400);
                }
            }).catch(err => {
                console.log("Autoplay welcome voice blocked by browser, trying Web Speech Synthesis...");
                // Fallback to Web Speech Synthesis if audio file was blocked
                try {
                    const speech = new SpeechSynthesisUtterance("Assalomu alaykum! Bizning bilimxon kutubxonamizga xush kelibsiz. Vaqtingizni chog' o'tkazing!");
                    speech.lang = 'uz-UZ';
                    speech.volume = 0.95;
                    window.speechSynthesis.speak(speech);
                    if (audioReminder) {
                        audioReminder.style.opacity = '0';
                        setTimeout(() => audioReminder.style.display = 'none', 400);
                    }
                } catch(e) {
                    hasPlayedGreeting = false; // retry on click
                }
            });
        } catch (e) {
            console.error("Audio error:", e);
            hasPlayedGreeting = false;
        }
    }

    // Toggle background music manually
    if (musicToggle) {
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!bgMusic) return;

            if (isMusicPlaying) {
                bgMusic.pause();
                isMusicPlaying = false;
                musicToggle.classList.remove('active');
                if (musicIcon) {
                    musicIcon.className = 'fas fa-volume-mute';
                }
            } else {
                bgMusic.play().then(() => {
                    isMusicPlaying = true;
                    musicToggle.classList.add('active');
                    if (musicIcon) {
                        musicIcon.className = 'fas fa-volume-up';
                    }
                }).catch(err => console.error("Music play blocked:", err));
            }
        });
    }

    // Try playing voice immediately
    playGreetingVoice();

    // Trigger greeting on first user click if autoplay was blocked
    ['click', 'keydown', 'touchstart'].forEach(evtName => {
        document.addEventListener(evtName, playGreetingVoice, { once: true });
    });

    // ==========================================================================
    // 15. INTERFACE LANGUAGE SWITCHER
    // ==========================================================================
    
    function updateInterfaceLanguage() {
        const t = translations[currentLanguage];
        if (!t) return;
        
        // Update menu texts
        const menuText = document.querySelector('.menu-text');
        if (menuText) menuText.textContent = t.menu_btn;
        
        const childItem = document.querySelector('.drawer-item[data-target="children"] span');
        if (childItem) childItem.textContent = t.children;
        
        const adultItem = document.querySelector('.drawer-item[data-target="adults"] span');
        if (adultItem) adultItem.textContent = t.adults;
        
        const histItem = document.querySelector('.drawer-item[data-target="history"] span');
        if (histItem) histItem.textContent = t.history;
        
        const aiItem = document.querySelector('.drawer-item[data-target="ai-tutor"] span');
        if (aiItem) aiItem.textContent = t.ai_tutor;
        
        const admItem = document.querySelector('.drawer-item[data-target="admin-section"] span');
        if (admItem) admItem.textContent = t.admin;

        // Update Right panel tabs
        const tabVideo = document.querySelector('.right-tab-btn[data-subtab="video"]');
        if (tabVideo) tabVideo.innerHTML = `<i class="fas fa-play"></i> ${t.video}`;
        
        const tabMap = document.querySelector('.right-tab-btn[data-subtab="map"]');
        if (tabMap) tabMap.innerHTML = `<i class="fas fa-map-marked-alt"></i> ${t.map}`;
        
        const tabAI = document.querySelector('.right-tab-btn[data-subtab="ai"]');
        if (tabAI) tabAI.innerHTML = `<i class="fas fa-brain"></i> ${t.ai}`;
        
        const tabQuiz = document.querySelector('.right-tab-btn[data-subtab="quiz"]');
        if (tabQuiz) tabQuiz.innerHTML = `<i class="fas fa-tasks"></i> ${t.quiz}`;

        // Search placeholder
        if (bookSearchInput) bookSearchInput.placeholder = t.search_placeholder;

        // Banner reminder translation
        if (audioReminder) {
            audioReminder.innerHTML = `<i class="fas fa-volume-up"></i> ${t.greeting}`;
        }

        // Re-render components to apply translation
        renderBooksList();
        if (activeBook) {
            selectBook(activeBook.id);
        }
    }

    // Custom Language Dropdown Logic
    const customLangSelector = document.getElementById('custom-lang-selector');
    const langSelectedBtn = document.getElementById('lang-selected-btn');
    const langOptions = document.querySelectorAll('.lang-option');

    if (langSelectedBtn && customLangSelector) {
        langSelectedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            customLangSelector.classList.toggle('open');
        });
    }

    langOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = opt.getAttribute('data-value');
            currentLanguage = val;

            // Update active option styling
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            // Update selected button flag and label
            const flag = opt.querySelector('.flag-icon').textContent;
            const label = val.toUpperCase();
            if (langSelectedBtn) {
                langSelectedBtn.innerHTML = `<span class="flag-icon">${flag}</span> <span class="lang-label">${label}</span> <i class="fas fa-chevron-down arrow-icon"></i>`;
            }

            // Close dropdown
            if (customLangSelector) {
                customLangSelector.classList.remove('open');
            }

            // Apply translation changes
            updateInterfaceLanguage();
        });
    });

    // Close language selector when clicking outside
    document.addEventListener('click', () => {
        if (customLangSelector) {
            customLangSelector.classList.remove('open');
        }
    });

    // ==========================================================================
    // 13. INITIAL BOOTSTRAP RUN
    // ==========================================================================
    loadBooks();
});
