// Payment Tracker App - Main JavaScript
// =========================================

class PaymentTrackerApp {
    constructor() {
        this.payments = [];
        this.contacts = [];
        this.currentView = 'dashboard';
        this.currentFilter = 'all';
        this.currentProject = ''; // Current project filter
        this.selectedPayment = null;
        this.selectedContact = null;
        this.selectedProject = null;

        this.init();
    }

    // Initialize the app
    async init() {
        this.showLoading();
        await this.loadData();
        this.setupEventListeners();
        this.registerServiceWorker();
        this.renderDashboard();
        this.hideLoading();
    }

    // Load data from localStorage or initialize with default data
    async loadData() {
        // Try to load from localStorage first
        const storedPayments = localStorage.getItem('payments');
        const storedContacts = localStorage.getItem('contacts');

        if (storedPayments) {
            this.payments = JSON.parse(storedPayments);
        } else {
            // Load initial data
            await this.loadInitialData();
        }

        if (storedContacts) {
            this.contacts = JSON.parse(storedContacts);
        } else {
            // Load initial contacts
            await this.loadInitialContacts();
        }
    }

    // Load initial payment data
    async loadInitialData() {
        try {
            const response = await fetch('payments_data.json');
            this.payments = await response.json();
            this.saveData();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.payments = [];
        }
    }

    // Load initial contacts data
    async loadInitialContacts() {
        try {
            const response = await fetch('contacts_data.json');
            this.contacts = await response.json();
            this.saveContacts();
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.contacts = [];
        }
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('payments', JSON.stringify(this.payments));
    }

    saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }

    // Setup event listeners
    setupEventListeners() {
        // Menu toggle
        document.getElementById('navMenu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('menuClose').addEventListener('click', () => this.toggleMenu());
        document.getElementById('menuOverlay').addEventListener('click', () => this.toggleMenu());

        // Back button
        document.getElementById('navBack').addEventListener('click', () => this.goBack());

        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.navigateTo(view);
                this.toggleMenu();
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.navigateTo(view);
            });
        });

        // Search
        const searchPayments = document.getElementById('searchPayments');
        if (searchPayments) {
            searchPayments.addEventListener('input', (e) => this.searchPayments(e.target.value));
        }

        const searchContacts = document.getElementById('searchContacts');
        if (searchContacts) {
            searchContacts.addEventListener('input', (e) => this.searchContacts(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderPayments();
            });
        });

        // Project filter
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                this.currentProject = e.target.value;
                this.renderPayments();
            });
        }

        // Export/Import
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());

        // Sync buttons
        document.getElementById('syncNow')?.addEventListener('click', () => this.syncNow());
        document.getElementById('saveSync')?.addEventListener('click', () => this.saveSyncSettings());
    }

    // Navigation
    navigateTo(viewName) {
        this.currentView = viewName;

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show the target view
        let targetView;
        let title = 'Payment Tracker';
        let showBack = false;

        switch(viewName) {
            case 'dashboard':
                targetView = document.getElementById('dashboardView');
                this.renderDashboard();
                break;
            case 'payments':
                targetView = document.getElementById('paymentsView');
                title = 'All Payments';
                this.renderPayments();
                break;
            case 'late':
                targetView = document.getElementById('lateView');
                title = 'Late Payments';
                this.renderLatePayments();
                break;
            case 'contacts':
                targetView = document.getElementById('contactsView');
                title = 'Contacts';
                this.renderContacts();
                break;
            case 'projects':
                targetView = document.getElementById('projectsView');
                title = 'Projects';
                this.renderProjects();
                break;
            case 'sync':
                targetView = document.getElementById('syncView');
                title = 'Sync Settings';
                break;
            case 'paymentDetail':
                targetView = document.getElementById('paymentDetailView');
                title = 'Payment Details';
                showBack = true;
                this.renderPaymentDetail();
                break;
            case 'contactDetail':
                targetView = document.getElementById('contactDetailView');
                title = 'Contact Details';
                showBack = true;
                this.renderContactDetail();
                break;
            case 'projectDetail':
                targetView = document.getElementById('projectDetailView');
                title = 'Project Details';
                showBack = true;
                this.renderProjectDetail();
                break;
        }

        if (targetView) {
            targetView.classList.add('active');
        }

        // Update navbar
        document.getElementById('navTitle').textContent = title;
        document.getElementById('navBack').style.display = showBack ? 'flex' : 'none';
    }

    goBack() {
        if (this.currentView === 'paymentDetail') {
            this.navigateTo('payments');
        } else if (this.currentView === 'contactDetail') {
            this.navigateTo('contacts');
        } else if (this.currentView === 'projectDetail') {
            this.navigateTo('projects');
        } else {
            this.navigateTo('dashboard');
        }
    }

    toggleMenu() {
        const menu = document.getElementById('sideMenu');
        const overlay = document.getElementById('menuOverlay');
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Dashboard
    renderDashboard() {
        const stats = this.calculateStats();

        // Update stat cards
        document.getElementById('statLate').textContent = stats.lateCount;
        document.getElementById('statLateAmount').textContent = this.formatCurrency(stats.lateAmount);
        document.getElementById('statPending').textContent = stats.pendingCount;
        document.getElementById('statPendingAmount').textContent = this.formatCurrency(stats.pendingAmount);
        document.getElementById('statPaid').textContent = stats.paidCount;
        document.getElementById('statPaidAmount').textContent = this.formatCurrency(stats.paidAmount);
        document.getElementById('statOutstanding').textContent = this.formatCurrency(stats.totalOwed);

        // Update menu badge
        document.getElementById('lateBadge').textContent = stats.lateCount;

        // Render recent activity
        this.renderRecentActivity();
    }

    calculateStats() {
        let lateCount = 0, lateAmount = 0;
        let pendingCount = 0, pendingAmount = 0;
        let paidCount = 0, paidAmount = 0;
        let totalOwed = 0;

        this.payments.forEach(payment => {
            const status = payment.status;
            const owed = payment.amountOwed || 0;

            totalOwed += owed;

            if (status === 'Late — not paid') {
                lateCount++;
                lateAmount += owed;
            } else if (status === 'Not due yet') {
                pendingCount++;
                pendingAmount += owed;
            } else if (status === 'Paid') {
                paidCount++;
                paidAmount += payment.amountPaidUSD || 0;
            }
        });

        return {
            lateCount, lateAmount,
            pendingCount, pendingAmount,
            paidCount, paidAmount,
            totalOwed
        };
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');

        // Get late payments sorted by due date
        const latePayments = this.payments
            .filter(p => p.status === 'Late — not paid')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        if (latePayments.length === 0) {
            container.innerHTML = '<p class="empty-state">No late payments! 🎉</p>';
            return;
        }

        container.innerHTML = latePayments.map(payment => `
            <div class="payment-card status-late" data-id="${payment.id}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(payment.description)}</div>
                        <div class="card-subtitle">${this.escapeHtml(payment.projectName)}</div>
                    </div>
                    <span class="card-badge badge-late">LATE</span>
                </div>
                <div class="card-body">
                    <div class="card-row">
                        <span class="card-label">Due:</span>
                        <span class="card-value overdue">${this.formatDate(payment.dueDate)} (${this.daysOverdue(payment.dueDate)} days)</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Amount Owed:</span>
                        <span class="card-value amount">${this.formatCurrency(payment.amountOwed)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPayment = this.payments.find(p => p.id == card.dataset.id);
                this.navigateTo('paymentDetail');
            });
        });
    }

    // Payments List
    renderPayments() {
        const container = document.getElementById('paymentsList');

        // Populate project filter
        this.populateProjectFilter();

        // Filter payments
        let filtered = this.payments;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.status === this.currentFilter);
        }

        if (this.currentProject) {
            filtered = filtered.filter(p => p.projectName === this.currentProject);
        }

        // Sort by due date
        filtered.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No payments found</p></div>';
            return;
        }

        container.innerHTML = filtered.map(payment => this.renderPaymentCard(payment)).join('');

        // Add click handlers
        container.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPayment = this.payments.find(p => p.id == card.dataset.id);
                this.navigateTo('paymentDetail');
            });
        });
    }

    renderPaymentCard(payment) {
        const statusClass = this.getStatusClass(payment.status);
        const badgeClass = this.getBadgeClass(payment.status);

        return `
            <div class="payment-card ${statusClass}" data-id="${payment.id}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(payment.description)}</div>
                        <div class="card-subtitle">${this.escapeHtml(payment.projectName)} ${payment.milestoneNumber ? `- M${payment.milestoneNumber}` : ''}</div>
                    </div>
                    <span class="card-badge ${badgeClass}">${this.escapeHtml(payment.status)}</span>
                </div>
                <div class="card-body">
                    ${payment.dueDate ? `
                    <div class="card-row">
                        <span class="card-label">Due Date:</span>
                        <span class="card-value ${payment.status === 'Late — not paid' ? 'overdue' : ''}">${this.formatDate(payment.dueDate)}${payment.status === 'Late — not paid' ? ` (${this.daysOverdue(payment.dueDate)}d)` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="card-row">
                        <span class="card-label">Expected:</span>
                        <span class="card-value">${this.formatCurrency(payment.expectedPaymentUSD)}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Amount Owed:</span>
                        <span class="card-value amount">${this.formatCurrency(payment.amountOwed)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Late Payments
    renderLatePayments() {
        const container = document.getElementById('latePaymentsList');

        const latePayments = this.payments
            .filter(p => p.status === 'Late — not paid')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (latePayments.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎉</div><p>No late payments!</p></div>';
            return;
        }

        container.innerHTML = latePayments.map(payment => this.renderPaymentCard(payment)).join('');

        // Add click handlers
        container.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPayment = this.payments.find(p => p.id == card.dataset.id);
                this.navigateTo('paymentDetail');
            });
        });
    }

    // Payment Detail
    renderPaymentDetail() {
        if (!this.selectedPayment) return;

        const payment = this.selectedPayment;
        const container = document.getElementById('paymentDetail');

        // Find associated contact
        const contact = this.findContactForProject(payment.projectName);

        container.innerHTML = `
            <div class="detail-header">
                <span class="card-badge ${this.getBadgeClass(payment.status)}">${this.escapeHtml(payment.status)}</span>
                <h2 class="detail-title">${this.escapeHtml(payment.description)}</h2>
                <p class="detail-subtitle">${this.escapeHtml(payment.projectName)}${payment.milestoneNumber ? ` - Milestone ${payment.milestoneNumber}` : ''}</p>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Payment Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Expected Payment</span>
                    <span class="detail-value">${this.formatCurrency(payment.expectedPaymentUSD)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value">${this.formatCurrency(payment.amountPaidUSD)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount Owed</span>
                    <span class="detail-value" style="color: var(--primary); font-size: 1.25rem;">${this.formatCurrency(payment.amountOwed)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Dates</h3>
                ${payment.dueDate ? `
                <div class="detail-row">
                    <span class="detail-label">Due Date</span>
                    <span class="detail-value">${this.formatDate(payment.dueDate)}</span>
                </div>
                ${payment.status === 'Late — not paid' ? `
                <div class="detail-row">
                    <span class="detail-label">Days Overdue</span>
                    <span class="detail-value" style="color: var(--danger);">${this.daysOverdue(payment.dueDate)} days</span>
                </div>
                ` : ''}
                ` : ''}
                ${payment.invoiceDate ? `
                <div class="detail-row">
                    <span class="detail-label">Invoice Date</span>
                    <span class="detail-value">${this.formatDate(payment.invoiceDate)}</span>
                </div>
                ` : ''}
                ${payment.paymentDate ? `
                <div class="detail-row">
                    <span class="detail-label">Payment Date</span>
                    <span class="detail-value">${this.formatDate(payment.paymentDate)}</span>
                </div>
                ` : ''}
            </div>

            ${payment.invoiceNumber ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Invoice</h3>
                <div class="detail-row">
                    <span class="detail-label">Invoice Number</span>
                    <span class="detail-value">${this.escapeHtml(payment.invoiceNumber)}</span>
                </div>
            </div>
            ` : ''}

            ${payment.notes ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Notes</h3>
                <p>${this.escapeHtml(payment.notes)}</p>
            </div>
            ` : ''}

            ${contact ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Point of Contact</h3>
                <p>Contact the finance manager for this project:</p>
                <div class="contact-actions">
                    ${contact.financeManager.phone ? `
                    <button class="contact-btn btn-call" onclick="window.location.href='tel:${contact.financeManager.phone}'">
                        <span>📞</span>
                        <span>Call</span>
                    </button>
                    ` : ''}
                    ${contact.financeManager.email ? `
                    <button class="contact-btn btn-email" onclick="window.location.href='mailto:${contact.financeManager.email}'">
                        <span>✉️</span>
                        <span>Email</span>
                    </button>
                    ` : ''}
                    ${contact.financeManager.phone ? `
                    <button class="contact-btn btn-whatsapp" onclick="window.open('https://wa.me/${contact.financeManager.phone.replace(/\D/g, '')}', '_blank')">
                        <span>💬</span>
                        <span>WhatsApp</span>
                    </button>
                    ` : ''}
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <button class="btn-secondary" onclick="app.showContactForProject('${this.escapeHtml(payment.projectName)}')">View Full Contact Details</button>
                </div>
            </div>
            ` : ''}
        `;
    }

    // Contacts
    renderContacts() {
        const container = document.getElementById('contactsList');

        if (this.contacts.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>No contacts found</p></div>';
            return;
        }

        container.innerHTML = this.contacts.map(contact => `
            <div class="contact-card" data-id="${contact.id}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(contact.projectName)}</div>
                        <div class="card-subtitle">${this.escapeHtml(contact.company)}</div>
                    </div>
                </div>
                <div class="card-body">
                    ${contact.financeManager.name ? `
                    <div class="card-row">
                        <span class="card-label">Finance Manager:</span>
                        <span class="card-value">${this.escapeHtml(contact.financeManager.name)}</span>
                    </div>
                    ` : ''}
                    ${contact.financeManager.phone ? `
                    <div class="card-row">
                        <span class="card-label">Phone:</span>
                        <span class="card-value">${this.escapeHtml(contact.financeManager.phone)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.contact-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedContact = this.contacts.find(c => c.id == card.dataset.id);
                this.navigateTo('contactDetail');
            });
        });
    }

    renderContactDetail() {
        if (!this.selectedContact) return;

        const contact = this.selectedContact;
        const container = document.getElementById('contactDetail');

        container.innerHTML = `
            <div class="detail-header">
                <h2 class="detail-title">${this.escapeHtml(contact.projectName)}</h2>
                <p class="detail-subtitle">${this.escapeHtml(contact.company)} ${contact.division ? `- ${this.escapeHtml(contact.division)}` : ''}</p>
            </div>

            ${contact.financeManager.name ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Finance Manager</h3>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${this.escapeHtml(contact.financeManager.name)}</span>
                </div>
                ${contact.financeManager.phone ? `
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${this.escapeHtml(contact.financeManager.phone)}</span>
                </div>
                ` : ''}
                ${contact.financeManager.email ? `
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${this.escapeHtml(contact.financeManager.email)}</span>
                </div>
                ` : ''}
                <div class="contact-actions" style="margin-top: 1rem;">
                    ${contact.financeManager.phone ? `
                    <button class="contact-btn btn-call" onclick="window.location.href='tel:${contact.financeManager.phone}'">
                        <span>📞</span>
                        <span>Call</span>
                    </button>
                    <button class="contact-btn btn-whatsapp" onclick="window.open('https://wa.me/${contact.financeManager.phone.replace(/\D/g, '')}', '_blank')">
                        <span>💬</span>
                        <span>WhatsApp</span>
                    </button>
                    ` : ''}
                    ${contact.financeManager.email ? `
                    <button class="contact-btn btn-email" onclick="window.location.href='mailto:${contact.financeManager.email}'">
                        <span>✉️</span>
                        <span>Email</span>
                    </button>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${contact.projectManager.name ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Project Manager</h3>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${this.escapeHtml(contact.projectManager.name)}</span>
                </div>
                ${contact.projectManager.phone ? `
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${this.escapeHtml(contact.projectManager.phone)}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${contact.consultantManager.name ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Consultant Manager</h3>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${this.escapeHtml(contact.consultantManager.name)}</span>
                </div>
                ${contact.consultantManager.phone ? `
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${this.escapeHtml(contact.consultantManager.phone)}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}
        `;
    }

    // Projects
    renderProjects() {
        const container = document.getElementById('projectsList');

        // Group payments by project
        const projectsMap = {};

        this.payments.forEach(payment => {
            const projectName = payment.projectName;
            if (!projectsMap[projectName]) {
                projectsMap[projectName] = {
                    name: projectName,
                    count: 0,
                    totalOwed: 0,
                    totalPaid: 0,
                    lateCount: 0
                };
            }

            projectsMap[projectName].count++;
            projectsMap[projectName].totalOwed += payment.amountOwed || 0;
            projectsMap[projectName].totalPaid += payment.amountPaidUSD || 0;
            if (payment.status === 'Late — not paid') {
                projectsMap[projectName].lateCount++;
            }
        });

        const projects = Object.values(projectsMap);

        container.innerHTML = projects.map(project => `
            <div class="project-card" data-name="${this.escapeHtml(project.name)}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(project.name)}</div>
                        <div class="card-subtitle">${project.count} milestones</div>
                    </div>
                    ${project.lateCount > 0 ? `<span class="card-badge badge-late">${project.lateCount} Late</span>` : ''}
                </div>
                <div class="card-body">
                    <div class="card-row">
                        <span class="card-label">Total Owed:</span>
                        <span class="card-value amount">${this.formatCurrency(project.totalOwed)}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Total Paid:</span>
                        <span class="card-value">${this.formatCurrency(project.totalPaid)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectName = card.dataset.name;
                this.selectedProject = projectName;
                this.navigateTo('projectDetail');
            });
        });
    }

    renderProjectDetail() {
        if (!this.selectedProject) return;

        const projectName = this.selectedProject;
        const container = document.getElementById('projectDetail');

        // Get project payments
        const projectPayments = this.payments.filter(p => p.projectName === projectName);

        // Calculate project stats
        let totalOwed = 0, totalPaid = 0, lateCount = 0, paidCount = 0;
        projectPayments.forEach(p => {
            totalOwed += p.amountOwed || 0;
            totalPaid += p.amountPaidUSD || 0;
            if (p.status === 'Late — not paid') lateCount++;
            if (p.status === 'Paid') paidCount++;
        });

        // Find contact
        const contact = this.findContactForProject(projectName);

        container.innerHTML = `
            <div class="detail-header">
                <h2 class="detail-title">${this.escapeHtml(projectName)}</h2>
                <p class="detail-subtitle">${projectPayments.length} milestones</p>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Project Summary</h3>
                <div class="detail-row">
                    <span class="detail-label">Total Milestones</span>
                    <span class="detail-value">${projectPayments.length}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Paid Milestones</span>
                    <span class="detail-value">${paidCount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Late Milestones</span>
                    <span class="detail-value" style="color: var(--danger);">${lateCount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Owed</span>
                    <span class="detail-value" style="color: var(--primary); font-size: 1.25rem;">${this.formatCurrency(totalOwed)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Paid</span>
                    <span class="detail-value">${this.formatCurrency(totalPaid)}</span>
                </div>
            </div>

            ${contact ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Project Contact</h3>
                <div class="detail-row">
                    <span class="detail-label">Company</span>
                    <span class="detail-value">${this.escapeHtml(contact.company)}</span>
                </div>
                ${contact.financeManager.name ? `
                <div class="detail-row">
                    <span class="detail-label">Finance Manager</span>
                    <span class="detail-value">${this.escapeHtml(contact.financeManager.name)}</span>
                </div>
                ` : ''}
                <div style="margin-top: 1rem;">
                    <button class="btn-secondary" onclick="app.selectedContact = app.contacts.find(c => c.projectName.includes('${projectName.split(' ')[0]}')); app.navigateTo('contactDetail');">View Full Contact Details</button>
                </div>
            </div>
            ` : ''}

            <div class="detail-section">
                <h3 class="detail-section-title">Milestones</h3>
                <div class="payments-list">
                    ${projectPayments.map(p => this.renderPaymentCard(p)).join('')}
                </div>
            </div>
        `;

        // Add click handlers for payment cards
        container.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPayment = this.payments.find(p => p.id == card.dataset.id);
                this.navigateTo('paymentDetail');
            });
        });
    }

    // Search
    searchPayments(query) {
        if (!query) {
            this.renderPayments();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = this.payments.filter(p =>
            p.description.toLowerCase().includes(lowerQuery) ||
            p.projectName.toLowerCase().includes(lowerQuery) ||
            (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(lowerQuery))
        );

        const container = document.getElementById('paymentsList');
        container.innerHTML = filtered.map(p => this.renderPaymentCard(p)).join('');

        // Add click handlers
        container.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPayment = this.payments.find(p => p.id == card.dataset.id);
                this.navigateTo('paymentDetail');
            });
        });
    }

    searchContacts(query) {
        if (!query) {
            this.renderContacts();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = this.contacts.filter(c =>
            c.projectName.toLowerCase().includes(lowerQuery) ||
            c.company.toLowerCase().includes(lowerQuery) ||
            c.financeManager.name.toLowerCase().includes(lowerQuery)
        );

        const container = document.getElementById('contactsList');
        container.innerHTML = filtered.map(c => `
            <div class="contact-card" data-id="${c.id}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(c.projectName)}</div>
                        <div class="card-subtitle">${this.escapeHtml(c.company)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.contact-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedContact = this.contacts.find(c => c.id == card.dataset.id);
                this.navigateTo('contactDetail');
            });
        });
    }

    // Helper functions


    findContactForProject(projectName) {
        // Try exact match first
        let contact = this.contacts.find(c => c.projectName === projectName);

        // Try partial match
        if (!contact) {
            const projectKey = projectName.split(' ')[0].toLowerCase();
            contact = this.contacts.find(c =>
                c.projectName.toLowerCase().includes(projectKey)
            );
        }

        return contact;
    }

    showContactForProject(projectName) {
        const contact = this.findContactForProject(projectName);
        if (contact) {
            this.selectedContact = contact;
            this.navigateTo('contactDetail');
        }
    }

    getStatusClass(status) {
        if (status === 'Late — not paid') return 'status-late';
        if (status === 'Paid') return 'status-paid';
        if (status === 'Not due yet') return 'status-pending';
        return '';
    }

    getBadgeClass(status) {
        if (status === 'Late — not paid') return 'badge-late';
        if (status === 'Paid') return 'badge-paid';
        if (status === 'Not due yet') return 'badge-pending';
        return 'badge-default';
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return '$0';
        return '$' + Math.round(amount).toLocaleString();
    }

    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    daysOverdue(dueDate) {
        if (!dueDate) return 0;
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Loading
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Export/Import
    exportData() {
        const data = {
            payments: this.payments,
            contacts: this.contacts,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Data exported successfully');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.payments && data.contacts) {
                        this.payments = data.payments;
                        this.contacts = data.contacts;
                        this.saveData();
                        this.saveContacts();
                        this.renderDashboard();
                        this.showToast('Data imported successfully');
                    }
                } catch (error) {
                    this.showToast('Error importing data', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // Sync
    syncNow() {
        this.showToast('Sync feature coming soon!', 'info');
        // TODO: Implement Google Sheets sync
    }

    saveSyncSettings() {
        const sheetsUrl = document.getElementById('sheetsUrl').value;
        const syncFrequency = document.getElementById('syncFrequency').value;

        localStorage.setItem('sheetsUrl', sheetsUrl);
        localStorage.setItem('syncFrequency', syncFrequency);

        this.showToast('Sync settings saved');
    }


    populateProjectFilter() {
        const select = document.getElementById('projectFilter');
        if (!select) return;

        const projects = [...new Set(this.payments.map(p => p.projectName))].sort();
        select.innerHTML = '<option value="">All Projects</option>' +
            projects.map(p => `<option value="${this.escapeHtml(p)}">${this.escapeHtml(p)}</option>`).join('');
    }
}

// Initialize app
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new PaymentTrackerApp();
});
