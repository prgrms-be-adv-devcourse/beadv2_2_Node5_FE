"use client"
export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-foreground mb-4">MyRoutine</h3>
            <p className="text-muted-foreground text-sm">
              신선한 상품을 구독하고 편리하게 받아보세요
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">고객 지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/contact" className="hover:text-primary">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  배송 정보
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  반품 정책
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">회사</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  소개
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/prgrms-be-adv-devcourse/beadv2_2_Node5_BE"
                  className="hover:text-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  블로그
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  채용
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">법적</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  개인정보
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  쿠키
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 MyRoutine. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  )
}
