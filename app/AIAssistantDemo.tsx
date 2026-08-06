"use client";

import { useEffect, useRef, useState } from "react";

export default function AIAssistantDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const stop = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("ended", stop);
    audio.addEventListener("pause", stop);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("ended", stop);
      audio.removeEventListener("pause", stop);
    };
  }, []);

  const toggleAssistant = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
    }
  };

  const replay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    await audio.play();
    setIsPlaying(true);
  };

  return (
    <section className={`ai-preview ${isPlaying ? "assistant-speaking" : ""}`}>
      <div className="ai-bot-lockup" aria-hidden="true">
        <div className="ai-preview-bot">
          <i className="bot-ear bot-ear-left" />
          <i className="bot-ear bot-ear-right" />
          <i className="bot-eye bot-eye-left" />
          <i className="bot-eye bot-eye-right" />
          <b className="bot-mouth" />
        </div>
        <span className="ai-side-label">AI</span>
      </div>

      <div className="ai-preview-copy">
        <p className="wascik-eyebrow">COMING TO WASCIK</p>
        <h2>An AI representative that feels like part of your business.</h2>
        <p>We&apos;re developing a more personal kind of website assistant: a branded on-screen character that can welcome visitors, answer common questions, guide them toward the right service, collect leads, and help connect them with a real person when needed.</p>
        <div className="ai-capabilities"><span>24/7 first response</span><span>Custom business knowledge</span><span>Human handoff</span></div>
      </div>

      <div className="ai-speech" aria-live="polite">
        <strong>{isPlaying ? "Your WASCIK assistant is speaking…" : "Meet the future of personal website support."}</strong>
        <p className="assistant-caption">{isPlaying ? "Listen to how an on-screen assistant can welcome visitors and introduce your business." : "Tap below to hear the assistant introduction."}</p>
        <div className="assistant-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
        <button className="assistant-learn-button" type="button" onClick={toggleAssistant}>
          {isPlaying ? "Pause Assistant" : progress > 0 ? "Continue Assistant" : "Learn About My Assistant"}
        </button>
        {progress > 0 && <button className="assistant-replay-button" type="button" onClick={replay}>Replay</button>}
        <audio ref={audioRef} src="/wascik-ai-assistant.mp3" preload="metadata" />
      </div>
    </section>
  );
}
