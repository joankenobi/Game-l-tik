import React, { memo } from 'react';

const EventTicker = memo(({ events }) => {
    // Only show last 10 events to keep DOM light
    const displayEvents = events.slice(-10);

    return (
        <div className="fixed bottom-4 left-3 right-3 z-50">
            <div className="bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 border border-fire-primary/30 shadow-lg overflow-hidden">
                <span className="material-icons-round text-fire-primary text-sm animate-pulse">campaign</span>
                <div className="flex-1 overflow-hidden relative h-5">
                    <div className="absolute whitespace-nowrap animate-marquee flex gap-8 items-center text-xs font-medium text-slate-200">
                        {displayEvents.length === 0 ? (
                            <span>Waiting for events... join the live!</span>
                        ) : (
                            displayEvents.map((event, i) => (
                                <EventItem key={i} event={event} />
                            ))
                        )}
                        {/* Duplicate for infinite loop illusion if enough items */}
                        {displayEvents.length > 5 && displayEvents.map((event, i) => (
                            <EventItem key={`dup-${i}`} event={event} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

const EventItem = ({ event }) => {
    if (event.type === 'gift') {
        return (
            <span>
                <span className="text-fire-secondary font-bold">@{event.username}</span> sent a <span className="text-fire-primary font-bold">{event.gift}</span> to <span className="text-white font-bold text-glow-fire">{event.country}</span> (+{event.points})
            </span>
        );
    }
    // Like event (aggregated)
    return (
        <span>
            <span className="text-ice-accent font-bold">@{event.username || 'User'}</span> liked <span className="text-fire-secondary font-bold">{event.country}</span>!
        </span>
    );
}

export default EventTicker;
