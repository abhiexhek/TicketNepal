package com.ticketnepal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "staff_applications")
public class StaffApplication {
    @Id
    private String id;
    private String eventId;
    private String staffId;
    private String status; // PENDING, APPROVED, REJECTED
    private String token; // For email approval/rejection
    private Date createdAt = new Date();

    public StaffApplication() {}

    public StaffApplication(String eventId, String staffId, String status, String token) {
        this.eventId = eventId;
        this.staffId = staffId;
        this.status = status;
        this.token = token;
        this.createdAt = new Date();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
} 