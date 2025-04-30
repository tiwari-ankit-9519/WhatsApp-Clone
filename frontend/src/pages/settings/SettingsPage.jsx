import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModeToggle } from "@/components/ModeToggle";
import { toast } from "react-hot-toast";
import { useSocketContext } from "../../contexts/SocketContext";
import { useSettings } from "../../hooks/useSettings";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Volume2,
  Lock,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
} from "lucide-react";

function SettingsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isConnected } = useSocketContext();
  const {
    notifications,
    messageSound,
    readReceipts,
    typingIndicator,
    setNotifications,
    setMessageSound,
    setReadReceipts,
    setTypingIndicator,
    requestNotificationPermission,
    playNotificationSound,
  } = useSettings();

  // Toggle handlers with notifications
  const handleNotificationsChange = async (checked) => {
    setNotifications(checked);
    if (checked) {
      // Request notification permission if needed
      const granted = await requestNotificationPermission();
      if (granted) {
        toast.success("Notifications enabled");
      } else {
        toast.error("Notification permission denied by browser");
      }
    } else {
      toast.success("Notifications disabled");
    }
  };

  const handleMessageSoundChange = (checked) => {
    setMessageSound(checked);
    toast.success(
      checked ? "Message sounds enabled" : "Message sounds disabled"
    );

    // Play a test sound if enabled
    if (checked) {
      playNotificationSound();
    }
  };

  const handleReadReceiptsChange = (checked) => {
    setReadReceipts(checked);
    toast.success(checked ? "Read receipts enabled" : "Read receipts disabled");

    // Update socket server about read receipt preference change
    if (isConnected) {
      // This would ideally call a socket or API method to update server settings
      console.log("Updated read receipts setting on server:", checked);
    }
  };

  const handleTypingIndicatorChange = (checked) => {
    setTypingIndicator(checked);
    toast.success(
      checked ? "Typing indicator enabled" : "Typing indicator disabled"
    );

    // Update socket server about typing indicator preference
    if (isConnected) {
      // This would ideally call a socket or API method to update server settings
      console.log("Updated typing indicator setting on server:", checked);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 divide-y divide-border">
          {/* Appearance Section */}
          <div className="py-4">
            <h3 className="px-2 text-sm font-medium text-muted-foreground mb-3">
              Appearance
            </h3>

            <div className="px-2 py-4 flex items-center justify-between bg-card/20 rounded-lg mb-2">
              <div className="flex items-center gap-4">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === "dark"
                      ? "Dark mode"
                      : theme === "light"
                      ? "Light mode"
                      : "System default"}
                  </p>
                </div>
              </div>
              <ModeToggle />
            </div>
          </div>

          {/* Notifications Section */}
          <div className="py-4">
            <h3 className="px-2 text-sm font-medium text-muted-foreground mb-3">
              Notifications
            </h3>

            <div className="space-y-3">
              <div className="px-2 py-4 flex items-center justify-between bg-card/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Show notifications for new messages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleNotificationsChange}
                />
              </div>

              <div className="px-2 py-4 flex items-center justify-between bg-card/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Message Sounds</p>
                    <p className="text-sm text-muted-foreground">
                      Play sound when receiving messages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={messageSound}
                  onCheckedChange={handleMessageSoundChange}
                />
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="py-4">
            <h3 className="px-2 text-sm font-medium text-muted-foreground mb-3">
              Privacy
            </h3>

            <div className="space-y-3">
              <div className="px-2 py-4 flex items-center justify-between bg-card/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Read receipts</p>
                    <p className="text-sm text-muted-foreground">
                      Let others know when you've read their messages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={readReceipts}
                  onCheckedChange={handleReadReceiptsChange}
                />
              </div>

              <div className="px-2 py-4 flex items-center justify-between bg-card/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Typing indicator</p>
                    <p className="text-sm text-muted-foreground">
                      Show when you're typing a message
                    </p>
                  </div>
                </div>
                <Switch
                  checked={typingIndicator}
                  onCheckedChange={handleTypingIndicatorChange}
                />
              </div>

              <div
                className="px-2 py-4 flex items-center justify-between cursor-pointer bg-card/20 rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => navigate("/settings/blocked")}
              >
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Blocked contacts</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your blocked contacts
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="py-4">
            <h3 className="px-2 text-sm font-medium text-muted-foreground mb-3">
              Help & Support
            </h3>

            <div className="space-y-3">
              <div
                className="px-2 py-4 flex items-center justify-between cursor-pointer bg-card/20 rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() =>
                  window.open("https://example.com/help", "_blank")
                }
              >
                <div className="flex items-center gap-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <p className="font-medium">Help Center</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div
                className="px-2 py-4 flex items-center justify-between cursor-pointer bg-card/20 rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() =>
                  window.open("https://example.com/privacy", "_blank")
                }
              >
                <div className="flex items-center gap-4">
                  <Info className="h-5 w-5 text-primary" />
                  <p className="font-medium">Privacy Policy</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div
                className="px-2 py-4 flex items-center justify-between cursor-pointer bg-card/20 rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() =>
                  window.open("https://example.com/terms", "_blank")
                }
              >
                <div className="flex items-center gap-4">
                  <Info className="h-5 w-5 text-primary" />
                  <p className="font-medium">Terms of Service</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="py-6">
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">ChatConnect</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground mt-2">
                © {new Date().getFullYear()} ChatConnect. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
