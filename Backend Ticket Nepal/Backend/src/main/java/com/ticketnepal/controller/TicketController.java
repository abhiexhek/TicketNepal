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
        List<String> seats = (List<String>) req.get("seats");
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
        Optional<Ticket> ticketOpt = ticketRepository.findByQrCodeHint(qrHint);
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
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

    // --- Check-in endpoint: marks ticket as checked in ---
    @PostMapping("/checkin")
    // Only allow staff, organizer, admin (optional: add @PreAuthorize if using roles)
    public ResponseEntity<?> checkInTicket(@RequestBody Map<String, String> body) {
        String ticketId = body.get("ticketId");
        String qrCodeHint = body.get("qrCodeHint");
        Optional<Ticket> ticketOpt = Optional.empty();
        if (ticketId != null) {
            ticketOpt = ticketRepository.findById(ticketId);
        } else if (qrCodeHint != null) {
            ticketOpt = ticketRepository.findByQrCodeHint(qrCodeHint);
        }
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Ticket not found"));
        }
        Ticket ticket = ticketOpt.get();
        if (ticket.isCheckedIn()) {
            return ResponseEntity.ok(Map.of("message", "Ticket already checked in", "ticket", ticket));
        }
        ticket.setCheckedIn(true);
        ticketRepository.save(ticket);
        return ResponseEntity.ok(Map.of("message", "Ticket checked in successfully", "ticket", ticket));
    }
}
