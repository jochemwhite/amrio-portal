import { LucideIcon, LucideProps } from "lucide-react";
import {
  Facebook,
  Instagram,
  Twitter,
  Music2,
  Camera,
  MessageCircle,
  Linkedin,
  MessageSquare,
  Send,
  MessageCircleMore,
  Users,
  Mail,
  Youtube,
  Tv,
  Github,
  Music,
  Apple,
  Chrome,
  Box,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  // Social Media
  facebook: Facebook,
  instagram: Instagram,
  x: Twitter,
  tiktok: Music2,
  snapchat: Camera,
  reddit: MessageCircle,
  linkedin: Linkedin,
  // Messaging
  whatsapp: MessageSquare,
  telegram: Send,
  discord: MessageCircleMore,
  slack: Users,
  messenger: Mail,
  // Video/Streaming
  youtube: Youtube,
  twitch: Tv,
  // Professional/Dev
  github: Github,
  // Other
  spotify: Music,
  apple: Apple,
  google: Chrome,
  microsoft: Box,
  amazon: ShoppingCart,
  paypal: CreditCard,
};

interface SocialIconProps extends Omit<LucideProps, "ref"> {
  icon: keyof typeof iconMap;
}

export function SocialIcon({ icon, size = 24, ...props }: SocialIconProps) {
  const Icon = iconMap[icon];

  if (!Icon) {
    return null;
  }

  return <Icon size={size} {...props} />;
}

// Usage example:
// <SocialIcon icon="github" size={32} className="text-blue-500" />
