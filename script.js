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

