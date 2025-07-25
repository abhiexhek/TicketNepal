package com.ticketnepal.repository;

import com.ticketnepal.model.StaffApplication;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffApplicationRepository extends MongoRepository<StaffApplication, String> {
    Optional<StaffApplication> findByEventIdAndStaffId(String eventId, String staffId);
    Optional<StaffApplication> findByToken(String token);
} 