import { useRef, useState } from "react";
import { format, parseISO, getMonth, getYear, isBefore, isAfter, addYears, startOfYear } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FamilyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring: boolean;
}

interface EventTimelineProps {
  events: FamilyEvent[];
}

const EventTimeline = ({ events }: EventTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Process events - for recurring events, calculate next occurrence
  const processedEvents = events.map(event => {
    const eventDate = parseISO(event.event_date);
    const today = new Date();
    
    let displayDate = eventDate;
    
    if (event.is_recurring) {
      // For recurring events, find the next occurrence
      const thisYearDate = new Date(getYear(today), getMonth(eventDate), eventDate.getDate());
      
      if (isBefore(thisYearDate, today)) {
        // If this year's date has passed, show next year
        displayDate = addYears(thisYearDate, 1);
      } else {
        displayDate = thisYearDate;
      }
    }
    
    return {
      ...event,
      displayDate,
      originalDate: eventDate
    };
  }).sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());

  if (processedEvents.length === 0) {
    return null;
  }

  const getMonthName = (date: Date) => {
    return format(date, 'MMMM', { locale: vi });
  };

  const getDay = (date: Date) => {
    return format(date, 'dd');
  };

  return (
    <section className="py-16 md:py-24 bg-secondary/50">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            <Calendar className="h-4 w-4" />
            <span>Lịch Dòng Họ</span>
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
            Các <span className="text-primary">Ngày Quan Trọng</span>
          </h2>
          <p className="text-muted-foreground">
            Những ngày giỗ, lễ hội, họp mặt dòng họ cần nhớ
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background shadow-lg transition-opacity",
              !canScrollLeft && "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background shadow-lg transition-opacity",
              !canScrollRight && "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Scrollable Timeline */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {processedEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="flex-shrink-0 w-64 md:w-72"
              >
                <div className="relative group">
                  {/* Timeline Line */}
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2">
                    <div className="h-8 w-px bg-gradient-to-b from-transparent to-primary/50" />
                  </div>
                  
                  {/* Date Circle */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative z-10 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                      <span className="text-xl font-bold leading-none">
                        {getDay(event.displayDate)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider opacity-90">
                        Tháng {format(event.displayDate, 'M')}
                      </span>
                    </div>
                    
                    {/* Recurring Indicator */}
                    {event.is_recurring && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-accent-foreground shadow-md" title="Hàng năm">
                        <Repeat className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Event Card */}
                  <div className="mt-4 rounded-xl bg-background p-4 shadow-md transition-all duration-300 group-hover:shadow-elegant group-hover:-translate-y-1 border">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">
                        {getMonthName(event.displayDate)} {format(event.displayDate, 'yyyy')}
                      </span>
                    </div>
                    <h3 className="mb-2 font-serif text-lg font-semibold line-clamp-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.is_recurring && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <Repeat className="h-3 w-3" />
                        <span>Lặp lại hàng năm</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventTimeline;
