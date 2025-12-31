package page.crates.service;

import page.crates.controller.api.autocategorize.AutoCategorizeExecuteRequest;
import page.crates.controller.api.autocategorize.AutoCategorizePreview;
import page.crates.controller.api.autocategorize.AutoCategorizeResult;

/**
 * Service for automatically categorizing user's music library into crates
 */
public interface AutoCategorizeService {

    /**
     * Preview what crates will be created (dry run)
     * Does not create any crates, just shows what would be created
     *
     * @return Preview of proposed crates
     */
    AutoCategorizePreview previewCategorization();

    /**
     * Execute auto-categorization
     * Creates 8-12 crates from user's library using multiple strategies
     *
     * @param request Optional request with pre-computed proposals from preview
     * @return Result with created crates
     */
    AutoCategorizeResult autoCategorize(AutoCategorizeExecuteRequest request);
}
