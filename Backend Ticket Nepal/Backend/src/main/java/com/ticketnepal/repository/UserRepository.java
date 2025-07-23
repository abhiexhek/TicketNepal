package com.ticketnepal.repository;

import com.ticketnepal.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username); // <-- Add this line
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetToken(String resetToken);
}
