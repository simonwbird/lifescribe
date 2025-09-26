import React, { useState, useEffect } from 'react';
import { Heart, Smile, Star, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotionalNudgesProps {
  userAge: 'child' | 'teen' | 'adult' | 'elder';
  selectedFormat: 'voice' | 'video' | 'text';
  hasResponded: boolean;
}

const nudgesByAge = {
  elder: {
    voice: [
      "Your family will love hearing your voice.",
      "No need to be perfect—just talk.",
      "Your stories matter more than you know.",
      "Share your wisdom—we're all listening."
    ],
    video: [
      "Let them see your smile.",
      "Your expressions tell the best stories.",
      "Nothing beats seeing you talk.",
      "Face-to-face, even from far away."
    ],
    text: [
      "Take your time—write from the heart.",
      "Your words carry so much meaning.",
      "Every sentence is a gift to family.",
      "Write like you're talking to a friend."
    ],
    general: [
      "Want to see what others are sharing? Tap Family Feed.",
      "Every story you share brings the family closer.",
      "Your memories are treasures worth sharing."
    ]
  },
  adult: {
    voice: [
      "Your voice brings stories to life.",
      "Just hit record and be yourself.",
      "Family loves hearing from you.",
      "Speak from the heart—that's enough."
    ],
    video: [
      "Show your personality on camera.",
      "Video makes it feel like you're right there.",
      "Let your expressions tell the story.",
      "Face-to-face connection, made simple."
    ],
    text: [
      "Take a moment to reflect and write.",
      "Your written words will be treasured.",
      "Sometimes writing captures feelings best.",
      "Create something they can read again and again."
    ],
    general: [
      "Check out the Family Feed for inspiration.",
      "Your stories become family history.",
      "Share the moments that matter to you."
    ]
  },
  teen: {
    voice: [
      "Just talk—no scripts needed! 🎤",
      "Your voice = instant family connection.",
      "Hit record and let it flow!",
      "Be real, be you—family loves it."
    ],
    video: [
      "Show your style on camera! 📹",
      "Video = ultimate storytelling.",
      "Let your personality shine through!",
      "Make it fun—family will love seeing you."
    ],
    text: [
      "Write your thoughts, your way ✍️",
      "Text lets you say exactly what you mean.",
      "Take time to craft something special.",
      "Your words = future family memories."
    ],
    general: [
      "Check out what family's been up to! 👀",
      "Your stories make the family group chat legendary.",
      "Share the moments that made you smile today."
    ]
  },
  child: {
    voice: [
      "Talk about anything you want! 🌟",
      "Family loves hearing your voice!",
      "Just press and talk—so easy!",
      "Tell us about your day!"
    ],
    video: [
      "Show everyone your big smile! 😊",
      "Make a fun video for family!",
      "Let them see your happy face!",
      "Videos are like magic—try it!"
    ],
    text: [
      "Write about something awesome! ✨",
      "Tell a story with words!",
      "What made you happy today?",
      "Family loves reading what you write!"
    ],
    general: [
      "See what fun things family shared! 🎉",
      "Every story you share makes family happy!",
      "What awesome thing happened today?"
    ]
  }
};

export default function EmotionalNudges({
  userAge,
  selectedFormat,
  hasResponded
}: EmotionalNudgesProps) {
  const [currentNudgeIndex, setCurrentNudgeIndex] = useState(0);
  const [showIcon, setShowIcon] = useState(true);

  const nudges = nudgesByAge[userAge];
  const formatNudges = nudges[selectedFormat] || [];
  const generalNudges = nudges.general || [];
  const allNudges = [...formatNudges, ...generalNudges];

  // Rotate through nudges every 8 seconds
  useEffect(() => {
    if (allNudges.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNudgeIndex(prev => (prev + 1) % allNudges.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [allNudges.length]);

  // Icon animation
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setShowIcon(prev => !prev);
    }, 2000);

    return () => clearInterval(iconInterval);
  }, []);

  if (allNudges.length === 0) return null;

  const currentNudge = allNudges[currentNudgeIndex];
  const isFormatSpecific = formatNudges.includes(currentNudge);

  const getIcon = () => {
    if (isFormatSpecific) {
      switch (selectedFormat) {
        case 'voice': return MessageCircle;
        case 'video': return Star;
        case 'text': return Heart;
        default: return Smile;
      }
    }
    return Smile;
  };

  const IconComponent = getIcon();

  return (
    <div className="text-center py-4">
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-muted/30 text-muted-foreground transition-all duration-500",
        "border border-muted/20"
      )}>
        <IconComponent 
          className={cn(
            "h-4 w-4 transition-all duration-300",
            showIcon ? "scale-100 opacity-100" : "scale-75 opacity-60",
            isFormatSpecific && "text-primary"
          )} 
        />
        <span className={cn(
          "text-sm font-medium transition-opacity duration-500",
          userAge === 'child' && "text-base",
          userAge === 'teen' && "font-semibold"
        )}>
          {currentNudge}
        </span>
      </div>
    </div>
  );
}