'use client'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
        
        <div className="prose prose-neutral max-w-none space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              Qupid（以下「当社」といいます。）は、当社の提供するサービス（以下「本サービス」といいます。）における、ユーザーについての個人情報を含む利用者情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 収集する情報</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、本サービスの提供にあたり、以下の情報を収集します。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>登録情報：</strong>
                メールアドレス、ニックネーム、生年月日、体の性別、セクシュアリティ、探している関係、プロフィール写真など
              </li>
              <li>
                <strong>サービス利用情報：</strong>
                閲覧履歴、いいね履歴、マッチング履歴、メッセージ履歴など
              </li>
              <li>
                <strong>端末情報：</strong>
                IPアドレス、ブラウザ情報、OSバージョン、デバイス識別子など
              </li>
              <li>
                <strong>位置情報：</strong>
                ユーザーの同意を得た上で取得する位置情報（任意）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 利用目的</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、収集した情報を以下の目的で利用します。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>本サービスの提供、運営、維持、保護及び改善のため</li>
              <li>本サービスに関するご案内、お問い合わせ等への対応のため</li>
              <li>本サービスに関する規約、ポリシー等（以下「規約等」といいます。）に違反する行為に対する対応のため</li>
              <li>本サービスに関する規約等の変更などを通知するため</li>
              <li>マッチング機能の提供のため</li>
              <li>ユーザー体験の向上のため</li>
              <li>統計データの作成のため</li>
              <li>キャンペーン、アンケート等の企画、実施のため</li>
              <li>その他、上記利用目的に付随する目的のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 第三者提供</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、法令で認められた場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、以下の場合はこの限りではありません。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 個人情報の開示</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、ユーザーから、個人情報保護法の定めに基づき個人情報の開示を求められたときは、ユーザーご本人からのご請求であることを確認の上で、ユーザーに対し、遅滞なく開示を行います（当該個人情報が存在しないときにはその旨を通知いたします。）。ただし、個人情報保護法その他の法令により、当社が開示の義務を負わない場合は、この限りではありません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 個人情報の訂正及び利用停止等</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>当社は、ユーザーから、個人情報が真実でないという理由によって、個人情報保護法の定めに基づきその内容の訂正を求められた場合、及びあらかじめ公表された利用目的の範囲を超えて取扱われているという理由または偽りその他不正の手段により収集されたものであるという理由により、個人情報保護法の定めに基づきその利用の停止を求められた場合には、ユーザーご本人からのご請求であることを確認の上で遅滞なく必要な調査を行い、その結果に基づき、個人情報の内容の訂正または利用停止を行い、その旨をユーザーに通知します。</li>
              <li>当社は、ユーザーから、ユーザーの個人情報について消去を求められた場合、当社が当該請求に応じる必要があると判断した場合は、ユーザーご本人からのご請求であることを確認の上で、個人情報の消去を行い、その旨をユーザーに通知します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. プライバシーポリシーの変更手続</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、必要に応じて、本ポリシーを変更します。ただし、法令上ユーザーの同意が必要となるような本ポリシーの変更を行う場合、変更後の本ポリシーは、当社所定の方法で変更に同意したユーザーに対してのみ適用されるものとします。なお、当社は、本ポリシーを変更する場合には、変更後の本ポリシーの施行時期及び内容を当社のウェブサイト上での表示その他の適切な方法により周知し、またはユーザーに通知します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. お問い合わせ窓口</h2>
            <p className="text-gray-700 leading-relaxed">
              ご意見、ご質問、苦情のお申出その他個人情報の取扱いに関するお問い合わせは、本サービス内のお問い合わせフォームまたは以下の窓口までお願いいたします。
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>運営者：</strong>Qupid運営チーム<br />
                <strong>メールアドレス：</strong>support@qupid.app<br />
                <strong>受付時間：</strong>平日 10:00～18:00（土日祝日を除く）
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookieその他の技術の利用</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスは、Cookie及びこれに類する技術を利用することがあります。これらの技術は、当社による本サービスの利用状況等の把握に役立ち、サービス向上に資するものです。Cookieを無効化されたいユーザーは、ウェブブラウザの設定を変更することによりCookieを無効化することができます。ただし、Cookieを無効化すると、本サービスの一部の機能をご利用いただけなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. セキュリティ</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、個人情報の漏洩、滅失又は毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 18歳未満の方へ</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスは18歳以上の方を対象としております。18歳未満の方は本サービスをご利用いただけません。
            </p>
          </section>

          <div className="mt-12 text-right text-gray-600">
            <p>2024年10月19日 制定</p>
          </div>
        </div>
      </div>
    </div>
  )
}
