/**
 * Simple EventEmitter for browser environments
 * Provides basic event handling functionality
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @returns {EventEmitter} - For chaining
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Add an event listener (alias for on)
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @returns {EventEmitter} - For chaining
   */
  addEventListener(event, listener) {
    return this.on(event, listener);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   * @returns {EventEmitter} - For chaining
   */
  off(event, listener) {
    if (!this.events[event]) return this;

    const index = this.events[event].indexOf(listener);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }

    // Clean up empty arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }

    return this;
  }

  /**
   * Remove an event listener (alias for off)
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   * @returns {EventEmitter} - For chaining
   */
  removeEventListener(event, listener) {
    return this.off(event, listener);
  }

  /**
   * Add a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @returns {EventEmitter} - For chaining
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper.listener = listener;
    return this.on(event, onceWrapper);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   * @returns {boolean} - True if event had listeners
   */
  emit(event, ...args) {
    if (!this.events[event]) return false;

    // Create a copy to avoid issues if listeners modify the array
    const listeners = [...this.events[event]];

    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });

    return true;
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Event name (optional)
   * @returns {EventEmitter} - For chaining
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} - Number of listeners
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  /**
   * Get all event names
   * @returns {string[]} - Array of event names
   */
  eventNames() {
    return Object.keys(this.events);
  }

  /**
   * Get listeners for an event
   * @param {string} event - Event name
   * @returns {Function[]} - Array of listener functions
   */
  listeners(event) {
    return this.events[event] ? [...this.events[event]] : [];
  }

  /**
   * Get raw listeners for an event (including once wrappers)
   * @param {string} event - Event name
   * @returns {Function[]} - Array of listener functions
   */
  rawListeners(event) {
    return this.listeners(event);
  }
}
