// DOM elements
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const container = document.querySelector(".container");

// Security helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if already logged in
const token = localStorage.getItem("adminToken");
console.log('Checking for existing token:', token ? 'Token found' : 'No token');
if (token) {
    console.log('Token found, showing dashboard...');
    showDashboard();
} else {
    console.log('No token found, showing login form');
}

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    try {
        // First, try to login
        let response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Login successful, setting token and showing dashboard');
            localStorage.setItem("adminToken", data.token);
            showDashboard();
        } else {
            // If login fails, try to register (first time setup)
            response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Registration successful, setting token and showing dashboard');
                localStorage.setItem("adminToken", data.token);
                showDashboard();
            } else {
                const errorData = await response.json();
                showError(errorData.message || "Invalid credentials");
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showError("Network error. Please try again.");
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
        errorMessage.style.display = "none";
    }, 3000);
}

function showDashboard() {
    console.log('showDashboard function called');
    container.innerHTML = `
        <div class="dashboard" style="display: block; padding: 20px; max-width: 1200px; margin: 0 auto;">
            <button class="logout-btn" onclick="logout()" style="position: absolute; top: 20px; right: 20px; padding: 10px 20px; background-color: #4c2307; color: #ffda53; border: none; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">Logout</button>
            <h1 style="color: #4c2307; font-family: saeada; font-size: 4rem; text-align: center; margin-bottom: 30px;">Admin Dashboard</h1>
            <div class="requests-container" style="background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #4c2307; font-size: 2.5rem; margin-bottom: 20px; font-family: saeada;">User Requests</h2>
                <div id="requestsList"></div>
            </div>
        </div>
    `;
    
    console.log('Dashboard HTML set, loading requests...');
    loadRequests();
}

function logout() {
    localStorage.removeItem("adminToken");
    location.reload();
}

async function loadRequests() {
    const requestsList = document.getElementById("requestsList");
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
        requestsList.innerHTML = '<div class="no-requests">Authentication required</div>';
        return;
    }
    
    try {
        const response = await fetch('/api/requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }

        const requests = await response.json();
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="no-requests">No requests found</div>';
            return;
        }
        
        requestsList.innerHTML = requests.map((request, index) => `
            <div class="request-item" style="border: 2px solid #ffda53; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.7);">
                <h3 style="color: #4c2307; font-size: 2rem; margin-bottom: 10px; font-family: saeada;">Request #${index + 1}</h3>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 8px; font-family: novecento;"><strong>Name:</strong> ${escapeHtml(request.name)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 8px; font-family: novecento;"><strong>Email:</strong> ${escapeHtml(request.email)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 8px; font-family: novecento;"><strong>Message:</strong> ${escapeHtml(request.message)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 8px; font-family: novecento;"><strong>Date:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${!request.notificationSent ? 
                        `<button onclick="sendNotification('${request._id}')" style="background: #4c2307; color: #ffda53; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 1.4rem;">Send Notification</button>` :
                        `<span style="background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-size: 1.4rem;">✓ Notified</span>`
                    }
                    
                    ${!request.repliedTo ? 
                        `<button onclick="showReplyModal('${request._id}', '${escapeHtml(request.name)}', '${escapeHtml(request.email)}')" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 1.4rem;">Reply</button>` :
                        `<span style="background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-size: 1.4rem;">✓ Replied</span>`
                    }
                    
                    <button onclick="deleteRequest('${request._id}')" style="background: #d32f2f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 1.4rem;">Delete</button>
                </div>
                
                ${request.notificationSent ? 
                    `<p style="color: #666; font-size: 1.2rem; margin-top: 10px;"><em>Notification sent: ${new Date(request.notificationSentAt).toLocaleString()}</em></p>` : ''
                }
                
                ${request.repliedTo ? 
                    `<p style="color: #666; font-size: 1.2rem; margin-top: 10px;"><em>Replied: ${new Date(request.replySentAt).toLocaleString()}</em></p>` : ''
                }
            </div>
        `).join("");
    } catch (error) {
        console.error('Error loading requests:', error);
        requestsList.innerHTML = '<div class="no-requests">Error loading requests</div>';
    }
}

async function deleteRequest(requestId) {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
        alert("Authentication required");
        return;
    }
    
    try {
        const response = await fetch(`/api/requests/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete request');
        }

        loadRequests(); // Reload the requests list
    } catch (error) {
        console.error('Error deleting request:', error);
        alert("Failed to delete request");
    }
}

// Send notification email
async function sendNotification(requestId) {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
        alert("Authentication required");
        return;
    }
    
    try {
        const response = await fetch(`/api/requests/${requestId}/notify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send notification');
        }

        const result = await response.json();
        alert('Notification email sent successfully!');
        loadRequests(); // Reload to update the UI
    } catch (error) {
        console.error('Error sending notification:', error);
        alert("Failed to send notification: " + error.message);
    }
}

// Show reply modal
function showReplyModal(requestId, recipientName, recipientEmail) {
    const modalHTML = `
        <div id="replyModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; border-radius: 15px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                <h2 style="color: #4c2307; font-family: saeada; font-size: 2.5rem; text-align: center; margin-bottom: 20px;">Send Reply</h2>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: #4c2307; font-size: 1.4rem; margin-bottom: 5px;"><strong>To:</strong> ${escapeHtml(recipientName)} (${escapeHtml(recipientEmail)})</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #4c2307; font-size: 1.6rem; font-weight: bold; margin-bottom: 8px;">Your Reply:</label>
                    <textarea id="replyMessage" style="width: 100%; padding: 12px; border: 2px solid #ffda53; border-radius: 8px; font-size: 1.4rem; font-family: novecento; min-height: 120px; resize: vertical;" placeholder="Enter your reply message..."></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="sendReply('${requestId}')" style="background: #4c2307; color: #ffda53; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1.6rem; font-weight: bold; cursor: pointer;">Send Reply</button>
                    <button onclick="closeReplyModal()" style="background: #666; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close reply modal
function closeReplyModal() {
    const modal = document.getElementById('replyModal');
    if (modal) {
        modal.remove();
    }
}

// Send reply email
async function sendReply(requestId) {
    const token = localStorage.getItem("adminToken");
    const replyMessage = document.getElementById('replyMessage').value.trim();
    
    if (!token) {
        alert("Authentication required");
        return;
    }
    
    if (!replyMessage) {
        alert("Please enter a reply message");
        return;
    }
    
    try {
        const response = await fetch(`/api/requests/${requestId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ replyMessage })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send reply');
        }

        const result = await response.json();
        alert('Reply email sent successfully!');
        closeReplyModal();
        loadRequests(); // Reload to update the UI
    } catch (error) {
        console.error('Error sending reply:', error);
        alert("Failed to send reply: " + error.message);
    }
}

// Auto-refresh requests every 30 seconds
setInterval(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
        loadRequests();
    }
}, 30000);
