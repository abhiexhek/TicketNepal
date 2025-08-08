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
import com.ticketnepal.repository.UserRepository;
import com.ticketnepal.model.User;
import com.ticketnepal.service.EmailService;
import com.ticketnepal.model.StaffApplication;
import com.ticketnepal.repository.StaffApplicationRepository;
import java.util.UUID;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import java.time.format.DateTimeParseException;

@Configuration
@EnableScheduling
@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    @Value("${app.base-url}")
    private String baseUrl;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ImageService imageService;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private StaffApplicationRepository staffApplicationRepository;



    // Professional Organizer Dashboard with Analytics
    @GetMapping("/organizer/{organizerId}/dashboard")
    public ResponseEntity<Map<String, Object>> getOrganizerDashboard(@PathVariable String organizerId) {
        try {
            List<Event> events = eventRepository.findByOrganizer(organizerId);
            // Filter out deleted events
            events.removeIf(e -> Boolean.TRUE.equals(e.getDeleted()));
            
            Map<String, Object> dashboard = new HashMap<>();
            
            // Calculate comprehensive statistics
            double totalRevenue = 0.0;
            long totalTicketsSold = 0;
            int upcomingEvents = 0;
            int pastEvents = 0;
            int ongoingEvents = 0;
            int draftEvents = 0;
            
            LocalDateTime now = LocalDateTime.now();
            List<Map<String, Object>> eventAnalytics = new ArrayList<>();
            
            for (Event event : events) {
                long ticketsSold = ticketRepository.countByEventId(event.getId());
                double eventRevenue = event.getIncome() != null ? event.getIncome() : 0.0;
                
                totalRevenue += eventRevenue;
                totalTicketsSold += ticketsSold;
                
                // Determine event status
                String eventStatus = "draft";
                if (event.getEventStart() != null && event.getEventEnd() != null) {
                    try {
                        LocalDateTime eventStart = parseToLocalDateTime(event.getEventStart());
                        LocalDateTime eventEnd = parseToLocalDateTime(event.getEventEnd());
                        
                        if (now.isBefore(eventStart)) {
                            eventStatus = "upcoming";
                            upcomingEvents++;
                        } else if (now.isAfter(eventEnd)) {
                            eventStatus = "past";
                            pastEvents++;
                        } else {
                            eventStatus = "ongoing";
                            ongoingEvents++;
                        }
                    } catch (Exception e) {
                        logger.warn("Failed to parse event dates for event: {}", event.getId());
                        draftEvents++;
                    }
                } else {
                    draftEvents++;
                }
                
                // Create event analytics object
                Map<String, Object> eventAnalytic = new HashMap<>();
                eventAnalytic.put("id", event.getId());
                eventAnalytic.put("name", event.getName());
                eventAnalytic.put("category", event.getCategory());
                eventAnalytic.put("location", event.getLocation());
                eventAnalytic.put("imageUrl", event.getImageUrl());
                eventAnalytic.put("price", event.getPrice());
                eventAnalytic.put("income", eventRevenue);
                eventAnalytic.put("ticketsSold", ticketsSold);
                eventAnalytic.put("eventStart", event.getEventStart());
                eventAnalytic.put("eventEnd", event.getEventEnd());
                eventAnalytic.put("status", eventStatus);
                eventAnalytic.put("seats", event.getSeats());
                
                eventAnalytics.add(eventAnalytic);
            }
            
            // Calculate growth metrics (mock data for now)
            double revenueGrowth = totalRevenue > 0 ? Math.random() * 25 + 5 : 0; // 5-30% growth
            double ticketGrowth = totalTicketsSold > 0 ? Math.random() * 20 + 10 : 0; // 10-30% growth
            
            // Get organizer info
            Optional<User> organizerOpt = userRepository.findById(organizerId);
            Map<String, Object> organizerInfo = new HashMap<>();
            if (organizerOpt.isPresent()) {
                User organizer = organizerOpt.get();
                organizerInfo.put("name", organizer.getName());
                organizerInfo.put("email", organizer.getEmail());
                organizerInfo.put("role", organizer.getRole());
            }
            
            // Build dashboard response
            dashboard.put("organizer", organizerInfo);
            dashboard.put("events", eventAnalytics);
            dashboard.put("statistics", Map.of(
                "totalRevenue", totalRevenue,
                "totalTicketsSold", totalTicketsSold,
                "upcomingEvents", upcomingEvents,
                "pastEvents", pastEvents,
                "ongoingEvents", ongoingEvents,
                "draftEvents", draftEvents,
                "totalEvents", events.size(),
                "revenueGrowth", revenueGrowth,
                "ticketGrowth", ticketGrowth
            ));
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            logger.error("Failed to fetch organizer dashboard for: {}", organizerId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

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
            @RequestParam(required = false) String organizer,
            @RequestParam(required = false) String eventStart
    ) {
        try {
            List<Event> events;
            
            // Start with all events
            events = eventRepository.findAll();
            
            // Apply filters
            if (category != null && !category.isEmpty() && !category.trim().isEmpty() && !"all".equals(category)) {
                events = events.stream()
                    .filter(e -> category.equals(e.getCategory()))
                    .collect(Collectors.toList());
            }
            
            if (location != null && !location.isEmpty()) {
                events = events.stream()
                    .filter(e -> e.getLocation() != null && e.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .collect(Collectors.toList());
            }
            
            if (name != null && !name.isEmpty()) {
                events = events.stream()
                    .filter(e -> e.getName() != null && e.getName().toLowerCase().contains(name.toLowerCase()))
                    .collect(Collectors.toList());
            }
            
            if (organizer != null && !organizer.isEmpty()) {
                events = events.stream()
                    .filter(e -> e.getOrganizer() != null && e.getOrganizer().toLowerCase().contains(organizer.toLowerCase()))
                    .collect(Collectors.toList());
            }
            
            // Date filtering - check if selected date falls within event date range
            if (eventStart != null && !eventStart.isEmpty()) {
                events = events.stream()
                    .filter(e -> {
                        if (e.getEventStart() == null || e.getEventEnd() == null) return false;
                        try {
                            // Parse event start and end dates (get YYYY-MM-DD part)
                            String eventStartDate = e.getEventStart().split("T")[0];
                            String eventEndDate = e.getEventEnd().split("T")[0];
                            
                            // Log for debugging
                            logger.debug("Date filter - Selected: {}, Event: {} to {}", eventStart, eventStartDate, eventEndDate);
                            
                            // Check if selected date falls within the event date range (inclusive)
                            boolean isInRange = eventStart.compareTo(eventStartDate) >= 0 && eventStart.compareTo(eventEndDate) <= 0;
                            logger.debug("Event {} is in range: {}", e.getName(), isInRange);
                            return isInRange;
                        } catch (Exception ex) {
                            logger.error("Error parsing date for event: {}", e.getName(), ex);
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
            }
            
            // Hide events that ended more than 1 day ago
            LocalDateTime now = LocalDateTime.now();
            events = events.stream()
                .filter(e -> {
                    if (e.getEventEnd() == null) return true;
                    try {
                        LocalDateTime end = parseToLocalDateTime(e.getEventEnd());
                        return now.isBefore(end.plusDays(1));
                    } catch (Exception ex) {
                        logger.warn("Failed to parse eventEnd for event: {}", e.getId());
                        return true;
                    }
                })
                .collect(Collectors.toList());
            
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

    @PostMapping("/{eventId}/apply-staff")
    public ResponseEntity<?> applyAsStaff(@PathVariable String eventId, @RequestBody Map<String, String> body) {
        try {
            String staffId = body.get("staffId");
            if (staffId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing staffId"));
            }
            Optional<Event> eventOpt = eventRepository.findById(eventId);
            if (eventOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
            }
            Event event = eventOpt.get();
            Optional<User> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Staff user not found"));
            }
            User staff = staffOpt.get();
            Optional<User> organizerOpt = userRepository.findById(event.getOrganizer());
            if (organizerOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organizer not found"));
            }
            User organizer = organizerOpt.get();
            // Check if already applied
            Optional<StaffApplication> existing = staffApplicationRepository.findByEventIdAndStaffId(eventId, staffId);
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Already applied for this event."));
            }
            // Create application
            String token = UUID.randomUUID().toString();
            StaffApplication app = new StaffApplication(eventId, staffId, "PENDING", token);
            staffApplicationRepository.save(app);
            // Compose email with approve/reject links
            // baseUrl is now injected from properties
            String approveLink = baseUrl + "/api/events/" + eventId + "/approve-staff?staffId=" + staffId + "&token=" + token;
            String rejectLink = baseUrl + "/api/events/" + eventId + "/reject-staff?staffId=" + staffId + "&token=" + token;
            String subject = "Staff Application for Event: " + event.getName();
            String text = String.format(
                "Hello %s,\n\nStaff user %s (username: %s, email: %s) has applied to work at your event:\n\n" +
                "Event: %s\nDate: %s\nLocation: %s\n\nApprove: %s\nReject: %s\n\nTicketNepal Team",
                organizer.getName(), staff.getName(), staff.getUsername(), staff.getEmail(),
                event.getName(), event.getEventStart(), event.getLocation(),
                approveLink, rejectLink
            );
            emailService.sendSimpleMessage(organizer.getEmail(), subject, text);
            return ResponseEntity.ok(Map.of("message", "Staff application sent to organizer."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to apply as staff."));
        }
    }

    @GetMapping("/{eventId}/approve-staff")
    public ResponseEntity<?> approveStaff(@PathVariable String eventId, @RequestParam String staffId, @RequestParam String token) {
        Optional<StaffApplication> appOpt = staffApplicationRepository.findByEventIdAndStaffId(eventId, staffId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("<html><body><h2 style='color:red;'>Application not found</h2></body></html>");
        }
        StaffApplication app = appOpt.get();
        if (!app.getToken().equals(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("<html><body><h2 style='color:red;'>Invalid token</h2></body></html>");
        }
        app.setStatus("APPROVED");
        staffApplicationRepository.save(app);
        String html = "<html>"
            + "<head><title>Staff Application Approved</title></head>"
            + "<body style='background:#f4f8fb; font-family:Arial,sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;'>"
            + "<div style='background:#fff; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.08); padding:40px 32px; text-align:center;'>"
            + "<h2>Staff Application Approved!</h2>"
            + "<p>The staff application has been successfully approved for this event.<br>Thank you for your action.</p>"
            + "</div>"
            + "</body>"
            + "</html>";
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    @GetMapping("/{eventId}/reject-staff")
    public ResponseEntity<?> rejectStaff(@PathVariable String eventId, @RequestParam String staffId, @RequestParam String token) {
        Optional<StaffApplication> appOpt = staffApplicationRepository.findByEventIdAndStaffId(eventId, staffId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Application not found"));
        }
        StaffApplication app = appOpt.get();
        if (!app.getToken().equals(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid token"));
        }
        app.setStatus("REJECTED");
        staffApplicationRepository.save(app);
        return ResponseEntity.ok(Map.of("message", "Staff rejected for event."));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<?> getEventsForStaff(@PathVariable String staffId) {
        List<StaffApplication> apps = staffApplicationRepository.findAll();
        List<StaffApplication> staffApps = new ArrayList<>();
        for (StaffApplication app : apps) {
            if (app.getStaffId().equals(staffId)) {
                staffApps.add(app);
            }
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (StaffApplication app : staffApps) {
            Optional<Event> eventOpt = eventRepository.findById(app.getEventId());
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
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
                eventMap.put("status", app.getStatus());
                result.add(eventMap);
            }
        }
        return ResponseEntity.ok(result);
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
        // Soft-remove events one day after they end by marking them as deleted
        try {
            List<Event> allEvents = eventRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            for (Event event : allEvents) {
                if (Boolean.TRUE.equals(event.getDeleted())) {
                    continue;
                }
                String endStr = event.getEventEnd();
                if (endStr == null) {
                    continue;
                }
                try {
                    LocalDateTime end = parseToLocalDateTime(endStr);
                    if (now.isAfter(end.plusDays(1))) {
                        event.setDeleted(true);
                        eventRepository.save(event);
                        logger.info("Soft-removed event (marked deleted) after 1 day: {}", event.getId());
                    }
                } catch (Exception parseEx) {
                    logger.warn("Failed to parse eventEnd for event: {}", event.getId());
                }
            }
        } catch (Exception ex) {
            logger.error("Failed during scheduled soft-removal of expired events", ex);
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

    // Flexible parser: supports ISO_LOCAL_DATE_TIME and ISO_OFFSET_DATE_TIME (with 'Z' or timezone)
    private LocalDateTime parseToLocalDateTime(String value) {
        if (value == null) throw new DateTimeParseException("null", "", 0);
        try {
            // First try without offset
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            // Fallback to offset format
            OffsetDateTime odt = OffsetDateTime.parse(value);
            return odt.toLocalDateTime();
        }
    }
}
