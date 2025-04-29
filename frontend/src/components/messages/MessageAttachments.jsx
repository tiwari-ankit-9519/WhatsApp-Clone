import { useState } from "react";
import { File, Download, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "../ui/button";

const MessageAttachments = ({ message }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);

  const messageType = message.type;
  const url = message.content;
  const filename = url.split("/").pop().split("?")[0];

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleAudio = (audioElement) => {
    if (audioPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  switch (messageType) {
    case "IMAGE":
      return (
        <div className="message-attachment-image">
          <img
            src={url}
            alt="Image attachment"
            className="rounded-md max-h-72 cursor-pointer"
            onClick={() => window.open(url, "_blank")}
          />
          {message.content && <p className="mt-1 text-sm">{message.content}</p>}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full h-7 w-7 p-0"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      );

    case "AUDIO":
      return (
        <div className="message-attachment-audio bg-accent/30 rounded-md p-3">
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
            >
              {audioPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex-1">
              <div className="text-sm font-medium truncate">{filename}</div>
              <audio src={url} className="hidden" />
              <div className="w-full bg-background rounded-full h-1.5 dark:bg-background">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      );

    case "DOCUMENT":
    default:
      return (
        <div className="message-attachment-document bg-accent/30 rounded-md p-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <File className="h-5 w-5 text-primary" />
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
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      );
  }
};

export default MessageAttachments;
