// Save this file exactly as: C:\Git\personal\poc\TravelAgentDemo\frontend\app.js

// App State Management
let currentTab = 'flights'; 
let isSalesforceMIAWReady = false;
let queuedPayloadText = null;

// Mock Data Database for UI Simulation
const mockDatabase = {
    flights: [
        { title: "Delta Air Lines / Air France", details: "1-Stop via Paris (CDG). Total trip duration: 11h 20m.", badge: "Best Value", price: "$650", provider: "google-flights" },
        { title: "United Airlines / Swiss", details: "Non-stop Direct Flight. Premium cabin service included.", badge: "Fastest", price: "$980", provider: "google-flights" }
    ],
    hotels: [
        { title: "The Grand Plaza Resort & Spa", details: "5★ Deluxe King Room. Includes free cancellation and breakfast.", badge: "Top Rated", price: "$240 / night", provider: "booking" },
        { title: "Urban Oasis Boutique Hotel", details: "4★ Executive Suite. Located right in the vibrant city center.", badge: "Free Parking", price: "$165 / night", provider: "booking" }
    ],
    rentals: [
        { title: "Modern Waterfront Penthouse", details: "Entire home • 2 Beds • Panoramic private terrace deck view.", badge: "Superhost", price: "$195 / night", provider: "airbnb" },
        { title: "A-Frame Luxury Eco-Cabin", details: "Entire cabin • 1 Bed • Private outdoor wood-fired hot tub.", badge: "Rare Find", price: "$140 / night", provider: "airbnb" }
    ]
};

// Initialize App Views on Page Load
document.addEventListener("DOMContentLoaded", () => {
    // Set default dates to tomorrow and next week for better UX
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 8);

    document.getElementById('date-start').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('date-end').value = nextWeek.toISOString().split('T')[0];
    
    // Load initial trending flights
    renderMockCards('flights', 'New York (JFK)', 'London (LHR)', tomorrow.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]);
});

/**
 * Tab Switcher Function
 */
function switchTab(tabId) {
    currentTab = tabId;
    
    // Toggle active class on UI buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Adjust visibility of the return date input based on context
    const returnGroup = document.getElementById('return-group');
    if (tabId === 'rentals') {
        returnGroup.querySelector('label').innerText = "Check-out";
    } else if (tabId === 'hotels') {
        returnGroup.querySelector('label').innerText = "Check-out";
    } else {
        returnGroup.querySelector('label').innerText = "Return";
    }

    // Update dynamic headings
    const heading = document.getElementById('results-heading');
    const subHeading = document.getElementById('results-subheading');
    
    if (tabId === 'flights') {
        heading.innerText = "Trending Flight Routes";
        subHeading.innerText = "Showing estimated low fares aggregated from Google Flights.";
    } else if (tabId === 'hotels') {
        heading.innerText = "Popular Accommodations";
        subHeading.innerText = "Showing top matching properties from Booking.com.";
    } else {
        heading.innerText = "Bespoke Vacation Rentals";
        subHeading.innerText = "Showing verified unique spaces from Airbnb.";
    }

    // Refresh display view
    const fromVal = document.getElementById('from-location').value || 'Origin';
    const toVal = document.getElementById('to-location').value || 'Destination';
    const start = document.getElementById('date-start').value;
    const end = document.getElementById('date-end').value;
    renderMockCards(tabId, fromVal, toVal, start, end);
}

/**
 * Executes Frontend Aggregator Search Simulation
 */
function executeSearch(event) {
    event.preventDefault();
    
    const fromVal = document.getElementById('from-location').value;
    const toVal = document.getElementById('to-location').value;
    const start = document.getElementById('date-start').value;
    const end = document.getElementById('date-end').value;

    renderMockCards(currentTab, fromVal, toVal, start, end);
    
    // Auto-scroll layout window smoothly down to results view
    document.querySelector('.grid-section').scrollIntoView({ behavior: 'smooth' });

    // Optional pipeline: Alert your Salesforce AI Agentforce chat assistant about the active query parameters
    if (isSalesforceMIAWReady) {
        const syncPrompt = `User is looking for travel options ${currentTab === 'flights' ? 'from ' + fromVal : ''} to ${toVal} starting ${start} to ${end}.`;
        executeAgentforceSequence(syncPrompt);
    }
}

/**
 * Builds and Injects Dynamic UI Result Cards and External Deep Links
 */
function renderMockCards(tabId, from, to, start, end) {
    const grid = document.getElementById('dynamic-results-grid');
    grid.innerHTML = ''; // Clear container view

    const items = mockDatabase[tabId];
    
    items.forEach(item => {
        let externalUrl = '#';
        let emoji = '✈️';

        // Deep link generation engines mapping string schemas
        if (tabId === 'flights') {
            emoji = '🛫';
            externalUrl = `https://google.com{encodeURIComponent(to)}%20from%20${encodeURIComponent(from)}%20on%20${start}%20through%20${end}`;
        } else if (tabId === 'hotels') {
            emoji = '🏨';
            externalUrl = `https://booking.com{encodeURIComponent(to)}&checkin=${start}&checkout=${end}`;
        } else if (tabId === 'rentals') {
            emoji = '🏡';
            externalUrl = `https://airbnb.com{encodeURIComponent(to)}/homes?checkin=${start}&checkout=${end}`;
        }

        const card = document.createElement('div');
        card.className = 'luxury-card';
        card.innerHTML = `
            <div class="card-badge">${item.badge}</div>
            <div class="card-image-placeholder">${emoji}</div>
            <div class="card-body">
                <h4>${item.title}</h4>
                <p class="card-text">${item.details}</p>
                <div class="inclusion-pills">
                    <span class="pill">📍 ${to}</span>
                    <span class="pill">📅 ${start}</span>
                </div>
                <div class="price-row">
                    <div class="price-block">
                        <span class="price-label">Est. Rate</span>
                        <span class="price-val">${item.price}</span>
                    </div>
                    <a href="${externalUrl}" target="_blank" class="btn-secondary" onclick="trackOutboundClick('${item.provider}')">
                        Book Live Deal ↗
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function trackOutboundClick(provider) {
    console.log(`➡️ Outbound traffic redirect handed off to: ${provider}`);
}

// ============================================================================
// SALESFORCE AGENTFORCE CONCIERGE INTEGRATION ENGINE
// ============================================================================
window.addEventListener("onEmbeddedMessagingReady", () => {
    console.log("✅ Salesforce Enhanced Web Chat Core APIs are fully loaded and operational.");
    isSalesforceMIAWReady = true;

    if (queuedPayloadText) {
        executeAgentforceSequence(queuedPayloadText);
        queuedPayloadText = null;
    }
});

function executeAgentforceSequence(textPayload) {
    try {
        if (window.embeddedservice_bootstrap && embeddedservice_bootstrap.utilAPI) {
            embeddedservice_bootstrap.utilAPI.launchChat();
            setTimeout(() => {
                embeddedservice_bootstrap.utilAPI.sendTextMessage(textPayload);
                console.log("🚀 Payload passed directly into the active Agentforce conversational stream.");
            }, 600);
        }
    } catch (error) {
        console.error("Salesforce Web API execution failure: ", error);
    }
}
