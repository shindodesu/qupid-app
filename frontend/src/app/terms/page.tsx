'use client'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
        
        <div className="prose prose-neutral max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
            <p className="text-gray-700 leading-relaxed">
              本規約は、本サービスの提供条件及び本サービスの利用に関する当社とユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（定義）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本規約において使用する以下の用語は、各々以下に定める意味を有するものとします。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>「サービス」とは、当社が提供する「Qupid」という名称のマッチングサービスを意味します。</li>
              <li>「ユーザー」とは、本規約に同意の上、本サービスを利用する全ての方を意味します。</li>
              <li>「登録情報」とは、ユーザーが本サービスの利用にあたって登録した情報を意味します。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（登録）</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>本サービスの利用を希望する方は、本規約を遵守することに同意し、かつ当社の定める一定の情報を当社の定める方法で当社に提供することにより、当社に対し、本サービスの利用の登録を申請することができます。</li>
              <li>当社は、当社の基準に従って、第１項に基づいて登録申請を行った方の登録の可否を判断し、当社が登録を認める場合にはその旨を申請者に通知します。</li>
              <li>前項に定める登録の完了時に、サービス利用契約がユーザーと当社の間に成立し、ユーザーは本サービスを本規約に従い利用することができるようになります。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（禁止事項）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ユーザーは、本サービスの利用にあたり、以下の各号のいずれかに該当する行為または該当すると当社が判断する行為をしてはなりません。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>法令に違反する行為または犯罪行為に関連する行為</li>
              <li>当社、本サービスの他のユーザー、または第三者に対する詐欺または脅迫行為</li>
              <li>公序良俗に反する行為</li>
              <li>当社、本サービスの他のユーザー、または第三者の知的財産権、肖像権、プライバシーの権利、名誉、その他の権利または利益を侵害する行為</li>
              <li>本サービスを通じ、以下に該当し、または該当すると当社が判断する情報を当社または本サービスの他のユーザーに送信すること
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>過度に暴力的または残虐な表現を含む情報</li>
                  <li>コンピューター・ウィルスその他の有害なコンピューター・プログラムを含む情報</li>
                  <li>当社、本サービスの他のユーザーまたは第三者の名誉または信用を毀損する表現を含む情報</li>
                  <li>過度にわいせつな表現を含む情報</li>
                  <li>差別を助長する表現を含む情報</li>
                  <li>自殺、自傷行為を助長する表現を含む情報</li>
                  <li>薬物の不適切な利用を助長する表現を含む情報</li>
                  <li>反社会的な表現を含む情報</li>
                  <li>チェーンメール等の第三者への情報の拡散を求める情報</li>
                  <li>他人に不快感を与える表現を含む情報</li>
                </ul>
              </li>
              <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
              <li>当社が提供するソフトウェアその他のシステムに対するリバースエンジニアリングその他の解析行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>当社のネットワークまたはシステム等への不正アクセス</li>
              <li>第三者に成りすます行為</li>
              <li>本サービスの他のユーザーのIDまたはパスワードを利用する行為</li>
              <li>当社が事前に許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
              <li>本サービスの他のユーザーの情報の収集</li>
              <li>当社、本サービスの他のユーザー、または第三者に不利益、損害、不快感を与える行為</li>
              <li>反社会的勢力等への利益供与</li>
              <li>面識のない異性との出会いを目的とした行為</li>
              <li>前各号の行為を直接または間接に惹起し、または容易にする行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（本サービスの停止等）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、以下のいずれかに該当する場合には、ユーザーに事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>本サービスに係るコンピューター・システムの点検または保守作業を緊急に行う場合</li>
              <li>コンピューター、通信回線等の障害、誤操作、過度なアクセスの集中、不正アクセス、ハッキング等により本サービスの運営ができなくなった場合</li>
              <li>地震、落雷、火災、風水害、停電、天災地変などの不可抗力により本サービスの運営ができなくなった場合</li>
              <li>その他、当社が停止または中断を必要と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（権利帰属）</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスに関する知的財産権は全て当社または当社にライセンスを許諾している者に帰属しており、本規約に基づく本サービスの利用許諾は、本サービスに関する当社または当社にライセンスを許諾している者の知的財産権の使用許諾を意味するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（登録抹消等）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、ユーザーが以下のいずれかの事由に該当する場合は、事前に通知または催告することなく、当該ユーザーについて本サービスの利用を一時的に停止し、またはユーザーとしての登録を抹消することができます。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>登録情報に虚偽の事実があることが判明した場合</li>
              <li>支払停止もしくは支払不能となり、または破産手続開始、民事再生手続開始、会社更生手続開始、特別清算開始もしくはこれらに類する手続の開始の申立てがあった場合</li>
              <li>6ヶ月以上本サービスの利用がない場合</li>
              <li>当社からの問い合わせその他の回答を求める連絡に対して30日間以上応答がない場合</li>
              <li>第3条第3項各号に該当する場合</li>
              <li>その他、当社が本サービスの利用またはユーザーとしての登録の継続を適当でないと判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（免責事項）</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
              <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。</li>
              <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（サービス内容の変更等）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（利用規約の変更）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、ユーザーへの事前の告知をもって、本規約を変更することができるものとします。変更後の本規約は、当社が別途定める場合を除いて、本サービス上に表示した時点より効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第11条（連絡/通知）</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスに関する問い合わせその他ユーザーから当社に対する連絡または通知、及び本規約の変更に関する通知その他当社からユーザーに対する連絡または通知は、当社の定める方法で行うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第12条（準拠法・管轄裁判所）</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>本規約及びサービス利用契約の準拠法は日本法とします。</li>
              <li>本規約またはサービス利用契約に起因し、または関連する一切の紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <div className="mt-12 text-right text-gray-600">
            <p>2024年10月19日 制定</p>
          </div>
        </div>
      </div>
    </div>
  )
}
