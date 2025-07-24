package com.ticketnepal.controller;

import com.ticketnepal.model.User;
import com.ticketnepal.repository.UserRepository;
import com.ticketnepal.security.JwtUtil;
import com.ticketnepal.service.EmailService;
import com.ticketnepal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

// Add this for global validation error handling
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${frontend.base.url}")
    private String frontendBaseUrl;

    // --- Registration for customer ---
    @PostMapping("/signup")
public ResponseEntity<?> register(@RequestBody RegisterDto registerDto) {
    // Check required fields
    if (registerDto.getEmail() == null || registerDto.getPassword() == null || registerDto.getName() == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
    }
    if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email already registered."));
    }
    User user = new User();
    user.setEmail(registerDto.getEmail());
    user.setPassword(registerDto.getPassword());
    user.setName(registerDto.getName());
    user.setUsername(registerDto.getUsername());
    // Use role from DTO if present, otherwise default to "CUSTOMER"
    String userRole = registerDto.getRole() != null ? registerDto.getRole() : "CUSTOMER";
    User newUser = userService.registerUser(user, userRole);

    String link = frontendBaseUrl + "/auth/verify?token=" + newUser.getVerificationToken();
    emailService.sendSimpleMessage(newUser.getEmail(),
            "Verify your ticketnepal account",
            "Click to verify your account: " + link);

    return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Registration successful! Please check your email to verify your account."));
}


    // --- Registration for organizer ---
    @PostMapping("/signup/organizer")
    public ResponseEntity<?> registerOrganizer(@RequestBody RegisterDto registerDto) {
        return registerWithRole(registerDto, "ORGANIZER");
    }

    private ResponseEntity<?> registerWithRole(RegisterDto registerDto, String role) {
        String email = registerDto.getEmail(); // FIXED: use getEmail()
        String password = registerDto.getPassword();

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email already registered."));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(password); // Password will be encoded inside userService.registerUser
        user.setName(registerDto.getName());
        user.setUsername(registerDto.getUsername());
        User newUser = userService.registerUser(user, role);

        String link = frontendBaseUrl + "/auth/verify?token=" + newUser.getVerificationToken();
        emailService.sendSimpleMessage(newUser.getEmail(),
                "Verify your ticketnepal account",
                "Click to verify your account: " + link);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful! Please check your email to verify your account."));
    }


    // --- Account verification ---
    @GetMapping("/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam("token") String token) {
        return userService.findByVerificationToken(token)
                .map(user -> {
                    userService.verifyUser(user);
                    return ResponseEntity.ok("Account verified. You can now login!");
                }).orElse(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired verification link."));
    }

    // --- Login ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        String identifier = loginDto.getIdentifier().trim();
        String password = loginDto.getPassword();

        Optional<User> userOpt = userRepository.findByEmail(identifier);

        // Try username if not found by email
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(identifier);
        }

        if (userOpt.isEmpty() || !userOpt.get().isVerified() ||
                !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials or email not verified."));
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> userMap = Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "username", user.getUsername()
        );

        Map<String, Object> response = Map.of(
                "user", userMap,
                "token", token
        );
        return ResponseEntity.ok(response);
    }

    // --- Forgot Password ---
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if user exists
            return ResponseEntity.ok(Map.of("message", "If your email is registered, a reset link has been sent."));
        }
        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 1000 * 60 * 30)); // 30 min expiry
        userRepository.save(user);

        String link = frontendBaseUrl + "/auth/reset-password?token=" + token;
        emailService.sendSimpleMessage(user.getEmail(), "Reset your TicketNepal password", "Click to reset: " + link);

        return ResponseEntity.ok(Map.of("message", "If your email is registered, a reset link has been sent."));
    }

    // --- Reset Password ---
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("password");
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid or expired token."));
        }
        User user = userOpt.get();
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().before(new Date())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Token expired."));
        }
        user.setPassword(newPassword); // Will be encoded in service
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userService.saveUser(user); // Make sure this encodes password
        return ResponseEntity.ok(Map.of("message", "Password reset successful!"));
    }



    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors() {
        return ResponseEntity.badRequest().body(Map.of("error", "Validation failed"));
    }

    // --- DTOs ---
public static class RegisterDto {
    private String name;
    private String username;
    private String email;
    private String password;
    private String role; // "CUSTOMER", "ORGANIZER", etc.

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}

public static class LoginDto {
    private String identifier; // email or username
    private String password;
    // Getters and setters
    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

}
