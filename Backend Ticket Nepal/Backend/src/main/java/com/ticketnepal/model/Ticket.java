package com.ticketnepal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Document(collection = "tickets")
@CompoundIndexes({
    @CompoundIndex(name = "event_seat_unique", def = "{'eventId': 1, 'seat': 1}", unique = true)
})
public class Ticket {
    @Id
    private String id;

    private String eventId;
    private String userId;
    private String userName;
    private String seat;
    private String qrCodeUrl;
    private String qrCodeHint;
    private boolean checkedIn = false;
    private Double price;
    private String transactionId; // New field to group tickets by purchase

    // Constructors, getters, setters...

    public Ticket() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getSeat() { return seat; }
    public void setSeat(String seat) { this.seat = seat; }

    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }

    public String getQrCodeHint() { return qrCodeHint; }
    public void setQrCodeHint(String qrCodeHint) { this.qrCodeHint = qrCodeHint; }

    public boolean isCheckedIn() { return checkedIn; }
    public void setCheckedIn(boolean checkedIn) { this.checkedIn = checkedIn; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
}
