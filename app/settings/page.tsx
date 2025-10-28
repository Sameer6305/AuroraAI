'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  savePushSubscription,
  removePushSubscription,
  updateNotificationPreferences,
  sendTestNotification,
} from '@/lib/notifications';

export default function SettingsPage() {
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMode, setNotificationMode] = useState<'app-only' | 'always'>('app-only');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userId, setUserId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    // Check if notifications are supported
    setNotificationSupported(isNotificationSupported());
    setNotificationPermission(getNotificationPermission());

    // Get authenticated user ID
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Load user preferences from database
        const { data: userData } = await supabase
          .from('users')
          .select('notification_enabled, notification_mode')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData) {
          setNotificationsEnabled(userData.notification_enabled || false);
          setNotificationMode((userData.notification_mode as 'app-only' | 'always') || 'app-only');
        }
      }
    }
    loadUser();
  }, [supabase]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEnableNotifications = async () => {
    if (!notificationSupported) {
      showMessage('error', 'Notifications are not supported in your browser');
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        showMessage('error', 'Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(registration);

      // Save subscription to backend
      await savePushSubscription(subscription);

      // Update preferences
      await updateNotificationPreferences({
        enabled: true,
        mode: notificationMode,
      });

      setNotificationsEnabled(true);
      showMessage('success', 'Notifications enabled successfully! 🎉');
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      showMessage('error', 'Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      // Unsubscribe from push notifications
      await unsubscribeFromPushNotifications();

      // Remove subscription from backend
      await removePushSubscription();

      // Update preferences
      await updateNotificationPreferences({
        enabled: false,
        mode: notificationMode,
      });

      setNotificationsEnabled(false);
      showMessage('success', 'Notifications disabled');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      showMessage('error', 'Failed to disable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: 'app-only' | 'always') => {
    setNotificationMode(mode);

    if (notificationsEnabled) {
      try {
        await updateNotificationPreferences({
          enabled: true,
          mode,
        });
        showMessage('success', `Notification mode updated to ${mode === 'app-only' ? 'App Only' : 'Always'}`);
      } catch (error) {
        console.error('Failed to update notification mode:', error);
        showMessage('error', 'Failed to update notification mode');
      }
    }
  };

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      showMessage('error', 'Please enable notifications first');
      return;
    }

    setIsLoading(true);
    try {
      await sendTestNotification();
      showMessage('success', 'Test notification sent! Check your notifications.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      showMessage('error', 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a1a] to-[#1a0a2e] text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent via-[#00dddd] to-[#00ffaa] text-transparent bg-clip-text mb-2">
            Settings
          </h1>
          <p className="text-gray-400">Manage your notification preferences</p>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Notification Support Check */}
        {!notificationSupported && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-yellow-400">
            <p className="font-semibold mb-1">⚠️ Notifications Not Supported</p>
            <p className="text-sm">Your browser doesn&apos;t support push notifications. Try using Chrome, Firefox, or Edge.</p>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-8">
          
          {/* Enable/Disable Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-1">Push Notifications</h2>
                <p className="text-sm text-gray-400">Get reminded to reflect on your day</p>
              </div>
              <button
                onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
                disabled={!notificationSupported || isLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  notificationsEnabled
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                    : 'bg-accent text-black hover:shadow-lg hover:shadow-accent/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : notificationsEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {notificationPermission === 'denied' && (
              <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                <p className="font-semibold mb-1">Permission Denied</p>
                <p>You&apos;ve blocked notifications. Please enable them in your browser settings.</p>
              </div>
            )}
          </div>

          {/* Notification Mode */}
          <div className={notificationsEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Notification Mode</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-4 p-4 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="radio"
                  name="notification-mode"
                  value="app-only"
                  checked={notificationMode === 'app-only'}
                  onChange={() => handleModeChange('app-only')}
                  disabled={!notificationsEnabled}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-gray-200">Only When Using App</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Receive notifications only when you have the app open (recommended for battery life)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="radio"
                  name="notification-mode"
                  value="always"
                  checked={notificationMode === 'always'}
                  onChange={() => handleModeChange('always')}
                  disabled={!notificationsEnabled}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-gray-200">Always</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Receive notifications even when the app is closed (requires background sync)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Test Notification */}
          <div>
            <button
              onClick={handleTestNotification}
              disabled={!notificationsEnabled || isLoading}
              className="w-full py-3 px-6 bg-white/5 border border-gray-700/50 rounded-lg text-gray-300 font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test Notification
            </button>
          </div>

          {/* Reminder Schedule Info */}
          <div className="pt-6 border-t border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Reminder Schedule</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>📅 Daily reminder at <span className="text-accent font-semibold">11:30 PM IST</span></p>
              <p>🌙 Message: &quot;Reflect on your day&quot;</p>
              <p>✨ Only sent if you haven&apos;t submitted a reflection today</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
