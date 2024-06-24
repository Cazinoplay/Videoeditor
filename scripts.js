document.addEventListener("DOMContentLoaded", () => {
    // Переменные для хранения данных о шаблоне, цвете фона, URL GIF и других параметрах
    let selectedTemplate = null;
    let backgroundColor = '#000000';
    let backgroundGifUrl = '';
    let musicFile = null;
    let textEntries = [];

    // Получаем элементы DOM, которые нам нужны
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");
    const step4 = document.getElementById("step4");
    const preview = document.getElementById("preview");

    const backgroundColorInput = document.getElementById("background-color");
    const backgroundGifUrlInput = document.getElementById("background-gif-url");
    const musicUpload = document.getElementById("music-upload");
    const userTextInput = document.getElementById("user-text");
    const animationSelect = document.getElementById("animation-select");
    const boldTextInput = document.getElementById("bold-text");
    const italicTextInput = document.getElementById("italic-text");
    const outlineTextInput = document.getElementById("outline-text");
    const textEntriesContainer = document.getElementById("text-entries");
    const textDisplay = document.getElementById("text-display");
    const videoContainer = document.getElementById("video-container");
    const backgroundMusic = document.getElementById("background-music");

    // Обработчики событий для переключения между шагами и сбора данных
    document.querySelectorAll(".template").forEach(button => {
        button.addEventListener("click", () => {
            selectedTemplate = button.getAttribute("data-template");
            step1.classList.add("hidden");
            step2.classList.remove("hidden");
        });
    });

    backgroundColorInput.addEventListener("input", (e) => {
        backgroundColor = e.target.value;
        videoContainer.style.backgroundColor = backgroundColor;
    });

    document.getElementById("next-to-music").addEventListener("click", () => {
        backgroundGifUrl = backgroundGifUrlInput.value;
        if (backgroundGifUrl) {
            videoContainer.style.backgroundImage = `url(${backgroundGifUrl})`;
        } else {
            videoContainer.style.backgroundImage = 'none';
        }
        step2.classList.add("hidden");
        step3.classList.remove("hidden");
    });

    musicUpload.addEventListener("change", (e) => {
        musicFile = e.target.files[0];
        if (musicFile) {
            const objectUrl = URL.createObjectURL(musicFile);
            backgroundMusic.src = objectUrl;
        }
    });

    document.getElementById("next-to-text").addEventListener("click", () => {
        step3.classList.add("hidden");
        step4.classList.remove("hidden");
    });

    document.getElementById("add-text").addEventListener("click", () => {
        const userText = userTextInput.value;
        const animation = animationSelect.value;
        const bold = boldTextInput.checked;
        const italic = italicTextInput.checked;
        const outline = outlineTextInput.checked;

        if (userText) {
            const textEntry = {
                text: userText,
                animation,
                bold,
                italic,
                outline,
            };
            textEntries.push(textEntry);
            renderTextEntries();
            userTextInput.value = '';
        }
    });

    function renderTextEntries() {
        textEntriesContainer.innerHTML = '';
        textDisplay.innerHTML = '';

        textEntries.forEach(entry => {
            const p = document.createElement("p");
            p.textContent = entry.text;
            p.classList.add(entry.animation);

            if (entry.bold) p.classList.add("bold");
            if (entry.italic) p.classList.add("italic");
            if (entry.outline) p.classList.add("outline");

            textDisplay.appendChild(p);

            const div = document.createElement("div");
            div.textContent = `${entry.text} (${entry.animation})`;
            textEntriesContainer.appendChild(div);
        });
    }

    document.getElementById("generate-video").addEventListener("click", async () => {
        step4.classList.add("hidden");
        preview.classList.remove("hidden");

        // Создание видео
        const videoBlob = await createVideo();
        const videoUrl = URL.createObjectURL(videoBlob);

        const videoPreview = document.createElement("video");
        videoPreview.src = videoUrl;
        videoPreview.controls = true;

        preview.appendChild(videoPreview);
    });

    async function createVideo() {
        const frames = [];
        for (let i = 0; i < textEntries.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Задержка между кадрами

            const canvas = await html2canvas(videoContainer);
            frames.push(canvas.toDataURL('image/webp'));
        }

        // Конвертация кадров в видео с помощью FFmpeg.js
        const { createFFmpeg } = FFmpeg;
        const ffmpeg = createFFmpeg({ log: true });
        await ffmpeg.load();

        for (let i = 0; i < frames.length; i++) {
            const frameData = frames[i].split(',')[1];
            const frameBuffer = new Uint8Array(atob(frameData).split('').map(char => char.charCodeAt(0)));
            ffmpeg.FS('writeFile', `frame${i}.webp`, frameBuffer);
        }

        await ffmpeg.run('-framerate', '1', '-i', 'frame%d.webp', '-c:v', 'libx264', 'output.mp4');

        const data = ffmpeg.FS('readFile', 'output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

        return videoBlob;
    }

    // Обработчик события для скачивания видео
    document.getElementById("download-video").addEventListener("click", async () => {
        const videoBlob = await createVideo();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(videoBlob);
        link.download = 'video.mp4';
        link.click();
    });
});
