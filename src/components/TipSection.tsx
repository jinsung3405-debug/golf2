import React, { useState } from "react";
import { Sparkles, Trophy, CheckCircle, ShieldAlert, ChevronDown, ChevronUp, Flag } from "lucide-react";
import { GOLF_SWING_GUIDE } from "../data/mockGolfData";

export default function TipSection() {
  const [openStep, setOpenStep] = useState<"address" | "backswing" | "impact" | "finish" | null>("address");

  const toggleStep = (step: "address" | "backswing" | "impact" | "finish") => {
    if (openStep === step) {
      setOpenStep(null);
    } else {
      setOpenStep(step);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-50">
        <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            프로 코치가 알려주는 4단계 완벽 스윙 표준 가이드
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            좋은 골프 폼을 만들기 위해 각 동작마다 무엇을 가장 신경 써야 하는지 체크해 볼까요?
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Step: Address */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleStep("address")}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold text-gray-800">어드레스 (Address)</span>
            </div>
            {openStep === "address" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openStep === "address" && (
            <div className="p-4 bg-white border-t border-gray-50 space-y-3">
              <ul className="space-y-2">
                {GOLF_SWING_GUIDE.address.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50 flex items-start gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  <strong className="font-bold">PRO COACH TIP:</strong> {GOLF_SWING_GUIDE.address.proTip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step: Backswing */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleStep("backswing")}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold text-gray-800">백스윙 (Backswing)</span>
            </div>
            {openStep === "backswing" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openStep === "backswing" && (
            <div className="p-4 bg-white border-t border-gray-50 space-y-3">
              <ul className="space-y-2">
                {GOLF_SWING_GUIDE.backswing.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50 flex items-start gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  <strong className="font-bold">PRO COACH TIP:</strong> {GOLF_SWING_GUIDE.backswing.proTip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step: Impact */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleStep("impact")}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-bold text-gray-800">임팩트 (Impact)</span>
            </div>
            {openStep === "impact" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openStep === "impact" && (
            <div className="p-4 bg-white border-t border-gray-50 space-y-3">
              <ul className="space-y-2">
                {GOLF_SWING_GUIDE.impact.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50 flex items-start gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  <strong className="font-bold">PRO COACH TIP:</strong> {GOLF_SWING_GUIDE.impact.proTip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step: Finish */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleStep("finish")}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <span className="text-xs font-bold text-gray-800">피니시 (Finish)</span>
            </div>
            {openStep === "finish" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openStep === "finish" && (
            <div className="p-4 bg-white border-t border-gray-50 space-y-3">
              <ul className="space-y-2">
                {GOLF_SWING_GUIDE.finish.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50 flex items-start gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  <strong className="font-bold">PRO COACH TIP:</strong> {GOLF_SWING_GUIDE.finish.proTip}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
