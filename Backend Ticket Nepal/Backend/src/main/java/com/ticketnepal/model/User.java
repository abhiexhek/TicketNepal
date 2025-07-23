package com.ticketnepal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {
    @Id
    private String id;

    private String name;
    private String username; // <-- Add this line
    private String email;
    private String password;
    private String avatarUrl;
    private String avatarHint;
    private String role; // Admin, Organizer, Customer, Staff
    private String organizerName; // for organizer accounts
    private boolean verified = true; // email verification status
    private String verificationToken;
    private String resetToken;
    private java.util.Date resetTokenExpiry;

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }         // <-- Getter
    public void setUsername(String username) { this.username = username; } // <-- Setter

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getAvatarHint() { return avatarHint; }
    public void setAvatarHint(String avatarHint) { this.avatarHint = avatarHint; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getOrganizerName() { return organizerName; }
    public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public java.util.Date getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(java.util.Date resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
}
