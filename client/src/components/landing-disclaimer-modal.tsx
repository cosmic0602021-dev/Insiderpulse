// Modified for App Store compliance: Legal disclaimer triggered after Initialize_System button
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/language-context';
import { AlertTriangle, FileText, Shield } from 'lucide-react';

const DISCLAIMER_KEY = 'disclaimer-accepted';

interface LandingDisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export function LandingDisclaimerModal({ open, onAccept, onClose }: LandingDisclaimerModalProps) {
  const { language } = useLanguage();
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      localStorage.setItem(DISCLAIMER_KEY, 'true');
      onAccept();
    }
  };

  const getDisclaimerText = () => {
    switch (language) {
      case 'ko':
        return {
          title: '법적 고지 및 면책조항',
          subtitle: '본 앱 사용 전 반드시 읽어주세요',
          mainText: '본 앱은 미국 증권거래위원회(SEC) 공시 데이터를 수집, 정리, 시각화하는 데이터 리서치 도구입니다. 본 앱은 투자 조언, 금융 자문, 또는 증권 추천 서비스를 제공하지 않습니다.',
          bullets: [
            '표시되는 모든 정보는 SEC 공시에서 직접 가져온 사실 데이터입니다',
            '본 앱은 특정 증권의 매수, 매도, 보유를 권장하지 않습니다',
            '과거 내부자 거래 패턴이 미래 성과를 보장하지 않습니다',
            '모든 투자 결정과 그에 따른 위험은 전적으로 사용자에게 귀속됩니다',
            '투자 결정 전 자격을 갖춘 금융 전문가와 상담하시기 바랍니다'
          ],
          checkboxLabel: '위 내용을 읽고 이해했으며, 본 앱이 투자 조언을 제공하지 않음을 인정합니다',
          acceptButton: '동의하고 계속하기'
        };
      case 'ja':
        return {
          title: '法的通知および免責事項',
          subtitle: 'アプリを使用する前に必ずお読みください',
          mainText: '本アプリは、米国証券取引委員会(SEC)の公開データを収集、整理、視覚化するデータリサーチツールです。本アプリは、投資アドバイス、金融アドバイス、または証券推奨サービスを提供しません。',
          bullets: [
            '表示されるすべての情報は、SEC提出書類から直接取得した事実データです',
            '本アプリは特定の証券の購入、売却、保有を推奨しません',
            '過去のインサイダー取引パターンは将来のパフォーマンスを保証しません',
            'すべての投資決定とそれに伴うリスクは完全にユーザーに帰属します',
            '投資決定を行う前に、資格のある金融専門家にご相談ください'
          ],
          checkboxLabel: '上記の内容を読んで理解し、本アプリが投資アドバイスを提供しないことを認めます',
          acceptButton: '同意して続行'
        };
      case 'zh':
        return {
          title: '法律声明和免责条款',
          subtitle: '使用本应用前请务必阅读',
          mainText: '本应用是一款数据研究工具，用于收集、整理和可视化美国证券交易委员会(SEC)的公开数据。本应用不提供投资建议、金融咨询或证券推荐服务。',
          bullets: [
            '显示的所有信息都是直接从SEC文件获取的事实数据',
            '本应用不推荐购买、出售或持有任何特定证券',
            '过去的内幕交易模式不保证未来表现',
            '所有投资决策及相关风险完全由用户承担',
            '在做出投资决策前，请咨询合格的金融专业人士'
          ],
          checkboxLabel: '我已阅读并理解上述内容，并确认本应用不提供投资建议',
          acceptButton: '同意并继续'
        };
      default:
        return {
          title: 'Legal Notice & Disclaimer',
          subtitle: 'Please read before using this app',
          mainText: 'This app is a data research tool that collects, organizes, and visualizes publicly available SEC (Securities and Exchange Commission) filing data. This app does NOT provide investment advice, financial guidance, or securities recommendations.',
          bullets: [
            'All information displayed is factual data sourced directly from SEC filings',
            'This app does not recommend buying, selling, or holding any securities',
            'Past insider trading patterns do not guarantee future performance',
            'All investment decisions and associated risks are solely your responsibility',
            'Consult a qualified financial professional before making investment decisions'
          ],
          checkboxLabel: 'I have read and understood the above, and acknowledge that this app does not provide investment advice',
          acceptButton: 'I Agree & Continue'
        };
    }
  };

  const content = getDisclaimerText();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg bg-[#0a0a0a] border-neutral-800 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Shield className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center text-neutral-100">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400 text-center">
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
          <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300 leading-relaxed">
                {content.mainText}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pl-2">
            {content.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {bullet}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5 border-neutral-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                data-testid="checkbox-landing-disclaimer-agree"
              />
              <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed">
                {content.checkboxLabel}
              </span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500"
            data-testid="button-landing-disclaimer-accept"
          >
            {content.acceptButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
