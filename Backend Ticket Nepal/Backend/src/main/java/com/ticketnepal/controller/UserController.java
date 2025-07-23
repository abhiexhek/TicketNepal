package com.ticketnepal.controller;

import com.ticketnepal.model.User;
import com.ticketnepal.repository.UserRepository;
import com.ticketnepal.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;


    public static class UserProfileDTO {
        public String id;
        public String name;
        public String username;
        public String email;
        public String avatarUrl;
        public String role;
        public String organizerName;
        public boolean verified;

        public UserProfileDTO(User user) {
            this.id = user.getId();
            this.name = user.getName();
            this.username = user.getUsername();
            this.email = user.getEmail();
            this.avatarUrl = user.getAvatarUrl();
            this.role = user.getRole();
            this.organizerName = user.getOrganizerName();
            this.verified = user.isVerified();
        }
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // --- SAFER: Return only safe fields to the frontend ---
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        // Extract token from header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        String userEmail;
        try {
            userEmail = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }
        User user = userOpt.get();
        // Return only safe fields
        return ResponseEntity.ok(new UserProfileDTO(user));
    }
}
