package com.ticketnepal.repository;

import com.ticketnepal.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByCategory(String category);
    // Removed: List<Event> findByDate(String date);
    List<Event> findByOrganizer(String organizerId);
    List<Event> findByNameContainingIgnoreCase(String name);
    List<Event> findByLocationContainingIgnoreCase(String location);
    List<Event> findByOrganizerContainingIgnoreCase(String organizer);
    List<Event> findByCategoryAndLocationContainingIgnoreCase(String category, String location);

    // New: Find events that have ended (for scheduled deletion)
    List<Event> findByEventEndBefore(LocalDateTime now);
}
