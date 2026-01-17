"use client";

import { useState } from "react";
import TopTab from "./components/TopTab";
import PredictTab from "./components/PredictTab";
import ProfileTab from "./components/ProfileTab";

export default function MainPage() {
  const [selectedTab, setSelectedTab] = useState("예측");

  return (
    // 배경색을 밝은 톤으로 유지하되 전체 정렬을 중앙으로 잡습니다.
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center">
      
      {/* 핵심 수정: max-w-md는 약 448px입니다. 
         만약 가로 배치가 여전히 깨진다면 max-w-lg(512px)로 살짝 늘려보세요.
         px-4는 내부 요소가 숨 쉴 공간을 만들어줍니다.
      */}
      <div className="w-full max-w-md px-4"> 
        
        {/* 상단 탭 (예측, 민심, 채팅, 순위, 내정보) */}
        <TopTab selected={selectedTab} setSelected={setSelectedTab} />

        {/* 컨텐츠 영역: 
           w-full을 주어 부모(max-w-md)의 너비를 100% 사용하게 합니다.
        */}
        <div className="w-full mt-6">
          {selectedTab === "예측" && <PredictTab />}
          {selectedTab === "민심" && <div className="p-10 text-center font-black text-black">민심 리포트 준비중</div>}
          {selectedTab === "채팅" && <div className="p-10 text-center font-black text-black">실시간 채팅 준비중</div>}
          {selectedTab === "순위" && <div className="p-10 text-center font-black text-black">랭킹 시스템 준비중</div>}
          
          {/* ProfileTab 내부에서 grid-cols-3가 작동하려면 
             이 부모 div가 충분한 너비를 확보하고 있어야 합니다.
          */}
          {selectedTab === "내정보" && <ProfileTab />}
        </div>

      </div>
    </div>
  );
}