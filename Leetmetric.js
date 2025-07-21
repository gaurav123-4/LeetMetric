

document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const searchButton = document.getElementById("getStats");
    const usernameInput = document.getElementById("username");
    const easyLabel = document.getElementById("easy");
    const mediumLabel = document.getElementById("medium");
    const hardLabel = document.getElementById("hard");
    const statsCard = document.querySelector(".stats-card");
    const progressItems = document.querySelectorAll(".progress-item");

    // State management
    let isLoading = false;
    let lastSearchedUsername = "";
    const cache = new Map(); // Simple in-memory cache
    const CACHE_DURATION = 5 * 60 * 1000; 

    // Username validation
    function validateUsername(userInput) {
        if (!userInput || userInput.trim() === "") {
            showError("Username cannot be empty!");
            return false;
        }

        // LeetCode usernames are typically alphanumeric with underscores and hyphens
        const usernameRegex = /^[a-zA-Z0-9_-]{3,25}$/;
        if (!usernameRegex.test(userInput.trim())) {
            showError("Please enter a valid LeetCode username (3-25 characters, letters, numbers, underscores, hyphens)");
        return false;
        }

        return true;
    }

    // Error display function
    function showError(message) {
        // Create error notification
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-notification";
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            font-weight: 500;
        `;

        document.body.appendChild(errorDiv);

        // Remove error after 4 seconds
        setTimeout(() => {
            errorDiv.style.animation = "slideOutRight 0.3s ease-out";
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 4000);
    }

    // Success notification
    function showSuccess(message) {
        const successDiv = document.createElement("div");
        successDiv.className = "success-notification";
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            font-weight: 500;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = "slideOutRight 0.3s ease-out";
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    // Loading state management with enhanced visual feedback
    function setLoadingState(loading) {
        isLoading = loading;
        
        if (loading) {
            searchButton.textContent = "⏳ Searching...";
            searchButton.disabled = true;
            searchButton.style.background = "linear-gradient(135deg, #a0aec0, #718096)";
            searchButton.style.cursor = "not-allowed";
            
            // Add enhanced loading animation to progress items
            progressItems.forEach((item, index) => {
                item.style.animation = `pulse 1.5s infinite ${index * 0.2}s`;
                item.style.opacity = "0.7";
            });
            
            // Add loading spinner to button
            searchButton.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <div class="spinner"></div>
                    Searching...
                </span>
            `;
        } else {
            searchButton.textContent = "Get Stats";
            searchButton.disabled = false;
            searchButton.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)";
            searchButton.style.cursor = "pointer";
            
            // Remove loading animation
            progressItems.forEach(item => {
                item.style.animation = "";
                item.style.opacity = "1";
            });
        }
    }

    // Show loading progress with detailed status
    function showLoadingProgress(message) {
        // Remove existing progress if any
        hideLoadingProgress();
        
        const progressDiv = document.createElement("div");
        progressDiv.className = "loading-progress";
        progressDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 40, 0.95));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(102, 126, 234, 0.3);
                border-radius: 15px;
                padding: 2rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                z-index: 1001;
                text-align: center;
                 min-width: 300px;
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(102, 126, 234, 0.3);
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <div style="color: #ffffff; font-weight: 500; margin-bottom: 0.5rem;">
                    ${message}
                </div>
                <div style="color: #a0aec0; font-size: 0.9rem;">
                    This may take a few seconds...
                </div>
            </div>
        `;
        
        document.body.appendChild(progressDiv);
    }

    // Hide loading progress
    function hideLoadingProgress() {
        const existingProgress = document.querySelector('.loading-progress');
        if (existingProgress) {
            existingProgress.remove();
        }
    }

    // Reset stats display
    function resetStats() {
        // Show the number and label in each circle
        easyLabel.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;"><div style=\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\">0</div><div style=\"font-size: 0.8rem; opacity: 0.9;\">Easy</div></div>`;
        mediumLabel.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;"><div style=\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\">0</div><div style=\"font-size: 0.8rem; opacity: 0.9;\">Medium</div></div>`;
        hardLabel.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;"><div style=\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\">0</div><div style=\"font-size: 0.8rem; opacity: 0.9;\">Hard</div></div>`;
        
        // Reset stats card
        if (statsCard) {
            statsCard.innerHTML = `
                <div style="text-align: center; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
                    <div style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">
                        Total Solved: 0
                    </div>
                    
                    <!-- Progress Bar Graph in Column Format -->
                    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; gap: 1rem;">
                        <!-- Easy Column -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 12px; height: 12px; background: #48bb78; border-radius: 2px; margin-bottom: 0.5rem;"></div>
                            <div style="font-size: 0.8rem; color: #a0aec0; margin-bottom: 0.5rem; text-align: center;">Easy</div>
                            <div style="font-size: 0.9rem; font-weight: 600; color: #48bb78; margin-bottom: 0.5rem;">0%</div>
                            <div style="width: 100%; height: 120px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; position: relative; display: flex; align-items: end;">
                                <div style="width: 100%; height: 0%; background: linear-gradient(180deg, #48bb78, #38a169); transition: height 1s ease; border-radius: 8px 8px 0 0;"></div>
                            </div>
                            <div style="font-size: 0.7rem; color: #a0aec0; margin-top: 0.5rem; text-align: center;">0</div>
                        </div>
                        
                        <!-- Medium Column -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 12px; height: 12px; background: #ed8936; border-radius: 2px; margin-bottom: 0.5rem;"></div>
                            <div style="font-size: 0.8rem; color: #a0aec0; margin-bottom: 0.5rem; text-align: center;">Medium</div>
                            <div style="font-size: 0.9rem; font-weight: 600; color: #ed8936; margin-bottom: 0.5rem;">0%</div>
                            <div style="width: 100%; height: 120px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; position: relative; display: flex; align-items: end;">
                                <div style="width: 100%; height: 0%; background: linear-gradient(180deg, #ed8936, #dd6b20); transition: height 1s ease; border-radius: 8px 8px 0 0;"></div>
                            </div>
                            <div style="font-size: 0.7rem; color: #a0aec0; margin-top: 0.5rem; text-align: center;">0</div>
                        </div>
                        
                        <!-- Hard Column -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 12px; height: 12px; background: #e53e3e; border-radius: 2px; margin-bottom: 0.5rem;"></div>
                            <div style="font-size: 0.8rem; color: #a0aec0; margin-bottom: 0.5rem; text-align: center;">Hard</div>
                            <div style="font-size: 0.9rem; font-weight: 600; color: #e53e3e; margin-bottom: 0.5rem;">0%</div>
                            <div style="width: 100%; height: 120px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; position: relative; display: flex; align-items: end;">
                                <div style="width: 100%; height: 0%; background: linear-gradient(180deg, #e53e3e, #c53030); transition: height 1s ease; border-radius: 8px 8px 0 0;"></div>
                            </div>
                            <div style="font-size: 0.7rem; color: #a0aec0; margin-top: 0.5rem; text-align: center;">0</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #a0aec0;">
                        Acceptance Rate: N/A
                    </div>
                    <div style="font-size: 0.9rem; color: #a0aec0;">
                        Ranking: N/A
                    </div>
                </div>
            `;
        }
        
        // Reset progress item styles
        progressItems.forEach(item => {
            item.style.transform = "scale(1)";
            item.style.boxShadow = "";
        });
    }

    // Animate stats update
    function animateStatsUpdate() {
        progressItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = "scale(1.1)";
                item.style.boxShadow = "0 0 30px rgba(102, 126, 234, 0.5)";
                
                setTimeout(() => {
                    item.style.transform = "scale(1)";
                    item.style.boxShadow = "";
                }, 300);
            }, index * 200);
        });
    }

    // Fetch LeetCode user data with performance optimizations
    async function fetchLeetCodeData(username) {
        // Check cache first
        const cachedData = cache.get(username);
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            console.log("Using cached data for:", username);
            updateStatsDisplay(cachedData.data);
            showSuccess(`Loaded cached data for ${username}!`);
            animateStatsUpdate();
            return;
        }

        const apiUrl = `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`;
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            setLoadingState(true);
            resetStats();

            // Show loading progress
            showLoadingProgress("Connecting to LeetCode...");

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("User not found. Please check the username and try again.");
                } else if (response.status === 429) {
                    throw new Error("Too many requests. Please wait a moment and try again.");
                } else if (response.status === 503) {
                    throw new Error("LeetCode API is temporarily unavailable. Please try again later.");
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            showLoadingProgress("Processing data...");
            
            const data = await response.json();
            
            // Validate the response data
            if (!data || typeof data !== 'object') {
                throw new Error("Invalid data received from server");
            }

            console.log("LeetCode data:", data);
            
            // Cache the data
            cache.set(username, {
                data: data,
                timestamp: Date.now()
            });
            
            // Update the UI with the fetched data
            updateStatsDisplay(data);
            
            // Show success message
            showSuccess(`Successfully fetched data for ${username}!`);
            
            // Animate the stats update
            animateStatsUpdate();

        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Error fetching LeetCode data:", error);
            
            let errorMessage = "Failed to fetch user data. ";
            if (error.name === 'AbortError') {
                errorMessage = "Request timed out. Please check your internet connection and try again.";
            } else if (error.message.includes("User not found")) {
                errorMessage = error.message;
            } else if (error.message.includes("Too many requests")) {
                errorMessage = error.message;
            } else if (error.message.includes("temporarily unavailable")) {
                errorMessage = error.message;
            } else if (error.name === "TypeError" && error.message.includes("fetch")) {
                errorMessage = "Network error. Please check your internet connection.";
            } else {
                errorMessage += "Please try again later.";
            }
            
            showError(errorMessage);
            resetStats();
        } finally {
            setLoadingState(false);
            hideLoadingProgress();
        }
    }

    // Update stats display with fetched data
    function updateStatsDisplay(data) {
        const easyCount = data.easySolved || 0;
        const mediumCount = data.mediumSolved || 0;
        const hardCount = data.hardSolved || 0;
        const totalSolved = easyCount + mediumCount + hardCount;

        // Show the number and label in each circle
        if (easyCount !== undefined) {
            easyLabel.innerHTML = `<div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;\"><div style=\\\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\\\">${easyCount}</div><div style=\\\"font-size: 0.8rem; opacity: 0.9;\\\">Easy</div></div>`;
            easyLabel.title = `${easyCount} Easy problems solved`;
        }
        if (mediumCount !== undefined) {
            mediumLabel.innerHTML = `<div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;\"><div style=\\\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\\\">${mediumCount}</div><div style=\\\"font-size: 0.8rem; opacity: 0.9;\\\">Medium</div></div>`;
            mediumLabel.title = `${mediumCount} Medium problems solved`;
        }
        if (hardCount !== undefined) {
            hardLabel.innerHTML = `<div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;\"><div style=\\\"font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem;\\\">${hardCount}</div><div style=\\\"font-size: 0.8rem; opacity: 0.9;\\\">Hard</div></div>`;
            hardLabel.title = `${hardCount} Hard problems solved`;
        }

        // Update stats card with graph and additional information
        if (statsCard) {
            const acceptanceRate = data.acceptanceRate ? `${data.acceptanceRate}%` : "N/A";
            const ranking = data.ranking ? `#${data.ranking.toLocaleString()}` : "N/A";
            
            // Calculate percentages for the graph
            const easyPercent = totalSolved > 0 ? (easyCount / totalSolved * 100).toFixed(1) : 0;
            const mediumPercent = totalSolved > 0 ? (mediumCount / totalSolved * 100).toFixed(1) : 0;
            const hardPercent = totalSolved > 0 ? (hardCount / totalSolved * 100).toFixed(1) : 0;
            
            statsCard.innerHTML = `
                <div style="text-align: center; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
                    <div style="margin-bottom: 1.5rem; font-size: 1.3rem; font-weight: 600; color: #667eea;">
                        Total Solved: ${totalSolved}
                    </div>
                    
                    <!-- Progress Bar Graph in Column Format -->
                    <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; gap: 1.5rem;">
                        <!-- Easy Column -->
                        <div class="graph-column easy-column" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 16px; height: 16px; background: #48bb78; border-radius: 3px; margin-bottom: 0.8rem;"></div>
                            <div class="difficulty-label" style="font-size: 1rem; color: #a0aec0; margin-bottom: 0.8rem; text-align: center; font-weight: 500;">Easy</div>
                            <div class="percentage-text" style="font-size: 1.1rem; font-weight: 700; color: #48bb78; margin-bottom: 0.8rem;">${easyPercent}%</div>
                            <div class="progress-bar-container" style="width: 100%; height: 150px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; position: relative; display: flex; align-items: end; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                <div class="progress-bar" style="width: 100%; height: ${easyPercent}%; background: linear-gradient(180deg, #48bb78, #38a169); transition: height 1.5s ease; border-radius: 12px 12px 0 0; box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);"></div>
                            </div>
                            <div class="count-text" style="font-size: 0.9rem; color: #a0aec0; margin-top: 0.8rem; text-align: center; font-weight: 500;">${easyCount} problems</div>
                        </div>
                        
                        <!-- Medium Column -->
                        <div class="graph-column medium-column" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 16px; height: 16px; background: #ed8936; border-radius: 3px; margin-bottom: 0.8rem;"></div>
                            <div class="difficulty-label" style="font-size: 1rem; color: #a0aec0; margin-bottom: 0.8rem; text-align: center; font-weight: 500;">Medium</div>
                            <div class="percentage-text" style="font-size: 1.1rem; font-weight: 700; color: #ed8936; margin-bottom: 0.8rem;">${mediumPercent}%</div>
                            <div class="progress-bar-container" style="width: 100%; height: 150px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; position: relative; display: flex; align-items: end; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                <div class="progress-bar" style="width: 100%; height: ${mediumPercent}%; background: linear-gradient(180deg, #ed8936, #dd6b20); transition: height 1.5s ease; border-radius: 12px 12px 0 0; box-shadow: 0 2px 8px rgba(237, 137, 54, 0.3);"></div>
                            </div>
                            <div class="count-text" style="font-size: 0.9rem; color: #a0aec0; margin-top: 0.8rem; text-align: center; font-weight: 500;">${mediumCount} problems</div>
                        </div>
                        
                        <!-- Hard Column -->
                        <div class="graph-column hard-column" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 16px; height: 16px; background: #e53e3e; border-radius: 3px; margin-bottom: 0.8rem;"></div>
                            <div class="difficulty-label" style="font-size: 1rem; color: #a0aec0; margin-bottom: 0.8rem; text-align: center; font-weight: 500;">Hard</div>
                            <div class="percentage-text" style="font-size: 1.1rem; font-weight: 700; color: #e53e3e; margin-bottom: 0.8rem;">${hardPercent}%</div>
                            <div class="progress-bar-container" style="width: 100%; height: 150px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; position: relative; display: flex; align-items: end; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                <div class="progress-bar" style="width: 100%; height: ${hardPercent}%; background: linear-gradient(180deg, #e53e3e, #c53030); transition: height 1.5s ease; border-radius: 12px 12px 0 0; box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);"></div>
                            </div>
                            <div class="count-text" style="font-size: 0.9rem; color: #a0aec0; margin-top: 0.8rem; text-align: center; font-weight: 500;">${hardCount} problems</div>
                        </div>
                    </div>
                    
                    <!-- Additional Stats Row -->
                    <div class="stats-info" style="display: flex; justify-content: center; gap: 3rem; margin-top: 1rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 1rem; color: #667eea; font-weight: 600; margin-bottom: 0.3rem;">Acceptance Rate</div>
                            <div style="font-size: 1.2rem; color: #ffffff; font-weight: 700;">${acceptanceRate}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1rem; color: #667eea; font-weight: 600; margin-bottom: 0.3rem;">Ranking</div>
                            <div style="font-size: 1.2rem; color: #ffffff; font-weight: 700;">${ranking}</div>
                        </div>
                    </div>
                </div>
            `;
            // Smooth scroll to stats card
            statsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Event listeners
    searchButton.addEventListener('click', function() {
        if (isLoading) return; // Prevent multiple requests
        
        const userInput = usernameInput.value.trim();
        console.log("Searching for username:", userInput);
        
        // Prevent duplicate requests for the same username
        if (userInput === lastSearchedUsername && !isLoading) {
            showError("You're already viewing this user's data!");
            return;
        }
        
        if (validateUsername(userInput)) {
            lastSearchedUsername = userInput;
            fetchLeetCodeData(userInput);
        }
    });

    // Allow Enter key to trigger search
    usernameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !isLoading) {
            searchButton.click();
        }
    });

    // Add CSS animations for notifications and loading
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.05);
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(102, 126, 234, 0.3);
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-progress {
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes blink {
            0%, 50% { border-right-color: #667eea; }
            51%, 100% { border-right-color: transparent; }
        }
    `;
    document.head.appendChild(style);

    // Initialize with some sample data or empty state
    console.log("LeetMetric initialized successfully!");
    
    // Typing animation for the heading
    initTypingAnimation();

    // After rendering the Progress row (the three circles), move the stats-card below the Progress
    const progress = document.querySelector('.Progress');
    if (progress && statsCard) {
        // Remove stats-card from Progress if present
        if (statsCard.parentNode === progress) {
            progress.parentNode.insertBefore(statsCard, progress.nextSibling);
        }
        // Add 20px top margin to stats-card
        statsCard.style.marginTop = '20px';
    }
});

// Typing animation functions
function initTypingAnimation() {
    const heading = document.querySelector('h1 span');
    if (!heading) return;
    
    const originalText = heading.textContent;
    const typingSpeed = 100; // milliseconds per character
    const pauseDuration = 2000; // pause before reverse typing
    const reverseSpeed = 80; // milliseconds per character for reverse
    
    // Start the typing animation
    typeWriter(heading, originalText, typingSpeed, pauseDuration, reverseSpeed);
}

function typeWriter(element, text, typingSpeed, pauseDuration, reverseSpeed) {
    let currentIndex = 0;
    let isTyping = true;
    
    // Clear the text initially
    element.textContent = '';
    element.style.borderRight = '3px solid #667eea';
    element.style.animation = 'blink 1s infinite';
    
    function typeForward() {
        if (currentIndex < text.length) {
            element.textContent += text.charAt(currentIndex);
            currentIndex++;
            setTimeout(typeForward, typingSpeed);
        } else {
            // Finished typing forward, pause then reverse
            setTimeout(() => {
                typeReverse();
            }, pauseDuration);
        }
    }
    
    function typeReverse() {
        if (currentIndex > 0) {
            element.textContent = text.substring(0, currentIndex - 1);
            currentIndex--;
            setTimeout(typeReverse, reverseSpeed);
        } else {
            // Finished reverse typing, restart the cycle
            setTimeout(() => {
                typeWriter(element, text, typingSpeed, pauseDuration, reverseSpeed);
            }, 1000);
        }
    }
    
    // Start the animation
    typeForward();
}
