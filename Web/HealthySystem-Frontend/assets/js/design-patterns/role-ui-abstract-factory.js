(function initRoleUiAbstractFactory(global) {
    const DesignPatterns = global.DesignPatterns || (global.DesignPatterns = {});

    class DashboardRoleFactory {
        createSidebarItems() {
            throw new Error("createSidebarItems must be implemented");
        }

        createQuickActions() {
            throw new Error("createQuickActions must be implemented");
        }

        createTheme() {
            return {
                accentClass: "text-primary",
                iconClass: "fa-solid fa-stethoscope"
            };
        }
    }

    class DoctorRoleFactory extends DashboardRoleFactory {
        createSidebarItems() {
            return [
                { href: "doctor-dashboard.html", icon: "fa-gauge", label: "Overview" },
                { href: "doctor-appointments.html", icon: "fa-calendar-check", label: "Appointments" },
                { href: "patient-lookup.html", icon: "fa-user-injured", label: "Patients" }
            ];
        }

        createQuickActions() {
            return [
                { href: "doctor-appointments.html", icon: "fa-list", label: "Open appointment board" },
                { href: "lab-request.html", icon: "fa-vial", label: "Create lab request" }
            ];
        }

        createTheme() {
            return {
                accentClass: "text-success",
                iconClass: "fa-solid fa-user-doctor"
            };
        }
    }

    class ReceptionRoleFactory extends DashboardRoleFactory {
        createSidebarItems() {
            return [
                { href: "reception-dashboard.html", icon: "fa-gauge", label: "Overview" },
                { href: "appointment-registration.html", icon: "fa-calendar-plus", label: "Create appointment" },
                { href: "patient-lookup.html", icon: "fa-users", label: "Patient queue" }
            ];
        }

        createQuickActions() {
            return [
                { href: "appointment-registration.html", icon: "fa-calendar-plus", label: "New walk-in" },
                { href: "doctor-schedule.html", icon: "fa-calendar-days", label: "Check doctor slots" }
            ];
        }

        createTheme() {
            return {
                accentClass: "text-info",
                iconClass: "fa-solid fa-clipboard-list"
            };
        }
    }

    class AccountantRoleFactory extends DashboardRoleFactory {
        createSidebarItems() {
            return [
                { href: "accountant-dashboard.html", icon: "fa-gauge", label: "Overview" },
                { href: "payments-management.html", icon: "fa-file-invoice-dollar", label: "Payments" },
                { href: "payments-management.html#invoice-history", icon: "fa-receipt", label: "Invoices" }
            ];
        }

        createQuickActions() {
            return [
                { href: "payments-management.html", icon: "fa-money-bill-wave", label: "Collect payment" },
                { href: "accountant-dashboard.html", icon: "fa-chart-line", label: "Financial report" }
            ];
        }

        createTheme() {
            return {
                accentClass: "text-warning",
                iconClass: "fa-solid fa-calculator"
            };
        }
    }

    const roleFactories = {
        doctor: DoctorRoleFactory,
        reception: ReceptionRoleFactory,
        accountant: AccountantRoleFactory
    };

    function createRoleFactory(role) {
        const FactoryType = roleFactories[(role || "").toLowerCase()];
        if (!FactoryType) {
            throw new Error("Unsupported role for dashboard factory: " + role);
        }

        return new FactoryType();
    }

    function renderRoleUi(role, options) {
        const factory = createRoleFactory(role);
        const settings = options || {};

        if (settings.sidebarElement) {
            settings.sidebarElement.innerHTML = factory
                .createSidebarItems()
                .map(function mapItem(item) {
                    return '<li><a href="' + item.href + '"><i class="fa-solid ' + item.icon + '"></i> ' + item.label + '</a></li>';
                })
                .join("");
        }

        if (settings.quickActionElement) {
            settings.quickActionElement.innerHTML = factory
                .createQuickActions()
                .map(function mapAction(action) {
                    return '<a class="quick-action-btn" href="' + action.href + '"><i class="fa-solid ' + action.icon + '"></i> ' + action.label + '</a>';
                })
                .join("");
        }

        return factory.createTheme();
    }

    DesignPatterns.RoleUiAbstractFactory = {
        createRoleFactory: createRoleFactory,
        renderRoleUi: renderRoleUi
    };
})(window);
