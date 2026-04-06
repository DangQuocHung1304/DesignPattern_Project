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
            const status = payload.status || payload.currentStatus || "updated";
            const code = payload.appointmentCode || payload.appointmentId || "N/A";
            const previous = payload.previousStatus || "";
            const message = previous
                ? "Lich hen " + code + ": " + previous + " -> " + status
                : "Lich hen " + code + " da chuyen sang " + status;

            if (global.notification && typeof global.notification.info === "function") {
                global.notification.info(message);
            }
        };
    }

    function publishFromPatternResult(result, eventName) {
        if (!result || !result.success) {
            return;
        }

        const payload = result.data && result.data.data ? result.data.data : null;
        if (!payload || (!payload.appointmentId && !payload.appointmentCode)) {
            return;
        }

        const eventPayload = {
            appointmentId: payload.appointmentId,
            appointmentCode: payload.appointmentCode || (payload.appointmentId ? "APT-" + payload.appointmentId : undefined),
            previousStatus: payload.previousStatus,
            currentStatus: payload.currentStatus,
            status: payload.currentStatus,
            pendingCount: payload.currentStatus === "scheduled" ? 1 : 0,
            changedAtUtc: new Date().toISOString()
        };

        appointmentEventBus.publish(eventName || "appointment.status.changed", eventPayload);
    }

    const appointmentEventBus = new AppointmentEventBus();

    global.handlePatternObserverEvent = function handlePatternObserverEvent(result, eventName) {
        publishFromPatternResult(result, eventName);
    };

    DesignPatterns.AppointmentObserver = {
        eventBus: appointmentEventBus,
        createBadgeObserver: createBadgeObserver,
        createToastObserver: createToastObserver,
        publishFromPatternResult: publishFromPatternResult
    };
})(window);
