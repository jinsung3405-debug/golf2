import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Award, BarChart2, CheckCircle2, ShieldAlert, Cpu, Compass, BookOpen } from "lucide-react";
import { AnalysisResult } from "../types";

interface AnalysisDashboardProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

export default function AnalysisDashboard({ result, isLoading }: AnalysisDashboardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        {/* Glowing loader */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <Cpu className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 animate-pulse">
          AI 골프 컴퓨터 비전 데이터 분석 중...
        </h3>
        <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
          수집된 4단계 프레임의 척추 각도, 스웨이, 임팩트 페이스 정렬 및 피니시 밸런스를 측정하고 있습니다. 잠시만 기다려 주세요!
        </p>
        <div className="mt-4 flex gap-1.5 justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <Compass className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          실시간 분석 대시보드가 준비되었습니다
        </h3>
        <p className="text-xs text-gray-400 mt-1.5 max-w-sm leading-relaxed">
          스윙 동영상을 올리고 프레임을 고정한 후, <strong className="text-emerald-700 font-semibold">"AI 정밀 스윙 분석 시작"</strong> 버튼을 누르면 세계적인 골프 전문가의 중학생 눈높이 특급 멘토링 보고서가 이곳에 도착합니다!
        </p>
      </div>
    );
  }

  // Prep Recharts data
  const radarData = [
    { subject: "어드레스", score: result.scores.address },
    { subject: "백스윙", score: result.scores.backswing },
    { subject: "임팩트", score: result.scores.impact },
    { subject: "피니시", score: result.scores.finish },
  ];

  // Grade helper
  const getGrade = (score: number) => {
    if (score >= 90) return { text: "MASTER 프로급", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (score >= 80) return { text: "EXCELLENT 싱글급", color: "text-blue-600 bg-blue-50 border-blue-100" };
    if (score >= 70) return { text: "GOOD 비기너 극복", color: "text-amber-600 bg-amber-50 border-amber-100" };
    return { text: "CHALLENGE 집중 연습", color: "text-rose-600 bg-rose-50 border-rose-100" };
  };

  const overallGrade = getGrade(result.overallScore);

  return (
    <div className="space-y-6">
      {/* HUD Overview Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Score & Grade */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              종합 스윙 평가
            </span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-5xl font-black text-gray-900 tracking-tight">
                {result.overallScore}
              </span>
              <span className="text-sm font-semibold text-gray-400">/ 100점</span>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${overallGrade.color}`}>
              <Award className="w-3.5 h-3.5" />
              {overallGrade.text}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-[11px] text-gray-500 leading-tight">
              척추 각도 및 골반 제어력이 매우 일관되게 분석되었습니다.
            </p>
          </div>
        </div>

        {/* Card 2: AI Computer Vision Telemetry */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            AI 컴퓨터 비전 텔레메트리 (어드레스 기준)
          </span>

          <div className="mt-4 space-y-3.5">
            {/* Spine angle */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span className="flex items-center gap-1">💻 척추 각도(Spine Angle)</span>
                <span className="text-emerald-600 font-mono">{result.angles.spineAngleAddress}°</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                {/* Visual optimal zone helper (optimal: 40~45) */}
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all" 
                  style={{ width: `${(result.angles.spineAngleAddress / 90) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>0°</span>
                <span className="text-emerald-600 font-semibold">적정 (40°~45°)</span>
                <span>90°</span>
              </div>
            </div>

            {/* Knee Flex */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span className="flex items-center gap-1">💻 무릎 굽힘(Knee Flex)</span>
                <span className="text-emerald-600 font-mono">{result.angles.kneeFlexAddress}°</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all" 
                  style={{ width: `${(result.angles.kneeFlexAddress / 180) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>90°</span>
                <span className="text-emerald-600 font-semibold">적정 (155°~165°)</span>
                <span>180°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Charts/Radar Visualizer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative flex items-center justify-center">
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#4B5563", fontSize: 10, fontWeight: "bold" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9CA3AF" }} />
                <Radar
                  name="스윙 분석"
                  dataKey="score"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Step Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            단계별 평가 점수 트렌드
          </h3>
          <span className="text-[10px] font-semibold text-gray-400">
            어드레스에서 피니시까지의 기술 흐름
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 text-center bg-gray-50/40">
          {[
            { label: "어드레스", score: result.scores.address, desc: "상체 각도 & 정렬" },
            { label: "백스윙", score: result.scores.backswing, desc: "체중축 & 꼬임" },
            { label: "임팩트", score: result.scores.impact, desc: "페이스 정렬 & 시선" },
            { label: "피니시", score: result.scores.finish, desc: "균형 & 체중 이동" },
          ].map((step, idx) => (
            <div key={idx} className="p-4">
              <p className="text-[11px] font-medium text-gray-400">{step.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{step.score}점</p>
              <div className="w-12 bg-gray-200 h-1.5 rounded-full mx-auto mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    step.score >= 90 ? "bg-emerald-500" : step.score >= 80 ? "bg-blue-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${step.score}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-1.5">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Markdown Report */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          <BookOpen className="w-5 h-5 text-emerald-600 animate-pulse" />
          <h3 className="text-base font-bold text-gray-900">
            세계 전문가의 1:1 맞춤형 멘토링 분석 리포트
          </h3>
        </div>

        {/* Custom styled markdown report (matches user rules exactly) */}
        <div className="markdown-body text-sm leading-relaxed text-gray-800 space-y-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.feedbackMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
