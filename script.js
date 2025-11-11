// Audio Player Application
class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentStoryIndex = -1;
        this.stories = [];
        this.isPlaying = false;
        this.volume = 0.7;

        this.initElements();
        this.initEventListeners();
        this.loadStories();
    }

    initElements() {
        this.storyList = document.getElementById('storyList');
        this.player = document.getElementById('player');
        this.currentStoryTitle = document.getElementById('currentStoryTitle');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTime = document.getElementById('currentTime');
        this.duration = document.getElementById('duration');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.themeToggle = document.getElementById('themeToggle');
    }

    initEventListeners() {
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());

        // Control events
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.volumeBtn.addEventListener('click', () => this.toggleMute());

        // Touch events for mobile
        this.progressBar.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.progressBar.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.progressBar.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Load saved theme
        this.loadTheme();

        // Prevent screen sleep on mobile
        if ('wakeLock' in navigator) {
            this.wakeLock = null;
            document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        }
    }

    async loadStories() {
        try {
            const response = await fetch('stories.json');
            this.stories = await response.json();
            this.renderStoryList();
        } catch (error) {
            console.error('Error loading stories:', error);
            // Fallback to placeholder stories if JSON fails to load
            this.loadFallbackStories();
        }
    }

    loadFallbackStories() {
        // Generate 30 placeholder stories as fallback
        for (let i = 1; i <= 30; i++) {
            this.stories.push({
                id: i,
                title: `قصه  ${i}`,
                audioFile: `assets/audio/story${i}.mp3`,
                imageFile: `assets/images/story${i}.jpg`,
                duration: '۵:۰۰',
                description: 'توضیحات داستان'
            });
        }
        this.renderStoryList();
    }

    renderStoryList() {
        this.storyList.innerHTML = '';
        this.stories.forEach((story, index) => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';
            storyCard.dataset.index = index;

            storyCard.innerHTML = `
                <div class="story-image">
                    <img src="${story.imageFile}" alt="${story.title}" onerror="this.src='assets/images/default-story.jpg'">
                </div>
                <div class="story-content">
                    <div class="story-title">${story.title}</div>
                    <div class="story-description">${story.description}</div>
                    <div class="story-duration">${story.duration}</div>
                </div>
            `;

            storyCard.addEventListener('click', () => this.selectStory(index));
            this.storyList.appendChild(storyCard);
        });
    }

    selectStory(index) {
        if (this.currentStoryIndex !== -1) {
            document.querySelectorAll('.story-card')[this.currentStoryIndex].classList.remove('playing');
        }

        this.currentStoryIndex = index;
        const story = this.stories[index];

        document.querySelectorAll('.story-card')[index].classList.add('playing');
        this.currentStoryTitle.textContent = story.title;
        this.audio.src = story.audioFile;

        // Auto-play when story is selected
        this.play();
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
            this.requestWakeLock();
        } catch (error) {
            console.error('Error playing audio:', error);
            // Handle autoplay restrictions on mobile
            if (error.name === 'NotAllowedError') {
                this.showPlayPrompt();
            }
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.releaseWakeLock();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    playPrevious() {
        if (this.currentStoryIndex > 0) {
            this.selectStory(this.currentStoryIndex - 1);
        }
    }

    playNext() {
        if (this.currentStoryIndex < this.stories.length - 1) {
            this.selectStory(this.currentStoryIndex + 1);
        } else {
            // Loop back to first story
            this.selectStory(0);
        }
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.updateVolumeIcon();
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.audio.volume = 0;
            this.volumeSlider.value = 0;
        } else {
            this.audio.volume = this.volume;
            this.volumeSlider.value = this.volume;
        }
        this.updateVolumeIcon();
    }

    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = `${percent}%`;
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        this.duration.textContent = this.formatTime(this.audio.duration);
    }

    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('svg');
        if (this.isPlaying) {
            icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            this.playPauseBtn.classList.remove('play-btn');
            this.playPauseBtn.classList.add('pause-btn');
        } else {
            icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            this.playPauseBtn.classList.remove('pause-btn');
            this.playPauseBtn.classList.add('play-btn');
        }
    }

    updateVolumeIcon() {
        const icon = this.volumeBtn.querySelector('svg');
        if (this.audio.volume === 0) {
            icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5.7 7.1L4.3 5.7 1 9v6h4l5 5V4L5.7 7.1z"/>';
        } else if (this.audio.volume < 0.5) {
            icon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
        } else {
            icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Touch handling for mobile
    handleTouchStart(e) {
        e.preventDefault();
        this.isSeeking = true;
        this.seek(e.touches[0]);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.isSeeking) {
            this.seek(e.touches[0]);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isSeeking = false;
    }

    // Keyboard shortcuts
    handleKeyPress(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(1, parseFloat(this.volumeSlider.value) + 0.1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, parseFloat(this.volumeSlider.value) - 0.1));
                break;
        }
    }

    // Wake lock for preventing screen sleep during playback
    async requestWakeLock() {
        if ('wakeLock' in navigator && !this.wakeLock) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (error) {
                console.error('Wake lock request failed:', error);
            }
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    handleVisibilityChange() {
        if (document.hidden && this.isPlaying) {
            this.releaseWakeLock();
        } else if (!document.hidden && this.isPlaying) {
            this.requestWakeLock();
        }
    }

    showPlayPrompt() {
        // Show a play button overlay for mobile autoplay restrictions
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: white;
            text-align: center;
        `;
        overlay.innerHTML = `
            <div>
                <h3>برای پخش صدا کلیک کنید</h3>
                <button style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                " onclick="this.parentElement.parentElement.remove(); document.querySelector('#playPauseBtn').click();">
                    پخش
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayPauseButton();
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    // Theme management
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.toggle('dark-mode');
        this.saveTheme(isDark);

        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('svg');
        if (isDark) {
            icon.innerHTML = '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313-12.454z"/>';
        } else {
            icon.innerHTML = '<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>';
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateThemeIcon(true);
        } else {
            this.updateThemeIcon(false);
        }
    }

    saveTheme(isDark) {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    updateThemeIcon(isDark) {
        const icon = this.themeToggle.querySelector('svg');
        if (isDark) {
            icon.innerHTML = '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313-12.454z"/>';
        } else {
            icon.innerHTML = '<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioPlayer();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}