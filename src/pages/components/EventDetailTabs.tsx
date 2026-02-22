export type DetailTab = 'PERFORMANCE' | 'SALES';

type EventDetailTabsProps = {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  venue: string;
};

export function EventDetailTabs(input: EventDetailTabsProps) {
  const { activeTab, onTabChange, venue } = input;

  return (
    <>
      <div className="event-detail-tabs" role="tablist" aria-label="상세 탭">
        <button
          type="button"
          role="tab"
          className={`event-detail-tab ${activeTab === 'PERFORMANCE' ? 'event-detail-tab--active' : ''}`}
          aria-selected={activeTab === 'PERFORMANCE'}
          onClick={() => onTabChange('PERFORMANCE')}
        >
          공연정보
        </button>
        <button
          type="button"
          role="tab"
          className={`event-detail-tab ${activeTab === 'SALES' ? 'event-detail-tab--active' : ''}`}
          aria-selected={activeTab === 'SALES'}
          onClick={() => onTabChange('SALES')}
        >
          판매정보
        </button>
      </div>

      {activeTab === 'PERFORMANCE' ? (
        <div className="event-detail-panel">
          <section className="event-detail-block">
            <h3>공연시간 정보</h3>
            <ul className="event-detail-list">
              <li>2026년 5월 30일(토) - 31일(일)</li>
              <li>티켓 부스 오픈 및 입장 시작: 추후 공개되는 타임테이블에 안내</li>
            </ul>
          </section>

          <section className="event-detail-block event-detail-block--notice">
            <h3>공지사항</h3>
            <ul className="event-detail-list">
              <li>티켓 예매에 앞서 예매처의 취소/환불 조항 및 상세 안내를 반드시 확인해 주세요.</li>
              <li>예매 완료 시 주최/예매처의 운영 규정을 확인하고 동의한 것으로 간주됩니다.</li>
              <li>예매, 티켓 수령, 입장 관련 상세 내용은 아래 판매정보를 참고해 주세요.</li>
            </ul>
          </section>
        </div>
      ) : (
        <div className="event-detail-panel">
          <section className="event-detail-block">
            <h3>기획사 정보</h3>
            <p className="event-detail-text">주최: 민트페이퍼(Mint Paper)</p>
            <p className="event-detail-text">주관: 주식회사 엠피엠지(MPMG)</p>
          </section>

          <section className="event-detail-block">
            <h3>상품관련 정보</h3>
            <table className="event-detail-table">
              <tbody>
                <tr>
                  <th>주최/기획</th>
                  <td>주식회사 엠피엠지</td>
                  <th>고객문의</th>
                  <td>1544-1555</td>
                </tr>
                <tr>
                  <th>공연시간</th>
                  <td>해당없음</td>
                  <th>관람등급</th>
                  <td>전체관람가</td>
                </tr>
                <tr>
                  <th>공연장소</th>
                  <td colSpan={3}>{venue}</td>
                </tr>
                <tr>
                  <th>예매수수료</th>
                  <td>장당 2,000원</td>
                  <th>배송료</th>
                  <td>현장수령 무료 (배송불가)</td>
                </tr>
                <tr>
                  <th>유효기간/이용조건</th>
                  <td colSpan={3}>2026.05.30~2026.05.31 예매한 공연 날짜 회차에 한해 이용가능</td>
                </tr>
                <tr>
                  <th>예매취소조건</th>
                  <td colSpan={3}>
                    취소일자에 따라 취소수수료가 부과됩니다. 공연 당일 00시 이전 취소 시 취소수수료가 없습니다.
                  </td>
                </tr>
                <tr>
                  <th>취소환불방법</th>
                  <td colSpan={3}>My티켓 &gt; 예매/취소내역에서 직접 취소 또는 고객센터(1544-1555)로 문의</td>
                </tr>
                <tr>
                  <th>모바일티켓 안내</th>
                  <td colSpan={3}>모바일티켓은 모바일 디바이스에서만 이용 가능하며, 결제 완료 후 예매내역에서 확인할 수 있습니다.</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
