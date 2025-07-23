package com.ticketnepal.service;

import com.ticketnepal.model.Ticket;
import com.ticketnepal.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TicketService {
    @Autowired
    private TicketRepository ticketRepository;

    public Optional<Ticket> findByQrCodeHint(String qrHint) {
        return ticketRepository.findByQrCodeHint(qrHint);
    }

    public Ticket save(Ticket ticket) {
        return ticketRepository.save(ticket);
    }
}
