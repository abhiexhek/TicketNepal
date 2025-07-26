package com.ticketnepal.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ImageService {
    @Autowired
    private Cloudinary cloudinary;

    @SuppressWarnings("unchecked")
    public String uploadImage(MultipartFile file) throws IOException {
        Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }

    public void deleteImageByUrl(String imageUrl) throws IOException {
        if (imageUrl == null || imageUrl.isEmpty()) return;
        String[] parts = imageUrl.split("/");
        String publicIdWithExtension = parts[parts.length - 1];
        String publicId = publicIdWithExtension.contains(".") ? publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.')) : publicIdWithExtension;
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
} 