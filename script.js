// Global variables
let map;
let pickupMarker;
let dropoffMarker;
let droneMarker;
let routeLine;
let selectedDrone = {
    name: 'Standard Drone',
    capacity: '5kg',
    range: '10km',
    price: '₹500'
};
let orderDetails = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('booking.html')) {
        initBookingPage();
    } else if (window.location.pathname.includes('tracking.html')) {
        initTrackingPage();
    } else {
        setupAuthForms();
    }
});

// Initialize booking page
function initBookingPage() {
    initMap();
    setupAutocomplete();
    setupDroneSelection();
    setupNavigation();
    loadSavedLocations();
    
    // Load selected drone if exists
    const savedDrone = localStorage.getItem('selectedDrone');
    if (savedDrone) {
        selectedDrone = JSON.parse(savedDrone);
        const droneType = getDroneType(selectedDrone.name);
        const card = document.querySelector(`.drone-card[data-type="${droneType}"]`);
        if (card) {
            card.classList.add('selected');
            card.querySelector('.select-btn').textContent = 'Selected';
        }
    }
}

// Initialize tracking page
function initTrackingPage() {
    // Load order details from localStorage
    const savedOrder = localStorage.getItem('orderDetails');
    if (!savedOrder) {
        showError('No active order found');
        setTimeout(() => {
            window.location.href = 'booking.html';
        }, 2000);
        return;
    }

    const orderDetails = JSON.parse(savedOrder);
    
    // Update drone details
    document.getElementById('drone-name').textContent = orderDetails.drone.name;
    document.getElementById('drone-capacity').textContent = `Capacity: ${orderDetails.drone.capacity}`;
    document.getElementById('drone-range').textContent = `Range: ${orderDetails.drone.range}`;
    document.getElementById('drone-price').textContent = orderDetails.drone.price;
    
    // Initialize map centered on Hyderabad
    map = L.map('map').setView([17.3850, 78.4867], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize markers with the saved locations
    const pickupLatLng = [orderDetails.pickup.location.lat, orderDetails.pickup.location.lng];
    const dropoffLatLng = [orderDetails.dropoff.location.lat, orderDetails.dropoff.location.lng];

    // Add pickup marker
    pickupMarker = L.marker(pickupLatLng, {
        icon: L.divIcon({
            className: 'pickup-marker',
            html: '<div class="marker pickup"></div>',
            iconSize: [30, 30]
        })
    }).addTo(map);

    // Add dropoff marker
    dropoffMarker = L.marker(dropoffLatLng, {
        icon: L.divIcon({
            className: 'dropoff-marker',
            html: '<div class="marker dropoff"></div>',
            iconSize: [30, 30]
        })
    }).addTo(map);

    // Add route line
    routeLine = L.polyline([pickupLatLng, dropoffLatLng], {
        color: '#4CAF50',
        weight: 3,
        opacity: 0.7
    }).addTo(map);

    // Fit map to show both markers
    map.fitBounds([pickupLatLng, dropoffLatLng]);
    
    // Start tracking simulation
    startTrackingSimulation();
}

// Initialize login page
function initLoginPage() {
    setupNavigation();
    setupAuthForms();
}

// Setup navigation
function setupNavigation() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutBtn = document.querySelector('.logout-btn');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = link.getAttribute('href');
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('orderDetails');
            window.location.href = 'index.html';
        });
    }
}

// Initialize map
function initMap() {
    // Initialize map centered on Hyderabad
    map = L.map('map').setView([17.3850, 78.4867], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize markers
    pickupMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'pickup-marker',
            html: '<div class="marker pickup"></div>',
            iconSize: [30, 30]
        })
    });

    dropoffMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'dropoff-marker',
            html: '<div class="marker dropoff"></div>',
            iconSize: [30, 30]
        })
    });

    droneMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'drone-marker',
            html: '<div class="marker drone"></div>',
            iconSize: [30, 30]
        })
    });

    // Initialize route line
    routeLine = L.polyline([], {
        color: '#4CAF50',
        weight: 3,
        opacity: 0.7
    }).addTo(map);

    // Add event listeners for location inputs
    const pickupInput = document.getElementById('pickup-location');
    const dropoffInput = document.getElementById('dropoff-location');

    pickupInput.addEventListener('change', async () => {
        const location = await geocodeAddress(pickupInput.value);
        if (location) {
            updatePickupLocation(location.lat, location.lng);
        }
    });

    dropoffInput.addEventListener('change', async () => {
        const location = await geocodeAddress(dropoffInput.value);
        if (location) {
            updateDropoffLocation(location.lat, location.lng);
        }
    });
}

// Setup autocomplete for location inputs
function setupAutocomplete() {
    const pickupInput = document.getElementById('pickup-location');
    const dropoffInput = document.getElementById('dropoff-location');

    // Add event listeners for location inputs
    pickupInput.addEventListener('change', async () => {
        const location = await geocodeAddress(pickupInput.value);
        if (location) {
            updatePickupLocation(location.lat, location.lng);
        }
    });
    
    dropoffInput.addEventListener('change', async () => {
        const location = await geocodeAddress(dropoffInput.value);
        if (location) {
            updateDropoffLocation(location.lat, location.lng);
        }
    });
}

// Update pickup location
function updatePickupLocation(lat, lng) {
    pickupMarker.setLatLng([lat, lng]);
    pickupMarker.addTo(map);
    updateRoute();
}

// Update dropoff location
function updateDropoffLocation(lat, lng) {
    dropoffMarker.setLatLng([lat, lng]);
    dropoffMarker.addTo(map);
    updateRoute();
}

// Update drone location
function updateDroneLocation(lat, lng) {
    droneMarker.setLatLng([lat, lng]);
    droneMarker.addTo(map);
}

// Update route line
function updateRoute() {
    if (pickupMarker.getLatLng().lat !== 0 && dropoffMarker.getLatLng().lat !== 0) {
        const route = [
            pickupMarker.getLatLng(),
            dropoffMarker.getLatLng()
        ];
        routeLine.setLatLngs(route);
        map.fitBounds(route);
    }
}

// Geocode address using OpenStreetMap Nominatim
async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Setup drone selection
function setupDroneSelection() {
    const droneCards = document.querySelectorAll('.drone-card');
    const bookBtn = document.querySelector('.book-btn');

    droneCards.forEach(card => {
        const selectBtn = card.querySelector('.select-btn');
        
        selectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove selected class from all cards
            droneCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            card.classList.add('selected');
            
            // Update select button text
            droneCards.forEach(c => {
                c.querySelector('.select-btn').textContent = 'Select';
            });
            selectBtn.textContent = 'Selected';
            
            // Update selected drone details
            const droneType = card.getAttribute('data-type');
            selectDrone(droneType);
        });
    });

    // Add click event to book button
    if (bookBtn) {
        bookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            placeOrder();
        });
    }
}

// Select drone
function selectDrone(droneType) {
    // Update selected drone details based on type
    switch (droneType) {
        case 'standard':
            selectedDrone = {
                name: 'Standard Drone',
                capacity: '5kg',
                range: '10km',
                price: '₹500'
            };
            break;
        case 'premium':
            selectedDrone = {
                name: 'Premium Drone',
                capacity: '10kg',
                range: '20km',
                price: '₹1000'
            };
            break;
        case 'express':
            selectedDrone = {
                name: 'Express Drone',
                capacity: '3kg',
                range: '15km',
                price: '₹800'
            };
            break;
    }

    // Update book button text
    const bookBtn = document.querySelector('.book-btn');
    if (bookBtn) {
        bookBtn.textContent = `Book Now - ${selectedDrone.price}`;
    }

    // Save selection to localStorage
    localStorage.setItem('selectedDrone', JSON.stringify(selectedDrone));
}

// Place order
function placeOrder() {
    // Check if locations are selected
    if (!pickupMarker || !dropoffMarker) {
        showError('Please select both pickup and dropoff locations');
        return;
    }

    // Check if a drone is selected
    const selectedDroneCard = document.querySelector('.drone-card.selected');
    if (!selectedDroneCard) {
        showError('Please select a drone type');
        return;
    }

    // Create order details
    const orderDetails = {
        pickup: {
            address: document.getElementById('pickup-location').value,
            location: pickupMarker.getLatLng()
        },
        dropoff: {
            address: document.getElementById('dropoff-location').value,
            location: dropoffMarker.getLatLng()
        },
        drone: selectedDrone,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Save order details to localStorage
    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));

    // Show success popup
    showSuccessPopup();

    // Redirect to tracking page after delay
    setTimeout(() => {
        window.location.href = 'tracking.html';
    }, 3000);
}

// Show success popup
function showSuccessPopup() {
    const popup = document.querySelector('.success-popup');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    if (popup) {
        popup.classList.add('active');
        overlay.classList.add('active');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Load saved locations
function loadSavedLocations() {
    const savedLocations = localStorage.getItem('locations');
    if (savedLocations) {
        const locations = JSON.parse(savedLocations);
        document.getElementById('pickup-location').value = locations.pickup || '';
        document.getElementById('dropoff-location').value = locations.dropoff || '';
    }
}

// Save locations
function saveLocations() {
    const locations = {
        pickup: document.getElementById('pickup-location').value,
        dropoff: document.getElementById('dropoff-location').value
    };
    localStorage.setItem('locations', JSON.stringify(locations));
}

// Load order details
function loadOrderDetails() {
    const savedOrder = localStorage.getItem('orderDetails');
    if (!savedOrder) {
        window.location.href = 'booking.html';
        return;
    }

    orderDetails = JSON.parse(savedOrder);
    updateTrackingUI();
}

// Update tracking UI
function updateTrackingUI() {
    if (!orderDetails) return;

    // Update drone details
    document.getElementById('drone-name').textContent = orderDetails.drone.name;
    document.getElementById('drone-capacity').textContent = orderDetails.drone.capacity;
    document.getElementById('drone-range').textContent = orderDetails.drone.range;
    document.getElementById('drone-price').textContent = orderDetails.drone.price;

    // Update order time
    const orderTime = new Date(orderDetails.timestamp);
    document.getElementById('order-time').textContent = orderTime.toLocaleString();

    // Set pickup and dropoff markers
    updatePickupLocation(orderDetails.pickup.location.lat, orderDetails.pickup.location.lng);
    updateDropoffLocation(orderDetails.dropoff.location.lat, orderDetails.dropoff.location.lng);
}

// Start tracking simulation
function startTrackingSimulation() {
    let progress = 0;
    const totalSteps = 100;
    const interval = 100; // milliseconds per step
    const duration = 30; // seconds for total delivery

    // Calculate step size based on duration
    const stepSize = 100 / (duration * 1000 / interval);

    // Initialize drone marker
    droneMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'drone-marker',
            html: '<div class="marker drone"></div>',
            iconSize: [40, 40]
        })
    }).addTo(map);

    const simulation = setInterval(() => {
        if (progress >= 100) {
            clearInterval(simulation);
            updateStatus('completed');
            return;
        }

        progress += stepSize;
        if (progress > 100) progress = 100;

        // Update drone position
        const pickup = orderDetails.pickup.location;
        const dropoff = orderDetails.dropoff.location;
        
        const currentLat = pickup.lat + (dropoff.lat - pickup.lat) * (progress / 100);
        const currentLng = pickup.lng + (dropoff.lng - pickup.lng) * (progress / 100);
        
        droneMarker.setLatLng([currentLat, currentLng]);
        
        // Update stats
        updateDroneStats(progress);
        
        // Update status based on progress
        if (progress < 30) {
            updateStatus('pending');
        } else if (progress < 100) {
            updateStatus('in-progress');
        }
    }, interval);
}

// Update drone stats
function updateDroneStats(progress) {
    // Update distance
    const distance = calculateDistance(
        orderDetails.pickup.location,
        orderDetails.dropoff.location
    );
    const remainingDistance = distance * (1 - progress / 100);
    document.getElementById('distance').textContent = `${Math.round(remainingDistance)} km`;

    // Update speed (simulated)
    const speed = 40 + Math.sin(progress / 10) * 10;
    document.getElementById('speed').textContent = `${Math.round(speed)} km/h`;

    // Update battery (simulated)
    const battery = 100 - (progress * 0.8);
    document.getElementById('battery').textContent = `${Math.round(battery)}%`;

    // Update altitude (simulated)
    const altitude = 100 + Math.sin(progress / 20) * 20;
    document.getElementById('altitude').textContent = `${Math.round(altitude)} m`;
}

function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update status
function updateStatus(status) {
    const statusItems = document.querySelectorAll('.status-item');
    
    statusItems.forEach(item => {
        const itemStatus = item.getAttribute('data-status');
        
        if (itemStatus === status) {
            item.classList.add('active');
        } else if (
            (status === 'in-progress' && itemStatus === 'pending') ||
            (status === 'completed' && (itemStatus === 'pending' || itemStatus === 'in-progress'))
        ) {
            item.classList.add('completed');
        }
    });

    // Update order status in localStorage
    if (orderDetails) {
        orderDetails.status = status;
        localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
    }
}

// Setup authentication forms
function setupAuthForms() {
    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');
    const tabs = document.querySelectorAll('.tab-btn');

    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = 'booking.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            handleLogin(email, password);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = signupForm.querySelector('input[type="text"]').value;
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = signupForm.querySelector('input[type="password"]').value;
            handleSignup(name, email, password);
        });
    }

    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                switchTab(target);
            });
        });
    }
}

// Handle login
function handleLogin(email, password) {
    // Simple validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Store current user
        localStorage.setItem('user', JSON.stringify({ name: user.name, email: user.email }));
        showSuccess('Login successful!');
        setTimeout(() => {
            window.location.href = 'booking.html';
        }, 1000);
    } else {
        showError('Invalid email or password');
    }
}

// Handle signup
function handleSignup(name, email, password) {
    // Simple validation
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if email already exists
    if (users.some(user => user.email === email)) {
        showError('Email already registered');
        return;
    }

    // Add new user
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Store current user
    localStorage.setItem('user', JSON.stringify({ name, email }));
    showSuccess('Account created successfully!');
    setTimeout(() => {
        window.location.href = 'booking.html';
    }, 1000);
}

// Switch tab
function switchTab(target) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        if (tab.getAttribute('data-target') === target) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    forms.forEach(form => {
        if (form.id === target) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Helper function to get drone type from name
function getDroneType(name) {
    switch (name) {
        case 'Standard Drone':
            return 'standard';
        case 'Premium Drone':
            return 'premium';
        case 'Express Drone':
            return 'express';
        default:
            return 'standard';
    }
} 