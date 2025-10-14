import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes, StoryTab, parseTabParam } from './routes';

// Analytics shim (replace with your collector)
type Track = (event: string, props?: Record<string, unknown>) => void;
export const track: Track = (event, props) => {
  window.dispatchEvent(new CustomEvent('analytics', { detail: { event, ...props } }));
};

type LSLinkProps = React.ComponentProps<typeof Link> & {
  event?: string;
  eventProps?: Record<string, unknown>;
};

// Link wrapper centralizing ARIA + tracking
export function LSLink({ event, eventProps, ...props }: LSLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (event) track(event, { ...eventProps, href: props.to });
      }}
    />
  );
}

// Purpose-built Create links
export function CreateStoryLink({
  tab, promptId, personId, childrenIds, circle, album, source = 'link', children, ...rest
}: {
  tab: StoryTab; promptId?: string; personId?: string; childrenIds?: string[];
  circle?: string; album?: string; source?: string; children: React.ReactNode;
} & Omit<LSLinkProps, 'to'>) {
  const to = routes.storyNew({ tab, promptId, personId, children: childrenIds, circle, album, source });
  return (
    <LSLink
      to={to}
      aria-label={`Create ${tab} story`}
      event="create_story_link_click"
      eventProps={{ tab, source }}
      {...rest}
    >
      {children}
    </LSLink>
  );
}

// Hero helpers
export const AddPhotoHeroTile = (props: Omit<LSLinkProps, 'to'>) => (
  <CreateStoryLink tab="photo" source="hero" className="tile" {...props}>
    Add Photo
  </CreateStoryLink>
);

export const TodaysPromptHeroTile = (props: Omit<LSLinkProps, 'to'>) => (
  <LSLink
    to={routes.todaysPrompt()}
    aria-label="Today's Prompt"
    event="hero_tile_click"
    eventProps={{ tile: 'todays_prompt' }}
    className="tile"
    {...props}
  >
    Today's Prompt
  </LSLink>
);

// Hook for /stories/new to read params
export function useComposerParams() {
  const loc = useLocation();
  return parseTabParam(loc.search);
}
