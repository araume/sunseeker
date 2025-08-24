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
            <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 20px;">
                <h1 style="color: #4c2307; font-family: saeada; font-size: 4rem; text-align: center; margin: 0; flex: 1;">Admin Dashboard</h1>
                <button class="logout-btn" onclick="logout()" style="position: static; padding: 10px 20px; background-color: #4c2307; color: #ffda53; border: none; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">Logout</button>
            </div>

            <div style="display:flex; gap:10px; justify-content:center; margin-bottom: 20px;">
                <button id="tabRequests" onclick="showRequestsView()" style="background:#ffda53;color:#4c2307;border:none;padding:10px 16px;border-radius:6px;font-size:1.4rem;font-family: saeada;cursor:pointer;">Requests</button>
                <button id="tabVerifications" onclick="showVerificationsView()" style="background:#eee;color:#4c2307;border:none;padding:10px 16px;border-radius:6px;font-size:1.4rem;font-family: saeada;cursor:pointer;">Verifications</button>
                <button id="tabLogs" onclick="showLogsView()" style="background:#eee;color:#4c2307;border:none;padding:10px 16px;border-radius:6px;font-size:1.4rem;font-family: saeada;cursor:pointer;">Logs</button>
            </div>

            <div id="requestsView" class="requests-container" style="background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #4c2307; font-size: 2.2rem; margin-bottom: 20px; font-family: saeada;">User Requests</h2>
                <div id="requestsList"></div>
            </div>

            <div id="verificationsView" style="display:none; background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-top:20px;">
                <h2 style="color: #4c2307; font-size: 2.2rem; margin-bottom: 20px; font-family: saeada;">Verified Submissions</h2>
                <div id="verificationsList"></div>
            </div>

            <div id="logsView" style="display:none; background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-top:20px;">
                <h2 style="color: #4c2307; font-size: 2.2rem; margin-bottom: 12px; font-family: saeada;">Logs</h2>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items: flex-end; margin-bottom: 12px;">
                    <div>
                        <label style="display:block;color:#4c2307;font-size:1.2rem;font-weight:bold;margin-bottom:4px;">Status</label>
                        <select id="logStatus" style="padding:8px;border:2px solid #ffda53;border-radius:6px;font-size:1.4rem;">
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="notified">Notified</option>
                            <option value="paid">Paid</option>
                            <option value="complete">Complete</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;color:#4c2307;font-size:1.2rem;font-weight:bold;margin-bottom:4px;">From</label>
                        <input type="date" id="logFrom" style="padding:8px;border:2px solid #ffda53;border-radius:6px;font-size:1.4rem;" />
                    </div>
                    <div>
                        <label style="display:block;color:#4c2307;font-size:1.2rem;font-weight:bold;margin-bottom:4px;">To</label>
                        <input type="date" id="logTo" style="padding:8px;border:2px solid #ffda53;border-radius:6px;font-size:1.4rem;" />
                    </div>
                    <div>
                        <label style="display:block;color:#4c2307;font-size:1.2rem;font-weight:bold;margin-bottom:4px;">Sort</label>
                        <select id="logSort" style="padding:8px;border:2px solid #ffda53;border-radius:6px;font-size:1.4rem;">
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                        </select>
                    </div>
                    <button onclick="loadLogs()" style="background:#4c2307;color:#ffda53;border:none;padding:10px 16px;border-radius:6px;font-size:1.4rem;font-family: saeada;cursor:pointer;">Apply</button>
                </div>
                <div id="logsList"></div>
            </div>
        </div>
    `;
    console.log('Dashboard HTML set, loading requests...');
    showRequestsView();
}

function logout() {
    localStorage.removeItem("adminToken");
    location.reload();
}

function setActiveTab(tab) {
    const reqBtn = document.getElementById('tabRequests');
    const verBtn = document.getElementById('tabVerifications');
    const logBtn = document.getElementById('tabLogs');
    if (reqBtn && verBtn && logBtn) {
        reqBtn.style.background = tab === 'requests' ? '#ffda53' : '#eee';
        verBtn.style.background = tab === 'verifications' ? '#ffda53' : '#eee';
        logBtn.style.background = tab === 'logs' ? '#ffda53' : '#eee';
    }
}

function showRequestsView() {
    setActiveTab('requests');
    const rv = document.getElementById('requestsView');
    const vv = document.getElementById('verificationsView');
    const lv = document.getElementById('logsView');
    if (rv) rv.style.display = 'block';
    if (vv) vv.style.display = 'none';
    if (lv) lv.style.display = 'none';
    loadRequests();
}

function showVerificationsView() {
    setActiveTab('verifications');
    const rv = document.getElementById('requestsView');
    const vv = document.getElementById('verificationsView');
    const lv = document.getElementById('logsView');
    if (rv) rv.style.display = 'none';
    if (vv) vv.style.display = 'block';
    if (lv) lv.style.display = 'none';
    loadVerifications();
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
                <p style="color: #4c2307; font-size: 1.4rem; margin-bottom: 6px; font-family: novecento;"><strong>Request ID:</strong> ${escapeHtml(request._id)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 6px; font-family: novecento;"><strong>Name:</strong> ${escapeHtml(request.name)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 6px; font-family: novecento;"><strong>Email:</strong> ${escapeHtml(request.email)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 6px; font-family: novecento;"><strong>Message:</strong> ${escapeHtml(request.message)}</p>
                <p style="color: #4c2307; font-size: 1.6rem; margin-bottom: 6px; font-family: novecento;"><strong>Date:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
                
                <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${!request.notificationSent ? 
                        `<button onclick="openNotifyModal('${request._id}')" style="background: #4c2307; color: #ffda53; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 1.4rem;">Send Notification</button>` :
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

async function loadVerifications() {
    const listEl = document.getElementById('verificationsList');
    const token = localStorage.getItem('adminToken');
    if (!token) {
        listEl.innerHTML = '<div class="no-requests">Authentication required</div>';
        return;
    }
    try {
        const res = await fetch('/api/requests/verified/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch verifications');
        const items = await res.json();
        if (!items || items.length === 0) {
            listEl.innerHTML = '<div class="no-requests">No verifications yet</div>';
            return;
        }
        listEl.innerHTML = items.map(v => `
            <div class="request-item" style="border: 2px solid #ffda53; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: rgba(255,255,255,0.7);">
                <p style="color:#4c2307; font-size:1.4rem; margin-bottom:6px;"><strong>Request ID:</strong> ${escapeHtml(v._id)}</p>
                <p style="color:#4c2307; font-size:1.4rem; margin-bottom:6px;"><strong>Name:</strong> ${escapeHtml(v.name)}</p>
                <p style="color:#4c2307; font-size:1.4rem; margin-bottom:6px;"><strong>Email:</strong> ${escapeHtml(v.email)}</p>
                <p style="color:#4c2307; font-size:1.4rem; margin-bottom:6px;"><strong>Reference:</strong> ${escapeHtml(v.paymentReference || '')}</p>
                <p style="color:#4c2307; font-size:1.4rem; margin-bottom:6px;"><strong>Verified At:</strong> ${v.verifiedAt ? new Date(v.verifiedAt).toLocaleString() : ''}</p>
                <div style="margin-top: 10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="viewReceipt('${v._id}')" style="background:#2196F3;color:#fff;border:none;padding:8px 16px;border-radius:4px;font-size:1.4rem;cursor:pointer;">View Receipt</button>
                    <button onclick="deleteVerification('${v._id}')" style="background:#d32f2f;color:#fff;border:none;padding:8px 16px;border-radius:4px;font-size:1.4rem;cursor:pointer;">Delete Verification</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading verifications:', err);
        listEl.innerHTML = '<div class="no-requests">Error loading verifications</div>';
    }
}

// Delete verification handler
async function deleteVerification(requestId) {
    const token = localStorage.getItem('adminToken');
    const confirmDelete = confirm('Delete this verification (reference and receipt)?');
    if (!confirmDelete) return;
    try {
        const res = await fetch(`/api/requests/${requestId}/verification`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete verification');
        }
        alert('Verification deleted');
        loadVerifications();
        loadLogs();
    } catch (err) {
        console.error('Error deleting verification:', err);
        alert(err.message);
    }
}

async function viewReceipt(requestId) {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`/api/requests/${requestId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Receipt not available');
        const blob = await res.blob();
        const dataUrl = await blobToDataURL(blob);
        openReceiptModal(dataUrl);
    } catch (err) {
        alert(err.message);
    }
}

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function openReceiptModal(dataUrl) {
    const html = `
        <div id="receiptModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000;">
            <div style="background:#fff;padding:20px;border-radius:10px;max-width:90vw;max-height:90vh;overflow:auto;">
                <img src="${dataUrl}" alt="Receipt" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;" />
                <div style="text-align:center;margin-top:10px;">
                    <button onclick="closeReceiptModal()" style="background:#4c2307;color:#ffda53;border:none;padding:8px 16px;border-radius:6px;font-size:1.4rem;cursor:pointer;">Close</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeReceiptModal() {
    const el = document.getElementById('receiptModal');
    if (el) el.remove();
}

// Send notification email with optional image + caption
function openNotifyModal(requestId) {
    const modalHTML = `
        <div id="notifyModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; border-radius: 15px; width: 90%; max-width: 520px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                <h2 style="color: #4c2307; font-family: saeada; font-size: 2.5rem; text-align: center; margin-bottom: 20px;">Send Notification</h2>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #4c2307; font-size: 1.6rem; font-weight: bold; margin-bottom: 8px;">Image (optional):</label>
                    <input id="notifyImage" type="file" accept="image/*" style="width: 100%; font-size: 1.4rem;" />
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #4c2307; font-size: 1.6rem; font-weight: bold; margin-bottom: 8px;">Caption (optional):</label>
                    <input id="notifyCaption" type="text" placeholder="Enter a short caption" style="width: 100%; padding: 12px; border: 2px solid #ffda53; border-radius: 8px; font-size: 1.4rem; font-family: novecento;" />
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="submitNotification('${requestId}')" style="background: #4c2307; color: #ffda53; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1.6rem; font-weight: bold; cursor: pointer;">Send</button>
                    <button onclick="closeNotifyModal()" style="background: #666; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeNotifyModal() {
    const modal = document.getElementById('notifyModal');
    if (modal) modal.remove();
}

async function submitNotification(requestId) {
    const token = localStorage.getItem("adminToken");
    if (!token) {
        alert("Authentication required");
        return;
    }

    const fileInput = document.getElementById('notifyImage');
    const captionInput = document.getElementById('notifyCaption');

    const formData = new FormData();
    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }
    if (captionInput && captionInput.value) {
        formData.append('caption', captionInput.value);
    }

    try {
        const response = await fetch(`/api/requests/${requestId}/notify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send notification');
        }

        const result = await response.json();
        alert('Notification sent successfully!');
        closeNotifyModal();
        showRequestsView();
    } catch (error) {
        console.error('Error sending notification:', error);
        alert('Failed to send notification: ' + error.message);
    }
}

// Auto-refresh verifications when on that tab
setInterval(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
        const vv = document.getElementById('verificationsView');
        if (vv && vv.style.display !== 'none') {
            loadVerifications();
        }
    }
}, 30000);

// Update logs fetch URL
async function loadLogs() {
    const token = localStorage.getItem('adminToken');
    const listEl = document.getElementById('logsList');
    const status = document.getElementById('logStatus').value;
    const from = document.getElementById('logFrom').value;
    const to = document.getElementById('logTo').value;
    const sort = document.getElementById('logSort').value;

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (sort) params.set('sort', sort);

    try {
        const res = await fetch(`/api/requests/logs/list?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load logs');
        const logs = await res.json();
        if (!logs || logs.length === 0) {
            listEl.innerHTML = '<div class="no-requests">No records match filters</div>';
            return;
        }
        listEl.innerHTML = logs.map(l => `
            <div class="request-item" style="border: 2px solid #ffda53; border-radius: 10px; padding: 16px; margin-bottom: 14px; background: rgba(255,255,255,0.7);">
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Request ID:</strong> ${escapeHtml(String(l.id))}</p>
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Alias:</strong> ${escapeHtml(l.name || '')}</p>
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Email:</strong> ${escapeHtml(l.email || '')}</p>
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Details:</strong> ${escapeHtml(l.message || '')}</p>
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Status:</strong> ${escapeHtml(l.status)}</p>
                <p style="color:#4c2307;font-size:1.3rem;margin-bottom:4px;"><strong>Created:</strong> ${new Date(l.createdAt).toLocaleString()}</p>
                ${l.notificationSentAt ? `<p style=\"color:#4c2307;font-size:1.3rem;margin-bottom:4px;\"><strong>Notified:</strong> ${new Date(l.notificationSentAt).toLocaleString()}</p>` : ''}
                ${l.verifiedAt ? `<p style=\"color:#4c2307;font-size:1.3rem;margin-bottom:4px;\"><strong>Paid:</strong> ${new Date(l.verifiedAt).toLocaleString()}</p>` : ''}
                ${l.paymentReference ? `<p style=\"color:#4c2307;font-size:1.3rem;margin-bottom:4px;\"><strong>Reference:</strong> ${escapeHtml(l.paymentReference)}</p>` : ''}
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading logs:', err);
        listEl.innerHTML = '<div class="no-requests">Error loading logs</div>';
    }
}

// Add missing tab handler for Logs view
function showLogsView() {
    setActiveTab('logs');
    const rv = document.getElementById('requestsView');
    const vv = document.getElementById('verificationsView');
    const lv = document.getElementById('logsView');
    if (rv) rv.style.display = 'none';
    if (vv) vv.style.display = 'none';
    if (lv) lv.style.display = 'block';
    loadLogs();
}

// Add Reply modal + handlers
function showReplyModal(requestId, recipientName, recipientEmail) {
    const modalHTML = `
        <div id="replyModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 12px; width: 90%; max-width: 520px;">
                <h2 style="color:#4c2307; font-family: saeada; font-size: 2.2rem; text-align: center; margin-bottom: 12px;">Send Reply</h2>
                <p style="color:#4c2307; font-size:1.2rem; margin-bottom: 10px; text-align:center;"><strong>To:</strong> ${escapeHtml(recipientName)} (${escapeHtml(recipientEmail)})</p>
                <div style="margin-bottom: 15px;">
                    <label for="replyMessage" style="display:block;color:#4c2307;font-weight:bold;margin-bottom:6px;">Message</label>
                    <textarea id="replyMessage" rows="6" style="width:100%;padding:12px;border:2px solid #ffda53;border-radius:8px;font-size:1.4rem;font-family: novecento;background:rgba(255,255,255,0.9);"></textarea>
                </div>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:10px;">
                    <button onclick="sendReply('${requestId}')" style="background:#4c2307;color:#ffda53;border:none;padding:10px 18px;border-radius:6px;font-size:1.4rem;cursor:pointer;">Send</button>
                    <button onclick="closeReplyModal()" style="background:#666;color:#fff;border:none;padding:10px 18px;border-radius:6px;font-size:1.4rem;cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeReplyModal() {
    const el = document.getElementById('replyModal');
    if (el) el.remove();
}

async function sendReply(requestId) {
    const token = localStorage.getItem('adminToken');
    const textarea = document.getElementById('replyMessage');
    const replyMessage = textarea ? textarea.value.trim() : '';
    if (!replyMessage) {
        alert('Please enter a reply message.');
        return;
    }
    try {
        const res = await fetch(`/api/requests/${requestId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ replyMessage })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to send reply');
        }
        alert('Reply sent successfully!');
        closeReplyModal();
        showRequestsView();
    } catch (err) {
        console.error('Error sending reply:', err);
        alert(err.message);
    }
}

// Delete request handler
async function deleteRequest(requestId) {
    const token = localStorage.getItem('adminToken');
    const confirmDelete = confirm('Are you sure you want to delete this request?');
    if (!confirmDelete) return;
    try {
        const res = await fetch(`/api/requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete request');
        }
        alert('Request deleted successfully');
        showRequestsView();
    } catch (err) {
        console.error('Error deleting request:', err);
        alert(err.message);
    }
}

// Expose handlers globally for inline onclick
window.showRequestsView = showRequestsView;
window.showVerificationsView = showVerificationsView;
window.showLogsView = showLogsView;
window.openNotifyModal = openNotifyModal;
window.submitNotification = submitNotification;
window.showReplyModal = showReplyModal;
window.sendReply = sendReply;
window.deleteRequest = deleteRequest;
window.viewReceipt = viewReceipt;
window.closeReceiptModal = closeReceiptModal;
window.closeNotifyModal = closeNotifyModal;
window.closeReplyModal = closeReplyModal;
window.deleteVerification = deleteVerification;
window.logout = logout;

// Ensure UI handlers are globally accessible for inline onclick attributes
window.showRequestsView = window.showRequestsView || showRequestsView;
window.showVerificationsView = window.showVerificationsView || showVerificationsView;
window.showLogsView = window.showLogsView || showLogsView;
window.openNotifyModal = window.openNotifyModal || openNotifyModal;
window.submitNotification = window.submitNotification || submitNotification;
window.showReplyModal = window.showReplyModal || showReplyModal;
window.sendReply = window.sendReply || sendReply;
window.deleteRequest = window.deleteRequest || deleteRequest;
window.viewReceipt = window.viewReceipt || viewReceipt;
window.closeReceiptModal = window.closeReceiptModal || closeReceiptModal;
window.closeNotifyModal = window.closeNotifyModal || closeNotifyModal;
window.closeReplyModal = window.closeReplyModal || closeReplyModal;
window.deleteVerification = window.deleteVerification || deleteVerification;
window.logout = window.logout || logout;