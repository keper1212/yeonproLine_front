"use client"
import { Dispatch, SetStateAction } from "react"

interface TopTabProps {
  selected: string
  setSelected: Dispatch<SetStateAction<string>>
}

export default function TopTab({ selected, setSelected }: TopTabProps) {
  const tabs = ["예측", "민심", "채팅", "순위", "내정보"]

  return (
    <div className="flex justify-around border-b border-gray-200 sticky top-0 bg-white z-10">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setSelected(tab)}
          className={`flex-1 py-4 font-bold ${
            selected === tab
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-gray-500"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
