package com.example.backend.service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.backend.DTOS.attachementDTO;
@Service
public class attachementService {
    public boolean ProcessAttachement(List<attachementDTO> attachements) {
        for (attachementDTO attachment : attachements) {
            try {
                // Decode base64 from filePath
                byte[] fileBytes = Base64.getDecoder().decode(attachment.getFilePath());

                // Generate unique filename
                String savedFilename = UUID.randomUUID().toString() + "_" + attachment.getFilename();

                // Save to disk
                String uploadDir = "data/uploads/";
                File directory = new File(uploadDir);
                if (!directory.exists()) {
                    directory.mkdirs();
                }

                java.nio.file.Path filePath = Paths.get(uploadDir + savedFilename);
                Files.write(filePath, fileBytes);

                // Update filePath to the actual server path
                attachment.setFilePath(uploadDir + savedFilename);

            } catch (Exception e) {
                System.err.println("Error saving attachment: " + e.getMessage());
                return false;
            }
        }
        return true;
    }
}
