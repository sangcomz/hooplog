"use client"

import { useRouter } from "next/navigation"

export default function TermsOfService() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 가기
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">이용약관</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">최종 수정일: 2025년 10월 29일</p>

          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제1조 (목적)</h2>
              <p className="leading-relaxed">
                본 약관은 HoopLog(이하 "서비스")가 제공하는 농구 경기 관리 및 팀 운영 서비스의 이용과 관련하여
                회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제2조 (정의)</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>"서비스"란 HoopLog가 제공하는 농구 팀 관리, 경기 일정 관리, 출석 체크, 게스트 관리 등의 기능을 말합니다.</li>
                <li>"회원"이란 본 약관에 동의하고 서비스에 가입하여 서비스를 이용하는 자를 말합니다.</li>
                <li>"팀"이란 회원들이 생성한 농구 팀 단위의 그룹을 말합니다.</li>
                <li>"매니저"란 팀을 생성하거나 팀 관리 권한을 부여받은 회원을 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                <li>약관이 변경되는 경우, 회사는 변경사항을 서비스 내 공지사항을 통해 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제4조 (회원가입)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>회원가입은 이용자가 본 약관에 동의하고 Google 계정을 통해 인증하는 것으로 이루어집니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>타인의 정보를 도용한 경우</li>
                    <li>허위 정보를 기재한 경우</li>
                    <li>기타 회원가입 요건을 충족하지 못한 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제5조 (서비스의 제공)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>농구 팀 생성 및 관리</li>
                    <li>경기 일정 생성 및 관리</li>
                    <li>팀원 출석 관리</li>
                    <li>게스트 관리</li>
                    <li>경기 스코어 기록</li>
                    <li>경기 코멘트 작성</li>
                  </ul>
                </li>
                <li>서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다.</li>
                <li>회사는 시스템 정기점검, 서버 증설 등의 사유로 서비스 제공을 일시 중단할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제6조 (회원의 의무)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>회원은 다음 행위를 하여서는 안 됩니다:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>타인의 정보 도용</li>
                    <li>서비스 운영을 방해하는 행위</li>
                    <li>타인의 명예를 훼손하거나 불이익을 주는 행위</li>
                    <li>음란물 또는 부적절한 콘텐츠 게시</li>
                    <li>기타 관련 법령에 위배되는 행위</li>
                  </ul>
                </li>
                <li>회원은 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제7조 (개인정보 보호)</h2>
              <p className="leading-relaxed">
                회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.
                개인정보의 보호 및 이용에 대해서는 관련 법령 및 회사의 개인정보 처리방침이 적용됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제8조 (서비스 이용 제한)</h2>
              <p className="leading-relaxed">
                회사는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우,
                경고, 일시정지, 영구이용정지 등으로 서비스 이용을 제한할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제9조 (책임의 제한)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                <li>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                <li>회사는 회원이 서비스를 통해 게시한 정보의 신뢰도, 정확성 등에 대해서는 책임을 지지 않습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제10조 (분쟁 해결)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>본 약관은 대한민국 법률에 따라 규율되고 해석됩니다.</li>
                <li>서비스 이용과 관련하여 회사와 회원 간에 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 노력합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제11조 (문의처)</h2>
              <p className="leading-relaxed">
                서비스 이용과 관련한 문의사항은 아래 이메일로 연락주시기 바랍니다.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mt-4">
                <p className="font-semibold text-gray-900 dark:text-white">고객 문의</p>
                <p className="mt-2">이메일: <a href="mailto:dev.seokwon2@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">dev.seokwon2@gmail.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">부칙</h2>
              <p className="leading-relaxed">
                본 약관은 2025년 10월 29일부터 적용됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
