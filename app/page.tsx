"use client"

import { signIn } from "next-auth/react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      {/* 로고 */}
      <div className="mb-8">
        <div className="w-32 h-32 bg-pink-50 rounded-3xl flex items-center justify-center shadow-lg border border-pink-100 mx-auto mb-6">
          💕
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent mb-6 leading-tight">
          연프 도사
        </h1>
        <p className="text-gray-600 text-xl md:text-2xl max-w-lg mx-auto mb-12 leading-relaxed">
          실시간으로 함께 예측하고<br />
          방송을 더 재밌게 즐겨보세요!
        </p>
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-4 w-full max-w-md">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/main" })}
          className="block w-full py-6 px-8 bg-rose-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:scale-[1.02] hover:bg-rose-600 transition-all duration-200 text-center"
        >
          로그인하여 시작하기
        </button>
        {/* 예측 버튼 제거, 로그인 후 이용 가능 */}
      </div>

      {/* 미리보기 카드들 */}
      <div className="grid md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl">
        <div className="bg-pink-50 rounded-3xl p-8 border border-pink-100 shadow-md hover:shadow-lg transition-all">
          <h3 className="text-2xl font-bold mb-4 text-rose-500">🔥 실시간 예측</h3>
          <p className="text-gray-600">방송 30분 전 오픈, 시작과 동시에 마감</p>
        </div>
        <div className="bg-pink-50 rounded-3xl p-8 border border-pink-100 shadow-md hover:shadow-lg transition-all">
          <h3 className="text-2xl font-bold mb-4 text-rose-500">📊 민심 그래프</h3>
          <p className="text-gray-600">출연자 인기 변화 실시간 확인</p>
        </div>
        <div className="bg-pink-50 rounded-3xl p-8 border border-pink-100 shadow-md hover:shadow-lg transition-all">
          <h3 className="text-2xl font-bold mb-4 text-rose-500">👑 순위 경쟁</h3>
          <p className="text-gray-600">포인트로 배지, 프로필 꾸미기</p>
        </div>
      </div>
    </div>
  )
}
