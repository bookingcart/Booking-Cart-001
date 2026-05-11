function bookingsAuthHeaders() {
            const t = localStorage.getItem('bookingcart_google_id_token') || localStorage.getItem('bookingcart_jwt_token') || '';
            const h = { 'Content-Type': 'application/json' };
            if (t) h.Authorization = 'Bearer ' + t;
            return h;
        }

        let allBookings = [];
        let currentTab = 'all';
        let legacyMigrationDone = false;

        const emailInput = document.getElementById('lookup-email');
        const lookupBtn = document.getElementById('lookup-btn');
        const loadingEl = document.getElementById('loading');
        const emptyEl = document.getElementById('empty-state');
        const listEl = document.getElementById('bookings-list');
        const countEl = document.getElementById('booking-count');

        // Saved Flights functionality
        const SAVED_FLIGHTS_KEY = 'bookingcart_saved_flights';

        function getSavedFlights() {
            try {
                return JSON.parse(localStorage.getItem(SAVED_FLIGHTS_KEY)) || [];
            } catch (e) {
                return [];
            }
        }

        function renderSavedFlights() {
            const savedContainer = document.getElementById('saved-flights-list');
            const savedSection = document.getElementById('saved-flights-section');
            const bookingsList = document.getElementById('bookings-list');

            if (!savedContainer) return;

            const saved = getSavedFlights();

            // Hide bookings list, show saved section
            if (bookingsList) bookingsList.classList.add('hidden');
            if (savedSection) savedSection.classList.remove('hidden');

            if (saved.length === 0) {
                savedContainer.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-2xl border border-slate-200">
                        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="ph ph-heart text-2xl text-slate-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-700 mb-1">No saved flights</h3>
                        <p class="text-sm text-slate-400 mb-6">Save flights for later to compare and book them anytime.</p>
                        <a href="/" class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
                            <i class="ph ph-magnifying-glass"></i> Search Flights
                        </a>
                    </div>
                `;
                return;
            }

            savedContainer.innerHTML = saved.map(f => `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                ${f.airline?.logo ? `<img src="${f.airline.logo}" alt="" class="w-8 h-8 object-contain">` : ''}
                                <div>
                                    <div class="font-bold text-slate-900">${f.airline?.name || 'Airline'}</div>
                                    <div class="text-sm text-slate-500">${f.flightNumber || ''}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 mt-3">
                                <div class="text-center">
                                    <div class="font-bold text-lg text-slate-900">${f.departTime || '--:--'}</div>
                                    <div class="text-sm text-slate-500">${f.origin || 'Origin'}</div>
                                </div>
                                <div class="flex-1 flex items-center justify-center">
                                    <div class="border-t border-slate-300 flex-1"></div>
                                    <i class="ph ph-airplane text-slate-400 mx-2"></i>
                                    <div class="border-t border-slate-300 flex-1"></div>
                                </div>
                                <div class="text-center">
                                    <div class="font-bold text-lg text-slate-900">${f.arriveTime || '--:--'}</div>
                                    <div class="text-sm text-slate-500">${f.destination || 'Destination'}</div>
                                </div>
                            </div>
                            <div class="mt-3 text-sm text-slate-500">
                                <i class="ph ph-calendar mr-1"></i> Saved on ${new Date(f.savedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="w-full md:w-48 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 flex flex-col justify-center items-end">
                            <div class="text-2xl font-bold text-green-600">$${f.price?.amount || f.price || '0.00'}</div>
                            <div class="text-xs text-slate-400 mb-3">per adult</div>
                            <a href="/details?flight=${encodeURIComponent(f.id)}" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded text-sm w-full text-center transition-colors mb-2">
                                Select
                            </a>
                            <button onclick="removeSavedFlightAndRefresh('${f.id}')" class="text-slate-500 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                                <i class="ph ph-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        window.removeSavedFlightAndRefresh = function(flightId) {
            const saved = getSavedFlights();
            const filtered = saved.filter(f => f.id !== flightId);
            localStorage.setItem(SAVED_FLIGHTS_KEY, JSON.stringify(filtered));
            renderSavedFlights();
            showToast('Flight removed from saved', 'success');
        };

        // Check if user is signed in
        const userStr = localStorage.getItem('bookingcart_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                document.getElementById('user-name').textContent = user.name || 'User';
                document.getElementById('user-email').textContent = user.email || '';
                const avatar = document.querySelector('#sidebar-user .w-10');
                if (avatar && user.picture) {
                    avatar.innerHTML = `<img src="${user.picture}" class="w-full h-full object-cover rounded-full" />`;
                }
                // Auto-lookup by email
                emailInput.value = user.email || '';
                if (user.email) {
                    setTimeout(() => {
                        const hasToken = localStorage.getItem('bookingcart_google_id_token') || localStorage.getItem('bookingcart_jwt_token');
                        if (hasToken) lookup();
                    }, 600);
                }
            } catch (e) { }
        }

        async function migrateLegacyBookings() {
            if (legacyMigrationDone) return;

            let localBookings = [];
            try {
                localBookings = JSON.parse(localStorage.getItem('bc_saved_bookings') || '[]');
            } catch (e) { }

            if (!localBookings.length) return;

            let allMigrated = true;

            for (const booking of localBookings) {
                try {
                    const resp = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'save', booking })
                    });
                    if (!resp.ok) allMigrated = false;
                } catch (e) {
                    allMigrated = false;
                    console.warn('Legacy booking migration failed for ref:', booking && booking.ref, e);
                }
            }

            if (allMigrated) {
                try {
                    localStorage.removeItem('bc_saved_bookings');
                    legacyMigrationDone = true;
                } catch (e) { }
            }
        }

        // Events
        lookupBtn.addEventListener('click', lookup);
        emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(); });

        // Tabs
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTab = btn.dataset.tab;
                document.querySelectorAll('[data-tab]').forEach(b => {
                    b.className = b.dataset.tab === currentTab
                        ? 'tab-active flex-1 py-2.5 rounded-xl text-sm font-bold transition-all'
                        : 'flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all';
                });
                renderBookings(currentTab);
            });
        });

        async function lookup() {
            let email = emailInput.value.trim();
            const token = localStorage.getItem('bookingcart_google_id_token') || localStorage.getItem('bookingcart_jwt_token') || '';
            const loadingUi = window.bookingcartLoading;

            await migrateLegacyBookings();

            if (!email) {
                try {
                    const u = JSON.parse(localStorage.getItem('bookingcart_user') || 'null');
                    if (u && u.email) {
                        email = u.email;
                        emailInput.value = email;
                    }
                } catch (e) { }
            }

            if (!email) {
                emptyEl.style.display = 'block'; listEl.innerHTML = '';
                return;
            }

            if (!token) {
                alert('Please sign in with Google to view bookings linked to your email.');
                return;
            }

            loadingEl.style.display = 'none';
            emptyEl.style.display = 'none';
            if (loadingUi && typeof loadingUi.renderSkeletons === 'function') {
                loadingUi.renderSkeletons(listEl, 'booking', 3);
            } else {
                listEl.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const sk = document.createElement('div');
                    sk.className = 'skeleton';
                    listEl.appendChild(sk);
                }
            }

            try {
                const resp = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: bookingsAuthHeaders(),
                    body: JSON.stringify({ action: 'lookup', email })
                });
                const data = await resp.json();

                loadingEl.style.display = 'none';
                if (loadingUi && typeof loadingUi.setBusy === 'function') {
                    loadingUi.setBusy(listEl, false);
                }
                allBookings = data.ok ? (data.bookings || []) : [];

                renderBookings();
                checkForIssuedTickets();
            } catch (err) {
                loadingEl.style.display = 'none';
                if (loadingUi && typeof loadingUi.setBusy === 'function') {
                    loadingUi.setBusy(listEl, false);
                }

                allBookings = [];
                emptyEl.style.display = 'block';
                listEl.innerHTML = '';
            }
        }

        async function checkForIssuedTickets() {
            let updated = false;
            for (let i = 0; i < allBookings.length; i++) {
                const b = allBookings[i];
                if (b.status === 'confirmed' && b.duffelOrderId) {
                    try {
                        const r = await fetch(`/api/duffel-orders?id=${b.duffelOrderId}`);
                        const d = await r.json();
                        if (d.ok && d.order && Array.isArray(d.order.documents) && d.order.documents.length > 0) {
                            const eTicket = d.order.documents.find(doc => doc.type === 'e_ticket_receipt') || d.order.documents[0];
                            if (eTicket && eTicket.url) {
                                b.status = 'issued';
                                b.ticket = b.ticket || {};
                                b.ticket.fileData = eTicket.url;
                                b.ticket.fileName = `ticket-${b.ref}.pdf`;
                                updated = true;
                                
                                await fetch('/api/bookings', {
                                    method: 'POST',
                                    headers: bookingsAuthHeaders(),
                                    body: JSON.stringify({
                                        action: 'save',
                                        booking: {
                                            ref: b.ref,
                                            status: 'issued',
                                            ticket: b.ticket
                                        }
                                    })
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Failed to fetch on-demand ticket for', b.ref, e);
                    }
                }
            }
            if (updated) renderBookings();
        }

        // Saved Flights functionality
        const SAVED_FLIGHTS_KEY = 'bookingcart_saved_flights';

        function getSavedFlights() {
            try {
                return JSON.parse(localStorage.getItem(SAVED_FLIGHTS_KEY)) || [];
            } catch (e) {
                return [];
            }
        }

        function renderSavedFlights() {
            const savedContainer = document.getElementById('saved-flights-list');
            const savedSection = document.getElementById('saved-flights-section');
            const bookingsList = document.getElementById('bookings-list');

            if (!savedContainer) return;

            const saved = getSavedFlights();

            // Hide bookings list, show saved section
            if (bookingsList) bookingsList.classList.add('hidden');
            if (savedSection) savedSection.classList.remove('hidden');

            if (saved.length === 0) {
                savedContainer.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-2xl border border-slate-200">
                        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="ph ph-heart text-2xl text-slate-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-700 mb-1">No saved flights</h3>
                        <p class="text-sm text-slate-400 mb-6">Save flights for later to compare and book them anytime.</p>
                        <a href="/" class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
                            <i class="ph ph-magnifying-glass"></i> Search Flights
                        </a>
                    </div>
                `;
                return;
            }

            savedContainer.innerHTML = saved.map(f => `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                ${f.airline?.logo ? `<img src="${f.airline.logo}" alt="" class="w-8 h-8 object-contain">` : ''}
                                <div>
                                    <div class="font-bold text-slate-900">${f.airline?.name || 'Airline'}</div>
                                    <div class="text-sm text-slate-500">${f.flightNumber || ''}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 mt-3">
                                <div class="text-center">
                                    <div class="font-bold text-lg text-slate-900">${f.departTime || '--:--'}</div>
                                    <div class="text-sm text-slate-500">${f.origin || 'Origin'}</div>
                                </div>
                                <div class="flex-1 flex items-center justify-center">
                                    <div class="border-t border-slate-300 flex-1"></div>
                                    <i class="ph ph-airplane text-slate-400 mx-2"></i>
                                    <div class="border-t border-slate-300 flex-1"></div>
                                </div>
                                <div class="text-center">
                                    <div class="font-bold text-lg text-slate-900">${f.arriveTime || '--:--'}</div>
                                    <div class="text-sm text-slate-500">${f.destination || 'Destination'}</div>
                                </div>
                            </div>
                            <div class="mt-3 text-sm text-slate-500">
                                <i class="ph ph-calendar mr-1"></i> Saved on ${new Date(f.savedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="w-full md:w-48 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 flex flex-col justify-center items-end">
                            <div class="text-2xl font-bold text-green-600">$${f.price?.amount || f.price || '0.00'}</div>
                            <div class="text-xs text-slate-400 mb-3">per adult</div>
                            <a href="/details?flight=${encodeURIComponent(f.id)}" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded text-sm w-full text-center transition-colors mb-2">
                                Select
                            </a>
                            <button onclick="removeSavedFlightAndRefresh('${f.id}')" class="text-slate-500 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                                <i class="ph ph-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        window.removeSavedFlightAndRefresh = function(flightId) {
            const saved = getSavedFlights();
            const filtered = saved.filter(f => f.id !== flightId);
            localStorage.setItem(SAVED_FLIGHTS_KEY, JSON.stringify(filtered));
            renderSavedFlights();
            if (window.showToast) window.showToast('Flight removed from saved', 'success');
        };

        // Render bookings
        function renderBookings(filter = 'all') {
            const container = document.getElementById('bookings-list');
            const savedSection = document.getElementById('saved-flights-section');

            if (!container) return;

            // Hide saved section, show bookings list
            if (savedSection) savedSection.classList.add('hidden');
            container.classList.remove('hidden');

            // Handle saved flights tab
            if (filter === 'saved') {
                renderSavedFlights();
                return;
            }

            let bookingsToRender = [];
            if (filter === 'all') {
                bookingsToRender = allBookings;
            } else if (filter === 'new') {
                bookingsToRender = allBookings.filter(b => b.status === 'new' || b.status === 'pending' || !b.status);
            } else if (filter === 'confirmed') {
                bookingsToRender = allBookings.filter(b => b.status === 'confirmed' || b.status === 'paid');
            } else if (filter === 'cancelled') {
                bookingsToRender = allBookings.filter(b => b.status === 'cancelled');
            }

            container.innerHTML = '';block';
                if (loadingUi && typeof loadingUi.setBusy === 'function') {
                    loadingUi.setBusy(listEl, false);
                }
                return;
            }
            countEl.textContent = bookingsToRender.length + ' booking' + (bookingsToRender.length !== 1 ? 's' : '');

            if (!bookingsToRender.length) {
                container.innerHTML = '';
                emptyEl.style.display = 'block';
                if (loadingUi && typeof loadingUi.setBusy === 'function') {
                    loadingUi.setBusy(listEl, false);
                }
                return;
            }
            emptyEl.style.display = 'none';
            if (loadingUi && typeof loadingUi.setBusy === 'function') {
                loadingUi.setBusy(listEl, false);
            }

            listEl.innerHTML = filtered.map(b => {
                const statusMap = {
                    held: { label: 'Payment Required', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                    new: { label: 'Processing', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                    confirmed: { label: 'Pending Upload', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                    issued: { label: 'Ticket Issued', color: 'text-green-600 bg-green-50 border-green-200' },
                    cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50 border-red-200' }
                };
                const st = statusMap[b.status] || statusMap.new;
                const route = b.route || '—';
                const parts = route.split(' → ');
                const from = parts[0] || '—';
                const to = parts[1] || '—';
                const flight = b.flight || {};
                const times = (flight.time || '').split(' → ');
                const departTime = times[0] || '';
                const arriveTime = times[1] || '';
                const dates = b.dates || '';
                const dateParts = dates.split(' → ');
                const departDate = dateParts[0] || '';
                const returnDate = dateParts[1] || '';
                const total = b.total ? ('$' + Number(b.total).toLocaleString(undefined, { minimumFractionDigits: 2 })) : '—';
                const paxCount = (b.passengers && b.passengers.length) || 1;
                const paxName = (b.passengers && b.passengers[0]) ? ((b.passengers[0].firstName || '') + ' ' + (b.passengers[0].lastName || '')).trim().toUpperCase() : (b.contact && b.contact.email ? b.contact.email.split('@')[0].toUpperCase() : 'PASSENGER');

                return `
        <div class="booking-card bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <!-- Booking Header -->
          <div class="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div class="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span class="flex items-center gap-1.5">
                <i class="ph ph-airplane-tilt text-base"></i>
                Booking No. <span class="font-bold text-slate-700">${b.ref || '—'}</span>
              </span>
              <span>Booking Date: ${b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold border ${st.color}">${st.label}</span>
          </div>

          <!-- Flight Card -->
          <div class="p-6">
            <div class="flex items-start gap-6">
              <!-- Route Header -->
              <div class="flex-1">
                <h3 class="text-lg font-extrabold text-slate-900 mb-4">${from} → ${to}</h3>

                <!-- Timeline Row -->
                <div class="flex items-center gap-4">
                  <!-- Depart -->
                  <div class="text-center">
                    <div class="text-xl font-extrabold text-slate-900">${departTime || '—'}</div>
                    <div class="text-xs text-slate-400 font-medium mt-0.5">${departDate}</div>
                  </div>

                  <!-- Timeline -->
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="timeline-line w-full"></div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-400">
                      <i class="ph ph-airplane text-sm"></i>
                    </div>
                  </div>

                  <!-- Arrive -->
                  <div class="text-center">
                    <div class="text-xl font-extrabold text-slate-900">${arriveTime || '—'}</div>
                    <div class="text-xs text-slate-400 font-medium mt-0.5">${returnDate || departDate}</div>
                  </div>

                  <!-- Airline -->
                  <div class="ml-6 pl-6 border-l border-slate-100">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <i class="ph ph-airplane text-sm text-slate-500"></i>
                      </div>
                      <div>
                        <div class="text-sm font-bold text-slate-700">${flight.airline || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Passenger -->
                  <div class="ml-4 pl-4 border-l border-slate-100">
                    <div class="text-sm font-bold text-slate-700">${paxName}</div>
                    <div class="text-xs text-slate-400">${paxCount} passenger${paxCount > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>

              <!-- Price & Actions -->
              <div class="text-right pl-6 border-l border-slate-100 flex flex-col justify-between items-end">
                <div class="text-xl font-extrabold text-green-600">${total}</div>
                <div class="flex flex-col gap-2 mt-6">
                  ${(b.status === 'held') ? `<button onclick="payForBooking('${b.ref}')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shadow-green-600/20"><i class="ph-bold ph-credit-card"></i> Pay Now</button>` : ''}
                  ${(b.status === 'issued') ? `<button onclick="downloadRealTicket('${b.ref}')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shadow-green-600/20"><i class="ph-bold ph-download"></i> Download E-Ticket</button>` : (b.status !== 'cancelled' && b.status !== 'held' ? `<div class="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2"><i class="ph-bold ph-circle-notch animate-spin"></i> Ticket Processing...</div>` : '')}
                  ${b.status !== 'cancelled' ? `<button onclick="downloadTicket('${b.ref}')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><i class="ph-bold ph-receipt"></i> Download Invoice</button>` : ''}
                  ${(b.status !== 'cancelled' && b.status !== 'held' && b.duffelOrderId) ? `<button onclick="addServicesToBooking('${b.ref}')" class="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><i class="ph-bold ph-suitcase-rolling"></i> Add Bags/Seats</button>` : ''}
                  ${(b.status !== 'cancelled' && b.status !== 'held' && b.duffelOrderId) ? `<button onclick="changeBooking('${b.ref}')" class="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><i class="ph-bold ph-calendar-blank"></i> Change Flight</button>` : ''}
                  <button onclick="cancelBooking('${b.ref}')" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><i class="ph-bold ph-x-circle"></i> Cancel Booking</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
            }).join('');
        }

        async function payForBooking(ref) {
            const b = allBookings.find(x => x.ref === ref);
            if (!b) return;

            const btn = document.activeElement;
            const oldHtml = btn.innerHTML;
            btn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Redirecting...';
            btn.disabled = true;

            try {
                const resp = await fetch("/api/stripe/create-checkout-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amountCents: Math.round(Number(b.total) * 100),
                    currency: (b.payment && b.payment.currency) ? b.payment.currency.toLowerCase() : "usd",
                    description: "BookingCart flight payment " + ref,
                    bookingRef: ref,
                    customerEmail: (b.contact && b.contact.email) || "",
                    successPath: "/confirmation",
                    cancelPath: "/my-bookings"
                  })
                });
                
                const data = await resp.json().catch(() => null);
                if (resp.ok && data && data.ok && data.url) {
                    localStorage.setItem('bc_paying_booking', JSON.stringify({ ref: ref, duffelOrderId: b.duffelOrderId, amount: b.total, currency: b.payment?.currency || "USD" }));
                    window.location.href = data.url;
                } else {
                    alert((data && data.error) || "Unable to start checkout");
                    btn.innerHTML = oldHtml;
                    btn.disabled = false;
                }
            } catch (err) {
                alert("Error starting checkout");
                btn.innerHTML = oldHtml;
                btn.disabled = false;
            }
        }

        async function downloadRealTicket(ref) {
            const b = allBookings.find(x => x.ref === ref);
            if (!b) return;

            // Track download
            fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'track_download', id: ref })
            }).catch(e => console.error(e));

            try {
                // Fetch PDF from our new generator
                const btn = document.activeElement;
                const oldHtml = btn.innerHTML;
                if (btn && btn.tagName === 'BUTTON') {
                    btn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Generating...';
                    btn.disabled = true;
                }

                const response = await fetch(`/api/ticket-download?ref=${ref}`, {
                    headers: bookingsAuthHeaders()
                });
                
                if (btn && btn.tagName === 'BUTTON') {
                    btn.innerHTML = oldHtml;
                    btn.disabled = false;
                }
                
                if (!response.ok) {
                    alert('Could not generate the E-Ticket.');
                    return;
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ETicket-${ref}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            } catch (e) {
                console.error('Download error:', e);
                alert('Error downloading ticket.');
            }
        }

        function downloadTicket(ref) {
            const b = allBookings.find(x => x.ref === ref);
            if (!b) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const slate800 = [30, 41, 59];
            const slate500 = [100, 116, 139];
            const slate200 = [226, 232, 240];
            const green = [22, 163, 74];
            const primary = [20, 83, 45];

            const paxName = (b.passengers && b.passengers[0]) ? ((b.passengers[0].firstName || '') + ' ' + (b.passengers[0].lastName || '')).trim().toUpperCase() : (b.contact && b.contact.email ? b.contact.email.split('@')[0].toUpperCase() : 'PASSENGER');
            const routeParts = (b.route || '').split(' → ');
            const airline = (b.flight && b.flight.airline) ? b.flight.airline : '';
            const total = b.total ? '$' + Number(b.total).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—';
            const issueDate = new Date().toISOString().split('T')[0];

            // Header strip
            doc.setFillColor(...primary);
            doc.rect(0, 0, 210, 36, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('BOOKING INVOICE', 20, 22);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('BookingCart Travel', 152, 22);

            // Invoice details box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(...slate200);
            doc.roundedRect(20, 44, 170, 28, 3, 3, 'FD');
            doc.setTextColor(...slate500);
            doc.setFontSize(9);
            doc.text('BOOKING REF', 25, 54);
            doc.text('INVOICE DATE', 80, 54);
            doc.text('STATUS', 140, 54);
            doc.setTextColor(...slate800);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(b.ref || '—', 25, 64);
            doc.setFontSize(11);
            doc.text(issueDate, 80, 64);
            doc.setTextColor(...green);
            doc.text('PAID', 140, 64);

            // Passenger & Flight details
            doc.setTextColor(...slate800);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('BILLED TO', 20, 84);
            doc.setDrawColor(...slate200);
            doc.line(20, 87, 190, 87);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(paxName, 20, 96);
            if (b.contact && b.contact.email) {
                doc.setTextColor(...slate500);
                doc.setFontSize(10);
                doc.text(b.contact.email, 20, 104);
            }

            // Line items table
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, 118, 170, 10, 2, 2, 'FD');
            doc.setTextColor(...slate500);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('DESCRIPTION', 25, 126);
            doc.text('DETAILS', 100, 126);
            doc.text('AMOUNT', 170, 126, { align: 'right' });

            // Row 1 — Flight
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...slate800);
            doc.setFontSize(11);
            doc.text('Flight Ticket', 25, 140);
            doc.setTextColor(...slate500);
            doc.setFontSize(10);
            doc.text((b.route || '—') + ' · ' + (airline || ''), 25, 148);
            doc.text((b.dates || ''), 25, 155);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...slate800);
            doc.setFontSize(11);
            doc.text(total, 170, 140, { align: 'right' });

            doc.setDrawColor(...slate200);
            doc.line(20, 162, 190, 162);

            // Total row
            doc.setFillColor(...primary);
            doc.roundedRect(120, 168, 70, 20, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('TOTAL PAID', 125, 180);
            doc.setFontSize(14);
            doc.text(total, 188, 180, { align: 'right' });

            // Footer
            doc.setTextColor(...slate500);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Thank you for booking with BookingCart. This invoice serves as confirmation of your payment.', 20, 220, { maxWidth: 170 });
            doc.text('For support, please contact support@bookingcart.com', 20, 228);

            doc.save('Invoice-' + (b.ref || 'booking') + '.pdf');
        }

        async function cancelBooking(ref) {
            if (!confirm('Cancel this booking? This will cancel with the airline and process any refund.')) return;
            
            const token = localStorage.getItem('bookingcart_google_id_token') || localStorage.getItem('bookingcart_jwt_token') || '';
            if (!token) {
                alert('Please sign in with Google to cancel a booking.');
                return;
            }
            
            // Find the booking to get Duffel order ID
            const booking = allBookings.find(b => b.ref === ref);
            if (!booking) {
                alert('Booking not found.');
                return;
            }
            
            // If no Duffel order ID, just update local status
            if (!booking.duffelOrderId) {
                try {
                    const r = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: bookingsAuthHeaders(),
                        body: JSON.stringify({ action: 'cancel_own', id: ref })
                    });
                    const d = await r.json().catch(() => ({}));
                    if (!r.ok || !d.ok) {
                        alert((d && d.error) || 'Could not cancel booking.');
                    }
                } catch (e) { }
                lookup();
                return;
            }
            
            // Step 1: Create pending cancellation with Duffel
            try {
                console.log(`Creating cancellation for Duffel order: ${booking.duffelOrderId}`);
                
                const createResp = await fetch('/api/duffel-order-cancellations', {
                    method: 'POST',
                    headers: bookingsAuthHeaders(),
                    body: JSON.stringify({
                        action: 'create',
                        orderId: booking.duffelOrderId
                    })
                });
                
                const createData = await createResp.json();
                if (!createResp.ok || !createData.ok) {
                    alert((createData && createData.error) || 'Could not initiate cancellation with airline.');
                    return;
                }
                
                const cancellationId = createData.cancellation.id;
                const refundAmount = createData.cancellation.refundAmount;
                const refundCurrency = createData.cancellation.refundCurrency;
                
                // Show refund info and confirm
                const confirmMsg = refundAmount > 0 
                    ? `Refund amount: ${refundCurrency} ${refundAmount}. Confirm cancellation?`
                    : 'No refund available. Confirm cancellation?';
                    
                if (!confirm(confirmMsg)) {
                    return;
                }
                
                // Step 2: Confirm the cancellation
                const confirmResp = await fetch('/api/duffel-order-cancellations', {
                    method: 'POST',
                    headers: bookingsAuthHeaders(),
                    body: JSON.stringify({
                        action: 'confirm',
                        cancellationId: cancellationId,
                        reason: 'customer_request'
                    })
                });
                
                const confirmData = await confirmResp.json();
                if (!confirmResp.ok || !confirmData.ok) {
                    alert((confirmData && confirmData.error) || 'Could not confirm cancellation.');
                    return;
                }
                
                // Step 3: Update local DB status
                await fetch('/api/bookings', {
                    method: 'POST',
                    headers: bookingsAuthHeaders(),
                    body: JSON.stringify({ 
                        action: 'cancel_own', 
                        id: ref,
                        refundAmount: refundAmount,
                        refundCurrency: refundCurrency
                    })
                });
                
                alert(`Booking cancelled successfully. Refund: ${refundCurrency} ${refundAmount}`);
                
            } catch (e) { 
                console.error('Cancellation error:', e);
                alert('Error during cancellation. Please try again.');
            }
            lookup();
        }
        
        // Add services (bags, seats) to existing order
        async function addServicesToBooking(ref) {
            const booking = allBookings.find(b => b.ref === ref);
            if (!booking || !booking.duffelOrderId) {
                alert('Booking not found or not eligible for modifications.');
                return;
            }
            
            try {
                // Step 1: Get available services
                const servicesResp = await fetch(`/api/duffel-order-services?orderId=${encodeURIComponent(booking.duffelOrderId)}`, {
                    headers: bookingsAuthHeaders()
                });
                
                const servicesData = await servicesResp.json();
                if (!servicesResp.ok || !servicesData.ok) {
                    alert((servicesData && servicesData.error) || 'Could not fetch available services.');
                    return;
                }
                
                // Build service selection UI
                let serviceOptions = '';
                
                // Baggage options
                if (servicesData.services.baggage.length > 0) {
                    serviceOptions += '<div class="mb-4"><h4 class="font-bold mb-2">Baggage</h4>';
                    servicesData.services.baggage.forEach(bag => {
                        serviceOptions += `
                            <label class="flex items-center gap-2 mb-2 p-2 border rounded">
                                <input type="checkbox" name="service" value="${bag.id}" data-type="baggage" class="service-checkbox">
                                <span>${bag.metadata.type || 'Checked Bag'} - ${bag.totalCurrency} ${bag.totalAmount}</span>
                            </label>
                        `;
                    });
                    serviceOptions += '</div>';
                }
                
                // Seat options
                if (servicesData.services.seats.length > 0) {
                    serviceOptions += '<div class="mb-4"><h4 class="font-bold mb-2">Seats</h4>';
                    servicesData.services.seats.forEach(seat => {
                        serviceOptions += `
                            <label class="flex items-center gap-2 mb-2 p-2 border rounded">
                                <input type="checkbox" name="service" value="${seat.id}" data-type="seat" class="service-checkbox">
                                <span>Seat ${seat.metadata.designator || 'Selection'} - ${seat.totalCurrency} ${seat.totalAmount}</span>
                            </label>
                        `;
                    });
                    serviceOptions += '</div>';
                }
                
                if (!serviceOptions) {
                    alert('No additional services available for this booking.');
                    return;
                }
                
                // Show modal with service options
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto">
                        <h3 class="text-lg font-bold mb-4">Add Services</h3>
                        ${serviceOptions}
                        <div class="flex gap-3 mt-6">
                            <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-200 rounded">Cancel</button>
                            <button id="confirm-services" class="flex-1 px-4 py-2 bg-green-600 text-white rounded">Add Selected</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // Handle confirm
                document.getElementById('confirm-services').onclick = async () => {
                    const selected = Array.from(modal.querySelectorAll('.service-checkbox:checked')).map(cb => ({
                        id: cb.value,
                        quantity: 1
                    }));
                    
                    if (selected.length === 0) {
                        alert('Please select at least one service.');
                        return;
                    }
                    
                    modal.remove();
                    
                    // Add services
                    const addResp = await fetch('/api/duffel-order-services', {
                        method: 'POST',
                        headers: bookingsAuthHeaders(),
                        body: JSON.stringify({
                            orderId: booking.duffelOrderId,
                            services: selected
                        })
                    });
                    
                    const addData = await addResp.json();
                    if (!addResp.ok || !addData.ok) {
                        alert((addData && addData.error) || 'Could not add services.');
                        return;
                    }
                    
                    alert(`Services added successfully! New total: ${addData.newTotalCurrency} ${addData.newTotalAmount}`);
                    lookup();
                };
                
            } catch (e) {
                console.error('Add services error:', e);
                alert('Error fetching services. Please try again.');
            }
        }
        
        // Change flight dates/routes
        async function changeBooking(ref) {
            const booking = allBookings.find(b => b.ref === ref);
            if (!booking || !booking.duffelOrderId) {
                alert('Booking not found or not eligible for changes.');
                return;
            }
            
            // Prompt for new dates
            const newDate = prompt('Enter new departure date (YYYY-MM-DD):');
            if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                alert('Invalid date format. Please use YYYY-MM-DD.');
                return;
            }
            
            try {
                // For simplicity, we'll just create a change request
                // In a real implementation, you'd need to search for new flights first
                alert('Flight change feature: This would search for new flights and create a change request. Coming soon!');
                
            } catch (e) {
                console.error('Change booking error:', e);
                alert('Error processing change request.');
            }
        }


