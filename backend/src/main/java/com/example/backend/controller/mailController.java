package com.example.backend.controller;

import com.example.backend.DTOS.attachementDTO;
import com.example.backend.DTOS.mailContentDTO;
import com.example.backend.Exceptions.UserNotFoundException;
import com.example.backend.Repo.mailRepo;
import com.example.backend.model.mail;
import com.example.backend.service.attachementService;
import com.example.backend.service.mailService;
import com.example.backend.DTOS.FilterCriteriaDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Path;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/mail")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:59007", "http://localhost:65183", "http://localhost:53596"}, allowCredentials = "true")
public class mailController {

    private final attachementService attachementService;

    private final mailService mailService;
    private final mailRepo mailRepo;

    @Autowired
    public mailController(mailService mailService, mailRepo mailRepo,attachementService attachementService) {
        this.mailService = mailService;
        this.mailRepo = mailRepo;
        this.attachementService =attachementService ;
    }

    /**
     * Get logged-in user from session - CRITICAL FIX
     */
    private String getLoggedInUser(HttpServletRequest request) {
        String email = (String) request.getSession().getAttribute("currentUser");
        System.out.println("📧 mailController - Getting logged in user: " + email);
        System.out.println("📧 Session ID: " + request.getSession().getId());
        return email;
    }

    /**
     * Get all emails from inbox for current user
     */
// REPLACE the existing @GetMapping("/inbox") with:
    @PostMapping("/inbox")
    public ResponseEntity<List<mail>> getInboxEmails(
            @RequestParam(required = false, defaultValue = "date-desc") String sort,
            @RequestBody(required = false) FilterCriteriaDTO filters) {
        try {
            List<mail> emails = mailService.getInboxEmails(sort, filters);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            System.err.println("❌ Error getting inbox: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/inbox/priority")
    public ResponseEntity<List<mail>> getInboxEmailsByPriority() {
        try {
            List<mail> emails = mailService.getInboxEmailsByPriority();
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all sent emails for current user
     */
    // REPLACE @GetMapping("/sent") with:
    @PostMapping("/sent")
    public ResponseEntity<List<mail>> getSentEmails(
            @RequestParam(required = false, defaultValue = "date-desc") String sort,
            @RequestBody(required = false) FilterCriteriaDTO filters) {
        try {
            List<mail> emails = mailService.getSentEmails(sort, filters);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * Get all draft emails for current user
     */
    @PostMapping("/draft")
    public ResponseEntity<List<mail>> getDraftEmails(
            @RequestParam(required = false, defaultValue = "date-desc") String sort,
            @RequestBody(required = false) FilterCriteriaDTO filters) {
        try {
            List<mail> emails = mailService.getDraftEmails(sort, filters);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all trash emails for current user
     */
    @PostMapping("/trash")
    public ResponseEntity<List<mail>> getTrashEmails(
            @RequestParam(required = false, defaultValue = "date-desc") String sort,
            @RequestBody(required = false) FilterCriteriaDTO filters) {
        try {
            List<mail> emails = mailService.getTrashEmails(sort, filters);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/starred")
public ResponseEntity<List<mail>> getStarredEmails(
        @RequestParam(required = false, defaultValue = "date-desc") String sort,
        @RequestBody(required = false) FilterCriteriaDTO filters) {
    try {
        List<mail> emails = mailService.getStarredEmails(sort, filters);
        return ResponseEntity.ok(emails);
    } catch (Exception e) {
        System.err.println("❌ Error getting starred: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
/**
 * Toggle star status
 */
@PutMapping("/{id}/star")
public ResponseEntity<Map<String, String>> toggleStar(
        @PathVariable int id,
        @RequestParam String folder,
        HttpServletRequest request) {
    try {
        String loggedInUser = getLoggedInUser(request);
        System.out.println("⭐ Toggling star for email " + id + " in folder " + folder + " for user: " + loggedInUser);
        
        boolean success = mailRepo.toggleStar(id, folder);
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Star toggled successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        System.err.println("❌ Error toggling star: " + e.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Failed to toggle star: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

    /**
     * Get custom folder emails with optional filtering and sorting
     */
    @PostMapping("/folder/{folderId}")
    public ResponseEntity<List<mail>> getCustomFolderEmails(
            @PathVariable String folderId,
            @RequestParam(required = false, defaultValue = "date-desc") String sort,
            @RequestBody(required = false) FilterCriteriaDTO filters,
            HttpServletRequest request) {
        try {
            String loggedInUser = getLoggedInUser(request);
            mailService.setSenderEmail(loggedInUser);

            System.out.println("📁 Getting emails for folder: " + folderId + " with sort: " + sort);

            List<mail> emails = mailService.getCustomFolderEmails(folderId, sort, filters);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            System.err.println("❌ Error getting custom folder emails: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * Get a specific email by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<mail> getEmailById(@PathVariable int id, @RequestParam String folder) {
        try {
            mail email = mailRepo.getEmailById(id, folder);
            if (email != null) {
                return ResponseEntity.ok(email);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send/compose a new email
     */
    @PostMapping("/compose")
public ResponseEntity<Map<String, Object>> composeMail(@RequestBody mailContentDTO mailContent) {
    try {
          Queue<String> recipientsQueue = mailContent.getRecipients();
        if (recipientsQueue != null && !recipientsQueue.isEmpty()) {
            Set<String> uniqueRecipients = new LinkedHashSet<>(recipientsQueue);
            recipientsQueue = new LinkedList<>(uniqueRecipients);
            mailContent.setRecipients(recipientsQueue);
        }
        // Process attachments - decode base64 and save files
        if (mailContent.getAttachements() != null && !mailContent.getAttachements().isEmpty()) {
            attachementService.ProcessAttachement(mailContent.getAttachements()) ;
        }

        
        List<String> successfulRecipients = new ArrayList<>();
        List<String> failedRecipients = new ArrayList<>();

        while (!recipientsQueue.isEmpty()) {
            Queue<String> temp = new LinkedList<>();
            String currentRecipient = recipientsQueue.poll();
            temp.add(currentRecipient);
            mailContent.setRecipients(temp);

            try {
                mailService.composeMail(mailContent);
                successfulRecipients.add(currentRecipient);
            } catch (UserNotFoundException e) {
                failedRecipients.add(currentRecipient);
            }
        }

        // Build response with detailed information
        Map<String, Object> response = new HashMap<>();
        response.put("successful", successfulRecipients);
        response.put("failed", failedRecipients);
        response.put("totalSent", successfulRecipients.size());
        response.put("totalFailed", failedRecipients.size());

        if (!failedRecipients.isEmpty() && successfulRecipients.isEmpty()) {
            // All failed
            response.put("status", "failed");
            response.put("message", "All emails failed to send");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } else if (!failedRecipients.isEmpty()) {
            // Partial success
            response.put("status", "partial");
            response.put("message", "Some emails sent successfully, but some failed");
            return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
        } else {
            // All successful
            response.put("status", "success");
            response.put("message", "All emails sent successfully");
            return ResponseEntity.ok(response);
        }

    } catch (Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", "Error sending email: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}

    @PostMapping("/draft/save")
public ResponseEntity<String> saveDraft(@RequestBody mailContentDTO mailContent,
                                       HttpServletRequest request) {
    try {
        String loggedInUser = getLoggedInUser(request);
        mailService.setSenderEmail(loggedInUser);
        
        
        
        mailService.saveDraft(mailContent);
        return ResponseEntity.ok("Email saved to draft successfully");
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to save email");
    }
}

    /**
     * Delete an email (move to trash)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEmail(@PathVariable int id, 
                                             @RequestParam String folder,
                                             HttpServletRequest request) {
        try {
            boolean success = mailRepo.deleteEmail(id, folder);
            if (success) {
                return ResponseEntity.ok("Email moved to trash");
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("❌ Error deleting email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete email");
        }
    }

    /**
     * Move an email from one folder to another
     */
    @PutMapping("/{id}/move")
    public ResponseEntity<String> moveEmail(
            @PathVariable int id,
            @RequestParam String fromFolder,
            @RequestParam String toFolder,
            HttpServletRequest request) {
        try {
            String loggedInUser = getLoggedInUser(request);
            mailService.setSenderEmail(loggedInUser);
            
            System.out.println("📦 Moving email " + id + " from " + fromFolder + " to " + toFolder + " for user: " + loggedInUser);
            
            boolean success = mailService.moveEmail(id, fromFolder, toFolder);
            if (success) {
                return ResponseEntity.ok("Email moved successfully");
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("❌ Error moving email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to move email: " + e.getMessage());
        }
    }
}