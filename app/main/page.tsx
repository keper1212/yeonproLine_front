"use client";

import { useState } from "react";
import TopTab from "./components/TopTab";
import PredictTab from "./components/PredictTab";

export default function MainPage() {
  const [selectedTab, setSelectedTab] = useState("예측");

  return (
    <div className="min-h-screen bg-gray-900 px-6 flex flex-col">

      {/* 상단 탭 */}
      <TopTab selected={selectedTab} setSelected={setSelectedTab} />

      {/* 탭별 컨텐츠 */}
      <div className="w-full mt-12">
        {selectedTab === "예측" && <PredictTab />}
        {selectedTab === "민심" && <div>민심</div>}
        {selectedTab === "채팅" && <div>채팅</div>}
        {selectedTab === "순위" && <div>순위</div>}
        {selectedTab === "내정보" && <div>내정보</div>}
      </div>

    </div>
  );
}
