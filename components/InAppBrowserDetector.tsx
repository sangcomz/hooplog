"use client"

import { useEffect, useState } from "react"

export function InAppBrowserDetector() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [browserName, setBrowserName] = useState("")

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()

    // 인앱 브라우저 감지
    const inAppBrowsers = [
      { name: "카카오톡", pattern: /kakaotalk/i, scheme: "kakaotalk://web/openExternal?url=" },
      { name: "네이버", pattern: /naver/i, scheme: null },
      { name: "페이스북", pattern: /fbav|fbios|fb_iab/i, scheme: null },
      { name: "인스타그램", pattern: /instagram/i, scheme: null },
      { name: "라인", pattern: /line/i, scheme: null },
      { name: "밴드", pattern: /band/i, scheme: null },
    ]

    for (const browser of inAppBrowsers) {
      if (browser.pattern.test(userAgent)) {
        setIsInAppBrowser(true)
        setBrowserName(browser.name)
        break
      }
    }
  }, [])

  const openInExternalBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const currentUrl = window.location.href

    // 카카오톡은 자동으로 외부 브라우저 열기
    if (/kakaotalk/i.test(userAgent)) {
      window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl)
    } else {
      // 다른 인앱 브라우저는 복사 안내
      navigator.clipboard.writeText(currentUrl).then(() => {
        alert('링크가 복사되었습니다.\n외부 브라우저(Safari, Chrome 등)에 붙여넣기 해주세요.')
      }).catch(() => {
        alert('브라우저 우측 상단 메뉴에서\n"외부 브라우저로 열기" 또는 "Safari에서 열기"를 선택해주세요.')
      })
    }
  }

  if (!isInAppBrowser) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center">
          외부 브라우저가 필요합니다
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">{browserName}</span> 인앱 브라우저에서는 구글 로그인이 제한됩니다.
          </p>
          <p>
            보안을 위해 외부 브라우저(Safari, Chrome 등)에서 이용해주세요.
          </p>
        </div>

        <button
          onClick={openInExternalBrowser}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-medium transition-colors"
        >
          외부 브라우저로 열기
        </button>

        <p className="text-xs text-gray-500 text-center">
          {/kakaotalk/i.test(navigator.userAgent.toLowerCase())
            ? "자동으로 외부 브라우저가 열립니다"
            : "또는 우측 상단 [...] 메뉴에서 '외부 브라우저로 열기'를 선택하세요"}
        </p>
      </div>
    </div>
  )
}
