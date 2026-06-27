import React, { useState } from "react";
import { Activity, Flag, Info, Settings, Sparkles, Cpu, Send, Zap, HelpCircle } from "lucide-react";
import { CapturedFrame, ClubType, Handiness, AnalysisResult } from "./types";
import { SAMPLE_ANALYSIS } from "./data/mockGolfData";
import VideoScanner from "./components/VideoScanner";
import SkeletonCanvas from "./components/SkeletonCanvas";
import AnalysisDashboard from "./components/AnalysisDashboard";
import TipSection from "./components/TipSection";

// Default blank frames initialization
const INITIAL_FRAMES: CapturedFrame[] = [
  {
    id: "address",
    label: "어드레스 (Address)",
    description: "척추 각도, 무릎의 굽힘 정도, 양팔과 클럽의 정렬을 확인하는 준비 단계",
    timestamp: 0,
    imageDataUrl: null,
  },
  {
    id: "backswing",
    label: "백스윙 탑 (Backswing)",
    description: "테이크어웨이 경로와 백스윙 정점(Top)에서의 균형과 어깨 꼬임을 체크하는 단계",
    timestamp: 0,
    imageDataUrl: null,
  },
  {
    id: "impact",
    label: "임팩트 (Impact)",
    description: "공이 맞는 순간 클럽 페이스 정렬, 체중 이동, 시선 헤드업 여부를 확인하는 핵심 단계",
    timestamp: 0,
    imageDataUrl: null,
  },
  {
    id: "finish",
    label: "피니시 (Finish)",
    description: "스윙 종료 후 왼발에 완벽히 체중이 실렸는지, 흔들림 없이 서 있는지 평가하는 마무리 단계",
    timestamp: 0,
    imageDataUrl: null,
  },
];

export default function App() {
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>(INITIAL_FRAMES);
  const [clubType, setClubType] = useState<ClubType>("iron");
  const [handiness, setHandiness] = useState<Handiness>("right");
  const [userNotes, setUserNotes] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<"address" | "backswing" | "impact" | "finish">("address");

  // Handle active frame choice
  const activeFrame = capturedFrames.find((f) => f.id === activeFrameId) || capturedFrames[0];

  // Callback: Frame update (from canvas drawings)
  const handleUpdateFrameImage = (id: string, newDataUrl: string) => {
    setCapturedFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, imageDataUrl: newDataUrl } : f))
    );
  };

  // Callback: Video load
  const handleVideoLoaded = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null); // Reset past analyses
  };

  // Call backend to perform technical analysis
  const handleAnalyzeSwing = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Validate that we have at least captured something
      const capturedCount = capturedFrames.filter((f) => f.imageDataUrl !== null).length;
      if (capturedCount < 2) {
        throw new Error(
          "골프 컴퓨터 비전 분석을 위해 최소 2개 이상의 핵심 스윙 단계를 캡처하고 고정해 주세요. (가장 정확한 결과는 4단계를 모두 캡처할 때 나옵니다!)"
        );
      }

      // We only send base64 image data URLs for captured frames
      const framesToSend = capturedFrames.map((f) => f.imageDataUrl);

      const response = await fetch("/api/analyze-swing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frames: framesToSend,
          clubType,
          handiness,
          userNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "스윙 분석 서버 API 호출에 실패했습니다.");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error: any) {
      console.error("Analysis Failed:", error);
      setErrorMsg(error.message || "스윙 분석 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Demo Experience (extremely useful when user doesn't have a video handy)
  const handleLoadDemoExperience = () => {
    setErrorMsg(null);
    setIsLoading(true);

    // Generate mock base64 placeholders to fill the skeleton canvas
    // These placeholder silhouettes represent a golfer's swing state
    const createPlaceholderSvg = (stepId: string) => {
      const colors: { [key: string]: string } = {
        address: "#3B82F6",
        backswing: "#F59E0B",
        impact: "#EF4444",
        finish: "#10B981",
      };
      const color = colors[stepId] || "#10B981";

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
          <rect width="100%" height="100%" fill="#F1F5F9"/>
          <defs>
            <linearGradient id="grid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E2E8F0" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.5"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          
          <!-- Golf floor -->
          <line x1="20" y1="260" x2="380" y2="260" stroke="#94A3B8" stroke-width="4"/>
          <circle cx="200" cy="260" r="4" fill="#64748B"/> <!-- ball -->

          <!-- Silhouette Golfer Representation (Drawn dynamically via paths) -->
          <text x="200" y="50" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748B" text-anchor="middle">
            [DEMO MODE] ${stepId.toUpperCase()} FRAME
          </text>
          
          <!-- Simulating golfer stance -->
          ${
            stepId === "address"
              ? `
              <!-- Golfer skeleton lines -->
              <circle cx="190" cy="110" r="15" fill="#475569"/> <!-- head -->
              <line x1="190" y1="125" x2="185" y2="185" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- spine -->
              <line x1="190" y1="125" x2="165" y2="160" stroke="#475569" stroke-width="6" stroke-linecap="round"/> <!-- arm -->
              <line x1="185" y1="185" x2="175" y2="225" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- leg -->
              <line x1="175" y1="225" x2="185" y2="260" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- lower leg -->
              <!-- shaft -->
              <line x1="165" y1="160" x2="198" y2="258" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
              `
              : stepId === "backswing"
              ? `
              <!-- Golfer skeleton lines -->
              <circle cx="192" cy="110" r="15" fill="#475569"/> <!-- head -->
              <line x1="192" y1="125" x2="190" y2="185" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- spine -->
              <line x1="192" y1="125" x2="220" y2="90" stroke="#475569" stroke-width="6" stroke-linecap="round"/> <!-- arm -->
              <line x1="190" y1="185" x2="180" y2="225" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- leg -->
              <line x1="180" y1="225" x2="190" y2="260" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- lower leg -->
              <!-- shaft -->
              <line x1="220" y1="90" x2="150" y2="130" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
              `
              : stepId === "impact"
              ? `
              <!-- Golfer skeleton lines -->
              <circle cx="188" cy="112" r="15" fill="#475569"/> <!-- head -->
              <line x1="188" y1="127" x2="175" y2="185" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- spine -->
              <line x1="188" y1="127" x2="178" y2="175" stroke="#475569" stroke-width="6" stroke-linecap="round"/> <!-- arm -->
              <line x1="175" y1="185" x2="168" y2="225" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- leg -->
              <line x1="168" y1="225" x2="175" y2="260" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- lower leg -->
              <!-- shaft -->
              <line x1="178" y1="175" x2="199" y2="259" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
              `
              : `
              <!-- Golfer skeleton lines -->
              <circle cx="170" cy="108" r="15" fill="#475569"/> <!-- head -->
              <line x1="170" y1="123" x2="162" y2="180" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- spine -->
              <line x1="170" y1="123" x2="140" y2="110" stroke="#475569" stroke-width="6" stroke-linecap="round"/> <!-- arm -->
              <line x1="162" y1="180" x2="158" y2="220" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- leg -->
              <line x1="158" y1="220" x2="160" y2="260" stroke="#475569" stroke-width="8" stroke-linecap="round"/> <!-- lower leg -->
              <!-- shaft -->
              <line x1="140" y1="110" x2="190" y2="150" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
              `
          }

          <!-- HUD graphic guide lines -->
          <circle cx="200" cy="200" r="120" stroke="${color}" stroke-opacity="0.15" stroke-width="1" fill="none"/>
          <line x1="200" y1="80" x2="200" y2="320" stroke="${color}" stroke-opacity="0.15" stroke-width="1" stroke-dasharray="2,2"/>
        </svg>
      `;

      // Convert SVG code directly to a safe inline Base64 Image url
      const base64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${base64}`;
    };

    // Simulate standard delay for deep analysis
    setTimeout(() => {
      const demoFrames = INITIAL_FRAMES.map((f) => ({
        ...f,
        imageDataUrl: createPlaceholderSvg(f.id),
        timestamp: f.id === "address" ? 0.5 : f.id === "backswing" ? 2.1 : f.id === "impact" ? 3.4 : 4.8,
      }));

      setCapturedFrames(demoFrames);
      setAnalysisResult(SAMPLE_ANALYSIS);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Professional Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                AI 골프 스윙 정밀 분석기
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  PRO VISION
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">
                세계적인 골프 전문가 x 최첨단 컴퓨터 비전 분석 솔루션
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemoExperience}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm"
              title="동영상이 없을 때 바로 AI 분석 결과를 확인하려면 클릭하세요!"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              데모 분석 즉시 체험
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-[10px] font-mono text-gray-500 px-2.5 py-1">
              STATUS: <span className="text-emerald-600 font-bold ml-1">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Media Capture & Vision Editor (Spans 7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Video Scanner (Capture) */}
            <VideoScanner
              onFramesCaptured={setCapturedFrames}
              onVideoLoaded={handleVideoLoaded}
              capturedFrames={capturedFrames}
            />

            {/* 2. Swing Information Setup Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4 pb-3 border-b border-gray-50">
                <Settings className="w-4 h-4 text-emerald-600" />
                분석 클럽 & 스윙 환경 설정
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Club selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    🏌️‍♂️ 사용 클럽 종류
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "driver", label: "드라이버" },
                      { value: "iron", label: "아이언" },
                      { value: "wood_utility", label: "우드/유틸" },
                      { value: "wedge", label: "웨지/숏게임" },
                    ].map((club) => (
                      <button
                        key={club.value}
                        onClick={() => setClubType(club.value as ClubType)}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          clubType === club.value
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {club.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Handiness (Direction) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    👋 스윙 방향
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setHandiness("right")}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        handiness === "right"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      오른손잡이 (우타)
                    </button>
                    <button
                      onClick={() => setHandiness("left")}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        handiness === "left"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      왼손잡이 (좌타)
                    </button>
                  </div>
                </div>
              </div>

              {/* Special user notes */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  📝 개인 스윙 고민 또는 코치 질문 사항 (선택)
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="예: 백스윙에서 치킨윙(슬라이스)이 걱정됩니다! 또는 피니시가 항상 오른쪽으로 무너져요."
                  className="w-full h-16 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/20 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* 3. Skeleton / Drawing Editor for Frames */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                인터랙티브 분석기 스튜디오
              </span>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                아래 탭을 눌러 캡처된 개별 단계를 선택하고 가이드라인을 직접 보정해 보실 수 있습니다.
              </p>

              {/* 4 Tabs switcher */}
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {capturedFrames.map((frame) => {
                  const isActive = activeFrameId === frame.id;
                  const isCaptured = !!frame.imageDataUrl;

                  return (
                    <button
                      key={frame.id}
                      onClick={() => setActiveFrameId(frame.id as any)}
                      className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg border text-center transition-all cursor-pointer truncate ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : isCaptured
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/60"
                          : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {frame.label.split(" ")[0]} {isCaptured ? "✅" : ""}
                    </button>
                  );
                })}
              </div>

              <SkeletonCanvas frame={activeFrame} onUpdateFrameImage={handleUpdateFrameImage} />
            </div>

            {/* Error messaging Banner */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-800">
                <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">스윙 분석 시작 조건 불충분</h4>
                  <p className="text-[11px] text-red-600 leading-relaxed mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Trigger AI analysis Button */}
            <div className="pt-2">
              <button
                onClick={handleAnalyzeSwing}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-100 transition-all cursor-pointer`}
              >
                <Cpu className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "컴퓨터 비전 및 AI 정밀 분석 중..." : "AI 정밀 스윙 분석 시작"}
              </button>
            </div>

          </div>

          {/* RIGHT SIDE: Realtime Dashboard & Guide standards (Spans 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Realtime Dashboard (Scores, Gauge telemetry, and Markdown) */}
            <AnalysisDashboard result={analysisResult} isLoading={isLoading} />

            {/* 2. Visual standards & coaching reference tips */}
            <TipSection />

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-8 text-center">
        <p className="text-xs text-gray-400">
          © 2026 AI Golf Swing Pro Vision. Powered by Gemini-3.5-Flash Computer Vision. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
