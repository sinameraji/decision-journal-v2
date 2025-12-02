import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useStore } from '@/store';

interface UserAvatarButtonProps {
  onClick: () => void;
}

export function UserAvatarButton({ onClick }: UserAvatarButtonProps) {
  const profileImagePath = useStore(state => state.profileImagePath);
  const profileName = useStore(state => state.profileName);
  const getProfileImageUrl = useStore(state => state.getProfileImageUrl);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileImagePath) {
      getProfileImageUrl()
        .then(url => setImageUrl(url))
        .catch(() => setImageUrl(null));
    } else {
      setImageUrl(null);
    }
  }, [profileImagePath, getProfileImageUrl]);

  const initials = profileName
    ? profileName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <button
      onClick={onClick}
      className="relative rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-foreground/20"
      aria-label="Edit profile"
    >
      <Avatar className="w-9 h-9">
        {imageUrl && <AvatarImage src={imageUrl} alt={profileName || 'User'} />}
        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
          {initials || <User className="w-5 h-5" />}
        </AvatarFallback>
      </Avatar>
    </button>
  );
}
