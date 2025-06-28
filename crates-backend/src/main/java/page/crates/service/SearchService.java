package page.crates.service;

import org.springframework.data.domain.Pageable;
import page.crates.controller.api.UnifiedSearchResponse;

public interface SearchService {
    UnifiedSearchResponse search(String query, Pageable pageable);
}