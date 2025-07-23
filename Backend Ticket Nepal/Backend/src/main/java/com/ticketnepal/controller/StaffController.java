package com.ticketnepal.controller;

import com.ticketnepal.model.User;
import com.ticketnepal.repository.UserRepository;
import com.ticketnepal.service.EmailService;
import com.ticketnepal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;

    // Accept only DTO, not entity
    public static class RegisterDto {
        private String name;
        private String username;
        private String email;
        private String password;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody RegisterDto staffDto) {
        if (userRepository.findByEmail(staffDto.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Staff email already registered."));
        }

        User staff = new User();
        staff.setName(staffDto.getName());
        staff.setUsername(staffDto.getUsername());
        staff.setEmail(staffDto.getEmail());
        staff.setPassword(staffDto.getPassword()); // Should be encoded in UserService

        User newStaff = userService.registerUser(staff, "STAFF");
        String link = "http://localhost:8080/api/auth/verify?token=" + newStaff.getVerificationToken();
        emailService.sendSimpleMessage(newStaff.getEmail(),
                "You're invited as staff to ticketnepal",
                "Click to finish staff registration: " + link);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Staff invitation sent successfully."));
    }
}
