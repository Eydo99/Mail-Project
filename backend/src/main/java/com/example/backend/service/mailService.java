package com.example.backend.service;

import java.util.PriorityQueue;
import java.util.Queue;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.backend.Repo.mailRepo;
import com.example.backend.Util.EmailPriorityComparator;
import com.example.backend.Util.JsonFileManager;
import com.example.backend.model.mail;
import com.example.backend.DTOS.FilterCriteriaDTO;
import com.example.backend.service.EmailFilterService;
import com.example.backend.StrategyPattern.EmailSortContext;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.DTOS.mailContentDTO;

import com.example.backend.Exceptions.UserNotFoundException;
import com.example.backend.Factory.mailFactory;
import com.google.gson.reflect.TypeToken;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@Getter
@Setter
public class mailService {

    // REMOVED: private String senderEmail = (String)
    // session.getAttribute("currentUser");

    private String senderEmail; // Keep this for backward compatibility with setSenderEmail()
    private final String BasePath = "data/users/";
    private final JsonFileManager jsonFileManager;
    private final attachementService attachementService;
    private static final Type MAIL_LIST_TYPE = new TypeToken<List<mail>>() {
    }.getType();
    // ADD these fields after the existing fields
    @Autowired
    private EmailSortContext emailSortContext;
    

    @Autowired
    private EmailFilterService emailFilterService;

    @Autowired
    private mailRepo mailRepo;

    public mailService(JsonFileManager jsonFileManager,attachementService attachementService) {
        this.jsonFileManager = jsonFileManager;
        this.attachementService =attachementService ;
    }

    /**
     * Get the currently logged-in user's email from session
     */
    private String getLoggedInUser() {
        if (senderEmail != null) {
            return senderEmail;
        }

        // Get current request and session
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String email = (String) request.getSession().getAttribute("currentUser");
            System.out.println("mailService - Getting logged in user: " + email);
            return email;
        }

        System.err.println("mailService - WARNING: No request context available!");
        return null;
    }

    /**
     * Get all emails from inbox
     */

    public List<mail> getInboxEmailsByPriority() {
        String inboxPath = BasePath + getLoggedInUser() + "/inbox.json";
        List<mail> emails = jsonFileManager.readListFromFile(inboxPath, MAIL_LIST_TYPE);

        PriorityQueue<mail> priorityQueue = new PriorityQueue<>(new EmailPriorityComparator());
        priorityQueue.addAll(emails);

        // Extract emails from priority queue in sorted order
        List<mail> sortedEmails = new ArrayList<>();
        while (!priorityQueue.isEmpty()) {
            sortedEmails.add(priorityQueue.poll());
        }

        return sortedEmails;
    }
    

    /**
     * Compose and send a new email
     */
    public void composeMail(mailContentDTO mailContent) throws UserNotFoundException {
        String currentUser = getLoggedInUser();
        String sentPath = BasePath + currentUser + "/sent.json";
        mail mail = mailFactory.createNewMail(mailContent);
        mail.setFrom(currentUser);

        // Add to sent folder
        Queue<String> recipientsQueue = mailContent.getRecipients();
        String receiver = recipientsQueue.peek();
        
        if (!(jsonFileManager.userExists(receiver))|| receiver.equals(currentUser)) {
            System.out.println("this email{ " + receiver + " } isn't found in our system");
            throw new UserNotFoundException("Email address " + receiver + " is not registered in our system");
        }

        List<mail> sentMails = jsonFileManager.readListFromFile(sentPath, MAIL_LIST_TYPE);
        sentMails.add(mail);
        jsonFileManager.writeListToFile(sentPath, sentMails);

        // Send to all receivers
        mail.setTo(null);
        String path = BasePath + receiver + "/inbox.json";
        List<mail> inboxMails = jsonFileManager.readListFromFile(path, MAIL_LIST_TYPE);
        inboxMails.add(mail);
        jsonFileManager.writeListToFile(path, inboxMails);
    }

    public void saveDraft(mailContentDTO mailContent) {
            if (mailContent.getAttachements() != null && !mailContent.getAttachements().isEmpty()) {
        boolean success = attachementService.ProcessAttachement(mailContent.getAttachements());
        if (!success) {
            System.err.println("Failed to process attachments for draft");
            throw new RuntimeException("Failed to process attachments for draft");
        }
        System.out.println("Successfully processed " + mailContent.getAttachements().size() + " attachments for draft");
    }
        String draftPath = BasePath + getLoggedInUser() + "/draft.json";
        List<mail> draftMails = jsonFileManager.readListFromFile(draftPath, MAIL_LIST_TYPE);
        mail mail = mailFactory.createNewMail(mailContent);
        draftMails.add(mail);
        mail.setFrom(getLoggedInUser()) ;
        jsonFileManager.writeListToFile(draftPath, draftMails);
    }

    private final Object trashLock = new Object();
    private final Object folderLock = new Object();

    /**
     * Move an email from one folder to another
     */
    public boolean moveEmail(int id, String fromFolder, String toFolder) {
        System.out.println("=== MOVE EMAIL START ===");
        System.out.println("Email ID: " + id);
        System.out.println("From Folder: " + fromFolder);
        System.out.println("To Folder: " + toFolder);

        try {
            String currentUser = getLoggedInUser();
            String fromFolderPath = BasePath + currentUser + "/" + fromFolder + ".json";
            String toFolderPath = BasePath + currentUser + "/" + toFolder + ".json";

            // Synchronize to prevent concurrent modification
            synchronized (folderLock) {
                // Read from source folder
                List<mail> fromEmails = jsonFileManager.readListFromFile(fromFolderPath, MAIL_LIST_TYPE);

                if (fromEmails == null) {
                    fromEmails = new ArrayList<>();
                }

                // Find the email to move
                mail emailToMove = null;
                for (mail email : fromEmails) {
                    if (email.getId() == id) {
                        emailToMove = email;
                        break;
                    }
                }

                if (emailToMove == null) {
                    System.out.println("Email not found with ID: " + id);
                    return false;
                }

                // Remove from source folder
                fromEmails.remove(emailToMove);
                boolean removeSuccess = jsonFileManager.writeListToFile(fromFolderPath, fromEmails);

                if (!removeSuccess) {
                    System.err.println("Failed to remove from folder: " + fromFolderPath);
                    return false;
                }

                // Add to destination folder
                List<mail> toEmails = jsonFileManager.readListFromFile(toFolderPath, MAIL_LIST_TYPE);

                if (toEmails == null) {
                    toEmails = new ArrayList<>();
                }

                toEmails.add(emailToMove);
                boolean addSuccess = jsonFileManager.writeListToFile(toFolderPath, toEmails);

                if (!addSuccess) {
                    System.err.println("Failed to add to folder: " + toFolderPath);
                    return false;
                }

                System.out.println("=== MOVE EMAIL SUCCESS ===");
                return true;
            }

        } catch (Exception e) {
            System.err.println("=== MOVE EMAIL ERROR ===");
            System.err.println("Error moving email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to move email", e);
        }
    }

    /**
     * Get emails from custom folder
     */
    public List<mail> getCustomFolderEmails(String folderId) {
        String folderPath = BasePath + getLoggedInUser() + "/folder_" + folderId + ".json";
        return jsonFileManager.readListFromFile(folderPath, MAIL_LIST_TYPE);
    }
    /**
     * Get inbox emails with optional filtering and sorting
 */
    public List<mail> getInboxEmails(String sort, FilterCriteriaDTO filters) {
        List<mail> emails = mailRepo.getInboxEmails();

        // Apply filters if provided
        if (filters != null && emailFilterService.hasActiveFilters(filters)) {
            emails = emailFilterService.applyFilters(emails, filters);
        }

        // Apply sorting
        if (sort != null && !sort.isEmpty()) {
            emails = emailSortContext.sortEmails(emails, sort);
        }

        return emails;
    }

    /**
     * Get sent emails with optional filtering and sorting
     */
    public List<mail> getSentEmails(String sort, FilterCriteriaDTO filters) {
        List<mail> emails = mailRepo.getSentEmails();

        if (filters != null && emailFilterService.hasActiveFilters(filters)) {
            emails = emailFilterService.applyFilters(emails, filters);
        }

        if (sort != null && !sort.isEmpty()) {
            emails = emailSortContext.sortEmails(emails, sort);
        }

        return emails;
    }

    /**
     * Get draft emails with optional filtering and sorting
     */
    public List<mail> getDraftEmails(String sort, FilterCriteriaDTO filters) {
        List<mail> emails = mailRepo.getDraftEmails();

        if (filters != null && emailFilterService.hasActiveFilters(filters)) {
            emails = emailFilterService.applyFilters(emails, filters);
        }

        if (sort != null && !sort.isEmpty()) {
            emails = emailSortContext.sortEmails(emails, sort);
        }

        return emails;
    }

    /**
     * Get trash emails with optional filtering and sorting
     */
    public List<mail> getTrashEmails(String sort, FilterCriteriaDTO filters) {
        List<mail> emails = mailRepo.getTrashEmails();

        if (filters != null && emailFilterService.hasActiveFilters(filters)) {
            emails = emailFilterService.applyFilters(emails, filters);
        }

        if (sort != null && !sort.isEmpty()) {
            emails = emailSortContext.sortEmails(emails, sort);
        }

        return emails;
    }

/**
 * Get starred emails with optional filtering and sorting
 */
public List<mail> getStarredEmails(String sort, FilterCriteriaDTO filters) {
    List<mail> emails = mailRepo.getStarredEmails();
    
    // Apply filters if provided
    if (filters != null && emailFilterService.hasActiveFilters(filters)) {
        emails = emailFilterService.applyFilters(emails, filters);
    }

    // Apply sorting if provided
    if (sort != null && !sort.isEmpty()) {
        emails = emailSortContext.sortEmails(emails, sort);
    }

    return emails;
}

    /**
     * Get emails from custom folder with optional filtering and sorting
     */
    public List<mail> getCustomFolderEmails(String folderId, String sort, FilterCriteriaDTO filters) {
        String folderPath = BasePath + getLoggedInUser() + "/folder_" + folderId + ".json";
        List<mail> emails = jsonFileManager.readListFromFile(folderPath, MAIL_LIST_TYPE);

        // Apply filters if provided
        if (filters != null && emailFilterService.hasActiveFilters(filters)) {
            emails = emailFilterService.applyFilters(emails, filters);
        }

        // Apply sorting if provided
        if (sort != null && !sort.isEmpty()) {
            emails = emailSortContext.sortEmails(emails, sort);
        }

        return emails;
    }

}