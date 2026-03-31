(function initAppointmentObserver(global) {
    const DesignPatterns = global.DesignPatterns || (global.DesignPatterns = {});

    class AppointmentEventBus {
        constructor() {
            this.listeners = new Map();
        }

        subscribe(eventName, listener) {
            if (!this.listeners.has(eventName)) {
                this.listeners.set(eventName, []);
            }

            this.listeners.get(eventName).push(listener);
            return () => this.unsubscribe(eventName, listener);
        }

        unsubscribe(eventName, listener) {
            if (!this.listeners.has(eventName)) {
                return;
            }

            const next = this.listeners.get(eventName).filter(function keep(fn) {
                return fn !== listener;
            });

            this.listeners.set(eventName, next);
        }

        publish(eventName, payload) {
            const eventListeners = this.listeners.get(eventName) || [];
            eventListeners.forEach(function notify(listener) {
                listener(payload);
            });
        }
    }

    function createBadgeObserver(badgeElement) {
        return function onAppointmentEvent(payload) {
            if (!badgeElement) {
                return;
            }

            const nextValue = Number(payload.pendingCount || 0);
            badgeElement.textContent = String(nextValue);
            badgeElement.classList.toggle("d-none", nextValue <= 0);
        };
    }

    function createToastObserver() {
        return function onAppointmentEvent(payload) {
            const status = payload.status || "updated";
            const code = payload.appointmentCode || "N/A";
            if (typeof global.showNotification === "function") {
                global.showNotification("Appointment " + code + " was " + status + ".", "info");
            }
        };
    }

    const appointmentEventBus = new AppointmentEventBus();

    DesignPatterns.AppointmentObserver = {
        eventBus: appointmentEventBus,
        createBadgeObserver: createBadgeObserver,
        createToastObserver: createToastObserver
    };
})(window);
