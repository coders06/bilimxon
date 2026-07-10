const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Load environment variables if dotenv is installed
try {
    require('dotenv').config();
} catch (e) {
    // Ignore if dotenv is not installed
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database path configuration - supports persistent volumes on Render/Railway
const DB_PATH = process.env.DATABASE_PATH 
    ? path.join(process.env.DATABASE_PATH, 'database.json')
    : path.join(__dirname, 'public', 'database.json');

// Helper to ensure database file exists (useful for persistent directories)
function ensureDBExists() {
    if (!fs.existsSync(DB_PATH)) {
        try {
            const defaultPath = path.join(__dirname, 'public', 'database.json');
            const parentDir = path.dirname(DB_PATH);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            if (fs.existsSync(defaultPath)) {
                fs.copyFileSync(defaultPath, DB_PATH);
                console.log(`Database initialized from default template to persistent path: ${DB_PATH}`);
            } else {
                fs.writeFileSync(DB_PATH, JSON.stringify({ books: [], comments: [] }, null, 2), 'utf8');
                console.log(`Created new blank database at: ${DB_PATH}`);
            }
        } catch (err) {
            console.error("Error initializing persistent database:", err);
        }
    }
}

// Initialize database
ensureDBExists();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read database
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading database from ${DB_PATH}, using fallback blank template:`, err);
        return { books: [], comments: [] };
    }
}

// Helper to write database
function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error(`Error writing database to ${DB_PATH}:`, err);
    }
}

// GET all books
app.get('/api/books', (req, res) => {
    const db = readDB();
    const booksList = db.books.map(b => ({
        id: b.id,
        category: b.category,
        title: b.title,
        author: b.author,
        genre: b.genre,
        cover: b.cover,
        description: b.description,
        chapterCount: b.chapters.length
    }));
    res.json(booksList);
});

// GET specific book details
app.get('/api/books/:id', (req, res) => {
    const db = readDB();
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    
    // Attach comments for this book's chapters
    const bookComments = db.comments.filter(c => c.bookId === req.params.id);
    res.json({ ...book, comments: bookComments });
});

// POST a new comment
app.post('/api/books/:id/comments', (req, res) => {
    const { chapterId, user, text } = req.body;
    if (!user || !text || !chapterId) {
        return res.status(400).json({ error: "Missing required comment parameters" });
    }

    const db = readDB();
    const newComment = {
        id: 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        bookId: req.params.id,
        chapterId,
        user,
        text,
        timestamp: new Date().toISOString()
    };

    db.comments.push(newComment);
    writeDB(db);
    res.status(201).json(newComment);
});

// POST AI Chat interface (Tutor Simulator / Knowledge Engine)
app.post('/api/ai-chat', (req, res) => {
    const { message, contextBookId, contextChapterId } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message content required" });
    }

    const cleanMsg = message.toLowerCase().trim();
    let reply = "";
    
    // Context helper
    const db = readDB();
    let currentBook = null;
    let currentChapter = null;
    if (contextBookId) {
        currentBook = db.books.find(b => b.id === contextBookId);
        if (currentBook && contextChapterId) {
            currentChapter = currentBook.chapters.find(ch => ch.id === contextChapterId);
        }
    }

    // Smart simulated AI responses in Uzbek (Contextual + NLP matches)
    if (cleanMsg.includes("15 yosh") || cleanMsg.includes("yoshdaman") || cleanMsg.includes("tavsiya")) {
        reply = "Salom! 15 yoshda dunyoqarashingizni kengaytirish va mustaqil fikrlashni shakllantirish juda muhim. Sizga platformamizdagi **'Robinzon Kruzo'** sarguzasht asarini to'liq o'qishni tavsiya qilaman. U sizga hayot qiyinchiliklariga qarshi turish, mehnatsevarlik va iroda kuchini o'rgatadi. Agar tarix va ma'naviyatga qiziqsangiz, **'Payg'ambarlar tarixi'** kitobining Nuh (a.s.) bobi orqali diniy-tarixiy bilimlaringizni boyitishingiz mumkin.";
    } else if (cleanMsg.includes("sodda") || cleanMsg.includes("tushuntir") || cleanMsg.includes("qisqacha")) {
        if (currentChapter) {
            if (currentChapter.id === "1-1") {
                reply = `Mana, **"${currentChapter.title}"** bobining sodda tushuntirishi:\n\nNuh alayhissalom o'z xalqini juda uzoq vaqt (950 yil) yaxshilikka chaqirdilar, lekin ko'pchilik ishonmadi va ularni mazax qildi. Alloh u zotga sahro o'rtasida katta kema qurishni buyurdi. Odamlar kulishdi, lekin to'fon boshlanganda faqat kemaga chiqqan iymonli insonlar va hayvonlar (juft-juftdan) omon qolishdi. Nuh (a.s.)ning o'g'li ham itoatsizlik qilib tog'ga qochdi va halok bo'ldi. Oxiri kema Judiy tog'ida to'xtadi. Bu voqeadan xulosa shuki: Haqiqat va itoat doim najot keltiradi!`;
            } else if (currentChapter.id === "1-2") {
                reply = `Mana, **"${currentChapter.title}"** bobining sodda tushuntirishi:\n\nIbrohim alayhissalom oilasi (Hojar onamiz va chaqaloq Ismoil)ni Makkadagi qup-quruq cho'lga Alloh amri bilan qoldiradilar. U yerda Zamzam suvi mo'jizaviy tarzda chiqadi. Keyinchalik Ismoil ulg'aygach, ota va o'g'il birgalikda yer yuzidagi birinchi ibodatxona - Ka'bani barpo etishadi. Bu voqea bizga Allohga to'liq ishonish va sadoqatning mukofotini o'rgatadi.`;
            } else if (currentChapter.id === "2-1") {
                reply = `Mana, **"${currentChapter.title}"** bobining sodda tushuntirishi:\n\nRobinzon Kruzo dahshatli kema halokatidan keyin bir o'zi tirik qolib, noma'lum orol qirg'og'iga chiqdi. U tushkunlikka tushmay, kemadan asbob-uskunalar va qurollarni tashidi. Yirtqichlardan saqlanish uchun tog' etagidagi g'or oldida o'ziga mustahkam palatka-qal'acha yasadi. Bu - uning orolda yashab qolish uchun qilgan birinchi qahramonligi edi.`;
            } else if (currentChapter.id === "2-2") {
                reply = `Mana, **"${currentChapter.title}"** bobining sodda tushuntirishi:\n\nRobinzon kimsasiz orolda 25 yil yolg'iz yashaganidan so'ng, vahshiy odamxo'rlar qo'lidan qochgan asir yigitni qutqarib qoladi. Uchrashgan kunlari juma bo'lgani uchun unga 'Juma' deb ism beradi. Unga ingliz tilini o'rgatib, kiyintiradi va do'stlashadi. Yolg'izlik tugab, oroldan qutulish rejalarini tuzishadi.`;
            } else {
                reply = `Ushbu bob mazmuni: ${currentChapter.content.substring(0, 150)}...\n\nSodda qilib aytganda, bu bobda qahramonning qiyinchiliklar va yangi vaziyatlar aro qilgan sa'y-harakatlari hamda tarixiy manbalardagi ibratli voqealar sodda va tushunarli tilda ifodalangan.`;
            }
        } else {
            reply = "Iltimos, avval chap paneldan biror kitob va uning bobini tanlang, so'ngra shu bobni sodda tushuntirishimni so'rang.";
        }
    } else if (cleanMsg.includes("fakt") || cleanMsg.includes("qiziqarli")) {
        if (currentBook && currentBook.id === "1") {
            reply = "Qiziqarli Fakt: Maqomi Ibrohimdagi tosh ustida Ibrohim alayhissalomning oyoq izlari hozirgi kungacha saqlanib qolgan. Ushbu tosh Ka'ba qurilayotgan vaqtda poydevor ko'tarilishi bilan birga mo'jizaviy tarzda yuqoriga ko'tarilib turgan deb ishoniladi.";
        } else if (currentBook && currentBook.id === "2") {
            reply = "Qiziqarli Fakt: Daniel Defoning 'Robinzon Kruzo' asari 1704-1709 yillarda kimsasiz orolda 4 yildan ortiq yashab omon qolgan shotlandiyalik dengizchi Aleksandr Selkirkning haqiqiy hayotiy voqeasiga asoslanib yozilgan!";
        } else {
            reply = "Qiziqarli Fakt: Inson miyasi kitob o'qiyotganda film ko'rgandan ko'ra 5 baravar ko'proq neyron aloqalarini faollashtiradi. Kitob o'qish tasavvurni va tahliliy fikrlashni rivojlantiradi!";
        }
    } else if (cleanMsg.includes("salom") || cleanMsg.includes("assalom")) {
        reply = "Assalomu alaykum! Men Bilimxon platformasining sun'iy intellekt maslahatchisiman. Sizga qanday yordam bera olaman? Kitoblar bo'yicha tavsiyalar olishingiz yoki o'qiyotgan bobingizni soddalashtirib berishimni so'rashingiz mumkin.";
    } else {
        reply = `Sizning savolingizni qabul qildim: "${message}".\n\nMen sun'iy intellekt yordamchisiman. Hozirda siz **${currentBook ? currentBook.title : 'Bilimxon kutubxonasi'}** bo'limidasiz. Sizga tavsiya bera olaman, qiziqarli faktlar aytishim yoki tanlangan bobni soddalashtirib berishim mumkin. Iltimos, ushbu buyruqlardan birini tanlang yoki savolingizni aniqroq yozing.`;
    }

    res.json({ reply });
});

// POST Admin: Add a new book (Fullstack control!)
app.post('/api/admin/books', (req, res) => {
    const { title, author, genre, cover, description, chapters, quiz } = req.body;
    if (!title || !author || !description) {
        return res.status(400).json({ error: "Missing book title, author, or description" });
    }

    const db = readDB();
    const newBookId = (db.books.length + 1).toString();
    const formattedChapters = (chapters || []).map((ch, idx) => ({
        id: `${newBookId}-${idx + 1}`,
        title: ch.title || `${idx + 1}-bob`,
        content: ch.content || "Bob kontenti",
        sources: ch.sources || [],
        media: ch.media || {
            videoUrl: "https://www.youtube.com/embed/Pj15b6LdFp0",
            videoTitle: "Tushuntiruvchi video",
            map: { title: "Xarita", image: "", hotspots: [] }
        }
    }));

    const newBook = {
        id: newBookId,
        category: req.body.category || "adults",
        title,
        author,
        genre: genre || "Klassika",
        cover: cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
        description,
        chapters: formattedChapters,
        quiz: quiz || { questions: [] }
    };

    db.books.push(newBook);
    writeDB(db);
    res.status(201).json(newBook);
});

// Catch-all route to serve index.html for single-page routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Bilimxon backend server running at http://localhost:${PORT}`);
});
