const btn = document.getElementById("btn");

// Create modal HTML
const modalHTML = `
    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Request Form</h2>
            <form id="requestForm">
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" placeholder="Enter your name/alias" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="message">Message:</label>
                    <textarea id="message" name="message" rows="5" placeholder="Describe what you're looking for in complete detail. Be specific as much as possible" required></textarea>
                </div>
                <button type="submit" class="submit-btn">Submit Request</button>
            </form>
        </div>
    </div>
`;

// Insert modal into the page
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Get modal elements
const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("requestForm");

// Show modal when button is clicked
btn.addEventListener("click", () => {
    modal.style.display = "block";
});

// Close modal when X is clicked
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Handle form submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    
    try {
        // Submit to backend API
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, message })
        });

        if (!response.ok) {
            throw new Error('Failed to submit request');
        }

        const result = await response.json();
        console.log("Form submitted:", result);
        
        // Close modal after submission
        modal.style.display = "none";
        
        // Reset form
        form.reset();
        
        // Show success message
        alert("Request submitted successfully!");
        
    } catch (error) {
        console.error('Error submitting request:', error);
        alert("Failed to submit request. Please try again.");
    }
});


// Guidelines modal
const guidelinesBtn = document.getElementById("guidelinesBtn");
if (guidelinesBtn) {
    guidelinesBtn.addEventListener("click", openGuidelinesModal);
}

function openGuidelinesModal() {
    const modalId = "guidelinesModal";
    if (document.getElementById(modalId)) return;
    const modalHTML = `
    <div id="guidelinesModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="guidelinesTitle">
        <div class="modal-content">
            <span class="close" id="guidelinesClose">&times;</span>
            <h2 id="guidelinesTitle">Guidelines [Read first!]</h2>
            <pre id="guidelinesText" style="white-space: pre-wrap; font-family: novecento; font-size: 1.4rem; color: var(--primary-color); background: rgba(255,255,255,0.9); border: 2px solid var(--secondary-color); border-radius: 8px; padding: 12px; margin-top: 10px;"></pre>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById("guidelinesModal");
    const closeBtn = document.getElementById("guidelinesClose");
    const textEl = document.getElementById("guidelinesText");

    if (overlay) overlay.style.display = "block";

    const guidelinesText = `Sunseeker is a platform where you can request me, the seeker to do the resource searching for you. As of now, my service is for academic materials only in order to help students with their studies and research

1. Click the "Request" button to start

2. Fill out the provided form with your desired alias, your email address, and what you're requesting. Be as specific as possible with your request details.

3. Price for the service starts at ₱50.00 and can go up to ₱1000(unlikely to reach this price but the possibility still exists.) depending on the request

4. After submitting your request, please wait for a notification from the seeker. They will confirm whether they were able to find what you're requesting and send you a gcash QR code for you to send your payment on.

5. Within the notification link, there is a verification link you can use to verify your payment by sending us the transaction reference and a screenshot of the e-receipt.

6. After the seeker verifies your payment, they will send a link through email shortly to a downloadable file.`;
    if (textEl) textEl.textContent = guidelinesText;

    function onOverlayClick(e) {
        if (e.target === overlay) closeGuidelinesModal();
    }
    function onKeyDown(e) {
        if (e.key === 'Escape') closeGuidelinesModal();
    }
    if (overlay) overlay.addEventListener('click', onOverlayClick);
    if (closeBtn) closeBtn.addEventListener('click', closeGuidelinesModal);
    document.addEventListener('keydown', onKeyDown, { once: true });

    function closeGuidelinesModal() {
        const el = document.getElementById("guidelinesModal");
        if (el) el.remove();
    }
}
