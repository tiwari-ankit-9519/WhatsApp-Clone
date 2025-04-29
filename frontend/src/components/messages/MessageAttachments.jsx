import { useState } from "react";
import {
  File,
  Download,
  Play,
  Pause,
  Volume2,
  UploadCloud,
} from "lucide-react";
import { Button } from "../ui/button";

const MessageAttachments = ({ message }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);

  const messageType = message.type;
  const url = message.content;

  // Get the filename or a default for display purposes
  const getDisplayName = () => {
    if (!url || typeof url !== "string") return "File";

    // Check if it's a URL
    try {
      if (url.startsWith("http") || url.startsWith("blob:")) {
        // Extract filename from URL without displaying the full URL
        const urlParts = url.split("/");
        let filename = urlParts[urlParts.length - 1].split("?")[0];

        // Remove any URL encoding
        filename = decodeURIComponent(filename);

        // If it's a long URL-looking string, just return a generic name based on type
        if (
          filename.length > 30 ||
          filename.includes("cloudinary") ||
          filename.includes(".com")
        ) {
          switch (messageType) {
            case "IMAGE":
              return "Photo";
            case "AUDIO":
              return "Audio";
            case "DOCUMENT":
              return "Document";
            default:
              return "File";
          }
        }

        return filename;
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }

    // Default values when URL parsing fails
    switch (messageType) {
      case "IMAGE":
        return "Photo";
      case "AUDIO":
        return "Audio";
      case "DOCUMENT":
        return "Document";
      default:
        return "File";
    }
  };

  const filename = getDisplayName();
  const isUploading = message.isUploading || message.isOptimistic;

  const handleDownload = () => {
    // Don't allow download for optimistic messages
    if (isUploading || !url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleAudio = (audioElement) => {
    if (isUploading) return;

    if (audioPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  // Loading overlay for uploading files
  const renderLoadingOverlay = () => {
    if (!isUploading) return null;

    return (
      <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <span className="text-xs">Uploading...</span>
        </div>
      </div>
    );
  };

  switch (messageType) {
    case "IMAGE":
      return (
        <div className="message-attachment-image relative">
          <img
            src={url}
            alt="Image attachment"
            className={`rounded-md max-h-72 cursor-pointer ${
              isUploading ? "opacity-70" : ""
            }`}
            onClick={() => !isUploading && window.open(url, "_blank")}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full h-7 w-7 p-0"
            onClick={handleDownload}
            disabled={isUploading}
          >
            <Download className="h-3 w-3" />
          </Button>
          {renderLoadingOverlay()}
        </div>
      );

    case "AUDIO":
      return (
        <div className="message-attachment-audio bg-accent/30 rounded-md p-3 relative">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={(e) => {
                const audio =
                  e.currentTarget.parentElement.querySelector("audio");
                toggleAudio(audio);
              }}
              disabled={isUploading}
            >
              {audioPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex-1">
              <div className="text-sm font-medium truncate">Audio Message</div>
              <audio src={url} className="hidden" />
              <div className="w-full bg-background rounded-full h-1.5 dark:bg-background">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: isUploading ? "5%" : "45%" }}
                ></div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              disabled={isUploading}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {renderLoadingOverlay()}
        </div>
      );

    case "DOCUMENT":
    default:
      return (
        <div className="message-attachment-document bg-accent/30 rounded-md p-3 relative">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              {isUploading ? (
                <UploadCloud className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <File className="h-5 w-5 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{filename}</div>
              <div className="text-xs text-muted-foreground">Document</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              disabled={isUploading}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {renderLoadingOverlay()}
        </div>
      );
  }
};

export default MessageAttachments;
