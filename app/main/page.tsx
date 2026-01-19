"use client";

import { useState } from "react";
import TopTab from "./components/TopTab";
import PredictTab from "./components/PredictTab";
import ProfileTab from "./components/ProfileTab";
import RankingTab from "./components/RankingTab";

export default function MainPage() {
  const [selectedTab, setSelectedTab] = useState("예측");

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-6 pb-28">
      {/* 하단 탭 */}
      <TopTab selected={selectedTab} setSelected={setSelectedTab} />

      {/* 탭별 컨텐츠 */}
      <div className="w-full mt-12">
        {selectedTab === "예측" && <PredictTab />}
        {selectedTab === "민심" && <div>민심</div>}
        {selectedTab === "채팅" && <div>채팅</div>}
        {selectedTab === "순위" && <RankingTab />}
        {selectedTab === "내정보" && <ProfileTab />}
      </div>
    </div>
  );
}
