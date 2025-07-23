package com.ticketnepal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "events")
public class Event {
    @Id
    private String id;

    private String name;
    private String category; // Music, Tech, Art, Sports, Food
    private String location;
    private String description;
    private String organizer; // organizer's name or userId
    private String imageUrl;  // URL to image
    private String imageHint;
    private Double price;

    private Double income = 0.0;

    private List<String> seats;

    // Store eventStart and eventEnd as string (e.g., '2025-07-22T13:00')
    private String eventStart;
    private String eventEnd;

    private Boolean deleted = false;

    // Getters and setters...

    public Event() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getImageHint() { return imageHint; }
    public void setImageHint(String imageHint) { this.imageHint = imageHint; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    // 🟢 Getter and Setter for income
    public Double getIncome() { return income; }
    public void setIncome(Double income) { this.income = income; }

    // 🟢 Getter and Setter for seats
    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }

    public String getEventStart() { return eventStart; }
    public void setEventStart(String eventStart) { this.eventStart = eventStart; }
    public String getEventEnd() { return eventEnd; }
    public void setEventEnd(String eventEnd) { this.eventEnd = eventEnd; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
}
