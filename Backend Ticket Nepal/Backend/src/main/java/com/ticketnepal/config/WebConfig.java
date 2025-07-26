package com.ticketnepal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Remove local uploads/images handler
        registry
                .addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:9002",
                        "http://127.0.0.1:9002",
                        "http://localhost:3000",
                        "http://127.0.0.1:3000",
                        "https://ticketnepal-frontend.onrender.com"  // Added Render frontend URL
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders(
                        "Authorization",
                        "Content-Type",
                        "Content-Disposition"  // Important for file downloads
                )
                .allowCredentials(true)
                .maxAge(3600);
    }


    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/{spring:\\w+}")
                .setViewName("forward:/index.html");
    }
}