package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.autocategorize.AutoCategorizeExecuteRequest;
import page.crates.controller.api.autocategorize.AutoCategorizePreview;
import page.crates.controller.api.autocategorize.AutoCategorizeResult;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.AutoCategorizeService;

/**
 * REST API for auto-categorization
 * Provides "magic button" functionality to automatically organize user's library into crates
 */
@RestController
@RequestMapping("/v1/auto-categorize")
@Slf4j
public class AutoCategorizeController {

    @Resource
    private AutoCategorizeService autoCategorizeService;

    /**
     * Preview what crates will be created (dry run)
     * GET /v1/auto-categorize/preview
     *
     * @return Preview of proposed crates
     */
    @GetMapping("/preview")
    @SpotifyAuthorization
    public AutoCategorizePreview previewCategorization() {
        log.info("Preview auto-categorization requested");
        return autoCategorizeService.previewCategorization();
    }

    /**
     * Execute auto-categorization
     * Creates 8-12 crates from user's library
     * POST /v1/auto-categorize
     *
     * @param request Optional request with pre-computed proposals from preview
     * @return Result with created crates
     */
    @PostMapping
    @SpotifyAuthorization
    public AutoCategorizeResult autoCategorize(@RequestBody(required = false) AutoCategorizeExecuteRequest request) {
        log.info("Auto-categorization execution requested");
        return autoCategorizeService.autoCategorize(request);
    }
}
