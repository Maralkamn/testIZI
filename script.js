let fullBank = [];     // Барлық сұрақтар
let currentTest = [];  // Таңдалған 50 сұрақ (араластырылған)
let currentIndex = 0;
let score = 0;
let lastBlockIdx = 0;

const uploadInput = document.getElementById('upload-file');

// 1. Файлды оқу
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    const type = file.name.split('.').pop().toLowerCase();

    reader.onload = function() {
        if (type === 'docx') {
            mammoth.extractRawText({ arrayBuffer: reader.result }).then(res => parseData(res.value));
        } else if (type === 'pdf') {
            readPDF(reader.result);
        }
    };
    reader.readAsArrayBuffer(file);
});

// 2. Сұрақтарды базаға жинау
function parseData(text) {
    fullBank = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    for (let i = 0; i < lines.length; i += 6) {
        const qText = lines[i];
        const opts = lines.slice(i + 1, i + 6);
        if (opts.length === 5) {
            fullBank.push({
                question: qText,
                correct: opts[0].slice(2).trim(), // Әрқашан А нұсқасы дұрыс
                allOptions: opts.map(o => o.slice(2).trim())
            });
        }
    }
    document.getElementById('status-text').textContent = `Жүктелді: ${fullBank.length} сұрақ`;
    showBlockMenu();
}

// 3. Бөлімдерді шығару (1-50, 51-100...)
function showBlockMenu() {
    const menu = document.getElementById('section-menu');
    const container = document.getElementById('block-container');
    container.innerHTML = '';
    
    const blockSize = 50;
    const totalBlocks = Math.ceil(fullBank.length / blockSize);

    for (let i = 0; i < totalBlocks; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, fullBank.length);
        
        const btn = document.createElement('button');
        btn.textContent = `${start + 1} — ${end}`;
        btn.onclick = () => prepareTest(start, end, i);
        container.appendChild(btn);
    }
    
    document.getElementById('file-upload-box').style.display = 'none';
    menu.style.display = 'block';
}

// 4. ТЕСТТІ ДАЙЫНДАУ (ТЕК ОСЫ ДИАПАЗОНДЫ АРАЛАСТЫРУ)
function prepareTest(start, end, blockIdx) {
    lastBlockIdx = blockIdx;
    // Тек таңдалған аралықты қиып аламыз
    let slice = fullBank.slice(start, end);
    
    // ОСЫ ЖЕРДЕ РАНДОМ: Тек осы 50 сұрақты араластырамыз
    currentTest = shuffle([...slice]); 
    
    currentIndex = 0;
    score = 0;
    
    document.getElementById('section-menu').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    const q = currentTest[currentIndex];
    document.getElementById('q-counter').textContent = `${currentIndex + 1} / ${currentTest.length}`;
    document.getElementById('question-text').textContent = q.question;
    
    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';
    
    // Жауаптардың да орнын ауыстырып шығарамыз
    const shuffledOpts = shuffle([...q.allOptions]);
    
    shuffledOpts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt === q.correct, q.correct);
        optionsBox.appendChild(btn);
    });
    
    document.getElementById('next-btn').style.display = 'none';
}

function checkAnswer(btn, isCorrect, correct) {
    const allBtns = document.getElementById('options-container').querySelectorAll('button');
    allBtns.forEach(b => {
        b.disabled = true;
        if (b.textContent === correct) b.classList.add('correct');
    });

    if (isCorrect) {
        score++;
    } else {
        btn.classList.add('incorrect');
    }
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentTest.length) {
        showQuestion();
    } else {
        showFinalResult();
    }
}

function showFinalResult() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result-score').textContent = `Нәтиже: ${score} / ${currentTest.length}`;
}

// Көмекші функция: Массивті араластыру
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function backToMenu() {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('section-menu').style.display = 'block';
}

function restartBlock() {
    document.getElementById('result-screen').style.display = 'none';
    // Қайтадан сол блокты бастау (тағы да рандом болады)
    const blockSize = 50;
    prepareTest(lastBlockIdx * blockSize, Math.min((lastBlockIdx + 1) * blockSize, fullBank.length), lastBlockIdx);
}
function showQuestion() {
    const q = currentTest[currentIndex];
    
    // Бұл жерде тек жалпы прогресті қалдырамыз (мысалы: 5/50)
    document.getElementById('q-counter').textContent = `${currentIndex + 1} / ${currentTest.length}`;
    
    // Сұрақтың өзін ғана шығарамыз (нөмірсіз)
    document.getElementById('question-text').textContent = q.question;
    
    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';
    
    // Жауаптарды араластыру
    const shuffledOpts = shuffle([...q.allOptions]);
    
    shuffledOpts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt === q.correct, q.correct);
        optionsBox.appendChild(btn);
    });
    
    document.getElementById('next-btn').style.display = 'none';
}
// ... (алдыңғы кодтың басы өзгеріссіз қалады)

function parseData(text) {
    fullBank = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    for (let i = 0; i < lines.length; i += 6) {
        let qText = lines[i];

        // 1. Базадағы ескі нөмірді (мысалы 37.) біржола өшіру
        qText = qText.replace(/^\d+[\s\.\-\)]+/, ''); 

        const opts = lines.slice(i + 1, i + 6);
        if (opts.length === 5) {
            fullBank.push({
                question: qText,
                correct: opts[0].slice(2).trim(),
                allOptions: opts.map(o => o.slice(2).trim())
            });
        }
    }
    showBlockMenu();
}

function showQuestion() {
    const q = currentTest[currentIndex];
    
    // 2. Мұнда тек прогресс жолағын қалдырамыз
    document.getElementById('q-counter').textContent = `${currentIndex + 1} / ${currentTest.length}`;
    
    // 3. Сұрақтың алдына автоматты түрде "1. ", "2. " деп жаңа нөмір қосамыз
    // Бұл нөмір блок ішінде 1-ден басталады
    document.getElementById('question-text').innerHTML = `
        <span class="q-number">${currentIndex + 1}.</span> ${q.question}
    `;
    
    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';
    
    const shuffledOpts = shuffle([...q.allOptions]);
    shuffledOpts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt === q.correct, q.correct);
        optionsBox.appendChild(btn);
    });
    
    document.getElementById('next-btn').style.display = 'none';
}

// ... (қалған функциялар: shuffle, checkAnswer, prepareTest өзгеріссіз қалады)
function parseData(text) {
    fullBank = [];
    
    // 1. ЕГЕР ТЕГТЕР БАР ФОРМАТ БОЛСА (<question>, <variantright>)
    if (text.includes('<question')) {
        // <question> немесе <question1> бойынша бөлеміз
        const rawBlocks = text.split(/<question\d*>/).filter(Boolean);

        rawBlocks.forEach(block => {
            // Сұрақ мәтінін <variantright> тегіне дейін аламыз
            const qParts = block.split('<variantright>');
            if (qParts.length < 2) return;

            const qText = qParts[0].trim();
            
            // Жауаптарды бөліп алу (Regex арқылы барлық нұсқаларды табамыз)
            const rightPart = qParts[1].split('<variant>')[0].trim();
            const wrongVariants = block.match(/<variant>(.*?)((?=<variant>)|(?=<question)|$)/gs) || [];
            
            const cleanWrongs = wrongVariants.map(v => v.replace('<variant>', '').trim());

            if (qText && rightPart) {
                fullBank.push({
                    question: qText.replace(/^\d+[\s\.\-\)]+/, ''), // Ескі нөмір болса өшіру
                    correct: rightPart,
                    allOptions: [rightPart, ...cleanWrongs]
                });
            }
        });
    } 
    
    // 2. ЕГЕР КӘДІМГІ ТІЗІМ БОЛСА (6 жолдық жүйе)
    // Егер жоғарыда ештеңе табылмаса немесе мәтін кәдімгі жолдардан тұрса
    if (fullBank.length === 0) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i += 6) {
            let qText = lines[i].replace(/^\d+[\s\.\-\)]+/, ''); 
            const opts = lines.slice(i + 1, i + 6);
            if (opts.length === 5) {
                // Бірінші нұсқаны (A) дұрыс деп алу
                const correctCandidate = opts[0].replace(/^[A-Ea-e][\.\)\s]*/, '').trim();
                const allOptsClean = opts.map(o => o.replace(/^[A-Ea-e][\.\)\s]*/, '').trim());

                fullBank.push({
                    question: qText,
                    correct: correctCandidate,
                    allOptions: allOptsClean
                });
            }
        }
    }

    document.getElementById('status-text').textContent = `Жүктелді: ${fullBank.length} сұрақ`;
    showBlockMenu();
}

// --- ҚАЛҒАН ФУНКЦИЯЛАР (ӨЗГЕРІССІЗ) ---

function showQuestion() {
    const q = currentTest[currentIndex];
    document.getElementById('q-counter').textContent = `${currentIndex + 1} / ${currentTest.length}`;
    
    // Сұрақ нөмірі мен мәтіні (Жаңа нумерация)
    document.getElementById('question-text').innerHTML = `
        <span class="q-number">${currentIndex + 1}.</span> ${q.question}
    `;
    
    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';
    
    // Жауаптарды рандом жасап шығару
    const shuffledOpts = shuffle([...q.allOptions]);
    shuffledOpts.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt === q.correct, q.correct);
        optionsBox.appendChild(btn);
    });
    
    document.getElementById('next-btn').style.display = 'none';
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// (Басқа функциялар: checkAnswer, prepareTest, showBlockMenu... бұрынғыша қалады)
// --- ЖАҢА: Сілтемені тексеру (Сайт ашылғанда бірден істейді) ---
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('quiz');

    if (sharedData) {
        try {
            // Сілтемедегі кодталған мәтінді қайта ашу
            const decodedText = decodeURIComponent(atob(sharedData));
            parseData(decodedText);
            document.getElementById('upload-section').style.display = 'none';
            alert("🚀 Сілтеме арқылы тест жүктелді!");
        } catch (e) {
            console.error("Сілтеме қате немесе ескірген");
        }
    }

    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
};

// --- ЖАҢА: Сілтеме жасау функциясы ---
function generateShareLink() {
    if (fullBank.length === 0) return alert("Алдымен файл жүктеңіз!");

    // Мәтінді форматқа сай жинау (тегтермен немесе кәдімгіше)
    // Ескерту: Тым үлкен файлдар сілтемеге сыймауы мүмкін (браузер шектеуі)
    const rawText = fullBank.map(q => {
        return `<question>${q.question}<variantright>${q.correct}${q.allOptions.filter(o => o !== q.correct).map(o => `<variant>${o}`).join('')}`;
    }).join('');

    try {
        const encoded = btoa(encodeURIComponent(rawText));
        const shareUrl = window.location.origin + window.location.pathname + "?quiz=" + encoded;

        // Сілтемені буферге көшіру
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("🔗 Сілтеме көшірілді! Енді оны досыңа жібере аласың.");
        });
    } catch (e) {
        alert("❌ Файл тым үлкен, сілтеме жасау мүмкін емес. Кішірек файл қолданып көріңіз.");
    }
}

//геменииииии ьроо
function generateShareLink() {
    // 1. Тек қазіргі таңдалған (currentTest) сұрақтарды аламыз
    if (!currentTest || currentTest.length === 0) {
        alert("Алдымен бөлімді таңдап, тестті бастаңыз!");
        return;
    }

    try {
        // 2. Деректі JSON-ға айналдырып, Base64-пен кодтаймыз
        const jsonStr = JSON.stringify(currentTest);
        const encoded = btoa(encodeURIComponent(jsonStr));
        
        // 3. Сілтеме құрастыру
        const shareUrl = window.location.origin + window.location.pathname + "?quiz=" + encoded;

        // 4. Сілтеме ұзындығын тексеру (Браузер шектеуі ~8000 таңба)
        if (shareUrl.length > 8192) {
            alert("⚠️ Бұл бөлімдегі мәтіндер тым ұзын, сілтемеге сыймай тұр. Сұрақтар санын азайтып көріңіз.");
            return;
        }

        // 5. Көшіру
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("✅ Осы бөлімнің сілтемесі көшірілді! Достарыңызға жібере аласыз.");
        });

    } catch (e) {
        console.error(e);
        alert("Сілтеме жасау кезінде қате кетті.");
    }
}