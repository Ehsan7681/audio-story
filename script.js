document.addEventListener('DOMContentLoaded', () => {
    const artwork = document.getElementById('artwork');
    const title = document.getElementById('title');
    const artist = document.getElementById('artist');
    const audio = document.getElementById('audio');
    const prevBtn = document.getElementById('prev-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = document.getElementById('play-pause-icon');
    const nextBtn = document.getElementById('next-btn');
    const playlistElement = document.getElementById('playlist');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.querySelector('.progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // You can replace this with your own stories
    const stories = [
        {
            title: ' قصه شاخ دیوی ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story1.mp3',
            artworkSrc: 'images/story1.jpg'
        },
        {
            title: '  قصه کمد سحرآميز',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story2.mp3',
            artworkSrc: 'images/story2.jpg'
        },
        {
            title: ' قصه کلاغ سفید',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story3.mp3',
            artworkSrc: 'images/story3.jpg'
        },
        {
            title: ' قصه قلعه درون ابرها ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story4.mp3',
            artworkSrc: 'images/story4.jpg'
        },
        {
            title: '    قصه فلفل تند و تيز ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story5.mp3',
            artworkSrc: 'images/story5.jpg'
        },
        {
            title: '    قصه دختر مو طلایی ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story6.mp3',
            artworkSrc: 'images/story6.png'
        },
        {
            title: '    قصه خواهر و برادر ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/story7.mp3',
            artworkSrc: 'images/story7.png'
        },
        {
            title: '      قصه الاغ شکمو  ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/قصه-الاغ-شکمو.mp3',
            artworkSrc: 'images/قصه-الاغ-شکمو.png'
        },
        {
            title: '       میمون و پلنگ   ',
            artist: 'قصه‌گو',
            audioSrc: 'audio/میمون-و-پلنگ.mp3',
            artworkSrc: 'images/میمون-و-پلنگ.png'
        }
    ];

    let currentStoryIndex = 0;
    let isPlaying = false;

    function loadStory(storyIndex) {
        const story = stories[storyIndex];
        artwork.src = story.artworkSrc;
        title.textContent = story.title;
        artist.textContent = story.artist;
        audio.src = story.audioSrc;
        updatePlaylist();

        // Reset progress bar and time display
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        
        // Reset player state to paused when a new story is loaded
        isPlaying = false;
        playPauseIcon.src = 'icons/play.svg';
    }

    function playStory() {
        isPlaying = true;
        audio.play();
        playPauseIcon.src = 'icons/pause.svg';
    }

    function pauseStory() {
        isPlaying = false;
        audio.pause();
        playPauseIcon.src = 'icons/play.svg';
    }

    function playPauseToggle() {
        if (isPlaying) {
            pauseStory();
        } else {
            playStory();
        }
    }

    function prevStory() {
        currentStoryIndex = (currentStoryIndex - 1 + stories.length) % stories.length;
        loadStory(currentStoryIndex);
    }

    function nextStory() {
        currentStoryIndex = (currentStoryIndex + 1) % stories.length;
        loadStory(currentStoryIndex);
    }

    function populatePlaylist() {
        playlistElement.innerHTML = '';
        stories.forEach((story, index) => {
            const li = document.createElement('li');
            li.textContent = story.title;
            li.dataset.index = index;
            if (index === currentStoryIndex) {
                li.classList.add('active');
            }
            playlistElement.appendChild(li);
        });
    }

    function updatePlaylist() {
        const items = playlistElement.querySelectorAll('li');
        items.forEach((item, index) => {
            if (index === currentStoryIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    playPauseBtn.addEventListener('click', playPauseToggle);
    prevBtn.addEventListener('click', prevStory);
    nextBtn.addEventListener('click', nextStory);
    audio.addEventListener('ended', () => {
        nextStory();
        playStory(); // Autoplay only when a story finishes
    });

    playlistElement.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            currentStoryIndex = parseInt(e.target.dataset.index, 10);
            loadStory(currentStoryIndex);
        }
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateProgress() {
        const { currentTime, duration } = audio;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(currentTime);
        }
    }

    function setProgress(e) {
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = this.clientWidth;
        const duration = audio.duration;
        if (duration) {
            audio.currentTime = (clickX / width) * duration;
        }
    }

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    let isDragging = false;

    function scrub(e) {
        const rect = progressBarContainer.getBoundingClientRect();
        let clickX = e.clientX - rect.left;
        const width = progressBarContainer.clientWidth;

        // Ensure clickX is within bounds
        if (clickX < 0) clickX = 0;
        if (clickX > width) clickX = width;

        const duration = audio.duration;
        if (duration) {
            audio.currentTime = (clickX / width) * duration;
        }
    }

    progressBarContainer.addEventListener('click', scrub);
    progressBarContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        scrub(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            scrub(e);
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // For mobile touch events
    progressBarContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        scrub(e.touches[0]);
    });
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            scrub(e.touches[0]);
        }
    });
    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Theme Toggle Logic
    function toggleTheme() {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    }

    // Check for saved theme preference
    function checkTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-mode');
        }
    }

    themeToggleBtn.addEventListener('click', toggleTheme);

    // Initial load
    checkTheme();
    loadStory(currentStoryIndex);
    populatePlaylist();
});
