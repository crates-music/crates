package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.FeedbackRequest;
import page.crates.entity.Feedback;
import page.crates.repository.FeedbackRepository;
import page.crates.security.SpotifyAuthorization;
import page.crates.security.UserContextHolder;

import java.time.Instant;

@RestController
@RequestMapping("/v1/feedback")
@Slf4j
public class FeedbackController {
    @Resource
    private FeedbackRepository feedbackRepository;

    @PostMapping
    @SpotifyAuthorization
    @ResponseStatus(HttpStatus.CREATED)
    public void submitFeedback(final @RequestBody @Validated FeedbackRequest request) {
        log.info("Feedback received from user {}", UserContextHolder.getUserContext().getId());
        feedbackRepository.save(Feedback.builder()
                .user(UserContextHolder.getUserContext())
                .message(request.getMessage())
                .createdAt(Instant.now())
                .build());
    }
}
