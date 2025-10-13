import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvent';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RSVPSection } from '@/components/events/RSVPSection';
import { EventUploadLink } from '@/components/events/EventUploadLink';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, myRsvp, rsvpCounts, isLoading, updateRsvp, isUpdating } = useEvent(eventId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-24 w-full mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Event Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">This event doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate('/home-v2')}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/print/event/${eventId}`)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">
                {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-sm">
                at {format(new Date(event.event_date), 'h:mm a')}
              </span>
            </div>
            {event.event_place && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{event.event_place}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP and Upload sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <RSVPSection
            myResponse={myRsvp?.response || null}
            counts={rsvpCounts}
            onUpdate={updateRsvp}
            isUpdating={isUpdating}
          />

          <EventUploadLink
            eventId={eventId!}
            uploadToken="demo-token"
          />
        </div>

        {/* Event Summary (for completed events) */}
        {event.status === 'completed' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Event Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {rsvpCounts.yes} people attended this event
              </p>
              <Button variant="outline" className="w-full">
                View Photo Collage & Summary
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
