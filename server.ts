import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with generous limits for handling base64 swing media
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gen AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// AI Golf Swing Analysis API endpoint
app.post("/api/analyze-swing", async (req, res) => {
  try {
    const { frames, clubType, handiness, userNotes, videoData, mimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please set it in the Secrets panel.",
      });
    }

    let contents: any[] = [];
    let systemInstruction = `당신은 세계적인 골프 코칭 전문가이자 컴퓨터 비전 데이터 분석가입니다. 
사용자가 업로드한 골프 스윙 데이터(각 핵심 4단계 이미지 또는 비디오)를 분석하여 정밀하고 기술적인 피드백을 제공하는 역할을 합니다.

[분석 단계 및 기준]
1. 어드레스(Address): 척추 각도(정상 범위 약 40~45도), 무릎의 굽힘 정도, 팔과 클럽의 정렬(샤프트 각도)을 확인합니다.
2. 백스윙(Backswing): 테이크어웨이 경로와 탑에서의 위치를 평가합니다.
3. 임팩트(Impact): 클럽 페이스의 정렬과 체중 이동, 머리 고정 여부를 확인합니다.
4. 피니시(Finish): 체중이 왼발에 완전히 실려 있는지, 균형 잡힌 자세인지 확인합니다.

[출력 형식]
JSON 형식으로 분석 결과를 반환해야 하며, 다음의 구조를 엄격히 따르십시오.
- overallScore: 종합 점수 (0 ~ 100 정수)
- scores: { address: 0~100 점수, backswing: 0~100 점수, impact: 0~100 점수, finish: 0~100 점수 }
- angles: { spineAngleAddress: 어드레스 시 검출한 대략적인 척추 각도(도, 예: 42), kneeFlexAddress: 어드레스 시 검출한 대략적인 무릎 각도(도, 예: 155), shaftAngleAddress: 샤프트 각도(도, 예: 46) }
- feedbackMarkdown: 스윙 분석 리포트 마크다운 텍스트.

[피드백 리포트(feedbackMarkdown) 작성 규칙]
1. 모든 피드백은 중학생이 읽어도 단번에 이해할 수 있도록 아주 친절하고 따뜻하며 격려하는 말투(~해보세요!, ~인 점이 아주 멋져요! 등)로 작성하세요.
2. 각 단계별(어드레스, 백스윙, 임팩트, 피니시)로 [잘한 점]과 [개선할 점]을 명확히 구분해야 합니다.
3. [개선할 점]은 머릿속으로 즉시 그릴 수 있도록 매우 구체적인 신체 움직임(예: "임팩트 시 오른쪽 어깨를 아래로 조금만 더 낮추고 시선은 공이 있던 자리에 0.5초 더 머물러보세요!")으로 제시하세요.
4. 분석 결과의 핵심 요약은 피드백 내용 시작 부분에 반드시 마크다운(Markdown) 표를 사용하여 가독성 있게 정리해야 합니다. 
   표의 열은 [분석 단계], [평가 기준], [잘한 점], [개선할 점]으로 구성되어야 합니다.
5. 표 아래에는 각 단계별로 더욱 상세한 해설과 연습 방법 팁(예: 집에서 할 수 있는 동작)을 친절하게 덧붙여주세요.`;

    // 1. If base64 captured frames are provided
    if (frames && Array.isArray(frames) && frames.length > 0) {
      contents.push({
        text: `클럽 종류: ${clubType || "아이언"}, 스윙 방향: ${handiness || "오른손잡이"}, 사용자의 메모: ${userNotes || "없음"}. 
제공된 4개의 이미지는 순서대로 [어드레스], [백스윙 탑], [임팩트], [피니시] 순간의 스윙 캡처입니다. 
각 단계별 스윙 이미지를 면밀히 관찰하고 컴퓨터 비전 각도 분석 및 기술 평가를 수행해 주세요.`
      });

      // Attach base64 frames to parts
      const parts = frames.map((base64Data: string, index: number) => {
        // base64Data looks like "data:image/png;base64,iVBORw0KGgoAAA..."
        const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          };
        }
        return null;
      }).filter(Boolean);

      contents.push(...parts);
    } 
    // 2. Or if full video data is provided
    else if (videoData && mimeType) {
      const match = videoData.match(/^data:(video\/\w+);base64,(.+)$/);
      const dataStr = match ? match[2] : videoData;
      const actualMime = match ? match[1] : mimeType;

      contents.push({
        text: `클럽 종류: ${clubType || "아이언"}, 스윙 방향: ${handiness || "오른손잡이"}. 
제공된 골프 스윙 비디오 전체를 정밀 분석하여 어드레스, 백스윙, 임팩트, 피니시의 4단계를 포착하고 평가해 주세요.`
      });

      contents.push({
        inlineData: {
          mimeType: actualMime,
          data: dataStr
        }
      });
    } 
    // 3. Fallback: If no media is provided, simulate an expert analysis based on description
    else {
      contents.push({
        text: `클럽 종류: ${clubType || "아이언"}, 스윙 방향: ${handiness || "오른손잡이"}. 
사용자가 미디어를 업로드하지 않고 데모 분석을 요청했습니다. 초보 골퍼들이 흔히 저지르는 전형적인 실수(어드레스 시 척추 굽힘 불량, 백스윙 시 스웨이, 임팩트 시 헤드업, 피니시 균형 상실 등)를 바탕으로 교육적이고 정밀한 골프 가상 피드백 보고서를 작성해 주세요.`
      });
    }

    // Call Gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "골프 스윙의 종합 평가 점수 (0~100)" },
            scores: {
              type: Type.OBJECT,
              properties: {
                address: { type: Type.INTEGER, description: "어드레스 자세 점수 (0~100)" },
                backswing: { type: Type.INTEGER, description: "백스윙 자세 점수 (0~100)" },
                impact: { type: Type.INTEGER, description: "임팩트 자세 점수 (0~100)" },
                finish: { type: Type.INTEGER, description: "피니시 자세 점수 (0~100)" },
              },
              required: ["address", "backswing", "impact", "finish"],
            },
            angles: {
              type: Type.OBJECT,
              properties: {
                spineAngleAddress: { type: Type.INTEGER, description: "척추 각도 (대략 38~48 사이)" },
                kneeFlexAddress: { type: Type.INTEGER, description: "무릎 굽힘 각도 (대략 140~165 사이)" },
                shaftAngleAddress: { type: Type.INTEGER, description: "샤프트 조준 각도 (대략 40~55 사이)" },
              },
              required: ["spineAngleAddress", "kneeFlexAddress", "shaftAngleAddress"],
            },
            feedbackMarkdown: {
              type: Type.STRING,
              description: "어드레스, 백스윙, 임팩트, 피니시 분석 결과 표 및 상세 멘토링이 담긴 마크다운 문자열"
            },
          },
          required: ["overallScore", "scores", "angles", "feedbackMarkdown"],
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini API");
    }

    const analysisResult = JSON.parse(resultText);
    res.json(analysisResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      error: "스윙 분석 중에 오류가 발생했습니다.",
      details: error.message || error,
    });
  }
});

// Configure Vite or Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Golf Swing AI Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
