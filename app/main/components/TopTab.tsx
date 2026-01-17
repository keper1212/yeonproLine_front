"use client"
import { Dispatch, SetStateAction } from "react"

interface TopTabProps {
  selected: string
  setSelected: Dispatch<SetStateAction<string>>
}

export default function TopTab({ selected, setSelected }: TopTabProps) {
  const tabs = ["예측", "민심", "채팅", "순위", "내정보"]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200">
      <div className="flex justify-around max-w-5xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelected(tab)}
            className={`flex-1 py-3 text-sm font-bold border-t-2 transition-colors ${
              selected === tab
                ? "text-rose-500 border-rose-500"
                : "text-gray-500 border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  )
}
