import React, { useRef, useState, useEffect } from "react";
import { Upload, Play, Pause, RotateCcw, Video, Camera, Zap, Sliders } from "lucide-react";
import { CapturedFrame } from "../types";

interface VideoScannerProps {
  onFramesCaptured: (frames: CapturedFrame[]) => void;
  onVideoLoaded: (file: File) => void;
  capturedFrames: CapturedFrame[];
}

export default function VideoScanner({ onFramesCaptured, onVideoLoaded, capturedFrames }: VideoScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"address" | "backswing" | "impact" | "finish">("address");

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}:${parseFloat(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideo(file);
    }
  };

  const loadVideo = (file: File) => {
    setVideoFile(file);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    onVideoLoaded(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      loadVideo(file);
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update time tracker
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Speed adjust
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Scrub timeline
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // Single Frame Capture Action
  const captureCurrentFrame = (targetId: "address" | "backswing" | "impact" | "finish") => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match resolution of the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const dataUrl = canvas.toDataURL("image/png");

    // Update specific frame in state
    const updatedFrames = capturedFrames.map((frame) => {
      if (frame.id === targetId) {
        return {
          ...frame,
          timestamp: video.currentTime,
          imageDataUrl: dataUrl,
        };
      }
      return frame;
    });

    onFramesCaptured(updatedFrames);

    // Move to next tab automatically for smooth user UX
    const order: Array<"address" | "backswing" | "impact" | "finish"> = [
      "address",
      "backswing",
      "impact",
      "finish",
    ];
    const currentIndex = order.indexOf(targetId);
    if (currentIndex < order.length - 1) {
      setActiveTab(order[currentIndex + 1]);
    }
  };

  // Automatic Frame Detection / Splitting (Simulated Intelligent Splitting)
  const autoDetectAndCapture = () => {
    const video = videoRef.current;
    if (!video || !duration) return;

    // Define smart relative timestamps for golf swing
    // In a standard 5s golf swing video:
    // Address is near the beginning (15%), Backswing Peak is around (45%), Impact is around (60%), Finish is at the end (85%)
    const relativeTimes = {
      address: duration * 0.15,
      backswing: duration * 0.45,
      impact: duration * 0.60,
      finish: duration * 0.85,
    };

    const keys: Array<"address" | "backswing" | "impact" | "finish"> = [
      "address",
      "backswing",
      "impact",
      "finish",
    ];

    const tempFrames = [...capturedFrames];

    // Helper to capture recursively on seek complete
    let index = 0;
    const seekAndCapture = () => {
      if (index >= keys.length) {
        onFramesCaptured(tempFrames);
        video.currentTime = relativeTimes.address; // Return to address for preview
        return;
      }

      const key = keys[index];
      const targetTime = relativeTimes[key];

      video.currentTime = targetTime;

      // Wait until video seek operation finishes
      const onSeeked = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/png");

            const frameIdx = tempFrames.findIndex((f) => f.id === key);
            if (frameIdx !== -1) {
              tempFrames[frameIdx] = {
                ...tempFrames[frameIdx],
                timestamp: targetTime,
                imageDataUrl: dataUrl,
              };
            }
          }
        }
        video.removeEventListener("seeked", onSeeked);
        index++;
        seekAndCapture(); // Capture next
      };

      video.addEventListener("seeked", onSeeked);
    };

    seekAndCapture();
  };

  // Cleanup Object URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-600" />
            스윙 비디오 제어 및 프레임 캡처
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            영상을 올려 슬로우 모션으로 감상하고, 각 구간별 최고의 스윙 스냅샷을 캡처해 고정하세요.
          </p>
        </div>
        {videoUrl && (
          <button
            onClick={autoDetectAndCapture}
            className="mt-3 md:mt-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            AI 프레임 자동 추출
          </button>
        )}
      </div>

      {/* Hidden Canvas for extracting video frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File Upload Box */}
      {!videoUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            여기에 골프 스윙 비디오를 끌어다 놓으세요
          </p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-sm leading-relaxed">
            또는 마우스로 클릭하여 컴퓨터에서 선택하세요. (.mp4, .mov, .avi 등 지원)
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              어드레스 분석
            </span>
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              백스윙 궤적
            </span>
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              임팩트 각도
            </span>
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              피니시 밸런스
            </span>
          </div>
        </div>
      ) : (
        /* Video Player Area */
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {/* The Video Element Container */}
            <div className="relative rounded-xl bg-gray-900 aspect-video overflow-hidden border border-gray-800">
              <video
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
                playsInline
              />
              {/* Playback rate indicator overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded">
                SPEED: {playbackRate}x
              </div>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Video Controls Panel */}
            <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
              {/* Scrub Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-500">0:00</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSliderChange}
                  className="flex-1 accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-500">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200/60">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                    title={isPlaying ? "일시정지" : "재생"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }
                    }}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                    title="처음으로 되돌리기"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                  {[0.25, 0.5, 0.75, 1.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        playbackRate === rate
                          ? "bg-emerald-600 text-white"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {rate === 1.0 ? "정속" : `${rate}x`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setIsPlaying(false);
                    setCurrentTime(0);
                    // Clear captured frame images too
                    onFramesCaptured(
                      capturedFrames.map((f) => ({ ...f, imageDataUrl: null }))
                    );
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  비디오 변경
                </button>
              </div>
            </div>
          </div>

          {/* Quick Capture Dashboard (Right column) */}
          <div className="w-full lg:w-72 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                스윙 프레임 캡처 보드
              </span>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                비디오를 정지하거나 재생하면서 해당하는 스윙 순간에서 아래 버튼을 눌러 고정 프레임으로 캡처하세요.
              </p>

              {/* Tabs list for frames */}
              <div className="flex flex-col gap-2 mt-4">
                {capturedFrames.map((frame) => {
                  const isActive = activeTab === frame.id;
                  const hasImage = !!frame.imageDataUrl;

                  return (
                    <div
                      key={frame.id}
                      onClick={() => setActiveTab(frame.id)}
                      className={`relative flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/20"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="relative w-12 h-8 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0">
                          {hasImage ? (
                            <img
                              src={frame.imageDataUrl!}
                              alt={frame.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[9px] font-bold text-gray-400">
                              미지정
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {frame.label}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {hasImage ? `캡처됨 (${frame.timestamp.toFixed(1)}s)` : "캡처 필요"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          captureCurrentFrame(frame.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          hasImage
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                            : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                        }`}
                        title={`${frame.label} 캡처하기`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => captureCurrentFrame(activeTab)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                선택된 [{capturedFrames.find((f) => f.id === activeTab)?.label}] 캡처 고정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
