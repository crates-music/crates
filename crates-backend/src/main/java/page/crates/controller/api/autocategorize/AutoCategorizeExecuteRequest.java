package page.crates.controller.api.autocategorize;

import lombok.Data;

import java.util.List;

/**
 * Request body for executing auto-categorization
 * Accepts optional pre-computed proposals from preview
 */
@Data
public class AutoCategorizeExecuteRequest {
    /**
     * Optional: Pre-computed proposals from preview
     * If provided, these will be used instead of re-analyzing
     */
    private List<CrateProposalDTO> proposals;
}
