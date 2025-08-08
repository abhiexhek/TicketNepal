package com.ticketnepal.security;

import com.ticketnepal.model.User;
import com.ticketnepal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
    // Try email first, then username (if unique)
    User user = userRepository.findByEmail(identifier)
        .orElseGet(() -> userRepository.findByUsername(identifier)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier)));
    return org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail())
            .password(user.getPassword())
            .roles(user.getRole().toUpperCase())
            .build();
}

}
