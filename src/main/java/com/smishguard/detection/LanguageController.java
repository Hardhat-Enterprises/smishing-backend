package com.smishguard.detection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LanguageController {

    @Autowired
    private LanguageDetectionService detectionService;

    @GetMapping("/detect")
    public String welcome() {
        return "This is the SmishGuard Language Detection API! Use POST method with JSON body...";
    }

    @PostMapping("/detect")
    public ResponseEntity<String> detectLanguage(@RequestBody LanguageRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return new ResponseEntity<>("Invalid message: Empty or null!", HttpStatus.BAD_REQUEST);
        }

        String result = detectionService.detectLanguage(request.getMessage());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
