import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ModeToggle";
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

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [messageSound, setMessageSound] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-1 divide-y divide-border">
          {/* Appearance Section */}
          <div className="py-3">
            <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2">
              Appearance
            </h3>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
          <div className="py-3">
            <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2">
              Notifications
            </h3>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                onCheckedChange={setMessageSound}
              />
            </div>
          </div>

          {/* Privacy Section */}
          <div className="py-3">
            <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2">
              Privacy
            </h3>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                onCheckedChange={setReadReceipts}
              />
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                onCheckedChange={setTypingIndicator}
              />
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50"
              onClick={() => navigate("/settings/blocked")}
            >
              <div className="flex items-center gap-3">
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

          {/* Help & Support Section */}
          <div className="py-3">
            <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2">
              Help & Support
            </h3>

            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50"
              onClick={() => window.open("https://example.com/help", "_blank")}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <p className="font-medium">Help Center</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50"
              onClick={() =>
                window.open("https://example.com/privacy", "_blank")
              }
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary" />
                <p className="font-medium">Privacy Policy</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50"
              onClick={() => window.open("https://example.com/terms", "_blank")}
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary" />
                <p className="font-medium">Terms of Service</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* App Info */}
          <div className="py-3">
            <div className="px-4 py-2 text-center">
              <p className="text-sm text-muted-foreground">ChatConnect</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground mt-1">
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
