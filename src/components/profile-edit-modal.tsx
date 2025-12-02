import { useState, useEffect, useRef } from 'react';
import { X, User, Upload, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { toast } from 'sonner';
import { DEFAULT_PROFILE_QUESTIONS } from '@/types/preferences';
import type { ProfileContextItem } from '@/types/preferences';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const profileName = useStore(state => state.profileName);
  const profileDescription = useStore(state => state.profileDescription);
  const profileImagePath = useStore(state => state.profileImagePath);
  const profileContext = useStore(state => state.profileContext);
  const updateProfile = useStore(state => state.updateProfile);
  const updateProfileImage = useStore(state => state.updateProfileImage);
  const removeProfileImage = useStore(state => state.removeProfileImage);
  const getProfileImageUrl = useStore(state => state.getProfileImageUrl);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contextAnswers, setContextAnswers] = useState<ProfileContextItem[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when modal opens or profile data changes
  useEffect(() => {
    if (isOpen) {
      setName(profileName || '');
      setDescription(profileDescription || '');

      // Initialize context answers with all questions
      const initialAnswers = DEFAULT_PROFILE_QUESTIONS.map(question => {
        const existing = profileContext.find(item => item.question === question);
        return {
          question,
          answer: existing?.answer || '',
        };
      });
      setContextAnswers(initialAnswers);

      // Load profile image
      if (profileImagePath) {
        getProfileImageUrl()
          .then(url => setImageUrl(url))
          .catch(() => setImageUrl(null));
      } else {
        setImageUrl(null);
      }
    }
  }, [isOpen, profileName, profileDescription, profileContext, profileImagePath, getProfileImageUrl]);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      await updateProfileImage(file);
      const url = await getProfileImageUrl();
      setImageUrl(url);
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    setIsUploadingImage(true);
    try {
      await removeProfileImage();
      setImageUrl(null);
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Filter out empty answers
      const filteredContext = contextAnswers.filter(item => item.answer.trim() !== '');

      await updateProfile({
        profile_name: name.trim() || undefined,
        profile_description: description.trim() || undefined,
        profile_context: filteredContext,
      });

      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextAnswerChange = (index: number, answer: string) => {
    const updated = [...contextAnswers];
    updated[index] = { ...updated[index], answer };
    setContextAnswers(updated);
  };

  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[900px] mx-4 bg-background rounded-2xl shadow-2xl border border-border max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-foreground">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">
                Personalize your account and AI assistant context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar Upload */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32">
                  {imageUrl && <AvatarImage src={imageUrl} alt={name || 'User'} />}
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                    {initials || <User className="w-12 h-12" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2 w-full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>

                  {imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG or WebP. Max 500KB.
                </p>
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="md:col-span-2 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {name.length}/100
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  About
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="A brief description about yourself"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-foreground placeholder:text-muted-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {description.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Context Questions - Full Width */}
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Context for AI Assistant
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Help the AI understand your decision-making context by answering these questions.
              All fields are optional.
            </p>

            <div className="space-y-4">
              {contextAnswers.map((item, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {item.question}
                  </label>
                  <textarea
                    value={item.answer}
                    onChange={e => handleContextAnswerChange(index, e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Optional - share what's relevant..."
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-foreground placeholder:text-muted-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {item.answer.length}/2000
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/50 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
