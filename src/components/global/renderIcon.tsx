import {
  SiApple,
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiGoogle,
  SiInstagram,
  SiMessenger,
  SiPaypal,
  SiReddit,
  SiSnapchat,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube
} from '@icons-pack/react-simple-icons';
import { ComponentType, SVGProps } from "react";

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  // Social Media
  facebook: SiFacebook,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  snapchat: SiSnapchat,
  reddit: SiReddit,
  // Messaging
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  discord: SiDiscord,
  messenger: SiMessenger,
  // Video/Streaming
  youtube: SiYoutube,
  twitch: SiTwitch,
  // Professional/Dev
  github: SiGithub,
  // Other
  spotify: SiSpotify,
  apple: SiApple,
  google: SiGoogle,
  paypal: SiPaypal,
};

interface SocialIconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "width" | "height"> {
  icon: keyof typeof iconMap;
  size?: number | string;
}

export function SocialIcon({ icon, size = 24, ...props }: SocialIconProps) {
  const Icon = iconMap[icon];

  if (!Icon) {
    return null;
  }

  const sizeValue = typeof size === "number" ? size : parseInt(size, 10) || 24;

  return <Icon width={sizeValue} height={sizeValue} {...props} />;
}

