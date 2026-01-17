"use client"
export default function Predict() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 pb-24 text-white space-y-6">
      {/* 타이머 */}
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold text-pink-400">EP.12 예고편</div>
        <div className="flex justify-center items-center space-x-2 text-3xl font-mono">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">27</div>
          <span className="text-white/50">:</span>
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">28</div>
        </div>
      </div>

      {/* 예측 카드 1 */}
      <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <span className="w-6 h-6 bg-white text-rose-500 rounded-full flex items-center justify-center mr-2 font-bold text-sm">★</span>
          최종 Love-Line 예측
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-all">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">A</div>
            <div className="font-bold text-lg">지수</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-all">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">B</div>
            <div className="font-bold text-lg">민수</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex-1 bg-white/10 rounded-xl py-2 px-4 text-center font-bold text-sm text-pink-300 border border-white/20">65.2%</div>
          <button className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">예측하기</button>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-24 left-4 right-4">
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl text-lg hover:shadow-3xl transition-all">
          ❤️ 예측 제출
        </button>
      </div>
    </div>
  )
}
