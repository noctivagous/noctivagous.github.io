/**
 * Notification Overlay - Handles flash notifications and messages
 */
import { COLORS, Z_INDEX } from '../../config/index.js';

export class NotificationOverlay {
  constructor() {
    this.notifications = [];
    this.notificationContainer = null;
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds
   */
  show(message, type = 'info', duration = 3000) {
    this.createNotificationContainer();
    
    const notification = this.createNotification(message, type);
    this.notificationContainer.appendChild(notification);
    this.notifications.push(notification);

    // Auto-hide after duration
    setTimeout(() => {
      this.hideNotification(notification);
    }, duration);
  }

  /**
   * Create notification container if it doesn't exist
   */
  createNotificationContainer() {
    if (this.notificationContainer) return;

    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: ${Z_INDEX.MESSAGE_BOX};
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    document.body.appendChild(this.notificationContainer);
  }

  /**
   * Create notification element
   * @param {string} message
   * @param {string} type
   * @returns {Element}
   */
  createNotification(message, type) {
    const notification = document.createElement('div');
    
    const backgroundColor = this.getBackgroundColor(type);
    const textColor = COLORS.TEXT_WHITE_PRIMARY;

    notification.style.cssText = `
      background: ${backgroundColor};
      color: ${textColor};
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px ${COLORS.NOTIFICATION_SHADOW};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
    `;

    notification.textContent = message;

    // Add click to dismiss
    notification.addEventListener('click', () => {
      this.hideNotification(notification);
    });

    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    return notification;
  }

  /**
   * Get background color for notification type
   * @param {string} type
   * @returns {string}
   */
  getBackgroundColor(type) {
    switch (type) {
      case 'success':
        return COLORS.NOTIFICATION_SUCCESS;
      case 'error':
        return COLORS.NOTIFICATION_ERROR;
      case 'warning':
        return COLORS.NOTIFICATION_WARNING;
      case 'info':
      default:
        return COLORS.NOTIFICATION_INFO;
    }
  }

  /**
   * Hide specific notification
   * @param {Element} notification
   */
  hideNotification(notification) {
    if (!notification || !notification.parentNode) return;

    // Animate out
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      
      // Remove from notifications array
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }

      // Remove container if no notifications left
      if (this.notifications.length === 0 && this.notificationContainer) {
        this.notificationContainer.remove();
        this.notificationContainer = null;
      }
    }, 300);
  }

  /**
   * Show flash notification (quick visual feedback)
   * @param {string} message
   * @param {string} backgroundColor
   */
  showFlash(message, backgroundColor = COLORS.NOTIFICATION_INFO) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${backgroundColor};
      color: ${COLORS.TEXT_WHITE_PRIMARY};
      padding: 16px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      z-index: ${Z_INDEX.MESSAGE_BOX};
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
      transition: all 0.2s ease;
      pointer-events: none;
    `;

    flash.textContent = message;
    document.body.appendChild(flash);

    // Animate in
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      flash.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Auto-hide after short duration
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        flash.remove();
      }, 200);
    }, 1500);
  }

  /**
   * Hide all notifications
   */
  hideAll() {
    this.notifications.forEach(notification => {
      this.hideNotification(notification);
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hideAll();
    
    if (this.notificationContainer) {
      this.notificationContainer.remove();
      this.notificationContainer = null;
    }
    
    this.notifications = [];
  }
}
