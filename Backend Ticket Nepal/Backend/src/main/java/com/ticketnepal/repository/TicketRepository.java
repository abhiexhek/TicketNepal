package com.ticketnepal.repository;

import com.ticketnepal.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByUserId(String userId);
    List<Ticket> findByEventId(String eventId);
    List<Ticket> findByQrCodeHint(String qrCodeHint); // For QR code validation

    Optional<Ticket> findByEventIdAndSeat(String eventId, String seat);

    // Add method to count tickets by eventId
    long countByEventId(String eventId);

    List<Ticket> findByTransactionId(String transactionId);
    
    // Add method to find tickets by multiple event IDs
    List<Ticket> findByEventIdIn(List<String> eventIds);
}
