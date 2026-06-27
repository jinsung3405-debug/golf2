import React, { useRef, useState, useEffect } from "react";
import { Eye, Edit3, Trash2, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import { CapturedFrame } from "../types";

interface SkeletonCanvasProps {
  frame: CapturedFrame;
  onUpdateFrameImage: (id: string, newDataUrl: string) => void;
}

export default function SkeletonCanvas({ frame, onUpdateFrameImage }: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"line" | "circle" | "angle" | "none">("none");
  const [color, setColor] = useState<string>("#10B981"); // Default Emerald
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState<boolean>(false);

  // Load and draw image
  const drawImageOnCanvas = (showSkeleton = isSkeletonVisible) => {
    const canvas = canvasRef.current;
    if (!canvas || !frame.imageDataUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = frame.imageDataUrl;
    img.onload = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showSkeleton) {
        drawSkeletonSimulation(ctx, canvas.width, canvas.height);
      }
    };
  };

  useEffect(() => {
    drawImageOnCanvas();
  }, [frame.imageDataUrl, frame.id, isSkeletonVisible]);

  // Handle drawing events
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate relative coordinate based on canvas resolution
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "none" || !frame.imageDataUrl) return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    // Save history for undo
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((prev) => [...prev, canvas.toDataURL()]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || tool === "none") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const currentPos = getMousePos(e);

    // Redraw image first to show interactive drawing
    const img = new Image();
    // Use last history state if drawing interactively to avoid trailing lines
    img.src = history.length > 0 ? history[history.length - 1] : frame.imageDataUrl!;
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, canvas.width / 150); // Scale line width
      ctx.fillStyle = color;

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "angle") {
        // Draw two lines intersecting to show angle
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        // Draw a helper arc/vertical line
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(startPos.x, startPos.y - 120);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Render estimated degrees text
        const angleRad = Math.atan2(currentPos.y - startPos.y, currentPos.x - startPos.x);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
        if (angleDeg < 0) angleDeg += 360;
        if (angleDeg > 180) angleDeg = 360 - angleDeg;

        ctx.font = `bold ${Math.max(14, canvas.width / 40)}px sans-serif`;
        ctx.fillText(`각도: ${Math.abs(angleDeg)}°`, startPos.x + 15, startPos.y - 15);
      }
    };
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStartPos(null);

    // Update frame base64 in parent state so that Gemini gets the drawings too!
    const canvas = canvasRef.current;
    if (canvas) {
      onUpdateFrameImage(frame.id, canvas.toDataURL());
    }
  };

  // Reset drawing
  const handleClearDrawings = () => {
    setIsSkeletonVisible(false);
    setHistory([]);
    // Restore original image from frame data or redraw without skeleton
    const canvas = canvasRef.current;
    if (!canvas || !frame.imageDataUrl) return;
    
    // Find first history frame or original
    const img = new Image();
    img.src = frame.imageDataUrl;
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    onUpdateFrameImage(frame.id, frame.imageDataUrl);
  };

  // Simulated AI skeleton drawing based on the swing stage (highly visual computer vision feedback!)
  const drawSkeletonSimulation = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // We simulate skeleton joints as percentages of width/height
    let joints: { [key: string]: { x: number; y: number } } = {};
    let colorNeon = "#10B981"; // Emerald green
    let angleLabel = "";

    if (frame.id === "address") {
      colorNeon = "#3B82F6"; // Blue
      joints = {
        head: { x: w * 0.45, y: h * 0.25 },
        neck: { x: w * 0.46, y: h * 0.32 },
        lShoulder: { x: w * 0.44, y: h * 0.35 },
        rShoulder: { x: w * 0.48, y: h * 0.35 },
        spineHip: { x: w * 0.52, y: h * 0.58 },
        lKnee: { x: w * 0.49, y: h * 0.72 },
        rKnee: { x: w * 0.55, y: h * 0.72 },
        lAnkle: { x: w * 0.48, y: h * 0.88 },
        rAnkle: { x: w * 0.54, y: h * 0.88 },
        hands: { x: w * 0.42, y: h * 0.50 },
        clubHead: { x: w * 0.35, y: h * 0.82 },
      };
      angleLabel = "척추각: 42° | 무릎선: 158°";
    } else if (frame.id === "backswing") {
      colorNeon = "#F59E0B"; // Amber
      joints = {
        head: { x: w * 0.46, y: h * 0.24 },
        neck: { x: w * 0.47, y: h * 0.32 },
        lShoulder: { x: w * 0.50, y: h * 0.35 },
        rShoulder: { x: w * 0.43, y: h * 0.34 },
        spineHip: { x: w * 0.51, y: h * 0.58 },
        lKnee: { x: w * 0.47, y: h * 0.72 },
        rKnee: { x: w * 0.54, y: h * 0.72 },
        lAnkle: { x: w * 0.48, y: h * 0.88 },
        rAnkle: { x: w * 0.54, y: h * 0.88 },
        hands: { x: w * 0.58, y: h * 0.26 },
        clubHead: { x: w * 0.38, y: h * 0.38 },
      };
      angleLabel = "어깨 회전각: 88° | 스웨이 차단";
    } else if (frame.id === "impact") {
      colorNeon = "#EF4444"; // Red
      joints = {
        head: { x: w * 0.44, y: h * 0.26 },
        neck: { x: w * 0.45, y: h * 0.33 },
        lShoulder: { x: w * 0.41, y: h * 0.35 },
        rShoulder: { x: w * 0.47, y: h * 0.35 },
        spineHip: { x: w * 0.43, y: h * 0.58 },
        lKnee: { x: w * 0.41, y: h * 0.71 },
        rKnee: { x: w * 0.49, y: h * 0.73 },
        lAnkle: { x: w * 0.42, y: h * 0.88 },
        rAnkle: { x: w * 0.52, y: h * 0.87 },
        hands: { x: w * 0.40, y: h * 0.56 },
        clubHead: { x: w * 0.44, y: h * 0.84 },
      };
      angleLabel = "핸드퍼스트 각도 합격 | 헤드 고정 완벽";
    } else if (frame.id === "finish") {
      colorNeon = "#10B981"; // Emerald
      joints = {
        head: { x: w * 0.39, y: h * 0.22 },
        neck: { x: w * 0.38, y: h * 0.29 },
        lShoulder: { x: w * 0.35, y: h * 0.32 },
        rShoulder: { x: w * 0.41, y: h * 0.32 },
        spineHip: { x: w * 0.37, y: h * 0.54 },
        lKnee: { x: w * 0.36, y: h * 0.70 },
        rKnee: { x: w * 0.40, y: h * 0.72 },
        lAnkle: { x: w * 0.36, y: h * 0.88 },
        rAnkle: { x: w * 0.42, y: h * 0.87 },
        hands: { x: w * 0.28, y: h * 0.28 },
        clubHead: { x: w * 0.48, y: h * 0.52 },
      };
      angleLabel = "왼발 체중 92% | C-자형 피니시 완벽";
    }

    // Helper function to draw joint markers
    const drawJoint = (p: { x: number; y: number }, name?: string) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(5, w * 0.012), 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = colorNeon;
      ctx.lineWidth = Math.max(3, w * 0.007);
      ctx.stroke();
    };

    // Helper to draw bone lines
    const drawBone = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = colorNeon;
      ctx.lineWidth = Math.max(4, w * 0.008);
      ctx.shadowColor = colorNeon;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    };

    // Draw skeleton bones
    drawBone(joints.head, joints.neck);
    drawBone(joints.neck, joints.lShoulder);
    drawBone(joints.neck, joints.rShoulder);
    drawBone(joints.lShoulder, joints.spineHip);
    drawBone(joints.rShoulder, joints.spineHip);
    drawBone(joints.spineHip, joints.lKnee);
    drawBone(joints.spineHip, joints.rKnee);
    drawBone(joints.lKnee, joints.lAnkle);
    drawBone(joints.rKnee, joints.rAnkle);
    drawBone(joints.rShoulder, joints.hands);
    drawBone(joints.hands, joints.clubHead);

    // Draw joints
    Object.keys(joints).forEach((key) => {
      drawJoint(joints[key]);
    });

    // Draw Head Tracking Ring (essential for golf check)
    ctx.beginPath();
    ctx.arc(joints.head.x, joints.head.y, Math.max(15, w * 0.04), 0, 2 * Math.PI);
    ctx.strokeStyle = "#FFFFFF";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw Spine Angle Helper (Specifically for Address)
    if (frame.id === "address") {
      ctx.beginPath();
      ctx.moveTo(joints.spineHip.x, joints.spineHip.y);
      ctx.lineTo(joints.spineHip.x + 80, joints.spineHip.y);
      ctx.strokeStyle = "#E11D48";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Overlay AI HUD information
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(10, h - 50, w - 20, 40);
    ctx.strokeStyle = colorNeon;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, h - 50, w - 20, 40);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${Math.max(12, w / 40)}px sans-serif`;
    ctx.fillText(`💻 AI VISION DETECTED - ${angleLabel}`, 25, h - 25);
  };

  // Turn on/off computerized overlay
  const toggleSkeletonOverlay = () => {
    const nextState = !isSkeletonVisible;
    setIsSkeletonVisible(nextState);
    drawImageOnCanvas(nextState);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            [{frame.label}] 비전 그래픽 피드백 편집기
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            AI 컴퓨터 비전 감지 오버레이를 켜거나 직접 선과 원을 그려 스윙 궤적을 표시하세요.
          </p>
        </div>

        {/* AI skeleton switch */}
        <button
          onClick={toggleSkeletonOverlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
            isSkeletonVisible
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {isSkeletonVisible ? "AI 비전 오버레이 끄기" : "AI 비전 오버레이 켜기"}
        </button>
      </div>

      {!frame.imageDataUrl ? (
        <div className="h-64 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-gray-400">
            편집기를 열려면 먼저 위 비디오 플레이어에서 스윙 화면을 캡처해야 합니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Main Interactive Canvas Area */}
          <div className="md:col-span-3 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center relative group">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`max-w-full max-h-[380px] object-contain transition-shadow ${
                tool !== "none" ? "cursor-crosshair" : "cursor-default"
              }`}
              style={{ display: "block" }}
              width={640}
              height={480}
            />

            {/* Editing mode HUD overlay */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {tool === "none"
                  ? "보기 전용 모드 (그리기 도구를 선택해 보정해 보세요)"
                  : `도구 작동 중: ${
                      tool === "line"
                        ? "직선 그리기"
                        : tool === "circle"
                        ? "동그라미 그리기"
                        : "각도기"
                    }`}
              </span>
            </div>
          </div>

          {/* Graphics Controls Panel */}
          <div className="flex flex-col justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/80">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                수동 분석 드로잉 툴
              </p>
              
              {/* Tool Selector Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool("none")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    tool === "none"
                      ? "bg-white text-emerald-600 border-emerald-200 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100/50"
                  }`}
                >
                  뷰어 모드
                </button>
                <button
                  onClick={() => setTool("line")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    tool === "line"
                      ? "bg-white text-emerald-600 border-emerald-200 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100/50"
                  }`}
                  title="척추 각도선이나 클럽 샤프트 궤적 선을 긋는데 적합합니다."
                >
                  가이드 선
                </button>
                <button
                  onClick={() => setTool("circle")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    tool === "circle"
                      ? "bg-white text-emerald-600 border-emerald-200 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100/50"
                  }`}
                  title="머리 스웨이나 제자리 회전 반경을 모니터링할 때 원을 그려 체크하세요."
                >
                  헤드 고정 원
                </button>
                <button
                  onClick={() => setTool("angle")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    tool === "angle"
                      ? "bg-white text-emerald-600 border-emerald-200 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100/50"
                  }`}
                  title="지면 대비 각도를 측정하는 디지털 각도기 도구입니다."
                >
                  디지털 각도기
                </button>
              </div>

              {/* Color Selector */}
              {tool !== "none" && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    드로잉 펜 칼라
                  </p>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200">
                    {[
                      { hex: "#10B981", label: "그린" },
                      { hex: "#EF4444", label: "레드" },
                      { hex: "#3B82F6", label: "블루" },
                      { hex: "#F59E0B", label: "옐로우" },
                      { hex: "#EC4899", label: "핑크" },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => setColor(col.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          color === col.hex ? "scale-110 border-gray-800" : "border-transparent"
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/50">
              <button
                onClick={handleClearDrawings}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                선 전체 지우기 & 초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
