package com.ticketnepal.controller;

import com.ticketnepal.model.Event;
import com.ticketnepal.repository.EventRepository;
import com.ticketnepal.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.ticketnepal.service.ImageService;

import java.util.*;
import java.util.regex.Pattern;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.OffsetDateTime;

@Configuration
@EnableScheduling
@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Pattern INVALID_CHARS = Pattern.compile("[^a-zA-Z0-9._-]");
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ImageService imageService;

    // Get all events for an organizer
    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<List<Map<String, Object>>> getEventsByOrganizer(@PathVariable String organizerId) {
        try {
            List<Event> events = eventRepository.findByOrganizer(organizerId);
            // Filter out deleted events
            events.removeIf(e -> Boolean.TRUE.equals(e.getDeleted()));
            List<Map<String, Object>> result = new ArrayList<>();
            for (Event event : events) {
                Map<String, Object> eventMap = new HashMap<>();
                eventMap.put("id", event.getId());
                eventMap.put("name", event.getName());
                eventMap.put("category", event.getCategory());
                eventMap.put("location", event.getLocation());
                eventMap.put("description", event.getDescription());
                eventMap.put("organizer", event.getOrganizer());
                eventMap.put("imageUrl", event.getImageUrl());
                eventMap.put("price", event.getPrice());
                eventMap.put("income", event.getIncome());
                eventMap.put("seats", event.getSeats());
                eventMap.put("eventStart", event.getEventStart());
                eventMap.put("eventEnd", event.getEventEnd());
                // Add ticketsSold
                long ticketsSold = ticketRepository.countByEventId(event.getId());
                eventMap.put("ticketsSold", ticketsSold);
                result.add(eventMap);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to fetch events for organizer: {}", organizerId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Filter/search events
    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String organizer
    ) {
        try {
            List<Event> events;
            if (category != null && location != null) {
                events = eventRepository.findByCategoryAndLocationContainingIgnoreCase(category, location);
            } else if (category != null) {
                events = eventRepository.findByCategory(category);
            } else if (location != null) {
                events = eventRepository.findByLocationContainingIgnoreCase(location);
            } else if (name != null) {
                events = eventRepository.findByNameContainingIgnoreCase(name);
            } else if (organizer != null) {
                events = eventRepository.findByOrganizerContainingIgnoreCase(organizer);
            } else {
                events = eventRepository.findAll();
            }
            // Filter out deleted events
            events.removeIf(e -> Boolean.TRUE.equals(e.getDeleted()));
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Failed to fetch events", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get event detail by id
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable String id) {
        try {
            return eventRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Failed to fetch event with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Create event (with eventStart and eventEnd)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createEvent(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("eventStart") String eventStartStr,
            @RequestParam("eventEnd") String eventEndStr,
            @RequestParam("location") String location,
            @RequestParam("price") double price,
            @RequestParam(value = "seats", required = false) String seatsCsv,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestParam("organizerId") String organizerId
    ) {
        try {
            Event event = new Event();
            event.setName(name);
            event.setDescription(description);
            event.setCategory(category);
            event.setLocation(location);
            event.setPrice(price);
            event.setOrganizer(organizerId);

            // Store eventStart and eventEnd as strings directly
            event.setEventStart(eventStartStr);
            event.setEventEnd(eventEndStr);

            // Parse seats from CSV string (e.g., "A1,A2,A3")
            if (seatsCsv != null && !seatsCsv.isEmpty()) {
                List<String> seats = Arrays.asList(seatsCsv.split(","));
                event.setSeats(seats);
            }

            if (imageFile != null && !imageFile.isEmpty()) {
                validateImageFile(imageFile);
                String imageUrl = imageService.uploadImage(imageFile);
                event.setImageUrl(imageUrl);
            }

            Event savedEvent = eventRepository.save(event);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to create event", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Update event (with eventStart and eventEnd)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEvent(
            @PathVariable String id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "eventStart", required = false) String eventStartStr,
            @RequestParam(value = "eventEnd", required = false) String eventEndStr,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "seats", required = false) String seatsCsv,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "organizerId", required = false) String organizerId
    ) {
        try {
            Event existingEvent = eventRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Event not found"));

            if (name != null) existingEvent.setName(name);
            if (description != null) existingEvent.setDescription(description);
            if (category != null) existingEvent.setCategory(category);
            if (location != null) existingEvent.setLocation(location);
            if (price != null) existingEvent.setPrice(price);
            if (organizerId != null) existingEvent.setOrganizer(organizerId);

            // Store eventStart and eventEnd as strings directly if provided
            if (eventStartStr != null) existingEvent.setEventStart(eventStartStr);
            if (eventEndStr != null) existingEvent.setEventEnd(eventEndStr);

            if (seatsCsv != null && !seatsCsv.isEmpty()) {
                List<String> seats = Arrays.asList(seatsCsv.split(","));
                existingEvent.setSeats(seats);
            }

            if (imageFile != null && !imageFile.isEmpty()) {
                validateImageFile(imageFile);
                String imageUrl = imageService.uploadImage(imageFile);
                existingEvent.setImageUrl(imageUrl);
            }

            Event updatedEvent = eventRepository.save(existingEvent);
            return ResponseEntity.ok(updatedEvent);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to update event", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        try {
            eventRepository.findById(id).ifPresent(event -> {
                LocalDateTime now = LocalDateTime.now();
                String eventEndStr = event.getEventEnd();
                OffsetDateTime eventEnd = null;
                if (eventEndStr != null) {
                    try {
                        eventEnd = OffsetDateTime.parse(eventEndStr, DateTimeFormatter.ISO_DATE_TIME);
                    } catch (Exception e) {
                        logger.warn("Failed to parse eventEnd for event {}: {}", event.getId(), eventEndStr);
                    }
                }
                boolean hasTickets = ticketRepository.countByEventId(event.getId()) > 0;
                boolean canDelete = false;
                if (!hasTickets) {
                    canDelete = true; // No tickets, can delete anytime
                } else if (eventEnd != null && eventEnd.toLocalDateTime().isBefore(now)) {
                    canDelete = true; // Has tickets, can only delete after event ends
                }
                if (canDelete) {
                    // Delete all tickets for this event
                    ticketRepository.findByEventId(event.getId()).forEach(ticket -> {
                        ticketRepository.deleteById(ticket.getId());
                    });
                    if (event.getImageUrl() != null) {
                        try {
                            imageService.deleteImageByUrl(event.getImageUrl());
                        } catch (Exception e) {
                            logger.warn("Failed to delete image from Cloudinary: {}", event.getImageUrl(), e);
                        }
                    }
                    // Soft delete: mark event as deleted, but keep revenue and ticketsSold
                    event.setDeleted(true);
                    eventRepository.save(event);
                    logger.info("Soft-deleted event {} and its tickets.", event.getId());
                } else {
                    logger.warn("Event {} not deleted: eventEnd={}, now={}, hasTickets={}", event.getId(), eventEndStr, now, hasTickets);
                }
            });
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Failed to delete event with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Scheduled task to delete events after eventEnd
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void deleteExpiredEvents() {
        List<Event> expiredEvents = eventRepository.findByEventEndBefore(LocalDateTime.now());
        for (Event event : expiredEvents) {
            try {
                // Delete all tickets for this event
                ticketRepository.findByEventId(event.getId()).forEach(ticket -> {
                    ticketRepository.deleteById(ticket.getId());
                });
                if (event.getImageUrl() != null) {
                    try {
                        imageService.deleteImageByUrl(event.getImageUrl());
                    } catch (Exception e) {
                        logger.warn("Failed to delete image from Cloudinary: {}", event.getImageUrl(), e);
                    }
                }
                eventRepository.deleteById(event.getId());
                logger.info("Deleted expired event and its tickets: {}", event.getId());
            } catch (Exception e) {
                logger.error("Failed to delete expired event: {}", event.getId(), e);
            }
        }
    }

    // Helper methods remain unchanged
    private void validateImageFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }

        if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF, or WebP images are allowed");
        }
    }
}
