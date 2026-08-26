import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) return;

    // We only show banner if permission hasn't been asked yet
    if (Notification.permission === 'default') {
      // Delay showing the banner slightly so it isn't intrusive immediately on first load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "Enabled! 🎉",
        description: "You'll receive occasional funny updates from us.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "You can enable notifications later in your browser settings.",
        variant: "destructive"
      });
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-primary/20 p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-foreground">Enable Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Turn on notifications to get funny updates and jokes from Prachurjo!
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleEnable} className="w-full">
              Allow
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss} className="w-full">
              Later
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
