package page.crates.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.UnifiedSearchResponse;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.SearchService;

@RestController
@RequestMapping("/v1/search")
@RequiredArgsConstructor
public class SearchController {
    
    private final SearchService searchService;

    @GetMapping
    @SpotifyAuthorization
    public UnifiedSearchResponse search(
            @RequestParam("q") String query,
            Pageable pageable) {
        return searchService.search(query, pageable);
    }
}