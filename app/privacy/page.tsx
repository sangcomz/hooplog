"use client"

import { useRouter } from "next/navigation"

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">개인정보 처리방침</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">최종 수정일: 2025년 10월 29일</p>

          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <p className="leading-relaxed mb-4">
                HoopLog(이하 "회사")는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고
                이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제1조 (개인정보의 처리 목적)</h2>
              <p className="leading-relaxed mb-2">회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공, 본인 식별·인증</li>
                <li>서비스 제공: 농구 팀 관리, 경기 일정 관리, 출석 체크, 게스트 관리 등의 서비스 제공</li>
                <li>서비스 개선: 서비스 이용 기록 분석을 통한 서비스 개선 및 맞춤형 서비스 제공</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제2조 (처리하는 개인정보의 항목)</h2>
              <p className="leading-relaxed mb-2">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. 회원 가입 및 관리</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>필수항목: 이메일 주소, 이름(닉네임), 프로필 이미지</li>
                    <li>자동 수집 항목: 서비스 이용 기록, 접속 로그, 쿠키</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Google OAuth 인증</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Google 계정 정보(이메일, 이름, 프로필 사진)</li>
                    <li>Google에서 제공하는 고유 식별자</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                <li>회원 탈퇴 시 개인정보는 즉시 파기됩니다. 단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제4조 (개인정보의 제3자 제공)</h2>
              <p className="leading-relaxed">
                회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며,
                정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제5조 (개인정보 처리의 위탁)</h2>
              <p className="leading-relaxed mb-2">회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-600">
                      <th className="text-left py-2">수탁업체</th>
                      <th className="text-left py-2">위탁업무 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <td className="py-2">Google LLC</td>
                      <td className="py-2">OAuth 인증 서비스</td>
                    </tr>
                    <tr>
                      <td className="py-2">Turso (LibSQL)</td>
                      <td className="py-2">데이터베이스 호스팅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
              <p className="leading-relaxed mb-2">정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
                <li>개인정보 수집·이용·제공에 대한 동의 철회</li>
              </ul>
              <p className="leading-relaxed mt-4">
                권리 행사는 프로필 설정 페이지를 통해 직접 하실 수 있으며, 서면, 전화, 이메일 등을 통해서도 가능합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제7조 (개인정보의 파기)</h2>
              <p className="leading-relaxed mb-2">회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">파기 절차:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>전자적 파일 형태: 복구 및 재생이 되지 않도록 안전하게 삭제</li>
                  <li>기록물, 인쇄물 등: 분쇄 또는 소각</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제8조 (개인정보의 안전성 확보조치)</h2>
              <p className="leading-relaxed mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>관리적 조치: 내부관리계획 수립·시행</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제9조 (쿠키의 운용)</h2>
              <p className="leading-relaxed">
                회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용합니다.
                쿠키는 웹사이트가 이용자의 컴퓨터 브라우저에 전송하는 소량의 정보입니다.
                이용자는 웹브라우저 옵션 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제10조 (개인정보 보호책임자)</h2>
              <p className="leading-relaxed mb-2">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
                아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mt-4">
                <p className="font-semibold text-gray-900 dark:text-white">개인정보 보호책임자</p>
                <p className="mt-2">담당 부서: 운영팀</p>
                <p>이메일: <a href="mailto:dev.seokwon2@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">dev.seokwon2@gmail.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제11조 (권익침해 구제방법)</h2>
              <p className="leading-relaxed mb-2">
                정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에
                분쟁해결이나 상담 등을 신청할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
                <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">제12조 (개인정보 처리방침의 변경)</h2>
              <p className="leading-relaxed">
                이 개인정보 처리방침은 2025년 10월 29일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
                변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
