package com.ticketnepal.service;

import com.ticketnepal.model.User;
import com.ticketnepal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(User user, String role) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(role);
        user.setVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());
        return userRepository.save(user);
    }

    public Optional<User> findByVerificationToken(String token) {
        return userRepository.findByVerificationToken(token);
    }

    public void verifyUser(User user) {
        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Save user and encode password if changed
    public User saveUser(User user) {
        // Only encode if not already encoded (simple check)
        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }
}
