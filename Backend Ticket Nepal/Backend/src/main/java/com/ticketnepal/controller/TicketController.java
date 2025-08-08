package com.ticketnepal.controller;

import com.google.zxing.WriterException;
import com.ticketnepal.model.Event;
import com.ticketnepal.model.Ticket;
import com.ticketnepal.model.User;
import com.ticketnepal.repository.EventRepository;
import com.ticketnepal.repository.TicketRepository;
import com.ticketnepal.repository.UserRepository;
import com.ticketnepal.service.EmailService;
import com.ticketnepal.service.QrCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.MessagingException;
import org.springframework.security.access.prepost.PreAuthorize;

import java.io.IOException;
import java.util.*;
import com.ticketnepal.repository.StaffApplicationRepository;
import com.ticketnepal.model.StaffApplication;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private QrCodeService qrCodeService;

    @Autowired
    private StaffApplicationRepository staffApplicationRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER')")
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketRepository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getUserTickets(@PathVariable String userId) {
        return ResponseEntity.ok(ticketRepository.findByUserId(userId));
    }

    // 🟢 NEW: Get all reserved seats for an event
    @GetMapping("/reserved")
    public ResponseEntity<?> getReservedSeats(@RequestParam String eventId) {
        List<Ticket> tickets = ticketRepository.findByEventId(eventId);
        List<String> reservedSeats = tickets.stream()
            .map(Ticket::getSeat)
            .toList();
        return ResponseEntity.ok(Map.of("reservedSeats", reservedSeats));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> bookTickets(@RequestBody Map<String, Object> req) throws IOException, MessagingException, WriterException {
        String userId = (String) req.get("userId");
        String eventId = (String) req.get("eventId");
        Object seatsObj = req.get("seats");
        List<String> seats = seatsObj instanceof List<?> ? ((List<?>) seatsObj).stream().map(String.class::cast).toList() : null;
        if (seats == null || seats.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "No seats selected."));
        }
        User user = userRepository.findById(userId).orElse(null);
        Event event = eventRepository.findById(eventId).orElse(null);
        if (user == null || event == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid user or event."));
        }
        // Check for double booking
        for (String seat : seats) {
            if (ticketRepository.findByEventIdAndSeat(eventId, seat).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Seat already reserved.", "seat", seat));
            }
        }
        String transactionId = UUID.randomUUID().toString();
        List<Ticket> createdTickets = new ArrayList<>();
        List<Map<String, String>> ticketDetails = new ArrayList<>();
        double totalPrice = 0.0;
        for (String seat : seats) {
            Ticket ticket = new Ticket();
            ticket.setUserId(userId);
            ticket.setUserName(user.getName());
            ticket.setEventId(eventId);
            ticket.setSeat(seat);
            ticket.setTransactionId(transactionId);
            // For group QR, qrCodeHint is the same as transactionId
            ticket.setQrCodeHint(transactionId); // Use transactionId as QR code hint
            ticket.setPrice(event.getPrice());
            ticket = ticketRepository.save(ticket);
            ticket.setQrCodeUrl("/api/tickets/qr/transaction/" + transactionId);
            ticket = ticketRepository.save(ticket);
            createdTickets.add(ticket);
            Map<String, String> details = new HashMap<>();
            details.put("eventName", event.getName());
            details.put("eventDate", event.getEventStart());
            details.put("seat", seat);
            details.put("ticketId", ticket.getId());
            ticketDetails.add(details);
            totalPrice += event.getPrice();
        }
        // Update event income
        double oldIncome = (event.getIncome() == null ? 0.0 : event.getIncome());
        event.setIncome(oldIncome + totalPrice);
        eventRepository.save(event);
        // Generate QR code for all tickets in this transaction
        byte[] qr = qrCodeService.generateQrCode(transactionId, 400, 400);
        // Send email with QR
        String subject = "Your ticketnepal Tickets for " + event.getName();
        String text = "Dear " + user.getName() + ",\n\nHere are your tickets for " + event.getName() + ". " +
                "Show the QR code attached at the event entrance.\n\nSeats: " + String.join(", ", seats) +
                "\n\nThank you for booking with ticketnepal!";
        emailService.sendQrTicketEmail(user.getEmail(), subject, text, qr, "tickets-qr.png");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "tickets", createdTickets,
                "transactionId", transactionId
        ));
    }

    @GetMapping("/{ticketId}")
public ResponseEntity<?> getTicket(@PathVariable String ticketId) {
    Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
    if (ticketOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ticket not found");
    }
    Ticket ticket = ticketOpt.get();
    Optional<Event> eventOpt = eventRepository.findById(ticket.getEventId());
    Map<String, Object> resp = new HashMap<>();
    resp.put("ticket", ticket);
    eventOpt.ifPresent(event -> resp.put("event", event));
    return ResponseEntity.ok(resp);
}


    // 🚨🚨🚨 QR CODE ENDPOINT: PUBLIC, ALWAYS RETURNS PNG OR 404 🚨🚨🚨
    @GetMapping("/qr/{ticketId}")
    public ResponseEntity<byte[]> getTicketQrCode(@PathVariable String ticketId) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Ticket ticket = ticketOpt.get();
        if (ticket.getQrCodeHint() == null || ticket.getQrCodeHint().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] qrImage = qrCodeService.generateQrCode(ticket.getQrCodeHint(), 400, 400);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl(CacheControl.noCache().getHeaderValue());
            return new ResponseEntity<>(qrImage, headers, HttpStatus.OK);
        } catch (Exception e) {
            // Log the error for debugging
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/qr/transaction/{transactionId}")
    public ResponseEntity<byte[]> getTransactionQrCode(@PathVariable String transactionId) {
        List<Ticket> tickets = ticketRepository.findByTransactionId(transactionId);
        if (tickets.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Event event = eventRepository.findById(tickets.get(0).getEventId()).orElse(null);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }
        List<Map<String, String>> ticketDetails = new ArrayList<>();
        for (Ticket ticket : tickets) {
            Map<String, String> details = new HashMap<>();
            details.put("eventName", event.getName());
            details.put("eventDate", event.getEventStart());
            details.put("seat", ticket.getSeat());
            details.put("ticketId", ticket.getId());
            details.put("transactionId", transactionId); // Add transaction ID to details
            ticketDetails.add(details);
        }
        try {
            byte[] qrImage = qrCodeService.generateQrCodeForTickets(ticketDetails, 400, 400);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl(CacheControl.noCache().getHeaderValue());
            return new ResponseEntity<>(qrImage, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateQr(@RequestParam("code") String qrHint) {
        List<Ticket> qrHintTickets = ticketRepository.findByQrCodeHint(qrHint);
        if (!qrHintTickets.isEmpty()) {
            Ticket ticket = qrHintTickets.get(0);
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", ticket.isCheckedIn() ? "Already checked-in" : "Valid ticket");
            resp.put("ticket", ticket);
            return ResponseEntity.ok(resp);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "Invalid or not found"));
        }
    }

    @GetMapping("/validate/transaction")
    public ResponseEntity<?> validateTransactionQr(@RequestParam("transactionId") String transactionId) {
        List<Ticket> tickets = ticketRepository.findByTransactionId(transactionId);
        if (tickets.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "Invalid or not found"));
        }
        Event event = eventRepository.findById(tickets.get(0).getEventId()).orElse(null);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "Event not found"));
        }
        List<Map<String, Object>> ticketInfos = new ArrayList<>();
        for (Ticket ticket : tickets) {
            Map<String, Object> info = new HashMap<>();
            info.put("ticketId", ticket.getId());
            info.put("seat", ticket.getSeat());
            info.put("checkedIn", ticket.isCheckedIn());
            ticketInfos.add(info);
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("event", event);
        resp.put("tickets", ticketInfos);
        resp.put("transactionId", transactionId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/validate/scan")
    public ResponseEntity<?> validateScan(@RequestParam("code") String code) {
        // Try as QR code hint (single or group ticket)
        List<Ticket> qrHintTickets = ticketRepository.findByQrCodeHint(code);
        if (!qrHintTickets.isEmpty()) {
            if (qrHintTickets.size() == 1) {
                Ticket ticket = qrHintTickets.get(0);
                Map<String, Object> resp = new HashMap<>();
                resp.put("type", "single");
                resp.put("status", ticket.isCheckedIn() ? "Already checked-in" : "Valid ticket");
                resp.put("ticket", ticket);
                return ResponseEntity.ok(resp);
            } else {
                // Multiple tickets with same QR code hint (group/transaction)
                Event event = eventRepository.findById(qrHintTickets.get(0).getEventId()).orElse(null);
                if (event == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("status", "Event not found"));
                }
                List<Map<String, Object>> ticketInfos = new ArrayList<>();
                for (Ticket ticket : qrHintTickets) {
                    Map<String, Object> info = new HashMap<>();
                    info.put("ticketId", ticket.getId());
                    info.put("seat", ticket.getSeat());
                    info.put("checkedIn", ticket.isCheckedIn());
                    ticketInfos.add(info);
                }
                Map<String, Object> resp = new HashMap<>();
                resp.put("type", "multiple");
                resp.put("event", event);
                resp.put("tickets", ticketInfos);
                resp.put("transactionId", code);
                return ResponseEntity.ok(resp);
            }
        }
        
        // Try to parse old QR code format (contains full ticket details)
        if (code.contains("Ticket ID:") && code.contains("---")) {
            try {
                String[] ticketSections = code.split("---");
                List<Ticket> foundTickets = new ArrayList<>();
                Event event = null;
                
                for (String section : ticketSections) {
                    if (section.trim().isEmpty()) continue;
                    
                    // Extract ticket ID from the section
                    String[] lines = section.trim().split("\n");
                    String ticketId = null;
                    for (String line : lines) {
                        if (line.startsWith("Ticket ID:")) {
                            ticketId = line.substring("Ticket ID:".length()).trim();
                            break;
                        }
                    }
                    
                    if (ticketId != null) {
                        Optional<Ticket> ticket = ticketRepository.findById(ticketId);
                        if (ticket.isPresent()) {
                            foundTickets.add(ticket.get());
                            if (event == null) {
                                event = eventRepository.findById(ticket.get().getEventId()).orElse(null);
                            }
                        }
                    }
                }
                
                if (!foundTickets.isEmpty() && event != null) {
                    List<Map<String, Object>> ticketInfos = new ArrayList<>();
                    for (Ticket ticket : foundTickets) {
                        Map<String, Object> info = new HashMap<>();
                        info.put("ticketId", ticket.getId());
                        info.put("seat", ticket.getSeat());
                        info.put("checkedIn", ticket.isCheckedIn());
                        ticketInfos.add(info);
                    }
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("type", "multiple");
                    resp.put("event", event);
                    resp.put("tickets", ticketInfos);
                    resp.put("legacy", true); // Indicate this was parsed from old format
                    return ResponseEntity.ok(resp);
                }
            } catch (Exception e) {
                // If parsing fails, continue to return not found
            }
        }
        
        // Not found
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("status", "Invalid or not found"));
    }

    // --- Check-in endpoint: marks ticket as checked in ---
    @PostMapping("/checkin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER') or hasRole('STAFF')")
    public ResponseEntity<?> checkInTicket(@RequestBody Map<String, String> body) {
        String ticketId = body.get("ticketId");
        String qrCodeHint = body.get("qrCodeHint");
        
        if (ticketId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticket ID is required"));
        }
        
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        
        // Get current user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userOpt.get();
        
        // Authorization logic
        boolean isAuthorized = false;
        if ("ADMIN".equals(user.getRole())) {
            isAuthorized = true;
        } else if ("ORGANIZER".equals(user.getRole())) {
            // Organizer can only check in tickets for their own events
            Optional<Event> eventOpt = eventRepository.findById(ticket.getEventId());
            if (eventOpt.isPresent() && eventOpt.get().getOrganizer().equals(user.getId())) {
                isAuthorized = true;
            }
        } else if ("STAFF".equals(user.getRole())) {
            // Staff can only check in tickets for events they're approved for
            Optional<StaffApplication> staffApp = staffApplicationRepository.findByEventIdAndStaffId(ticket.getEventId(), user.getId());
            if (staffApp.isPresent() && "APPROVED".equals(staffApp.get().getStatus())) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized to check in this ticket"));
        }
        
        ticket.setCheckedIn(true);
        ticketRepository.save(ticket);
        return ResponseEntity.ok(Map.of("message", "Ticket checked in successfully", "ticket", ticket));
    }

    // 🟢 NEW: Get validation statistics for staff
    @GetMapping("/staff/{staffId}/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getStaffValidationStats(@PathVariable String staffId) {
        try {
            // Get current user for authorization
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            Optional<User> currentUser = userRepository.findByEmail(userEmail);
            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Only allow staff to see their own stats, or admin to see anyone's
            if (!"ADMIN".equals(currentUser.get().getRole()) && !currentUser.get().getId().equals(staffId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Get all events this staff is approved for
            List<StaffApplication> approvedApplications = staffApplicationRepository.findByStaffIdAndStatus(staffId, "APPROVED");
            List<String> approvedEventIds = approvedApplications.stream()
                .map(StaffApplication::getEventId)
                .collect(Collectors.toList());
            
            if (approvedEventIds.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "totalEvents", 0,
                    "totalTickets", 0,
                    "validatedTickets", 0,
                    "pendingTickets", 0,
                    "todayValidated", 0,
                    "thisWeekValidated", 0,
                    "eventStats", new ArrayList<>()
                ));
            }
            
            // Get all tickets for approved events
            List<Ticket> allTickets = ticketRepository.findByEventIdIn(approvedEventIds);
            
            // Calculate statistics
            long totalTickets = allTickets.size();
            long validatedTickets = allTickets.stream().filter(Ticket::isCheckedIn).count();
            long pendingTickets = totalTickets - validatedTickets;
            
            // Calculate today's validations
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            
            long todayValidated = allTickets.stream()
                .filter(Ticket::isCheckedIn)
                .filter(ticket -> {
                    // Assuming we'll add a checkedInAt timestamp later
                    // For now, we'll use a placeholder
                    return true; // Placeholder
                })
                .count();
            
            // Calculate this week's validations
            Calendar weekStart = Calendar.getInstance();
            weekStart.set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY);
            weekStart.set(Calendar.HOUR_OF_DAY, 0);
            weekStart.set(Calendar.MINUTE, 0);
            weekStart.set(Calendar.SECOND, 0);
            weekStart.set(Calendar.MILLISECOND, 0);
            
            long thisWeekValidated = allTickets.stream()
                .filter(Ticket::isCheckedIn)
                .filter(ticket -> {
                    // Placeholder for now
                    return true;
                })
                .count();
            
            // Get per-event statistics
            List<Map<String, Object>> eventStats = new ArrayList<>();
            for (String eventId : approvedEventIds) {
                Optional<Event> eventOpt = eventRepository.findById(eventId);
                if (eventOpt.isPresent()) {
                    Event event = eventOpt.get();
                    List<Ticket> eventTickets = allTickets.stream()
                        .filter(ticket -> ticket.getEventId().equals(eventId))
                        .collect(Collectors.toList());
                    
                    long eventTotalTickets = eventTickets.size();
                    long eventValidatedTickets = eventTickets.stream().filter(Ticket::isCheckedIn).count();
                    
                    eventStats.add(Map.of(
                        "eventId", eventId,
                        "eventName", event.getName(),
                        "eventDate", event.getEventStart(),
                        "totalTickets", eventTotalTickets,
                        "validatedTickets", eventValidatedTickets,
                        "pendingTickets", eventTotalTickets - eventValidatedTickets,
                        "validationRate", eventTotalTickets > 0 ? (double) eventValidatedTickets / eventTotalTickets * 100 : 0
                    ));
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "totalEvents", approvedEventIds.size(),
                "totalTickets", totalTickets,
                "validatedTickets", validatedTickets,
                "pendingTickets", pendingTickets,
                "todayValidated", todayValidated,
                "thisWeekValidated", thisWeekValidated,
                "eventStats", eventStats
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get validation statistics"));
        }
    }
}
