import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

interface SocialShareProps {
  tradeId?: string;
  companyName?: string;
  ticker?: string;
  tradeValue?: number;
  tradeType?: string;
}

export function SocialShare({ tradeId, companyName, ticker, tradeValue, tradeType }: SocialShareProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  const shareUrl = tradeId
    ? `${window.location.origin}/trade/${tradeId}`
    : window.location.href;

  const shareText = companyName && ticker && tradeValue
    ? `🚨 Insider Alert: ${tradeType === 'P-Purchase' ? 'BUY' : 'SELL'} detected at ${companyName} (${ticker}) - $${(tradeValue / 1000000).toFixed(1)}M | Track insider trades on InsiderPulse`
    : `Track real-time insider trading on InsiderPulse - See what executives are buying & selling!`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('social.linkCopied'),
        description: t('social.linkCopiedDesc'),
      });
    } catch (err) {
      toast({
        title: t('social.copyFailed'),
        description: t('social.copyFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="flex items-center gap-1"
      >
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="flex items-center gap-1"
      >
        <Facebook className="h-4 w-4" />
        <span className="hidden sm:inline">Facebook</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center gap-1"
      >
        <Link2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t('social.copyLink')}</span>
      </Button>
    </div>
  );
}

interface ShareButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({ variant = 'outline', size = 'sm' }: ShareButtonProps) {
  const { t } = useLanguage();
  const shareUrl = window.location.href;
  const shareText = "Track real-time insider trading on InsiderPulse!";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InsiderPulse',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare}>
      <Share2 className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('social.share')}</span>
    </Button>
  );
}
